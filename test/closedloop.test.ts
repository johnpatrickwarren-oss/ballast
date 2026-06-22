import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runClosedLoop } from '../src/closedloop';
import { makePopulation } from '../src/agent';

const POP = makePopulation(20);
const TARGET = 0.85;

test('converges to the performatively-stable fixed point with small gain', () => {
  const r = runClosedLoop(POP, { gain: 0.5, targetUtil: TARGET, rounds: 40, initialPremium: 0.5 });
  assert.ok(r.converged, 'loop should converge at gain 0.5');
  assert.ok(Math.abs(r.utils[r.utils.length - 1] - TARGET) < 0.05, 'final util near target');
});

test('diverges with too-large gain (positive control for the stability test)', () => {
  const r = runClosedLoop(POP, { gain: 2.5, targetUtil: TARGET, rounds: 40, initialPremium: 0.5 });
  assert.equal(r.converged, false);
});
