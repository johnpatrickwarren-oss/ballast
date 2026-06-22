import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bestResponseReservation, paddingShare, makePopulation, type Agent } from '../src/agent';

const LOW: Agent = { id: 'l', trueCu: 1, demandMean: 100, demandScale: 30 };
const HIGH: Agent = { id: 'h', trueCu: 12, demandMean: 100, demandScale: 30 };

test('best response reserves less as the premium rises (incentive)', () => {
  assert.ok(bestResponseReservation(LOW, 0.2) > bestResponseReservation(LOW, 5));
});

test('revealed preference: higher true Cu reserves more at the same premium', () => {
  assert.ok(bestResponseReservation(HIGH, 1) > bestResponseReservation(LOW, 1));
});

test('the premium weeds out padders faster than genuine high-Cu teams', () => {
  // proportional drop in reservation when premium rises from 0.2 → 5
  const lowDrop = 1 - bestResponseReservation(LOW, 5) / bestResponseReservation(LOW, 0.2);
  const highDrop = 1 - bestResponseReservation(HIGH, 5) / bestResponseReservation(HIGH, 0.2);
  assert.ok(lowDrop > highDrop, `low-Cu drop ${lowDrop} should exceed high-Cu drop ${highDrop}`);
});

test('aggregate padding share falls as the premium rises', () => {
  const pop = makePopulation(20);
  assert.ok(paddingShare(pop, 5) < paddingShare(pop, 0.2));
});
