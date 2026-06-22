import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cancellationCredit, heldCapacityCost, netReleaseCost } from '../src/cancellation';

test('release credit declines toward the deadline', () => {
  assert.ok(cancellationCredit(0) > cancellationCredit(0.5));
  assert.ok(cancellationCredit(0.5) > cancellationCredit(0.95));
});

test('held-capacity cost grows with time held', () => {
  assert.ok(heldCapacityCost(0.8, 100, 1) > heldCapacityCost(0.2, 100, 1));
});

test('net release cost increases with lateness — dumping late is dominated', () => {
  const early = netReleaseCost(100, 0.2, 50, 1);
  const late = netReleaseCost(100, 0.95, 50, 1);
  assert.ok(late > early, `late ${late} should exceed early ${early}`);
});
