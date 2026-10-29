// Design Ref: §6 POST /api/explain — 다른 사이트가 방문자의 브라우저를 시켜 이 창구를 부르는 것을 막는다. (CHECK.md SEC-002)

/** 본문이 JSON이라고 밝힌 요청인가. 우리 화면은 항상 이렇게 보낸다. */
export function isJsonRequest(headers: Headers): boolean {
  return (headers.get("content-type") ?? "").toLowerCase().startsWith("application/json");
}

/**
 * 같은 사이트에서 온 요청인가.
 * 브라우저는 요청마다 Sec-Fetch-Site를 붙이고 사이트가 마음대로 바꿀 수 없다.
 * 다른 사이트에서 온 요청은 "cross-site"나 "same-site"이므로 막는다.
 * 값이 없는 요청(curl 같은 도구, 오래된 브라우저)은 막지 않는다. 그 경우는 호출 횟수 제한이 막아 준다.
 */
export function isSameSiteRequest(headers: Headers): boolean {
  const site = headers.get("sec-fetch-site");
  return site === null || site === "same-origin";
}

/**
 * 호출 제한에 쓸 "사용자 구분 값". 알 수 없으면 null. (CHECK.md SEC-004)
 * Vercel이 직접 붙이는 값을 먼저 믿는다. 일반 x-forwarded-for는 Vercel 밖에서는 요청하는 사람이 마음대로 적을 수 있다.
 * 값이 길면 자른다. 아주 긴 값으로 서버 메모리를 채우는 일을 막기 위해서다.
 */
export function getClientKey(headers: Headers): string | null {
  const raw =
    headers.get("x-vercel-forwarded-for") ?? headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0] ?? null;
  const key = raw?.trim().slice(0, 64);
  return key ? key : null;
}
