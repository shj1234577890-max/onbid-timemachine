// Design Ref: §5.1 수익 계산 — 계산은 모두 여기서 원 단위로 하고, 화면과 AI는 결과만 받아 쓴다.
import type { Case, DateString } from "./types.ts";

/** 현재 시세에 넣을 거래의 면적 허용 범위: 낙찰 물건과 전용면적 차이 ±3㎡ (경계 포함) */
const AREA_TOLERANCE_M2 = 3;

/**
 * 면적(㎡)을 0.01㎡ 단위 정수로 바꾼다. (84.9 → 8490)
 * 소수끼리 빼면 생기는 아주 작은 오차 때문에 딱 3㎡ 차이인 거래가 빠지는 일을 막는다.
 */
function toCentiM2(areaM2: number): number {
  return Math.round(areaM2 * 100);
}

/**
 * 기준일로부터 1년 전 날짜. ("2026-10-28" → "2025-10-28")
 * 날짜는 "연-월-일" 글자 그대로 비교하므로, 컴퓨터의 시간대 설정과 상관없이 결과가 같다.
 */
function oneYearBefore(date: DateString): DateString {
  const year = Number(date.slice(0, 4));
  return `${year - 1}${date.slice(4)}`;
}

/**
 * 현재 시세(원). 아래 두 조건을 모두 만족하는 최근 거래의 평균을 원 단위로 반올림한 값이다.
 * - 거래일이 [기준일 − 1년, 기준일] 안 (양 끝 포함). "오늘"이 아니라 데이터 기준일을 쓴다.
 * - 낙찰 물건과 전용면적 차이가 ±3㎡ 이내 (경계 포함)
 * 조건에 맞는 거래가 하나도 없으면 null("시세 없음")을 돌려준다. 이런 사례는 목록에서 뺀다.
 */
export function getCurrentPrice(item: Case, asOfDate: DateString): number | null {
  const from = oneYearBefore(asOfDate);
  const area = toCentiM2(item.areaM2);
  const prices = item.recentDeals
    .filter(
      (deal) =>
        deal.date >= from &&
        deal.date <= asOfDate &&
        Math.abs(toCentiM2(deal.areaM2) - area) <= AREA_TOLERANCE_M2 * 100,
    )
    .map((deal) => deal.price);

  if (prices.length === 0) return null;
  const sum = prices.reduce((total, price) => total + price, 0);
  return Math.round(sum / prices.length); // 시세는 양수라 Math.round가 "0.5는 올림"과 같다.
}

/** 시세 차익(원) = 현재 시세 − 낙찰가. 손실이면 음수다. */
export function getProfitAmount(currentPrice: number, winningBid: number): number {
  return currentPrice - winningBid;
}

/**
 * 수익률(%) = (현재 시세 − 낙찰가) ÷ 낙찰가 × 100.
 * 반올림하지 않은 값을 돌려준다. 반올림은 화면에 보여 줄 때 `formatProfitRate`가 한다.
 */
export function getProfitRate(currentPrice: number, winningBid: number): number {
  return (getProfitAmount(currentPrice, winningBid) / winningBid) * 100;
}

/**
 * 감정가 대비 낙찰가율(%) = 낙찰가 ÷ 감정가 × 100.
 * "감정가보다 얼마나 싸게 샀는지"를 보여 준다. 반올림은 화면에 보여 줄 때 `formatBidRatio`가 한다.
 */
export function getBidRatio(winningBid: number, appraisalPrice: number): number {
  return (winningBid / appraisalPrice) * 100;
}
