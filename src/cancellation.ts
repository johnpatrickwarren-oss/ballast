// cancellation.ts — the cancellation curve (anti-late-backout pricing, component C4). Releasing a
// guarantee EARLY is cheap and credited (frees pooled capacity others can plan around); releasing
// LATE is expensive (no one can re-plan, and held-capacity-time has already accrued). Credit
// declines convexly toward the deadline and a late penalty grows, so net release cost is
// monotonically increasing in lateness — the dominant strategy is to release as soon as knowable.

export interface CancellationOpts {
  /** Convexity of the credit decline (>1 ⇒ credit holds early, then drops sharply). */
  readonly curvature: number;
  /** Additional linear penalty fraction accrued by the deadline. */
  readonly latePenalty: number;
}

export const DEFAULT_CANCELLATION: CancellationOpts = { curvature: 2, latePenalty: 0.25 };

function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/** Release credit as a fraction of the premium, given fraction of the term elapsed ∈ [0,1]. */
export function cancellationCredit(fracElapsed: number, opts: CancellationOpts = DEFAULT_CANCELLATION): number {
  const f = clamp01(fracElapsed);
  return 1 - Math.pow(f, opts.curvature) - opts.latePenalty * f;
}

/** Held-capacity-time cost: you pay for every unit-cycle you held, regardless of outcome. */
export function heldCapacityCost(fracHeld: number, amount: number, ratePerTerm: number): number {
  return clamp01(fracHeld) * amount * ratePerTerm;
}

/** Net cost of releasing `amount` at `fracElapsed`: accrued holding cost minus recovered credit. */
export function netReleaseCost(
  amount: number,
  fracElapsed: number,
  premium: number,
  ratePerTerm: number,
  opts: CancellationOpts = DEFAULT_CANCELLATION,
): number {
  return heldCapacityCost(fracElapsed, amount, ratePerTerm) - premium * cancellationCredit(fracElapsed, opts);
}
