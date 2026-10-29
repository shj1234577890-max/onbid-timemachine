// Design Ref: §5.2 표시 규칙 — DESIGN.md의 정답표를 그대로 옮겨 채점한다. 정답은 사람이 정한 값이다.
import assert from "node:assert/strict";
import { test } from "node:test";
import { formatBidRatio, formatOutlookRate, formatProfitRate, formatWon, formatWonChange } from "../lib/format.ts";

const MINUS = "−";

test("금액: DESIGN 5.2 정답표", () => {
  assert.equal(formatWon(280_000_000), "2억 8,000만 원");
  assert.equal(formatWon(300_000_000), "3억 원");
  assert.equal(formatWon(85_000_000), "8,500만 원");
  assert.equal(formatWon(99_995_000), "1억 원");
  assert.equal(formatWon(1_234_567_890), "12억 3,457만 원");
  assert.equal(formatWon(4_999), "0원");
});

test("차익: DESIGN 5.2 정답표", () => {
  assert.equal(formatWonChange(174_400_000), "+1억 7,440만 원");
  assert.equal(formatWonChange(-32_000_000), `${MINUS}3,200만 원`);
  assert.equal(formatWonChange(0), "0원");
  assert.equal(formatWonChange(-4_999), "0원");
});

test("수익률: DESIGN 5.2 정답표", () => {
  assert.equal(formatProfitRate(62.2857), "+62.3%");
  assert.equal(formatProfitRate(-12.25), `손실 ${MINUS}12.3%`);
  assert.equal(formatProfitRate(0), "0.0%");
  assert.equal(formatProfitRate(-0.04), "0.0%");
});

test("낙찰가율: DESIGN 5.2 정답표", () => {
  assert.equal(formatBidRatio(90.3226), "90.3%");
});

test("10년 뒤 예상 수익률: 정수 퍼센트, 부호는 반올림한 뒤의 값으로", () => {
  assert.equal(formatOutlookRate(117.9), "+118%");
  assert.equal(formatOutlookRate(78), "+78%");
  assert.equal(formatOutlookRate(-44.2), `${MINUS}44%`);
  assert.equal(formatOutlookRate(0.4), "0%");
  assert.equal(formatOutlookRate(-0.4), "0%");
  assert.equal(formatOutlookRate(12.5), "+13%"); // 0.5는 0에서 먼 쪽으로
  assert.equal(formatOutlookRate(-12.5), `${MINUS}13%`);
});

test("경계값: 반올림 0.5, 소수 계산 오차, 큰 금액", () => {
  assert.equal(formatWon(5_000), "1만 원");
  assert.equal(formatWonChange(-5_000), `${MINUS}1만 원`);
  assert.equal(formatWon(123_456_789_012), "1,234억 5,679만 원");
  assert.equal(formatProfitRate(1.45), "+1.5%");
  assert.equal(formatProfitRate(-1.45), `손실 ${MINUS}1.5%`);
  assert.equal(formatProfitRate(0.05), "+0.1%");
  assert.equal(formatBidRatio(100), "100.0%");
});
