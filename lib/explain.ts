// Design Ref: §6 POST /api/explain — AI에게 넘길 글(숫자는 모두 표시 규칙을 적용한 글자)과 규칙을 만든다.
// 계산은 하지 않는다. 이미 계산된 ListedCase를 글자로 바꿔 넘길 뿐이다. 예측 숫자는 넘기지 않는다.
import { formatBidRatio, formatProfitRate, formatWon, formatWonChange } from "./format.ts";
import type { ListedCase } from "./cases.ts";
import type { DateString } from "./types.ts";

/** AI에게 주는 규칙 (DESIGN §6). 금지어 목록은 lib/rules.ts 하나만 쓰므로 21번에서 검사로 함께 막는다. */
export const EXPLAIN_SYSTEM_PROMPT = `당신은 부동산 공매 결과를 처음 보는 사람에게 설명하는 친절한 해설자입니다.

규칙:
1. [사례 정보]에 적힌 숫자만 그대로 인용하세요. 새 숫자를 계산하거나 만들어 내지 마세요.
2. 앞으로의 시세나 수익을 예측하거나 단정하지 마세요.
3. 사거나 팔라고 권하는 말을 하지 마세요.
4. 존댓말 한국어로, 처음 보는 사람도 이해하게 3~4문장으로 쓰세요.
5. 손실 사례도 사실대로 말하세요.
6. 세금과 중개수수료 같은 부대비용이 반영되지 않았다는 점을 한 번 언급하세요.`;

/** "2016-05-12" → "2016년 5월" */
function toYearMonth(date: DateString): string {
  const [y, m] = date.split("-").map(Number);
  return `${y}년 ${m}월`;
}

/** AI에게 보낼 [사례 정보] 글. 숫자는 화면과 같은 표시 규칙을 적용한 글자다. */
export function buildExplainInput(listed: ListedCase, asOfDate: DateString): string {
  const { item } = listed;
  return [
    "[사례 정보]",
    `단지: ${item.complexName} (${item.sigungu} ${item.dong})`,
    `낙찰 시기: ${toYearMonth(item.auctionDate)}`,
    `데이터 기준일: ${asOfDate}`,
    `보유 기간: 약 ${listed.holdingYears}년`,
    `감정가: ${formatWon(item.appraisalPrice)}`,
    `낙찰가: ${formatWon(item.winningBid)}`,
    `낙찰가율: ${formatBidRatio(listed.bidRatio)}`,
    `현재 시세: ${formatWon(listed.currentPrice)}`,
    `시세 차익: ${formatWonChange(listed.profitAmount)}`,
    `수익률: ${formatProfitRate(listed.profitRate)}`,
  ].join("\n");
}
