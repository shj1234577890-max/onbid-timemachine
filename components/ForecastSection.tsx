// Design Ref: §2.3 앞으로 10년 예상 시세 — 예측 그래프, 물가 가정, 10년 뒤 예상 수익률 범위, 안내 문구 2종.
// 서버에서 계산해 그래프(브라우저 부품)에 값을 넘긴다. 안내 문구 2종은 예측이 없을 때도 항상 보여 준다.
import ForecastChart from "@/components/ForecastChart";
import type { ChartPoint } from "@/components/ForecastChart";
import type { ListedCase } from "@/lib/cases";
import { getCaseForecast, getTenYearOutlook } from "@/lib/forecast";
import { formatOutlookRate } from "@/lib/format";
import {
  FORECAST_NOTICE_LIMIT,
  FORECAST_NOTICE_REFERENCE,
  FORECAST_UNAVAILABLE,
  INFLATION_ASSUMPTION_TEXT,
} from "@/lib/notices";
import type { DateString } from "@/lib/types";

type Props = {
  listed: ListedCase;
  asOfDate: DateString;
};

export default function ForecastSection({ listed, asOfDate }: Props) {
  const { item, currentPrice } = listed;
  const forecast = getCaseForecast(item.yearlyPrices, currentPrice, asOfDate);
  const outlook = forecast === null ? null : getTenYearOutlook(forecast.points, item.winningBid);

  // 출발 해(기준일 연도)는 네 줄이 모두 현재 시세에서 시작한다.
  const chartPoints: ChartPoint[] | null =
    forecast === null
      ? null
      : [
          {
            year: Number(asOfDate.slice(0, 4)),
            base: currentPrice,
            optimistic: currentPrice,
            pessimistic: currentPrice,
            inflation: currentPrice,
          },
          ...forecast.points,
        ];

  return (
    <section
      aria-labelledby="forecast-heading"
      className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 id="forecast-heading" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
        앞으로 10년 예상 시세
      </h2>

      {chartPoints !== null && outlook !== null ? (
        <div className="mt-4 flex flex-col gap-4">
          <ForecastChart
            points={chartPoints}
            description={`${chartPoints[0].year}년 현재 시세에서 출발한 앞으로 10년 예상 시세 그래프. 낙관, 기준, 비관 세 가지와 물가 기준선을 보여 줍니다.`}
          />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{INFLATION_ASSUMPTION_TEXT}</p>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
            {outlook.year}년 예상 수익률: 기준 {formatOutlookRate(outlook.base)}{" "}
            <span className="font-normal text-zinc-600 dark:text-zinc-400">
              (낙관 {formatOutlookRate(outlook.optimistic)} ~ 비관 {formatOutlookRate(outlook.pessimistic)})
            </span>
          </p>
        </div>
      ) : (
        <p role="status" className="mt-4 text-zinc-700 dark:text-zinc-300">
          {FORECAST_UNAVAILABLE}
        </p>
      )}

      {/* 예측이 있든 없든 항상 보여 주는 안내 문구 2종 */}
      <ul className="mt-4 flex flex-col gap-1 text-sm text-amber-800 dark:text-amber-300">
        <li>⚠ {FORECAST_NOTICE_REFERENCE}</li>
        <li>⚠ {FORECAST_NOTICE_LIMIT}</li>
      </ul>
    </section>
  );
}
