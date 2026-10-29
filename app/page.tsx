// Design Ref: §2.2 첫 화면 — 앱 이름, 큰 제목, 작은 설명을 보여 준다.
// 지역 선택과 사례 목록은 PLAN 15~16번에서 이 화면 아래쪽에 붙인다.

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
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
    </main>
  );
}
