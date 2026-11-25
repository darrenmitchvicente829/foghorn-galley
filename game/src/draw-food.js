// Food, drawn by hand on the canvas: each of the six ingredients in every state it can reach
// (whole, chopped, seared, simmered, burnt) and a dish as the parts on its plate or in its bowl.
import { RAW, SEARED, SIMMERED, BURNT } from './recipes.js';

function blob(ctx, x, y, rx, ry, fill, stroke, turn = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, turn, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function cube(ctx, x, y, size, fill, edge, turn) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turn);
  ctx.beginPath();
  ctx.roundRect(-size / 2, -size / 2, size, size, 2.5);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = edge;
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(-size / 2 + 2, -size / 2 + 2, size / 2.4, 2.4);
  ctx.restore();
}

function grillMarks(ctx, width, color = 'rgba(70,32,10,0.75)') {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * width - 5, 7);
    ctx.lineTo(i * width + 5, -7);
    ctx.stroke();
  }
}

function drawMackerel(ctx, food) {
  if (food.cooked === SIMMERED) {
    for (const [x, y, turn] of [[-9, -4, 0.3], [8, -6, -0.4], [0, 8, 0.1]]) {
      blob(ctx, x, y, 10, 7, '#f3ead9', '#b9c6c6', turn);
      blob(ctx, x - 2, y - 2, 4, 2, 'rgba(255,255,255,0.7)', null, turn);
    }
    return;
  }
  const seared = food.cooked === SEARED;
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.bezierCurveTo(-12, -14, 12, -13, 20, -3);
  ctx.bezierCurveTo(14, 12, -12, 13, -20, 0);
  const skin = ctx.createLinearGradient(0, -12, 0, 12);
  if (seared) {
    skin.addColorStop(0, '#e2a04a');
    skin.addColorStop(1, '#a8612a');
  } else {
    skin.addColorStop(0, '#5f8fa6');
    skin.addColorStop(0.55, '#c5d9de');
    skin.addColorStop(1, '#f2c9bd');
  }
  ctx.fillStyle = skin;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = seared ? '#6b3615' : '#2f5567';
  ctx.stroke();
  if (seared) grillMarks(ctx, 9);
  else {
    ctx.strokeStyle = '#27485a';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * 6 - 2, -8);
      ctx.quadraticCurveTo(i * 6 + 3, -5, i * 6 - 1, -1);
      ctx.stroke();
    }
  }
}

function drawPotato(ctx, food) {
  if (!food.chopped) {
    const seared = food.cooked === SEARED;
    blob(ctx, 0, 0, 17, 13, seared ? '#b9772e' : '#cfa565', seared ? '#6b3f14' : '#8d6a33', -0.2);
    for (const [x, y] of [[-6, -3], [5, 2], [1, -6], [-2, 5]]) blob(ctx, x, y, 1.6, 1.3, '#8d6a33');
    blob(ctx, -5, -6, 6, 2.5, 'rgba(255,255,255,0.3)', null, -0.3);
    return;
  }
  const colors = {
    [RAW]: ['#f4e3a3', '#c2a85a'],
    [SEARED]: ['#e3a53a', '#8f5716'],
    [SIMMERED]: ['#f8efc6', '#cdbd80'],
  }[food.cooked] || ['#f4e3a3', '#c2a85a'];
  for (const [x, y, turn] of [[-9, -6, 0.2], [6, -8, -0.3], [-1, 3, 0.5], [11, 4, 0.1], [-11, 7, -0.2]]) {
    cube(ctx, x, y, 11, colors[0], colors[1], turn);
  }
}

function drawSeaKale(ctx, food) {
  if (food.chopped) {
    ctx.lineCap = 'round';
    const shreds = [[-12, -6, 0.4], [2, -9, -0.5], [10, -2, 0.9], [-6, 2, -0.2], [5, 6, 0.3], [-12, 8, 1.1], [13, 9, -0.7], [-1, -2, 1.4]];
    shreds.forEach(([x, y, turn], index) => {
      ctx.strokeStyle = index % 2 ? '#3f9a5c' : '#226b43';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(turn) * 7, y - Math.sin(turn) * 7);
      ctx.quadraticCurveTo(x + 2, y - 3, x + Math.cos(turn) * 7, y + Math.sin(turn) * 7);
      ctx.stroke();
    });
    return;
  }
  for (const [turn, length] of [[-0.7, 19], [0, 22], [0.7, 19]]) {
    ctx.save();
    ctx.translate(0, 13);
    ctx.rotate(turn);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i <= 6; i += 1) {
      const t = i / 6;
      ctx.lineTo(-(8 + (i % 2) * 3) * Math.sin(t * Math.PI), -length * t - 6);
    }
    for (let i = 6; i >= 0; i -= 1) {
      const t = i / 6;
      ctx.lineTo((8 + (i % 2) * 3) * Math.sin(t * Math.PI), -length * t - 6);
    }
    ctx.closePath();
    ctx.fillStyle = turn === 0 ? '#3f9a5c' : '#2c7a4a';
    ctx.fill();
    ctx.strokeStyle = '#17482c';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = '#a9dcae';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -length - 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawEgg(ctx, food) {
  if (food.cooked === SEARED) {
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.bezierCurveTo(-20, -14, -4, -16, 2, -13);
    ctx.bezierCurveTo(14, -18, 22, -4, 17, 5);
    ctx.bezierCurveTo(16, 16, -2, 15, -8, 12);
    ctx.bezierCurveTo(-16, 13, -19, 6, -18, 0);
    ctx.fillStyle = '#fffaf0';
    ctx.fill();
    ctx.strokeStyle = '#d2b98a';
    ctx.lineWidth = 2;
    ctx.stroke();
    blob(ctx, 1, -1, 7.5, 7.5, '#f7b21c', '#c7780c');
    blob(ctx, -1.5, -3.5, 2.6, 1.8, 'rgba(255,255,255,0.75)');
    return;
  }
  if (food.cooked === SIMMERED) {
    for (const x of [-9, 9]) {
      blob(ctx, x, 0, 8.5, 12, '#fffaf0', '#cdbf9f');
      blob(ctx, x, 1.5, 4.6, 5.2, '#f5b62a', '#d48a10');
    }
    return;
  }
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.bezierCurveTo(11, -15, 14, 2, 12, 7);
  ctx.bezierCurveTo(9, 16, -9, 16, -12, 7);
  ctx.bezierCurveTo(-14, 2, -11, -15, 0, -15);
  ctx.fillStyle = '#f3e1c2';
  ctx.fill();
  ctx.strokeStyle = '#b99a6b';
  ctx.lineWidth = 2;
  ctx.stroke();
  blob(ctx, -4, -6, 3, 5, 'rgba(255,255,255,0.6)', null, 0.4);
}

function drawSodaBread(ctx, food) {
  const toasted = food.cooked === SEARED;
  ctx.beginPath();
  ctx.moveTo(-17, 12);
  ctx.lineTo(-17, -3);
  ctx.bezierCurveTo(-18, -16, -4, -15, 0, -12);
  ctx.bezierCurveTo(4, -15, 18, -16, 17, -3);
  ctx.lineTo(17, 12);
  ctx.closePath();
  ctx.fillStyle = toasted ? '#dba052' : '#f3dfb4';
  ctx.fill();
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = toasted ? '#7c4718' : '#b17a3c';
  ctx.stroke();
  if (toasted) grillMarks(ctx, 9, 'rgba(92,46,12,0.8)');
  else for (const [x, y] of [[-8, -2], [6, -5], [0, 5], [9, 6], [-9, 7]]) blob(ctx, x, y, 1.5, 1.5, '#d6b983');
}

function drawTomato(ctx, food) {
  if (food.chopped && food.cooked === SIMMERED) {
    blob(ctx, 0, 1, 18, 12, '#c2371f', '#7f1d0e');
    for (const [x, y] of [[-8, -2], [4, -4], [9, 4], [-3, 5]]) blob(ctx, x, y, 3.6, 2.6, '#e8623f');
    blob(ctx, -6, -5, 5, 1.8, 'rgba(255,255,255,0.45)');
    return;
  }
  if (food.chopped) {
    for (const [x, y, turn] of [[-9, -5, 0.5], [8, -6, 2.2], [-6, 8, -0.6], [9, 7, 3.6]]) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(turn);
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI);
      ctx.closePath();
      ctx.fillStyle = '#e04a33';
      ctx.fill();
      ctx.strokeStyle = '#8d2313';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      blob(ctx, -3, 3.5, 1.5, 2, '#ffd9a0');
      blob(ctx, 3, 3.5, 1.5, 2, '#ffd9a0');
      ctx.restore();
    }
    return;
  }
  blob(ctx, 0, 1, 16, 15, '#dd4330', '#8d2313');
  blob(ctx, -6, -5, 5, 3, 'rgba(255,255,255,0.45)', null, -0.5);
  ctx.fillStyle = '#2f8a4c';
  for (let i = 0; i < 5; i += 1) {
    ctx.save();
    ctx.translate(0, -12);
    ctx.rotate((i - 2) * 0.62);
    ctx.beginPath();
    ctx.ellipse(0, 4, 2.2, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawBurnt(ctx) {
  blob(ctx, 0, 2, 17, 12, '#211a17', '#0d0a09', 0.2);
  for (const [x, y] of [[-6, -1], [5, 3], [1, -4]]) blob(ctx, x, y, 3, 2, '#3a2d26');
  ctx.strokeStyle = 'rgba(180,180,180,0.6)';
  ctx.lineWidth = 2;
  for (const x of [-7, 5]) {
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.quadraticCurveTo(x + 5, -15, x, -20);
    ctx.stroke();
  }
}

const PAINTERS = {
  mackerel: drawMackerel, potato: drawPotato, seakale: drawSeaKale,
  egg: drawEgg, sodabread: drawSodaBread, tomato: drawTomato,
};

/** Draw one food (or a recipe part, which has the same fields) centred at x, y. */
export function drawFood(ctx, food, x, y, size = 44) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 44, size / 44);
  ctx.lineJoin = 'round';
  if (food.cooked === BURNT) drawBurnt(ctx);
  else PAINTERS[food.ingredient](ctx, food);
  ctx.restore();
}

/** The gold star a perfectly timed cook earns. */
export function drawPerfectStar(ctx, x, y, radius) {
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const turn = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(x + Math.cos(turn) * r, y + Math.sin(turn) * r);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd24a';
  ctx.fill();
  ctx.strokeStyle = '#a86a00';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawVessel(ctx, vessel, radius) {
  ctx.beginPath();
  ctx.ellipse(3, radius * 0.16, radius, radius * 0.8, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fill();
  if (vessel === 'bowl') {
    blob(ctx, 0, 0, radius, radius * 0.8, '#2f6f8a', '#173f52');
    blob(ctx, 0, 0, radius * 0.86, radius * 0.67, '#f6efdf', '#c8b995');
    blob(ctx, 0, 1, radius * 0.76, radius * 0.57, '#e9c98a', null);
    return;
  }
  blob(ctx, 0, 0, radius, radius * 0.8, '#fbf6ea', '#b9ab8c');
  blob(ctx, 0, 0, radius * 0.72, radius * 0.56, '#efe6d0', '#d6c9a8');
}

const SPOTS = {
  1: [[0, 0]],
  2: [[-0.34, 0], [0.34, 0]],
  3: [[-0.36, 0.12], [0.36, 0.12], [0, -0.26]],
  4: [[-0.36, -0.2], [0.36, -0.2], [-0.34, 0.24], [0.34, 0.24]],
  5: [[-0.42, -0.18], [0.42, -0.18], [-0.36, 0.26], [0.36, 0.26], [0, 0]],
};

/** Draw a dish: its vessel and every part placed on it so far. */
export function drawDish(ctx, parts, x, y, radius = 46, vessel = 'plate') {
  ctx.save();
  ctx.translate(x, y);
  drawVessel(ctx, vessel, radius);
  const spots = SPOTS[Math.min(5, Math.max(1, parts.length))];
  parts.slice(0, 5).forEach((food, index) => {
    const [sx, sy] = spots[index];
    drawFood(ctx, food, sx * radius * 1.15, sy * radius * 1.05, radius * 0.72);
    if (food.perfect) drawPerfectStar(ctx, sx * radius * 1.15 + radius * 0.26, sy * radius * 1.05 - radius * 0.26, radius * 0.16);
  });
  ctx.restore();
}

/** Wisps of steam over hot food; phase animates them. */
export function drawSteam(ctx, x, y, phase, strength = 1) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,' + 0.5 * strength + ')';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i += 1) {
    const sway = Math.sin(phase * 2 + i * 1.7) * 5;
    ctx.beginPath();
    ctx.moveTo(x + i * 13, y);
    ctx.bezierCurveTo(x + i * 13 + sway, y - 10, x + i * 13 - sway, y - 20, x + i * 13 + sway * 0.6, y - 30);
    ctx.stroke();
  }
  ctx.restore();
}
