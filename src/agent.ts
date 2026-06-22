// agent.ts — best-responding agents for the closed-loop harness (Mode B / H4).
//
// Each agent has a PRIVATE true stockout cost Cu and chooses its reservation to minimize its own
// expected cost given the premium p (the per-unit cost of reserved-but-unused capacity). That is
// a newsvendor: optimal service level = Cu/(Cu+p), reservation = mean + z(serviceLevel)·scale.
// Consequences (the verified revealed-preference mechanism): raising p lowers every agent's
// reservation, and lowers it MORE for low-Cu padders than for genuine high-Cu teams — the premium
// separates them without anyone measuring Cu.

import { invNormCdf } from './stats';

export interface Agent {
  readonly id: string;
  readonly trueCu: number;
  readonly demandMean: number;
  readonly demandScale: number;
}

function clamp(x: number, lo: number, hi: number): number {
  if (x < lo) return lo;
  if (x > hi) return hi;
  return x;
}

/** Newsvendor best-response reservation at premium p. Decreasing in p. */
export function bestResponseReservation(agent: Agent, premium: number): number {
  const serviceLevel = agent.trueCu / (agent.trueCu + Math.max(premium, 1e-9));
  const z = invNormCdf(clamp(serviceLevel, 1e-4, 1 - 1e-4));
  return Math.max(agent.demandMean + z * agent.demandScale, agent.demandMean * 0.05);
}

/** Aggregate utilization = Σ mean / Σ reservation at premium p. Increasing in p. */
export function aggregateUtilization(agents: readonly Agent[], premium: number): number {
  let demand = 0;
  let reserved = 0;
  for (const a of agents) {
    demand += a.demandMean;
    reserved += bestResponseReservation(a, premium);
  }
  return reserved > 0 ? demand / reserved : 0;
}

/** Fraction of aggregate reservation that is buffer beyond mean demand (the padding). */
export function paddingShare(agents: readonly Agent[], premium: number): number {
  let demand = 0;
  let reserved = 0;
  for (const a of agents) {
    demand += a.demandMean;
    reserved += bestResponseReservation(a, premium);
  }
  return reserved > 0 ? Math.max(reserved - demand, 0) / reserved : 0;
}

/** Deterministic mixed population: alternating low-Cu padders and high-Cu genuine teams. */
export function makePopulation(n: number): Agent[] {
  const out: Agent[] = [];
  for (let i = 0; i < n; i++) {
    out.push({ id: `a${i}`, trueCu: i % 2 === 0 ? 1 : 12, demandMean: 100, demandScale: 30 });
  }
  return out;
}
