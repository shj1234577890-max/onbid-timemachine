// Design Ref: §2.2 첫 화면 — 앱 이름, 큰 제목, 작은 설명 아래에 지역 선택을 둔다.
import { Suspense } from "react";
import RegionPicker from "@/components/RegionPicker";
import { casesData, getListedCases, toCaseSummary } from "@/lib/cases";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 py-12 sm:px-6 sm:py-16">
      {/* break-keep: 한국어가 "기회를"처럼 단어 중간에서 끊기지 않고 띄어쓰기에서만 줄을 바꾸게 한다. */}
      <section className="flex flex-col gap-4 break-keep">
        {/* 앱 이름: 영문 작은 글씨 위에, 한글 이름은 진한 색으로 크게, 핵심 단어 "타임머신"만 은은한 색 흐름으로 포인트를 준다. */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500 dark:text-zinc-400">Onbid Time Machine</p>
          <p className="text-[2.5rem] font-bold leading-[1.1] tracking-tighter text-zinc-900 sm:text-7xl dark:text-zinc-50">
            온비드{" "}
            <span className="bg-gradient-to-br from-blue-700 to-indigo-500 bg-clip-text text-transparent dark:from-blue-300 dark:to-indigo-300">
              타임머신
            </span>
            {/* 되감기 시계 아이콘: "시간을 거슬러 간다"는 타임머신 느낌. 글자 크기에 맞춰 커지고, 글자 색을 따라간다. */}
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-2 inline-block h-[0.8em] w-[0.8em] -translate-y-[0.06em] text-indigo-500 dark:text-indigo-300"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M12 7v5l4 2" />
            </svg>
          </p>
          <span aria-hidden="true" className="mt-1 h-1 w-12 rounded-full bg-blue-700 dark:bg-blue-300" />
        </div>
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
