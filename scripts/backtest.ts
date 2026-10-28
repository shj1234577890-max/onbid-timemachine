// Design Ref: §8 예측 검증 — `npm run backtest`로 사례별 오차를 출력한다.
// Plan SC: 검증 코드가 돌아가 사례별 오차를 보여 준다. (±15% 판정은 실제 데이터로 바꾼 뒤)
import { casesData } from "../lib/cases.ts";
import { BACKTEST_TOLERANCE, backtestCase, getBacktestYears } from "../lib/forecast.ts";

const { asOfDate, isSample, cases } = casesData;
const { basisFrom, basisTo, targetTo } = getBacktestYears(asOfDate);
const percent = (x: number) => `${(x * 100).toFixed(1)}%`;

console.log(`예측 검증: ${basisFrom}~${basisTo}년 시세로 ${basisTo + 1}~${targetTo}년을 예측해 실제와 비교`);
console.log(`(사례 전체 ${cases.length}건 중 ${basisFrom}~${targetTo}년 시세가 모두 있는 사례만)\n`);

const lastYearErrors: number[] = [];
for (const item of cases) {
  const result = backtestCase(item.yearlyPrices, asOfDate);
  if (result === null) {
    console.log(`- ${item.id}: 검증 제외 (${basisFrom}~${targetTo}년 시세 중 빠진 해가 있음)`);
    continue;
  }
  const errors = result.map((r) => r.error);
  const last = errors[errors.length - 1];
  lastYearErrors.push(last);
  console.log(
    `- ${item.id}: 마지막 해(${targetTo}) 오차 ${percent(last)}, 가장 큰 오차 ${percent(Math.max(...errors))}`,
  );
}

if (lastYearErrors.length === 0) {
  console.log("\n검증할 수 있는 사례가 없습니다.");
} else {
  const average = lastYearErrors.reduce((sum, e) => sum + e, 0) / lastYearErrors.length;
  console.log(`\n검증한 사례 ${lastYearErrors.length}건, 마지막 해 오차 평균 ${percent(average)}`);
  if (isSample) {
    console.log("예시 데이터라 통과 여부는 판정하지 않습니다. (실제 데이터로 바꾼 뒤 판정)");
  } else {
    const passed = average <= BACKTEST_TOLERANCE;
    console.log(`판정: ${passed ? "통과" : "미달"} (기준 ±${percent(BACKTEST_TOLERANCE)} 이내)`);
  }
}
