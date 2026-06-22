// archetypes.ts — reservation-behavior transforms + ground-truth intent (HARNESS-SPEC §4).
//
// An archetype maps a workload's forecast draw + its class's sanctioned ratio into a reservation.
// Honest reserves exactly the class-sanctioned headroom (inflation 1.0); a padder reserves more.
// The transform is the *known ground truth* the calibration engine is scored against.

import type { Archetype, Intent } from './domain';

/** Reservation inflation factor over the honest (sanctioned-headroom) baseline. */
const INFLATION: Record<Archetype, number> = {
  honest_bursty: 1.0,
  risk_averse_high_cu: 1.0, // honest; legitimate high headroom comes from a low-sanctioned class / purchased tier (H2)
  padder_steady: 1.8,
  junk_job_inflater: 1.4,
  ratchet_sandbagger: 0.4, // under-reserves well below the sanctioned bar → over-draws / stocks out
  late_backout: 1.6,
  correlated_peak: 1.0,
};

// Archetypes that FAKE utilization (junk jobs) to fool the meter — they consume their reservation
// with useless work so measured utilization is high regardless of true demand. The value the map
// holds is the faked utilization ratio. This is the explicitly-uncovered value boundary: the
// meter sees hardware utilization, not work value.
const FAKE_UTIL: Partial<Record<Archetype, number>> = { junk_job_inflater: 0.85 };

export function inflatesUtilization(archetype: Archetype): boolean {
  return FAKE_UTIL[archetype] !== undefined;
}

export function fakeUtilizationOf(archetype: Archetype): number {
  return FAKE_UTIL[archetype] ?? 0;
}

const INTENT: Record<Archetype, Intent> = {
  honest_bursty: 'honest',
  risk_averse_high_cu: 'honest',
  padder_steady: 'padding',
  junk_job_inflater: 'padding',
  ratchet_sandbagger: 'gaming',
  late_backout: 'gaming',
  correlated_peak: 'cohort',
};

/**
 * Reservation = (forecast / sanctionedRatio) × inflation. Reserving to `forecast/sanctioned`
 * is "reserve the legitimate class headroom"; inflation > 1 is padding on top of that.
 */
export function reserve(archetype: Archetype, forecastDraw: number, sanctionedRatio: number): number {
  return (forecastDraw / sanctionedRatio) * INFLATION[archetype];
}

export function intentOf(archetype: Archetype): Intent {
  return INTENT[archetype];
}

export function inflationOf(archetype: Archetype): number {
  return INFLATION[archetype];
}
