import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildPacket, renderPacket } from '../src/packet';
import { cycleObservations } from '../src/workload';
import { calibrate } from '../src/calibration';
import { makeRng } from '../src/rng';
import { honestBurstyScenario, padderSteadyScenario } from '../src/scenario';
import type { Scenario } from '../src/domain';

function packetFor(sc: Scenario, seed: number) {
  const obs = cycleObservations(sc.workload, makeRng(seed));
  const v = calibrate(sc.workload.id, obs, sc.workload.refClass);
  return buildPacket(sc.workload, obs, v);
}

test('padder packet flags variance to explain with positive excess', () => {
  const p = packetFor(padderSteadyScenario('atlas'), 1);
  assert.equal(p.assessment, 'variance-to-explain');
  assert.ok(p.excessReservation > 0);
  assert.ok(p.utilizationRatio < p.sanctionedRatio);
});

test('honest packet is within range and carries the math', () => {
  const p = packetFor(honestBurstyScenario('w'), 1);
  assert.equal(p.assessment, 'within-range');
  const text = renderPacket(p);
  assert.ok(text.includes('JUSTIFICATION PACKET'));
  assert.ok(text.includes('sanctioned bar'));
});
