// Design Ref: §6 금지어 목록 — 단정하는 표현은 화면과 AI 해설 어디에도 쓰지 않는다. (PRD §5 must ②)
// 금지어는 이 파일에서 한 번만 정하고, 화면 문구 검사(tests)와 AI 해설 검사(PLAN 21번)가 함께 쓴다.

/** 쓰면 안 되는 단정 표현. PRD가 정한 5개다. 화면 문구 전체 검색(tests/banned-phrases.test.ts)이 이 목록을 쓴다. */
export const BANNED_PHRASES: readonly string[] = ["사세요", "파세요", "최적의 매도 시점", "반드시", "확실히"];

/**
 * AI 해설에만 더 엄격하게 막는 표현. 사거나 팔라고 권하는 말투다. (CHECK.md SEC-005)
 * AI는 같은 뜻을 다른 말로 바꿔 쓸 수 있어서, PRD의 5개만으로는 빈틈이 생긴다.
 */
export const AI_ADVICE_PHRASES: readonly string[] = [
  "매수하세요",
  "매도하세요",
  "구매하세요",
  "구입하세요",
  "투자하세요",
  "팔아야",
  "사야 합니다",
  "사야 해요",
  "사는 것이 좋",
  "파는 것이 좋",
  "지금이 기회",
  "놓치지 마",
];

/** 숫자를 말로 바꿔 쓰는 표현("두 배", "2배", "절반"). 우리가 계산해 주지 않은 수치를 만든 것으로 본다. (CHECK.md SEC-005) */
const SPOKEN_QUANTITY = /[두세네몇]\s?배|\d+(?:\.\d+)?\s?배|절반|반토막/;

/** 글에 금지어가 들어 있으면 찾은 금지어를, 없으면 null을 돌려준다. (PRD의 5개) */
export function findBannedPhrase(text: string): string | null {
  return BANNED_PHRASES.find((phrase) => text.includes(phrase)) ?? null;
}

/** AI 해설용 검사: PRD의 5개 + 권유 표현 + 말로 바꾼 수량 표현. 걸리면 그 표현을, 없으면 null. */
export function findAiBannedPhrase(text: string): string | null {
  const found = findBannedPhrase(text) ?? AI_ADVICE_PHRASES.find((phrase) => text.includes(phrase));
  if (found) return found;
  return text.match(SPOKEN_QUANTITY)?.[0] ?? null;
}
