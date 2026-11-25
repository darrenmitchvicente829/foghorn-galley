// One shift of service: the whole state of a night in the galley and the step that advances it.
import { tickStations } from './stations.js';
import { openOrderBoard, tickOrderBoard } from './orders.js';
import { planRoute } from './route.js';
import { buildKitchen } from './kitchen.js';
import { makeCook, moveCook, useKey } from './cook.js';
import { openLedger, recordLostOrder, starsForShift } from './score.js';
import { rushLevel } from './rush.js';
import { makeRandom } from './random.js';
import { SHIFT } from './config.js';

export function newShift(night, seed) {
  return {
    night,
    random: makeRandom(seed + night * 7919),
    elapsed: 0,
    seconds: SHIFT.seconds,
    lanterns: SHIFT.lanterns,
    stations: buildKitchen(),
    cook: makeCook(),
    board: openOrderBoard(),
    ledger: openLedger(),
    events: [],
    floaters: [],
    route: null,
    reach: null,
    over: false,
    overReason: '',
    stars: 0,
    lanternFlash: 0,
  };
}

export function timeLeft(shift) {
  return Math.max(0, shift.seconds - shift.elapsed);
}

function closeShift(shift, reason) {
  shift.over = true;
  shift.overReason = reason;
  shift.stars = starsForShift(shift.ledger.score, shift.night);
  shift.events.push({ type: 'close', text: '', tone: 'plain', x: 640, y: 360 });
}

/** Advance the shift by dt seconds under the given controls. */
export function stepShift(shift, dt, controls) {
  if (shift.over) return;
  shift.elapsed += dt;
  const { lost, arrived } = tickOrderBoard(shift.board, dt, shift.elapsed, shift.night, shift.random);
  for (const ticket of lost) {
    recordLostOrder(shift.ledger);
    shift.lanterns -= 1;
    shift.lanternFlash = 1;
    shift.events.push({ type: 'lost', text: ticket.boat + ' sailed off', tone: 'bad', x: 640, y: 196 });
  }
  if (arrived) shift.events.push({ type: 'order', text: '', tone: 'plain', x: 0, y: 0 });
  tickStations(shift, dt);
  moveCook(shift, dt, controls);
  useKey(shift, dt, controls);
  shift.route = planRoute(shift);
  shift.lanternFlash = Math.max(0, shift.lanternFlash - dt * 1.5);
  if (shift.lanterns <= 0) closeShift(shift, 'The last lantern went out');
  else if (shift.elapsed >= shift.seconds) closeShift(shift, 'Closing bell');
}

/** Turn this step's events into floating words; returns the events for the sound to play. */
export function drainEvents(shift, dt) {
  const events = shift.events;
  shift.events = [];
  for (const event of events) {
    if (event.text) shift.floaters.push({ x: event.x, y: event.y, text: event.text, tone: event.tone, age: 0 });
  }
  for (const floater of shift.floaters) floater.age += dt;
  shift.floaters = shift.floaters.filter((floater) => floater.age < 1.4);
  return events;
}

export function shiftRush(shift) {
  return rushLevel(shift.elapsed, shift.seconds);
}
