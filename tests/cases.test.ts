// Design Ref: §5.1 목록에 보일 사례 — 예시 데이터로 목록 거르기·정렬·찾기가 규칙대로인지 확인한다.
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  casesData,
  filterByRegion,
  findListedCase,
  getAuctionPeriod,
  getHoldingYears,
  getListedCases,
  toCaseSummary,
} from "../lib/cases.ts";

const { asOfDate, cases } = casesData;
const listed = getListedCases(cases, asOfDate);

test("낙찰 기간은 기준일 연도에서 거꾸로 계산한다", () => {
  assert.deepEqual(getAuctionPeriod("2026-10-28"), { fromYear: 2015, toYear: 2017 });
  assert.deepEqual(getAuctionPeriod("2030-01-01"), { fromYear: 2019, toYear: 2021 });
});

test("예시 데이터 28건 중 확인용 4건(기간 밖 2, 시세 없음 2)이 빠져 24건이 남는다", () => {
  assert.equal(listed.length, 24);
  for (const id of ["dg-suseong-004", "dg-dalseo-003", "dg-seo-001", "dg-dong-002"]) {
    assert.equal(listed.some(({ item }) => item.id === id), false, id);
  }
});

test("수익률 높은 순으로 줄 선다", () => {
  for (let i = 1; i < listed.length; i++) {
    assert.ok(listed[i - 1].profitRate >= listed[i].profitRate);
  }
});

test("지역으로 거르기: 수성구 3건, 사례 없는 지역은 0건", () => {
  assert.equal(filterByRegion(listed, "대구", "수성구").length, 3);
  assert.equal(filterByRegion(listed, "대구", "서구").length, 0);
  assert.equal(filterByRegion(listed, "경북", "영천시").length, 0);
});

test("사례 찾기: 목록 제외 사례와 없는 번호는 null", () => {
  assert.equal(findListedCase(cases, asOfDate, "dg-suseong-001")?.item.id, "dg-suseong-001");
  assert.equal(findListedCase(cases, asOfDate, "dg-seo-001"), null);
  assert.equal(findListedCase(cases, asOfDate, "no-such-id"), null);
});

test("목록 카드 글자: 면적·낙찰 연월·금액·수익률, 손실이면 빨간색 표시", () => {
  const item = {
    id: "card",
    sido: "대구" as const,
    sigungu: "수성구",
    dong: "범어동",
    complexName: "범어 예시아파트",
    areaM2: 84.9,
    auctionDate: "2016-05-12",
    appraisalPrice: 310_000_000,
    winningBid: 280_000_000,
    yearlyPrices: {},
    recentDeals: [],
  };
  const gain = toCaseSummary({ item, currentPrice: 454_400_000, profitAmount: 174_400_000, profitRate: 62.2857, bidRatio: 90.3, holdingYears: 10 });
  assert.equal(gain.areaText, "84㎡");
  assert.equal(gain.auctionMonthText, "2016.05");
  assert.equal(gain.winningBidText, "2억 8,000만 원");
  assert.equal(gain.profitRateText, "+62.3%");
  assert.equal(gain.isLoss, false);

  const loss = toCaseSummary({ item, currentPrice: 1, profitAmount: -1, profitRate: -12.25, bidRatio: 90.3, holdingYears: 10 });
  assert.equal(loss.profitRateText, "손실 −12.3%");
  assert.equal(loss.isLoss, true);

  // 반올림하면 0.0%가 되는 아주 작은 손실은 손실(빨간색)로 보지 않는다.
  assert.equal(toCaseSummary({ item, currentPrice: 1, profitAmount: -1, profitRate: -0.04, bidRatio: 90.3, holdingYears: 10 }).isLoss, false);
});

test("보유 기간은 반올림한 햇수", () => {
  assert.equal(getHoldingYears("2016-05-12", "2026-10-28"), 10); // 10.46년
  assert.equal(getHoldingYears("2015-03-16", "2026-10-28"), 12); // 11.62년
  assert.equal(getHoldingYears("2017-10-12", "2026-10-28"), 9); // 9.04년
});
