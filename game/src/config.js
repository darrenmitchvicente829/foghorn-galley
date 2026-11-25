// Foghorn Galley: every tunable number of the game in one place.

/** The canvas is drawn at this logical size and scaled to fit the window. */
export const VIEW = { width: 1280, height: 720 };

/** The strip of floor the cook can walk on, between the back counter and the front counter. */
export const FLOOR = { left: 56, right: 1224, top: 358, bottom: 532 };

export const COOK = { speed: 330, reach: 86, radius: 20 };

/** Seconds of work at each station. */
export const TIMING = {
  chopStrokes: 5,
  chopRepeat: 0.15,
  searSeconds: 5,
  searBurnSeconds: 7,
  simmerSeconds: 5,
  simmerBurnSeconds: 10,
  perfectWindow: 2.5,
  passSeconds: 2,
};

/** One shift (a "night") of service. */
export const SHIFT = { seconds: 180, lanterns: 3, maxTickets: 4, nights: 3 };

/** How the rush grows through a shift: the fog thickens and boats arrive faster. */
export const RUSH = {
  firstGap: 3,
  calmGap: 17,
  stormGap: 8,
  calmPatience: 62,
  stormPatience: 42,
  nightBonus: 0.12,
};

export const SCORE = {
  perPart: 20,
  tipMax: 30,
  perfectBonus: 10,
  comboStep: 0.25,
  comboMax: 3,
  starGoals: [[260, 520, 800], [340, 680, 1020], [420, 820, 1240]],
};

export const STEP = 1 / 60;
