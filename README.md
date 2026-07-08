# LKM Official Website · 理科迷官方网站

[![Astro](https://img.shields.io/badge/Astro-v6-FF5D01?logo=astro)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)

理科迷 (LKM) 组织的官方网站，基于 [AstroWind](https://github.com/arthelokyo/astrowind) 模板构建，采用 **Astro v6 + Tailwind CSS v4** 的纯静态站点。

The official website of the LKM (LiKeMi) open-source organization — a static site built with **Astro v6 + Tailwind CSS v4**, based on the [AstroWind](https://github.com/arthelokyo/astrowind) template.

> 📖 For AI agent instructions, see [AGENTS.md](./AGENTS.md).

---

## 快速开始 · Quick Start

> **Node.js >= 24.0.0** | **pnpm >= 11.0.0**

```bash
git clone https://github.com/LKM-2014/LKM-official-website.git
cd LKM-official-website
pnpm install
pnpm run dev
```

浏览器访问 `http://localhost:4321/LKM-official-website`。

---

## 命令 · Commands

| 命令               | 说明                                                                       |
| :----------------- | :------------------------------------------------------------------------- |
| `pnpm run dev`     | 启动开发服务器 / Start dev server at `localhost:4321/LKM-official-website` |
| `pnpm run build`   | 生产构建到 `./dist/` / Production build to `./dist/`                       |
| `pnpm run preview` | 本地预览生产构建 / Preview production build locally                        |
| `pnpm run check`   | 类型检查 + ESLint + Prettier / Type check + Lint                           |
| `pnpm run fix`     | 自动修复 ESLint + Prettier / Auto-fix lint issues                          |

---

## 项目结构 · Project Structure

```
/
├── .github/workflows/        # CI / CD (GitHub Actions)
├── public/                   # 静态资源 / Static assets (robots.txt, _headers, images/)
├── src/
│   ├── assets/
│   │   ├── favicons/         # 网站图标
│   │   ├── images/           # 本地图片 / Local images
│   │   └── styles/tailwind.css   # Tailwind v4 入口：主题、工具类、插件
│   ├── components/
│   │   ├── background/       # 动态背景 / Dynamic backgrounds (WebGL2 Sci-Fi)
│   │   ├── blog/             # 博客组件 / Blog components
│   │   ├── common/           # 通用组件 / Shared (Image, Metadata, Analytics 等)
│   │   ├── ui/               # 基础 UI 组件 / Primitives (Button, Form, Headline 等)
│   │   └── widgets/          # 页面部件 / Page sections (Hero, Header, Footer 等)
│   ├── data/
│   │   ├── members.ts        # 团队成员数据 / Team member data
│   │   └── post/             # 博客文章 / Blog posts (.md / .mdx)
│   ├── layouts/              # 页面布局 / Layouts
│   ├── pages/                # 文件路由 / File-based routing
│   ├── utils/                # 工具函数 / Utilities (blog, images, permalinks)
│   ├── config.yaml           # 站点主配置 / Site configuration
│   ├── content.config.ts     # 内容集合 Schema
│   ├── navigation.ts         # 导航结构
│   └── types.d.ts            # TypeScript 类型定义
├── tools/                    # 辅助工具 / Helper scripts (team 页面生成)
├── vendor/integration/       # 自定义 Astro 集成 / Config loader
├── AGENTS.md                 # AI Agent 指令 / AI agent instructions
├── astro.config.ts           # Astro 配置
└── tsconfig.json             # TypeScript 配置
```

---

## 页面路由 · Routes

| Route           | Path           | Source                 | Layout         |
| :-------------- | :------------- | :--------------------- | :------------- |
| 首页 / Home     | `/`            | `pages/index.astro`    | PageLayout     |
| 关于 / About    | `/about`       | `pages/about.astro`    | SidebarLayout  |
| 团队 / Team     | `/team`        | `pages/team.astro`     | PageLayout     |
| 服务 / Services | `/services`    | `pages/services.astro` | SidebarLayout  |
| 定价 / Pricing  | `/pricing`     | `pages/pricing.astro`  | SidebarLayout  |
| 联系 / Contact  | `/contact`     | `pages/contact.astro`  | SidebarLayout  |
| 隐私 / Privacy  | `/privacy`     | `pages/privacy.md`     | MarkdownLayout |
| 条款 / Terms    | `/terms`       | `pages/terms.md`       | MarkdownLayout |
| 404             | `/404`         | `pages/404.astro`      | PageLayout     |
| RSS             | `/rss.xml`     | `pages/rss.xml.ts`     | —              |
| 博客 / Blog     | `/blog`        | `pages/[...blog]/`     | PageLayout     |
| 文章 / Post     | `/blog/<slug>` | `pages/[...blog]/`     | PageLayout     |

---

## 配置系统 · Configuration

配置文件 `src/config.yaml` 通过 `vendor/integration/` 注入为 Vite 虚拟模块：

The site config is loaded as a Vite virtual module `astrowind:config`:

```ts
import { SITE, I18N, METADATA, APP_BLOG, UI, ANALYTICS } from 'astrowind:config';
```

### 关键配置

```yaml
site:
  name: 'LKM'
  site: 'https://LKM-2014.github.io'
  base: '/LKM-official-website'
metadata:
  title:
    default: 'LKM'
    template: '%s — LKM'
i18n:
  language: zh-cn
  textDirection: ltr
apps:
  blog:
    isEnabled: true
    postsPerPage: 6
ui:
  theme: 'system'
analytics:
  vendors:
    googleAnalytics:
      id: null # 填入 "G-XXXXXXXXXX" 启用
```

导航结构定义在 `src/navigation.ts`，使用 `getPermalink()` 和 `getAsset()` 生成 URL。 / Navigation is in `src/navigation.ts`.

---

## 样式系统 · Styling

**Tailwind CSS v4** — CSS-first 配置，入口文件 `src/assets/styles/tailwind.css`：

```css
@import 'tailwindcss';
@plugin '@tailwindcss/typography';

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-primary: ...;
  --font-heading: ...;
}

@utility btn { ... }
@utility btn-primary { ... }
```

**CSS Modules** — `.module.css` 文件自动局部作用域化，需在顶部加 `@reference "tailwindcss"` 以使用 `@apply`。

**DaisyUI + KaTeX** — 组件库与数学公式渲染支持。

---

## 内容管理 · Content

在 `src/data/post/` 下创建 `.md` 或 `.mdx` 文件：

```md
---
publishDate: 2025-01-15T00:00:00Z
title: 文章标题
excerpt: 文章摘要
tags: [web, tutorial]
category: tutorials
author: 作者名
image: ~/assets/images/cover.jpg
---

Your content here...
```

Schema 由 `src/content.config.ts` (Zod) 验证，`src/utils/blog.ts` 负责加载、排序和关联。

---

## 构建部署 · Deployment

```bash
pnpm run build   # 构建到 ./dist/
```

| 平台             | 说明                                        |
| :--------------- | :------------------------------------------ |
| **GitHub Pages** | 推送 main 分支自动部署，GitHub Actions 驱动 |
| **Vercel**       | 直接导入 Git 仓库即可部署                   |
| **Netlify**      | 使用 `netlify.toml`                         |
| **任意托管**     | 上传 `dist/` 目录                           |

---

## 辅助工具 · Tooling

`tools/` 目录包含 team 页面的生成工具：

| 文件               | 说明                                                    |
| :----------------- | :------------------------------------------------------ |
| `工作簿1.xlsx`     | 团队成员源数据（Excel 表格）/ Team member source data   |
| `generate_team.py` | 从 Excel 生成 team 页面 / Generate team page from Excel |

---

## 架构概览 · Architecture

```
配置层        config.yaml → vendor/integration → astrowind:config
  ↓
布局层        Layout → PageLayout / MarkdownLayout / SidebarLayout
  ↓
页面层        src/pages/ (文件路由)
  ↓
Widget 层     src/components/widgets/ (Hero, Features, Header, Footer...)
  ↓
UI 层         src/components/ui/ (Button, Form, Headline, Timeline...)
  ↓
Common 层     src/components/common/ (Image, Metadata, Analytics...)
  ↓
Background 层  src/components/background/ (WebGL2 Sci-Fi 动态背景)
  ↓
数据层        src/data/post/ + src/utils/
```

---

## 特性 · Features

- **Astro v6** 静态站点生成 / Static site generation，PageSpeed Insights 评分优秀
- **Tailwind CSS v4** CSS-first 配置 / CSS-first config，暗色模式 / Dark mode
- **WebGL2 Sci-Fi 动态背景** / Dynamic sci-fi 3D background
- **CSS Modules** 局部作用域样式 / Locally scoped styles
- **Vue 3 + React 19** 双 UI 框架支持 / Dual UI framework support
- **SEO 友好** / SEO: Sitemap, RSS, Open Graph, Twitter Card
- **图片优化** / Image optimization: Sharp + Unpic CDN
- **博客系统** / Blog: MD/MDX, 分类/标签, 分页, KaTeX 公式
- **View Transitions** SPA 风格页面切换 / SPA-style page transitions
- **DaisyUI + KaTeX** 组件库 + 数学公式 / Component library + math rendering
- **团队成员数据驱动** / Data-driven team page
- **多平台部署** / Multi-platform deploy: Vercel, Netlify, any static host
- **AI Agent 指令** / AI agent instructions in [AGENTS.md](./AGENTS.md)
