import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * 브라우저에게 주는 안전 규칙(CHECK.md SEC-003). 로그인·결제가 없는 앱이라 실제 피해는 작지만,
 * 나중에 문제가 생겼을 때 막아 주는 두 번째 방어선이 된다.
 * - script-src 'unsafe-inline': Next.js가 화면 안에 넣는 작은 스크립트가 있어 필요하다. (nonce 방식은 모든 페이지를 매번 새로 만들어야 해서 쓰지 않는다)
 * - style-src 'unsafe-inline': Recharts 그래프와 Tailwind가 인라인 스타일을 쓴다.
 * - 'unsafe-eval'은 개발 서버(npm run dev)에서만 켠다.
 * - upgrade-insecure-requests는 넣지 않는다. http://localhost에서 시험할 때 모든 요청이 https로 바뀌어 깨진다. (https 강제는 Vercel이 한다)
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 응답 헤더에 "X-Powered-By: Next.js"를 붙이지 않는다.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
