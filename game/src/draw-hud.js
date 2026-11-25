// The top of the screen, read in a glance: the order board with its tickets, the shift timer,
// the score and streak, the three lanterns (lives) and the fog gauge that shows the rush growing;
// and the strip along the bottom with the route's next stops and the controls.
import { VIEW, SHIFT } from './config.js';
import { describePart } from './recipes.js';
import { focusedOrder } from './orders.js';
import { comboMultiplier, nextStarGoal } from './score.js';
import { rushName } from './rush.js';
import { timeLeft, shiftRush } from './shift.js';
import { drawFood, drawDish } from './draw-food.js';
import { AMBER, INK, PAPER, SANS, SERIF, plaque } from './draw-kitchen.js';

export const TICKET = { left: 226, top: 34, width: 188, height: 108, gap: 8 };

export function ticketRect(index) {
  return { x: TICKET.left + index * (TICKET.width + TICKET.gap), y: TICKET.top, width: TICKET.width, height: TICKET.height };
}

/** The index of the ticket under a canvas point (a click picks the ticket to route for), or -1. */
export function ticketAtPoint(x, y, count) {
  for (let index = 0; index < count; index += 1) {
    const rect = ticketRect(index);
    if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) return index;
  }
  return -1;
}

export function formatClock(seconds) {
  const whole = Math.ceil(seconds);
  return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0');
}

function drawTicket(ctx, ticket, index, focused, clock) {
  const rect = ticketRect(index);
  const fraction = Math.max(0, ticket.patience / ticket.patienceMax);
  const urgent = fraction < 0.3 && !ticket.serving;
  const slide = Math.max(0, 1 - ticket.age * 4) * -30;
  const shake = urgent ? Math.sin(clock * 30) * 1.5 : 0;
  ctx.save();
  ctx.translate(rect.x + shake, rect.y + slide);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.roundRect(3, 5, rect.width, rect.height, 8);
  ctx.fill();
  ctx.fillStyle = urgent ? '#ffd9c9' : PAPER;
  ctx.beginPath();
  ctx.roundRect(0, 0, rect.width, rect.height, 8);
  ctx.fill();
  if (focused) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = AMBER;
    ctx.stroke();
  }
  ctx.fillStyle = '#c8432f';
  ctx.beginPath();
  ctx.arc(rect.width / 2, 3, 6, 0, Math.PI * 2);
  ctx.fill();
  const foods = ticket.recipe.parts.map((recipePart) => ({ ...recipePart, kind: 'food', perfect: false }));
  drawDish(ctx, foods, 38, 36, 30, ticket.recipe.vessel);
  ctx.fillStyle = INK;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '700 16px ' + SERIF;
  const words = ticket.recipe.name.split(' ');
  const half = Math.ceil(words.length / 2);
  ctx.fillText(words.slice(0, half).join(' '), 74, 27);
  ctx.fillText(words.slice(half).join(' '), 74, 45);
  ctx.font = '600 11px ' + SANS;
  ctx.fillStyle = '#6b5a3a';
  ctx.fillText('#' + ticket.id + ' ' + ticket.boat, 74, 59);
  const count = ticket.recipe.parts.length;
  const spacing = (rect.width - 12) / count;
  ticket.recipe.parts.forEach((recipePart, partIndex) => {
    const px = 6 + spacing * (partIndex + 0.5);
    drawFood(ctx, recipePart, px, 76, 24);
    ctx.font = '700 ' + (count > 3 ? 8 : 9) + 'px ' + SANS;
    ctx.fillStyle = '#6b5a3a';
    ctx.textAlign = 'center';
    ctx.fillText(describePart(recipePart).replace(' + ', '+'), px, 95);
  });
  ctx.fillStyle = 'rgba(13,34,41,0.2)';
  ctx.beginPath();
  ctx.roundRect(8, rect.height - 9, rect.width - 50, 6, 3);
  ctx.fill();
  ctx.fillStyle = fraction > 0.5 ? '#2f9a5c' : fraction > 0.3 ? '#e09a1c' : '#d23a22';
  ctx.beginPath();
  ctx.roundRect(8, rect.height - 9, Math.max(6, (rect.width - 50) * fraction), 6, 3);
  ctx.fill();
  ctx.font = '800 13px ' + SANS;
  ctx.fillStyle = urgent ? '#d23a22' : INK;
  ctx.textAlign = 'right';
  ctx.fillText(Math.ceil(ticket.patience) + 's', rect.width - 8, rect.height - 3);
  if (ticket.serving) {
    ctx.fillStyle = 'rgba(246,233,204,0.7)';
    ctx.beginPath();
    ctx.roundRect(0, 0, rect.width, rect.height, 8);
    ctx.fill();
    ctx.save();
    ctx.translate(rect.width / 2, rect.height / 2);
    ctx.rotate(-0.12);
    plaque(ctx, 'SERVED', 0, 0, { size: 24, fill: '#1c6b3a', stroke: '#9df0b0' });
    ctx.restore();
  }
  ctx.restore();
}

function drawOrderBoard(ctx, shift, clock) {
  ctx.fillStyle = '#17343c';
  ctx.beginPath();
  ctx.roundRect(216, 8, 804, 138, 10);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#b9763a';
  ctx.stroke();
  ctx.font = '800 15px ' + SANS;
  ctx.fillStyle = AMBER;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('ORDER BOARD', 230, 21);
  ctx.font = '600 12px ' + SANS;
  ctx.fillStyle = 'rgba(246,233,204,0.75)';
  ctx.textAlign = 'right';
  ctx.fillText('click a ticket or press Q to plan its route', 1008, 21);
  const focus = focusedOrder(shift.board);
  for (let index = 0; index < SHIFT.maxTickets; index += 1) {
    const ticket = shift.board.tickets[index];
    if (ticket) {
      drawTicket(ctx, ticket, index, ticket === focus, clock);
      continue;
    }
    const rect = ticketRect(index);
    ctx.strokeStyle = 'rgba(246,233,204,0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.roundRect(rect.x, rect.y, rect.width, rect.height, 8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = 'italic 14px ' + SERIF;
    ctx.fillStyle = 'rgba(246,233,204,0.45)';
    ctx.textAlign = 'center';
    ctx.fillText('awaiting a boat', rect.x + rect.width / 2, rect.y + rect.height / 2);
  }
}

function drawLantern(ctx, x, y, lit, flash) {
  ctx.fillStyle = '#b9763a';
  ctx.fillRect(x - 7, y - 15, 14, 4);
  ctx.fillRect(x - 9, y + 11, 18, 4);
  ctx.beginPath();
  ctx.roundRect(x - 8, y - 11, 16, 22, 4);
  ctx.fillStyle = lit ? AMBER : '#2c444b';
  ctx.fill();
  if (lit) {
    ctx.beginPath();
    ctx.arc(x, y, 17 + flash * 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,182,64,0.22)';
    ctx.fill();
  }
}

function drawTitleBlock(ctx, shift) {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = AMBER;
  ctx.font = '700 25px ' + SERIF;
  ctx.fillText('FOGHORN', 18, 36);
  ctx.fillStyle = PAPER;
  ctx.fillText('GALLEY', 18, 62);
  const rush = shiftRush(shift);
  ctx.font = '700 12px ' + SANS;
  ctx.fillStyle = 'rgba(246,233,204,0.8)';
  ctx.fillText('NIGHT ' + shift.night + ' OF ' + SHIFT.nights, 18, 84);
  for (let index = 0; index < SHIFT.lanterns; index += 1) {
    drawLantern(ctx, 150 + index * 24, 76, index < shift.lanterns, shift.lanternFlash);
  }
  ctx.fillStyle = '#17343c';
  ctx.beginPath();
  ctx.roundRect(18, 110, 184, 16, 8);
  ctx.fill();
  const fog = ctx.createLinearGradient(18, 0, 202, 0);
  fog.addColorStop(0, '#62e07a');
  fog.addColorStop(0.55, AMBER);
  fog.addColorStop(1, '#ff5a3c');
  ctx.fillStyle = fog;
  ctx.beginPath();
  ctx.roundRect(18, 110, Math.max(14, 184 * rush), 16, 8);
  ctx.fill();
  ctx.font = '800 12px ' + SANS;
  ctx.fillStyle = PAPER;
  ctx.fillText('RUSH: ' + rushName(rush), 18, 104);
  ctx.font = '600 11px ' + SANS;
  ctx.fillStyle = 'rgba(246,233,204,0.7)';
  ctx.fillText('more fog, faster boats', 18, 142);
}

function drawTimerBlock(ctx, shift, clock) {
  const left = timeLeft(shift);
  const fraction = left / shift.seconds;
  const hurry = left < 30;
  const cx = 1076;
  const cy = 62;
  ctx.beginPath();
  ctx.arc(cx, cy, 44, 0, Math.PI * 2);
  ctx.fillStyle = '#17343c';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#b9763a';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, 37, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * fraction);
  ctx.closePath();
  ctx.fillStyle = hurry ? '#ff5a3c' : AMBER;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 22, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
  const hand = -Math.PI / 2 + Math.PI * 2 * fraction;
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(hand) * 18, cy + Math.sin(hand) * 18);
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 13px ' + SANS;
  ctx.fillStyle = AMBER;
  ctx.fillText('SHIFT TIMER', 1132, 30);
  const pulse = hurry ? 1 + 0.06 * Math.sin(clock * 10) : 1;
  ctx.font = '800 ' + Math.round(50 * pulse) + 'px ' + SANS;
  ctx.fillStyle = hurry ? '#ff8a70' : PAPER;
  ctx.fillText(formatClock(left), 1130, 78);
  ctx.font = '700 12px ' + SANS;
  ctx.fillStyle = 'rgba(246,233,204,0.8)';
  ctx.fillText('SCORE', 1036, 120);
  ctx.font = '800 26px ' + SANS;
  ctx.fillStyle = PAPER;
  ctx.fillText(String(shift.ledger.score).padStart(4, '0'), 1036, 146);
  const combo = shift.ledger.combo;
  ctx.font = '700 12px ' + SANS;
  ctx.fillStyle = 'rgba(246,233,204,0.8)';
  ctx.fillText('STREAK', 1150, 120);
  ctx.font = '800 26px ' + SANS;
  ctx.fillStyle = combo > 0 ? '#ffd24a' : 'rgba(246,233,204,0.5)';
  ctx.fillText('x' + comboMultiplier(combo).toFixed(2).replace(/\.?0+$/, ''), 1150, 146);
  const goal = nextStarGoal(shift.ledger.score, shift.night);
  ctx.font = '600 11px ' + SANS;
  ctx.fillStyle = 'rgba(246,233,204,0.7)';
  ctx.fillText(goal ? 'next star at ' + goal : 'three stars earned', 1134, 98);
}

function drawRouteStrip(ctx, shift) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 656, VIEW.width, 64);
  ctx.fillStyle = '#b9763a';
  ctx.fillRect(0, 654, VIEW.width, 3);
  const route = shift.route;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  let x = 18;
  if (route && route.steps.length) {
    ctx.font = '800 13px ' + SANS;
    ctx.fillStyle = AMBER;
    ctx.fillText('ROUTE FOR #' + route.ticket.id + ' ' + route.ticket.recipe.name.toUpperCase(), x, 670);
    route.steps.slice(0, 4).forEach((item, index) => {
      ctx.font = '700 15px ' + SANS;
      const label = index + 1 + '  ' + item.text;
      const width = ctx.measureText(label).width + 22;
      if (x + width > 830) return;
      plaque(ctx, label, x + width / 2, 698, { size: 15, fill: index === 0 ? AMBER : '#17343c', color: index === 0 ? INK : PAPER });
      x += width + 10;
    });
  } else {
    ctx.font = 'italic 16px ' + SERIF;
    ctx.fillStyle = 'rgba(246,233,204,0.7)';
    ctx.fillText('No boat at the pass. Get ahead: chop something.', x, 688);
  }
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.font = '700 13px ' + SANS;
  ctx.fillStyle = PAPER;
  ctx.fillText('WASD / ARROWS walk     E or SPACE use, hold to chop     CLICK a station to go', 1262, 676);
  ctx.fillStyle = 'rgba(246,233,204,0.7)';
  ctx.fillText('Q next ticket     R recipes     P pause     M mute', 1262, 700);
}

/** What the use key will do at the station in reach, written over the cook's head. */
function drawUsePrompt(ctx, shift) {
  const station = shift.reach;
  if (!station || shift.cook.walkTo) return;
  const next = shift.route && shift.route.steps[0];
  const planned = next && next.station === station;
  if (!planned && !shift.cook.carry && station.type !== 'crate') return;
  const text = planned ? '[E] ' + next.text : station.type === 'crate' ? '[E] Take' : '[E] Use ' + station.label.toLowerCase();
  plaque(ctx, text, shift.cook.x, shift.cook.y - 108, { size: 14, fill: INK, stroke: AMBER });
}

export function drawHud(ctx, shift, clock) {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, VIEW.width, 152);
  ctx.fillStyle = '#b9763a';
  ctx.fillRect(0, 150, VIEW.width, 4);
  drawTitleBlock(ctx, shift);
  drawOrderBoard(ctx, shift, clock);
  drawTimerBlock(ctx, shift, clock);
  drawRouteStrip(ctx, shift);
  drawUsePrompt(ctx, shift);
}
