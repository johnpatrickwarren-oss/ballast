// tools/cohort-validate.ts — C5b validation. Realized pooling benefit from a correlated cohort
// vs the analytic C5 formula, across correlation levels. Report-only leaf script.

import { correlatedCohort, realizedPoolingBenefit } from '../src/cohort';
import { poolingBenefit } from '../src/pooling';
import { makeRng } from '../src/rng';

const N = 16;
const STEPS = 5000;
const RHOS = [0, 0.1, 0.3, 0.6];

console.log(`Ballast C5b cohort validation (N=${N}, ${STEPS} steps; √N = ${Math.sqrt(N).toFixed(2)})\n`);
console.log(['  ρ'.padEnd(6), 'realized'.padStart(9), 'analytic'.padStart(9), 'rel.err'.padStart(8)].join(' '));

for (let i = 0; i < RHOS.length; i++) {
  const rho = RHOS[i];
  const realized = realizedPoolingBenefit(correlatedCohort({ n: N, base: 100, sigma: 10, rho, steps: STEPS }, makeRng(i + 1)));
  const analytic = poolingBenefit(N, rho, 2);
  const relErr = Math.abs(realized - analytic) / analytic;
  console.log([`ρ=${rho.toFixed(2)}`.padEnd(6), realized.toFixed(2).padStart(9), analytic.toFixed(2).padStart(9), `${(100 * relErr).toFixed(1)}%`.padStart(8)].join(' '));
}

console.log('\nRealized (finite-variance, normal shocks) tracks the analytic √N/√(1+(N−1)ρ).');
