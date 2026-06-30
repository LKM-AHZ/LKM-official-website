# LKM Official Website

理科迷 (LKM) 官方网站 — 基于 **[AstroWind](https://github.com/arthelokyo/astrowind)** 模板构建，采用 **[Astro v6](https://astro.build/) + [Tailwind CSS v4](https://tailwindcss.com/)** 纯静态站点。

---

## 特性

- **Astro v6 静态站点生成**，PageSpeed Insights 评分优秀
- **Tailwind CSS v4**，CSS-first 配置，支持暗色模式
- **CSS Modules** 局部作用域样式，与 Tailwind 协同使用
- **Vue / React** UI 框架支持
- **SEO 友好**：自动生成 sitemap、RSS、Open Graph / Twitter Card
- **图片优化**：Astro Assets (Sharp) + Unpic CDN 双通道
- **博客系统**：MD/MDX 支持，分类/标签过滤，分页，阅读时间，社交分享
- **View Transitions**：SPA 风格页面切换动画
- **DaisyUI + KaTeX**：组件库与数学公式渲染
- **多平台部署**：Vercel、Netlify、任意静态托管

---

## 快速开始

> 需要 **Node.js >= 22.12.0**

### 安装 Node.js & pnpm

**Windows：**

```powershell
# 方式一：官方安装包
# 下载 https://nodejs.org/ 安装 LTS 版（>= 22.12.0）

# 方式二：使用 winget
winget install OpenJS.NodeJS.LTS

# 安装完成后启用 pnpm
corepack enable
corepack prepare pnpm@latest --activate
```

**Linux (Debian/Ubuntu)：**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

corepack enable
corepack prepare pnpm@latest --activate
```

**macOS：**

```bash
brew install node@22 pnpm

# 或使用 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22
nvm use 22
corepack enable
corepack prepare pnpm@latest --activate
```

验证安装：

```bash
node -v   # >= v22.12.0
pnpm -v   # >= 11.0.0
```

### 克隆并启动

```shell
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
| `pnpm install`     | 安装依赖                        |
| `pnpm run dev`     | 启动开发服务器 `localhost:4321` |
| `pnpm run build`   | 生产构建，输出到 `./dist/`      |
| `pnpm run preview` | 本地预览生产构建                |
| `pnpm run check`   | 类型检查 + ESLint + Prettier    |
| `pnpm run fix`     | 自动修复 ESLint + Prettier      |

---

## 项目结构

```
/
├── .github/workflows/            # CI/CD (GitHub Actions)
├── public/                       # 静态资源（robots.txt, _headers 等）
├── src/
│   ├── assets/
│   │   ├── favicons/             # 网站图标
│   │   ├── images/               # 本地图片（logo、默认 OG 图等）
│   │   └── styles/
│   │       └── tailwind.css      # Tailwind v4 入口：主题、工具类、插件
│   ├── components/
│   │   ├── blog/                 # 博客专用组件
│   │   ├── common/               # 通用组件：Image、Metadata、Analytics 等
│   │   ├── ui/                   # 基础 UI 组件：Button、Form、Headline 等
│   │   └── widgets/              # 页面部件：Hero、Features、Footer 等
│   ├── data/
│   │   └── post/                 # 博客文章（.md / .mdx）
│   ├── layouts/                  # 页面布局
│   ├── pages/                    # 文件路由
│   ├── utils/                    # 工具函数
│   ├── config.yaml               # 站点主配置
│   ├── content.config.ts         # Astro 内容集合 Schema
│   ├── navigation.ts             # 导航数据结构
│   └── types.d.ts                # 全局 TypeScript 类型定义
├── vendor/integration/           # 自定义 Astro 集成（config.yaml 虚拟模块）
├── astro.config.ts               # Astro 框架配置
├── tsconfig.json                 # TypeScript 配置
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

| 布局               | 文件                               | 用途          |
| :----------------- | :--------------------------------- | :------------ |
| **Layout**         | `src/layouts/Layout.astro`         | HTML 骨架     |
| **PageLayout**     | `src/layouts/PageLayout.astro`     | 标准页面      |
| **MarkdownLayout** | `src/layouts/MarkdownLayout.astro` | Markdown 页面 |
| **LandingLayout**  | `src/layouts/LandingLayout.astro`  | 落地页        |
| **SidebarLayout**  | `src/layouts/SidebarLayout.astro`  | 带侧边栏页面  |

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

### widgets/ — 页面部件

| 组件                         | 说明                       |
| :--------------------------- | :------------------------- |
| `Hero.astro`                 | 标准 Hero 区域             |
| `Hero2.astro`                | 替代 Hero 布局             |
| `HeroText.astro`             | 纯文字 Hero（无图）        |
| `Features.astro`             | 特性网格（图标+标题+描述） |
| `Features2.astro`            | 特性布局变体 2             |
| `Features3.astro`            | 特性布局变体 3（支持配图） |
| `Content.astro`              | 图文内容区（支持左右排版） |
| `Steps.astro`                | 步骤流程（带配图）         |
| `Steps2.astro`               | 步骤流程变体               |
| `Pricing.astro`              | 价格表（多套餐）           |
| `FAQs.astro`                 | 常见问题折叠面板           |
| `Stats.astro`                | 数据统计展示               |
| `Testimonials.astro`         | 用户评价轮播               |
| `CallToAction.astro`         | CTA 横幅                   |
| `Header.astro`               | 全局导航栏                 |
| `Footer.astro`               | 全局页脚                   |
| `Announcement.astro`         | 顶部公告栏                 |
| `Note.astro`                 | 提示/公告条                |
| `Brands.astro`               | 品牌 Logo 展示             |
| `Contact.astro`              | 联系表单区域               |
| `BlogLatestPosts.astro`      | 最新博客文章网格           |
| `BlogHighlightedPosts.astro` | 精选博客文章               |
| `Sidebar.astro`              | 侧边栏导航                 |
| `TopNav.astro`               | 顶部分区标签栏             |

### common/ — 通用组件

| 组件                      | 说明                                |
| :------------------------ | :---------------------------------- |
| `Image.astro`             | 智能图片：本地→Sharp，远程CDN→Unpic |
| `Metadata.astro`          | SEO 元标签                          |
| `CommonMeta.astro`        | 基础 meta 标签                      |
| `Analytics.astro`         | Google Analytics 脚本               |
| `SiteVerification.astro`  | Google Search Console 验证          |
| `ToggleTheme.astro`       | 暗色/亮色模式切换按钮               |
| `ToggleMenu.astro`        | 移动端菜单切换按钮                  |
| `SocialShare.astro`       | 社交分享按钮                        |
| `BasicScripts.astro`      | 基础客户端脚本                      |
| `ApplyColorMode.astro`    | 初始主题模式应用                    |
| `SplitbeeAnalytics.astro` | Splitbee 分析                       |

### ui/ — 基础 UI

| 组件                  | 说明                                             |
| :-------------------- | :----------------------------------------------- |
| `Button.astro`        | 按钮（primary/secondary/tertiary/link 四种变体） |
| `Form.astro`          | 表单（静态展示，input/textarea/checkbox）        |
| `Headline.astro`      | 标题块（tagline + title + subtitle）             |
| `Timeline.astro`      | 时间线布局                                       |
| `WidgetWrapper.astro` | Widget 通用容器                                  |

### blog/ — 博客专用

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

| 文件                   | 关键导出                                                           | 说明                          |
| :--------------------- | :----------------------------------------------------------------- | :---------------------------- |
| `utils/blog.ts`        | `fetchPosts`, `getStaticPathsBlog*`, `getRelatedPosts`             | 博客数据加载、排序、关联      |
| `utils/permalinks.ts`  | `getPermalink`, `getHomePermalink`, `getBlogPermalink`, `getAsset` | URL 生成、slug 处理           |
| `utils/images.ts`      | `findImage`, `adaptOpenGraphImages`                                | 图片路径解析、OG 图片处理     |
| `utils/frontmatter.ts` | `readingTimeRemarkPlugin`, `responsiveTablesRehypePlugin`          | Markdown 阅读时间、响应式表格 |
| `utils/directories.ts` | `getProjectRootDir`, `getRelativeUrlByFilePath`                    | 目录工具                      |
| `utils/utils.ts`       | `getFormattedDate`, `trim`, `toUiAmount`                           | 日期格式化、字符串处理        |

---

## 配置系统

### config.yaml 主配置

配置文件位于 `src/config.yaml`，通过 `vendor/integration/` 注入为 Vite 虚拟模块 `astrowind:config`：

```ts
import { SITE, I18N, METADATA, APP_BLOG, UI, ANALYTICS } from 'astrowind:config';
```

**站点配置：**

```yaml
site:
  name: 'LKM'
  site: 'https://lkm-official-website.vercel.app'
  base: '/'
  trailingSlash: false
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
```

**国际化：**

```yaml
i18n:
  language: zh-cn
  textDirection: ltr
```

**博客：**

```yaml
apps:
  blog:
    isEnabled: true
    postsPerPage: 6
    post:
      isEnabled: true
      permalink: '/%slug%'
    list:
      isEnabled: true
      pathname: 'blog'
    category:
      isEnabled: true
      pathname: 'category'
    tag:
      isEnabled: true
      pathname: 'tag'
    isRelatedPostsEnabled: true
    relatedPostsCount: 4
```

**主题与分析：**

```yaml
ui:
  theme: 'system'

analytics:
  vendors:
    googleAnalytics:
      id: null # 填入 "G-XXXXXXXXXX" 启用
```

### 导航配置

`src/navigation.ts` 导出 `headerData` 和 `footerData`。使用 `getPermalink()` 和 `getAsset()` 自动生成正确 URL。

---

## 样式系统

### Tailwind CSS v4

主入口：`src/assets/styles/tailwind.css`

```css
@import 'tailwindcss';
@plugin '@tailwindcss/typography';

@custom-variant dark (&:where(.dark, .dark *));

@theme {
  --color-primary: ...;
  --font-heading: ...;
}

@utility bg-page { ... }
@utility text-muted { ... }
@utility btn { ... }
@utility btn-primary { ... }
```

### CSS Modules

`.module.css` 文件自动局部作用域化。需在顶部添加 `@reference "tailwindcss"` 以使用 `@apply`：

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
pnpm run build   # 构建静态文件到 ./dist/
```

### 部署方式

| 平台         | 说明                          |
| :----------- | :---------------------------- |
| **Vercel**   | 静态托管，直接部署 `dist/`    |
| **Netlify**  | 静态托管，使用 `netlify.toml` |
| **任意托管** | 上传 `dist/` 目录即可         |

---

## 已完成的定制化修改

以下是基于原 AstroWind 模板做的改进：

### 站点配置

- 站点名称、SEO 元数据、Open Graph、Twitter Card、favicon 替换为 LKM 实际内容
- 国际化语言设为 `zh-cn`，页脚/版权信息本地化

### UI 框架

- 内置 `@astrojs/vue`、`@astrojs/react` 两种框架
- 可在 `src/components/` 下创建 `.vue` / `.jsx` / `.tsx` 组件

### 组件扩展

- **DaisyUI** — Tailwind 组件库（按钮、卡片、模态框等主题化组件）
- **KaTeX + remark-math + rehype-katex** — LaTeX 数学公式渲染
- **Timeline** — `ui/Timeline.astro` 时间线布局组件

### CSS Modules

- `src/components/widgets/Hero.module.css`、`Sidebar.module.css`
- 须在 `.module.css` 文件顶部添加 `@reference "tailwindcss"` 以使用 `@apply`

### 侧边栏 + 全局顶栏

- `SidebarLayout.astro` — 带侧边栏的页面布局
- `Sidebar.astro` + `Sidebar.module.css` — 侧边栏导航组件（CSS Modules）
- `TopNav.astro` — 顶部分区标签栏
- 应用于 `/about`、`/services`、`/pricing`、`/contact`

### 联系表单

- `Form.astro` 提供静态展示表单，提交时提示用户通过其他方式联系

### 代码质量

- `.prettierrc.mjs` + `eslint.config.js` + `astro check` 三层质量保障
- `package.json` 使用 `pnpm` 包管理，name 字段改为 `lkm-official-website`
