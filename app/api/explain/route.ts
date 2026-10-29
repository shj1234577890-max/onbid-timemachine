// Design Ref: §6 POST /api/explain — 사례 번호만 받아 서버가 숫자를 다시 계산하고, AI에게 쉬운 해설을 부탁한다.
import { casesData, findListedCase } from "@/lib/cases";
import { buildExplainInput, checkExplanation, EXPLAIN_SYSTEM_PROMPT } from "@/lib/explain";
import { EXPLAIN_MODEL, EXPLAIN_TIMEOUT_MS, getOpenAI } from "@/lib/openai";
import { createRateLimiter } from "@/lib/rate-limit";

const NOT_FOUND = { error: "사례를 찾을 수 없습니다." };
const FAILED = { error: "해설을 불러오지 못했습니다." };
const TOO_MANY = { error: "요청이 너무 많습니다. 잠시 뒤에 다시 시도해 주세요." };

/** 한 사용자(접속 주소)당 1분에 AI를 새로 부를 수 있는 횟수. 이미 만들어 둔 해설을 다시 받는 것은 세지 않는다. */
const LIMIT_PER_MINUTE = 10;
const limiter = createRateLimiter(LIMIT_PER_MINUTE, 60_000);

/**
 * 검사를 통과한 해설을 사례 번호별로 서버 메모리에 보관한다.
 * 데이터 파일이 바뀌면 서버를 다시 켜므로 옛 해설이 남지 않고, 같은 사례를 여러 번 열어도 AI는 한 번만 부른다.
 */
const explanationCache = new Map<string, string>();

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id: unknown = body?.id;

  // 화면이 보낸 숫자는 받지 않는다. 번호로 서버가 직접 찾아 계산한다.
  const listed = typeof id === "string" ? findListedCase(casesData.cases, casesData.asOfDate, id) : null;
  if (listed === null) return Response.json(NOT_FOUND, { status: 404 });

  const cached = explanationCache.get(listed.item.id);
  if (cached !== undefined) return Response.json({ text: cached });

  if (!limiter.allow(clientKey(request))) return Response.json(TOO_MANY, { status: 429 });

  const input = buildExplainInput(listed, casesData.asOfDate);
  const openai = getOpenAI();
  if (openai === null) return Response.json(FAILED, { status: 502 });

  try {
    const completion = await openai.chat.completions.create(
      {
        model: EXPLAIN_MODEL,
        temperature: 0.3,
        messages: [
          { role: "system", content: EXPLAIN_SYSTEM_PROMPT },
          { role: "user", content: input },
        ],
      },
      // AI가 느려도 화면이 오래 기다리지 않도록 시간을 제한하고, 실패하면 다시 시도하지 않는다.
      { timeout: EXPLAIN_TIMEOUT_MS, maxRetries: 0 },
    );
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return Response.json(FAILED, { status: 502 });
    // 금지어가 있거나 새 숫자가 섞인 해설은 내보내지 않는다. 화면은 해설 칸을 숨긴다. (PLAN 21번)
    if (checkExplanation(text, input) !== null) return Response.json(FAILED, { status: 502 });
    explanationCache.set(listed.item.id, text);
    return Response.json({ text });
  } catch {
    // 실패 원인(키 오류, 시간 초과 등)은 화면에 내보내지 않는다.
    return Response.json(FAILED, { status: 502 });
  }
}
