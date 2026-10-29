// Design Ref: §2.3 결과 화면 — "그때 샀다면 지금 얼마?" 숫자 묶음. 서버에서 그려 보낸다.
// 계산은 lib/에서 끝난 값(ListedCase)을 받아 글자로 바꿔 보여 주기만 한다.
import type { ListedCase } from "@/lib/cases";
import { formatBidRatio, formatProfitRate, formatWon, formatWonChange } from "@/lib/format";

type Props = {
  listed: ListedCase;
};

/** 한 줄: 왼쪽 이름표, 오른쪽 값 */
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="shrink-0 text-sm text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd className="text-right font-semibold text-zinc-900 dark:text-zinc-50">{children}</dd>
    </div>
  );
}

export default function ResultSummary({ listed }: Props) {
  const { item, currentPrice, profitAmount, profitRate, bidRatio } = listed;
  const profitText = formatWonChange(profitAmount);
  const rateText = formatProfitRate(profitRate);
  // 표시 글자와 색이 어긋나지 않도록, 반올림한 표시 글자를 보고 손실인지 정한다.
  const isLoss = rateText.startsWith("손실");
  const tone = isLoss ? "text-red-600 dark:text-red-400" : "text-blue-700 dark:text-blue-300";

  return (
    <section
      aria-labelledby="result-heading"
      className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 id="result-heading" className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
        그때 샀다면 지금 얼마?
      </h2>

      <dl className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800">
        <Row label="감정가">{formatWon(item.appraisalPrice)}</Row>
        <Row label="낙찰가">
          {formatWon(item.winningBid)}{" "}
          <span className="font-normal text-zinc-500 dark:text-zinc-400">
            ({item.auctionDate.slice(0, 7).replace("-", ".")})
          </span>
          <span className="block text-sm font-normal text-zinc-600 dark:text-zinc-400">
            감정가의 {formatBidRatio(bidRatio)}에 낙찰
          </span>
        </Row>
        <Row label="현재 시세">{formatWon(currentPrice)}</Row>
        <Row label="시세 차익">
          {/* 가장 눈에 띄게 크게 보여 준다. */}
          <span className={`text-2xl sm:text-3xl ${tone}`}>{profitText}</span>
        </Row>
        <Row label="수익률">
          <span className={tone}>{rateText}</span>
        </Row>
      </dl>

      {/* PRD §5: 결과 아래에 반드시 1줄 표시 */}
      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        ※ 세금·중개수수료 등 부대비용은 반영하지 않았습니다
      </p>
    </section>
  );
}
