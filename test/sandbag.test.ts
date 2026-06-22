import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectSandbag, stockoutEvidence } from '../src/sandbag';
import { calibrate } from '../src/calibration';
import { cycleObservations } from '../src/workload';
import { makeRng } from '../src/rng';
import { ratchetSandbaggerScenario, honestBurstyScenario, junkJobInflaterScenario } from '../src/scenario';
import type { CycleObservation } from '../src/domain';

test('stockout evidence is positive when demand exceeds reservation', () => {
  const o: CycleObservation = { cycle: 0, reserved: 80, used: 80, demand: 100, utilizationRatio: 1 };
  assert.ok(stockoutEvidence(o) > 0);
});

test('sandbag detector flags a chronic under-reserver', () => {
  const sc = ratchetSandbaggerScenario('s');
  const obs = cycleObservations(sc.workload, makeRng(1));
  assert.equal(detectSandbag(sc.workload.id, obs).flag, 'flag');
});

test('sandbag detector does not flag an honest workload (no stockout)', () => {
  const sc = honestBurstyScenario('h');
  const obs = cycleObservations(sc.workload, makeRng(1));
  assert.equal(detectSandbag(sc.workload.id, obs).flag, 'no-flag');
});

test('the sandbagger is NOT flagged by the over-reservation calibration (right tool, right signal)', () => {
  const sc = ratchetSandbaggerScenario('s');
  const obs = cycleObservations(sc.workload, makeRng(1));
  assert.equal(calibrate(sc.workload.id, obs, sc.workload.refClass).flag, 'no-flag');
});

test('junk-job inflater is the uncovered value boundary — the meter cannot catch it', () => {
  const sc = junkJobInflaterScenario('j');
  const obs = cycleObservations(sc.workload, makeRng(1));
  // C2 (over-reservation) is fooled by the faked high utilization → no-flag.
  assert.equal(calibrate(sc.workload.id, obs, sc.workload.refClass).flag, 'no-flag');
  // and it is not under-reserving either → no sandbag flag. Deterrence is the premium, not the meter.
  assert.equal(detectSandbag(sc.workload.id, obs).flag, 'no-flag');
});
