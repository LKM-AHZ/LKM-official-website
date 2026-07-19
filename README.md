# LKM Official Website · 理科迷官方网站

[![Astro v6](https://img.shields.io/badge/Astro-v6-FF5D01?logo=astro)](https://astro.build)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vuedotjs)](https://vuejs.org)
[![Three.js](https://img.shields.io/badge/Three.js-0.178-000000?logo=threedotjs)](https://threejs.org)
[![daisyUI](https://img.shields.io/badge/daisyUI-v5-5A0EF8?logo=daisyui)](https://daisyui.com)

**理科迷 (LKM)** 的官方网站 — 基于 [AstroWind](https://github.com/arthelokyo/astrowind) 模板，采用 Astro v6 + Tailwind CSS v4 构建的纯静态站点。LKM 是创立于 2014 年的科技爱好者社区，覆盖数学、物理、化学、生物、信息技术等多个学科。

> 查看 [AGENTS.md](./AGENTS.md) 了解 AI Agent 工作指令。

---

## 快速开始

> **Node.js >= 24.0.0** | **pnpm >= 11.0.0**

```bash
git clone https://github.com/LKM-AHZ/LKM-official-website.git
cd LKM-official-website
pnpm install
pnpm run dev
```

浏览器访问 `http://localhost:4321/LKM-official-website`。

---

## 常用命令

| 命令               | 说明                         |
| :----------------- | :--------------------------- |
| `pnpm run dev`     | 启动开发服务器               |
| `pnpm run build`   | 生产构建到 `./dist/`         |
| `pnpm run preview` | 本地预览生产构建             |
| `pnpm run check`   | 类型检查 + ESLint + Prettier |
| `pnpm run fix`     | 自动修复 ESLint + Prettier   |

---

## 项目结构

```
/
├── .github/workflows/          # CI/CD (GitHub Actions)
├── public/                     # 静态资源
├── src/
│   ├── assets/
│   │   ├── images/             # 本地图片、头像
│   │   └── styles/tailwind.css # Tailwind v4 配置入口
│   ├── components/
│   │   ├── background/         # 可切换动态背景（13 种效果）
│   │   ├── blog/               # 博客组件
│   │   ├── common/             # 通用组件（Image, Metadata, Analytics 等）
│   │   ├── ui/                 # 基础 UI 组件
│   │   └── widgets/            # 页面部件（Hero, Header, Footer 等）
│   ├── data/
│   │   ├── members.ts          # 团队成员数据
│   │   └── post/               # 博客文章 (.md / .mdx)
│   ├── layouts/                # 页面布局
│   ├── pages/                  # 文件路由
│   ├── utils/                  # 工具函数
│   ├── config.yaml             # 站点主配置
│   ├── content.config.ts       # 内容集合 Schema
│   └── navigation.ts           # 导航结构
├── src/vendor/interactive-backgrounds/  # 背景组件源码
├── vendor/integration/         # 自定义 Astro 集成
├── AGENTS.md                   # AI Agent 指令
├── astro.config.ts             # Astro 配置
└── tsconfig.json               # TypeScript 配置
```

---

## 页面路由

| 路由       | 路径            | 源文件                     | 布局           |
| :--------- | :-------------- | :------------------------- | :------------- |
| 首页       | `/`             | `pages/index.astro`        | PageLayout     |
| 管理团队   | `/team`         | `pages/team.astro`         | SidebarLayout  |
| 项目团队   | `/project-team` | `pages/project-team.astro` | SidebarLayout  |
| 关于       | `/about`        | `pages/about.astro`        | SidebarLayout  |
| 服务       | `/services`     | `pages/services.astro`     | SidebarLayout  |
| 赞助与支持 | `/pricing`      | `pages/pricing.astro`      | SidebarLayout  |
| 联系我们   | `/contact`      | `pages/contact.astro`      | SidebarLayout  |
| QQ 社群    | `/communities`  | `pages/communities.astro`  | SidebarLayout  |
| 文档库     | `/docs`         | `pages/docs/`              | DocsLayout     |
| 隐私政策   | `/privacy`      | `pages/privacy.md`         | MarkdownLayout |
| 使用条款   | `/terms`        | `pages/terms.md`           | MarkdownLayout |
| 博客       | `/blog`         | `pages/[...blog]/`         | PageLayout     |
| 文章详情   | `/blog/<slug>`  | `pages/[...blog]/`         | PageLayout     |
| 404        | `/404`          | `pages/404.astro`          | PageLayout     |
| RSS        | `/rss.xml`      | `pages/rss.xml.ts`         | —              |

---

## 配置系统

`src/config.yaml` 通过 `vendor/integration/` 注入为 Vite 虚拟模块 `astrowind:config`：

```ts
import { SITE, I18N, METADATA, APP_BLOG, UI, ANALYTICS } from 'astrowind:config';
```

常用配置项：站点名称/URL、SEO 元数据、博客开关与分页、Google Analytics ID、主题模式等。导航结构在 `src/navigation.ts` 中定义。

---

## 样式系统

**Tailwind CSS v4** — CSS-first 配置，入口 `src/assets/styles/tailwind.css`，支持暗色模式、自定义主题变量、Typography 插件。组件使用 **CSS Modules** 实现局部作用域样式。UI 层面使用 **daisyUI v5** 组件库，结合 **KaTeX** 渲染数学公式。

---

## 内容管理

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

文章正文...
```

Schema 由 `src/content.config.ts` (Zod) 验证，`src/utils/blog.ts` 负责加载、排序和关联。

---

## 构建部署

```bash
pnpm run build   # 输出到 ./dist/
```

| 平台             | 说明                   |
| :--------------- | :--------------------- |
| GitHub Pages     | 推送 main 分支自动部署 |
| Vercel / Netlify | 导入 Git 仓库即可      |
| 任意静态托管     | 上传 `dist/` 目录      |

---

## 团队成员

团队数据维护在 `src/data/members.ts`，按部门分组导出（创始人、总务部、群务部、活动策划部、新闻办等）。`src/pages/team.astro` 通过 `MemberCard` / `DepartmentSection` 组件渲染，头像存放于 `src/assets/images/member/`。

---

## 架构概览

```
配置层     config.yaml → vendor/integration → astrowind:config (虚拟模块)
  ↓
布局层     SidebarLayout / PageLayout / MarkdownLayout / DocsLayout
  ↓
页面层     src/pages/ (文件路由)
  ↓
Widget 层  src/components/widgets/ (Hero, Features, Header, Footer…)
  ↓
UI 层      src/components/ui/ (Button, Form, Headline, Timeline…)
  ↓
Common 层  src/components/common/ (Image, Metadata, Analytics…)
  ↓
背景层     src/components/background/ (13 种可切换动态背景，3D 核苷酸模型可拖拽)
  ↓
数据层     src/data/post/ + src/utils/
```

---

## 特性

- **Astro v6** 静态站点生成，PageSpeed Insights 评分优秀
- **Tailwind CSS v4** 暗色模式 + 自定义主题
- **13 种可切换动态背景** — 极光、数字雨、星座、DNA（2D/3D）、星云等，自适应深浅主题
- **双 UI 框架** — Vue 3 + React 19
- **View Transitions** SPA 风格页面切换
- **博客系统** — MD/MDX、分类/标签、分页、KaTeX 公式
- **SEO 完整** — Sitemap、RSS、Open Graph、Twitter Card
- **图片优化** — Sharp + Unpic CDN
- **daisyUI v5 + KaTeX** — 组件库 + 数学公式渲染
- **响应式适配** — 移动端至桌面端
- **多平台部署** — GitHub Pages / Vercel / Netlify / 任意静态托管
