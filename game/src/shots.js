// The screenshot scenes behind ?shot=service|rush|recipes|results. Each one starts a real shift
// from a seed and lets the first mate (pilot.js) cook it through the game's own rules until the
// moment described here, so every frame is a state the game reaches in play and a seed repeats it.
import { STEP } from './config.js';
import { PLATE, PASS, GRIDDLE, POT, stationsOfType } from './kitchen.js';
import { findOrderForDish } from './orders.js';
import { newShift, stepShift, drainEvents } from './shift.js';
import { makePilot, pilotStep, pilotUntil } from './pilot.js';

const IDLE = { moveX: 0, moveY: 0, usePressed: false, useHeld: false };

function idleFor(shift, seconds) {
  for (let ran = 0; ran < seconds; ran += STEP) {
    stepShift(shift, STEP, IDLE);
    drainEvents(shift, STEP);
  }
}

const plates = (shift) => stationsOfType(shift.stations, PLATE);
const pass = (shift) => stationsOfType(shift.stations, PASS)[0];
const heatBusy = (shift) => [...stationsOfType(shift.stations, GRIDDLE), ...stationsOfType(shift.stations, POT)].some((station) => station.food);
const stationsBusy = (shift) => shift.stations.some((station) => station.food);

/**
 * Mid-service on night one: one dish finished and going out at the pass, a second dish part-built
 * on an assembly plate, food on the heat and tickets waiting on the board.
 */
function serviceScene(seed) {
  const shift = newShift(1, seed);
  const pilot = makePilot();
  // Serve the first boat, then juggle two tickets as a player would: finish one dish and leave
  // it on its plate while the next ticket's dish is built beside it.
  pilotUntil(pilot, shift, (now) => now.ledger.served >= 1, 60);
  let first = null;
  let second = null;
  for (let ran = 0; ran < 120 && !shift.over; ran += STEP) {
    const readySpot = plates(shift).find((spot) => spot.plate.parts.length > 0 && findOrderForDish(shift.board, spot.plate.parts));
    let controls = IDLE;
    if (!readySpot) controls = pilotStep(pilot, shift, STEP);
    else {
      first = findOrderForDish(shift.board, readySpot.plate.parts);
      second = shift.board.tickets.find((ticket) => ticket.recipe.id !== first.recipe.id) || null;
      if (second && shift.board.focusId !== second.id) {
        // Changing focus: the route is planned afresh on the next step, before the mate moves.
        shift.board.focusId = second.id;
      } else if (second) {
        const built = plates(shift).find((spot) => spot !== readySpot).plate.parts.length;
        const inHand = shift.cook.carry || shift.cook.walkTo;
        if (built === second.recipe.parts.length - 1 && stationsBusy(shift) && !inHand) break;
        controls = pilotStep(pilot, shift, STEP);
      }
    }
    stepShift(shift, STEP, controls);
    drainEvents(shift, STEP);
  }
  // Then the finished dish goes to the pass.
  if (first) shift.board.focusId = first.id;
  pilotUntil(pilot, shift, (now) => !!pass(now).serving, 30);
  if (second) shift.board.focusId = second.id;
  idleFor(shift, STEP);
  pilotUntil(pilot, shift, () => false, 0.85);
  return { screen: 'play', shift };
}

/** Deep in night three: the storm stage of the rush, a full board and every burner busy. */
function rushScene(seed) {
  const shift = newShift(3, seed);
  const pilot = makePilot();
  pilotUntil(pilot, shift, () => false, 118);
  pilotUntil(pilot, shift, (now) => now.board.tickets.length >= 4 && heatBusy(now) && plates(now).some((spot) => spot.plate.parts.length > 0), 40);
  return { screen: 'play', shift };
}

function recipesScene(seed) {
  const shift = newShift(2, seed);
  const pilot = makePilot();
  pilotUntil(pilot, shift, () => false, 30);
  return { screen: 'book', shift };
}

/** The end of a whole night two, cooked start to finish. */
function resultsScene(seed) {
  const shift = newShift(2, seed);
  const pilot = makePilot();
  pilotUntil(pilot, shift, () => false, 400);
  return { screen: 'results', shift };
}

const SCENES = { service: serviceScene, rush: rushScene, recipes: recipesScene, results: resultsScene };

/** Build the named scene; null when the name is not a scene. */
export function buildShotScene(name, seed) {
  const scene = SCENES[name];
  return scene ? scene(seed) : null;
}

/** True when a plate on the counter already answers a waiting ticket. */
export function hasReadyPlate(shift) {
  return plates(shift).some((spot) => spot.plate.parts.length > 0 && findOrderForDish(shift.board, spot.plate.parts));
}
