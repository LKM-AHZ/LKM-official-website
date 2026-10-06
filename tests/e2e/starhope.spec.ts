import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const BASE_PATH = process.env.BASE_PATH ?? "";
const user = {
  id: "starhope-ui-test",
  username: "StudyUser",
  account_level: "local",
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript((testUser) => {
    localStorage.setItem("starhope-local-owner", testUser.id);
    localStorage.setItem(
      "lkm-auth-store",
      JSON.stringify({
        user: testUser,
        isLoggedIn: true,
        _token: "ui-test-token",
        _refreshToken: "ui-test-refresh",
      }),
    );
  }, user);
  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({ json: user }),
  );
  await page.route("**/api/v1/notification/**", (route) =>
    route.fulfill({ json: { items: [], total: 0, unread_count: 0 } }),
  );
  await page.route("**/api/v1/starhope/**", (route) =>
    route.fulfill({
      json: {
        items: [],
        tombstones: [],
        server_time: new Date().toISOString(),
      },
    }),
  );
});

test("学习助手侧栏入口均可切换且移动端不溢出", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${BASE_PATH}/starhope/`);
  await expect(page.getByRole("heading", { name: /StudyUser/ })).toBeVisible();

  const menu = page.getByRole("button", { name: "学习助手菜单" });
  const sidebar = page.locator("#starhope-navigation");
  await expect(sidebar).toBeHidden();
  const routes = [
    "题库",
    "练习",
    "考试",
    "错题本",
    "AI 助手",
    "阅读器",
    "插件",
    "设置",
    "学习概览",
  ];
  for (const label of routes) {
    await menu.click();
    await expect(menu).toHaveAttribute("aria-expanded", "true");
    await sidebar.getByRole("button", { name: label, exact: true }).click();
    await expect(menu).toHaveAttribute("aria-expanded", "false");
    await expect(sidebar).toBeHidden();
    await expect(
      sidebar.locator("nav button").filter({ hasText: label }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
  }
  expect(errors).toEqual([]);
});

test("学习助手侧栏选中颜色跟随网站主题色", async ({ page }) => {
  await page.goto(`${BASE_PATH}/starhope/`);
  const active = page.locator(
    "#starhope-navigation button[aria-current='page']",
  );
  await expect(active).toBeVisible();
  await page.evaluate(() =>
    document.documentElement.style.setProperty("--hue", "20"),
  );
  const warm = await active.evaluate(
    (element) => getComputedStyle(element).color,
  );
  await page.evaluate(() =>
    document.documentElement.style.setProperty("--hue", "260"),
  );
  const cool = await active.evaluate(
    (element) => getComputedStyle(element).color,
  );
  expect(warm).not.toBe(cool);
});

test("学习助手首页没有严重无障碍问题", async ({ page }) => {
  await page.goto(`${BASE_PATH}/starhope/`);
  await expect(page.getByRole("heading", { name: /StudyUser/ })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .include(".starhope-app")
    .analyze();
  expect(
    results.violations.filter(
      (item) => item.impact === "critical" || item.impact === "serious",
    ),
  ).toEqual([]);
});
