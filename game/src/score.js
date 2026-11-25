// Scoring: what a served dish pays, how the streak multiplies it, and the stars of a shift.
import { SCORE } from './config.js';

export function openLedger() {
  return { score: 0, tips: 0, served: 0, lost: 0, combo: 0, bestCombo: 0, perfects: 0, burnt: 0 };
}

export function comboMultiplier(combo) {
  return Math.min(SCORE.comboMax, 1 + SCORE.comboStep * combo);
}

/** Pay for a dish handed over the pass: parts, a tip for speed, a bonus for each perfect cook. */
export function scoreServedDish(ledger, ticket, plateParts) {
  const base = SCORE.perPart * ticket.recipe.parts.length;
  const tip = Math.round(SCORE.tipMax * Math.max(0, ticket.patience / ticket.patienceMax));
  const perfects = plateParts.filter((food) => food.perfect).length;
  const multiplier = comboMultiplier(ledger.combo);
  const total = Math.round((base + tip + perfects * SCORE.perfectBonus) * multiplier);
  ledger.score += total;
  ledger.tips += tip;
  ledger.served += 1;
  ledger.perfects += perfects;
  ledger.combo += 1;
  ledger.bestCombo = Math.max(ledger.bestCombo, ledger.combo);
  return { total, tip, perfects, multiplier };
}

export function recordLostOrder(ledger) {
  ledger.lost += 1;
  ledger.combo = 0;
}

export function starsForShift(score, night) {
  const goals = SCORE.starGoals[Math.min(night, SCORE.starGoals.length) - 1];
  return goals.filter((goal) => score >= goal).length;
}

export function nextStarGoal(score, night) {
  const goals = SCORE.starGoals[Math.min(night, SCORE.starGoals.length) - 1];
  return goals.find((goal) => score < goal) ?? null;
}
