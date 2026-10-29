// Design Ref: §6 POST /api/explain — 우리 화면이 보낸 JSON 요청만 받는지 확인한다. (CHECK.md SEC-002)
import assert from "node:assert/strict";
import { test } from "node:test";
import { getClientKey, isJsonRequest, isSameSiteRequest } from "../lib/request-guard.ts";

test("JSON 요청만 받는다", () => {
  assert.equal(isJsonRequest(new Headers({ "content-type": "application/json" })), true);
  assert.equal(isJsonRequest(new Headers({ "content-type": "Application/JSON; charset=utf-8" })), true);
  assert.equal(isJsonRequest(new Headers({ "content-type": "text/plain" })), false);
  assert.equal(isJsonRequest(new Headers({ "content-type": "application/x-www-form-urlencoded" })), false);
  assert.equal(isJsonRequest(new Headers()), false);
});

test("같은 사이트에서 온 요청만 받고, 다른 사이트는 막는다", () => {
  assert.equal(isSameSiteRequest(new Headers({ "sec-fetch-site": "same-origin" })), true);
  assert.equal(isSameSiteRequest(new Headers({ "sec-fetch-site": "cross-site" })), false);
  assert.equal(isSameSiteRequest(new Headers({ "sec-fetch-site": "same-site" })), false);
  assert.equal(isSameSiteRequest(new Headers({ "sec-fetch-site": "none" })), false);
});

test("표시가 없는 요청(curl 등)은 막지 않는다", () => {
  assert.equal(isSameSiteRequest(new Headers()), true);
});

test("사용자 구분 값: Vercel 값을 먼저 쓰고, 여러 값이면 첫 값, 없으면 null (SEC-004)", () => {
  assert.equal(getClientKey(new Headers({ "x-vercel-forwarded-for": "1.1.1.1", "x-forwarded-for": "9.9.9.9" })), "1.1.1.1");
  assert.equal(getClientKey(new Headers({ "x-real-ip": "2.2.2.2", "x-forwarded-for": "9.9.9.9" })), "2.2.2.2");
  assert.equal(getClientKey(new Headers({ "x-forwarded-for": " 3.3.3.3 , 4.4.4.4" })), "3.3.3.3");
  assert.equal(getClientKey(new Headers()), null);
  assert.equal(getClientKey(new Headers({ "x-forwarded-for": "   " })), null);
  assert.equal(getClientKey(new Headers({ "x-forwarded-for": "a".repeat(500) }))?.length, 64);
});
