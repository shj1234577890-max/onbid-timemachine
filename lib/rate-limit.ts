// Design Ref: §6 POST /api/explain — 같은 사용자가 AI 해설을 짧은 시간에 너무 많이 부르지 못하게 막는다.
// 서버 메모리에만 세므로 서버가 다시 켜지면 0으로 돌아간다. 배포 환경이 여러 대면 대수만큼 허용량이 늘 수 있다.
// 비용 폭주를 막는 1차 안전장치이고, 가장 확실한 상한은 OpenAI 대시보드의 월 예산 설정이다. (CHECK.md SEC-002)

export type RateLimiter = {
  /** 허용하면 true(이번 요청을 센다), 한도를 넘으면 false */
  allow: (key: string, now?: number) => boolean;
};

export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  const hits = new Map<string, number[]>();
  let lastPrune = 0;
  return {
    allow(key, now = Date.now()) {
      // 오래 안 온 사용자 기록이 쌓이지 않도록, 창 길이마다 한 번씩 정리한다. (요청마다 훑지 않는다)
      if (now - lastPrune >= windowMs) {
        lastPrune = now;
        for (const [k, times] of hits) {
          if (times.every((t) => now - t >= windowMs)) hits.delete(k);
        }
      }
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      return true;
    },
  };
}
