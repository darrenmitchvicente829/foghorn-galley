// The galley itself: the wall and its sea window, the tiled floor, the two counters and every
// station on them, drawn so each reads at a glance: what it is, what is on it and how far along.
import { VIEW, TIMING } from './config.js';
import { INGREDIENTS, RAW, BURNT, makeFood } from './recipes.js';
import { CRATE, BOARD, GRIDDLE, POT, PLATE, BIN, PASS } from './kitchen.js';
import { bestOrderForPlate, findOrderForDish } from './orders.js';
import { drawFood, drawDish, drawSteam } from './draw-food.js';

export const INK = '#0d2229';
export const PAPER = '#f6e9cc';
export const AMBER = '#ffb640';
export const SERIF = 'Georgia, "DejaVu Serif", serif';
export const SANS = '"Trebuchet MS", "DejaVu Sans", Verdana, sans-serif';

export function plaque(ctx, text, x, y, options = {}) {
  const size = options.size || 15;
  ctx.font = '700 ' + size + 'px ' + SANS;
  const width = (options.width || ctx.measureText(text).width) + size * 1.2;
  const height = size * 1.55;
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - height / 2, width, height, height / 2.6);
  ctx.fillStyle = options.fill || INK;
  ctx.fill();
  if (options.stroke) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = options.stroke;
    ctx.stroke();
  }
  ctx.fillStyle = options.color || PAPER;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
  return width;
}

function drawSeaWindow(ctx, x, y, width, height, clock, rush) {
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 10);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + height);
  sky.addColorStop(0, '#0c1f33');
  sky.addColorStop(0.62, '#1d4a5e');
  sky.addColorStop(0.63, '#0f3443');
  sky.addColorStop(1, '#0a2530');
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, width, height);
  const lightX = x + width - 46;
  const beam = clock * 0.6;
  ctx.fillStyle = 'rgba(255,214,120,0.22)';
  ctx.beginPath();
  ctx.moveTo(lightX, y + 14);
  ctx.lineTo(lightX - Math.cos(beam) * 420 - 30, y + 14 + Math.sin(beam) * 60 - 26);
  ctx.lineTo(lightX - Math.cos(beam) * 420 + 30, y + 14 + Math.sin(beam) * 60 + 26);
  ctx.fill();
  ctx.fillStyle = '#e9e2d0';
  ctx.fillRect(lightX - 6, y + 14, 12, height * 0.52);
  ctx.fillStyle = '#c8432f';
  ctx.fillRect(lightX - 6, y + 24, 12, 8);
  ctx.fillStyle = '#ffd67a';
  ctx.beginPath();
  ctx.arc(lightX, y + 13, 6, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 3; i += 1) {
    const bx = x + 40 + ((clock * (9 + i * 4) + i * 120) % (width - 130));
    const by = y + height * 0.7 + i * 5;
    ctx.fillStyle = '#0a1b22';
    ctx.beginPath();
    ctx.moveTo(bx - 16, by);
    ctx.lineTo(bx + 16, by);
    ctx.lineTo(bx + 11, by + 7);
    ctx.lineTo(bx - 11, by + 7);
    ctx.fill();
    ctx.fillRect(bx - 1, by - 14, 2, 14);
    ctx.fillStyle = AMBER;
    ctx.fillRect(bx - 2, by - 16, 4, 4);
  }
  ctx.fillStyle = 'rgba(214,228,230,' + (0.08 + rush * 0.3) + ')';
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x + ((clock * 14 + i * 110) % (width + 160)) - 80, y + 18 + i * 13, 90, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#b9763a';
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 10);
  ctx.stroke();
}

function drawWallAndFloor(ctx, shift, clock, rush) {
  const wall = ctx.createLinearGradient(0, 150, 0, 230);
  wall.addColorStop(0, '#123039');
  wall.addColorStop(1, '#1d4a55');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 150, VIEW.width, 80);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 2;
  for (let x = 20; x < VIEW.width; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, 150);
    ctx.lineTo(x, 226);
    ctx.stroke();
  }
  for (let row = 0; row < 6; row += 1) {
    for (let column = 0; column < 20; column += 1) {
      ctx.fillStyle = (row + column) % 2 ? '#d8b684' : '#c9a36e';
      ctx.fillRect(column * 64, 300 + row * 44, 64, 44);
    }
  }
  const glow = ctx.createRadialGradient(640, 420, 80, 640, 420, 760);
  glow.addColorStop(0, 'rgba(255,214,150,0.18)');
  glow.addColorStop(1, 'rgba(9,30,38,0.5)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 300, VIEW.width, 260);
  ctx.fillStyle = 'rgba(160,52,40,0.55)';
  ctx.beginPath();
  ctx.roundRect(330, 372, 620, 112, 14);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,160,0.5)';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.roundRect(342, 384, 596, 88, 8);
  ctx.stroke();
  ctx.setLineDash([]);
  drawHangingRail(ctx, 44, 132, clock);
  drawHangingRail(ctx, 556, 132, clock);
  const pass = shift.stations.find((station) => station.type === PASS);
  drawSeaWindow(ctx, pass.x + 4, 156, pass.width - 8, 70, clock, rush);
}

/** A brass rail on the wall with copper pans and a ladle hanging from it. */
function drawHangingRail(ctx, x, width, clock) {
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, 164);
  ctx.lineTo(x + width, 164);
  ctx.stroke();
  const count = Math.floor(width / 44);
  for (let index = 0; index < count; index += 1) {
    const hx = x + 22 + index * 44;
    const sway = Math.sin(clock * 1.3 + index) * 1.5;
    ctx.strokeStyle = '#7d5a1c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hx, 164);
    ctx.lineTo(hx + sway, 182);
    ctx.stroke();
    ctx.beginPath();
    if (index % 2 === 0) ctx.arc(hx + sway, 196, 15, 0, Math.PI * 2);
    else ctx.ellipse(hx + sway, 192, 8, 11, 0, 0, Math.PI * 2);
    ctx.fillStyle = index % 2 === 0 ? '#c9743a' : '#aeb9bd';
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = index % 2 === 0 ? '#7d3f17' : '#5c6a70';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hx + sway - 4, 192, 4, Math.PI, Math.PI * 1.6);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.stroke();
  }
}

function drawCounter(ctx, y) {
  const top = ctx.createLinearGradient(0, y, 0, y + 96);
  top.addColorStop(0, '#b98250');
  top.addColorStop(1, '#9a6539');
  ctx.fillStyle = '#4a2c17';
  ctx.beginPath();
  ctx.roundRect(28, y - 4, VIEW.width - 56, 108, 12);
  ctx.fill();
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.roundRect(32, y, VIEW.width - 64, 84, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(60,32,14,0.25)';
  ctx.lineWidth = 2;
  for (let line = 1; line < 4; line += 1) {
    ctx.beginPath();
    ctx.moveTo(40, y + line * 21);
    ctx.lineTo(VIEW.width - 40, y + line * 21);
    ctx.stroke();
  }
}

function progressBar(ctx, x, y, width, fraction, color) {
  ctx.fillStyle = INK;
  ctx.beginPath();
  ctx.roundRect(x - width / 2 - 3, y - 3, width + 6, 16, 8);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y, Math.max(8, width * Math.min(1, fraction)), 10, 5);
  ctx.fill();
}

function drawCrate(ctx, station) {
  const { centerX: x, y } = station;
  ctx.fillStyle = '#6a3f1f';
  ctx.beginPath();
  ctx.roundRect(x - 46, y + 6, 92, 66, 8);
  ctx.fill();
  ctx.fillStyle = '#d9b27a';
  ctx.beginPath();
  ctx.roundRect(x - 40, y + 11, 80, 55, 6);
  ctx.fill();
  const food = makeFood(station.ingredient);
  drawFood(ctx, food, x - 16, y + 30, 38);
  drawFood(ctx, food, x + 17, y + 32, 38);
  drawFood(ctx, food, x, y + 46, 42);
  plaque(ctx, INGREDIENTS[station.ingredient].name.toUpperCase(), x, y + 84, { size: 12, fill: '#f6e9cc', color: INK });
}

function drawBoard(ctx, station, clock) {
  const { centerX: x, y } = station;
  ctx.fillStyle = '#5a3418';
  ctx.beginPath();
  ctx.roundRect(x - 62, y + 9, 124, 62, 9);
  ctx.fill();
  ctx.fillStyle = '#e8c690';
  ctx.beginPath();
  ctx.roundRect(x - 58, y + 6, 116, 60, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,80,40,0.35)';
  ctx.lineWidth = 1.5;
  for (const offset of [-22, -6, 12, 26]) {
    ctx.beginPath();
    ctx.moveTo(x + offset, y + 14);
    ctx.lineTo(x + offset + 16, y + 26);
    ctx.stroke();
  }
  if (station.food) {
    drawFood(ctx, station.food, x - 8, y + 36, 48);
    if (!station.food.chopped) progressBar(ctx, x, y - 34, 96, station.progress, AMBER);
  }
  const lift = station.pulse * 10;
  ctx.save();
  ctx.translate(x + 40, y + 40 - lift);
  ctx.rotate(-0.5 - station.pulse * 0.5);
  ctx.fillStyle = '#dfe7ea';
  ctx.beginPath();
  ctx.moveTo(-4, -26);
  ctx.lineTo(8, -22);
  ctx.lineTo(7, 6);
  ctx.lineTo(-4, 6);
  ctx.fill();
  ctx.fillStyle = '#2a1a10';
  ctx.fillRect(-4, 6, 10, 18);
  ctx.restore();
}

function heatColor(station, burnSeconds) {
  if (!station.food) return '#7fd08a';
  if (station.food.cooked === BURNT) return '#3a2d26';
  if (station.food.cooked === RAW) return AMBER;
  return station.overtime > TIMING.perfectWindow ? (station.overtime > burnSeconds * 0.7 ? '#ff5a3c' : '#ffd24a') : '#62e07a';
}

function heatBar(ctx, station, x, y, burnSeconds) {
  const food = station.food;
  if (!food) return;
  if (food.cooked === RAW) progressBar(ctx, x, y, 96, station.progress, AMBER);
  else if (food.cooked === BURNT) plaque(ctx, 'BURNT', x, y + 4, { size: 13, fill: '#7f1d0e' });
  else {
    progressBar(ctx, x, y, 96, 1 - station.overtime / burnSeconds, heatColor(station, burnSeconds));
    plaque(ctx, station.overtime <= TIMING.perfectWindow ? 'PERFECT: LIFT!' : 'LIFT IT!', x, y - 16, { size: 12, fill: '#1c6b3a' });
  }
}

function drawGriddle(ctx, station, clock) {
  const { centerX: x, y } = station;
  const lit = !!station.food;
  ctx.fillStyle = '#3d4750';
  ctx.beginPath();
  ctx.roundRect(x - 66, y + 4, 132, 72, 10);
  ctx.fill();
  if (lit) {
    ctx.fillStyle = 'rgba(255,120,40,' + (0.5 + 0.2 * Math.sin(clock * 9)) + ')';
    ctx.beginPath();
    ctx.roundRect(x - 60, y + 9, 120, 62, 8);
    ctx.fill();
  }
  ctx.fillStyle = '#1b2126';
  ctx.beginPath();
  ctx.roundRect(x - 56, y + 12, 112, 54, 7);
  ctx.fill();
  // Pilot flames under the bars: small when idle, tall when something is searing.
  for (let i = -3; i <= 2; i += 1) {
    const flicker = Math.sin(clock * 11 + i * 2.1 + x) * 2;
    const tall = lit ? 15 + flicker : 6 + flicker * 0.5;
    ctx.beginPath();
    ctx.ellipse(x + i * 15 + 7.5, y + 58 - tall / 2, 4, tall / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = lit ? '#ff9a3c' : '#4f8fd0';
    ctx.fill();
  }
  ctx.strokeStyle = '#59646e';
  ctx.lineWidth = 3;
  for (let i = -3; i <= 3; i += 1) {
    ctx.beginPath();
    ctx.moveTo(x + i * 15, y + 16);
    ctx.lineTo(x + i * 15, y + 62);
    ctx.stroke();
  }
  if (station.food) {
    drawFood(ctx, station.food, x, y + 39, 50);
    drawSteam(ctx, x, y + 14, clock * 3 + x, station.food.cooked === BURNT ? 0.4 : 0.9);
    heatBar(ctx, station, x, y - 34, TIMING.searBurnSeconds);
  }
}

function drawPot(ctx, station, clock) {
  const { centerX: x, y } = station;
  ctx.fillStyle = '#3d4750';
  ctx.beginPath();
  ctx.roundRect(x - 66, y + 4, 132, 72, 10);
  ctx.fill();
  if (station.food) {
    ctx.fillStyle = 'rgba(255,120,40,0.6)';
    ctx.beginPath();
    ctx.ellipse(x, y + 42, 56, 34, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#b5622b';
  ctx.fillRect(x - 64, y + 34, 128, 12);
  ctx.beginPath();
  ctx.ellipse(x, y + 40, 50, 32, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#c9743a';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#7d3f17';
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, y + 40, 40, 24, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#e9c98a';
  ctx.fill();
  if (station.food) {
    drawFood(ctx, station.food, x, y + 40, 40);
    for (let i = 0; i < 4; i += 1) {
      const bubble = (clock * 1.7 + i * 0.27) % 1;
      ctx.strokeStyle = 'rgba(255,255,255,' + (1 - bubble) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x - 26 + i * 17, y + 46 - bubble * 8, 2 + bubble * 3, 0, Math.PI * 2);
      ctx.stroke();
    }
    drawSteam(ctx, x, y + 16, clock * 3, 0.9);
    heatBar(ctx, station, x, y - 20, TIMING.simmerBurnSeconds);
  }
}

function drawAssembly(ctx, station, shift, clock) {
  const { centerX: x, y } = station;
  ctx.fillStyle = '#1f5560';
  ctx.beginPath();
  ctx.roundRect(x - 90, y + 4, 180, 74, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(246,233,204,0.5)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.roundRect(x - 84, y + 10, 168, 62, 7);
  ctx.stroke();
  ctx.setLineDash([]);
  const parts = station.plate.parts;
  const fit = parts.length ? bestOrderForPlate(shift.board, parts) : null;
  const vessel = fit ? fit.ticket.recipe.vessel : 'plate';
  drawDish(ctx, parts, x, y + 36, 50, vessel);
  if (parts.length === 0) return;
  const ready = !!findOrderForDish(shift.board, parts);
  if (ready) {
    drawSteam(ctx, x, y + 2, clock * 3, 0.8);
    plaque(ctx, 'READY TO SERVE', x, y - 40, { size: 15, fill: '#1c6b3a', stroke: '#9df0b0' });
  } else if (fit) {
    const total = fit.ticket.recipe.parts.length;
    plaque(ctx, 'MID-ASSEMBLY ' + parts.length + '/' + total, x, y - 40, { size: 15, fill: INK, stroke: AMBER, color: AMBER });
    fit.missing.forEach((recipePart, index) => {
      const gx = x + 62 + index * 30 - (fit.missing.length - 1) * 4;
      ctx.globalAlpha = 0.5;
      drawFood(ctx, recipePart, gx, y + 60, 26);
      ctx.globalAlpha = 1;
    });
  } else plaque(ctx, 'NO TICKET FOR THIS', x, y - 40, { size: 13, fill: '#7f1d0e' });
}

function drawBin(ctx, station) {
  const { centerX: x, y } = station;
  ctx.fillStyle = '#56636b';
  ctx.beginPath();
  ctx.moveTo(x - 30, y + 12);
  ctx.lineTo(x + 30, y + 12);
  ctx.lineTo(x + 24, y + 72);
  ctx.lineTo(x - 24, y + 72);
  ctx.fill();
  ctx.fillStyle = '#1b2126';
  ctx.beginPath();
  ctx.ellipse(x, y + 14, 30, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8b9aa3';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function drawPass(ctx, station, clock) {
  const { centerX: x, y } = station;
  ctx.fillStyle = '#e9dcc0';
  ctx.beginPath();
  ctx.roundRect(station.x + 6, y + 4, station.width - 12, 74, 10);
  ctx.fill();
  ctx.fillStyle = '#c8432f';
  for (let i = 0; i < 8; i += 1) ctx.fillRect(station.x + 6 + i * 42, y + 4, 21, 8);
  const bellX = station.x + station.width - 50;
  ctx.fillStyle = '#7d5a1c';
  ctx.fillRect(bellX - 18, y + 56, 36, 7);
  ctx.beginPath();
  ctx.arc(bellX, y + 56, 20, Math.PI, 0);
  ctx.fillStyle = AMBER;
  ctx.fill();
  ctx.strokeStyle = '#8a5a10';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#8a5a10';
  ctx.beginPath();
  ctx.arc(bellX, y + 33, 5, 0, Math.PI * 2);
  ctx.fill();
  if (station.serving) {
    const dishX = station.x + 62;
    const recipe = station.serving.ticket.recipe;
    drawDish(ctx, station.serving.dish.parts, dishX, y + 42, 44, recipe.vessel);
    drawSteam(ctx, dishX, y + 8, clock * 3, 0.9);
    plaque(ctx, 'READY TO SERVE', station.x + 192, y + 32, { size: 17, fill: '#1c6b3a', stroke: '#9df0b0' });
    ctx.font = 'italic 700 14px ' + SERIF;
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(recipe.name + ', ' + station.serving.ticket.boat, station.x + 192, y + 62);
    for (let ring = 0; ring < 2; ring += 1) {
      const spread = ((clock * 2 + ring * 0.5) % 1) * 16;
      ctx.strokeStyle = 'rgba(255,182,64,' + (1 - spread / 16) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bellX, y + 44, 24 + spread, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  } else {
    ctx.font = '700 22px ' + SERIF;
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('THE PASS', x - 20, y + 34);
    ctx.font = '600 13px ' + SANS;
    ctx.fillStyle = '#5b4a2c';
    ctx.fillText('bring a finished dish, ring the bell', x - 20, y + 58);
  }
}

const STATION_PAINTERS = {
  [CRATE]: drawCrate, [BOARD]: drawBoard, [GRIDDLE]: drawGriddle, [POT]: drawPot,
  [BIN]: drawBin, [PASS]: drawPass,
};

function drawStationLabels(ctx, shift) {
  plaque(ctx, 'INGREDIENTS ON THE COUNTER', 366, 192, { size: 17, fill: '#f6e9cc', color: INK });
  plaque(ctx, 'STEW POT', 791, 192, { size: 15, fill: '#c9743a', color: '#fff6e0' });
  for (const station of shift.stations) {
    if (station.side !== 'front') continue;
    const fill = station.type === PLATE ? '#1f5560' : '#3a2413';
    plaque(ctx, station.label, station.centerX, station.y + 91, { size: 13, fill });
  }
}

/** Draw the room and every station; the cook and the HUD are drawn over it by their own files. */
export function drawKitchen(ctx, shift, clock, rush) {
  drawWallAndFloor(ctx, shift, clock, rush);
  drawCounter(ctx, 222);
  drawCounter(ctx, 548);
  drawStationLabels(ctx, shift);
  for (const station of shift.stations) {
    if (station.type === PLATE) drawAssembly(ctx, station, shift, clock);
    else STATION_PAINTERS[station.type](ctx, station, clock);
  }
}

/** A glowing outline on the station the cook can use right now, with what the use key will do. */
export function drawReachHighlight(ctx, shift, clock) {
  const station = shift.reach;
  if (!station) return;
  ctx.strokeStyle = 'rgba(255,214,120,' + (0.7 + 0.3 * Math.sin(clock * 6)) + ')';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(station.x - 3, station.y - 2, station.width + 6, station.height - 6, 12);
  ctx.stroke();
}