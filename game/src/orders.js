// The order board: tickets come in from the boats, lose patience, and are served or lost.
import { SHIFT, RUSH } from './config.js';
import { recipesForNight, dishMatchesRecipe, missingParts } from './recipes.js';
import { secondsToNextOrder, patienceForOrder } from './rush.js';

const BOATS = ['Petrel', 'Marram', 'Kittiwake', 'Old Dory', 'Saltwife', 'Curlew', 'Brine Lass', 'Tern'];

export function openOrderBoard() {
  return { tickets: [], nextIn: RUSH.firstGap, issued: 0, focusId: null };
}

/** Pin a new ticket, choosing a dish the board does not already hold twice. */
export function spawnOrder(board, elapsed, night, random) {
  const menu = recipesForNight(night);
  let recipe = random.pick(menu);
  for (let tries = 0; tries < 4; tries += 1) {
    const same = board.tickets.filter((ticket) => ticket.recipe.id === recipe.id).length;
    if (same === 0) break;
    recipe = random.pick(menu);
  }
  const patience = patienceForOrder(elapsed, night, recipe);
  board.issued += 1;
  const ticket = {
    id: board.issued,
    recipe,
    boat: BOATS[(board.issued - 1) % BOATS.length],
    patience,
    patienceMax: patience,
    age: 0,
  };
  board.tickets.push(ticket);
  if (board.focusId === null) board.focusId = ticket.id;
  return ticket;
}

/** Run the board for one step; returns the tickets that just ran out of patience. */
export function tickOrderBoard(board, dt, elapsed, night, random) {
  const lost = [];
  for (const ticket of board.tickets) {
    ticket.age += dt;
    if (ticket.serving) continue;
    ticket.patience -= dt;
    if (ticket.patience <= 0) lost.push(ticket);
  }
  for (const ticket of lost) removeOrder(board, ticket);
  board.nextIn -= dt;
  let arrived = null;
  if (board.nextIn <= 0 && board.tickets.length < SHIFT.maxTickets) {
    arrived = spawnOrder(board, elapsed, night, random);
    board.nextIn = secondsToNextOrder(elapsed, night, random);
  }
  return { lost, arrived };
}

export function removeOrder(board, ticket) {
  const index = board.tickets.indexOf(ticket);
  if (index !== -1) board.tickets.splice(index, 1);
  if (board.focusId === ticket.id) board.focusId = mostUrgentOrder(board)?.id ?? null;
}

export function mostUrgentOrder(board) {
  let urgent = null;
  for (const ticket of board.tickets) {
    if (ticket.serving) continue;
    if (urgent === null || ticket.patience < urgent.patience) urgent = ticket;
  }
  return urgent;
}

/** The ticket the route planner works on: the one the player picked, else the most urgent. */
export function focusedOrder(board) {
  return board.tickets.find((ticket) => ticket.id === board.focusId && !ticket.serving) || mostUrgentOrder(board);
}

export function focusNextOrder(board) {
  if (board.tickets.length === 0) return;
  const index = board.tickets.findIndex((ticket) => ticket.id === board.focusId);
  board.focusId = board.tickets[(index + 1) % board.tickets.length].id;
}

/** The ticket a part-built plate is closest to answering, with the parts it still lacks; null when none fits. */
export function bestOrderForPlate(board, plateParts) {
  let best = null;
  for (const ticket of board.tickets) {
    if (ticket.serving) continue;
    const missing = missingParts(plateParts, ticket.recipe);
    if (missing === null) continue;
    if (best === null || missing.length < best.missing.length) best = { ticket, missing };
  }
  return best;
}

/** The waiting ticket a finished dish answers, the least patient first; null when none asks for it. */
export function findOrderForDish(board, plateParts) {
  let match = null;
  for (const ticket of board.tickets) {
    if (ticket.serving || !dishMatchesRecipe(plateParts, ticket.recipe)) continue;
    if (match === null || ticket.patience < match.patience) match = ticket;
  }
  return match;
}
