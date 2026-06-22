// congestion.ts — objective sanctioned utilization from demand variability (component C3).
//
// Queueing theory (Kingman heavy-traffic; Halfin–Whitt): required headroom rises with demand
// variability, so the legitimate utilization a class can sustain under a latency SLO FALLS as
// its coefficient of variation rises. This makes "legitimate headroom" a computed quantity, not
// an opinion — a bursty class is *objectively* entitled to a lower utilization bar than a steady
// one. Model: sanctionedRatio = 1 / (1 + k·CV). (k≈1 reproduces the hand-set H1 class ratios.)

import { mean, std, quantile } from './stats';

export function coefficientOfVariation(values: readonly number[]): number {
  const m = mean(values);
  return m > 0 ? std(values) / m : 0;
}

/**
 * Robust relative dispersion = (P84 − P50) / P50. ≈ σ/median for a normal, but bounded under
 * heavy tails (it reads a quantile, not the variance the Pareto tail blows up). This is what
 * feeds the sanctioned ratio so a heavy-tailed class gets a sane — not collapsed — bar.
 */
export function robustDispersion(values: readonly number[]): number {
  const med = quantile(values, 0.5);
  const upper = quantile(values, 0.84); // ~ +1σ for a normal
  return med > 0 ? Math.max(upper - med, 0) / med : 0;
}

/** Sustainable utilization given a dispersion. Higher dispersion ⇒ lower ratio. */
export function computeSanctionedRatio(cv: number, k = 1.0): number {
  return 1 / (1 + k * Math.max(cv, 0));
}

/** Convenience: sanctioned ratio directly from a demand series (robust dispersion). */
export function sanctionedRatioForSeries(values: readonly number[], k = 1.0): number {
  return computeSanctionedRatio(robustDispersion(values), k);
}
