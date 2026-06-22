import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demandSeries } from '../src/demand';
import { makeRng } from '../src/rng';
import type { DemandSpec } from '../src/domain';

const SPEC: DemandSpec = {
  base: 100, diurnalAmp: 0.3, period: 24, growthPerStep: 0.001,
  tailAlpha: 1.4, tailScale: 0.4, spikeProb: 0.02, spikeMult: 3,
};

test('series has requested length and is non-negative', () => {
  const s = demandSeries(SPEC, 500, makeRng(1));
  assert.equal(s.length, 500);
  for (const x of s) assert.ok(x >= 0);
});

test('series is deterministic in the seed', () => {
  assert.deepEqual(demandSeries(SPEC, 200, makeRng(9)), demandSeries(SPEC, 200, makeRng(9)));
});
