// Design Ref: §6 POST /api/explain — AI에게 넘길 글(숫자는 모두 표시 규칙을 적용한 글자)과 규칙을 만든다.
// 계산은 하지 않는다. 이미 계산된 ListedCase를 글자로 바꿔 넘길 뿐이다. 예측 숫자는 넘기지 않는다.
import { formatBidRatio, formatProfitRate, formatWon, formatWonChange } from "./format.ts";
import type { ListedCase } from "./cases.ts";
import { findAiBannedPhrase } from "./rules.ts";
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

/** 해설의 최대 글자 수. (CHECK.md SEC-005) */
export const MAX_EXPLANATION_LENGTH = 600;

/** 글 속의 숫자 덩어리. "4,486"이나 "89.0"처럼 쉼표와 소수점을 한 덩어리로 본다. */
function extractNumbers(text: string): string[] {
  return text.match(/\d[\d,]*(?:\.\d+)?/g) ?? [];
}

/**
 * AI가 쓴 해설이 규칙을 지켰는지 검사한다. (DESIGN §6 규칙 1·2)
 * - 너무 길면 실패 (3~4문장 해설이라 600자를 넘으면 규칙을 벗어난 글로 본다)
 * - 금지어(lib/rules.ts)나 권유 표현, "두 배" 같은 말로 바꾼 수량이 있으면 실패
 * - 우리가 준 글에 없는 숫자가 있으면 실패 (새 숫자를 만들거나 계산한 것으로 본다)
 * 통과하면 null, 실패하면 이유를 돌려준다. 이유는 서버 안에서만 쓰고 화면에는 내보내지 않는다.
 */
export function checkExplanation(text: string, input: string): string | null {
  if (text.length > MAX_EXPLANATION_LENGTH) return `너무 김: ${text.length}자`;
  const banned = findAiBannedPhrase(text);
  if (banned !== null) return `금지어: ${banned}`;

  const allowed = new Set(extractNumbers(input));
  const invented = extractNumbers(text).find((n) => !allowed.has(n));
  if (invented !== undefined) return `새 숫자: ${invented}`;

  return null;
}
