// tools/closedloop-demo.ts — H4 Mode B. (1) Incentive efficacy: padding share vs premium.
// (2) Performative stability: the loop converges at small gain, diverges at large gain. Report-only.

import { makePopulation, paddingShare } from '../src/agent';
import { runClosedLoop } from '../src/closedloop';

const pop = makePopulation(20);

console.log('=== H4 Mode B: incentive efficacy ===\n');
console.log('premium   padding-share');
for (const p of [0.1, 0.5, 1, 2, 5, 10]) {
  console.log(`  ${p.toFixed(1).padStart(5)}        ${(100 * paddingShare(pop, p)).toFixed(1)}%`);
}

console.log('\n=== H4 Mode B: performative stability (target util 0.85) ===\n');
for (const gain of [0.5, 2.5]) {
  const r = runClosedLoop(pop, { gain, targetUtil: 0.85, rounds: 40, initialPremium: 0.5 });
  const tail = r.premiums.slice(-4).map((x) => x.toFixed(2)).join(', ');
  console.log(`gain=${gain}: converged=${r.converged}  final-util=${r.utils[r.utils.length - 1].toFixed(3)}  last premiums [${tail}]`);
}

console.log('\ngain<2 reaches the stable fixed point; gain>2 diverges (the ε<γ/β contraction boundary).');
