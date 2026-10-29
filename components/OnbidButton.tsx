// Design Ref: §2.3 결과 화면 맨 아래 — "온비드에서 지금 나온 물건 보기" 버튼 (PRD 6번 nice 1개).
// 온비드는 주소에 지역 조건을 거는 방법이 공개돼 있지 않아, 부동산 물건 목록 첫 페이지로 연결한다. (PLAN 19번)

/** 온비드 부동산 물건 목록 첫 페이지 */
export const ONBID_REAL_ESTATE_URL =
  "https://www.onbid.co.kr/op/cltrpbancinf/clbtcltrclg/cltrclbtcltrclg/CltrClbtCltrClgController/mvmnCltrRlstClg.do";

export default function OnbidButton() {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-center">
      {/* 새 탭으로 열어 이 앱을 닫지 않는다. noopener로 온비드가 이 창을 건드리지 못하게 한다. */}
      <a
        href={ONBID_REAL_ESTATE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-xl bg-blue-700 px-6 py-4 text-center text-base font-semibold text-white hover:bg-blue-800 sm:text-lg dark:bg-blue-600 dark:hover:bg-blue-500"
      >
        온비드에서 지금 나온 물건 보기 →
      </a>
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">온비드 부동산 물건 목록으로 이동합니다 (새 창)</p>
    </div>
  );
}
