# 开发文档

**AstroWind** 是一个免费开源网站模板，采用 **[Astro v6](https://astro.build/) + [Tailwind CSS v4](https://tailwindcss.com/) + CSS Modules** + **Vue / React / Svelte** 技术栈构建。开箱即用，遵循 Web 最佳实践。

- **生产就绪**，PageSpeed Insights 评分优秀。
- 集成 **Tailwind CSS v4**，支持 **暗色模式** 和 **_RTL_**。
- **快速且 SEO 友好的博客**：自动 **RSS 订阅**、**MDX** 支持、**分类与标签**、**社交分享**……
- **图片优化**（基于 **Astro Assets** 和 **Unpic** 通用图片 CDN）。
- 基于路由自动生成 **站点地图**。
- **Open Graph 标签**，优化社交媒体分享效果。
- 内置 **Google Analytics** 和 Splitbee 分析支持。

## 演示

[https://astrowind.vercel.app/](https://astrowind.vercel.app/)

## UI 框架

项目已内置 **Vue**、**React**、**Svelte** 支持，通过 Astro 官方集成（`@astrojs/vue`、`@astrojs/react`、`@astrojs/svelte`）开箱即用。在 `src/components/` 下创建 `.vue`、`.jsx`、`.svelte` 文件即可在 `.astro` 组件中直接引用。

## 快速开始

> 需要 **Node.js >= 22.12.0**

```shell
npm install
npm run dev
```

浏览器访问 `http://localhost:4321` 即可预览。

## 项目结构

```
/
├── public/
│   ├── _headers
│   └── robots.txt
├── src/
│   ├── assets/
│   │   ├── favicons/
│   │   ├── images/
│   │   └── styles/
│   │       └── tailwind.css
│   ├── components/
│   │   ├── blog/          # 博客相关组件
│   │   ├── common/        # 通用组件（Image、Metadata、Analytics 等）
│   │   ├── ui/            # 基础 UI 组件（Button、Headline 等）
│   │   └── widgets/       # 页面部件（Hero、Features、Pricing、Header、Footer 等）
│   ├── content.config.ts  # 内容集合 Schema
│   ├── data/
│   │   └── post/          # 博客文章（.md / .mdx）
│   ├── layouts/           # 页面布局
│   ├── pages/             # 文件路由（每个 .astro 文件对应一个路由）
│   ├── utils/             # 工具函数
│   ├── config.yaml        # 站点配置
│   └── navigation.ts      # 导航数据结构
└── ...
```

## 命令

所有命令在项目根目录终端中执行：

| 命令              | 说明                                            |
| :---------------- | :---------------------------------------------- |
| `npm install`     | 安装依赖                                        |
| `npm run dev`     | 启动开发服务器 `localhost:4321`                 |
| `npm run build`   | 构建生产版本到 `./dist/`                        |
| `npm run preview` | 本地预览生产构建                                |
| `npm run check`   | 检查项目错误（astro check + ESLint + Prettier） |
| `npm run fix`     | 自动修复 ESLint 和 Prettier 问题                |

## 配置

主配置文件：`./src/config.yaml`

```yaml
site:
  name: 'Example'
  site: 'https://example.com'
  base: '/' # 如需部署到 GitHub Pages，修改此项
  trailingSlash: false # 永久链接末尾是否带 "/"
  googleSiteVerificationId: false

# 默认 SEO 元数据
metadata:
  title:
    default: 'Example'
    template: '%s — Example'
  description: '网站默认描述'
  robots:
    index: true
    follow: true
  openGraph:
    site_name: 'Example'
    images:
      - url: '~/assets/images/default.png'
        width: 1200
        height: 628
    type: website
  twitter:
    handle: '@twitter_user'
    site: '@twitter_user'
    cardType: summary_large_image

i18n:
  language: en # 语言
  textDirection: ltr # 文字方向

apps:
  blog:
    isEnabled: true
    postsPerPage: 6

    post:
      isEnabled: true
      permalink: '/blog/%slug%' # 变量：%slug%, %year%, %month%, %day%, %hour%, %minute%, %second%, %category%
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

analytics:
  vendors:
    googleAnalytics:
      id: null # 填入 "G-XXXXXXXXXX"

ui:
  theme: 'system' # 可选值：system | light | dark | light:only | dark:only
```

### 自定义样式

项目支持两种样式编写方式：

- **Tailwind CSS v4** — 采用 CSS-first 配置方式，使用 `@theme` 变量、`@utility` 工具类进行全局样式管理
- **CSS Modules** — 文件名以 `.module.css` 结尾，样式自动局部作用域化，在 `.astro` 文件中通过 `import styles from './Component.module.css'` 使用

关键样式文件：

- `src/components/CustomStyles.astro` — 颜色和字体的 CSS 变量
- `src/assets/styles/tailwind.css` — Tailwind 主题变量（`@theme`）、自定义工具类（`@utility`）和插件
- `src/components/widgets/Hero.module.css` — CSS Modules 示例

> **CSS Modules 用法示例：**
>
> 以 `src/components/widgets/Hero.astro` 为例，将部分重复使用的样式提取到同名的 `Hero.module.css` 中：
>
> ```css
> /* Hero.module.css */
> @reference "tailwindcss";
>
> .heroHeading {
>   @apply text-5xl md:text-6xl font-bold mb-4 dark:text-gray-200;
> }
> ```
>
> 在 `.astro` 组件中导入并使用：
>
> ```astro
> <h1 class={styles.heroHeading}>标题</h1>
> ```
>
> 注意：`@reference "tailwindcss"` 是必要的，它让 CSS Module 能通过 `@apply` 引用 Tailwind 标准工具类。项目自定义的 `@utility`（如 `font-heading`、`text-muted`）需保留在模板的 class 字符串中直接使用。

## 构建部署

```shell
npm run build
```

构建产物位于 `./dist/` 目录，可直接部署到任意静态托管服务。

## 已完成的定制化修改

以下是在原始 AstroWind 模板基础上进行的改进：

### 站点配置 (`src/config.yaml`)

- 站点名称、SEO 元数据、Open Graph、Twitter Card 等信息已替换为 LKM 项目实际内容
- Google Site Verification ID 已置空

### UI 框架集成

- 新增 `@astrojs/vue`、`@astrojs/react`、`@astrojs/svelte`，三种框架开箱即用
- 可直接在 `src/components/` 下创建 `.vue`、`.jsx`/`.tsx`、`.svelte` 组件

### CSS Modules

- 新增 `src/components/widgets/Hero.module.css` 作为 CSS Modules 示例
- Hero 组件已改用 CSS Module 管理局部样式
- 须在 `.module.css` 文件顶部添加 `@reference "tailwindcss"` 以支持 `@apply`

### 联系表单

- `src/components/ui/Form.astro` 已添加 `method="POST" action="/api/contact"` 属性

### 首页 FAQ

- FAQ 内容已替换为有意义的中文问答（技术栈、快速开始、自定义样式、博客功能、部署方式、UI 框架支持）

### 代码质量

- 修复了 `src/components/common/Image.astro` 的 ESLint 类型断言解析错误
- 运行 `npm audit fix` 修复了 5 个安全漏洞（剩余 5 个 low severity 为 esbuild Windows 开发模式问题）
- `package.json` 的 `name` 字段已从空字符串改为 `lkm-official-website`
- 移除了 `markdown-elements-demo-post.mdx` 中失效的 YouTube/Tweet/Vimeo 嵌入内容，消除构建时的 fetch 错误

### 侧边栏 + 全局顶栏

- 新增 `src/layouts/SidebarLayout.astro` — 带侧边栏的页面布局
- 新增 `src/components/widgets/Sidebar.astro` + `Sidebar.module.css` — 侧边栏组件（CSS Modules）
- 新增 `src/components/widgets/TopNav.astro` — 全局顶栏组件，在各分区页面之间切换
- 页面布局：顶部 Header → 顶栏分区标签 → 左侧侧边栏 + 右侧内容区 → 底部 Footer
- 顶栏显示分区入口（About us / Services / Pricing / Contact），当前分区高亮
- 侧边栏显示当前分区内子页面导航（如 About 分区：Overview / Values / Achievements / Locations / Support）
- 已应用到 about、services、pricing、contact 四个页面

### 文档

- README.md 已精简为中文，移除了开发无关内容（badge 展示、第三方部署按钮、贡献指南等）
