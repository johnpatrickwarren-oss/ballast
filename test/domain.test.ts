import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { CycleObservation, Verdict, Scenario } from '../src/domain';

test('domain contracts are constructible with the expected shape', () => {
  const obs: CycleObservation = { cycle: 0, reserved: 100, used: 45, demand: 45, utilizationRatio: 0.45 };
  const verdict: Verdict = { workloadId: 'w', flag: 'no-flag', wealth: 1, firedAtCycle: null };
  assert.equal(obs.utilizationRatio, 0.45);
  assert.equal(verdict.flag, 'no-flag');
  const flags: Scenario['expectedFlag'][] = ['flag', 'no-flag'];
  assert.deepEqual(flags, ['flag', 'no-flag']);
});
