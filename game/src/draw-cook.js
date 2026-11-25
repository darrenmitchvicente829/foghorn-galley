// The cook in the yellow sou'wester, what the hands carry, the planned route on the floor and
// the words that float up when something happens.
import { bestOrderForPlate } from './orders.js';
import { drawFood, drawDish } from './draw-food.js';
import { AMBER, INK, SANS, plaque } from './draw-kitchen.js';

/** The dashed line from the cook through the next stops of the plan, each stop numbered. */
export function drawRoute(ctx, shift, clock) {
  const route = shift.route;
  if (!route || route.steps.length === 0) return;
  const stops = [];
  for (const item of route.steps) {
    if (stops.length && stops[stops.length - 1].station === item.station) continue;
    stops.push(item);
    if (stops.length === 3) break;
  }
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([4, 14]);
  ctx.lineDashOffset = -clock * 40;
  ctx.lineWidth = 7;
  ctx.strokeStyle = 'rgba(13,34,41,0.55)';
  for (let pass = 0; pass < 2; pass += 1) {
    ctx.beginPath();
    ctx.moveTo(shift.cook.x, shift.cook.y + 6);
    for (const stop of stops) ctx.lineTo(stop.station.standX, stop.station.standY + (stop.station.side === 'back' ? -4 : 12));
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.strokeStyle = AMBER;
  }
  ctx.setLineDash([]);
  stops.forEach((stop, index) => {
    const x = stop.station.standX;
    const y = stop.station.standY + (stop.station.side === 'back' ? -4 : 12);
    ctx.beginPath();
    ctx.arc(x, y, index === 0 ? 15 : 12, 0, Math.PI * 2);
    ctx.fillStyle = index === 0 ? AMBER : INK;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = index === 0 ? INK : AMBER;
    ctx.stroke();
    ctx.fillStyle = index === 0 ? INK : AMBER;
    ctx.font = '800 ' + (index === 0 ? 17 : 14) + 'px ' + SANS;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), x, y + 1);
  });
  ctx.restore();
}

function drawCarried(ctx, shift, x, y) {
  const carry = shift.cook.carry;
  if (!carry) return;
  if (carry.kind === 'plate') {
    const fit = bestOrderForPlate(shift.board, carry.parts);
    drawDish(ctx, carry.parts, x, y, 36, fit ? fit.ticket.recipe.vessel : 'plate');
    return;
  }
  ctx.beginPath();
  ctx.ellipse(x, y + 4, 25, 20, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(246,233,204,0.92)';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  drawFood(ctx, carry, x, y + 4, 36);
}

export function drawCook(ctx, shift, clock) {
  const cook = shift.cook;
  const bob = cook.moving ? Math.abs(Math.sin(cook.stride)) * 5 : Math.sin(clock * 2.4) * 1.5;
  const step = cook.moving ? Math.sin(cook.stride) * 8 : 0;
  ctx.save();
  ctx.translate(cook.x, cook.y);
  ctx.beginPath();
  ctx.ellipse(0, 20, 30, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  ctx.fillStyle = '#22323a';
  ctx.beginPath();
  ctx.roundRect(-15 + step * 0.5, 2, 12, 20, 5);
  ctx.roundRect(3 - step * 0.5, 2, 12, 20, 5);
  ctx.fill();
  ctx.translate(0, -bob);
  ctx.beginPath();
  ctx.roundRect(-24, -44, 48, 52, 16);
  ctx.fillStyle = '#fbf6ea';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(-16, -26, 32, 34, 6);
  ctx.fillStyle = '#1f5560';
  ctx.fill();
  ctx.fillStyle = AMBER;
  ctx.fillRect(-8, -14, 16, 4);
  const armSwing = cook.swing * 22;
  ctx.fillStyle = '#fbf6ea';
  ctx.beginPath();
  ctx.roundRect(-34, -38 + (cook.carry ? -8 : 0), 13, 30, 6);
  ctx.roundRect(21, -38 + (cook.carry ? -8 : 0) + armSwing * 0.6, 13, 30, 6);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -58, 19, 0, Math.PI * 2);
  ctx.fillStyle = '#eec39a';
  ctx.fill();
  ctx.stroke();
  if (!cook.lookUp) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(-6 + cook.facing * 3, -58, 2.6, 0, Math.PI * 2);
    ctx.arc(7 + cook.facing * 3, -58, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a8553a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cook.facing * 3, -52, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.ellipse(0, -68, 29, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f2c230';
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -70, 18, Math.PI, 0);
  ctx.closePath();
  ctx.fillStyle = '#f7d04a';
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  drawCarried(ctx, shift, cook.x + cook.facing * 4, cook.y - 12 - bob);
}

const TONES = { good: '#9df0b0', bad: '#ff9a86', gold: '#ffd24a', plain: '#f6e9cc' };

export function drawFloaters(ctx, shift) {
  for (const floater of shift.floaters) {
    const rise = floater.age * 34;
    ctx.globalAlpha = Math.min(1, (1.4 - floater.age) * 2.5);
    plaque(ctx, floater.text, floater.x, Math.max(174, floater.y - 44 - rise), {
      size: floater.tone === 'gold' ? 22 : 15,
      fill: 'rgba(13,34,41,0.9)',
      color: TONES[floater.tone] || TONES.plain,
    });
    ctx.globalAlpha = 1;
  }
}
