import { defineConfig, devices } from "@playwright/test";

// 端口只在这里定义一次：baseURL 与 webServer.port 各自硬编码会悄悄漂移，
// 让测试打到另一个端口上却不报错。与 astro preview 一致，支持 PORT 覆盖。
const WEB_SERVER_PORT = Number(process.env.PORT ?? 4321);

// 站点 base 路径：优先读 astro.config.ts 使用的 PUBLIC_BASE_PATH（.env.example 里公开的那个），
// 兼容测试文件里仍在用的 BASE_PATH。若不归一化，`/blog/` 会拼出 `.../blog/`，
// 而 `blog` 会拼成 `localhost:4321blog` 这种坏 URL。
const rawBasePath = (
  process.env.PUBLIC_BASE_PATH ??
  process.env.BASE_PATH ??
  ""
).trim();
const trimmedBasePath = rawBasePath.replace(/\/+$/, "");
const BASE_PATH =
  trimmedBasePath === ""
    ? ""
    : trimmedBasePath.startsWith("/")
      ? trimmedBasePath
      : `/${trimmedBasePath}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "line",
  use: {
    baseURL: `http://localhost:${WEB_SERVER_PORT}${BASE_PATH}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // astro preview 只服务既有产物：干净检出（未 build）会直接启动失败，且会静默复用
    // 本地残留的旧构建。先 build 保证 e2e 打的就是当前源码，并显式传 --port 让服务监听
    // 与 baseURL 同一个端口（PORT 被覆盖时两者不会各说各话）。
    command: `pnpm build && pnpm exec astro preview --host --port ${WEB_SERVER_PORT}`,
    port: WEB_SERVER_PORT,
    reuseExistingServer: !process.env.CI,
  },
});
