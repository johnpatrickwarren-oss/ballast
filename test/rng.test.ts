import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng, uniform, pareto, bernoulli } from '../src/rng';

test('same seed yields identical sequence (replay-clean)', () => {
  const a = makeRng(42);
  const b = makeRng(42);
  for (let i = 0; i < 100; i++) assert.equal(a.next(), b.next());
});

test('different seeds diverge', () => {
  assert.notEqual(makeRng(1).next(), makeRng(2).next());
});

test('uniform stays within bounds', () => {
  const r = makeRng(7);
  for (let i = 0; i < 1000; i++) {
    const x = uniform(r, 5, 9);
    assert.ok(x >= 5 && x < 9);
  }
});

test('pareto returns values >= scale', () => {
  const r = makeRng(7);
  for (let i = 0; i < 1000; i++) assert.ok(pareto(r, 1.5, 2) >= 2);
});

test('bernoulli is a boolean', () => {
  assert.equal(typeof bernoulli(makeRng(1), 0.5), 'boolean');
});
