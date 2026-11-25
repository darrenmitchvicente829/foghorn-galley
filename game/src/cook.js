// The cook: walking the floor by keys or by a clicked station, and what the hands carry.
import { COOK, FLOOR, TIMING } from './config.js';
import { BOARD, stationInReach } from './kitchen.js';
import { useStation } from './stations.js';

export function makeCook() {
  return {
    x: 640, y: 430, facing: 1, carry: null,
    walkTo: null, stride: 0, moving: false, swing: 0, chopClock: 0, lookUp: false,
  };
}

function clampToFloor(cook) {
  cook.x = Math.min(FLOOR.right, Math.max(FLOOR.left, cook.x));
  cook.y = Math.min(FLOOR.bottom, Math.max(FLOOR.top, cook.y));
}

/** Send the cook to a station (a mouse click): they walk there and use it on arrival. */
export function walkToStation(cook, station, useOnArrival = true) {
  cook.walkTo = station;
  cook.useOnArrival = useOnArrival;
}

/**
 * Move the cook for one step. Keys steer directly and cancel a clicked walk; a clicked walk heads
 * for the station's standing spot and uses the station when it gets there.
 */
export function moveCook(shift, dt, controls) {
  const cook = shift.cook;
  let dx = controls.moveX;
  let dy = controls.moveY;
  if (dx !== 0 || dy !== 0) cook.walkTo = null;
  if (cook.walkTo) {
    const target = cook.walkTo;
    const tx = target.standX - cook.x;
    const ty = target.standY - cook.y;
    const distance = Math.hypot(tx, ty);
    if (distance < 6) {
      cook.walkTo = null;
      cook.lookUp = target.side === 'back';
      if (cook.useOnArrival) useStation(shift, target);
    } else {
      dx = tx / distance;
      dy = ty / distance;
      if (distance < COOK.speed * dt) {
        cook.x = target.standX;
        cook.y = target.standY;
        dx = 0;
        dy = 0;
      }
    }
  }
  const length = Math.hypot(dx, dy);
  cook.moving = length > 0;
  if (cook.moving) {
    cook.x += (dx / length) * COOK.speed * dt;
    cook.y += (dy / length) * COOK.speed * dt;
    if (dx !== 0) cook.facing = dx > 0 ? 1 : -1;
    if (dy !== 0) cook.lookUp = dy < 0;
    cook.stride += dt * 11;
    clampToFloor(cook);
  }
  cook.swing = Math.max(0, cook.swing - dt * 7);
}

/** The use key: one press uses the station in reach; held at a board it keeps the knife going. */
export function useKey(shift, dt, controls) {
  const cook = shift.cook;
  const station = stationInReach(shift.stations, cook);
  shift.reach = station;
  if (!station) return;
  if (controls.usePressed) {
    cook.lookUp = station.side === 'back';
    cook.chopClock = TIMING.chopRepeat * 1.6;
    useStation(shift, station);
    return;
  }
  const chopping = station.type === BOARD && station.food && !station.food.chopped && !cook.carry;
  if (controls.useHeld && chopping) {
    cook.chopClock -= dt;
    if (cook.chopClock <= 0) {
      cook.chopClock = TIMING.chopRepeat;
      useStation(shift, station);
    }
  }
}
