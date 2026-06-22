// pooling.ts — central-buffer risk-pooling de-rating (component C5).
//
// Verified facts this encodes:
//   • Eppen (1979): pooling N i.i.d. demands cuts safety stock by √N (decentralized ∝ N).
//   • Eppen covariance: the benefit shrinks as positive correlation rises, → 1 (no benefit) at
//     ρ = 1; it exceeds √N when demands are negatively correlated.
//   • Bimpikis–Markakis (2016): heavy-tailed (stable, α ∈ (1,2)) demand degrades √N to
//     n^((α−1)/α), collapsing toward 1 as α → 1.
//
// Unified model: benefit B = N_eff^((α−1)/α), with N_eff = N / (1 + (N−1)ρ) (the equicorrelation
// effective number of independent streams). B reduces EXACTLY to both verified limits
// (ρ=0,α=2 ⇒ √N; ρ=1 ⇒ 1; α→1 ⇒ 1). The COMPOSITION — applying the tail exponent to the
// correlation-reduced effective N — is the model, not a single cited theorem.
//
// Design consequence: GPU demand is BOTH correlated (shared launches) AND heavy-tailed (bursty),
// so assuming the naive √N over-credits pooling and UNDER-SIZES the central buffer. Sizing must
// use the de-rated benefit.

import { invNormCdf } from './stats';

/** Equicorrelation effective stream count. ρ=0 ⇒ N; ρ=1 ⇒ 1. Floored at 1. */
export function effectiveN(n: number, rho: number): number {
  const denom = 1 + (n - 1) * rho;
  return denom > 0 ? Math.max(n / denom, 1) : n;
}

/** Pooling exponent from the tail index. α=2 ⇒ 1/2 (Eppen); α→1 ⇒ 0 (no pooling). */
export function poolingExponent(alpha: number): number {
  return (alpha - 1) / alpha;
}

/** Pooling benefit B = ratio of decentralized to pooled buffer. ≥ 1. */
export function poolingBenefit(n: number, rho: number, alpha: number): number {
  return Math.pow(effectiveN(n, rho), poolingExponent(alpha));
}

/** Newsvendor safety-stock multiplier z = Φ⁻¹(Cu/(Cu+Co)). */
export function criticalFractileZ(cu: number, co: number): number {
  return invNormCdf(cu / (cu + co));
}

/** Decentralized total buffer: each workload holds its own safety stock z·scale. */
export function decentralizedBuffer(scales: readonly number[], z: number): number {
  let total = 0;
  for (const scale of scales) total += z * scale;
  return total;
}

/** Honest de-rated central buffer = decentralized / de-rated benefit. */
export function pooledBuffer(scales: readonly number[], z: number, rho: number, alpha: number): number {
  return decentralizedBuffer(scales, z) / poolingBenefit(scales.length, rho, alpha);
}

/** The trap: a central buffer that wrongly assumes √N pooling (ρ=0, α=2). Under-sizes under
 *  correlation/heavy tails. */
export function naivePooledBuffer(scales: readonly number[], z: number): number {
  return decentralizedBuffer(scales, z) / Math.sqrt(Math.max(scales.length, 1));
}

/** Fractional buffer saving from pooling, 1 − pooled/decentralized ∈ [0, 1). */
export function poolingSaving(n: number, rho: number, alpha: number): number {
  return 1 - 1 / poolingBenefit(n, rho, alpha);
}
