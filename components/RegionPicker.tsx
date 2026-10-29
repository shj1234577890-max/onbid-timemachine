"use client";

// Design Ref: §2.2 지역 선택 — 시·도 → 시·군·구 2단계 버튼. 고른 지역은 주소(/?sido=…&sigungu=…)에 남겨,
// 결과 화면에서 "← 목록으로"를 눌러도, 주소를 공유해도 같은 지역이 다시 보이게 한다.
// 주소의 값을 브라우저에서 읽으므로(useSearchParams) 첫 화면에서는 <Suspense>로 감싸야 한다. (DESIGN §9)
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { regionKey, SIDO_LIST, SIGUNGU_BY_SIDO } from "@/data/regions";
import type { Sido } from "@/lib/types";

type Props = {
  /** "대구|수성구" 같은 지역 열쇠별 목록 사례 수. 서버가 미리 세어 넘겨준다. */
  caseCounts: Record<string, number>;
};

/** 고른 지역을 담은 첫 화면 주소를 만든다. */
function regionHref(sido?: Sido, sigungu?: string): string {
  const params = new URLSearchParams();
  if (sido) params.set("sido", sido);
  if (sido && sigungu) params.set("sigungu", sigungu);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

/** 주소에 적힌 값이 목록에 있는 시·도·시·군·구일 때만 받아들인다. 잘못된 값은 "고르지 않음"으로 본다. */
function readSelection(searchParams: URLSearchParams): { sido?: Sido; sigungu?: string } {
  const sidoParam = searchParams.get("sido");
  const sido = SIDO_LIST.find((s) => s === sidoParam);
  if (!sido) return {};
  const sigunguParam = searchParams.get("sigungu");
  const sigungu = SIGUNGU_BY_SIDO[sido].find((g) => g === sigunguParam);
  return { sido, sigungu };
}

const buttonBase =
  "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
const buttonOn = "border-blue-700 bg-blue-700 text-white dark:border-blue-400 dark:bg-blue-400 dark:text-zinc-950";
const buttonOff =
  "border-zinc-300 bg-white text-zinc-800 hover:border-blue-500 hover:text-blue-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-blue-400 dark:hover:text-blue-300";

export default function RegionPicker({ caseCounts }: Props) {
  const { sido, sigungu } = readSelection(useSearchParams());
  const count = sido && sigungu ? (caseCounts[regionKey(sido, sigungu)] ?? 0) : null;

  return (
    <section aria-labelledby="region-heading" className="flex flex-col gap-5">
      <h2 id="region-heading" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        지역을 골라 보세요
      </h2>

      {/* 1단계: 시·도 */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="시·도">
        {SIDO_LIST.map((s) => (
          <Link
            key={s}
            href={regionHref(s)}
            scroll={false}
            aria-current={s === sido ? "true" : undefined}
            className={`${buttonBase} ${s === sido ? buttonOn : buttonOff}`}
          >
            {s}
          </Link>
        ))}
      </div>

      {/* 2단계: 시·군·구 (시·도를 고른 뒤에만 보인다) */}
      {sido && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={`${sido} 시·군·구`}>
          {SIGUNGU_BY_SIDO[sido].map((g) => (
            <Link
              key={g}
              href={regionHref(sido, g)}
              scroll={false}
              aria-current={g === sigungu ? "true" : undefined}
              className={`${buttonBase} ${g === sigungu ? buttonOn : buttonOff}`}
            >
              {g}
            </Link>
          ))}
        </div>
      )}

      {/* 고른 지역의 사례 수. 사례 목록 카드는 PLAN 16번에서 이 자리에 붙인다. */}
      {count !== null && (
        <p role="status" className="text-base text-zinc-700 dark:text-zinc-300">
          {count === 0
            ? "이 지역에는 해당 기간 사례가 없어요. 다른 지역을 골라 보세요."
            : `${sigungu} 사례 ${count}건`}
        </p>
      )}
    </section>
  );
}
