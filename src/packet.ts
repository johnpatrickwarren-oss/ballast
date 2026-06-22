// packet.ts — the "show me the math" justification packet (component C6 / H3). Composes the
// observed reservation/utilization, the C3 sanctioned headroom, the C2 calibration verdict, and
// the C5 pool-risk contribution into one defensible, replay-clean artifact for the adjudicator.
// Framing is burden-shift ("variance to explain"), never an accusation of intent.

import type { CycleObservation, JustificationPacket, Verdict, WorkloadSpec } from './domain';
import { mean, std } from './stats';
import { criticalFractileZ } from './pooling';

export function buildPacket(spec: WorkloadSpec, obs: readonly CycleObservation[], calibration: Verdict): JustificationPacket {
  const reservedAvg = mean(obs.map((o) => o.reserved));
  const usedAvg = mean(obs.map((o) => o.used));
  const sanctionedRatio = spec.refClass.sanctionedRatio;
  const impliedHonestReservation = sanctionedRatio > 0 ? usedAvg / sanctionedRatio : 0;
  const excessReservation = Math.max(reservedAvg - impliedHonestReservation, 0);
  const z = criticalFractileZ(9, 1); // ~0.9 service level
  return {
    workloadId: spec.id,
    org: spec.org,
    refClassId: spec.refClass.id,
    reservedAvg,
    usedAvg,
    utilizationRatio: reservedAvg > 0 ? usedAvg / reservedAvg : 0,
    sanctionedRatio,
    impliedHonestReservation,
    excessReservation,
    excessFraction: reservedAvg > 0 ? excessReservation / reservedAvg : 0,
    calibration,
    poolTailAlpha: spec.demand.tailAlpha,
    poolBufferContribution: z * std(obs.map((o) => o.used)),
    assessment: calibration.flag === 'flag' ? 'variance-to-explain' : 'within-range',
  };
}

/** Human-readable "the math" the adjudicator reads. */
export function renderPacket(p: JustificationPacket): string {
  const pct = (x: number): string => `${(100 * x).toFixed(1)}%`;
  return [
    `JUSTIFICATION PACKET — ${p.workloadId} (${p.org}), class ${p.refClassId}`,
    `  reserved (avg)              ${p.reservedAvg.toFixed(1)}`,
    `  used (avg, independent)     ${p.usedAvg.toFixed(1)}  → utilization ${pct(p.utilizationRatio)}`,
    `  class sanctioned bar (C3)   ${pct(p.sanctionedRatio)}  (congestion-justified headroom)`,
    `  honest reservation would be ${p.impliedHonestReservation.toFixed(1)}`,
    `  excess held                 ${p.excessReservation.toFixed(1)}  (${pct(p.excessFraction)} of reservation)`,
    `  calibration (C2)            ${p.calibration.flag}  [wealth ${p.calibration.wealth.toFixed(1)}, fired@${p.calibration.firedAtCycle ?? '—'}]`,
    `  pool risk (C5)              tail α=${p.poolTailAlpha.toFixed(2)}, buffer contribution ${p.poolBufferContribution.toFixed(1)}`,
    `  ASSESSMENT                  ${p.assessment}`,
  ].join('\n');
}
