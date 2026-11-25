// The service rush. Pressure grows through a shift without adding chores: no dishes to wash and
// nothing new to learn, only boats that arrive closer together and wait a little less, so the
// same kitchen asks for a tighter route.
import { RUSH, SHIFT } from './config.js';

/** 0 at the first bell, 1 at closing: how thick the fog is, which is how hard the rush pushes. */
export function rushLevel(elapsed, shiftSeconds = SHIFT.seconds) {
  const t = Math.min(1, Math.max(0, elapsed / shiftSeconds));
  return t * t * (3 - 2 * t);
}

function nightScale(night) {
  return 1 - RUSH.nightBonus * (night - 1);
}

/** Seconds until the next boat calls in an order. */
export function secondsToNextOrder(elapsed, night, random) {
  const level = rushLevel(elapsed);
  const gap = RUSH.calmGap + (RUSH.stormGap - RUSH.calmGap) * level;
  return gap * nightScale(night) * random.between(0.85, 1.15);
}

/** Seconds a boat waits at the pass before it sails off; longer for a dish with more parts. */
export function patienceForOrder(elapsed, night, recipe) {
  const level = rushLevel(elapsed);
  const base = RUSH.calmPatience + (RUSH.stormPatience - RUSH.calmPatience) * level;
  return (base + (recipe.parts.length - 3) * 12) * nightScale(night);
}

export function rushName(level) {
  if (level < 0.3) return 'CALM';
  if (level < 0.65) return 'SWELL';
  return 'STORM';
}
