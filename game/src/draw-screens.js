// The screens around the service: the title card, the recipe book, the pause card and the
// end-of-night results with their stars.
import { VIEW, SHIFT, SCORE } from './config.js';
import { RECIPES, describePart, INGREDIENTS } from './recipes.js';
import { drawFood, drawDish, drawPerfectStar } from './draw-food.js';
import { AMBER, INK, PAPER, SANS, SERIF, plaque } from './draw-kitchen.js';

function dim(ctx, alpha) {
  ctx.fillStyle = 'rgba(8,24,30,' + alpha + ')';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function card(ctx, x, y, width, height) {
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.roundRect(x + 6, y + 10, width, height, 18);
  ctx.fill();
  ctx.fillStyle = PAPER;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 18);
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#b9763a';
  ctx.stroke();
}

function heading(ctx, text, x, y, size, color = INK) {
  ctx.font = '700 ' + size + 'px ' + SERIF;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

function line(ctx, text, x, y, size = 17, color = '#3c3320', align = 'center', weight = 600) {
  ctx.font = weight + ' ' + size + 'px ' + SANS;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text, x, y);
}

export function drawTitleScreen(ctx, clock, night) {
  dim(ctx, 0.62);
  card(ctx, 250, 168, 780, 420);
  heading(ctx, 'FOGHORN GALLEY', 640, 238, 58);
  line(ctx, 'Cook for the night boats from the kitchen under the lighthouse.', 640, 272, 19);
  const steps = [
    ['1', 'Read the ORDER BOARD', 'each ticket lists its parts'],
    ['2', 'Chop, sear and simmer', 'heat cooks while you chop'],
    ['3', 'Build the dish, ring THE PASS', 'fast dishes tip, streaks multiply'],
  ];
  steps.forEach(([number, title, sub], index) => {
    const x = 380 + index * 260;
    ctx.beginPath();
    ctx.arc(x, 330, 26, 0, Math.PI * 2);
    ctx.fillStyle = INK;
    ctx.fill();
    line(ctx, number, x, 340, 28, AMBER, 'center', 800);
    line(ctx, title, x, 384, 15, INK, 'center', 800);
    line(ctx, sub, x, 406, 14);
  });
  ['mackerel', 'potato', 'seakale', 'egg', 'sodabread', 'tomato'].forEach((ingredient, index) => {
    drawFood(ctx, { ingredient, chopped: false, cooked: 'raw' }, 440 + index * 80, 452 + Math.sin(clock * 2 + index) * 4, 50);
  });
  const blink = 0.75 + 0.25 * Math.sin(clock * 5);
  ctx.globalAlpha = blink;
  plaque(ctx, 'PRESS ENTER OR CLICK TO OPEN NIGHT ' + night, 640, 522, { size: 24, fill: '#c8432f', color: '#fff6e0' });
  ctx.globalAlpha = 1;
  line(ctx, 'WASD or arrows walk  /  E or Space use, hold to chop  /  click a station to walk there  /  R recipes', 640, 566, 14);
}

export function drawRecipeBook(ctx, night) {
  dim(ctx, 0.78);
  card(ctx, 60, 40, 1160, 640);
  heading(ctx, 'THE GALLEY RECIPE BOOK', 640, 96, 40);
  line(ctx, 'Six ingredients, six dishes. A chopped potato can go to the griddle for a hash or the pot for a chowder: prepare once, decide late.', 640, 126, 15);
  RECIPES.forEach((recipe, index) => {
    const x = 96 + (index % 3) * 372;
    const y = 150 + Math.floor(index / 3) * 250;
    const locked = recipe.night > night;
    ctx.fillStyle = locked ? '#e4d6b6' : '#fffaf0';
    ctx.beginPath();
    ctx.roundRect(x, y, 344, 232, 12);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#cdb98c';
    ctx.stroke();
    const foods = recipe.parts.map((recipePart) => ({ ...recipePart, kind: 'food', perfect: false }));
    ctx.globalAlpha = locked ? 0.45 : 1;
    drawDish(ctx, foods, x + 76, y + 78, 60, recipe.vessel);
    line(ctx, recipe.name, x + 150, y + 52, 22, INK, 'left', 800);
    line(ctx, locked ? 'joins the menu on night ' + recipe.night : 'on the menu', x + 150, y + 76, 14, locked ? '#c8432f' : '#1c6b3a', 'left', 700);
    line(ctx, recipe.parts.length + ' parts, pays ' + recipe.parts.length * SCORE.perPart + ' + tip', x + 150, y + 98, 14, '#3c3320', 'left');
    recipe.parts.forEach((recipePart, partIndex) => {
      const px = x + 50 + partIndex * 82;
      drawFood(ctx, recipePart, px, y + 168, 44);
      line(ctx, INGREDIENTS[recipePart.ingredient].name, px, y + 204, 12, INK, 'center', 800);
      line(ctx, describePart(recipePart), px, y + 220, 12, '#6b5a3a');
    });
    ctx.globalAlpha = 1;
  });
  line(ctx, 'R or Esc closes the book', 640, 668, 14);
}

export function drawPauseCard(ctx) {
  dim(ctx, 0.6);
  card(ctx, 420, 270, 440, 170);
  heading(ctx, 'GALLEY PAUSED', 640, 340, 40);
  line(ctx, 'P to carry on  /  R for the recipe book', 640, 392);
}

export function drawResults(ctx, shift, clock) {
  dim(ctx, 0.7);
  card(ctx, 330, 110, 620, 500);
  const ledger = shift.ledger;
  heading(ctx, 'NIGHT ' + shift.night + ' CLOSED', 640, 176, 44);
  line(ctx, shift.overReason, 640, 206, 17, '#6b5a3a');
  for (let index = 0; index < 3; index += 1) {
    const earned = index < shift.stars;
    ctx.globalAlpha = earned ? 1 : 0.22;
    drawPerfectStar(ctx, 560 + index * 80, 262 + (earned ? Math.sin(clock * 3 + index) * 3 : 0), 34);
    ctx.globalAlpha = 1;
  }
  heading(ctx, String(ledger.score), 640, 366, 64);
  line(ctx, 'SCORE', 640, 388, 14, '#6b5a3a', 'center', 800);
  const rows = [
    ['Dishes served', ledger.served],
    ['Boats lost', ledger.lost],
    ['Best streak', 'x' + ledger.bestCombo],
    ['Perfect cooks', ledger.perfects],
    ['Tips earned', ledger.tips],
    ['Burnt and scrapped', ledger.burnt],
  ];
  rows.forEach(([label, value], index) => {
    const x = 380 + (index % 2) * 270;
    const y = 432 + Math.floor(index / 2) * 34;
    line(ctx, label, x, y, 17, '#3c3320', 'left');
    line(ctx, String(value), x + 230, y, 19, INK, 'right', 800);
  });
  const more = shift.night < SHIFT.nights && shift.stars > 0;
  plaque(ctx, more ? 'ENTER: NIGHT ' + (shift.night + 1) + '     R: RETRY' : 'ENTER: COOK THIS NIGHT AGAIN', 640, 566, { size: 21, fill: '#c8432f', color: '#fff6e0' });
}
