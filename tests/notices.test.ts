// Design Ref: §8 확인 계획(금지어, 안내 표시) — 예측 화면 문구에 금지어가 없고 안내 문구 2종이 정해진 그대로인지 확인한다.
import assert from "node:assert/strict";
import { test } from "node:test";
import { BANNED_PHRASES, findBannedPhrase } from "../lib/rules.ts";
import {
  ALL_FORECAST_TEXTS,
  FORECAST_NOTICE_LIMIT,
  FORECAST_NOTICE_REFERENCE,
  INFLATION_ASSUMPTION_TEXT,
} from "../lib/notices.ts";

test("금지어 목록은 PRD가 정한 5개다", () => {
  assert.deepEqual([...BANNED_PHRASES], ["사세요", "파세요", "최적의 매도 시점", "반드시", "확실히"]);
});

test("금지어 찾기: 들어 있으면 그 금지어, 없으면 null", () => {
  assert.equal(findBannedPhrase("지금 사세요!"), "사세요");
  assert.equal(findBannedPhrase("반드시 오릅니다"), "반드시");
  assert.equal(findBannedPhrase("참고용 예측입니다"), null);
});

test("예측 화면 문구에는 금지어가 한 군데도 없다", () => {
  for (const text of ALL_FORECAST_TEXTS) {
    assert.equal(findBannedPhrase(text), null, text);
  }
});

test("안내 문구 2종과 물가 가정은 PRD가 정한 문장 그대로다", () => {
  assert.equal(FORECAST_NOTICE_REFERENCE, "참고용 예측이며 실제 수익을 보장하지 않습니다");
  assert.equal(FORECAST_NOTICE_LIMIT, "예측은 최근 10년 데이터를 근거로 하며, 먼 미래일수록 오차가 커집니다");
  assert.equal(INFLATION_ASSUMPTION_TEXT, "물가상승률은 연 2%로 가정했습니다");
});
