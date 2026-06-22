// tools/escalation-demo.ts — H3 headline demo. Reconstructs the escalation: a team presents a number;
// Ballast produces the math. Side-by-side, replay-clean. Report-only leaf script.

import { cycleObservations } from '../src/workload';
import { calibrate } from '../src/calibration';
import { buildPacket, renderPacket } from '../src/packet';
import { padderSteadyScenario } from '../src/scenario';
import { makeRng } from '../src/rng';

const sc = padderSteadyScenario('atlas-serving');
const obs = cycleObservations(sc.workload, makeRng(7));
const verdict = calibrate(sc.workload.id, obs, sc.workload.refClass);
const packet = buildPacket(sc.workload, obs, verdict);

console.log('=== ESCALATION: "show me the math" ===\n');
console.log('What the team presented (a number):');
console.log(`  "${packet.org} needs ${packet.reservedAvg.toFixed(0)} units of capacity."\n`);
console.log('What Ballast produces (the math):\n');
console.log(renderPacket(packet));
console.log('\nThe adjudicator decides on evidence, not assertion. Ballast does not make the call.');
