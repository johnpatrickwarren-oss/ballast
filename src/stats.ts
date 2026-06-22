// stats.ts — small pure numeric helpers. No dependencies.

// Acklam's rational approximation to the inverse normal CDF (used for the newsvendor
// critical-fractile multiplier z = Φ⁻¹(service level)). Accurate to ~1e-9 on (0,1).
const A = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239e0];
const B = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
const C = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0, -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0];
const D = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0, 3.754408661907416e0];

/** Horner polynomial evaluation: coeffs[0]·x^(n-1) + … + coeffs[n-1]. */
export function horner(coeffs: readonly number[], x: number): number {
  let r = 0;
  for (const c of coeffs) r = r * x + c;
  return r;
}

/** Inverse standard-normal CDF, p ∈ (0,1). Φ⁻¹(0.5)=0, Φ⁻¹(0.975)≈1.96. */
export function invNormCdf(p: number): number {
  const plow = 0.02425;
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p < plow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return horner(C, q) / horner([...D, 1], q);
  }
  if (p <= 1 - plow) {
    const q = p - 0.5;
    const r = q * q;
    return (horner(A, r) * q) / horner([...B, 1], r);
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -horner(C, q) / horner([...D, 1], q);
}

/** Arithmetic mean. Empty → 0. */
export function mean(xs: readonly number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

/** Population standard deviation. Empty/singleton → 0. */
export function std(xs: readonly number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) * (x - m);
  return Math.sqrt(s / xs.length);
}

/**
 * Linear-interpolated quantile, q ∈ [0, 1]. Does not mutate input.
 * Used for the per-cycle "peak need" the reservation is sized against.
 */
export function quantile(xs: readonly number[], q: number): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  if (q <= 0) return sorted[0];
  if (q >= 1) return sorted[sorted.length - 1];
  const pos = q * (sorted.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (pos - lo) * (sorted[hi] - sorted[lo]);
}
