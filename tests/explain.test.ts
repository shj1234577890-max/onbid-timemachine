// Design Ref: §6 AI에게 넘기는 숫자 — 넘기는 글이 표시 규칙을 따르고, 예측 숫자가 없는지 확인한다.
import assert from "node:assert/strict";
import { test } from "node:test";
import { casesData, findListedCase } from "../lib/cases.ts";
import { buildExplainInput, checkExplanation, EXPLAIN_SYSTEM_PROMPT } from "../lib/explain.ts";
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

test("해설 검사: 준 숫자만 쓰면 통과", () => {
  const input = "낙찰가: 3억 4,486만 원\n낙찰가율: 89.0%\n보유 기간: 약 10년\n낙찰 시기: 2016년 5월";
  assert.equal(checkExplanation("2016년 5월에 3억 4,486만 원에 낙찰되었고 낙찰가율은 89.0%입니다. 약 10년 보유했습니다.", input), null);
});

test("해설 검사: 금지어가 있으면 실패", () => {
  assert.equal(checkExplanation("지금 파세요.", "수익률: +51.0%"), "금지어: 파세요");
  assert.equal(checkExplanation("반드시 오릅니다.", "수익률: +51.0%"), "금지어: 반드시");
});

test("해설 검사: 준 적 없는 숫자(계산한 값 포함)가 있으면 실패", () => {
  assert.equal(checkExplanation("수익률은 +51.0%입니다.", "수익률: +51.0%"), null);
  assert.equal(checkExplanation("약 1.5배가 되었습니다.", "수익률: +51.0%"), "새 숫자: 1.5");
  assert.equal(checkExplanation("연 5%씩 올랐습니다.", "수익률: +51.0%"), "새 숫자: 5");
});
