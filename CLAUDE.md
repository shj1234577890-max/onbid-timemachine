# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 프로젝트 개요

**온비드 타임머신**: "10년 전 온비드 공매로 샀다면 지금 얼마를 벌었을까"를 보여 주고, 앞으로 10년의 시세를 예측해 보여 주는 웹앱이다. 목적은 온비드 홍보와 낙찰가율 향상이다.

- 기획의 기준 문서는 `PRD.md`다. 기능, 규칙, 범위를 정할 때 PRD를 먼저 읽고 따른다. PRD와 다르게 만들어야 하면 먼저 사용자에게 묻는다.
- 개발은 `PLAN.md`의 번호 순서대로 한 작업씩 진행한다.
- 현재 상태: 예시 데이터로 PRD의 전체 기능(지역 선택 → 사례 목록 → 수익 결과 → 10년 예측 그래프 → AI 해설 → 온비드 버튼)이 동작한다. 실제 데이터로 바꾸는 일(PLAN 25번)은 보류 중이다. 설계는 `DESIGN.md`, 진행은 `PLAN.md`를 본다.

## 명령어

```bash
npm run dev     # 개발 서버 (http://localhost:3000)
npm run build   # 프로덕션 빌드 (타입 검사 포함)
npm run lint    # ESLint
npm test        # 계산·표시 규칙·금지어 자동 채점 (Node 기본 테스트)
npm run backtest        # 예측 검증 (사례별 오차 출력)
npm run check:secrets   # 비밀 키 검사 (build 뒤에 실행, 값은 출력하지 않음)
```

테스트는 Node 기본 테스트(`tests/*.test.ts`)를 쓴다. `lib/` 파일끼리는 `./x.ts`처럼 상대경로와 `.ts` 확장자로 서로 부르고, 타입만 가져올 때는 `import type`을 쓴다. (DESIGN §1.1)

## 기술 구성 (변경 금지)

- Next.js 16.4.3 (App Router, `src/` 폴더 없음), React 19.3, TypeScript strict, Tailwind CSS 4, ESLint 9
- 화면과 서버 API를 이 한 프로젝트에서 처리하고, 배포는 Vercel을 사용한다. PRD 8번에 따라 기술 스택은 Next.js로 고정한다. **다른 프레임워크로 바꾸거나 마이그레이션을 제안하지 않는다.**
- `next.config.ts`에서 `cacheComponents`와 `partialPrefetching`이 켜져 있다. 동적 데이터, `params`, 캐싱을 다루기 전에 `node_modules/next/dist/docs/`의 해당 문서를 읽는다. 특히 `01-app/01-getting-started/08-caching.md`, `01-app/02-guides/migrating-to-cache-components.md`를 본다.
- Tailwind는 `@tailwindcss/turbopack` 로더로 CSS를 처리한다. 별도 `tailwind.config` 파일은 없다. 테마 값은 `app/globals.css`의 `@theme`에 있다.
- 가져오기 경로 별칭: `@/*` → 프로젝트 루트

## 꼭 지킬 도메인 규칙 (PRD 5~7번 요약)

자세한 숫자와 문구는 `PRD.md`를 기준으로 한다.

- **계산과 예측은 정해진 공식으로 코드에서 한다.** AI는 계산된 결과를 쉬운 말로 풀어 주는 해설만 쓰고, 숫자를 새로 만들지 않는다.
- 데이터에 없는 값은 지어내지 않는다. 현재 시세가 없는 사례는 목록에서 뺀다.
- 범위는 대구·경북 아파트, 2015~2017년 낙찰 사례, 100건 이내다. 데이터는 미리 받아 둔 파일로만 쓰고 실시간 API 연동은 하지 않는다.
- 실제 데이터를 받기 전까지는 같은 형식의 예시 데이터를 쓰고, 화면에 "예시 데이터"라고 표시한다.
- 예측 화면에는 PRD의 안내 문구 2종을 항상 표시한다. "사세요", "파세요", "최적의 매도 시점" 같은 단정 표현은 쓰지 않는다.
- 동·호수와 낙찰자 정보처럼 개인을 알아볼 수 있는 정보는 다루지 않는다.
- 비범위(로그인, 결제·입찰, 투자 상담, 공유 카드, 사례 비교 등)는 만들지 않는다.

## 환경 변수

- `.env`에는 `GITHUB_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `VERCEL_TOKEN`, `OPENAI_API_KEY`가 들어 있다.
- `.env` 등 비밀 정보 파일과 `node_modules` 폴더는 `.gitignore`에 등록해 두고 절대 커밋하지 않는다. (현재 `.env*`, `/node_modules` 규칙으로 등록돼 있다.)
- `.env`의 값은 출력하거나 로그에 남기지 않는다. 확인할 때는 "값 있음 / 없음"으로만 말한다.
- 외부 서비스 인증이 필요하면 토큰 값을 사용자에게 묻거나 채팅에 출력하지 않고, `.env`에 있는 값을 읽어서 사용한다.
  - Supabase 작업이 필요하면 Supabase CLI를 설치해 `.env`의 `SUPABASE_ACCESS_TOKEN`으로 작업한다.
  - Vercel 작업(배포 등)이 필요하면 Vercel CLI를 설치해 `.env`의 `VERCEL_TOKEN`으로 인증해 작업한다.
- API 키는 서버 쪽 코드(Route Handler 등)에서만 읽는다. `NEXT_PUBLIC_` 접두사를 붙이지 않는다.

## 작업 규칙

- 모든 설명과 코드 주석은 한국어로 작성한다.
- 새 파일은 my-app 폴더 안에만 만든다.
- 코드를 바꾸면 무엇을 왜 바꿨는지 반드시 한 줄로 알려 준다.
- 파일을 지워야 할 때는 바로 삭제하지 않는다. my-app 안에 `trash-can` 폴더를 만들어 그 안으로 옮겨만 둔다. 삭제는 작업이 끝난 뒤 사용자가 직접 확인하고 한다.
- 이미 설치된 서브에이전트(bkit 플러그인의 에이전트 등)는 필요할 때마다 적극 활용한다.

## 작업 절차 (검증 루프)

변경할 때마다 아래 순서를 반복한다.

1. 변경한다.
2. `npm run lint`와 `npm run build`를 실행해 오류가 없는지 확인한다.
3. 화면이 바뀐 작업이면 `npm run dev`로 띄워 실제로 보이는지 확인한다.
4. 문제가 있으면 고치고 다시 1번으로 돌아간다.
5. 통과하면 git 커밋으로 그 상태를 남긴다. 커밋 메시지는 아래 "커밋 규칙"을 따른다. **검증을 통과하지 못한 상태는 커밋하지 않는다.**
6. 무엇을 왜 바꿨는지 한 줄로 요약해 알려 준다.

## 커밋 규칙

- 브랜치를 새로 만들지 않는다. 모든 작업과 커밋은 `main`에서 바로 한다.

- 커밋 메시지는 한국어로, 무엇을 왜 바꿨는지 한 줄로 적는다.
- 커밋하기 전에 `git status`와 스테이징된 파일 목록으로 `.env` 같은 비밀 값 파일이 커밋에 들어가지 않았는지 확인한다.

## 사용자와 소통

- 사용자는 비개발자·개발 입문자다. 모든 설명은 비개발자도 이해할 수 있게 쉬운 말로 한다. 전문 용어는 되도록 피하고, 써야 하면 일상 비유로 바로 풀어 준다.
- 기획(PRD)을 바꾸는 결정은 초안을 제안하고 사용자의 동의를 받은 뒤 반영한다.
