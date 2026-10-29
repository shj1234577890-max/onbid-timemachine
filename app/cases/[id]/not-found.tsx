// Design Ref: §2.3 — 없는 사례 번호이거나 목록에서 빠진 사례를 주소로 직접 열었을 때 보여 주는 화면.
import Link from "next/link";

export default function CaseNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-4 px-4 py-16 break-keep sm:px-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">사례를 찾을 수 없어요</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        주소가 잘못되었거나, 지금은 보여 드릴 수 없는 사례예요. 첫 화면에서 지역을 다시 골라 보세요.
      </p>
      <Link
        href="/"
        className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 dark:bg-blue-400 dark:text-zinc-950 dark:hover:bg-blue-300"
      >
        첫 화면으로 돌아가기
      </Link>
    </main>
  );
}
