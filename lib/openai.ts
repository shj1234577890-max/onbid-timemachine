// Design Ref: §7 보안 — OPENAI_API_KEY는 이 파일에서만 읽는다. 서버 전용이라 브라우저 코드가 가져오면 빌드가 막힌다.
import "server-only";
import OpenAI from "openai";

/** 해설 한 단락만 쓰면 되므로 빠르고 저렴한 모델을 쓴다. (DESIGN §1) */
export const EXPLAIN_MODEL = "gpt-4o-mini";

/** 키가 없으면 null. 호출하는 쪽이 "해설 없음"으로 처리한다. 키 값은 어디에도 출력하지 않는다. */
export function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}
