// Design Ref: §2.2 첫 화면 — 앱 이름, 큰 제목, 작은 설명 아래에 지역 선택을 둔다.
import { Suspense } from "react";
import RegionPicker from "@/components/RegionPicker";
import { casesData, getListedCases, toCaseSummary } from "@/lib/cases";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 py-12 sm:px-6 sm:py-16">
      {/* break-keep: 한국어가 "기회를"처럼 단어 중간에서 끊기지 않고 띄어쓰기에서만 줄을 바꾸게 한다. */}
      <section className="flex flex-col gap-4 break-keep">
        {/* 앱 이름: 크고 굵게, 파랑→보라 색 흐름으로 눈에 먼저 들어오게 한다. 글자 색이 안 보이는 환경을 위해 text 색도 함께 둔다. */}
        <p className="text-5xl font-extrabold leading-none tracking-tight text-blue-700 sm:text-7xl dark:text-blue-300">
          <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-blue-300 dark:via-indigo-300 dark:to-violet-300">
            온비드 타임머신
          </span>
        </p>
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          지난 10년, 공매가 증명한 기회를
          <br />
          데이터로 확인하세요
        </h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          10년 전 그 공매, 지금은 어떤 가치가 되었을까요?
        </p>
      </section>

      {/* 지역 선택은 주소의 값을 브라우저에서 읽으므로 Suspense로 감싼다. 그 위 문구는 미리 만들어 빠르게 보인다. */}
      <Suspense fallback={<p className="text-sm text-zinc-500">지역 선택을 준비하고 있어요…</p>}>
        <RegionPicker
          cases={getListedCases(casesData.cases, casesData.asOfDate).map(toCaseSummary)}
        />
      </Suspense>
    </main>
  );
}
