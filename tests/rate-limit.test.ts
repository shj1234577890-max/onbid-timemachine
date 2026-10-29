// Design Ref: §6 POST /api/explain — 호출 횟수 제한이 정해진 대로 막고 풀리는지 확인한다.
import assert from "node:assert/strict";
import { test } from "node:test";
import { createRateLimiter } from "../lib/rate-limit.ts";

test("한도까지는 허용하고, 넘으면 막는다", () => {
  const limiter = createRateLimiter(3, 60_000);
  assert.equal(limiter.allow("a", 1000), true);
  assert.equal(limiter.allow("a", 2000), true);
  assert.equal(limiter.allow("a", 3000), true);
  assert.equal(limiter.allow("a", 4000), false);
});

test("사용자마다 따로 센다", () => {
  const limiter = createRateLimiter(1, 60_000);
  assert.equal(limiter.allow("a", 1000), true);
  assert.equal(limiter.allow("b", 1000), true);
  assert.equal(limiter.allow("a", 1500), false);
});

test("시간이 지나면 다시 허용한다", () => {
  const limiter = createRateLimiter(1, 60_000);
  assert.equal(limiter.allow("a", 0), true);
  assert.equal(limiter.allow("a", 59_999), false);
  assert.equal(limiter.allow("a", 60_000), true);
});
