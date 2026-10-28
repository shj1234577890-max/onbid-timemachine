// Design Ref: §5.2 표시 규칙 — 원 단위 숫자를 "2억 8,000만 원"처럼 사람이 읽는 글자로 바꾼다.
// 계산은 원 단위 그대로 하고, 화면이나 AI에게 보여 줄 때만 이 함수들을 쓴다.

/** 빼기 기호. 키보드의 "-"가 아니라 "−"(U+2212)를 쓴다. */
const MINUS = "−";

/** 0.5는 0에서 먼 쪽으로 반올림한다. (2.5 → 3, −2.5 → −3) 결과가 −0이면 0으로 돌려준다. */
export function roundHalfAwayFromZero(value: number): number {
  const rounded = Math.sign(value) * Math.round(Math.abs(value));
  return rounded === 0 ? 0 : rounded;
}

/** 1234 → "1,234". 컴퓨터 언어 설정과 상관없이 항상 같은 모양이 나오도록 직접 쉼표를 찍는다. */
function withComma(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 만 원 단위 개수(양수)를 "12억 3,457만 원" / "3억 원" / "8,500만 원"으로 바꾼다. */
function manToText(man: number): string {
  const eok = Math.floor(man / 10000);
  const rest = man % 10000;
  if (eok === 0) return `${withComma(rest)}만 원`;
  if (rest === 0) return `${withComma(eok)}억 원`;
  return `${withComma(eok)}억 ${withComma(rest)}만 원`;
}

/**
 * 금액(원)을 글자로 바꾼다. 감정가·낙찰가·현재 시세처럼 부호가 필요 없는 금액에 쓴다.
 * 만 원 미만은 반올림하고, 반올림해서 0이 되면 "0원"이다. 음수가 들어오면 앞에 "−"를 붙인다.
 * 예: 280000000 → "2억 8,000만 원", 99995000 → "1억 원", 4999 → "0원"
 */
export function formatWon(won: number): string {
  const man = roundHalfAwayFromZero(won / 10000);
  if (man === 0) return "0원";
  return (man < 0 ? MINUS : "") + manToText(Math.abs(man));
}

/**
 * 늘어나거나 줄어든 금액(원)을 부호와 함께 글자로 바꾼다. 시세 차익에 쓴다.
 * 부호는 반올림한 뒤의 값으로 정한다. 이익은 "+", 손실은 "−", 0은 부호 없이 "0원"이다.
 * 예: 174400000 → "+1억 7,440만 원", −32000000 → "−3,200만 원", −4999 → "0원"
 */
export function formatWonChange(won: number): string {
  const man = roundHalfAwayFromZero(won / 10000);
  if (man === 0) return "0원";
  return (man > 0 ? "+" : MINUS) + manToText(Math.abs(man));
}
