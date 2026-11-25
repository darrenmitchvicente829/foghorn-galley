// The first mate: an autopilot that cooks by following the route planner, one stop at a time,
// through the same walking and station code the player uses. It plays the demo behind the title
// screen and plays the shifts the screenshots are taken from.
import { RAW } from './recipes.js';
import { walkToStation } from './cook.js';
import { stepShift, drainEvents } from './shift.js';
import { STEP } from './config.js';

const IDLE = { moveX: 0, moveY: 0, usePressed: false, useHeld: false };

export function makePilot() {
  return { wait: 0 };
}

/** Decide this step's move: head for the next stop of the plan, and wait for food still cooking. */
export function pilotStep(pilot, shift, dt) {
  pilot.wait -= dt;
  const cook = shift.cook;
  const next = shift.route && shift.route.steps[0];
  if (!next || cook.walkTo || pilot.wait > 0) return IDLE;
  const cooking = next.verb === 'collect' && next.station.food && next.station.food.cooked === RAW;
  const taken = (next.verb === 'sear' || next.verb === 'simmer') && next.station.food && next.station.food.cooked === RAW;
  if (taken) return IDLE;
  const there =Math.hypot(cook.x - next.station.standX, cook.y - next.station.standY) < 8;
  if (cooking && there) return IDLE;
  walkToStation(cook, next.station, !cooking);
  pilot.wait = 0.2;
  return IDLE;
}

/** Let the first mate run the shift until `until(shift)` is true or `limit` seconds pass. */
export function pilotUntil(pilot, shift, until, limit) {
  let ran = 0;
  while (ran < limit && !shift.over && !until(shift)) {
    stepShift(shift, STEP, pilotStep(pilot, shift, STEP));
    drainEvents(shift, STEP);
    ran += STEP;
  }
  return ran;
}
