import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectDownshift } from '../src/changepoint';

test('fires shortly after a sustained downshift, not before it', () => {
  const expected = new Array(40).fill(100);
  const signal = expected.map((e, t) => (t < 20 ? e : e * 0.5)); // halves at t=20
  const r = detectDownshift(signal, expected);
  assert.ok(r.fired);
  assert.ok(r.firedAtCycle !== null && r.firedAtCycle >= 20 && r.firedAtCycle < 26, `fired@${r.firedAtCycle}`);
});

test('does not fire when the signal tracks expected', () => {
  const expected = new Array(50).fill(100);
  const signal = new Array(50).fill(98);
  assert.equal(detectDownshift(signal, expected).fired, false);
});
