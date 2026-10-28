// Design Ref: §4 데이터 형식 — 예시 데이터와 실제 데이터가 같은 모양을 쓰도록 데이터의 모양을 한곳에 정해 둔다.
// 이 파일에는 타입만 둔다. 다른 파일에서는 `import type { … } from "./types.ts"`로 가져온다. (DESIGN §1.1)

/** 날짜 글자. "2026-10-28"처럼 연-월-일 형식이다. */
export type DateString = string;

/** 시·도. 지금 행정구역 기준이다. (군위군은 2023년부터 대구) */
export type Sido = "대구" | "경북";

/** 현재 시세 계산에 쓰는 최근 실거래 한 건. 금액은 원 단위 정수다. */
export type Deal = {
  date: DateString;
  areaM2: number;
  price: number;
};

/**
 * 연도별 평균 시세. 키는 "2006"~"2025" 같은 연도 글자, 값은 원 단위 정수다.
 * 같은 단지에서 전용면적 차이 ±3㎡ 이내 거래의 연평균이며, 거래가 없던 해는 키를 아예 넣지 않는다.
 */
export type YearlyPrices = Partial<Record<string, number>>;

/** 공매 낙찰 사례 하나. 동·호수와 낙찰자 정보는 넣지 않는다. (PRD §7) */
export type Case = {
  /** 주소창에 쓰이는 영문 번호. 예: "dg-suseong-001" */
  id: string;
  sido: Sido;
  /** 시·군·구. 지금 행정구역 기준이다. 예: "수성구" */
  sigungu: string;
  /** 법정동. 예: "범어동" */
  dong: string;
  complexName: string;
  /** 전용면적 (㎡) */
  areaM2: number;
  auctionDate: DateString;
  /** 감정가 (원). 낙찰가율 계산에 쓴다. */
  appraisalPrice: number;
  /** 낙찰가 (원) */
  winningBid: number;
  yearlyPrices: YearlyPrices;
  recentDeals: Deal[];
};

/** `data/cases.json` 파일 전체의 모양 */
export type CasesFile = {
  /** 데이터 기준일. 현재 시세와 예측 연도는 모두 이 날짜를 기준으로 계산한다. */
  asOfDate: DateString;
  /** true이면 화면 맨 위에 "예시 데이터" 띠를 보여 준다. */
  isSample: boolean;
  cases: Case[];
};
