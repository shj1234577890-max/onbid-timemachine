// Design Ref: §6 POST /api/explain — 해설이 한 번 실패한 사례는 잠시 AI를 다시 부르지 않는다. (CHECK.md SEC-002)
// 늘 검사에 걸리는 사례를 누가 계속 열어도 그때마다 AI 요금이 나가지 않게 한다. 서버 메모리에만 있다.

export type Cooldown = {
  /** 실패를 기록한다. */
  mark: (key: string, now?: number) => void;
  /** 아직 쉬는 중이면 true */
  isCooling: (key: string, now?: number) => boolean;
};

export function createCooldown(restMs: number): Cooldown {
  const until = new Map<string, number>();
  return {
    mark(key, now = Date.now()) {
      until.set(key, now + restMs);
    },
    isCooling(key, now = Date.now()) {
      const t = until.get(key);
      if (t === undefined) return false;
      if (now >= t) {
        until.delete(key);
        return false;
      }
      return true;
    },
  };
}
