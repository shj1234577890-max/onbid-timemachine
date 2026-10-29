// Design Ref: §8 확인 계획(화면 흐름·예외 화면·3초·휴대폰) — 사람이 직접 눌러 보던 확인을 자동으로 한다.
// 컴퓨터에 설치된 Chrome을 쓰므로 브라우저를 따로 내려받지 않는다. 실행: npm run test:e2e
import { defineConfig } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
    locale: "ko-KR",
  },
  // 개발 서버가 아니라 실제 배포와 같은 방식(build → start)으로 띄워 3초 측정도 정확하게 한다.
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 240_000,
    reuseExistingServer: false,
  },
});
