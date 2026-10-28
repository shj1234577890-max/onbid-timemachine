// Design Ref: §2.1 공통 틀 — 모든 화면 맨 위에 "예시 데이터" 띠, 맨 아래에 데이터 출처와 기준일을 보여 준다.
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { casesData } from "@/lib/cases";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "온비드 타임머신",
  description: "10년 전 온비드 공매로 샀다면 지금 얼마가 되었을지 데이터로 확인해 보세요.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const { isSample, asOfDate } = casesData;

  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* 실제 데이터로 바꾸면 cases.json의 isSample을 false로 바꿔 이 띠를 없앤다. */}
        {isSample && (
          <div
            role="note"
            className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100"
          >
            <span className="mr-2 rounded bg-amber-900 px-1.5 py-0.5 text-xs font-bold text-amber-50 dark:bg-amber-200 dark:text-amber-950">
              예시 데이터
            </span>
            실제 사례가 아닙니다
          </div>
        )}

        <div className="flex flex-1 flex-col">{children}</div>

        <footer className="border-t border-zinc-200 px-4 py-6 text-xs leading-6 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <div className="mx-auto max-w-3xl">
            <p>
              데이터 출처: 온비드, 국토교통부 실거래가 공개시스템
              {isSample && " (예시 데이터)"}
            </p>
            <p>데이터 기준일: {asOfDate}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
