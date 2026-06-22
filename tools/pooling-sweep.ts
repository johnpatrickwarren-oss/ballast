// tools/pooling-sweep.ts — HARNESS-SPEC §6 (C5). Reports the pooling benefit across a (ρ × α)
// grid for a fixed pool size, showing how correlation and heavy tails each erode Eppen's √N.
// Report-only leaf script.

import { poolingBenefit } from '../src/pooling';

const N = 64;
const RHOS = [0, 0.1, 0.3, 0.6, 1.0];
const ALPHAS = [2.0, 1.7, 1.3, 1.05];

console.log(`Ballast pooling-benefit sweep (C5): N=${N}, Eppen √N baseline = ${Math.sqrt(N).toFixed(2)}\n`);
console.log(['  α \\ ρ'.padEnd(8), ...RHOS.map((r) => r.toFixed(2).padStart(7))].join(' '));

for (const alpha of ALPHAS) {
  const cells = RHOS.map((rho) => poolingBenefit(N, rho, alpha).toFixed(2).padStart(7));
  console.log([`α=${alpha.toFixed(2)}`.padEnd(8), ...cells].join(' '));
}

console.log('\nRead: top-left (α=2, ρ=0) = √N = 8.00 (full Eppen pooling).');
console.log('Down a column = heavier tails; across a row = more correlation. Both drive benefit → 1.');
