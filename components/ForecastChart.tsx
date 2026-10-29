"use client";

// Design Ref: §2.3 예측 그래프 — 낙관·기준·비관 3줄과 물가 기준선(점선)을 Recharts로 그린다. (DESIGN §9: 브라우저에서 그린다)
// 계산은 서버(lib/forecast.ts)에서 끝난 값을 받아 그리기만 한다.
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatWon } from "@/lib/format";

/** 그래프의 한 해. 출발 해(기준일 연도)는 네 줄이 모두 현재 시세에서 시작한다. */
export type ChartPoint = {
  year: number;
  base: number;
  optimistic: number;
  pessimistic: number;
  inflation: number;
};

type Props = {
  points: ChartPoint[];
  /** 그래프를 설명하는 한 줄. 화면 낭독기가 읽는다. */
  description: string;
};

const LINES = [
  { key: "optimistic", name: "낙관", color: "#16a34a", dashed: false },
  { key: "base", name: "기준", color: "#2563eb", dashed: false },
  { key: "pessimistic", name: "비관", color: "#dc2626", dashed: false },
  { key: "inflation", name: "물가 기준선", color: "#71717a", dashed: true },
] as const;

/** 세로축 눈금: 1억 = "1.0억" */
const formatAxis = (won: number) => `${(won / 100_000_000).toFixed(1)}억`;

export default function ForecastChart({ points, description }: Props) {
  return (
    <div role="img" aria-label={description} className="h-72 w-full text-zinc-500 sm:h-80 dark:text-zinc-400">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.25} />
          <XAxis dataKey="year" tick={{ fill: "currentColor", fontSize: 12 }} tickFormatter={(y) => `${y}`} minTickGap={16} />
          <YAxis tick={{ fill: "currentColor", fontSize: 12 }} tickFormatter={formatAxis} width={52} />
          <Tooltip
            formatter={(value, name) => [formatWon(Number(value)), String(name)]}
            labelFormatter={(year) => `${year}년`}
          />
          {/* itemSorter={null}: 이름순이 아니라 LINES에 적은 순서(낙관 → 기준 → 비관 → 물가 기준선)대로 보여 준다. */}
          <Legend itemSorter={null} />
          {LINES.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={line.dashed ? 1.5 : 2.5}
              strokeDasharray={line.dashed ? "5 4" : undefined}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
