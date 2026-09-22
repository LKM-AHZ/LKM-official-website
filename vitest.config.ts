import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import path from "path";

// 两个 project 的排除项曾各写一份，改一处漏一处就会让某个 project 静默开始收集构建产物
const baseExclude = [
  "dist/**",
  ".astro/**",
  "coverage/**",
  "node_modules/**",
  "**/node_modules/**",
];

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "src"),
      // Astro 的虚拟模块在 vitest 下不存在；用与 config.yaml 一致的 mock 顶替
      "virtual:config": path.resolve(
        __dirname,
        "src/lib/config/__mocks__/virtual-config.ts",
      ),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          include: ["src/**/*.test.ts"],
          // 排除 auth 目录：那边由下面的 happy-dom project 跑
          exclude: [...baseExclude, "src/features/auth/**"],
          environment: "node",
        },
      },
      {
        // 仅对 auth 目录启用 DOM 环境（组件态测试基建）
        extends: true,
        test: {
          name: "auth",
          include: ["src/features/auth/**/*.test.ts"],
          exclude: [...baseExclude],
          environment: "happy-dom",
          setupFiles: ["src/features/auth/__tests__/setup.ts"],
        },
      },
    ],
  },
});
