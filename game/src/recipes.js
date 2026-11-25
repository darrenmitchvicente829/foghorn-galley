// The pantry and the menu of Foghorn Galley. A recipe is a list of parts; a part is an ingredient
// in one prepared state (chopped or whole, and raw, seared on the griddle or simmered in the pot).
// The same six ingredients combine into every dish, so one prepared item can save two orders.

export const RAW = 'raw';
export const SEARED = 'seared';
export const SIMMERED = 'simmered';
export const BURNT = 'burnt';

export const INGREDIENTS = {
  mackerel: { name: 'Mackerel', canChop: false, canSear: true, canSimmer: true },
  potato: { name: 'Potato', canChop: true, canSear: true, canSimmer: true },
  seakale: { name: 'Sea kale', canChop: true, canSear: false, canSimmer: false },
  egg: { name: 'Egg', canChop: false, canSear: true, canSimmer: true },
  sodabread: { name: 'Soda bread', canChop: false, canSear: true, canSimmer: false },
  tomato: { name: 'Tomato', canChop: true, canSear: false, canSimmer: true },
};

export const PANTRY_ORDER = ['mackerel', 'potato', 'seakale', 'egg', 'sodabread', 'tomato'];

const part = (ingredient, chopped, cooked) => ({ ingredient, chopped, cooked });

export const RECIPES = [
  {
    id: 'harbour-toast', name: 'Harbour Toast', vessel: 'plate', night: 1,
    parts: [part('sodabread', false, SEARED), part('mackerel', false, SEARED), part('tomato', true, RAW)],
  },
  {
    id: 'gulls-nest-hash', name: "Gull's Nest Hash", vessel: 'plate', night: 1,
    parts: [part('potato', true, SEARED), part('egg', false, SEARED), part('seakale', true, RAW)],
  },
  {
    id: 'keepers-chowder', name: "Keeper's Chowder", vessel: 'bowl', night: 1,
    parts: [part('potato', true, SIMMERED), part('mackerel', false, SIMMERED), part('seakale', true, RAW)],
  },
  {
    id: 'tidepool-salad', name: 'Tidepool Salad', vessel: 'bowl', night: 2,
    parts: [part('seakale', true, RAW), part('tomato', true, RAW), part('egg', false, SIMMERED)],
  },
  {
    id: 'lantern-soup', name: 'Lantern Soup', vessel: 'bowl', night: 2,
    parts: [part('tomato', true, SIMMERED), part('sodabread', false, SEARED), part('seakale', true, RAW)],
  },
  {
    id: 'storm-skillet', name: 'Storm Skillet', vessel: 'plate', night: 3,
    parts: [part('mackerel', false, SEARED), part('potato', true, SEARED), part('egg', false, SEARED), part('tomato', true, RAW)],
  },
];

export function recipesForNight(night) {
  return RECIPES.filter((recipe) => recipe.night <= night);
}

export function makeFood(ingredient) {
  return { kind: 'food', ingredient, chopped: false, cooked: RAW, perfect: false };
}

export function foodMatchesPart(food, recipePart) {
  return food.ingredient === recipePart.ingredient && food.chopped === recipePart.chopped && food.cooked === recipePart.cooked;
}

/** The recipe parts a plate still lacks; null when the plate holds something the recipe never uses. */
export function missingParts(plateParts, recipe) {
  const left = recipe.parts.slice();
  for (const food of plateParts) {
    const index = left.findIndex((recipePart) => foodMatchesPart(food, recipePart));
    if (index === -1) return null;
    left.splice(index, 1);
  }
  return left;
}

export function dishMatchesRecipe(plateParts, recipe) {
  const left = missingParts(plateParts, recipe);
  return left !== null && left.length === 0;
}

/** True when this food, finished or not, is on its way to being the given part. */
export function foodCanBecomePart(food, recipePart) {
  if (food.ingredient !== recipePart.ingredient || food.cooked === BURNT) return false;
  if (food.chopped && !recipePart.chopped) return false;
  if (food.cooked !== RAW && food.cooked !== recipePart.cooked) return false;
  if (food.cooked !== RAW && food.chopped !== recipePart.chopped) return false;
  return true;
}

/** The word a ticket prints under a part: how it has to be prepared. */
export function describePart(recipePart) {
  const steps = [];
  if (recipePart.chopped) steps.push('chop');
  if (recipePart.cooked === SEARED) steps.push('sear');
  if (recipePart.cooked === SIMMERED) steps.push('simmer');
  return steps.join(' + ') || 'whole';
}

export function describeFood(food) {
  const name = INGREDIENTS[food.ingredient].name;
  if (food.cooked === BURNT) return 'Burnt ' + name.toLowerCase();
  const words = [];
  if (food.chopped) words.push('chopped');
  if (food.cooked !== RAW) words.push(food.cooked);
  return words.length ? name + ', ' + words.join(' & ') : name;
}
