import { test } from 'node:test';
import assert from 'node:assert/strict';
import { correlatedCohort, realizedPoolingBenefit } from '../src/cohort';
import { poolingBenefit } from '../src/pooling';
import { makeRng } from '../src/rng';

test('independent cohort realizes ~√N pooling (Eppen, empirically)', () => {
  const c = correlatedCohort({ n: 16, base: 100, sigma: 10, rho: 0, steps: 5000 }, makeRng(1));
  const realized = realizedPoolingBenefit(c);
  assert.ok(Math.abs(realized - 4) < 0.5, `realized ${realized} vs √16 = 4`);
});

test('correlated cohort realizes less pooling, matching the analytic formula', () => {
  const rho = 0.5;
  const c = correlatedCohort({ n: 16, base: 100, sigma: 10, rho, steps: 5000 }, makeRng(2));
  const realized = realizedPoolingBenefit(c);
  const analytic = poolingBenefit(16, rho, 2);
  assert.ok(realized < 4, `realized ${realized} should be below √16`);
  assert.ok(Math.abs(realized - analytic) / analytic < 0.15, `realized ${realized} vs analytic ${analytic}`);
});
