import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fleetAudit } from '../src/fdr';
import { cycleObservations } from '../src/workload';
import { calibrate } from '../src/calibration';
import { makeRng } from '../src/rng';
import { padderSteadyScenario, honestBurstyScenario } from '../src/scenario';
import type { Verdict } from '../src/domain';

function verdict(id: string, wealth: number): Verdict {
  return { workloadId: id, flag: wealth >= 20 ? 'flag' : 'no-flag', wealth, firedAtCycle: null };
}

test('e-BH selects strong padders and never flags the honest (engine consumption)', () => {
  const honest = Array.from({ length: 15 }, (_, i) => verdict(`h${i}`, 0.8));
  const padders = Array.from({ length: 5 }, (_, i) => verdict(`p${i}`, 300));
  const res = fleetAudit([...honest, ...padders], 0.1);
  assert.equal(res.k, 5);
  for (let i = 0; i < 5; i++) assert.ok(res.flagged.includes(`p${i}`));
  assert.ok(res.flagged.every((id) => id.startsWith('p')));
});

test('e-BH is conservative under multiplicity — a single weak signal is not flagged', () => {
  const fleet = [verdict('p0', 55), ...Array.from({ length: 19 }, (_, i) => verdict(`h${i}`, 0.8))];
  assert.equal(fleetAudit(fleet, 0.05).k, 0);
});

test('over a real scenario fleet, the watch list is padders only (no honest)', () => {
  const fleet: Verdict[] = [];
  for (let i = 0; i < 4; i++) {
    const sc = padderSteadyScenario(`p${i}`);
    fleet.push(calibrate(sc.workload.id, cycleObservations(sc.workload, makeRng(i + 1)), sc.workload.refClass));
  }
  for (let i = 0; i < 6; i++) {
    const sc = honestBurstyScenario(`h${i}`);
    fleet.push(calibrate(sc.workload.id, cycleObservations(sc.workload, makeRng(i + 1)), sc.workload.refClass));
  }
  const res = fleetAudit(fleet, 0.2);
  assert.ok(res.k >= 1);
  assert.ok(res.flagged.every((id) => id.startsWith('p')), `flagged ${res.flagged}`);
});
