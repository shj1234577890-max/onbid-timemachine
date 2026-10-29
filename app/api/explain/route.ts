// Design Ref: §6 POST /api/explain — 사례 번호만 받아 서버가 숫자를 다시 계산하고, AI에게 쉬운 해설을 부탁한다.
import { casesData, findListedCase } from "@/lib/cases";
import { buildExplainInput, EXPLAIN_SYSTEM_PROMPT } from "@/lib/explain";
import { EXPLAIN_MODEL, getOpenAI } from "@/lib/openai";

const NOT_FOUND = { error: "사례를 찾을 수 없습니다." };
const FAILED = { error: "해설을 불러오지 못했습니다." };

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const id: unknown = body?.id;

  // 화면이 보낸 숫자는 받지 않는다. 번호로 서버가 직접 찾아 계산한다.
  const listed = typeof id === "string" ? findListedCase(casesData.cases, casesData.asOfDate, id) : null;
  if (listed === null) return Response.json(NOT_FOUND, { status: 404 });

  const openai = getOpenAI();
  if (openai === null) return Response.json(FAILED, { status: 502 });

  try {
    const completion = await openai.chat.completions.create({
      model: EXPLAIN_MODEL,
      temperature: 0.3,
      messages: [
        { role: "system", content: EXPLAIN_SYSTEM_PROMPT },
        { role: "user", content: buildExplainInput(listed, casesData.asOfDate) },
      ],
    });
    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) return Response.json(FAILED, { status: 502 });
    return Response.json({ text });
  } catch {
    // 실패 원인(키 오류 등)은 화면에 내보내지 않는다.
    return Response.json(FAILED, { status: 502 });
  }
}
