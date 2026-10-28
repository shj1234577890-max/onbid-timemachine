// Design Ref: §5.3 예측 — 상승률과 예측 시세를 손 계산 정답과 비교한다.
import assert from "node:assert/strict";
import { test } from "node:test";
import { getBestYear, getCaseForecast, getForecastRates, projectPrices } from "../lib/forecast.ts";
import type { ForecastPoint } from "../lib/forecast.ts";
import type { YearlyPrices } from "../lib/types.ts";

/** 2016~2025년 시세. 첫해 100 → 마지막 해 200, 가장 크게 오른 해는 120 → 150 (25%) */
const SAMPLE: YearlyPrices = Object.fromEntries(
  [100, 110, 105, 120, 150, 140, 160, 170, 190, 200].map((price, i) => [String(2016 + i), price]),
);

/** 소수점 넷째 자리까지만 비교한다. */
const round4 = (x: number) => Math.round(x * 10_000) / 10_000;

test("상승률: 기준 = 2^(1/9) − 1, 낙관 = 가장 크게 오른 해, 비관 = 2%", () => {
  const rates = getForecastRates(SAMPLE, 2016, 2025);
  assert.ok(rates);
  assert.equal(round4(rates.base), 0.0801);
  assert.equal(round4(rates.optimistic), 0.25);
  assert.equal(rates.pessimistic, 0.02);
});

test("근거 연도 시세가 하나라도 빠지거나 연도가 1개뿐이면 예측하지 않는다", () => {
  const missing = { ...SAMPLE };
  delete missing["2019"];
  assert.equal(getForecastRates(missing, 2016, 2025), null);
  assert.equal(getForecastRates(SAMPLE, 2016, 2016), null);
});

test("예측 시세: 1억에서 출발해 해마다 상승률을 곱한다", () => {
  const points = projectPrices({ base: 0.05, optimistic: 0.25, pessimistic: 0.02 }, 100_000_000, 2026, 10);
  assert.equal(points.length, 10);
  assert.equal(points[0].year, 2027);
  assert.equal(points[9].year, 2036);
  assert.equal(points[0].base, 105_000_000); // 1억 × 1.05
  assert.equal(points[0].optimistic, 125_000_000); // 1억 × 1.25
  assert.equal(points[1].pessimistic, 104_040_000); // 1억 × 1.02 × 1.02
  assert.equal(points[1].base, 110_250_000); // 1억 × 1.05 × 1.05
});

test("결과 화면용 예측은 기준일 직전 10개 연도로 기준일 다음 해부터 10년을 예측한다", () => {
  const forecast = getCaseForecast(SAMPLE, 100_000_000, "2026-10-28");
  assert.ok(forecast);
  assert.equal(round4(forecast.rates.base), 0.0801);
  assert.equal(forecast.points[0].year, 2027);
  assert.equal(getCaseForecast(SAMPLE, 100_000_000, "2027-10-28"), null); // 2026년 시세가 없다
});

const point = (year: number, base: number): ForecastPoint => ({ year, base, optimistic: 0, pessimistic: 0 });

test("가장 높은 시점: 꼭대기 해, 동점이면 이른 해, 손실이면 덜 손해인 해", () => {
  assert.equal(getBestYear([point(2027, 100), point(2028, 130), point(2029, 120)], 90), 2028);
  assert.equal(getBestYear([point(2027, 100), point(2028, 100)], 90), 2027);
  assert.equal(getBestYear([point(2027, 70), point(2028, 80)], 100), 2028);
  assert.equal(getBestYear([], 100), null);
});
