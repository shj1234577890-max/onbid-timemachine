// Design Ref: §2.2 첫 화면 — 앱 이름, 큰 제목, 작은 설명 아래에 지역 선택을 둔다.
import { Suspense } from "react";
import RegionPicker from "@/components/RegionPicker";
import { regionKey } from "@/data/regions";
import { casesData, getListedCases } from "@/lib/cases";

/** 지역별 목록 사례 수. 서버에서 미리 세어 지역 선택 부품에 넘긴다. */
function countCasesByRegion(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const { item } of getListedCases(casesData.cases, casesData.asOfDate)) {
    const key = regionKey(item.sido, item.sigungu);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-4 py-12 sm:px-6 sm:py-16">
      {/* break-keep: 한국어가 "기회를"처럼 단어 중간에서 끊기지 않고 띄어쓰기에서만 줄을 바꾸게 한다. */}
      <section className="flex flex-col gap-4 break-keep">
        <p className="text-sm font-semibold tracking-wide text-blue-700 dark:text-blue-300">
          온비드 타임머신
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
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
        <RegionPicker caseCounts={countCasesByRegion()} />
      </Suspense>
    </main>
  );
}
