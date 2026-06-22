import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runEProcess } from '../src/eprocess';

test('fires on sustained positive evidence', () => {
  const r = runEProcess(new Array(40).fill(0.3), { lambda: 0.5, alpha: 0.05 });
  assert.ok(r.fired);
  assert.ok(r.firedAtCycle !== null && r.firedAtCycle < 40);
  assert.ok(r.wealth >= 20);
});

test('does not fire on sustained negative evidence', () => {
  const r = runEProcess(new Array(200).fill(-0.3), { lambda: 0.5, alpha: 0.05 });
  assert.equal(r.fired, false);
  assert.ok(r.wealth < 1);
});

test('threshold is 1/alpha', () => {
  // zero evidence → wealth stays 1, never fires.
  const r = runEProcess(new Array(100).fill(0), { lambda: 0.5, alpha: 0.05 });
  assert.equal(r.wealth, 1);
  assert.equal(r.fired, false);
});
