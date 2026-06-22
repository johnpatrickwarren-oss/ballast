import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cycleObservations } from '../src/workload';
import { makeRng } from '../src/rng';
import { honestBurstyScenario, padderSteadyScenario } from '../src/scenario';

test('produces one observation per cycle with ratio in [0,1]', () => {
  const obs = cycleObservations(honestBurstyScenario('w').workload, makeRng(3), {
    cycles: 12, stepsPerCycle: 40, forecastNoiseSd: 0.05,
  });
  assert.equal(obs.length, 12);
  for (const o of obs) assert.ok(o.utilizationRatio >= 0 && o.utilizationRatio <= 1);
});

test('padder utilizes well below its sanctioned ratio', () => {
  const sc = padderSteadyScenario('w');
  const obs = cycleObservations(sc.workload, makeRng(3));
  const avg = obs.reduce((s, o) => s + o.utilizationRatio, 0) / obs.length;
  assert.ok(avg < sc.workload.refClass.sanctionedRatio - 0.2, `avg util ${avg}`);
});

test('deterministic in the seed', () => {
  const w = honestBurstyScenario('w').workload;
  assert.deepEqual(cycleObservations(w, makeRng(5)), cycleObservations(w, makeRng(5)));
});
