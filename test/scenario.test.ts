import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  H1_POOL, COVERAGE_POOL, BURSTY_CLASS, STEADY_CLASS, HIGH_CU_CLASS,
  ratchetSandbaggerScenario, junkJobInflaterScenario,
} from '../src/scenario';

test('H1 pool has the FP-guard and TP archetypes with correct ground truth', () => {
  assert.equal(H1_POOL.length, 2);
  const honest = H1_POOL.find((s) => s.intent === 'honest');
  const padder = H1_POOL.find((s) => s.intent === 'padding');
  assert.ok(honest && honest.expectedFlag === 'no-flag');
  assert.ok(padder && padder.expectedFlag === 'flag');
});

test('bursty class has a lower sanctioned ratio than the steady class', () => {
  assert.ok(BURSTY_CLASS.sanctionedRatio < STEADY_CLASS.sanctionedRatio);
});

test('coverage pool covers both honest cases + the padder', () => {
  assert.equal(COVERAGE_POOL.length, 3);
  assert.equal(COVERAGE_POOL.filter((s) => s.expectedFlag === 'no-flag').length, 2);
  assert.equal(COVERAGE_POOL.filter((s) => s.expectedFlag === 'flag').length, 1);
});

test('high-Cu class has the lowest sanctioned ratio (most headroom)', () => {
  assert.ok(HIGH_CU_CLASS.sanctionedRatio < BURSTY_CLASS.sanctionedRatio);
});

test('C3-derived class ratios are all in (0,1)', () => {
  for (const c of [BURSTY_CLASS, STEADY_CLASS, HIGH_CU_CLASS]) {
    assert.ok(c.sanctionedRatio > 0 && c.sanctionedRatio < 1, `${c.id}=${c.sanctionedRatio}`);
  }
});

test('new archetypes carry the right ground truth', () => {
  assert.equal(ratchetSandbaggerScenario('s').intent, 'gaming');
  assert.equal(ratchetSandbaggerScenario('s').expectedFlag, 'flag');
  assert.equal(junkJobInflaterScenario('j').intent, 'padding');
  assert.equal(junkJobInflaterScenario('j').expectedFlag, 'no-flag'); // uncovered by C2
});
