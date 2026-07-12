# Astro 官方模板 — 分类索引

> 素材位于 `reference/astro-templates/`(不入 git)。本文件按能力归类,便于从官方模板中挑选可复用的组件 / 布局 / 样式,集成进 LKM 官网。
>
> 来源:`withastro/astro` 的 `examples/`(24 个)+ `withastro/starlight` 的 `examples/`(basics / markdoc / tailwind)。
> 路径前缀:examples 模板为 `examples/<模板>/`,Starlight 为 `starlight/<模板>/`。

---

## 1. 布局 (Layouts)

- basics → `examples/basics/src/layouts/Layout.astro` — 最简 HTML 骨架布局。
- blog → `examples/blog/src/layouts/BlogPost.astro` — 文章详情页布局(标题/日期/封面/正文插槽)。
- portfolio → `examples/portfolio/src/layouts/BaseLayout.astro` — 含导航+页脚的站点级基础布局。
- starlog → `examples/starlog/src/layouts/IndexLayout.astro`、`PostLayout.astro` — 首页与发布日志详情两套布局。
- with-tailwindcss → `examples/with-tailwindcss/src/layouts/main.astro` — Tailwind 版最简主布局。
- advanced-routing → `examples/advanced-routing/src/layouts/Layout.astro` — 配合多路由/i18n 的布局。

## 2. UI 组件 (Components)

- **导航 / 页头页脚**
  - portfolio → `examples/portfolio/src/components/Nav.astro`、`Footer.astro`、`MainHead.astro` — 完整导航栏、页脚、head。
  - blog → `examples/blog/src/components/Header.astro`、`Footer.astro`、`HeaderLink.astro`、`BaseHead.astro` — 博客页头/页脚/带 active 态的导航链接/SEO head。
  - starlog → `examples/starlog/src/components/Header.astro`、`Footer.astro`、`SEO.astro` — 页头/页脚/SEO 组件。
- **卡片 / 展示**
  - portfolio → `examples/portfolio/src/components/PortfolioPreview.astro`、`Grid.astro`、`Hero.astro`、`Pill.astro`、`Skills.astro` — 作品预览卡、栅格、Hero、标签胶囊、技能区。
  - portfolio → `examples/portfolio/src/components/CallToAction.astro`、`ContactCTA.astro` — CTA 按钮/联系区块。
- **按钮 / 图标 / 主题**
  - with-tailwindcss → `examples/with-tailwindcss/src/components/Button.astro` — Tailwind 按钮组件。
  - portfolio → `examples/portfolio/src/components/Icon.astro` + `IconPaths.ts` — SVG 图标系统。
  - portfolio → `examples/portfolio/src/components/ThemeToggle.astro` — 明暗主题切换按钮。
- **工具组件**
  - blog / starlog → `examples/blog/src/components/FormattedDate.astro`(starlog 同名)— 日期格式化。
- **React / 框架交互组件**
  - framework-react → `examples/framework-react/src/components/Counter.tsx` + `Counter.css` — React 交互组件示例(可参考 LKM 现有 React 用法)。
  - with-mdx → `examples/with-mdx/src/components/Counter.jsx`、`Title.astro` — MDX 中嵌入组件。
- **电商 / 交互(Svelte)**
  - ssr → `examples/ssr/src/components/AddToCart.svelte`、`Cart.svelte`、`ProductListing.astro`、`Header.astro` — 购物车/商品列表交互组件。

## 3. 页面 / 路由模式 (Pages & Routing)

- blog → `examples/blog/src/pages/blog/[...slug].astro`、`blog/index.astro` — 动态文章路由 + 列表页。
- blog → `examples/blog/src/pages/rss.xml.js` — RSS feed 生成。
- portfolio → `examples/portfolio/src/pages/work/[...slug].astro`、`work.astro`、`404.astro` — 作品动态路由、列表、404 页。
- starlog → `examples/starlog/src/pages/releases/[slug].astro` — 动态发布日志路由。
- advanced-routing → `examples/advanced-routing/src/pages/`(`dashboard/`、`es/`、`login.astro`、`old-dashboard.astro`)— i18n、重定向、鉴权重定向等进阶路由;`src/actions/index.ts` 为 Astro Actions 示例。
- ssr → `examples/ssr/src/pages/api/`(`cart.ts`、`products.ts`、`products/[id].ts`)— API 路由端点;`login.form.ts` 表单 action。

## 4. 内容集合 (Content Collections)

- blog → `examples/blog/src/content.config.ts` + `content/blog/*.md(x)` — 博客集合 schema(标题/日期/描述/封面)+ markdown & mdx 混排样例。
- portfolio → `examples/portfolio/src/content.config.ts` + `content/work/**` — 作品集合(含嵌套目录 `nested/`)。
- starlog → `examples/starlog/src/content.config.ts` + `content/releases/*.md` — 发布日志集合。
- starlight/tailwind → `starlight/tailwind/src/content.config.ts` + `content/docs/**` — Starlight 文档集合(guides/reference 分组,md + mdx)。

## 5. 样式方案 (Styling)

- **Tailwind**
  - with-tailwindcss → `examples/with-tailwindcss/src/styles/global.css` — Tailwind 全局入口(可对照 LKM 的 Tailwind v4 配置)。
  - starlight/tailwind → `starlight/tailwind/src/styles/global.css` — Starlight + Tailwind 集成样式。
- **原生 CSS**
  - blog → `examples/blog/src/styles/global.css` — 博客全局样式 + 本地字体(`assets/fonts/atkinson-*.woff`)。
  - portfolio → `examples/portfolio/src/styles/global.css` — 含明暗主题变量的全局样式。
  - framework-react → `examples/framework-react/src/components/Counter.css` — 组件级 CSS。
- **SCSS**
  - starlog → `examples/starlog/src/styles/`(`colors.scss`、`global.scss`、`layout.scss`、`type.scss`)— 分层 SCSS 体系(色板/全局/布局/字体),适合参考设计系统拆分。
- **主题切换**
  - portfolio → `ThemeToggle.astro` + `styles/global.css` 里的 CSS 变量 — 明暗主题实现参考。

## 6. 集成与配置 (Integrations & Config)

- with-tailwindcss → `examples/with-tailwindcss/astro.config.mjs` — Tailwind 集成配置。
- with-mdx → `examples/with-mdx/astro.config.mjs` + `pages/index.mdx` — MDX 集成。
- with-markdoc → `examples/with-markdoc/astro.config.mjs` — Markdoc 集成。
- framework-react → `examples/framework-react/astro.config.mjs` — React 集成(对照 LKM 现有 React 配置)。
- ssr → `examples/ssr/astro.config.mjs` — SSR / adapter 配置;`src/models/`、`api.ts` 服务端数据层示例。
- advanced-routing → `examples/advanced-routing/astro.config.mjs` — i18n / 路由相关配置。
- starlog → `examples/starlog/astro.config.mjs` — SCSS 集成配置。
- 各模板 `tsconfig.json` — TypeScript 基础配置参考。

---

## 其他模板速览(未逐项拆解,按需翻阅)

- `examples/minimal` — 空壳起步模板。
- `examples/component` — 发布可复用组件包的模板。
- `examples/integration` — 开发 Astro 集成(integration)的模板。
- `examples/toolbar-app` — 开发 Dev Toolbar 应用的模板。
- `examples/hackernews` — HackerNews 克隆(SSR + fetch 综合示例)。
- `examples/framework-{alpine,preact,solid,svelte,vue,multiple}` — 各前端框架接入示例。
- `examples/with-{nanostores,vitest}`、`container-with-vitest` — 状态管理 / 测试集成示例。
- `starlight/basics`、`starlight/markdoc` — Starlight 文档站基础版 / Markdoc 版。
