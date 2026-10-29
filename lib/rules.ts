// Design Ref: §6 금지어 목록 — 단정하는 표현은 화면과 AI 해설 어디에도 쓰지 않는다. (PRD §5 must ②)
// 금지어는 이 파일에서 한 번만 정하고, 화면 문구 검사(tests)와 AI 해설 검사(PLAN 21번)가 함께 쓴다.

/** 쓰면 안 되는 단정 표현 */
export const BANNED_PHRASES: readonly string[] = ["사세요", "파세요", "최적의 매도 시점", "반드시", "확실히"];

/** 글에 금지어가 들어 있으면 찾은 금지어를, 없으면 null을 돌려준다. */
export function findBannedPhrase(text: string): string | null {
  return BANNED_PHRASES.find((phrase) => text.includes(phrase)) ?? null;
}
