// Design Ref: §4 데이터 형식 — 예시 데이터는 통과하고, 잘못된 데이터는 어디가 틀렸는지 알려 주는지 확인한다.
import assert from "node:assert/strict";
import { test } from "node:test";
import casesFile from "../data/cases.json" with { type: "json" };
import { parseCasesFile, validateCasesFile } from "../lib/validate.ts";

const good = () => structuredClone(casesFile) as unknown as { asOfDate: string; isSample: boolean; cases: Record<string, unknown>[] };

test("예시 데이터는 형식 검사를 통과한다", () => {
  assert.deepEqual(validateCasesFile(casesFile), []);
});

test("잘못된 값은 위치와 이유를 알려 준다", () => {
  const d = good();
  d.cases[0].winningBid = 0;
  d.cases[1].sido = "서울";
  d.cases[2].auctionDate = "2016/05/12";
  d.cases[3].id = d.cases[4].id;
  const problems = validateCasesFile(d);
  assert.ok(problems.some((p) => p.startsWith("cases[0].winningBid")));
  assert.ok(problems.some((p) => p.startsWith("cases[1].sido")));
  assert.ok(problems.some((p) => p.startsWith("cases[2].auctionDate")));
  assert.ok(problems.some((p) => p.startsWith("cases[4].id") || p.startsWith("cases[3].id")));
});

test("기준일·예시 여부·시세 값이 잘못되면 잡는다", () => {
  const d = good();
  d.asOfDate = "내일";
  d.isSample = "예" as unknown as boolean;
  (d.cases[0].yearlyPrices as Record<string, unknown>)["2020"] = "비쌈";
  const problems = validateCasesFile(d);
  assert.ok(problems.some((p) => p.startsWith("asOfDate")));
  assert.ok(problems.some((p) => p.startsWith("isSample")));
  assert.ok(problems.some((p) => p.includes("2020년")));
});

test("문제가 있으면 읽는 단계에서 멈춘다", () => {
  assert.throws(() => parseCasesFile({ asOfDate: "2026-10-28", isSample: true, cases: "없음" }), /형식 오류/);
  assert.throws(() => parseCasesFile(null), /형식 오류/);
});

test("허용하지 않은 칸(동·호수, 낙찰자 정보 등)이 섞이면 막는다 (SEC-008)", () => {
  const d = good();
  d.cases[0]["호수"] = "1203호";
  d.cases[1]["낙찰자"] = "홍길동";
  (d.cases[2].recentDeals as Record<string, unknown>[])[0]["동호수"] = "101동 502호";
  (d as Record<string, unknown>)["메모"] = "x";
  const problems = validateCasesFile(d);
  assert.ok(problems.some((p) => p.startsWith("cases[0].호수")));
  assert.ok(problems.some((p) => p.startsWith("cases[1].낙찰자")));
  assert.ok(problems.some((p) => p.includes("recentDeals[0].동호수")));
  assert.ok(problems.some((p) => p.includes("허용하지 않는 칸: 메모")));
});
