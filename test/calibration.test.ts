import { test } from 'node:test';
import assert from 'node:assert/strict';
import { paddingEvidence, calibrate } from '../src/calibration';
import type { CycleObservation, RefClass } from '../src/domain';

const CLS: RefClass = { id: 'c', sanctionedRatio: 0.8 };

test('padding evidence is positive when utilization is below sanctioned', () => {
  const o: CycleObservation = { cycle: 0, reserved: 100, used: 40, demand: 40, utilizationRatio: 0.4 };
  assert.ok(paddingEvidence(o, CLS) > 0);
});

test('padding evidence is non-positive when utilization meets sanctioned', () => {
  const o: CycleObservation = { cycle: 0, reserved: 100, used: 85, demand: 85, utilizationRatio: 0.85 };
  assert.ok(paddingEvidence(o, CLS) <= 0);
});

test('calibrate flags a persistently under-utilizing workload', () => {
  const obs: CycleObservation[] = Array.from({ length: 30 }, (_, c) => ({
    cycle: c, reserved: 100, used: 45, demand: 45, utilizationRatio: 0.45,
  }));
  const v = calibrate('w', obs, CLS);
  assert.equal(v.flag, 'flag');
});
