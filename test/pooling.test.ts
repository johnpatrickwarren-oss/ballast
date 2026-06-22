import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  effectiveN, poolingExponent, poolingBenefit, criticalFractileZ,
  pooledBuffer, naivePooledBuffer, poolingSaving,
} from '../src/pooling';

test('effective N: independent → N, perfectly correlated → 1', () => {
  assert.ok(Math.abs(effectiveN(16, 0) - 16) < 1e-9);
  assert.ok(Math.abs(effectiveN(16, 1) - 1) < 1e-9);
  assert.ok(effectiveN(16, 0.5) < 16 && effectiveN(16, 0.5) > 1);
});

test('pooling exponent: α=2 → 1/2 (Eppen), α→1 → 0', () => {
  assert.ok(Math.abs(poolingExponent(2) - 0.5) < 1e-9);
  assert.ok(poolingExponent(1.01) < 0.02);
});

test('benefit reduces to √N at ρ=0, α=2 (Eppen baseline)', () => {
  assert.ok(Math.abs(poolingBenefit(16, 0, 2) - 4) < 1e-9); // √16 = 4
  assert.ok(Math.abs(poolingBenefit(100, 0, 2) - 10) < 1e-9);
});

test('benefit vanishes (→1) at perfect positive correlation', () => {
  assert.ok(Math.abs(poolingBenefit(64, 1, 2) - 1) < 1e-9);
});

test('benefit collapses toward 1 as tails get heavy (α→1)', () => {
  assert.ok(poolingBenefit(64, 0, 1.05) < 1.5);
  assert.ok(poolingBenefit(64, 0, 2) > poolingBenefit(64, 0, 1.3));
  assert.ok(poolingBenefit(64, 0, 1.3) > poolingBenefit(64, 0, 1.05));
});

test('DOUBLE erosion: correlated AND heavy-tailed is worse than either alone', () => {
  const both = poolingBenefit(64, 0.3, 1.3);
  const corrOnly = poolingBenefit(64, 0.3, 2);
  const tailOnly = poolingBenefit(64, 0, 1.3);
  assert.ok(both < corrOnly && both < tailOnly);
});

test('critical-fractile z: symmetric cost → 0, high underage cost → positive', () => {
  assert.ok(Math.abs(criticalFractileZ(1, 1)) < 1e-6);
  assert.ok(criticalFractileZ(39, 1) > 1.9); // service level 0.975 → z ≈ 1.96
});

test('the trap: naive √N buffer UNDER-sizes vs the honest de-rated buffer when correlated', () => {
  const scales = new Array(64).fill(10);
  const z = criticalFractileZ(9, 1); // ~0.9 service level
  const honest = pooledBuffer(scales, z, 0.3, 1.3);
  const naive = naivePooledBuffer(scales, z);
  assert.ok(honest > naive, `honest buffer ${honest} must exceed naive ${naive}`);
});

test('pooling saving is in [0,1) and shrinks with correlation', () => {
  const s0 = poolingSaving(64, 0, 2);
  const s5 = poolingSaving(64, 0.5, 2);
  assert.ok(s0 > 0 && s0 < 1 && s5 >= 0 && s5 < s0);
});
