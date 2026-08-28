import astroEslintParser from "astro-eslint-parser";
import eslintPluginAstro from "eslint-plugin-astro";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import typescriptParser from "@typescript-eslint/parser";
import vueParser from "vue-eslint-parser";

export default [
  js.configs.recommended,
  ...eslintPluginAstro.configs["flat/recommended"],
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: astroEslintParser,
      parserOptions: {
        parser: "@typescript-eslint/parser",
        extraFileExtensions: [".astro"],
      },
    },
    // Astro 组件脚本（`<script is:inline>` 为纯 JS、普通 `<script>`/`<script lang="ts">`
    // 由 Astro 原生处理）强制类型标注会把非法 TS/JS 打进页面（ts(8010)），故此处豁免。
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: "@typescript-eslint/parser",
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    files: ["**/*.{js,jsx,astro}"],
    rules: {
      "no-mixed-spaces-and-tabs": ["error", "smart-tabs"],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // 定义 `<script>` 标签的配置。
    // `<script>` 中的脚本会被分配一个带 `.js` 扩展名的虚拟文件名。
    files: ["**/*.{ts,tsx}", "**/*.astro/*.js"],
    languageOptions: {
      parser: typescriptParser,
    },
    rules: {
      // 注意：必须禁用基础规则，因为它可能报告错误的错误
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  {
    // 仅对纯 TypeScript 文件强制返回类型标注。
    // 关键：`**/*.astro/**` 必须排除——Astro 的 `<script is:inline>`（纯 JS）与
    // 部分 `<script>` 由 Astro 原生处理，若强制类型标注会把非法 TS 打进页面
    // （`ts(8010): Type annotations can only be used in TypeScript files`）。
    // astro-eslint-parser 会把 `<script>` 映射为匹配 `**/*.{ts,tsx}` 的虚拟路径，
    // 因此必须用 ignores 显式排除 .astro 相关虚拟文件。
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/*.astro/**"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true },
      ],
    },
  },
  {
    // 测试文件豁免返回类型标注：测试常用简洁箭头函数，结果由断言/泛型承载。
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts"],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  },
  {
    files: [
      "src/features/shell/common/components/Analytics.astro",
      "src/features/shell/common/components/Analytics.astro/**",
    ],
    rules: {
      "prefer-rest-params": "off",
      "no-var": "off",
    },
  },
  {
    // FuwariNavbar / Sidebar 内联脚本位于 Swup 容器（#navbar-wrapper / #sidebar-wrapper）
    // 内，会被 reloadScripts 每次过渡重新执行，顶层 const 重复声明会抛
    // "Identifier 'B' has already been declared" 中断脚本；故 `var` 为有意的设计
    // （见组件内注释），豁免 no-var。
    files: [
      "src/features/shell-official/components/FuwariNavbar.astro",
      "src/features/shell-official/components/FuwariNavbar.astro/**",
      "src/features/homepage/components/Sidebar.astro",
      "src/features/homepage/components/Sidebar.astro/**",
    ],
    rules: {
      "no-var": "off",
    },
  },
  {
    files: ["src/**/*.{ts,tsx,vue,astro}"],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "fetch",
          message:
            "请使用 ~/lib/http/client (axios) 或 ~/lib/api 的 apiFetch wrapper，不要直接调用 fetch。",
        },
      ],
    },
  },
  {
    ignores: [
      "**/dist",
      "**/node_modules",
      "**/.astro",
      "**/.turbo",
      "**/.github",
      "**/.claude",
      "**/.superpowers",
      "**/reference",
      "**/types.generated.d.ts",
      "src/layouts/BlogLayout.astro",
      "src/layouts/OfficialBlogLayout.astro",
      "src/layouts/CommunityBlogLayout.astro",
      "scripts/mock-server.mjs",
      "src/lib/icons/astro-include.ts",
    ],
  },
];
