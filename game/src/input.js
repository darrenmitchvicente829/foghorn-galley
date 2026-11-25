// Keyboard and mouse. Keys held give the walking direction; presses queue up as named actions
// (use, focus, pause, mute, book, start) and clicks arrive in canvas coordinates.
import { VIEW } from './config.js';

const MOVE_KEYS = {
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
};

const ACTION_KEYS = {
  KeyE: 'use', Space: 'use',
  KeyQ: 'focus', Tab: 'focus',
  KeyP: 'pause', Escape: 'pause',
  KeyM: 'mute',
  KeyR: 'book',
  Enter: 'start',
};

export function listenForInput(canvas) {
  const held = new Set();
  const input = { actions: [], clicks: [], pointer: { x: 0, y: 0 }, held };

  const toCanvas = (event) => {
    const box = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * VIEW.width,
      y: ((event.clientY - box.top) / box.height) * VIEW.height,
    };
  };

  window.addEventListener('keydown', (event) => {
    if (MOVE_KEYS[event.code] || ACTION_KEYS[event.code]) event.preventDefault();
    if (event.repeat) return;
    held.add(event.code);
    if (ACTION_KEYS[event.code]) input.actions.push(ACTION_KEYS[event.code]);
  });
  window.addEventListener('keyup', (event) => held.delete(event.code));
  window.addEventListener('blur', () => held.clear());
  canvas.addEventListener('pointermove', (event) => {
    input.pointer = toCanvas(event);
  });
  canvas.addEventListener('pointerdown', (event) => {
    input.pointer = toCanvas(event);
    input.clicks.push(input.pointer);
  });
  return input;
}

/** The walking direction the held keys ask for, each axis -1, 0 or 1. */
export function readMoveKeys(input) {
  let moveX = 0;
  let moveY = 0;
  for (const code of input.held) {
    const move = MOVE_KEYS[code];
    if (!move) continue;
    moveX += move[0];
    moveY += move[1];
  }
  return { moveX: Math.sign(moveX), moveY: Math.sign(moveY) };
}

export function isUseHeld(input) {
  return input.held.has('KeyE') || input.held.has('Space');
}

/** Hand over the presses and clicks gathered since the last frame. */
export function takeInput(input) {
  const actions = input.actions;
  const clicks = input.clicks;
  input.actions = [];
  input.clicks = [];
  return { actions, clicks };
}
