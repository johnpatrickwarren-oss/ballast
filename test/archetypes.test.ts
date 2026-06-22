import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reserve, intentOf, inflationOf, inflatesUtilization, fakeUtilizationOf } from '../src/archetypes';

test('honest reserves the sanctioned headroom (inflation 1.0)', () => {
  // forecast 50, sanctioned 0.5 → reserve 100.
  assert.equal(reserve('honest_bursty', 50, 0.5), 100);
});

test('padder reserves 1.8x the honest baseline', () => {
  assert.equal(reserve('padder_steady', 50, 0.5), 180);
  assert.equal(inflationOf('padder_steady'), 1.8);
});

test('intent labels match ground truth', () => {
  assert.equal(intentOf('honest_bursty'), 'honest');
  assert.equal(intentOf('risk_averse_high_cu'), 'honest');
  assert.equal(intentOf('padder_steady'), 'padding');
  assert.equal(intentOf('ratchet_sandbagger'), 'gaming');
  assert.equal(intentOf('junk_job_inflater'), 'padding');
  assert.equal(intentOf('late_backout'), 'gaming');
  assert.equal(intentOf('correlated_peak'), 'cohort');
});

test('the sandbagger under-reserves (inflation < 1); the junk inflater fakes utilization', () => {
  assert.ok(inflationOf('ratchet_sandbagger') < 1);
  assert.equal(inflatesUtilization('junk_job_inflater'), true);
  assert.equal(inflatesUtilization('padder_steady'), false);
  assert.ok(fakeUtilizationOf('junk_job_inflater') > 0.5);
  assert.equal(fakeUtilizationOf('honest_bursty'), 0);
});
