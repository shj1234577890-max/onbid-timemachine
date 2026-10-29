// Design Ref: §5.1 목록에 보일 사례 — 사례 파일을 읽어, 목록·결과 화면·AI 해설이 함께 쓸 "보여 줄 사례"를 고른다.
import casesFile from "../data/cases.json" with { type: "json" };
import { formatProfitRate, formatWon } from "./format.ts";
import { getBidRatio, getCurrentPrice, getProfitAmount, getProfitRate } from "./profit.ts";
import type { Case, CasesFile, DateString, Sido } from "./types.ts";
import { parseCasesFile } from "./validate.ts";

/** 예시 사례 파일 전체 (데이터 기준일, 예시 데이터 여부, 사례 목록) */
export const casesData: CasesFile = parseCasesFile(casesFile);

/** 목록 조건을 통과한 사례 하나와, 그 사례로 미리 계산해 둔 값 */
export type ListedCase = {
  item: Case;
  /** 현재 시세 (원) */
  currentPrice: number;
  /** 시세 차익 (원). 손실이면 음수 */
  profitAmount: number;
  /** 수익률 (%). 반올림하지 않은 값 */
  profitRate: number;
  /** 감정가 대비 낙찰가율 (%). 반올림하지 않은 값 */
  bidRatio: number;
  /** 낙찰일부터 기준일까지의 보유 기간 (반올림한 햇수) */
  holdingYears: number;
};

/**
 * 낙찰 기간. 기준일 연도에서 거꾸로 계산한다: (기준일 연도 − 11)년 ~ (기준일 연도 − 9)년.
 * 기준일이 2026년이면 2015~2017년이다. 기준일이 바뀌면 함께 바뀐다. (PRD §5 must ①)
 */
export function getAuctionPeriod(asOfDate: DateString): { fromYear: number; toYear: number } {
  const year = Number(asOfDate.slice(0, 4));
  return { fromYear: year - 11, toYear: year - 9 };
}

/** "2016-05-12" 같은 날짜 글자를 1970-01-01부터 센 날수로 바꾼다. 시간대와 상관없이 같은 값이 나온다. */
function toDayNumber(date: DateString): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/**
 * 보유 기간: 낙찰일부터 기준일까지의 햇수를 반올림한 정수.
 * 예: 2016-05-12 → 2026-10-28은 10.46년이라 "약 10년"이다.
 * AI 해설이 기간을 지어내지 않도록 서버가 이 값을 넘겨준다. (DESIGN §6)
 */
export function getHoldingYears(auctionDate: DateString, asOfDate: DateString): number {
  const years = (toDayNumber(asOfDate) - toDayNumber(auctionDate)) / 365.2425;
  return Math.round(years);
}

/**
 * 목록에 보여 줄 사례를 고르고 줄 세운다.
 * - 낙찰일이 낙찰 기간 안인 사례만
 * - 현재 시세가 있는 사례만 (시세 없음은 뺀다)
 * - 수익률 높은 순. 수익률이 같으면 낙찰일이 빠른 순
 * 결과 화면과 AI 해설도 이 목록에 있는 사례만 다룬다. (DESIGN §2.3, §6)
 */
export function getListedCases(cases: readonly Case[], asOfDate: DateString): ListedCase[] {
  const { fromYear, toYear } = getAuctionPeriod(asOfDate);
  const listed: ListedCase[] = [];

  for (const item of cases) {
    const auctionYear = Number(item.auctionDate.slice(0, 4));
    if (auctionYear < fromYear || auctionYear > toYear) continue;

    const currentPrice = getCurrentPrice(item, asOfDate);
    if (currentPrice === null) continue;

    listed.push({
      item,
      currentPrice,
      profitAmount: getProfitAmount(currentPrice, item.winningBid),
      profitRate: getProfitRate(currentPrice, item.winningBid),
      bidRatio: getBidRatio(item.winningBid, item.appraisalPrice),
      holdingYears: getHoldingYears(item.auctionDate, asOfDate),
    });
  }

  return listed.sort(
    (a, b) => b.profitRate - a.profitRate || a.item.auctionDate.localeCompare(b.item.auctionDate),
  );
}

/**
 * 목록 카드 한 장에 보여 줄 글자 묶음. 서버에서 미리 만들어 브라우저로 넘긴다.
 * 동·호수와 낙찰자 정보는 넣지 않는다. (PRD §7)
 */
export type CaseSummary = {
  id: string;
  sido: Sido;
  sigungu: string;
  dong: string;
  complexName: string;
  /** "84㎡" — 전용면적의 정수 부분 */
  areaText: string;
  /** "2016.05" — 낙찰 연월 */
  auctionMonthText: string;
  /** "2억 8,000만 원" */
  winningBidText: string;
  /** "+62.3%" 또는 "손실 −12.3%" */
  profitRateText: string;
  /** 반올림한 뒤 손실이면 true. 화면에서 빨간색으로 보여 준다. */
  isLoss: boolean;
};

/** 목록 사례 하나를 카드용 글자 묶음으로 바꾼다. */
export function toCaseSummary({ item, profitRate }: ListedCase): CaseSummary {
  const profitRateText = formatProfitRate(profitRate);
  return {
    id: item.id,
    sido: item.sido,
    sigungu: item.sigungu,
    dong: item.dong,
    complexName: item.complexName,
    areaText: `${Math.floor(item.areaM2)}㎡`,
    auctionMonthText: item.auctionDate.slice(0, 7).replace("-", "."),
    winningBidText: formatWon(item.winningBid),
    profitRateText,
    // 표시 글자와 색이 어긋나지 않도록, 반올림한 표시 글자를 보고 손실인지 정한다.
    isLoss: profitRateText.startsWith("손실"),
  };
}

/** 고른 시·도와 시·군·구의 사례만 남긴다. 줄 세운 순서는 그대로 둔다. */
export function filterByRegion(listed: readonly ListedCase[], sido: Sido, sigungu: string): ListedCase[] {
  return listed.filter(({ item }) => item.sido === sido && item.sigungu === sigungu);
}

/**
 * 사례 번호로 목록에 있는 사례를 찾는다.
 * 없는 번호이거나 목록 조건에 맞지 않는 사례(시세 없음, 기간 밖)는 null이다. → "사례를 찾을 수 없어요"
 */
export function findListedCase(
  cases: readonly Case[],
  asOfDate: DateString,
  id: string,
): ListedCase | null {
  return getListedCases(cases, asOfDate).find(({ item }) => item.id === id) ?? null;
}
