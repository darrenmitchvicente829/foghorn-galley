// What happens when the cook uses a station: take from a crate, chop on a board, sear on the
// griddle, simmer in the pot, build a dish on an assembly plate, serve it at the pass or scrap it.
// Every action answers at once with an event the game turns into a sound and a floating word.
import { INGREDIENTS, RAW, SEARED, SIMMERED, BURNT, makeFood, describeFood } from './recipes.js';
import { findOrderForDish, removeOrder } from './orders.js';
import { CRATE, BOARD, GRIDDLE, POT, PLATE, BIN, PASS } from './kitchen.js';
import { scoreServedDish } from './score.js';
import { TIMING } from './config.js';

function say(shift, station, type, text, tone = 'plain') {
  shift.events.push({ type, text, tone, x: station.centerX, y: station.y - 8 });
  station.pulse = 1;
}

function deny(shift, station, text) {
  say(shift, station, 'deny', text, 'bad');
  return false;
}

export function takeFromCrate(shift, station) {
  const cook = shift.cook;
  if (cook.carry) return deny(shift, station, 'Hands full');
  cook.carry = makeFood(station.ingredient);
  say(shift, station, 'take', INGREDIENTS[station.ingredient].name);
  return true;
}

/** One press at a board: set food down, land one knife stroke, or lift the chopped food. */
export function chopOnBoard(shift, station) {
  const cook = shift.cook;
  if (cook.carry) {
    if (station.food) return deny(shift, station, 'Board is full');
    const food = cook.carry;
    if (food.kind !== 'food') return deny(shift, station, 'Plates go on ASSEMBLY');
    if (!INGREDIENTS[food.ingredient].canChop) return deny(shift, station, INGREDIENTS[food.ingredient].name + ' needs no chopping');
    if (food.chopped || food.cooked !== RAW) return deny(shift, station, 'Already prepared');
    station.food = food;
    station.progress = 0;
    cook.carry = null;
    say(shift, station, 'place', 'Chop it!  [E]');
    return true;
  }
  if (!station.food) return deny(shift, station, 'Bring something to chop');
  if (!station.food.chopped) {
    station.progress += 1 / TIMING.chopStrokes;
    cook.swing = 1;
    if (station.progress >= 0.999) {
      station.food.chopped = true;
      station.progress = 1;
      say(shift, station, 'chopped', 'Chopped!', 'good');
    } else {
      say(shift, station, 'chop', '');
    }
    return true;
  }
  cook.carry = station.food;
  station.food = null;
  station.progress = 0;
  say(shift, station, 'take', describeFood(cook.carry));
  return true;
}

function putOnHeat(shift, station, canCook, verb) {
  const cook = shift.cook;
  if (station.food && station.food.cooked === RAW) return deny(shift, station, 'Still cooking');
  const food = cook.carry;
  if (food.kind !== 'food') return deny(shift, station, 'Plates go on ASSEMBLY');
  if (!canCook(INGREDIENTS[food.ingredient])) return deny(shift, station, INGREDIENTS[food.ingredient].name + " won't " + verb);
  if (food.cooked !== RAW) return deny(shift, station, 'Already cooked');
  // Swap in one move: cooked food comes off into the cook's hands as the raw food goes on.
  const cooked = station.food;
  if (cooked) cooked.perfect = cooked.cooked !== BURNT && station.overtime <= TIMING.perfectWindow;
  station.food = food;
  station.progress = 0;
  station.overtime = 0;
  cook.carry = cooked;
  say(shift, station, 'sizzle', cooked ? 'Swapped!' : verb === 'sear' ? 'Searing...' : 'Simmering...', cooked ? 'good' : 'plain');
  return true;
}

function liftFromHeat(shift, station, doneState) {
  const cook = shift.cook;
  if (!station.food) return deny(shift, station, 'Nothing here yet');
  const food = station.food;
  food.perfect = food.cooked === doneState && station.overtime <= TIMING.perfectWindow;
  cook.carry = food;
  station.food = null;
  station.progress = 0;
  station.overtime = 0;
  if (food.perfect) say(shift, station, 'perfect', 'Perfect!', 'good');
  else say(shift, station, 'take', describeFood(food), food.cooked === BURNT ? 'bad' : 'plain');
  return true;
}

export function searOnGriddle(shift, station) {
  if (shift.cook.carry) return putOnHeat(shift, station, (info) => info.canSear, 'sear');
  return liftFromHeat(shift, station, SEARED);
}

export function simmerInPot(shift, station) {
  if (shift.cook.carry) return putOnHeat(shift, station, (info) => info.canSimmer, 'simmer');
  return liftFromHeat(shift, station, SIMMERED);
}

/** At an assembly plate: add the carried food to the dish, set a carried dish down, or lift the dish. */
export function plateIngredient(shift, station) {
  const cook = shift.cook;
  const carried = cook.carry;
  if (!carried) {
    if (station.plate.parts.length === 0) return deny(shift, station, 'Bring prepared food here');
    cook.carry = station.plate;
    station.plate = { kind: 'plate', parts: [] };
    say(shift, station, 'take', 'Dish in hand');
    return true;
  }
  if (carried.kind === 'plate') {
    if (station.plate.parts.length > 0) return deny(shift, station, 'This spot is taken');
    station.plate = carried;
    cook.carry = null;
    say(shift, station, 'place', 'Set down');
    return true;
  }
  if (carried.cooked === BURNT) return deny(shift, station, 'Burnt: scrap it');
  if (station.plate.parts.length >= 5) return deny(shift, station, 'Plate is full');
  station.plate.parts.push(carried);
  cook.carry = null;
  if (findOrderForDish(shift.board, station.plate.parts)) say(shift, station, 'ready', 'Ready to serve!', 'good');
  else say(shift, station, 'plate', 'Plated');
  return true;
}

/** At the pass: a finished dish that answers a ticket goes out, rings the bell and is paid. */
export function serveAtPass(shift, station) {
  const cook = shift.cook;
  const dish = cook.carry;
  if (!dish || dish.kind !== 'plate') return deny(shift, station, 'Bring a finished dish');
  const ticket = findOrderForDish(shift.board, dish.parts);
  if (!ticket) return deny(shift, station, 'No ticket asks for that');
  if (station.serving) finishServing(shift, station);
  const pay = scoreServedDish(shift.ledger, ticket, dish.parts);
  ticket.serving = true;
  station.serving = { dish, ticket, left: TIMING.passSeconds, pay };
  cook.carry = null;
  const words = '+' + pay.total + (pay.multiplier > 1 ? '  x' + pay.multiplier.toFixed(2).replace(/0$/, '') : '');
  say(shift, station, 'serve', words, 'gold');
  return true;
}

function finishServing(shift, station) {
  removeOrder(shift.board, station.serving.ticket);
  station.serving = null;
}

export function scrapInBin(shift, station) {
  const cook = shift.cook;
  if (!cook.carry) return deny(shift, station, 'Nothing to scrap');
  if (cook.carry.kind === 'food' && cook.carry.cooked === BURNT) shift.ledger.burnt += 1;
  cook.carry = null;
  say(shift, station, 'scrap', 'Scrapped');
  return true;
}

const ACTIONS = {
  [CRATE]: takeFromCrate,
  [BOARD]: chopOnBoard,
  [GRIDDLE]: searOnGriddle,
  [POT]: simmerInPot,
  [PLATE]: plateIngredient,
  [PASS]: serveAtPass,
  [BIN]: scrapInBin,
};

export function useStation(shift, station) {
  return ACTIONS[station.type](shift, station);
}

function heatFood(shift, station, dt, cookSeconds, burnSeconds, doneState) {
  const food = station.food;
  if (!food || food.cooked === BURNT) return;
  if (food.cooked === RAW) {
    station.progress += dt / cookSeconds;
    if (station.progress >= 1) {
      station.progress = 1;
      food.cooked = doneState;
      say(shift, station, 'done', 'Done: lift it!', 'good');
    }
    return;
  }
  station.overtime += dt;
  if (station.overtime >= burnSeconds) {
    food.cooked = BURNT;
    say(shift, station, 'burnt', 'Burnt!', 'bad');
  }
}

/** Run every station for one step: heat cooks on its own, and the pass hands dishes out. */
export function tickStations(shift, dt) {
  for (const station of shift.stations) {
    station.pulse = Math.max(0, station.pulse - dt * 4);
    if (station.type === GRIDDLE) heatFood(shift, station, dt, TIMING.searSeconds, TIMING.searBurnSeconds, SEARED);
    if (station.type === POT) heatFood(shift, station, dt, TIMING.simmerSeconds, TIMING.simmerBurnSeconds, SIMMERED);
    if (station.type === PASS && station.serving) {
      station.serving.left -= dt;
      if (station.serving.left <= 0) finishServing(shift, station);
    }
  }
}
