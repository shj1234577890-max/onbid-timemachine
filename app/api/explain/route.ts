// Design Ref: §6 POST /api/explain — 사례 번호만 받아 서버가 숫자를 다시 계산하고, AI에게 쉬운 해설을 부탁한다.
import { casesData, findListedCase, type ListedCase } from "@/lib/cases";
import { createCooldown } from "@/lib/cooldown";
import { buildExplainInput, checkExplanation, EXPLAIN_SYSTEM_PROMPT } from "@/lib/explain";
import { EXPLAIN_MAX_TOKENS, EXPLAIN_MODEL, EXPLAIN_TIMEOUT_MS, getOpenAI } from "@/lib/openai";
import { createRateLimiter } from "@/lib/rate-limit";
import { isJsonRequest, isSameSiteRequest } from "@/lib/request-guard";

const NOT_FOUND = { error: "사례를 찾을 수 없습니다." };
const FAILED = { error: "해설을 불러오지 못했습니다." };
const TOO_MANY = { error: "요청이 너무 많습니다. 잠시 뒤에 다시 시도해 주세요." };
const BAD_REQUEST = { error: "허용하지 않는 요청입니다." };

/** 한 사용자(접속 주소)당 1분에 AI를 새로 부를 수 있는 횟수. 이미 만들어 둔 해설을 다시 받는 것은 세지 않는다. */
const LIMIT_PER_MINUTE = 10;
const limiter = createRateLimiter(LIMIT_PER_MINUTE, 60_000);

/** 해설이 실패한 사례는 10분 동안 AI를 다시 부르지 않는다. (CHECK.md SEC-002) */
const failureCooldown = createCooldown(10 * 60_000);

/**
 * 검사를 통과한 해설을 사례 번호별로 서버 메모리에 보관한다.
 * 데이터 파일이 바뀌면 서버를 다시 켜므로 옛 해설이 남지 않고, 같은 사례를 여러 번 열어도 AI는 한 번만 부른다.
 */
const explanationCache = new Map<string, string>();

/** 지금 AI에게 물어보는 중인 사례. 같은 사례를 여럿이 동시에 열어도 AI는 한 번만 부르고 그 답을 함께 기다린다. */
const inFlight = new Map<string, Promise<string | null>>();

function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/** AI에게 해설을 받아 검사한다. 통과하면 글, 아니면 null. 실패 원인(키 오류, 시간 초과 등)은 화면에 내보내지 않는다. */
async function generate(listed: ListedCase): Promise<string | null> {
  const openai = getOpenAI();
  if (openai === null) return null;
  const input = buildExplainInput(listed, casesData.asOfDate);
  try {
    const completion = await openai.chat.completions.create(
      {
        model: EXPLAIN_MODEL,
        temperature: 0.3,
        // 해설은 3~4문장이면 충분하다. 길이를 제한해 한 번에 나가는 비용의 위쪽 끝을 막는다.
        max_completion_tokens: EXPLAIN_MAX_TOKENS,
        messages: [
          { role: "system", content: EXPLAIN_SYSTEM_PROMPT },
          { role: "user", content: input },
        ],
      },
      // AI가 느려도 화면이 오래 기다리지 않도록 시간을 제한하고, 실패하면 다시 시도하지 않는다.
      { timeout: EXPLAIN_TIMEOUT_MS, maxRetries: 0 },
    );
    const choice = completion.choices[0];
    // 길이 제한에 걸려 글이 중간에 끊겼으면 쓰지 않는다.
    if (choice?.finish_reason === "length") return null;
    const text = choice?.message?.content?.trim();
    if (!text) return null;
    // 금지어가 있거나 새 숫자가 섞인 해설은 내보내지 않는다. 화면은 해설 칸을 숨긴다. (PLAN 21번)
    if (checkExplanation(text, input) !== null) return null;
    return text;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // 우리 화면이 보낸 JSON 요청만 받는다. 다른 사이트가 방문자의 브라우저로 부르는 것을 막는다. (CHECK.md SEC-002)
  if (!isJsonRequest(request.headers)) return Response.json(BAD_REQUEST, { status: 415 });
  if (!isSameSiteRequest(request.headers)) return Response.json(BAD_REQUEST, { status: 403 });

  const body = await request.json().catch(() => null);
  const id: unknown = body?.id;

  // 화면이 보낸 숫자는 받지 않는다. 번호로 서버가 직접 찾아 계산한다.
  const listed = typeof id === "string" ? findListedCase(casesData.cases, casesData.asOfDate, id) : null;
  if (listed === null) return Response.json(NOT_FOUND, { status: 404 });
  const caseId = listed.item.id;

  const cached = explanationCache.get(caseId);
  if (cached !== undefined) return Response.json({ text: cached });

  // 최근에 실패한 사례는 AI를 다시 부르지 않는다.
  if (failureCooldown.isCooling(caseId)) return Response.json(FAILED, { status: 502 });

  // 같은 사례를 이미 물어보는 중이면 그 답을 함께 기다린다. (AI를 새로 부르지 않으므로 호출 횟수에 세지 않는다)
  let pending = inFlight.get(caseId);
  if (pending === undefined) {
    if (!limiter.allow(clientKey(request))) return Response.json(TOO_MANY, { status: 429 });
    pending = generate(listed).finally(() => inFlight.delete(caseId));
    inFlight.set(caseId, pending);
  }

  const text = await pending;
  if (text === null) {
    // 키가 없는 경우도 같이 쉬게 되지만, 키가 없으면 어차피 매번 실패하므로 AI 요금은 나가지 않는다.
    failureCooldown.mark(caseId);
    return Response.json(FAILED, { status: 502 });
  }
  explanationCache.set(caseId, text);
  return Response.json({ text });
}
