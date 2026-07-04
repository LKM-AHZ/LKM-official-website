# LKM Official Website

理科迷 (LKM) 官方网站 — 基于 **[AstroWind](https://github.com/arthelokyo/astrowind)** 模板构建，采用 **Astro v6 + Tailwind CSS v4** 纯静态站点。

---

## 快速开始

> **Node.js >= 24.0.0** | **pnpm >= 11.0.0**

```bash
# 安装 Node.js
# Windows: winget install OpenJS.NodeJS.LTS
# Linux:   curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash - && sudo apt-get install -y nodejs
# macOS:   brew install node@24

# 启用 pnpm
corepack enable
corepack prepare pnpm@latest --activate

# 克隆并启动
git clone https://github.com/LKM-2014/LKM-official-website.git
cd LKM-official-website
pnpm install
pnpm run dev
```

浏览器访问 `http://localhost:4321`。

---

## 命令

| 命令               | 说明                            |
| :----------------- | :------------------------------ |
| `pnpm run dev`     | 启动开发服务器 `localhost:4321` |
| `pnpm run build`   | 生产构建，输出到 `./dist/`      |
| `pnpm run preview` | 本地预览生产构建                |
| `pnpm run check`   | 类型检查 + ESLint + Prettier    |
| `pnpm run fix`     | 自动修复 ESLint + Prettier      |

---

## 项目结构

```
/
├── .github/workflows/        # CI/CD (GitHub Actions)
├── public/                   # 静态资源（robots.txt, _headers, images/）
├── src/
│   ├── assets/
│   │   ├── favicons/         # 网站图标
│   │   ├── images/           # 本地图片
│   │   └── styles/tailwind.css   # Tailwind v4 入口：主题、工具类、插件
│   ├── components/
│   │   ├── blog/             # 博客组件（Grid, List, SinglePost, Pagination 等）
│   │   ├── common/           # 通用组件（Image, Metadata, Analytics, ToggleTheme 等）
│   │   ├── ui/               # 基础 UI（Button, Form, Headline, Timeline 等）
│   │   └── widgets/          # 页面部件（Hero, Features, Pricing, Header, Footer 等）
│   ├── data/post/            # 博客文章（.md / .mdx）
│   ├── layouts/              # 页面布局（Layout, PageLayout, SidebarLayout 等）
│   ├── pages/                # 文件路由
│   ├── utils/                # 工具函数（blog, permalinks, images, frontmatter）
│   ├── config.yaml           # 站点主配置
│   ├── content.config.ts     # 内容集合 Schema
│   ├── navigation.ts         # 导航结构
│   └── types.d.ts            # TypeScript 类型定义
├── vendor/integration/       # 自定义 Astro 集成（config.yaml 虚拟模块）
├── astro.config.ts           # Astro 配置
└── tsconfig.json             # TypeScript 配置
```

---

## 页面路由

| 路由           | 文件                   | 布局           |
| :------------- | :--------------------- | :------------- |
| `/`            | `pages/index.astro`    | PageLayout     |
| `/about`       | `pages/about.astro`    | SidebarLayout  |
| `/team`        | `pages/team.astro`     | PageLayout     |
| `/services`    | `pages/services.astro` | SidebarLayout  |
| `/pricing`     | `pages/pricing.astro`  | SidebarLayout  |
| `/contact`     | `pages/contact.astro`  | SidebarLayout  |
| `/privacy`     | `pages/privacy.md`     | MarkdownLayout |
| `/terms`       | `pages/terms.md`       | MarkdownLayout |
| `/404`         | `pages/404.astro`      | PageLayout     |
| `/rss.xml`     | `pages/rss.xml.ts`     | —              |
| `/blog`        | `pages/[...blog]/`     | PageLayout     |
| `/blog/<slug>` | `pages/[...blog]/`     | PageLayout     |

---

## 配置系统

配置文件 `src/config.yaml` 通过 `vendor/integration/` 注入为 Vite 虚拟模块，供页面和组件引用：

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

导航结构定义在 `src/navigation.ts`，使用 `getPermalink()` 和 `getAsset()` 生成 URL。

---

## 样式系统

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

Your content here...
```

Schema 由 `src/content.config.ts` (Zod) 验证，`src/utils/blog.ts` 负责加载、排序和关联。

---

## 构建部署

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

## 辅助工具

`tools/` 目录包含 team 页面的生成工具：

| 文件               | 说明                                |
| :----------------- | :---------------------------------- |
| `工作簿1.xlsx`     | 团队成员源数据（Excel 表格）        |
| `generate_team.py` | 从 Excel 生成 `team.astro` 页面文件 |

---

## 架构概览

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
数据层        src/data/post/ + src/utils/
```

---

## 特性

- **Astro v6 静态站点生成**，PageSpeed Insights 评分优秀
- **Tailwind CSS v4**，CSS-first 配置，支持暗色模式
- **CSS Modules** 局部作用域样式，与 Tailwind 协同
- **Vue / React** UI 框架支持
- **SEO 友好**：自动生成 sitemap、RSS、Open Graph / Twitter Card
- **图片优化**：Astro Assets (Sharp) + Unpic CDN 双通道
- **博客系统**：MD/MDX 支持，分类/标签过滤，分页，阅读时间
- **View Transitions**：SPA 风格页面切换动画
- **DaisyUI + KaTeX**：组件库与数学公式渲染
- **多平台部署**：Vercel、Netlify、任意静态托管
