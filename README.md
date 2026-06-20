# LKM Official Website

理科迷 (LKM) 官方网站 — 基于 **[AstroWind](https://github.com/arthelokyo/astrowind)** 模板构建，采用 **[Astro v6](https://astro.build/) + [Tailwind CSS v4](https://tailwindcss.com/)** 前端与 **[FastAPI](https://fastapi.tiangolo.com/) + [PostgreSQL](https://www.postgresql.org/)** 后端，部署于 **Vercel**。

---

## 特性

- **Astro v6 静态站点生成**，PageSpeed Insights 评分优秀
- **Tailwind CSS v4**，CSS-first 配置，支持暗色模式
- **CSS Modules** 局部作用域样式，与 Tailwind 协同使用
- **Vue / React / Svelte** 三种 UI 框架开箱即用
- **SEO 友好**：自动生成 sitemap、RSS、Open Graph / Twitter Card
- **图片优化**：Astro Assets (Sharp) + Unpic CDN 双通道
- **博客系统**：MD/MDX 支持，分类/标签过滤，分页，阅读时间，社交分享
- **博客评论**：支持嵌套回复、审核、邮件通知
- **View Transitions**：SPA 风格页面切换动画
- **FastAPI 后端**：联系表单、评论管理、活动报名、内容管理、文件上传、站内搜索、页面统计
- **PostgreSQL 数据库**：asyncpg 异步连接池，自动建表迁移
- **DaisyUI + KaTeX**：组件库与数学公式渲染
- **多部署支持**：Vercel（前端静态 + 后端 Serverless）、Docker

---

## 快速开始

> 需要 **Node.js >= 22.12.0**、**Python >= 3.11**、**PostgreSQL**

### 前端

```shell
git clone <repo-url>
cd LKM-official-website

# 使用 pnpm（项目 packageManager 指定）
pnpm install
pnpm run dev
```

访问 `http://localhost:4321`。

### 后端

```shell
cd backend
uv venv
uv pip install -r requirements.txt
```

确保 PostgreSQL 运行且创建了 `lkm` 数据库：

```shell
createdb lkm
```

配置环境变量（可选，默认值见 `backend/models/database.py`）：

| 环境变量        | 默认值                 | 说明                |
| :-------------- | :--------------------- | :------------------ |
| `PG_HOST`       | `localhost`            | PostgreSQL 主机地址 |
| `PG_PORT`       | `5432`                 | PostgreSQL 端口     |
| `PG_DATABASE`   | `lkm`                  | 数据库名            |
| `PG_USER`       | `lkm`                  | 数据库用户          |
| `PG_PASSWORD`   | `lkm123`               | 数据库密码          |
| `ADMIN_API_KEY` | `lkm-admin-secret-key` | 管理员 API 密钥     |

启动开发服务器并测试：

```shell
uv run uvicorn main:app --reload --port 8000  # 启动后端
uv run python test_db.py                      # 测试数据库连接
```

访问 `http://localhost:8000/docs` 查看 Swagger API 文档。

### 一键启动

项目提供了 Windows 和 Linux 的一键部署脚本：

**Windows (开发模式):**

```bat
.\deploy.bat
```

**Linux (开发模式):**

```bash
./deploy.sh
```

**Linux (生产构建):**

```bash
./deploy-prod.sh
```

脚本会自动完成：环境检测 → 安装依赖 → 数据库准备 → 启动前后端。Linux 生产脚本额外构建前端静态文件并通过 nginx（或 Python HTTP server）托管。

自定义端口和数据库连接：

```bash
FRONTEND_PORT=3000 BACKEND_PORT=9000 ./deploy.sh
PG_HOST=192.168.1.100 PG_PASSWORD=secret ./deploy.sh
```

---

## 命令

### 前端

| 命令               | 说明                            |
| :----------------- | :------------------------------ |
| `pnpm install`     | 安装依赖                        |
| `pnpm run dev`     | 启动开发服务器 `localhost:4321` |
| `pnpm run build`   | 生产构建，输出到 `./dist/`      |
| `pnpm run preview` | 本地预览生产构建                |
| `pnpm run check`   | 类型检查 + ESLint + Prettier    |
| `pnpm run fix`     | 自动修复 ESLint + Prettier      |

### 后端

| 命令                                               | 说明                 |
| :------------------------------------------------- | :------------------- |
| `cd backend && uv venv`                            | 创建 Python 虚拟环境 |
| `cd backend && uv pip install -r requirements.txt` | 安装依赖             |
| `cd backend && uv run uvicorn main:app --reload`   | 启动开发服务器       |
| `cd backend && uv run python test_db.py`           | 测试数据库连接       |

---

## 项目结构

```
/
├── api/                          # Vercel Serverless 入口
│   └── index.py                  # 导入 FastAPI app
├── backend/                      # FastAPI 后端
│   ├── main.py                   # 应用入口、中间件、路由注册
│   ├── requirements.txt          # Python 依赖
│   ├── test_db.py                # 数据库连接测试脚本
│   ├── models/
│   │   └── database.py           # asyncpg 连接池、自动建表
│   ├── routers/                  # API 路由（7 个模块）
│   │   ├── contact.py            # POST /api/contact
│   │   ├── comments.py           # CRUD /api/comments
│   │   ├── events.py             # CRUD /api/events + 报名
│   │   ├── content.py            # CRUD /api/content
│   │   ├── upload.py             # POST /api/upload
│   │   ├── search.py             # GET  /api/search
│   │   └── analytics.py          # GET  /api/analytics + POST pageview
│   └── services/
│       ├── search.py             # 全文搜索服务
│       └── analytics.py          # 页面统计服务
├── .github/workflows/            # CI/CD (GitHub Actions)
├── public/                       # 静态资源（robots.txt, _headers 等）
├── src/
│   ├── assets/
│   │   ├── favicons/             # 网站图标
│   │   ├── images/               # 本地图片（logo、默认 OG 图等）
│   │   └── styles/
│   │       └── tailwind.css      # Tailwind v4 入口：主题、工具类、插件
│   ├── components/
│   │   ├── blog/                 # 博客专用组件（10 个）
│   │   ├── common/               # 通用组件：Image、Metadata、Analytics 等（11 个）
│   │   ├── ui/                   # 基础 UI 组件：Button、Form、Headline 等（5 个）
│   │   └── widgets/              # 页面部件：Hero、Features、Footer 等（24 个）
│   ├── data/
│   │   └── post/                 # 博客文章（.md / .mdx）
│   ├── layouts/                  # 页面布局（5 个）
│   ├── pages/                    # 文件路由（21 个）
│   ├── utils/                    # 工具函数（6 个）
│   ├── config.yaml               # 站点主配置
│   ├── content.config.ts         # Astro 内容集合 Schema
│   ├── navigation.ts             # 导航数据结构
│   └── types.d.ts                # 全局 TypeScript 类型定义
├── vendor/integration/           # 自定义 Astro 集成（config.yaml 虚拟模块）
├── astro.config.ts               # Astro 框架配置
├── tsconfig.json                 # TypeScript 配置
├── vercel.json                   # Vercel 部署（前端 + 后端 Serverless）
├── Dockerfile                    # Docker 构建
├── docker-compose.yml            # Docker Compose
├── deploy.sh                     # Linux 一键部署（开发模式）
├── deploy.bat                    # Windows 一键部署（开发模式）
├── deploy-prod.sh                # Linux 生产构建部署（nginx 托管）
└── README.md
```

---

## 架构设计

### 层次结构

```
配置层                config.yaml → vendor/integration → astrowind:config 虚拟模块
  ↓
布局层                Layout → PageLayout / MarkdownLayout / LandingLayout / SidebarLayout
  ↓
页面层                src/pages/ (文件路由)
  ↓
Widget 层             src/components/widgets/ (Hero, Features, Pricing, Footer, Header...)
  ↓
UI 层                 src/components/ui/ (Button, Form, Headline, WidgetWrapper...)
  ↓
Common 层             src/components/common/ (Image, Metadata, Analytics, ToggleTheme...)
  ↓
数据层                src/data/post/ + src/utils/ (blog, permalinks, images, frontmatter)
```

### 布局说明

| 布局               | 文件                               | 用途          | 包含                                                              |
| :----------------- | :--------------------------------- | :------------ | :---------------------------------------------------------------- |
| **Layout**         | `src/layouts/Layout.astro`         | HTML 骨架     | `<html>`, `<head>`, SEO meta, favicon, 主题切换, view transitions |
| **PageLayout**     | `src/layouts/PageLayout.astro`     | 标准页面      | Header + `<main>` + Footer                                        |
| **MarkdownLayout** | `src/layouts/MarkdownLayout.astro` | Markdown 页面 | 标题 + prose 排版容器                                             |
| **LandingLayout**  | `src/layouts/LandingLayout.astro`  | 落地页        | 简化 Header + 内容                                                |
| **SidebarLayout**  | `src/layouts/SidebarLayout.astro`  | 带侧边栏页面  | TopNav 顶栏 + Sidebar 侧边栏 + 内容区                             |

### 数据流

```
config.yaml ──→ vendor/integration ──→ astrowind:config (Vite 虚拟模块)
                                           ↓
                                    SITE, I18N, METADATA, UI, APP_BLOG, ANALYTICS
                                           ↓
                                    navigation.ts, 各页面/组件引用

src/data/post/*.md(x) ──→ content.config.ts (Zod schema) ──→ getCollection('post')
                                                                  ↓
                                                          src/utils/blog.ts (fetchPosts, 排序, 关联)
                                                                  ↓
                                                          博客页面路由
```

---

## 页面路由

| 路由                       | 文件                                         | 布局           |
| :------------------------- | :------------------------------------------- | :------------- |
| `/`                        | `pages/index.astro`                          | PageLayout     |
| `/about`                   | `pages/about.astro`                          | SidebarLayout  |
| `/services`                | `pages/services.astro`                       | SidebarLayout  |
| `/pricing`                 | `pages/pricing.astro`                        | SidebarLayout  |
| `/contact`                 | `pages/contact.astro`                        | SidebarLayout  |
| `/404`                     | `pages/404.astro`                            | PageLayout     |
| `/privacy`                 | `pages/privacy.md`                           | MarkdownLayout |
| `/terms`                   | `pages/terms.md`                             | MarkdownLayout |
| `/rss.xml`                 | `pages/rss.xml.ts`                           | —              |
| `/blog`                    | `pages/[...blog]/index.astro`                | PageLayout     |
| `/blog/<slug>`             | `pages/[...blog]/[...page].astro`            | PageLayout     |
| `/category/<name>`         | `pages/[...blog]/[category]/[...page].astro` | PageLayout     |
| `/tag/<name>`              | `pages/[...blog]/[tag]/[...page].astro`      | PageLayout     |
| `/homes/saas`              | `pages/homes/saas.astro`                     | PageLayout     |
| `/homes/startup`           | `pages/homes/startup.astro`                  | PageLayout     |
| `/homes/mobile-app`        | `pages/homes/mobile-app.astro`               | PageLayout     |
| `/homes/personal`          | `pages/homes/personal.astro`                 | PageLayout     |
| `/landing/sales`           | `pages/landing/sales.astro`                  | LandingLayout  |
| `/landing/lead-generation` | `pages/landing/lead-generation.astro`        | LandingLayout  |
| `/landing/click-through`   | `pages/landing/click-through.astro`          | LandingLayout  |
| `/landing/pre-launch`      | `pages/landing/pre-launch.astro`             | LandingLayout  |
| `/landing/product`         | `pages/landing/product.astro`                | LandingLayout  |
| `/landing/subscription`    | `pages/landing/subscription.astro`           | LandingLayout  |

---

## 组件目录

### widgets/ — 页面部件 (24 个)

| 组件                         | 说明                                      |
| :--------------------------- | :---------------------------------------- |
| `Hero.astro`                 | 标准 Hero 区域（标题、副标题、CTA、大图） |
| `Hero2.astro`                | 替代 Hero 布局                            |
| `HeroText.astro`             | 纯文字 Hero（无图）                       |
| `Features.astro`             | 特性网格（图标+标题+描述）                |
| `Features2.astro`            | 特性布局变体 2                            |
| `Features3.astro`            | 特性布局变体 3（支持配图）                |
| `Content.astro`              | 图文内容区（支持左右排版）                |
| `Steps.astro`                | 步骤流程（带配图）                        |
| `Steps2.astro`               | 步骤流程变体                              |
| `Pricing.astro`              | 价格表（多套餐）                          |
| `FAQs.astro`                 | 常见问题折叠面板                          |
| `Stats.astro`                | 数据统计展示                              |
| `Testimonials.astro`         | 用户评价轮播                              |
| `CallToAction.astro`         | CTA 横幅                                  |
| `Header.astro`               | 全局导航栏（下拉菜单、搜索、主题切换）    |
| `Footer.astro`               | 全局页脚（链接、社交图标、版权）          |
| `Announcement.astro`         | 顶部公告栏                                |
| `Note.astro`                 | 提示/公告条                               |
| `Brands.astro`               | 品牌 Logo 展示                            |
| `Contact.astro`              | 联系表单区域                              |
| `BlogLatestPosts.astro`      | 最新博客文章网格                          |
| `BlogHighlightedPosts.astro` | 精选博客文章                              |
| `Sidebar.astro`              | 侧边栏导航（CSS Modules）                 |
| `TopNav.astro`               | 顶部分区标签栏                            |

### common/ — 通用组件 (11 个)

| 组件                      | 说明                                             |
| :------------------------ | :----------------------------------------------- |
| `Image.astro`             | 智能图片：本地→Sharp，远程CDN→Unpic，自动优化    |
| `Metadata.astro`          | SEO 元标签（title, OG, Twitter Card, canonical） |
| `CommonMeta.astro`        | 基础 meta 标签（charset, viewport）              |
| `Analytics.astro`         | Google Analytics 脚本                            |
| `SiteVerification.astro`  | Google Search Console 验证                       |
| `ToggleTheme.astro`       | 暗色/亮色模式切换按钮                            |
| `ToggleMenu.astro`        | 移动端菜单切换按钮                               |
| `SocialShare.astro`       | 社交分享按钮                                     |
| `BasicScripts.astro`      | 基础客户端脚本                                   |
| `ApplyColorMode.astro`    | 初始主题模式应用                                 |
| `SplitbeeAnalytics.astro` | Splitbee 分析                                    |

### ui/ — 基础 UI (5 个)

| 组件                  | 说明                                             |
| :-------------------- | :----------------------------------------------- |
| `Button.astro`        | 按钮（primary/secondary/tertiary/link 四种变体） |
| `Form.astro`          | 表单（input/textarea/checkbox + 提交）           |
| `Headline.astro`      | 标题块（tagline + title + subtitle）             |
| `Timeline.astro`      | 时间线布局                                       |
| `WidgetWrapper.astro` | Widget 通用容器（背景、间距、暗色模式）          |

### blog/ — 博客专用 (10 个)

| 组件                 | 说明            |
| :------------------- | :-------------- |
| `Grid.astro`         | 文章网格布局    |
| `GridItem.astro`     | 网格文章卡片    |
| `List.astro`         | 文章列表布局    |
| `ListItem.astro`     | 列表文章条目    |
| `SinglePost.astro`   | 单篇文章渲染    |
| `Headline.astro`     | 博客标题        |
| `Pagination.astro`   | 分页导航        |
| `RelatedPosts.astro` | 相关文章推荐    |
| `Tags.astro`         | 标签/分类筛选   |
| `ToBlogLink.astro`   | "返回博客" 链接 |

---

## 工具函数

| 文件                   | 关键导出                                                                                        | 说明                             |
| :--------------------- | :---------------------------------------------------------------------------------------------- | :------------------------------- |
| `utils/blog.ts`        | `fetchPosts`, `getStaticPathsBlog*`, `getRelatedPosts`, `getNormalizedPost`                     | 博客数据加载、排序、缓存、关联   |
| `utils/permalinks.ts`  | `getPermalink`, `getHomePermalink`, `getBlogPermalink`, `getAsset`, `getCanonical`, `cleanSlug` | URL 生成、slug 处理              |
| `utils/images.ts`      | `findImage`, `adaptOpenGraphImages`                                                             | 图片路径解析、OG 图片处理        |
| `utils/frontmatter.ts` | `readingTimeRemarkPlugin`, `responsiveTablesRehypePlugin`                                       | Markdown 阅读时间、响应式表格    |
| `utils/directories.ts` | `getProjectRootDir`, `getRelativeUrlByFilePath`                                                 | 目录工具                         |
| `utils/utils.ts`       | `getFormattedDate`, `trim`, `toUiAmount`                                                        | 日期格式化、字符串修剪、数字缩写 |

---

## 配置系统

### config.yaml 主配置

配置文件位于 `src/config.yaml`，通过 `vendor/integration/` 注入为 Vite 虚拟模块 `astrowind:config`，在代码中可直接导入：

```ts
import { SITE, I18N, METADATA, APP_BLOG, UI, ANALYTICS } from 'astrowind:config';
```

**站点配置：**

```yaml
site:
  name: 'LKM'
  site: 'https://lkm-official-website.vercel.app'
  base: '/' # 部署到 GitHub Pages 等子路径时修改
  trailingSlash: false # URL 末尾斜杠
  googleSiteVerificationId: null
```

**SEO 元数据：**

```yaml
metadata:
  title:
    default: 'LKM'
    template: '%s — LKM'
  description: '网站描述'
  robots:
    index: true
    follow: true
  openGraph:
    site_name: 'LKM'
    images:
      - url: '~/assets/images/default.png'
        width: 1200
        height: 628
    type: website
  twitter:
    handle: '@lkm'
    site: '@lkm'
    cardType: summary_large_image
```

**国际化：**

```yaml
i18n:
  language: zh-cn # HTML lang 属性
  textDirection: ltr # ltr / rtl
```

**博客：**

```yaml
apps:
  blog:
    isEnabled: true
    postsPerPage: 6
    post:
      isEnabled: true
      permalink: '/%slug%' # 支持 %slug%, %year%, %month%, %day%, %category%
      robots:
        index: true
    list:
      isEnabled: true
      pathname: 'blog'
      robots:
        index: true
    category:
      isEnabled: true
      pathname: 'category'
      robots:
        index: true
    tag:
      isEnabled: true
      pathname: 'tag'
      robots:
        index: false
    isRelatedPostsEnabled: true
    relatedPostsCount: 4
```

**主题模式：**

```yaml
ui:
  theme: 'system' # system | light | dark | light:only | dark:only
```

**分析：**

```yaml
analytics:
  vendors:
    googleAnalytics:
      id: null # 填入 "G-XXXXXXXXXX" 启用
```

### 导航配置

`src/navigation.ts` 导出 `headerData` 和 `footerData`：

```ts
export const headerData = {
  links: [
    { text: 'Pages', links: [...] },  // 下拉菜单组
    { text: 'Blog', links: [...] },
    ...
  ],
  actions: [{ text: 'Download', href: '...' }],
};

export const footerData = {
  links: [...],           // 页脚链接列
  secondaryLinks: [...],  // 次级链接（条款、隐私）
  socialLinks: [...],     // 社交图标
  footNote: '...',        // 版权信息
};
```

`getPermalink()` 和 `getAsset()` 用于自动生成正确的 URL。

---

## 后端 API

后端使用 **FastAPI**，部署在 Vercel Serverless 函数中（`api/index.py`），通过 `vercel.json` 将所有 `/api/*` 请求 rewrite 到该函数。

### API 端点

| 方法   | 路径                        | 说明                              |
| :----- | :-------------------------- | :-------------------------------- |
| `GET`  | `/api/health`               | 健康检查                          |
| `POST` | `/api/contact`              | 提交联系表单                      |
| `GET`  | `/api/comments`             | 获取评论列表（按 post_slug）      |
| `POST` | `/api/comments`             | 提交评论（支持嵌套回复）          |
| `GET`  | `/api/events`               | 获取活动列表                      |
| `GET`  | `/api/events/{id}`          | 获取活动详情                      |
| `POST` | `/api/events/{id}/register` | 活动报名                          |
| `GET`  | `/api/content`              | 获取内容页面列表                  |
| `GET`  | `/api/content/{slug}`       | 获取单个内容页面                  |
| `PUT`  | `/api/content/{slug}`       | 创建/更新内容页面（需 admin key） |
| `POST` | `/api/upload`               | 文件上传（需 admin key）          |
| `GET`  | `/api/upload/{filename}`    | 下载已上传文件                    |
| `GET`  | `/api/upload`               | 文件列表（需 admin key）          |
| `GET`  | `/api/search`               | 站内全文搜索                      |
| `POST` | `/api/analytics/track`      | 记录页面访问                      |
| `GET`  | `/api/analytics/stats`      | 获取访问统计（需 admin key）      |

### 数据库表

| 表名                  | 用途                 |
| :-------------------- | :------------------- |
| `contacts`            | 联系表单提交记录     |
| `comments`            | 博客评论（支持嵌套） |
| `events`              | 活动/讲座信息        |
| `event_registrations` | 活动报名记录         |
| `contents`            | 动态内容页面         |
| `uploads`             | 上传文件记录         |
| `page_views`          | 页面访问统计         |

所有表在应用启动时通过 `init_db()` 自动创建（`CREATE TABLE IF NOT EXISTS`），无需手动迁移。

连接池支持自动重试（最多 5 次），min_size=1、max_size=10。生产环境（Vercel）需配置环境变量指向云 PostgreSQL 实例。管理员 API 受 `ADMIN_API_KEY` 保护。

### 搜索

`GET /api/search?q=关键词` 使用 PostgreSQL `pg_trgm` 扩展（`ILIKE` + `similarity()`），在 `contents` 和 `events` 两张表中进行模糊匹配，按相关度排序返回。

---

## 样式系统

### Tailwind CSS v4

主入口：`src/assets/styles/tailwind.css`

```css
@import 'tailwindcss';
@plugin '@tailwindcss/typography';

/* 自定义变体 */
@custom-variant dark (&:where(.dark, .dark *));

/* 主题变量 */
@theme {
  --color-primary: ...;
  --font-heading: ...;
}

/* 自定义工具类 */
@utility bg-page { ... }
@utility text-muted { ... }
@utility btn { ... }
@utility btn-primary { ... }
```

### CSS Modules

`.module.css` 文件自动局部作用域化。在 `.astro` 组件中使用：

```astro
---
import styles from './Component.module.css';
---

<div class={styles.myClass}>...</div>
```

必需在 CSS Module 文件顶部添加 `@reference "tailwindcss"` 以使用 `@apply`：

```css
@reference "tailwindcss";

.myClass {
  @apply flex items-center gap-2;
}
```

关键样式文件：

| 文件                                        | 说明                                           |
| :------------------------------------------ | :--------------------------------------------- |
| `src/assets/styles/tailwind.css`            | Tailwind 入口：`@theme`、`@utility`、`@plugin` |
| `src/components/CustomStyles.astro`         | CSS 自定义属性（颜色、字体）                   |
| `src/components/widgets/Hero.module.css`    | CSS Modules 示例                               |
| `src/components/widgets/Sidebar.module.css` | 侧边栏 CSS Module                              |

---

## 内容管理

### 添加博客文章

在 `src/data/post/` 下创建 `.md` 或 `.mdx` 文件：

```md
---
publishDate: 2025-01-15T00:00:00Z
title: My Blog Post
excerpt: A brief summary of the post.
tags:
  - web
  - tutorial
category: tutorials
author: Author Name
image: ~/assets/images/cover.jpg
---

## Introduction

Your content here...
```

Schema 验证由 `src/content.config.ts` 提供（Zod），`src/utils/blog.ts` 负责加载、排序和关联。

---

## 构建部署

```shell
pnpm run build     # 前端静态构建，输出到 ./dist/
cd backend && uv run uvicorn main:app --host 0.0.0.0 --port 8000  # 启动后端
```

### 部署方式

| 平台         | 说明                                                       |
| :----------- | :--------------------------------------------------------- |
| **Vercel**   | 前端静态托管 + 后端 Serverless（`vercel.json` 已配置）     |
| **Docker**   | `Dockerfile` + `docker-compose.yml`（前端 nginx 静态托管） |
| **Netlify**  | `netlify.toml` 已提供（仅前端静态）                        |
| **任意托管** | 上传 `dist/` 目录即可（前端），后端需单独部署              |

> Vercel 部署时需在项目设置中配置数据库环境变量（`PG_HOST`、`PG_PORT` 等），指向云 PostgreSQL 实例。

---

## 已完成的定制化修改

以下是基于原 AstroWind 模板做的改进：

### 后端

- **FastAPI 后端** — 完整的 REST API：联系表单、评论（嵌套回复）、活动报名、内容管理、文件上传、站内搜索（pg_trgm）、页面统计
- **PostgreSQL 数据库** — 7 张业务表，asyncpg 异步连接池，启动自动建表，连接重试 5 次
- **Vercel Serverless 部署** — `api/index.py` 入口，`vercel.json` 路由 rewrite，统一 `/api/*` 分发
- **数据库测试脚本** — `backend/test_db.py`，一键测试连接、建表、CRUD
- **搜索服务** — 基于 PostgreSQL `pg_trgm` 的模糊全文搜索，ILIKE + similarity 双路匹配

### 部署脚本

- **Windows** `deploy.bat` — 环境检测 → 安装依赖 → 数据库 → 启动前后端
- **Linux** `deploy.sh` — 同上，支持环境变量自定义端口和数据库
- **Linux 生产** `deploy-prod.sh` — 前端静态构建 + nginx 托管 + API 代理

### 站点配置

- 站点名称、SEO 元数据、Open Graph、Twitter Card、favicon 替换为 LKM 实际内容
- 国际化语言设为 `zh-cn`，页脚/版权信息本地化

### UI 框架

- 内置 `@astrojs/vue`、`@astrojs/react`、`@astrojs/svelte` 三种框架
- 可在 `src/components/` 下创建 `.vue` / `.jsx` / `.tsx` / `.svelte` 组件

### 组件扩展

- **DaisyUI** — Tailwind 组件库（按钮、卡片、模态框等主题化组件）
- **KaTeX + remark-math + rehype-katex** — LaTeX 数学公式渲染，支持行内/块级
- **Timeline** — `ui/Timeline.astro` 时间线布局组件
- **Comments** — `blog/Comments.astro` 博客评论组件（前端 JS + 后端 API 对接）

### CSS Modules

- `src/components/widgets/Hero.module.css`、`Sidebar.module.css`
- 须在 `.module.css` 文件顶部添加 `@reference "tailwindcss"` 以使用 `@apply`
- 自定义 `@utility`（如 `text-muted`、`text-primary`）在 CSS Module 中不可用，需保留在模板 class 字符串中

### 侧边栏 + 全局顶栏

- `SidebarLayout.astro` — 带侧边栏的页面布局
- `Sidebar.astro` + `Sidebar.module.css` — 侧边栏导航组件（CSS Modules）
- `TopNav.astro` — 顶部分区标签栏
- 应用于 `/about`、`/services`、`/pricing`、`/contact`

### 联系表单

- `Form.astro` 配置 `method="POST" action="/api/contact"`
- 客户端 JS 增强：提交状态提示、错误处理、防重复提交

### 页面分析与权限

- `Analytics.astro` 集成了 Google Analytics + 自定义后端埋点（`/api/analytics/track`）
- 后端管理端点通过 `ADMIN_API_KEY` 环境变量鉴权

### 代码质量

- `.prettierrc.mjs` + `eslint.config.js` + `astro check` 三层质量保障
- 修复所有 TypeScript strict 类型错误（`Comments.astro`、`Form.astro`、`Analytics.astro`、`Section.astro` 等）
- `package.json` 使用 `pnpm` 包管理，name 字段改为 `lkm-official-website`
