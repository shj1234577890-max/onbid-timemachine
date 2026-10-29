// Design Ref: §2.3 결과 화면 /cases/[id] — 목록에 있는 사례 하나의 "그때 샀다면 지금 얼마?" 결과를 보여 준다.
// 예측 그래프(PLAN 18), AI 해설(PLAN 22), 온비드 버튼(PLAN 19)은 이 화면 아래쪽에 차례로 붙인다.
import Link from "next/link";
import { notFound } from "next/navigation";
import ResultSummary from "@/components/ResultSummary";
import { casesData, findListedCase, getListedCases } from "@/lib/cases";

/**
 * 목록에 있는 사례 페이지는 모두 미리 만들어 두므로 바로 열린다.
 * 그 밖의 번호(없는 번호, 목록에서 빠진 사례)만 서버에서 확인한 뒤 "사례를 찾을 수 없어요"(404)를 보낸다.
 * 이 확인을 기다리는 것은 괜찮다고 Next.js에 알려, 개발 중 "즉시 열리지 않는다"는 경고를 끈다. (instant.md)
 */
export const instant = false;

/** 목록에 있는 사례는 미리 만들어 둔다. (cacheComponents에서는 최소 1개가 필요하다) */
export function generateStaticParams() {
  return getListedCases(casesData.cases, casesData.asOfDate).map(({ item }) => ({ id: item.id }));
}

export default async function CasePage({ params }: PageProps<"/cases/[id]">) {
  const { id } = await params;
  // 없는 번호이거나 목록에서 빠진 사례(시세 없음, 기간 밖)면 결과를 보여 주지 않는다. (DESIGN §2.3)
  const listed = findListedCase(casesData.cases, casesData.asOfDate, id);
  if (listed === null) notFound();

  const { item } = listed;
  const backHref = `/?${new URLSearchParams({ sido: item.sido, sigungu: item.sigungu }).toString()}`;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 break-keep sm:px-6 sm:py-12">
      {/* 브라우저 뒤로 가기가 아니라 이 사례의 지역 목록으로 간다. 주소로 바로 들어온 사람도 돌아갈 수 있다. */}
      <Link
        href={backHref}
        className="self-start text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
      >
        ← {item.sigungu} 목록으로
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-50">{item.complexName}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          {item.sigungu} {item.dong} · {Math.floor(item.areaM2)}㎡
        </p>
      </header>

      <ResultSummary listed={listed} />
    </main>
  );
}
