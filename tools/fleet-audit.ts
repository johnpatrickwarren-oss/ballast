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

console.log('=== Fleet FDR audit (engine e-BH, arbitrary dependence) ===\n');
console.log(`fleet: 5 padders + 8 honest-bursty + 2 risk-averse-high-Cu = ${fleet.length} workloads\n`);

// e-BH is conservative under multiplicity — the FDR target q is the knob. Show two levels.
for (const q of [0.2, 0.1]) {
  const res = fleetAudit(fleet, q);
  console.log(`q=${q}: watch list (${res.k}) ${res.flagged.join(', ') || '(none)'}` +
    `  — expected falsely-flagged ≤ q·K = ${(q * res.k).toFixed(2)}`);
}

console.log('\nAt q=0.2 the 5 padders surface; tightening to q=0.1 requires stronger evidence across');
console.log('the 15-test fleet, so e-BH holds back — FDR control under arbitrary dependence. Honest +');
console.log('risk-averse are never flagged at either level.');
