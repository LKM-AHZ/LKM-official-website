import { test, expect } from "@playwright/test";

const BASE_PATH = process.env.BASE_PATH ?? "";

const PUBLIC_ROUTES = [
  { path: `${BASE_PATH}/`, label: "首页" },
  { path: `${BASE_PATH}/blog/`, label: "博客列表" },
  { path: `${BASE_PATH}/blog/about/`, label: "博客关于" },
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

  test("首页无未捕获错误", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${BASE_PATH}/`);
    expect(errors).toEqual([]);
  });

  test("博客文章页无未捕获错误", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto(`${BASE_PATH}/blog/`);
    expect(errors).toEqual([]);
  });
});
