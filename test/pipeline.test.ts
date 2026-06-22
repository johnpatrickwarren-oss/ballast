import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runScenario } from '../src/pipeline';
import { honestBurstyScenario, padderSteadyScenario } from '../src/scenario';

test('runScenario is deterministic in the seed', () => {
  const sc = padderSteadyScenario('w');
  assert.deepEqual(runScenario(sc, 123), runScenario(sc, 123));
});

test('padder is flagged', () => {
  assert.equal(runScenario(padderSteadyScenario('w'), 123).flag, 'flag');
});

test('honest verdict is well-formed', () => {
  const v = runScenario(honestBurstyScenario('w'), 123);
  assert.equal(v.workloadId, 'w');
  assert.ok(v.flag === 'flag' || v.flag === 'no-flag');
});
