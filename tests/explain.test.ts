// Design Ref: §6 AI에게 넘기는 숫자 — 넘기는 글이 표시 규칙을 따르고, 예측 숫자가 없는지 확인한다.
import assert from "node:assert/strict";
import { test } from "node:test";
import { casesData, findListedCase } from "../lib/cases.ts";
import { buildExplainInput, EXPLAIN_SYSTEM_PROMPT } from "../lib/explain.ts";
import { findBannedPhrase } from "../lib/rules.ts";

test("AI에게 넘기는 글: 사례 정보가 표시 규칙대로 들어 있고 예측은 없다", () => {
  const listed = findListedCase(casesData.cases, casesData.asOfDate, "dg-suseong-001");
  assert.ok(listed);
  const text = buildExplainInput(listed, casesData.asOfDate);
  for (const label of ["단지:", "낙찰 시기:", "데이터 기준일:", "보유 기간: 약", "감정가:", "낙찰가:", "낙찰가율:", "현재 시세:", "시세 차익:", "수익률:"]) {
    assert.ok(text.includes(label), label);
  }
  assert.ok(text.includes("원"), "금액은 '원' 글자로 넘긴다");
  assert.ok(!text.includes("예측") && !text.includes("전망"), "예측 숫자는 넘기지 않는다");
});

test("AI 규칙 글에는 금지어가 없다", () => {
  assert.equal(findBannedPhrase(EXPLAIN_SYSTEM_PROMPT), null);
});
