import { test, expect } from "@playwright/test";

const BASE_PATH = process.env.BASE_PATH ?? "";

const PUBLIC_ROUTES = [
  { path: `${BASE_PATH}/`, label: "首页" },
  { path: `${BASE_PATH}/privacy/`, label: "隐私政策" },
  { path: `${BASE_PATH}/terms/`, label: "服务条款" },
];

// 说明：原 /official/contact、/official/communities 页面已删除，相关用例一并移除
const DEMO_ROUTES = [
  { path: `${BASE_PATH}/login/`, label: "登录" },
  { path: `${BASE_PATH}/register/`, label: "注册" },
];

test.describe("关键路由烟雾测试", () => {
  for (const { path, label } of PUBLIC_ROUTES) {
    test(`${label} (${path}) 返回 200 且有主内容`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);

      await expect(page.locator("main")).not.toBeEmpty();
    });
  }

  for (const { path, label } of DEMO_ROUTES) {
    test(`${label} (${path}) 返回 200`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
    });
  }

  test("不存在的路径返回 404", async ({ page }) => {
    const res = await page.goto(`${BASE_PATH}/this-route-must-not-exist`);
    expect(res?.status()).toBe(404);
  });

  test("未登录访问机器人后台会在输出页面前跳到登录页", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    const res = await page.goto(`${BASE_PATH}/admin/bot/`);
    expect(res?.status()).toBe(200);
    await expect(page).toHaveURL(/\/admin\/login\/?$/);
    expect(errors).toEqual([]);
  });

  test("编辑器与审核页面水合时不抛出异常", async ({ page }) => {
    for (const route of ["editor", "admin/moderation", "admin/dlq"]) {
      const errors: string[] = [];
      const onError = (error: Error) => errors.push(error.message);
      const onConsole = (message: {
        type: () => string;
        text: () => string;
      }) => {
        if (/Hydration|node mismatch/i.test(message.text()))
          errors.push(message.text());
      };
      page.on("pageerror", onError);
      page.on("console", onConsole);
      const res = await page.goto(`${BASE_PATH}/${route}/`);
      expect(res?.status()).toBe(200);
      await page.waitForTimeout(500);
      expect(errors, route).toEqual([]);
      page.off("pageerror", onError);
      page.off("console", onConsole);
    }
  });

  test("首页无未捕获错误", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${BASE_PATH}/`);
    expect(errors).toEqual([]);
  });

  test("首页展示社区入口并可进入论坛", async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);
    await expect(
      page.getByRole("heading", { name: /从一个问题出发/ }),
    ).toBeVisible();
    await page.getByRole("link", { name: "探索社区 →" }).click();
    await expect(page).toHaveURL(/\/forum\/?$/);
    await expect(page.getByRole("heading", { name: "板块广场" })).toBeVisible();
  });

  test("移动端首页保持在视口内且菜单可打开", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_PATH}/`);
    await expect(
      page.getByRole("heading", { name: /从一个问题出发/ }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(390);
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(
      page.getByRole("navigation", { name: "移动端导航" }),
    ).toBeVisible();
  });

  test("文件库分类和上传按钮在水合后可操作", async ({ page }) => {
    await page.goto(`${BASE_PATH}/files/`);
    await page
      .locator('astro-island[component-url*="FileListPage"]:not([ssr])')
      .waitFor();

    await page.getByRole("button", { name: /基础学科/ }).click();
    await expect(page.getByRole("button", { name: /数学/ })).toBeVisible();

    await page.getByRole("button", { name: "上传文件" }).click();
    await expect(page.getByRole("heading", { name: "上传文件" })).toBeVisible();
  });

  test("静态板块卡片打开详情而不是跳回广场", async ({ page }) => {
    await page.goto(`${BASE_PATH}/forum/`);
    await page
      .getByRole("link", { name: /基础学科/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/forum\/basic-science\/?$/);
    await expect(page.getByRole("heading", { name: "基础学科" })).toBeVisible();
  });

  test("论坛广场提供发帖入口并打开选板块弹窗", async ({ page }) => {
    await page.goto(`${BASE_PATH}/forum/`);
    await page
      .locator('astro-island[component-url*="CreatePostDialog"]:not([ssr])')
      .waitFor({ state: "attached" });

    await page.getByRole("button", { name: "发帖", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "发布新帖子" }),
    ).toBeVisible();
    await expect(page.getByRole("combobox")).toBeVisible();
  });
});
