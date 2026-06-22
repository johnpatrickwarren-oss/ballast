// workload.ts — turn a WorkloadSpec into a per-cycle observation stream the meter sees.
//
// Two reservation modes:
//   • per-cycle (default): reserve to a fresh forecast each cycle (honest/padder steady state).
//   • held (holdReservation): size ONE reservation up front to the anticipated peak and hold it
//     all term — the `late_backout` shape, where a slipped launch leaves a held over-reservation.
// `used` is capped at `reserved` (you cannot draw more than you hold).

import type { WorkloadSpec, CycleObservation } from './domain';
import { type Rng, normal } from './rng';
import { demandSeries } from './demand';
import { mean, quantile } from './stats';
import { reserve, inflationOf, inflatesUtilization, fakeUtilizationOf } from './archetypes';

export interface ObsOpts {
  readonly cycles: number;
  readonly stepsPerCycle: number;
  /** Forecast-error sd (fraction of draw). Symmetric → calibration null is a martingale. */
  readonly forecastNoiseSd: number;
  /** Hold one up-front reservation sized to the anticipated peak (late-backout shape). */
  readonly holdReservation?: boolean;
}

export const DEFAULT_OBS: ObsOpts = { cycles: 24, stepsPerCycle: 60, forecastNoiseSd: 0.05 };

/** Per-cycle reservation: reserve to this cycle's (noisy) forecast of its own average draw. */
function perCycleReserved(spec: WorkloadSpec, usedAvg: number, rng: Rng, sd: number): number {
  const forecast = Math.max(usedAvg * (1 + normal(rng, 0, sd)), 1e-9);
  return reserve(spec.archetype, forecast, spec.refClass.sanctionedRatio);
}

export function cycleObservations(spec: WorkloadSpec, rng: Rng, opts: ObsOpts = DEFAULT_OBS): CycleObservation[] {
  const series = demandSeries(spec.demand, opts.cycles * opts.stepsPerCycle, rng);
  const held = opts.holdReservation ? quantile(series, 0.95) * inflationOf(spec.archetype) : null;
  const out: CycleObservation[] = [];
  for (let c = 0; c < opts.cycles; c++) {
    const slice = series.slice(c * opts.stepsPerCycle, (c + 1) * opts.stepsPerCycle);
    const demand = mean(slice);
    const reserved = held ?? perCycleReserved(spec, demand, rng, opts.forecastNoiseSd);
    const used = inflatesUtilization(spec.archetype)
      ? reserved * fakeUtilizationOf(spec.archetype) // junk jobs fake high utilization
      : Math.min(demand, reserved);
    const utilizationRatio = reserved > 0 ? used / reserved : 0;
    out.push({ cycle: c, reserved, used, demand, utilizationRatio });
  }
  return out;
}
