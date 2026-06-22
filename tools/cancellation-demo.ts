// tools/cancellation-demo.ts — C4 demo. A held reservation for a launch that slips: the
// changepoint flags the stranded reservation early, and the cancellation curve makes releasing
// then far cheaper than dumping at the deadline. Report-only leaf script.

import { cycleObservations } from '../src/workload';
import { detectDownshift } from '../src/changepoint';
import { netReleaseCost } from '../src/cancellation';
import { lateBackoutScenario } from '../src/scenario';
import { makeRng } from '../src/rng';
import { mean } from '../src/stats';

const CYCLES = 24;
const sc = lateBackoutScenario('atlas-launch');
const obs = cycleObservations(sc.workload, makeRng(3), {
  cycles: CYCLES, stepsPerCycle: 60, forecastNoiseSd: 0.05, holdReservation: true,
});

const used = obs.map((o) => o.used);
const baseline = mean(used.slice(6, 12)); // pre-slip reference level
const expected = used.map(() => baseline);
const cp = detectDownshift(used, expected);

const amount = obs[0].reserved;
const premium = amount * 0.1;
const rate = 1;

console.log('=== LATE-BACKOUT: catch early, price late ===\n');
console.log(`held reservation: ${amount.toFixed(0)} units; launch slips at cycle 12 of ${CYCLES}.`);

if (cp.firedAtCycle === null) {
  console.log('changepoint did not fire — demo inconclusive for this seed.');
} else {
  const fEarly = cp.firedAtCycle / CYCLES;
  const fLate = (CYCLES - 1) / CYCLES;
  const costEarly = netReleaseCost(amount, fEarly, premium, rate);
  const costLate = netReleaseCost(amount, fLate, premium, rate);
  console.log(`changepoint: over-reservation KNOWABLE at cycle ${cp.firedAtCycle}\n`);
  console.log(`  release when knowable (cycle ${cp.firedAtCycle}):  net cost ${costEarly.toFixed(1)}`);
  console.log(`  dump at deadline (cycle ${CYCLES - 1}):           net cost ${costLate.toFixed(1)}`);
  console.log(`\n  late dumping costs ${(costLate - costEarly).toFixed(1)} more — releasing early is dominant.`);
}
