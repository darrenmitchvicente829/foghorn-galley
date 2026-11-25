// A small seeded random generator, so a shift (and a screenshot) can be replayed from its seed.

export function makeRandom(seed) {
  let a = (seed >>> 0) || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    between: (low, high) => low + (high - low) * next(),
    pick: (list) => list[Math.floor(next() * list.length)],
  };
}
