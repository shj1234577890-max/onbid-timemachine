// Design Ref: §6 POST /api/explain — 실패한 사례는 정해진 시간 동안 쉬고, 시간이 지나면 다시 시도하는지 확인한다. (CHECK.md SEC-002)
import assert from "node:assert/strict";
import { test } from "node:test";
import { createCooldown } from "../lib/cooldown.ts";

test("실패를 기록하면 쉬는 시간 동안 true, 지나면 false", () => {
  const cooldown = createCooldown(10_000);
  assert.equal(cooldown.isCooling("a", 0), false);
  cooldown.mark("a", 1000);
  assert.equal(cooldown.isCooling("a", 1001), true);
  assert.equal(cooldown.isCooling("a", 10_999), true);
  assert.equal(cooldown.isCooling("a", 11_000), false);
  assert.equal(cooldown.isCooling("a", 11_001), false);
});

test("사례마다 따로 쉰다", () => {
  const cooldown = createCooldown(10_000);
  cooldown.mark("a", 0);
  assert.equal(cooldown.isCooling("b", 1), false);
});
