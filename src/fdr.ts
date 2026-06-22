// fdr.ts — fleet-wide false-discovery control (ENGINE CONSUMPTION).
//
// Audits MANY workloads at once without inflating false accusations. Each workload's calibration
// e-process WEALTH is a valid e-value (E[wealth | honest] ≤ 1 by Ville), so the engine's e-BH
// operator selects the flagged set at a target FDR q. e-BH controls FDR under ARBITRARY
// dependence (Wang–Ramdas 2022) — load-bearing here, because capacity demands are correlated
// (shared launches). This is the multi-team WATCH LIST; per-team calibration stays in calibration.ts.
//
// Consumes @johnpatrickwarren-oss/deploysignal-engine/fleet/e-bh (the same operator Tessera uses
// over per-shard e-values), keeping the FDR math in the shared engine rather than re-deriving it.

import { eBenjaminiHochberg } from '@johnpatrickwarren-oss/deploysignal-engine/fleet/e-bh';
import type { Verdict } from './domain';

export interface FleetAuditResult {
  /** Workload IDs in the FDR-controlled flagged set. */
  readonly flagged: readonly string[];
  /** K = number flagged. Expected falsely-flagged ≤ q·K. */
  readonly k: number;
  readonly q: number;
}

/**
 * Run e-BH over a fleet of per-workload calibration verdicts, treating each verdict's wealth as
 * its e-value. `q` is the target false-discovery rate ∈ (0, 1].
 */
export function fleetAudit(verdicts: readonly Verdict[], q: number): FleetAuditResult {
  if (verdicts.length === 0) return { flagged: [], k: 0, q };
  const eValues = verdicts.map((v) => v.wealth);
  const { selected, K } = eBenjaminiHochberg(eValues, q);
  return { flagged: selected.map((i) => verdicts[i].workloadId), k: K, q };
}
