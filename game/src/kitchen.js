// The floor plan of the galley: every station, where it sits on the two counters and where the
// cook stands to use it. The back counter holds the pantry, the stew pot and the pass; the front
// counter holds the chopping boards, the griddle, the two assembly plates and the scrap bucket.
import { FLOOR, COOK } from './config.js';
import { PANTRY_ORDER } from './recipes.js';

export const CRATE = 'crate';
export const BOARD = 'board';
export const GRIDDLE = 'griddle';
export const POT = 'pot';
export const PLATE = 'plate';
export const BIN = 'bin';
export const PASS = 'pass';

const BACK_Y = 222;
const FRONT_Y = 548;
const COUNTER_DEPTH = 96;

function station(id, type, label, x, width, side, extra) {
  const y = side === 'back' ? BACK_Y : FRONT_Y;
  return {
    id, type, label, side, x, y, width, height: COUNTER_DEPTH,
    centerX: x + width / 2,
    centerY: y + COUNTER_DEPTH / 2,
    standX: x + width / 2,
    standY: side === 'back' ? FLOOR.top + 6 : FLOOR.bottom - 6,
    food: null, progress: 0, overtime: 0, plate: null, serving: null, pulse: 0,
    ...extra,
  };
}

export function buildKitchen() {
  const stations = [];
  PANTRY_ORDER.forEach((ingredient, index) => {
    stations.push(station('crate-' + ingredient, CRATE, ingredient, 44 + index * 108, 100, 'back', { ingredient }));
  });
  stations.push(station('pot', POT, 'STEW POT', 716, 150, 'back'));
  stations.push(station('pass', PASS, 'THE PASS', 900, 336, 'back'));
  stations.push(station('board-1', BOARD, 'CHOP', 44, 150, 'front'));
  stations.push(station('board-2', BOARD, 'CHOP', 204, 150, 'front'));
  stations.push(station('griddle-1', GRIDDLE, 'GRIDDLE', 384, 150, 'front'));
  stations.push(station('griddle-2', GRIDDLE, 'GRIDDLE', 544, 150, 'front'));
  stations.push(station('plate-1', PLATE, 'ASSEMBLY', 728, 196, 'front', { plate: { kind: 'plate', parts: [] } }));
  stations.push(station('plate-2', PLATE, 'ASSEMBLY', 934, 196, 'front', { plate: { kind: 'plate', parts: [] } }));
  stations.push(station('bin', BIN, 'SCRAPS', 1146, 90, 'front'));
  return stations;
}

export function stationById(stations, id) {
  return stations.find((item) => item.id === id) || null;
}

export function stationsOfType(stations, type) {
  return stations.filter((item) => item.type === type);
}

/** The station whose standing spot is nearest the cook and within reach, or null. */
export function stationInReach(stations, cook) {
  let best = null;
  let bestDistance = COOK.reach;
  for (const item of stations) {
    const distance = Math.hypot(cook.x - item.standX, (cook.y - item.standY) * 1.6);
    if (distance < bestDistance) {
      best = item;
      bestDistance = distance;
    }
  }
  return best;
}

/** The station drawn under a point of the canvas (a mouse click), or null. */
export function stationAtPoint(stations, x, y) {
  return stations.find((item) => x >= item.x && x <= item.x + item.width && y >= item.y - 40 && y <= item.y + item.height + 10) || null;
}

/** Walking distance between the standing spots of two stations: what the route planner adds up. */
export function walkBetween(from, to) {
  return Math.hypot(from.standX - to.standX, from.standY - to.standY);
}
