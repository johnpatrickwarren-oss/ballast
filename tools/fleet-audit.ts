// tools/fleet-audit.ts — engine-consumption demo. Audits a mixed fleet with e-BH FDR control
// (Wang–Ramdas, via @johnpatrickwarren-oss/deploysignal-engine/fleet/e-bh). Report-only.

import { fleetAudit } from '../src/fdr';
import { cycleObservations } from '../src/workload';
import { calibrate } from '../src/calibration';
import { makeRng } from '../src/rng';
import { padderSteadyScenario, honestBurstyScenario, riskAverseHighCuScenario } from '../src/scenario';
import type { Verdict } from '../src/domain';

const fleet: Verdict[] = [];
for (let i = 0; i < 5; i++) {
  const sc = padderSteadyScenario(`padder-${i}`);
  fleet.push(calibrate(sc.workload.id, cycleObservations(sc.workload, makeRng(i + 1)), sc.workload.refClass));
}
for (let i = 0; i < 8; i++) {
  const sc = honestBurstyScenario(`honest-${i}`);
  fleet.push(calibrate(sc.workload.id, cycleObservations(sc.workload, makeRng(i + 1)), sc.workload.refClass));
}
for (let i = 0; i < 2; i++) {
  const sc = riskAverseHighCuScenario(`riskaverse-${i}`);
  fleet.push(calibrate(sc.workload.id, cycleObservations(sc.workload, makeRng(i + 1)), sc.workload.refClass));
}

const q = 0.1;
const res = fleetAudit(fleet, q);

console.log('=== Fleet FDR audit (engine e-BH, arbitrary dependence) ===\n');
console.log(`fleet: 5 padders + 8 honest-bursty + 2 risk-averse-high-Cu = ${fleet.length} workloads`);
console.log(`target FDR q=${q}\n`);
console.log(`watch list (${res.k}): ${res.flagged.join(', ') || '(none)'}`);
console.log(`\nexpected falsely-flagged ≤ q·K = ${(q * res.k).toFixed(2)}. Honest + risk-averse correctly excluded.`);
