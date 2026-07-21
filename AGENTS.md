# AstroWind Agent 指令

## 项目概述

AstroWind 是一个免费、开源的网站模板，基于 **Astro v6** 和 **Tailwind CSS v4** 构建。它生成完全静态的站点，针对性能、SEO 和无障碍访问进行了优化。

**技术栈：** Astro v6 | Tailwind CSS v4 | TypeScript 5.9 | MDX | Sharp

## 快速参考

| 命令               | 用途                                 |
| ------------------ | ------------------------------------ |
| `pnpm run dev`     | 启动开发服务器（localhost:4321）     |
| `pnpm run build`   | 生产构建到 `./dist/`                 |
| `pnpm run preview` | 本地预览生产构建                     |
| `pnpm run check`   | 运行 astro check + ESLint + Prettier |
| `pnpm run fix`     | 自动修复 ESLint + Prettier 问题      |

**Node.js 要求：** >= 24.0.0

## 架构

### 目录结构

```
src/
  styles/tailwind.css        # Tailwind v4 配置（主题、自定义工具类、插件）
  components/
    common/        # 共享组件：Image, Metadata, Analytics, ToggleTheme
    ui/            # 基础组件：Button, Headline, WidgetWrapper, ItemGrid
    widgets/       # 页面部件：Hero, Features, Pricing, Header, Footer
    blog/          # 博客组件：SinglePost, List, Pagination, Tags
    background/    # 背景切换器、Canvas 和交互式背景组件
    CustomStyles.astro  # 颜色和字体的 CSS 变量
  content.config.ts    # 内容集合 Schema（Astro v6 位置）
  content/             # 内容文件：post/、docs/（.md、.mdx）
  integrations/        # 自定义 Astro 集成（配置加载）
  layouts/             # Layout.astro, PageLayout.astro, MarkdownLayout.astro
  pages/               # 文件路由
  utils/               # blog.ts, images.ts, permalinks.ts, frontmatter.ts
  config.yaml          # 站点配置（作为虚拟模块加载）
  navigation.ts        # 导航结构
  types.d.ts           # TypeScript 类型定义
```

### 路径别名

使用 `~/` 从 `src/` 导入：

```typescript
import Image from '~/components/common/Image.astro';
import { SITE } from 'astrowind:config';
```

### 配置系统

站点配置在 `src/config.yaml` 中，由 `src/integrations/` 中的自定义集成作为 Vite 虚拟模块 `astrowind:config` 加载。导出项：`SITE`、`I18N`、`METADATA`、`APP_BLOG`、`UI`、`ANALYTICS`。

## Tailwind CSS v4

配置以 CSS 优先，入口文件 `src/styles/tailwind.css`：

- **主题令牌：** `@theme { --color-primary: var(--aw-color-primary); ... }`
- **自定义工具类：** `@utility bg-page { ... }`
- **暗色模式：** 通过 `@variant dark (&:where(.dark, .dark *))` 实现基于类的暗色模式
- **插件：** `@plugin "@tailwindcss/typography"`
- **自定义变体：** `@custom-variant intersect (&:not([no-intersect]))`

颜色和字体的 CSS 变量在 `src/components/CustomStyles.astro` 中定义，带明暗主题变体。

Vite 插件 `@tailwindcss/vite` 在 `astro.config.ts` 中配置（而非作为 Astro 集成）。

### 类合并

组件使用 `tailwind-merge` v3 的 `twMerge` 进行条件类组合。

## 内容集合

在 `src/content.config.ts` 中通过 Astro v6 Content Layer API 的 `glob()` 加载器定义。文章位于 `src/content/post/`，使用 `.md` 或 `.mdx` 格式。

文章 frontmatter 字段：`title`（必填）、`publishDate`、`updateDate`、`draft`、`excerpt`、`image`、`category`、`tags`、`author`、`metadata`。

## 组件模式

- Props 继承自 `~/types` 中的接口
- 使用 `class:list` 进行条件样式绑定
- 接收 `className` 覆写时使用 `twMerge()` 合并
- 布局组合使用具名插槽（named slots）
- Widget 组件接受标准化 props（参见 `~/types`）

## 图片处理

`src/components/common/Image.astro` 支持：

- 本地图片通过 `astro:assets`（由 Sharp 优化）
- 远程图片通过 Unpic CDN
- 允许的域名（用于 Unpic 无法检测的提供商，由 Sharp 处理）：`cdn.pixabay.com`

Hero 图片使用 `loading="eager"` 和 `fetchpriority="high"`。

## 验证检查清单

修改代码后，务必验证：

1. `pnpm run build` 构建成功
2. `pnpm run check` 通过（astro check + ESLint + Prettier）
3. 浏览器视觉检查：首页、博客、暗色模式、移动端菜单
