"use client";

// Design Ref: §2.3 AI 해설 칸 — 사례 번호만 서버(/api/explain)에 보내고, 받은 해설 글을 보여 준다.
// 불러오는 동안은 "해설을 쓰는 중…", 실패하면 칸을 통째로 숨긴다. 나머지 결과 화면은 그대로 둔다.
import { useEffect, useState } from "react";

type State = { status: "loading" } | { status: "done"; text: string } | { status: "failed" };

export default function AiExplanation({ id }: { id: string }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    // 화면을 떠나거나 다시 그려질 때 이전 요청은 취소한다.
    const controller = new AbortController();
    fetch("/api/explain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
      signal: controller.signal,
    })
      .then(async (res) => {
        const data: unknown = await res.json().catch(() => null);
        const text = res.ok && data && typeof data === "object" && "text" in data ? data.text : null;
        setState(typeof text === "string" && text !== "" ? { status: "done", text } : { status: "failed" });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({ status: "failed" });
      });
    return () => controller.abort();
  }, [id]);

  if (state.status === "failed") return null;

  return (
    <section
      aria-labelledby="ai-heading"
      className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 id="ai-heading" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
        AI 해설
      </h2>
      <div aria-live="polite" className="mt-3 text-zinc-800 dark:text-zinc-200">
        {state.status === "loading" ? (
          <p className="text-zinc-500 dark:text-zinc-400">해설을 쓰는 중…</p>
        ) : (
          <p className="leading-relaxed">{state.text}</p>
        )}
      </div>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">위 숫자를 AI가 쉬운 말로 풀어 쓴 글입니다. 숫자는 계산 결과 그대로입니다.</p>
    </section>
  );
}
