// The route planner: for the ticket in focus it works out the stops still to make and the order
// to make them in, so the dashed line on the floor always shows the next leg. Its rule is the one
// a line cook uses: get whatever needs heat cooking first, chop while it cooks, collect it last.
import { RAW, BURNT, missingParts, foodCanBecomePart, foodMatchesPart, INGREDIENTS } from './recipes.js';
import { BOARD, GRIDDLE, POT, PLATE, PASS, BIN, CRATE, stationsOfType, walkBetween } from './kitchen.js';
import { focusedOrder, findOrderForDish, bestOrderForPlate } from './orders.js';

const step = (station, verb, text) => ({ station, verb, text });

/** Stations one plan has already promised to a part, so two parts are not sent to one burner. */
let claimed = new Set();

function freeStation(stations, type, from) {
  const all = stationsOfType(stations, type);
  const free = all.filter((item) => !item.food && !claimed.has(item));
  const pool = free.length ? free : all;
  const choice = pool.slice().sort((a, b) => walkBetween(from, a) - walkBetween(from, b))[0];
  choice.mustWait = free.length === 0;
  claimed.add(choice);
  return choice;
}

/** A burner holding burnt food has to be cleared before anything else can cook there. */
function stopsToClearBurnt(stations, bin) {
  const burnt = stations.find((item) => item.food && item.food.cooked === BURNT);
  return burnt ? [step(burnt, 'clear', 'Clear the burnt food'), step(bin, 'scrap', 'Scrap it')] : [];
}

/** The assembly plate to build the focused dish on: the one furthest along, else an empty one. */
export function choosePlateFor(stations, recipe) {
  let best = null;
  let bestMissing = Infinity;
  for (const spot of stationsOfType(stations, PLATE)) {
    const missing = missingParts(spot.plate.parts, recipe);
    if (missing === null) continue;
    const rank = missing.length - (spot.plate.parts.length > 0 ? 0.5 : 0);
    if (rank < bestMissing) {
      best = spot;
      bestMissing = rank;
    }
  }
  return best;
}

/** The stops one part still needs, starting from where its food is now. */
function stopsForPart(stations, recipePart, food, at, plateSpot) {
  const name = INGREDIENTS[recipePart.ingredient].name.toLowerCase();
  const stops = [];
  let from = at;
  let chopped = food ? food.chopped : false;
  let cooked = food ? food.cooked : RAW;
  if (recipePart.chopped && !chopped) {
    const board = at.type === BOARD ? at : freeStation(stations, BOARD, from);
    stops.push(step(board, 'chop', 'Chop the ' + name));
    from = board;
    chopped = true;
  }
  if (recipePart.cooked !== cooked) {
    const heatType = recipePart.cooked === 'seared' ? GRIDDLE : POT;
    const heat = at.type === heatType ? at : freeStation(stations, heatType, from);
    const verb = heatType === GRIDDLE ? 'sear' : 'simmer';
    if (at.type !== heatType) {
      stops.push(step(heat, verb, (verb === 'sear' ? 'Sear the ' : 'Simmer the ') + name));
      // With every burner of this kind taken, this part waits its turn: it is started last.
      stops.queued = heat.mustWait;
    }
    stops.push(step(heat, 'collect', 'Lift the ' + name));
  } else if (food && at.food === food && (at.type === GRIDDLE || at.type === POT)) {
    stops.push(step(at, 'collect', 'Lift the ' + name));
  }
  stops.push(step(plateSpot, 'plate', 'Plate the ' + name));
  return stops;
}

/** Split a part's stops where the cook's hands come free (food left on the heat). */
function splitAtHeat(stops) {
  const index = stops.findIndex((item) => item.verb === 'collect');
  if (index <= 0) return { start: [], finish: stops };
  return { start: stops.slice(0, index), finish: stops.slice(index) };
}

/**
 * Plan the route for the focused ticket. Returns { ticket, plateSpot, steps }, steps[0] being the
 * stop to make now; null when no ticket is waiting.
 */
export function planRoute(shift) {
  const ticket = focusedOrder(shift.board);
  if (!ticket) return null;
  const { stations, cook } = shift;
  const recipe = ticket.recipe;
  const pass = stationsOfType(stations, PASS)[0];
  const bin = stationsOfType(stations, BIN)[0];
  const carried = cook.carry;
  claimed = new Set();

  if (carried && carried.kind === 'plate') {
    const missing = missingParts(carried.parts, recipe);
    if (missing && missing.length === 0) return { ticket, plateSpot: null, steps: [step(pass, 'serve', 'Serve at THE PASS')] };
    if (findOrderForDish(shift.board, carried.parts)) return { ticket, plateSpot: null, steps: [step(pass, 'serve', 'Serve at THE PASS')] };
    const empty = stationsOfType(stations, PLATE).find((spot) => spot.plate.parts.length === 0);
    if (missing && empty) return { ticket, plateSpot: empty, steps: [step(empty, 'set down', 'Set the dish down')] };
    return { ticket, plateSpot: null, steps: [step(bin, 'scrap', 'No ticket wants this: scrap it')] };
  }

  const plateSpot = choosePlateFor(stations, recipe);
  if (!plateSpot) {
    // Both assembly plates hold dishes this ticket cannot use: clear the one no ticket is close to.
    const spots = stationsOfType(stations, PLATE).slice();
    spots.sort((a, b) => (bestOrderForPlate(shift.board, a.plate.parts)?.missing.length ?? 9) - (bestOrderForPlate(shift.board, b.plate.parts)?.missing.length ?? 9));
    const worst = spots[spots.length - 1];
    if (carried) return { ticket, plateSpot: null, steps: [step(bin, 'scrap', 'Free your hands')] };
    return { ticket, plateSpot: null, steps: [step(worst, 'pick up', 'Lift the stale dish'), step(bin, 'scrap', 'Scrap it')] };
  }
  const missing = missingParts(plateSpot.plate.parts, recipe);
  if (missing.length === 0) {
    if (carried) return { ticket, plateSpot, steps: [step(bin, 'scrap', 'Free your hands')] };
    return { ticket, plateSpot, steps: [step(plateSpot, 'pick up', 'Lift the finished dish'), step(pass, 'serve', 'Serve at THE PASS')] };
  }

  // Match each missing part with food already in play, the carried food first.
  const inPlay = [];
  if (carried && carried.kind === 'food') inPlay.push({ food: carried, at: null });
  for (const item of stations) {
    if (item.food && (item.type === BOARD || item.type === GRIDDLE || item.type === POT)) inPlay.push({ food: item.food, at: item });
  }
  const now = [];
  const starts = [];
  const cold = [];
  const finishes = [];
  const queued = [];
  let carriedUsed = false;
  for (const recipePart of missing) {
    const index = inPlay.findIndex((entry) => foodCanBecomePart(entry.food, recipePart));
    if (index === -1) {
      const crate = stations.find((item) => item.type === CRATE && item.ingredient === recipePart.ingredient);
      const afterCrate = stopsForPart(stations, recipePart, null, crate, plateSpot);
      const stops = [step(crate, 'take', 'Take ' + INGREDIENTS[recipePart.ingredient].name.toLowerCase()), ...afterCrate];
      const { start, finish } = splitAtHeat(stops);
      if (afterCrate.queued) queued.push(stops);
      else if (start.length) {
        starts.push(start);
        finishes.push(finish);
      } else cold.push(finish);
      continue;
    }
    const entry = inPlay.splice(index, 1)[0];
    if (entry.at === null) {
      carriedUsed = true;
      const done = foodMatchesPart(entry.food, recipePart);
      const stops = done ? [step(plateSpot, 'plate', 'Plate it')] : stopsForPart(stations, recipePart, entry.food, plateSpot, plateSpot);
      const { start, finish } = splitAtHeat(stops);
      if (start.length) {
        now.push(start);
        finishes.push(finish);
      } else now.push(finish);
      continue;
    }
    const stops = stopsForPart(stations, recipePart, entry.food, entry.at, plateSpot);
    if (entry.at.type === BOARD) {
      if (entry.food.chopped) stops.unshift(step(entry.at, 'take', 'Lift it off the board'));
      const { start, finish } = splitAtHeat(stops);
      if (start.length) {
        starts.push(start);
        finishes.push(finish);
      } else cold.push(finish);
    } else finishes.push(stops);
  }
  if (carried && !carriedUsed) now.push([step(bin, 'scrap', 'Not needed: scrap it')]);
  // Food that is already cooked comes off the heat first, before it burns.
  const hot = finishes.filter((stops) => stops[0].station.food && stops[0].station.food.cooked !== RAW);
  const waiting = finishes.filter((stops) => !hot.includes(stops));
  const clear = carried ? [] : stopsToClearBurnt(stations, bin);
  const steps = [...now, ...hot, clear, ...starts, ...cold, ...waiting, ...queued].flat();
  return { ticket, plateSpot, steps };
}
