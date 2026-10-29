// Design Ref: §5.3 예측 — 과거 10개 연도 시세의 흐름으로 앞으로 10년의 시세를 낙관·기준·비관 3가지와 물가 기준선으로 계산한다.
// 연도를 고정하지 않고 받아서 계산한다. 그래야 같은 함수로 예측 검증(2006~2015년 → 2016~2025년)도 할 수 있다.
import type { DateString, YearlyPrices } from "./types.ts";

/** 예측 근거로 쓰는 연도 수 (10개 연도 = 9번의 연간 변화) */
export const BASIS_YEARS = 10;
/** 예측하는 햇수 */
export const FORECAST_YEARS = 10;
/** 물가 기준선의 연 상승률: 물가상승률 연 2% 가정 (한국은행 물가안정목표). 예측선이 아니라 비교용 점선이다. */
export const INFLATION_RATE = 0.02;
/** 낙관·비관이 기준에서 벌어지는 폭: 연 2%p. 세 줄 순서가 항상 낙관 ≥ 기준 ≥ 비관이 된다. */
export const SCENARIO_SPREAD = 0.02;

/** 예측선 세 줄과 물가 기준선의 연 상승률 (0.05 = 연 5%) */
export type ForecastRates = {
  /** 기준: 근거 연도 9번 변화의 연평균 상승률 */
  base: number;
  /** 낙관: 기준 + 2%p */
  optimistic: number;
  /** 비관: 기준 − 2%p */
  pessimistic: number;
  /** 물가 기준선: 연 2% */
  inflation: number;
};

/** 예측한 한 해의 시세 (원 단위로 반올림) */
export type ForecastPoint = {
  year: number;
  base: number;
  optimistic: number;
  pessimistic: number;
  inflation: number;
};

export type Forecast = {
  rates: ForecastRates;
  points: ForecastPoint[];
};

/**
 * 근거 연도 시세로 세 시나리오의 연 상승률을 구한다.
 * fromYear~toYear 사이 연도 시세가 하나라도 빠졌거나 연도가 2개보다 적으면 null이다. ("예측에 필요한 데이터가 부족합니다")
 */
export function getForecastRates(
  yearlyPrices: YearlyPrices,
  fromYear: number,
  toYear: number,
): ForecastRates | null {
  const values: number[] = [];
  for (let year = fromYear; year <= toYear; year++) {
    const price = yearlyPrices[String(year)];
    if (price === undefined || price <= 0) return null;
    values.push(price);
  }
  if (values.length < 2) return null;

  const changes = values.length - 1; // 10개 연도면 9번
  const base = Math.pow(values[values.length - 1] / values[0], 1 / changes) - 1;

  return {
    base,
    optimistic: base + SCENARIO_SPREAD,
    pessimistic: base - SCENARIO_SPREAD,
    inflation: INFLATION_RATE,
  };
}

/**
 * 출발 시세에서 해마다 각 상승률을 곱해 나가며 앞으로의 시세를 계산한다.
 * 첫 예측 연도는 startYear의 다음 해다. (startYear 2026 → 2027~2036년)
 */
export function projectPrices(
  rates: ForecastRates,
  startPrice: number,
  startYear: number,
  years: number,
): ForecastPoint[] {
  const points: ForecastPoint[] = [];
  for (let k = 1; k <= years; k++) {
    points.push({
      year: startYear + k,
      base: Math.round(startPrice * Math.pow(1 + rates.base, k)),
      optimistic: Math.round(startPrice * Math.pow(1 + rates.optimistic, k)),
      pessimistic: Math.round(startPrice * Math.pow(1 + rates.pessimistic, k)),
      inflation: Math.round(startPrice * Math.pow(1 + rates.inflation, k)),
    });
  }
  return points;
}

/** 마지막 예측 연도의 예상 수익률(%) 범위. 반올림하지 않은 값이다. */
export type TenYearOutlook = {
  year: number;
  base: number;
  optimistic: number;
  pessimistic: number;
};

/**
 * "10년 뒤 예상 수익률": 마지막 예측 연도의 (예측 시세 − 낙찰가) ÷ 낙찰가 × 100을 세 시나리오로 구한다.
 * 한 시점을 찍어 주지 않고 범위로 보여 주기 위해서다. (PRD §5 must ②) 예측이 비어 있으면 null이다.
 */
export function getTenYearOutlook(points: readonly ForecastPoint[], winningBid: number): TenYearOutlook | null {
  const last = points[points.length - 1];
  if (last === undefined) return null;
  const rate = (price: number) => ((price - winningBid) / winningBid) * 100;
  return {
    year: last.year,
    base: rate(last.base),
    optimistic: rate(last.optimistic),
    pessimistic: rate(last.pessimistic),
  };
}

/** 예측 검증 통과 기준: 마지막 해 오차 평균 ±15% 이내 (실제 데이터로 바꾼 뒤 판정) */
export const BACKTEST_TOLERANCE = 0.15;

/** 예측 검증에서 한 해의 결과 */
export type BacktestYear = {
  year: number;
  predicted: number;
  actual: number;
  /** |예측 − 실제| ÷ 실제 (0.12 = 12%) */
  error: number;
};

/** 예측 검증 연도. 기준일이 2026년이면 근거 2006~2015년, 맞힐 해 2016~2025년이다. */
export function getBacktestYears(asOfDate: DateString): { basisFrom: number; basisTo: number; targetTo: number } {
  const asOfYear = Number(asOfDate.slice(0, 4));
  return {
    basisFrom: asOfYear - BASIS_YEARS * 2,
    basisTo: asOfYear - BASIS_YEARS - 1,
    targetTo: asOfYear - 1,
  };
}

/**
 * 예측 검증 (DESIGN §8): 과거 10개 연도 시세로 상승률을 구하고, 근거 마지막 해 시세에서 출발해
 * 기준 예측선으로 그다음 10년을 예측한 뒤, 실제 시세와 해마다 비교한다.
 * 20개 연도 시세가 하나라도 빠진 사례는 검증하지 않는다(null).
 */
export function backtestCase(yearlyPrices: YearlyPrices, asOfDate: DateString): BacktestYear[] | null {
  const { basisFrom, basisTo, targetTo } = getBacktestYears(asOfDate);
  for (let year = basisFrom; year <= targetTo; year++) {
    if (yearlyPrices[String(year)] === undefined) return null;
  }
  const rates = getForecastRates(yearlyPrices, basisFrom, basisTo);
  if (rates === null) return null;

  const startPrice = yearlyPrices[String(basisTo)] as number;
  return projectPrices(rates, startPrice, basisTo, targetTo - basisTo).map(({ year, base }) => {
    const actual = yearlyPrices[String(year)] as number;
    return { year, predicted: base, actual, error: Math.abs(base - actual) / actual };
  });
}

/**
 * 결과 화면용 예측. 기준일 직전 10개 연도(기준일이 2026년이면 2016~2025년) 시세를 근거로,
 * 현재 시세에서 출발해 기준일 다음 해부터 10년을 예측한다.
 * 근거 연도 시세가 하나라도 빠지면 null이다. (PRD §5 must ②)
 */
export function getCaseForecast(
  yearlyPrices: YearlyPrices,
  currentPrice: number,
  asOfDate: DateString,
): Forecast | null {
  const asOfYear = Number(asOfDate.slice(0, 4));
  const rates = getForecastRates(yearlyPrices, asOfYear - BASIS_YEARS, asOfYear - 1);
  if (rates === null) return null;
  return { rates, points: projectPrices(rates, currentPrice, asOfYear, FORECAST_YEARS) };
}
