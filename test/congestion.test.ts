import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coefficientOfVariation, computeSanctionedRatio, sanctionedRatioForSeries } from '../src/congestion';
import { demandSeries } from '../src/demand';
import { makeRng } from '../src/rng';
import type { DemandSpec } from '../src/domain';

test('sanctioned ratio falls as variability rises', () => {
  assert.ok(computeSanctionedRatio(0.2) > computeSanctionedRatio(1.2));
  assert.ok(computeSanctionedRatio(0) === 1);
});

test('k=1 roughly reproduces the hand-set class ratios', () => {
  assert.ok(Math.abs(computeSanctionedRatio(0.2) - 0.83) < 0.02); // steady ≈ 0.82
  assert.ok(Math.abs(computeSanctionedRatio(1.2) - 0.45) < 0.02); // bursty ≈ 0.45
});

const BURSTY: DemandSpec = {
  base: 100, diurnalAmp: 0.6, period: 24, growthPerStep: 0,
  tailAlpha: 1.2, tailScale: 0.8, spikeProb: 0.05, spikeMult: 5,
};
const STEADY: DemandSpec = {
  base: 100, diurnalAmp: 0.1, period: 24, growthPerStep: 0,
  tailAlpha: 1.9, tailScale: 0.1, spikeProb: 0.001, spikeMult: 2,
};

test('a bursty series earns a lower computed sanctioned ratio than a steady one', () => {
  const bursty = sanctionedRatioForSeries(demandSeries(BURSTY, 1000, makeRng(1)));
  const steady = sanctionedRatioForSeries(demandSeries(STEADY, 1000, makeRng(1)));
  assert.ok(bursty < steady, `bursty ${bursty} should be < steady ${steady}`);
  assert.ok(coefficientOfVariation([5, 5, 5]) === 0);
});
