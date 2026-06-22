// tools/coverage.ts — HARNESS-SPEC §6 coverage matrix. Runs each scenario over N seeds, computes
// the flag-rate, and checks it against ground truth (no-flag ⇒ rate ≤ α; flag ⇒ rate ≥ TP floor).
// Exit 1 on any mismatch so it can gate CI. Report-only leaf script.

import { runScenario } from '../src/pipeline';
import { COVERAGE_POOL } from '../src/scenario';
import type { Scenario } from '../src/domain';

const N = 200;
const ALPHA = 0.05;
const TP_FLOOR = 0.95;

function flagRate(sc: Scenario): number {
  let flags = 0;
  for (let seed = 0; seed < N; seed++) {
    if (runScenario(sc, seed).flag === 'flag') flags++;
  }
  return flags / N;
}

function passes(sc: Scenario, rate: number): boolean {
  return sc.expectedFlag === 'flag' ? rate >= TP_FLOOR : rate <= ALPHA;
}

console.log(`Ballast coverage matrix (component C2 calibration; N=${N} seeds/scenario)\n`);
console.log(['scenario'.padEnd(16), 'intent'.padEnd(9), 'expect'.padEnd(8), 'flag-rate', ' result'].join(' '));

let allPass = true;
for (const sc of COVERAGE_POOL) {
  const rate = flagRate(sc);
  const ok = passes(sc, rate);
  if (!ok) allPass = false;
  console.log(
    [sc.id.padEnd(16), sc.intent.padEnd(9), sc.expectedFlag.padEnd(8), rate.toFixed(3).padStart(9), ok ? '  PASS' : '  FAIL'].join(' '),
  );
}

console.log(`\n${allPass ? 'PASS' : 'FAIL'}: coverage matrix`);
process.exit(allPass ? 0 : 1);
