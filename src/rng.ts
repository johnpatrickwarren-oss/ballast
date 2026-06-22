// rng.ts — seeded deterministic PRNG (mulberry32) + samplers.
//
// Determinism is a Ballast invariant (replay-clean): same seed → byte-identical streams.
// No Math.random anywhere in the scored path; all randomness threads through an Rng.

/** A deterministic uniform source. `next()` returns a value in [0, 1). */
export interface Rng {
  next(): number;
}

/** mulberry32 — small, fast, well-distributed 32-bit PRNG. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next(): number {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** Uniform in [lo, hi). */
export function uniform(rng: Rng, lo: number, hi: number): number {
  return lo + (hi - lo) * rng.next();
}

/** Standard-normal-scaled draw via Box–Muller. */
export function normal(rng: Rng, mean: number, sd: number): number {
  const u1 = Math.max(rng.next(), Number.EPSILON);
  const u2 = rng.next();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + sd * z;
}

/**
 * Pareto(α) draw with scale `xm`, α > 1 (finite mean). Heavy right tail; the verified
 * pooling-degradation driver. Returns a value ≥ xm.
 */
export function pareto(rng: Rng, alpha: number, xm: number): number {
  const u = Math.max(rng.next(), Number.EPSILON);
  return xm / Math.pow(u, 1 / alpha);
}

/** Bernoulli(p). */
export function bernoulli(rng: Rng, p: number): boolean {
  return rng.next() < p;
}
