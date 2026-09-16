# LKM Official Website · 理科迷官方网站

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Astro v7](https://img.shields.io/badge/Astro-v7-FF5D01?logo=astro)](https://astro.build)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript)](https://www.typescriptlang.org)

**理科迷 (LKM)** 的官方网站 — 基于 [AstroWind](https://github.com/arthelokyo/astrowind) 模板，采用 Astro v7 + Tailwind CSS v4 + Vue 3 构建，Astro SSR server 模式部署。LKM 是创立于 2014 年的科技爱好者社区，覆盖数学、物理、化学、生物、信息技术等多个学科。

> **新手如何从零部署环境、安装工具、上传改动？** 请看 [**新手指南（GETTING_STARTED.md）**](./GETTING_STARTED.md)。

---

## 快速导航（点击跳转）

- [常用命令表（复制即用）](#常用命令)
- [项目结构](#项目结构)
- [页面路由](#页面路由)
- [配置系统](#配置系统)
- [样式系统](#样式系统)
- [内容管理](#内容管理)
- [构建部署](#构建部署)
- [架构概览](#架构概览)
- [特性](#特性)
- [致谢 · 开源项目](#致谢--开源项目)
- [许可证](#许可证)

> 仓库文档族：
>
> - [新手指南](./GETTING_STARTED.md) — 环境部署 / 工具安装 / 排错 / 更新 / 上传改动
> - [AGENTS.md](./AGENTS.md) — AI Agent 指南（架构、数据访问、认证、组件规范）
> - [CODING_STANDARDS.md](./CODING_STANDARDS.md) — 代码规范（格式、ESLint、CI、Git 规范）

---

## 常用命令

| 命令                   | 说明                                                       |
| :--------------------- | :--------------------------------------------------------- |
| `pnpm run dev`         | 启动开发服务器                                             |
| `pnpm run build`       | 生产构建到 `./dist/`                                       |
| `pnpm run preview`     | 本地预览生产构建                                           |
| `pnpm run check`       | 类型检查 + ESLint + Prettier                               |
| `pnpm run fix`         | 自动修复 ESLint + Prettier                                 |
| `pnpm run test:smoke`  | Playwright E2E 冒烟测试                                    |
| `pnpm run test:a11y`   | Playwright 无障碍测试                                      |
| `pnpm run check:seo`   | SEO 输出检查                                               |
| `pnpm run check:links` | 链接有效性检查                                             |
| `pnpm run test`        | 运行 Vitest 测试                                           |
| `pnpm run test:auth`   | 运行认证前端 Vitest 测试（`vitest run src/features/auth`） |

---

## 项目结构

```
/
├── .github/workflows/          # CI/CD (GitHub Actions)
├── public/                     # 静态资源
├── src/
│   ├── assets/images/          # 图片资源
│   │   ├── member/             # 原始头像图片
│   │   └── member-optimized/   # 优化后的 WebP 头像
│   ├── lib/                    # 共享库（api/config/constants/errors/http/i18n/utils/markdown-plugins）
│   ├── scripts/                # 客户端脚本（blog-init/transitions/photoswipe）
│   ├── features/               # 业务功能模块 (25 个)
│   │   ├── admin/              # 管理后台
│   │   ├── anonymous-letter/   # 匿名树洞
│   │   ├── auth/               # 登录认证
│   │   ├── blog-community/     # 社区博客
│   │   ├── column/             # 专栏系统
│   │   ├── competition/        # 竞赛系统
│   │   ├── content/            # 内容组件
│   │   ├── contribution/       # 贡献/积分
│   │   ├── dashboard/          # 首页仪表盘
│   │   ├── editor/             # 富文本编辑器（TipTap 3）
│   │   ├── file-library/       # 文件库
│   │   ├── forum/              # 论坛
│   │   ├── funding/            # 资助系统
│   │   ├── homepage/           # 首页组件
│   │   ├── notification/       # 消息通知
│   │   ├── profile/            # 个人主页
│   │   ├── project-hub/        # 项目广场
│   │   ├── qa/                 # 问答系统
│   │   ├── search/             # 全局搜索
│   │   ├── shell/              # 顶栏/页脚/背景/通用 UI
│   │   ├── shell-community/    # 社区站壳
│   │   ├── shell-official/     # 官方站壳
│   │   ├── starhope/           # StarHope AI 学习助手
│   │   ├── team/               # 团队页面组件
│   │   └── triggered-discharge/ # 击发队列特效
│   ├── layouts/                # 页面布局
│   ├── pages/                  # 文件路由
│   ├── styles/                 # 全局样式 (tailwind.css)
│   ├── types/                  # TypeScript 类型声明
│   ├── content/                # 内容（posts/）
│   ├── data/                   # 配置文件（config.yaml 等）
│   └── middleware.ts           # Astro 中间件（反向代理 /api/* → FastAPI）
├── AGENTS.md                   # AI Agent 指令
├── CLAUDE.md                   # Claude Code 配置
├── CODING_STANDARDS.md         # 代码规范
├── GETTING_STARTED.md          # 新手指南（环境部署 / 上传改动）
├── LICENSE.md                  # AGPL-3.0 许可证
├── astro.config.ts             # Astro 配置（server 模式 + Vue/React 集成）
└── tsconfig.json               # TypeScript 配置
```

---

## 页面路由

### 官方站点 (`/official`)

| 路由       | 路径                     | 源文件                              |
| :--------- | :----------------------- | :---------------------------------- |
| 首页       | `/official`              | `pages/official/index.astro`        |
| 管理团队   | `/official/team`         | `pages/official/team.astro`         |
| 项目团队   | `/official/project-team` | `pages/official/project-team.astro` |
| 关于       | `/official/articles`     | `pages/official/articles/`          |
| 新闻资讯   | `/official/news`         | `pages/official/news/`              |
| 服务       | `/official/services`     | `pages/official/services.astro`     |
| 赞助与支持 | `/official/pricing`      | `pages/official/pricing.astro`      |
| 联系我们   | `/official/contact`      | `pages/official/contact.astro`      |
| QQ 社群    | `/official/communities`  | `pages/official/communities.astro`  |
| 隐私政策   | `/official/privacy`      | `pages/official/privacy.md`         |
| 使用条款   | `/official/terms`        | `pages/official/terms.md`           |

### 社区平台 (`/community`)

| 路由     | 路径                               | 说明            |
| :------- | :--------------------------------- | :-------------- |
| 社区首页 | `/community`                       | 动态流 + 仪表盘 |
| 论坛板块 | `/community/forum`                 | 板块广场        |
| 论坛详情 | `/community/forum/<slug>`          | 板块帖子列表    |
| 帖子详情 | `/community/forum/post/<id>`       | 帖子正文 + 评论 |
| 专栏列表 | `/community/columns`               | 专栏广场        |
| 专栏详情 | `/community/columns/<slug>`        | 专栏文章列表    |
| 专栏文章 | `/community/columns/<slug>/<id>`   | 文章详情        |
| 文件库   | `/community/files`                 | 文件列表        |
| 文件详情 | `/community/files/<id>`            | 文件详情 + 下载 |
| 竞赛大厅 | `/community/competition`           | 竞赛列表        |
| 竞赛详情 | `/community/competition/<id>`      | 竞赛详情/报名   |
| 竞赛答题 | `/community/competition/<id>/exam` | 答题界面        |
| 题库中心 | `/community/competition/bank`      | 题库浏览        |
| 匿名树洞 | `/community/treehole`              | 信件流          |
| 树洞写信 | `/community/treehole/write`        | 写信页          |
| 漂流瓶   | `/community/treehole/bottle`       | 捞漂流瓶        |

### 账号系统

| 路由     | 路径                   | 说明                                                   |
| :------- | :--------------------- | :----------------------------------------------------- |
| 登录     | `/login`               | 账户/邮箱/手机 + 密码、验证码、GitHub/Passkey/2FA/找回 |
| 注册     | `/register`            | 本地账户或邮箱/手机验证码注册                          |
| 注册引导 | `/register/onboarding` | 引导流程                                               |
| 账号设置 | `/account`             | 个人设置（含 2FA/Passkey/账号绑定）                    |
| 账号找回 | `/account/recovery`    | 密码找回（邮箱/手机/验证码）                           |

### 认证与账号流程

认证前端对接真实后端 JWT 认证（无 mock 账号），经 `API_URL` 指向真实后端，单页依次支持：

- **账户登录**：账户/邮箱/手机 + 密码、短信/邮箱验证码、邮箱 Magic Link
- **高级认证**：GitHub、Passkey、2FA（二次验证）、密码找回、登录后引导（onboarding）与账号绑定

账号状态由 `src/stores/auth.ts`（`useAuthStore`）作为单一状态源，localStorage key `lkm-auth-store`。

### 其他

| 路由       | 路径                      | 说明             |
| :--------- | :------------------------ | :--------------- |
| 项目广场   | `/official/projects`      | 项目大厅         |
| 项目详情   | `/official/projects/<id>` | 项目详情         |
| 求助系统   | `/official/qa`            | 问答大厅         |
| 求助提问   | `/official/qa/ask`        | 提问页           |
| 求助详情   | `/official/qa/<id>`       | 问题详情         |
| 贡献系统   | `/contribution`           | 积分/成就/排行榜 |
| 资助系统   | `/official/funding`       | 资助占位页       |
| 管理后台   | `/admin`                  | 后台仪表盘       |
| 用户管理   | `/admin/users`            | 后台用户列表     |
| 帖子管理   | `/admin/posts`            | 后台帖子审核     |
| 文件审核   | `/admin/files`            | 后台文件审核     |
| 板块管理   | `/admin/categories`       | 后台板块管理     |
| 举报管理   | `/admin/reports`          | 后台举报处理     |
| 文档列表   | `/admin/documents`        | 后台文档列表     |
| 编辑器     | `/editor`                 | 富文本编辑器     |
| 匿名信大厅 | `/letters`                | 匿名信列表       |
| StarHope   | `/starhope`               | AI 学习助手      |
| 团队介绍   | `/apps`                   | 应用入口         |
| 资源       | `/resources`              | 资源页           |
| 用户主页   | `/user/<username>`        | 用户个人主页     |
| 博客       | `/blog`                   | 博客列表         |
| 博客文章   | `/blog/<slug>`            | 博客文章         |
| 404        | `/404`                    | 404 页面         |
| RSS        | `/rss.xml`                | RSS 订阅         |

---

## 配置系统

`src/data/config.yaml` 通过自定义集成注入：

```ts
import { SITE, I18N, METADATA, APP_BLOG, UI, ANALYTICS } from "~/lib/config";
```

常用配置项：站点名称/URL、SEO 元数据、博客开关与分页、Google Analytics ID、主题模式等。

---

## 样式系统

**Tailwind CSS v4** — CSS-first 配置，入口 `src/styles/tailwind.css`，支持暗色模式、自定义主题变量、Typography 插件。部分组件使用 **CSS Modules** 实现局部作用域样式，结合 **KaTeX** 渲染数学公式。

---

## 博客内容

博客采用 **Astro content collections**（`src/content.config.ts`，当前集合为空），正式博客内容来自独立部署的真实后端：

- 社区博客为 Vue SPA，路由 `src/pages/blog/`（`index.astro` / `[...slug].astro`）
- 文章正文经 `useBlogPost` 用 `@mdx-js/mdx` 的 `evaluate()` 在客户端编译（MDX 原文由 `blogApi` 从后端获取），再经共享 `Callout`/`Figure` 组件映射渲染
- 不在前端以 `.md` 文件管理博客正文

---

## 构建与 CI

```bash
pnpm run build   # 输出到 ./dist/
```

推送 `main`（或开 PR）后，GitHub Actions 触发 `build` / `artifacts` / `check` / `test-frontend` 四个 job：生产构建、产物检查（SEO / 内部链接 / Bundle 预算）、`astro check`+ESLint+Prettier、Vitest 单测。**本仓库 CI 不含自动部署 job**，实际部署由外层编排（根目录仓库/APISIX 编排）完成。

> 本仓库 `pnpm run dev` 仅启动 Astro（端口 4321）；后端请求经 `API_URL` 代理到真实后端（见 `.env.example`），未配置则前端仅提供不依赖 API 的页面。

---

## 架构概览

```
lib/            共享库（api/config/errors/http/utils 等）
  ↓
features/       业务功能模块（25 个）
  ↓
layouts/        页面布局（BaseLayout/PageLayout/SidebarLayout/MarkdownLayout/BlogLayout）
  ↓
pages/          文件路由页面
```

---

## 特性

- **Astro v7** SSR server 模式
- **Tailwind CSS v4** 暗色模式 + 自定义主题
- **12 种可切换动态背景** — 极光、数字雨、星座、DNA（2D/3D）、梦幻光晕、粒子等，自适应深浅主题
- **富文本编辑器** — 基于 Tiptap 3 的 MDX 双向编辑器，支持 AI 助手、版本历史、评论、自动保存
- **多框架支持** — React 19 + Vue 3 按需引入
- **View Transitions** SPA 风格页面切换
- **博客系统** — MD/MDX、分类/标签、分页、KaTeX 公式
- **SEO 完整** — Sitemap、RSS、Open Graph、Twitter Card
- **图片优化** — Sharp + Unpic CDN
- **Pagefind 全文搜索** — 客户端离线搜索
- **KaTeX** — 数学公式渲染
- **响应式适配** — 移动端至桌面端
- **前后端分离** — 本仓库仅前端，对接独立部署的真实后端（REST + GraphQL），经 `API_URL` 代理

---

## 致谢 · 开源项目

本项目基于以下开源项目构建：

| 项目                                                              | 许可证     | 用途             |
| :---------------------------------------------------------------- | :--------- | :--------------- |
| [Astro](https://astro.build)                                      | MIT        | Web 框架         |
| [AstroWind](https://github.com/arthelokyo/astrowind)              | MIT        | 项目模板基础     |
| [Tailwind CSS](https://tailwindcss.com)                           | MIT        | 样式系统         |
| [React](https://react.dev)                                        | MIT        | UI 组件          |
| [Vue.js](https://vuejs.org)                                       | MIT        | UI 组件          |
| [Naive UI](https://www.naiveui.com)                               | MIT        | UI 组件库        |
| [Tiptap](https://tiptap.dev)                                      | MIT        | 富文本编辑器引擎 |
| [Three.js](https://threejs.org)                                   | MIT        | 3D 图形渲染      |
| [KaTeX](https://katex.org)                                        | MIT        | 数学公式渲染     |
| [Mermaid](https://mermaid.js.org)                                 | MIT        | 图表渲染         |
| [Pagefind](https://pagefind.app)                                  | MIT        | 全文搜索         |
| [PhotoSwipe](https://photoswipe.com)                              | MIT        | 图片预览         |
| [Expressive Code](https://expressive-code.com)                    | MIT        | 代码高亮         |
| [Markdown-it](https://github.com/markdown-it/markdown-it)         | MIT        | Markdown 解析    |
| [sanitize-html](https://github.com/apostrophecms/sanitize-html)   | MIT        | HTML 消毒        |
| [Neverthrow](https://github.com/supermacro/neverthrow)            | MIT        | 类型安全错误处理 |
| [Dexie.js](https://dexie.org)                                     | Apache-2.0 | IndexedDB 封装   |
| [OverlayScrollbars](https://kingsora.github.io/OverlayScrollbars) | MIT        | 自定义滚动条     |
| [unpic](https://unpic.pics)                                       | MIT        | 图片优化         |
| [QRCode](https://github.com/soldair/node-qrcode)                  | MIT        | 二维码生成       |
| [sharp](https://sharp.pixelplumbing.com)                          | Apache-2.0 | 图片处理         |
| [Lighthouse](https://github.com/GoogleChrome/lighthouse)          | Apache-2.0 | 性能审计         |
| [Playwright](https://playwright.dev)                              | Apache-2.0 | E2E 测试         |
| [Vitest](https://vitest.dev)                                      | MIT        | 单元测试         |
| [ESLint](https://eslint.org)                                      | MIT        | 代码检查         |
| [Prettier](https://prettier.io)                                   | MIT        | 代码格式化       |
| [TypeScript](https://www.typescriptlang.org)                      | Apache-2.0 | 类型系统         |

---

## 许可证

本项目基于 GNU Affero General Public License v3（AGPL-3.0）开源。详见 [LICENSE.md](./LICENSE.md)。
