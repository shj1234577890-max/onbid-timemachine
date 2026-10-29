// Design Ref: §4 데이터 형식 — 사례 파일이 약속한 모양인지 읽을 때 검사한다.
// 실제 데이터로 바꿀 때 빈 값·잘못된 값이 조용히 계산 오류로 번지지 않게, 문제가 있으면 바로 멈추고 어디가 틀렸는지 알려 준다.
import { SIGUNGU_BY_SIDO } from "../data/regions.ts";
import type { CasesFile } from "./types.ts";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isWon = (v: unknown) => typeof v === "number" && Number.isSafeInteger(v) && v > 0;
const isArea = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v > 0;
const isDate = (v: unknown) => typeof v === "string" && DATE.test(v) && !Number.isNaN(Date.parse(v));

/** 문제 목록을 돌려준다. 비어 있으면 통과다. */
export function validateCasesFile(data: unknown): string[] {
  const problems: string[] = [];
  if (!isObject(data)) return ["파일 전체가 객체가 아닙니다"];
  if (!isDate(data.asOfDate)) problems.push("asOfDate가 'YYYY-MM-DD' 날짜가 아닙니다");
  if (typeof data.isSample !== "boolean") problems.push("isSample이 true/false가 아닙니다");
  if (!Array.isArray(data.cases)) return [...problems, "cases가 목록이 아닙니다"];

  const ids = new Set<string>();
  data.cases.forEach((c: unknown, i: number) => {
    const at = (field: string, why: string) => problems.push(`cases[${i}].${field}: ${why}`);
    if (!isObject(c)) return at("(전체)", "객체가 아닙니다");
    if (typeof c.id !== "string" || c.id === "") at("id", "비어 있습니다");
    else if (ids.has(c.id)) at("id", `중복된 번호입니다 (${c.id})`);
    else ids.add(c.id);

    const sigungu = typeof c.sido === "string" ? (SIGUNGU_BY_SIDO as Record<string, readonly string[]>)[c.sido] : undefined;
    if (sigungu === undefined) at("sido", "'대구' 또는 '경북'이어야 합니다");
    else if (typeof c.sigungu !== "string" || !sigungu.includes(c.sigungu)) at("sigungu", "지역 목록에 없는 시·군·구입니다");
    for (const f of ["dong", "complexName"] as const) if (typeof c[f] !== "string" || c[f] === "") at(f, "비어 있습니다");
    if (!isArea(c.areaM2)) at("areaM2", "0보다 큰 숫자여야 합니다");
    if (!isDate(c.auctionDate)) at("auctionDate", "'YYYY-MM-DD' 날짜가 아닙니다");
    if (!isWon(c.appraisalPrice)) at("appraisalPrice", "0보다 큰 원 단위 정수여야 합니다");
    if (!isWon(c.winningBid)) at("winningBid", "0보다 큰 원 단위 정수여야 합니다");

    if (!isObject(c.yearlyPrices)) at("yearlyPrices", "객체가 아닙니다");
    else {
      for (const [year, price] of Object.entries(c.yearlyPrices)) {
        if (!/^\d{4}$/.test(year)) at("yearlyPrices", `연도 키가 잘못됐습니다 (${year})`);
        else if (!isWon(price)) at("yearlyPrices", `${year}년 값이 0보다 큰 정수가 아닙니다`);
      }
    }
    if (!Array.isArray(c.recentDeals)) at("recentDeals", "목록이 아닙니다");
    else {
      c.recentDeals.forEach((d: unknown, j: number) => {
        if (!isObject(d) || !isDate(d.date) || !isArea(d.areaM2) || !isWon(d.price)) at(`recentDeals[${j}]`, "date·areaM2·price가 올바르지 않습니다");
      });
    }
  });
  return problems;
}

/** 통과하면 그대로 돌려주고, 문제가 있으면 앞의 5개를 담아 오류를 낸다. */
export function parseCasesFile(data: unknown): CasesFile {
  const problems = validateCasesFile(data);
  if (problems.length > 0) {
    throw new Error(`data/cases.json 형식 오류 ${problems.length}건: ${problems.slice(0, 5).join(" / ")}`);
  }
  return data as CasesFile;
}
