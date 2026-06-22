import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runScenario } from '../src/pipeline';
import { honestBurstyScenario, padderSteadyScenario, riskAverseHighCuScenario } from '../src/scenario';

// The load-bearing guard (HARNESS-SPEC §7): over many seeds, the honest archetype must flag at
// most α of the time (anytime-valid Type-I control), and the padder must flag ≥ 0.95 (TP). This
// tests the *guarantee*, not one instance — the only honest way to validate a sequential test.
const N = 200;
const ALPHA = 0.05;
const TP_FLOOR = 0.95;

function flagRate(make: (id: string) => ReturnType<typeof honestBurstyScenario>): number {
  let flags = 0;
  for (let seed = 0; seed < N; seed++) {
    if (runScenario(make('w'), seed).flag === 'flag') flags++;
  }
  return flags / N;
}

test(`honest archetype false-positive rate <= alpha (${ALPHA})`, () => {
  const fp = flagRate(honestBurstyScenario);
  assert.ok(fp <= ALPHA, `honest FP rate ${fp} exceeded alpha ${ALPHA}`);
});

test(`padder archetype true-positive rate >= ${TP_FLOOR}`, () => {
  const tp = flagRate(padderSteadyScenario);
  assert.ok(tp >= TP_FLOOR, `padder TP rate ${tp} below floor ${TP_FLOOR}`);
});

// The crux: a genuinely high-Cu team reserves MORE per unit forecast than the padder and
// under-utilizes more — yet must not be flagged, because its class sanctions the headroom.
test(`risk-averse high-Cu (hard FP case) false-positive rate <= alpha (${ALPHA})`, () => {
  const fp = flagRate(riskAverseHighCuScenario);
  assert.ok(fp <= ALPHA, `risk-averse FP rate ${fp} exceeded alpha ${ALPHA}`);
});
