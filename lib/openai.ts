// Design Ref: §7 보안 — OPENAI_API_KEY는 이 파일에서만 읽는다. 서버 전용이라 브라우저 코드가 가져오면 빌드가 막힌다.
import "server-only";
import OpenAI from "openai";

/** 해설 한 단락만 쓰면 되므로 빠르고 저렴한 모델을 쓴다. (DESIGN §1) */
export const EXPLAIN_MODEL = "gpt-4o-mini";

/** AI 응답을 기다리는 최대 시간(밀리초). 넘기면 실패로 처리한다. */
export const EXPLAIN_TIMEOUT_MS = 15_000;

/** AI가 쓸 수 있는 글의 최대 길이(토큰). 3~4문장 해설이면 충분하고, 넘으면 중간에 끊긴 글로 보고 쓰지 않는다. */
export const EXPLAIN_MAX_TOKENS = 600;

/** 키가 없으면 null. 호출하는 쪽이 "해설 없음"으로 처리한다. 키 값은 어디에도 출력하지 않는다. */
export function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}
