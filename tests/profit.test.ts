// Design Ref: §8 확인 계획 — 검산 10건. 정답은 프로그램이 아니라 계산기로 손으로 계산해 적었다.
// Plan SC: 검산용 예시 10건의 시세 차익·수익률 계산이 100% 맞는다.
import assert from "node:assert/strict";
import { test } from "node:test";
import { formatBidRatio, formatProfitRate, formatWon, formatWonChange } from "../lib/format.ts";
import { getBidRatio, getCurrentPrice, getProfitAmount, getProfitRate } from "../lib/profit.ts";
import type { Case, Deal } from "../lib/types.ts";

const AS_OF = "2026-10-28";
const MINUS = "−";

/** 검산용 사례를 만든다. 계산에 쓰지 않는 항목은 아무 값이나 넣는다. */
function makeCase(winningBid: number, appraisalPrice: number, recentDeals: Deal[], areaM2 = 84.9): Case {
  return {
    id: "check",
    sido: "대구",
    sigungu: "중구",
    dong: "검산동",
    complexName: "검산 아파트",
    areaM2,
    auctionDate: "2016-05-12",
    appraisalPrice,
    winningBid,
    yearlyPrices: {},
    recentDeals,
  };
}

/** 같은 면적·기간 안의 거래 하나 */
const deal = (price: number, date = "2026-03-01", areaM2 = 84.9): Deal => ({ date, areaM2, price });

type Expected = {
  currentPrice: string;
  profitAmount: string;
  profitRate: string;
  bidRatio: string;
};

/** 사례 하나를 계산해 화면에 보일 글자 4개를 손 계산 정답과 비교한다. */
function check(item: Case, expected: Expected) {
  const currentPrice = getCurrentPrice(item, AS_OF);
  assert.notEqual(currentPrice, null);
  const price = currentPrice as number;
  assert.deepEqual(
    {
      currentPrice: formatWon(price),
      profitAmount: formatWonChange(getProfitAmount(price, item.winningBid)),
      profitRate: formatProfitRate(getProfitRate(price, item.winningBid)),
      bidRatio: formatBidRatio(getBidRatio(item.winningBid, item.appraisalPrice)),
    },
    expected,
  );
}

test("검산 1: DESIGN 화면 예시 (4억 5,440만 − 2억 8,000만)", () => {
  // 차익 174,400,000 / 수익률 174.4 ÷ 280 = 62.29% / 낙찰가율 280 ÷ 310 = 90.32%
  check(makeCase(280_000_000, 310_000_000, [deal(454_400_000)]), {
    currentPrice: "4억 5,440만 원",
    profitAmount: "+1억 7,440만 원",
    profitRate: "+62.3%",
    bidRatio: "90.3%",
  });
});

test("검산 2: 거래 3건 평균 (4억 5천, 4억 7천, 4억 6천 → 4억 6천)", () => {
  // 차익 160,000,000 / 수익률 160 ÷ 300 = 53.33% / 낙찰가율 300 ÷ 400 = 75%
  check(makeCase(300_000_000, 400_000_000, [deal(450_000_000), deal(470_000_000), deal(460_000_000)]), {
    currentPrice: "4억 6,000만 원",
    profitAmount: "+1억 6,000만 원",
    profitRate: "+53.3%",
    bidRatio: "75.0%",
  });
});

test("검산 3: 손실 사례 (1억 7천 − 2억)", () => {
  // 차익 −30,000,000 / 수익률 −30 ÷ 200 = −15% / 낙찰가율 200 ÷ 220 = 90.91%
  check(makeCase(200_000_000, 220_000_000, [deal(170_000_000)]), {
    currentPrice: "1억 7,000만 원",
    profitAmount: `${MINUS}3,000만 원`,
    profitRate: `손실 ${MINUS}15.0%`,
    bidRatio: "90.9%",
  });
});

test("검산 4: 1년보다 오래된 거래는 빠진다", () => {
  // 2025-10-27 거래(9억 9,900만)는 기준일 1년 전보다 하루 이르다 → 1억 5천만 하나만 남음
  // 차익 50,000,000 / 수익률 50% / 낙찰가율 100 ÷ 125 = 80%
  check(makeCase(100_000_000, 125_000_000, [deal(999_000_000, "2025-10-27"), deal(150_000_000)]), {
    currentPrice: "1억 5,000만 원",
    profitAmount: "+5,000만 원",
    profitRate: "+50.0%",
    bidRatio: "80.0%",
  });
});

test("검산 5: 면적 ±3㎡ 경계 (87.9·81.9는 포함, 109.9는 제외)", () => {
  // (1억 2천 + 1억 3천) ÷ 2 = 1억 2,500만 / 차익 25,000,000 / 수익률 25% / 낙찰가율 100 ÷ 110 = 90.91%
  const deals = [deal(900_000_000, "2026-03-01", 109.9), deal(120_000_000, "2026-03-01", 87.9), deal(130_000_000, "2026-03-01", 81.9)];
  check(makeCase(100_000_000, 110_000_000, deals), {
    currentPrice: "1억 2,500만 원",
    profitAmount: "+2,500만 원",
    profitRate: "+25.0%",
    bidRatio: "90.9%",
  });
});

test("검산 6: 평균이 0.5원으로 끝나면 올림", () => {
  // (100,000,001 + 100,000,002) ÷ 2 = 100,000,001.5 → 100,000,002
  const item = makeCase(80_000_000, 100_000_000, [deal(100_000_001), deal(100_000_002)]);
  assert.equal(getCurrentPrice(item, AS_OF), 100_000_002);
  // 차익 20,000,002 → 만 원 단위 2,000만 / 수익률 25.0000025% / 낙찰가율 80%
  check(item, {
    currentPrice: "1억 원",
    profitAmount: "+2,000만 원",
    profitRate: "+25.0%",
    bidRatio: "80.0%",
  });
});

test("검산 7: 시세가 낙찰가와 같으면 0", () => {
  // 차익 0 / 수익률 0% / 낙찰가율 250 ÷ 300 = 83.33%
  check(makeCase(250_000_000, 300_000_000, [deal(250_000_000)]), {
    currentPrice: "2억 5,000만 원",
    profitAmount: "0원",
    profitRate: "0.0%",
    bidRatio: "83.3%",
  });
});

test("검산 8: 아주 작은 손실은 반올림해 0으로, 부호 없이", () => {
  // 차익 −4,000원 → 만 원 단위 반올림 0 / 수익률 −0.004% → 0.0% / 낙찰가율 100 ÷ 120 = 83.33%
  check(makeCase(100_000_000, 120_000_000, [deal(99_996_000)]), {
    currentPrice: "1억 원",
    profitAmount: "0원",
    profitRate: "0.0%",
    bidRatio: "83.3%",
  });
});

test("검산 9: 수익률이 정확히 12.25%면 12.3%로 올림", () => {
  // 차익 4,900,000 / 수익률 4.9 ÷ 40 = 12.25% / 낙찰가율 40 ÷ 50 = 80%
  check(makeCase(40_000_000, 50_000_000, [deal(44_900_000)]), {
    currentPrice: "4,490만 원",
    profitAmount: "+490만 원",
    profitRate: "+12.3%",
    bidRatio: "80.0%",
  });
});

test("검산 10: 10억 원이 넘는 큰 금액", () => {
  // 차익 234,567,890 → 2억 3,456.789만 → 2억 3,457만 / 수익률 23.4568% / 낙찰가율 10 ÷ 12.5 = 80%
  check(makeCase(1_000_000_000, 1_250_000_000, [deal(1_234_567_890)]), {
    currentPrice: "12억 3,457만 원",
    profitAmount: "+2억 3,457만 원",
    profitRate: "+23.5%",
    bidRatio: "80.0%",
  });
});

test("현재 시세 경계: 기준일 당일 포함, 다음 날·면적 3.01㎡ 차이는 제외, 거래 없으면 null", () => {
  assert.equal(getCurrentPrice(makeCase(1, 1, [deal(100, "2026-10-28")]), AS_OF), 100);
  assert.equal(getCurrentPrice(makeCase(1, 1, [deal(100, "2025-10-28")]), AS_OF), 100);
  assert.equal(getCurrentPrice(makeCase(1, 1, [deal(100, "2026-10-29")]), AS_OF), null);
  assert.equal(getCurrentPrice(makeCase(1, 1, [deal(100, "2026-03-01", 87.91)]), AS_OF), null);
  assert.equal(getCurrentPrice(makeCase(1, 1, []), AS_OF), null);
});
