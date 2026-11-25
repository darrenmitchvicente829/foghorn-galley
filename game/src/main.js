// Foghorn Galley: the page's entry point. It owns the screen the player is on (title, service,
// recipe book, pause, results), runs the fixed-step loop and hands each frame to the painters.
import { newShift, stepShift, drainEvents, shiftRush } from './shift.js';
import { VIEW, STEP, SHIFT } from './config.js';
import { focusNextOrder } from './orders.js';
import { stationAtPoint } from './kitchen.js';
import { walkToStation } from './cook.js';
import { makePilot, pilotStep } from './pilot.js';
import { listenForInput, readMoveKeys, isUseHeld, takeInput } from './input.js';
import { wakeAudio, toggleMute, playEventSounds, playFoghorn, startTune, stopTune } from './audio.js';
import { drawKitchen, drawReachHighlight } from './draw-kitchen.js';
import { drawRoute, drawCook, drawFloaters } from './draw-cook.js';
import { drawHud, ticketAtPoint } from './draw-hud.js';
import { drawTitleScreen, drawRecipeBook, drawPauseCard, drawResults } from './draw-screens.js';
import { buildShotScene } from './shots.js';

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const ctx = canvas.getContext('2d');
const query = new URLSearchParams(window.location.search);
const seed = Number(query.get('seed')) || Math.floor(Math.random() * 1e9) + 1;

const app = {
  screen: 'title',
  bookFrom: 'title',
  night: 1,
  shift: newShift(1, seed),
  demoPilot: makePilot(),
  clock: 0,
};

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(VIEW.width * scale * ratio);
  canvas.height = Math.round(VIEW.height * scale * ratio);
  canvas.style.width = Math.round(VIEW.width * scale) + 'px';
  canvas.style.height = Math.round(VIEW.height * scale) + 'px';
  ctx.setTransform(canvas.width / VIEW.width, 0, 0, canvas.height / VIEW.height, 0, 0);
}

function openNight(night) {
  app.night = night;
  app.shift = newShift(night, seed + Math.floor(app.clock * 1000));
  app.screen = 'play';
  playFoghorn();
  startTune(() => shiftRush(app.shift));
  status.textContent = 'Night ' + night + ' is open. Read the order board.';
}

function closeNight() {
  app.screen = 'results';
  stopTune();
  const shift = app.shift;
  status.textContent = 'Night closed with ' + shift.ledger.score + ' points and ' + shift.stars + ' stars.';
}

function onStart() {
  wakeAudio();
  if (app.screen === 'title') openNight(app.night);
  else if (app.screen === 'results') {
    const next = app.shift.stars > 0 && app.night < SHIFT.nights ? app.night + 1 : app.night;
    openNight(next);
  }
}

function onAction(action) {
  if (action === 'mute') return void toggleMute();
  if (action === 'start') return onStart();
  if (action === 'book') {
    if (app.screen === 'book') app.screen = app.bookFrom;
    else if (app.screen === 'results') openNight(app.night);
    else {
      app.bookFrom = app.screen;
      app.screen = 'book';
    }
    return;
  }
  if (action === 'pause') {
    if (app.screen === 'play') app.screen = 'paused';
    else if (app.screen === 'paused') app.screen = 'play';
    else if (app.screen === 'book') app.screen = app.bookFrom;
    return;
  }
  if (action === 'focus' && app.screen === 'play') focusNextOrder(app.shift.board);
}

function onClick(point) {
  wakeAudio();
  if (app.screen !== 'play') return onStart();
  const shift = app.shift;
  const ticketIndex = ticketAtPoint(point.x, point.y, shift.board.tickets.length);
  if (ticketIndex !== -1) {
    shift.board.focusId = shift.board.tickets[ticketIndex].id;
    return;
  }
  const station = stationAtPoint(shift.stations, point.x, point.y);
  if (station) walkToStation(shift.cook, station);
}

function update(input) {
  const { actions, clicks } = takeInput(input);
  let usePressed = false;
  for (const action of actions) {
    if (action === 'use' && app.screen === 'play') usePressed = true;
    else if (action === 'use') onStart();
    else onAction(action);
  }
  for (const point of clicks) onClick(point);
  app.clock += STEP;
  if (app.screen === 'play') {
    const controls = { ...readMoveKeys(input), usePressed, useHeld: isUseHeld(input) };
    stepShift(app.shift, STEP, controls);
    playEventSounds(drainEvents(app.shift, STEP));
    if (app.shift.over) closeNight();
  } else if (app.screen === 'title') {
    // Behind the title card the first mate cooks a demo shift.
    stepShift(app.shift, STEP, pilotStep(app.demoPilot, app.shift, STEP));
    drainEvents(app.shift, STEP);
    if (app.shift.over) app.shift = newShift(1, seed + Math.floor(app.clock));
  }
}

function draw() {
  const shift = app.shift;
  const clock = app.clock;
  drawKitchen(ctx, shift, clock, shiftRush(shift));
  drawReachHighlight(ctx, shift, clock);
  drawRoute(ctx, shift, clock);
  drawCook(ctx, shift, clock);
  drawHud(ctx, shift, clock);
  drawFloaters(ctx, shift);
  if (app.screen === 'title') drawTitleScreen(ctx, clock, app.night);
  else if (app.screen === 'book') drawRecipeBook(ctx, app.screen === 'book' ? Math.max(app.night, shift.night) : app.night);
  else if (app.screen === 'paused') drawPauseCard(ctx);
  else if (app.screen === 'results') drawResults(ctx, shift, clock);
}

function runLoop(input) {
  let last = performance.now();
  let owed = 0;
  const frame = (now) => {
    owed = Math.min(0.25, owed + (now - last) / 1000);
    last = now;
    while (owed >= STEP) {
      update(input);
      owed -= STEP;
    }
    draw();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function showShot(name) {
  const scene = buildShotScene(name, Number(query.get('seed')) || 1);
  if (!scene) return false;
  app.screen = scene.screen;
  app.shift = scene.shift;
  app.night = scene.shift.night;
  app.clock = scene.shift.elapsed;
  draw();
  status.textContent = 'shot ready';
  return true;
}

fitCanvas();
window.addEventListener('resize', () => {
  fitCanvas();
  draw();
});
if (!(query.has('shot') && showShot(query.get('shot')))) runLoop(listenForInput(canvas));
