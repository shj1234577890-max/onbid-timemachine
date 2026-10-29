// Design Ref: §8 확인 계획 — 화면 흐름, 예외 화면, 3초 이내, 휴대폰 화면, AI 해설 표시/숨김.
// AI 해설 서버(/api/explain)는 비용과 불안정을 피하려고 가짜 응답으로 바꿔 시험한다.
import { expect, test, type Page } from "@playwright/test";

/** 가짜 AI 해설. 실제 AI를 부르지 않는다. */
async function mockExplain(page: Page, response: { status: number; body: unknown; delayMs?: number }) {
  await page.route("**/api/explain", async (route) => {
    if (response.delayMs) await new Promise((r) => setTimeout(r, response.delayMs));
    await route.fulfill({ status: response.status, contentType: "application/json", body: JSON.stringify(response.body) });
  });
}

const FAKE_TEXT = "시험용 해설입니다. 이 글은 가짜 응답이에요.";
const SUSEONG = "/?sido=%EB%8C%80%EA%B5%AC&sigungu=%EC%88%98%EC%84%B1%EA%B5%AC";

test.describe("이용 흐름", () => {
  test("첫 화면 → 지역 → 목록 → 결과 → 목록으로 돌아오기", async ({ page }) => {
    await mockExplain(page, { status: 200, body: { text: FAKE_TEXT } });
    await page.goto("/");

    // 첫 화면: 앱 이름, 큰 제목, 예시 데이터 띠, 출처
    await expect(page.getByText("온비드 타임머신").first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("지난 10년, 공매가 증명한 기회를");
    await expect(page.getByText("예시 데이터").first()).toBeVisible();
    await expect(page.getByText(/데이터 출처: 온비드, 국토교통부/)).toBeVisible();

    // 지역 고르기 → 목록
    await page.getByRole("link", { name: "대구", exact: true }).click();
    await page.getByRole("link", { name: "수성구", exact: true }).click();
    await expect(page).toHaveURL(/sido=.*sigungu=/);
    await expect(page.getByText(/수성구 사례 \d+건/)).toBeVisible();
    const cards = page.locator('a[href^="/cases/"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(1);

    // 결과 화면
    await cards.first().click();
    await expect(page).toHaveURL(/\/cases\//);
    for (const label of ["감정가", "낙찰가", "현재 시세", "시세 차익", "수익률"]) {
      await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
    }
    await expect(page.getByText(/부대비용은 반영하지 않았습니다/)).toBeVisible();

    // 예측: 선 4개, 물가 가정, 10년 뒤 수익률, 안내 문구 2종
    await expect(page.locator(".recharts-line")).toHaveCount(4);
    await expect(page.getByText("물가상승률은 연 2%로 가정했습니다")).toBeVisible();
    await expect(page.getByText(/2036년 예상 수익률: 기준 .* \(낙관 .* ~ 비관 .*\)/)).toBeVisible();
    await expect(page.getByText("참고용 예측이며 실제 수익을 보장하지 않습니다")).toBeVisible();
    await expect(page.getByText("예측은 최근 10년 데이터를 근거로 하며, 먼 미래일수록 오차가 커집니다")).toBeVisible();

    // AI 해설과 온비드 버튼
    await expect(page.getByText(FAKE_TEXT)).toBeVisible();
    const onbid = page.getByRole("link", { name: /온비드에서 지금 나온 물건 보기/ });
    await expect(onbid).toHaveAttribute("href", /^https:\/\/www\.onbid\.co\.kr\//);
    await expect(onbid).toHaveAttribute("target", "_blank");
    await expect(onbid).toHaveAttribute("rel", /noopener/);

    // 목록으로: 고른 지역이 그대로
    await page.getByRole("link", { name: /수성구 목록으로/ }).click();
    await expect(page).toHaveURL(/sido=.*sigungu=/);
    await expect(page.getByText(/수성구 사례 \d+건/)).toBeVisible();
    expect(await page.locator('a[href^="/cases/"]').count()).toBeGreaterThanOrEqual(1);
  });

  test("사례를 누른 뒤 결과 숫자가 3초 안에 나온다 (AI 해설 제외)", async ({ page }) => {
    await mockExplain(page, { status: 200, body: { text: FAKE_TEXT } });
    await page.goto(SUSEONG);
    const first = page.locator('a[href^="/cases/"]').first();
    await expect(first).toBeVisible();
    const start = Date.now();
    await first.click();
    await expect(page.getByText("시세 차익", { exact: true })).toBeVisible({ timeout: 3000 });
    expect(Date.now() - start).toBeLessThan(3000);
  });
});

test.describe("예외 화면", () => {
  test("사례가 없는 지역은 안내 문구를 보여 준다", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "경북", exact: true }).click();
    await page.getByRole("link", { name: "영천시", exact: true }).click();
    await expect(page.getByText("이 지역에는 해당 기간 사례가 없어요")).toBeVisible();
  });

  test(`없는 사례 번호와 목록에서 빠진 사례는 "찾을 수 없어요" 화면과 noindex 표시를 보여 준다`, async ({ page }) => {
    // Next.js는 화면을 먼저 흘려보낸 뒤 notFound()가 실행되면 응답 코드를 200으로 두고, 대신 noindex 표시를 붙인다. (docs: not-found.md)
    // nope-999: 없는 번호 / dg-suseong-004: 낙찰 기간 밖 / dg-seo-001: 최근 거래 없음 / dg-dong-002: 면적 불일치
    for (const id of ["nope-999", "dg-suseong-004", "dg-seo-001", "dg-dong-002"]) {
      await page.goto(`/cases/${id}`);
      await expect(page.locator("meta[name=robots]"), id).toHaveAttribute("content", /noindex/);
      await expect(page.getByText("사례를 찾을 수 없어요")).toBeVisible();
      await page.getByRole("link", { name: "첫 화면으로 돌아가기" }).click();
      await expect(page).toHaveURL(/\/$/);
    }
  });

  test("손실 사례는 '손실'과 빨간색으로 보여 준다", async ({ page }) => {
    await mockExplain(page, { status: 200, body: { text: FAKE_TEXT } });
    await page.goto("/?sido=%EA%B2%BD%EB%B6%81&sigungu=%EC%98%81%EC%A3%BC%EC%8B%9C");
    const card = page.locator('a[href^="/cases/"]').first();
    await expect(card).toContainText("손실");
    await expect(card.locator("span.font-bold")).toHaveClass(/text-red-600/);
    await card.click();
    await expect(page.getByText(/손실 −/).first()).toBeVisible();
  });

  test("연도별 시세가 빠진 사례는 그래프 대신 안내를 보여 주고 안내 문구 2종은 그대로 보인다", async ({ page }) => {
    await mockExplain(page, { status: 200, body: { text: FAKE_TEXT } });
    await page.goto("/cases/gb-gyeongsan-001");
    await expect(page.getByText("예측에 필요한 데이터가 부족합니다")).toBeVisible();
    await expect(page.locator(".recharts-line")).toHaveCount(0);
    await expect(page.getByText("참고용 예측이며 실제 수익을 보장하지 않습니다")).toBeVisible();
    await expect(page.getByText("예측은 최근 10년 데이터를 근거로 하며, 먼 미래일수록 오차가 커집니다")).toBeVisible();
  });
});

test.describe("AI 해설 칸", () => {
  test("불러오는 동안 '해설을 쓰는 중…'이 보이고, 끝나면 해설이 나온다", async ({ page }) => {
    await mockExplain(page, { status: 200, body: { text: FAKE_TEXT }, delayMs: 800 });
    await page.goto("/cases/dg-suseong-001");
    await expect(page.getByText("해설을 쓰는 중…")).toBeVisible();
    await expect(page.getByText(FAKE_TEXT)).toBeVisible();
    await expect(page.getByText("해설을 쓰는 중…")).toHaveCount(0);
  });

  for (const status of [502, 429, 404]) {
    test(`서버가 ${status}를 돌려주면 해설 칸만 사라지고 나머지는 그대로다`, async ({ page }) => {
      await mockExplain(page, { status, body: { error: "실패" } });
      await page.goto("/cases/dg-suseong-001");
      await expect(page.getByText("그때 샀다면 지금 얼마?")).toBeVisible();
      await expect(page.getByRole("heading", { name: "AI 해설" })).toHaveCount(0);
      await expect(page.getByText("해설을 쓰는 중…")).toHaveCount(0);
      await expect(page.getByText("앞으로 10년 예상 시세")).toBeVisible();
      await expect(page.getByRole("link", { name: /온비드에서 지금 나온 물건 보기/ })).toBeVisible();
    });
  }
});

test.describe("휴대폰 화면 (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const path of ["/", SUSEONG, "/cases/dg-suseong-001", "/cases/gb-gyeongsan-001", "/cases/nope-999"]) {
    test(`${path} 에서 옆으로 넘치지 않는다`, async ({ page }) => {
      await mockExplain(page, { status: 200, body: { text: FAKE_TEXT } });
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});
