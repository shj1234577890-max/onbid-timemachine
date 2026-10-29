// Design Ref: §5.3 예측 — 상승률과 예측 시세를 손 계산 정답과 비교한다.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  backtestCase,
  getBacktestYears,
  getCaseForecast,
  getForecastRates,
  getTenYearOutlook,
  projectPrices,
} from "../lib/forecast.ts";
import type { ForecastPoint } from "../lib/forecast.ts";
import type { YearlyPrices } from "../lib/types.ts";

/** 2016~2025년 시세. 첫해 100 → 마지막 해 200 */
const SAMPLE: YearlyPrices = Object.fromEntries(
  [100, 110, 105, 120, 150, 140, 160, 170, 190, 200].map((price, i) => [String(2016 + i), price]),
);

/** 소수점 넷째 자리까지만 비교한다. */
const round4 = (x: number) => Math.round(x * 10_000) / 10_000;

test("상승률: 기준 = 2^(1/9) − 1 = 8.01%, 낙관 = 기준 + 2%p, 비관 = 기준 − 2%p, 물가 기준선 = 2%", () => {
  const rates = getForecastRates(SAMPLE, 2016, 2025);
  assert.ok(rates);
  assert.equal(round4(rates.base), 0.0801);
  assert.equal(round4(rates.optimistic), 0.1001);
  assert.equal(round4(rates.pessimistic), 0.0601);
  assert.equal(rates.inflation, 0.02);
});

test("세 줄 순서는 시세가 내린 지역에서도 항상 낙관 ≥ 기준 ≥ 비관", () => {
  // 10년 동안 200 → 100으로 내림: 기준 = 0.5^(1/9) − 1 = −7.41%
  const falling = Object.fromEntries(Array.from({ length: 10 }, (_, i) => [String(2016 + i), 200 - (i * 100) / 9]));
  const rates = getForecastRates(falling, 2016, 2025);
  assert.ok(rates);
  assert.equal(round4(rates.base), -0.0741);
  assert.ok(rates.optimistic > rates.base && rates.base > rates.pessimistic);
});

test("근거 연도 시세가 하나라도 빠지거나 연도가 1개뿐이면 예측하지 않는다", () => {
  const missing = { ...SAMPLE };
  delete missing["2019"];
  assert.equal(getForecastRates(missing, 2016, 2025), null);
  assert.equal(getForecastRates(SAMPLE, 2016, 2016), null);
});

test("예측 시세: 1억에서 출발해 해마다 상승률을 곱한다", () => {
  const points = projectPrices(
    { base: 0.05, optimistic: 0.07, pessimistic: 0.03, inflation: 0.02 },
    100_000_000,
    2026,
    10,
  );
  assert.equal(points.length, 10);
  assert.equal(points[0].year, 2027);
  assert.equal(points[9].year, 2036);
  assert.equal(points[0].base, 105_000_000); // 1억 × 1.05
  assert.equal(points[0].optimistic, 107_000_000); // 1억 × 1.07
  assert.equal(points[1].base, 110_250_000); // 1억 × 1.05 × 1.05
  assert.equal(points[1].pessimistic, 106_090_000); // 1억 × 1.03 × 1.03
  assert.equal(points[1].inflation, 104_040_000); // 1억 × 1.02 × 1.02
});

test("결과 화면용 예측은 기준일 직전 10개 연도로 기준일 다음 해부터 10년을 예측한다", () => {
  const forecast = getCaseForecast(SAMPLE, 100_000_000, "2026-10-28");
  assert.ok(forecast);
  assert.equal(round4(forecast.rates.base), 0.0801);
  assert.equal(forecast.points[0].year, 2027);
  assert.equal(getCaseForecast(SAMPLE, 100_000_000, "2027-10-28"), null); // 2026년 시세가 없다
});

const point = (year: number, base: number, optimistic: number, pessimistic: number): ForecastPoint => ({
  year,
  base,
  optimistic,
  pessimistic,
  inflation: 0,
});

test("10년 뒤 예상 수익률: 마지막 예측 연도의 수익률을 세 가지로", () => {
  // 낙찰가 5천만 → 2036년 기준 1억(+100%), 낙관 1억 3천(+160%), 비관 3천 5백(−30%)
  const outlook = getTenYearOutlook(
    [point(2035, 1, 1, 1), point(2036, 100_000_000, 130_000_000, 35_000_000)],
    50_000_000,
  );
  assert.deepEqual(outlook, { year: 2036, base: 100, optimistic: 160, pessimistic: -30 });
  assert.equal(getTenYearOutlook([], 100), null);
});

/** 2006~2025년 시세를 만든다. price(연도)로 각 해의 값을 정한다. */
const yearsFrom2006 = (price: (year: number) => number): YearlyPrices =>
  Object.fromEntries(Array.from({ length: 20 }, (_, i) => [String(2006 + i), price(2006 + i)]));

test("예측 검증 연도: 기준일 2026년이면 2006~2015년으로 2016~2025년을 맞힌다", () => {
  assert.deepEqual(getBacktestYears("2026-10-28"), { basisFrom: 2006, basisTo: 2015, targetTo: 2025 });
});

test("예측 검증: 20년 내내 해마다 2배가 되면 예측이 실제와 같아 오차 0", () => {
  // 2006년 1 → 2015년 512 (9번 변화, 기준 상승률 100%) → 2025년 예측 512 × 2^10 = 524,288 = 실제
  const result = backtestCase(yearsFrom2006((y) => 2 ** (y - 2006)), "2026-10-28");
  assert.ok(result);
  assert.equal(result.length, 10);
  assert.equal(result[0].year, 2016);
  assert.equal(result[9].year, 2025);
  for (const { error } of result) assert.ok(error < 0.000001);
});

test("예측 검증: 앞 10년은 2배씩, 뒤 10년은 그대로면 마지막 해 오차 = 2^10 − 1 = 1023배", () => {
  // 2025년 예측 524,288, 실제 512 → |524,288 − 512| ÷ 512 = 1,023
  const result = backtestCase(yearsFrom2006((y) => 2 ** Math.min(y - 2006, 9)), "2026-10-28");
  assert.ok(result);
  assert.equal(Math.round(result[9].error * 100) / 100, 1023);
  assert.equal(Math.round(result[0].error * 100) / 100, 1); // 2016년: 예측 1,024, 실제 512 → 오차 1배
});

test("예측 검증: 20개 연도 중 하나라도 빠지면 검증하지 않는다", () => {
  const missing = yearsFrom2006((y) => 100 + y);
  delete missing["2010"];
  assert.equal(backtestCase(missing, "2026-10-28"), null);
});
