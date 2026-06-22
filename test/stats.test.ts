import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mean, std, quantile, invNormCdf } from '../src/stats';

test('mean', () => {
  assert.equal(mean([2, 4, 6]), 4);
  assert.equal(mean([]), 0);
});

test('std of constant is zero', () => {
  assert.equal(std([5, 5, 5]), 0);
});

test('quantile endpoints and median', () => {
  assert.equal(quantile([1, 2, 3, 4], 0), 1);
  assert.equal(quantile([1, 2, 3, 4], 1), 4);
  assert.equal(quantile([1, 2, 3], 0.5), 2);
});

test('invNormCdf matches known standard-normal quantiles', () => {
  assert.ok(Math.abs(invNormCdf(0.5)) < 1e-6);
  assert.ok(Math.abs(invNormCdf(0.975) - 1.959964) < 1e-3);
  assert.ok(Math.abs(invNormCdf(0.84134) - 1.0) < 1e-2);
  assert.ok(invNormCdf(0.9) > invNormCdf(0.8)); // monotone
});
