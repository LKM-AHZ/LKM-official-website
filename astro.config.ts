import { defineConfig } from "astro/config";

import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import astroExpressiveCode from "astro-expressive-code";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import mdx from "@astrojs/mdx";
import icon from "astro-icon";
import compress from "astro-compress";
import vue from "@astrojs/vue";
import react from "@astrojs/react";
import swup from "@swup/astro";
import node from "@astrojs/node";
import Unfonts from "unplugin-fonts/astro";
import tailwindcss from "@tailwindcss/vite";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { RemarkPlugin } from "@astrojs/markdown-remark";

import { remarkReadingTime } from "./src/lib/markdown-plugins/remark-reading-time.mjs";
import { remarkExcerpt } from "./src/lib/markdown-plugins/remark-excerpt.js";
import remarkGithubAdmonitionsToDirectives from "remark-github-admonitions-to-directives";
import remarkDirective from "remark-directive";
import remarkSectionize from "remark-sectionize";
import { parseDirectiveNode } from "./src/lib/markdown-plugins/remark-directive-rehype.js";
import rehypeSlug from "rehype-slug";
import rehypeComponents from "rehype-components";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { GithubCardComponent } from "./src/lib/markdown-plugins/rehype-component-github-card.mjs";
import { AdmonitionComponent } from "./src/lib/markdown-plugins/rehype-component-admonition.mjs";
import { responsiveTablesRehypePlugin } from "./src/lib/utils/frontmatter.js";
import { astroIconInclude } from "./src/lib/icons/astro-include";
import fs from "node:fs";
import yaml from "js-yaml";
import { fileURLToPath } from "node:url";
import path from "node:path";

// 将 .env 加载进 process.env（已存在的环境变量优先，.env 仅作兜底）。
// 全站 SSR 代码（src/middleware.ts / fetch-ssr.ts / graphql client 等）都用
// process.env.API_URL 读取后端地址，但 Vite 只会把 .env 注入 import.meta.env、
// 不会写回 process.env；此处显式加载，保证 `pnpm run dev` 无需手动 export API_URL。
// 不用 vite 的 loadEnv —— pnpm 隔离下 vite 未 hoist 到根 node_modules，import 'vite' 会解析失败。
function loadDotEnvIntoProcess(): void {
  let content: string;
  try {
    content = fs.readFileSync(path.resolve(process.cwd(), ".env"), "utf-8");
  } catch {
    return; // 无 .env 则跳过（生产环境靠环境变量注入）
  }
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed
      .slice(0, eq)
      .trim()
      .replace(/^export\s+/, "");
    let value = trimmed.slice(eq + 1).trim();
    if (
      // 长度 >= 2 才算成对引号：单字符 `KEY="` 不能当成引号包裹后切成空串
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      // 引号内是字面量，不剥离注释
      value = value.slice(1, -1);
    } else {
      // 未加引号时 ` #` 起为行内注释（与 dotenv 一致），
      // 否则 `API_URL=http://x # 说明` 会把注释并进值里，且出错时极难排查
      const commentAt = value.search(/\s#/);
      if (commentAt !== -1) value = value.slice(0, commentAt).trim();
    }
    process.env[key] ??= value;
  }
}
loadDotEnvIntoProcess();

// config.yaml 在本文件与 virtual-config 插件里共读同一份，这里缓存 + 统一入口，
// 避免两处各自解析导致漂移。路径用 import.meta.url 定位：相对 process.cwd() 读取时，
// 从其它工作目录（IDE 任务、脚本先 cd 过）启动会直接 ENOENT。
let configYamlCache: Record<string, unknown> | null = null;
function loadConfigYaml(): Record<string, unknown> {
  if (configYamlCache) return configYamlCache;
  const raw = fs.readFileSync(
    new URL("./src/data/config.yaml", import.meta.url),
    "utf-8",
  );
  const parsed = yaml.load(raw);
  if (parsed === null || typeof parsed !== "object") {
    throw new Error(
      "src/data/config.yaml 内容为空或不是 YAML 对象，无法读取 site/base",
    );
  }
  configYamlCache = parsed as Record<string, unknown>;
  return configYamlCache;
}
const configYaml = loadConfigYaml();
// 缺 site 段时显式报错，否则后面会在 Astro 内部抛 "Cannot read properties of undefined"
if (typeof configYaml.site !== "object" || configYaml.site === null) {
  throw new Error("src/data/config.yaml 缺少 site 段（site/base 从这里读取）");
}
const siteConfig = configYaml.site as Record<string, string>;
// 站点 URL 缺失时给明确报错：否则 Astro 只抛 "Invalid URL"，定位不到是配置没填
const siteUrl = process.env.PUBLIC_SITE_URL || siteConfig.site;
if (!siteUrl) {
  throw new Error(
    "站点 URL 未配置：请设置 PUBLIC_SITE_URL 或 src/data/config.yaml 的 site.site",
  );
}

export default defineConfig({
  devToolbar: {
    enabled: false,
  },

  // 用 `||` 而非 `??`：`.env` 写成 `PUBLIC_SITE_URL=`（空串）是"留空用默认"的常见写法，
  // 而 `??` 只在 null/undefined 时兜底、空串会赢 → Astro 直接报 "Invalid URL"，
  // `astro check` 连源码都不扫就退出（`.env.example` 正是这么写的，故必须容错空串）。
  site: siteUrl,
  // 环境变量可覆盖 base（如部署在子路径下）；默认读取 config.yaml
  base: process.env.PUBLIC_BASE_PATH || (siteConfig.base as string) || "/",

  output: "server",
  adapter: node({ mode: "standalone" }),

  integrations: [
    swup({
      // 关掉自带 fade 主题，用 View Transitions API 自定过渡（复用 transition.css）
      theme: false,
      native: true,
      animationClass: false,
      containers: ["#navbar-wrapper", "#sidebar-wrapper", "main"],
      cache: true,
      preload: { hover: true, visible: false },
      smoothScrolling: true,
      updateHead: true,
      updateBodyClass: true,
      reloadScripts: true,
      globalInstance: true,
      ignore: [
        /^\/blog(\/|$)/,
        /^\/treehole(\/|$)/,
        /^\/starhope(\/|$)/,
        "a[download]",
      ],
    }),

    sitemap(),
    astroExpressiveCode({
      themes: ["github-dark"],
      defaultProps: { showLineNumbers: false },
      plugins: [pluginLineNumbers()],
    }),
    mdx(),
    vue({
      appEntrypoint: "/src/vue-entry",
    }),
    react({
      // React 仅用于编辑器（Tiptap）。限定 include 到编辑器目录，避免 dev 模式下
      // Vite 8 (Rolldown) 的 react-refresh 机制把 .vue 组件的 setup 误当 React 组件包裹，
      // 注入 $RefreshSig$ 导致 SSR 报 "ReferenceError: $RefreshSig$ is not defined"。
      include: ["src/features/editor/**/*.tsx"],
      exclude: ["**/*.vue"],
    }),
    icon({
      include: {
        ...astroIconInclude,
        "fa6-brands": ["creative-commons", "github"],
        "fa6-regular": ["address-card"],
        "fa6-solid": [
          "arrow-rotate-left",
          "arrow-up-right-from-square",
          "chevron-right",
        ],
        "flat-color-icons": [
          "template",
          "gallery",
          "approval",
          "document",
          "advertising",
          "currency-exchange",
          "voice-presentation",
          "business-contact",
          "database",
        ],
      },
    }),

    Unfonts({
      google: {
        families: [
          {
            name: "Noto Sans SC",
            styles: "wght@400;500;700",
          },
          {
            name: "JetBrains Mono",
            styles: "wght@400;500;700",
          },
        ],
      },
    }),

    compress({
      // 用 lightningcss 而非 csso：csso 压缩时会把包含某些规则的手写 @media 块整块误删
      // 注意：lightningcss 选项须传配置对象而非 true，否则 astro-compress 会把布尔值
      // 直接交给 lightningcss transform，触发 "InvalidArg: boolean true, expected struct Config"。
      CSS: { csso: false, lightningcss: { minify: true } },
      HTML: { "html-minifier-terser": { removeAttributeQuotes: false } },
      Image: true,
      JavaScript: true,
      SVG: true,
      Logger: 1,
    }),
  ],

  image: {
    domains: ["cdn.pixabay.com"],
  },

  markdown: {
    processor: unified({
      remarkPlugins: [
        remarkMath,
        remarkReadingTime,
        remarkExcerpt,
        remarkGithubAdmonitionsToDirectives,
        remarkDirective,
        remarkSectionize,
        parseDirectiveNode as unknown as RemarkPlugin,
      ],
      rehypePlugins: [
        responsiveTablesRehypePlugin,
        rehypeKatex,
        rehypeSlug,
        [
          rehypeComponents,
          {
            components: {
              github: GithubCardComponent,
              note: (
                x: Parameters<typeof AdmonitionComponent>[0],
                y: Parameters<typeof AdmonitionComponent>[1],
              ) => AdmonitionComponent(x, y, "note"),
              tip: (
                x: Parameters<typeof AdmonitionComponent>[0],
                y: Parameters<typeof AdmonitionComponent>[1],
              ) => AdmonitionComponent(x, y, "tip"),
              important: (
                x: Parameters<typeof AdmonitionComponent>[0],
                y: Parameters<typeof AdmonitionComponent>[1],
              ) => AdmonitionComponent(x, y, "important"),
              caution: (
                x: Parameters<typeof AdmonitionComponent>[0],
                y: Parameters<typeof AdmonitionComponent>[1],
              ) => AdmonitionComponent(x, y, "caution"),
              warning: (
                x: Parameters<typeof AdmonitionComponent>[0],
                y: Parameters<typeof AdmonitionComponent>[1],
              ) => AdmonitionComponent(x, y, "warning"),
            },
          },
        ],
        [
          rehypeAutolinkHeadings,
          {
            behavior: "append",
            properties: {
              className: ["anchor"],
            },
            content: {
              type: "element",
              tagName: "span",
              properties: {
                className: ["anchor-icon"],
                "data-pagefind-ignore": true,
              },
              children: [
                {
                  type: "text",
                  value: "#",
                },
              ],
            },
          },
        ],
      ],
    }),
  },

  vite: {
    server: {
      // 允许访问 dev server 的主机名（各机器不同，用逗号分隔覆盖，默认值仅为既有部署保留）
      allowedHosts: (process.env.DEV_ALLOWED_HOSTS ?? "124.220.55.235")
        .split(",")
        .map((host) => host.trim())
        .filter(Boolean),
      proxy: process.env.API_URL
        ? {
            // 即转发 HTTP 也转发 WS upgrade：前端 WebSocket(/api/v1/ws/events)
            // 需经 Vite dev 代理把握手与数据中继到后端（浏览器同域建连无法直连源站）。
            "/api": {
              target: process.env.API_URL,
              changeOrigin: true,
              ws: true,
            },
            "/graphql": { target: process.env.API_URL, changeOrigin: true },
            // 成员头像经 /api/v1/avatars/* 走上面的 /api 代理，无需独立 /static 代理
          }
        : undefined,
    },
    // Pinia/Vue 在生产/SSR 构建中访问 __VUE_PROD_DEVTOOLS__，必须由 vite 注入，
    // 否则 createPinia 在 SSR 渲染时抛 ReferenceError，导致所有挂载 Pinia 的页面无法渲染。
    define: {
      __VUE_PROD_DEVTOOLS__: JSON.stringify(false),
    },
    plugins: [
      tailwindcss(),
      {
        name: "virtual-config",
        resolveId(id) {
          if (id === "virtual:config") return "\0virtual:config";
        },
        load(id) {
          if (id === "\0virtual:config") {
            // 复用同一份缓存读取，避免与文件顶部各解析一次而漂移
            return `export default ${JSON.stringify(loadConfigYaml())};`;
          }
        },
      },
      {
        name: "exclude-yaml",
        // resolveId 返回 false 在 Rollup 里表示「该模块按 external 处理」而不是「未解析」，
        // 那样下面的 load 永远不会执行，yaml 会被 dev/SSR 按原文件解析而报错。
        // 改为解析到一个空的虚拟模块，才真正达到「屏蔽 yaml 导入」的目的。
        resolveId(id) {
          if (id.endsWith(".yaml") || id.endsWith(".yml")) {
            return "\0empty-yaml";
          }
        },
        load(id) {
          if (id === "\0empty-yaml") {
            return "export default {}";
          }
        },
      },
      {
        name: "wgsl-raw",
        transform(code, id) {
          if (id.endsWith(".wgsl")) {
            return `export default ${JSON.stringify(code)};`;
          }
        },
      },
    ],
    build: {
      // editor-tiptap/editor-codemirror 为编辑器专属懒加载 chunk（模块2 强分离产物，
      // 仅编辑器页加载，不进公共池；minified 原始 ~507KiB 但 gz 传输 178/145KiB，
      // 在 check-bundle-budget 的 180KiB 单 chunk 参考线内）。调高默认 500 阈值消除纯字节噪音，
      // 总量（硬门禁）仍由 scripts/check-bundle-budget.mjs 把关。
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // 按「包目录」匹配（两侧带斜杠）：前缀匹配会把 react-icons、@tanstack/react-* 之类也算进
            // vendor-react、把 vue-router 算进 vendor-vue，破坏本意的缓存隔离并撑大这两个 chunk
            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/")
            ) {
              return "vendor-react";
            }
            if (
              id.includes("node_modules/overlayscrollbars") ||
              id.includes("node_modules/photoswipe")
            ) {
              return;
            }
            if (
              id.includes("node_modules/katex") ||
              id.includes("node_modules/rehype-katex")
            ) {
              return "vendor-katex";
            }
            if (
              id.includes("/node_modules/vue/") ||
              id.includes("/node_modules/@iconify/vue/")
            ) {
              return "vendor-vue";
            }
            // ---- 编辑器技术栈拆分（模块 2 · 只分割不迁框架）----
            // Tiptap 运行时 + 其底层 ProseMirror（tiptap 强依赖 prosemirror）→ 独立「编辑器运行时」chunk，
            // 一是拆分 DocumentEditor 巨型共享 chunk，二是让稳定的编辑器运行时具备独立 HTTP 缓存。
            if (
              id.includes("node_modules/@tiptap") ||
              id.includes("node_modules/@prosemirror") ||
              id.includes("node_modules/prosemirror")
            ) {
              return "editor-tiptap";
            }
            // CodeMirror 语言运行时（SourceEditor 用）→ 独立 chunk，避免所有语言包打进 Document/Source。
            if (
              id.includes("node_modules/@codemirror") ||
              id.includes("node_modules/@lezer") ||
              id.includes("node_modules/@uiw/codemirror") ||
              id.includes("node_modules/@ungap")
            ) {
              return "editor-codemirror";
            }
            // ---- i18n 预平铺词典拆分（TBT 专项 · 见 plans/hidden-twirling-ocean）。----
            // 生成器产出的扁平词典各自独立 chunk：zh-CN 为默认语同步载入（防闪），
            // en 按当前 locale 异步 import（ensureDict），互不进公共池、可独立缓存。
            if (id.includes("/i18n/generated/zh_CN.flat.")) {
              return "i18n-zh";
            }
            if (id.includes("/i18n/generated/en.flat.")) {
              return "i18n-en";
            }
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ["virtual:config"],
      include: ["react", "react-dom", "react-dom/client"],
      rolldownOptions: {
        transform: {
          // 修复 dev 模式下富文本编辑器不渲染的问题：
          // Vite 8 (Rolldown) 预构建 react/jsx-dev-runtime 时把 process.env.NODE_ENV
          // 折叠为 production，导致 jsxDEV 被编译成 undefined；而 @astrojs/react 在
          // dev 模式把 .tsx 编译成调用 jsxDEV，于是报 "_jsxDEV is not a function"。
          // optimizeDeps 仅在 dev server 运行，这里强制 development 是安全的。
          define: {
            "process.env.NODE_ENV": JSON.stringify("development"),
          },
        },
      },
    },
    css: {
      transformer: "postcss",
    },
    resolve: {
      alias: {
        "~": path.resolve(fileURLToPath(new URL(".", import.meta.url)), "src"),
        // naive-ui 同时提供 CJS(lib/index.js) 与 ESM(es/index.mjs) 入口、且无 exports 字段，
        // Vite 解析时可能回调到 CJS 入口，导致按命名导入报
        // "Named export not found ... is a CommonJS module"。
        // 强制固定到 ESM 入口，消除 double-package，保证全部命名导出可用。
        "naive-ui": fileURLToPath(
          new URL("./node_modules/naive-ui/es/index.mjs", import.meta.url),
        ),
      },
    },
  },
});
