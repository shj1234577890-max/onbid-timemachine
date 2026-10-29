// Design Ref: §2.3 결과 화면 — 예측 화면에 항상 보여 줄 안내 문구. (PRD §5 must ②)
// 문구를 한곳에 모아 두면 화면이 바뀌어도 빠지지 않고, 금지어 검사도 한 번에 할 수 있다.

/** 안내 문구 1: 예측은 참고용이다 */
export const FORECAST_NOTICE_REFERENCE = "참고용 예측이며 실제 수익을 보장하지 않습니다";

/** 안내 문구 2: 예측의 근거와 한계 */
export const FORECAST_NOTICE_LIMIT = "예측은 최근 10년 데이터를 근거로 하며, 먼 미래일수록 오차가 커집니다";

/** 물가 가정. 그래프의 "물가 기준선"이 이 값이다. */
export const INFLATION_ASSUMPTION_TEXT = "물가상승률은 연 2%로 가정했습니다";

/** 근거 연도 시세가 하나라도 빠져 예측할 수 없을 때 */
export const FORECAST_UNAVAILABLE = "예측에 필요한 데이터가 부족합니다";

/** 화면에 쓰는 모든 예측 문구 (금지어 검사용) */
export const ALL_FORECAST_TEXTS: readonly string[] = [
  FORECAST_NOTICE_REFERENCE,
  FORECAST_NOTICE_LIMIT,
  INFLATION_ASSUMPTION_TEXT,
  FORECAST_UNAVAILABLE,
];
