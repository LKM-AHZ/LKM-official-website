# LKM Official Website · 理科迷动态网站

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](./LICENSE.md)
[![Astro v7](https://img.shields.io/badge/Astro-v7-FF5D01?logo=astro)](https://astro.build)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

理科迷社区的动态前端。项目使用 Astro 7 server 模式，Vue 3 承担主要交互，React 只保留在编辑器边界；后端由独立的 FastAPI 服务提供，前端不包含 mock 业务后端。

## 开始开发

要求 Node.js `>=24` 和 pnpm `11`。

```sh
pnpm install
cp .env.example .env
# 编辑 .env，将 API_URL 指向真实后端，例如 http://127.0.0.1:8000
pnpm dev
```

默认地址为 `http://127.0.0.1:4321`。如果 `API_URL` 为空，只能使用不依赖 API 的页面。

新成员请先阅读 [GETTING_STARTED.md](./GETTING_STARTED.md)；代码约束见
[CODING_STANDARDS.md](./CODING_STANDARDS.md) 和 [AGENTS.md](./AGENTS.md)。全栈开发与部署文档位于编排仓库的 [DOCUMENTATION.md](../docs/DOCUMENTATION.md)（单独克隆前端时请查看 [LKM-Website 文档](https://github.com/LKM-AHZ/LKM-Website/tree/master/docs)）。

## 环境变量

| 变量                | 是否必需       | 用途                                |
| ------------------- | -------------- | ----------------------------------- |
| `API_URL`           | 连接后端时必需 | SSR、REST 代理和 GraphQL 的后端基址 |
| `PUBLIC_SITE_URL`   | 可选           | 对外站点 URL，用于元数据和绝对链接  |
| `PUBLIC_BASE_PATH`  | 可选           | 子路径部署前缀，默认 `/`            |
| `PUBLIC_SENTRY_DSN` | 可选           | 浏览器端 Sentry DSN；为空时不启用   |

不要在 `PUBLIC_*` 变量中保存秘密；这些值会进入客户端产物。

## 常用命令

| 命令                | 用途                                        |
| ------------------- | ------------------------------------------- |
| `pnpm dev`          | 启动开发服务器                              |
| `pnpm dev:clean`    | 清理 Vite 缓存后启动                        |
| `pnpm build`        | 生成图标与 i18n 数据、构建 SSR 产物并预压缩 |
| `pnpm preview`      | 本地预览构建结果                            |
| `pnpm check`        | Astro、ESLint、Prettier、重复代码检查       |
| `pnpm fix`          | 自动修复 ESLint 与 Prettier                 |
| `pnpm test`         | Vitest 单元测试                             |
| `pnpm test:auth`    | 认证模块测试                                |
| `pnpm test:smoke`   | Playwright 路由冒烟测试                     |
| `pnpm test:a11y`    | Playwright 无障碍测试                       |
| `pnpm check:seo`    | 构建产物 SEO 检查                           |
| `pnpm check:links`  | 内部链接检查                                |
| `pnpm check:budget` | Bundle 预算检查                             |

## 当前路由

路由以 `src/pages/` 为准。主要入口：

| 范围         | 路由示例                                                                                                             |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| 首页与公共页 | `/`、`/apps`、`/privacy`、`/terms`                                                                                   |
| 认证与账号   | `/login`、`/register`、`/register/onboarding`、`/account`、`/account/recovery`                                       |
| 社区内容     | `/forum`、`/forum/[categorySlug]`、`/timeline`、`/follow`                                                            |
| 文件与项目   | `/files`、`/files/[fileId]`、`/projects`、`/projects/[projectId]`                                                    |
| 问答与竞赛   | `/qa`、`/qa/[questionId]`、`/competition`、`/competition/bank`                                                       |
| 树洞         | `/treehole` 及其 `write`、`messages`、`bottle`、`random`、`rank`、`settings` 子页                                    |
| 用户与贡献   | `/user/[username]`、`/contribution`                                                                                  |
| 管理后台     | `/admin`、`/admin/users`、`/admin/posts`、`/admin/files`、`/admin/categories`、`/admin/reports`、`/admin/moderation` |
| 其他功能     | `/editor`、`/starhope/[...route]`、`/404`、`/500`                                                                    |

新增或删除路由后，应同步 Playwright 冒烟覆盖和本文摘要。不要维护一份逐文件复制的超长路由表。

## 架构

```text
src/
├── pages/                 # Astro 文件路由
├── layouts/               # Base、Page、Official、Community 等布局
├── components/
│   ├── primitives/        # 无业务语义的基础组件
│   └── patterns/          # 可复用组合模式
├── features/              # 按业务域组织的组件、状态和流程
├── lib/
│   ├── api/               # REST/GraphQL 统一数据访问层
│   ├── http/              # 原生 fetch、认证适配器和刷新队列
│   ├── config/            # 站点配置
│   └── i18n/              # 国际化
├── stores/                # Pinia 状态
├── styles/                # Tailwind 入口、变量和全局样式
├── types/                 # TypeScript 类型
└── middleware.ts          # `/api/*`、`/graphql/vN` 代理
```

### 数据访问

目录与入口核对日期：2026-10-31。页面在 `pages/` 组合布局与业务组件；功能的组件、composable
和局部状态放在 `features/<feature>/`，跨业务复用后才进入 `components/` 或 `lib/`。
全局认证状态保留在 `stores/`，避免在页面中再维护一套会话。

- REST 调用通过 `~/lib/api` 和 `~/lib/http`；页面与组件不直接散写 `fetch`。
- GraphQL 客户端位于 `src/lib/api/graphql/`。
- 认证端点使用 `/api/v1/auth/*`。
- `useAuthStore` 是用户会话的单一状态源；401 刷新由 HTTP 层统一排队处理。

`src/middleware.ts` 为页面建立 SSR 请求上下文，并代理同源 REST/GraphQL 请求；
`public/` 是原样发布的静态文件，`src/assets/` 交给构建链处理。
单元测试就近放在 `src/**/__tests__/`，浏览器测试放在 `tests/e2e/`。
`scripts/` 负责构建和检查；图标 bundle、`src/lib/i18n/generated/` 与 `dist/` 是生成产物，
改图标引用、词典源文件或生成脚本后重新生成，不直接编辑产物。

### UI 和样式

- 通用组件放在 `src/components/primitives` 或 `src/components/patterns`。
- 业务组件放在 `src/features/<feature>/components`。
- Tailwind 入口为 `src/styles/tailwind.css`，共享变量在 `src/styles/variables.css`。
- 图标通过本地 Iconify 包与 `astro-icon` 打包，禁止运行时调用 Iconify API。
- 新增 `client:only` island 时必须预留稳定高度，避免 CLS。

Shell 通用组件和事件由 `src/features/shell/index.ts` 统一导出；`shell-community` 和
`shell-official` 委托共享出口，后者额外导出自己的 `ShellSiteNavbar`。新增共享导出只修改
`shell/index.ts`，避免在两个站点入口复制清单。

### 内容

动态前端的 `src/content.config.ts` 当前没有本地集合。正式博客与社区内容来自后端；公开静态新闻位于相邻的 `LKM-official-static` 项目。不要重新建立与真实后端并行的生产内容源。

树洞的共享内容通过 `features/anonymous-letter/stores/api.ts` 访问后端；本地数据层为
`stores/storage/`。目录入口 `index.ts` 保留原有 `stores/storage` 导入接口：
`types.ts` 定义备份契约，`persistence.ts` 统一键名/读写/导入导出，`encryption.ts` 负责
加解密，`settings.ts` 管理偏好与本地节流，`personal.ts` 保存草稿、收藏、情绪和手写信纸，
`content.ts` 兼容历史本地信件/私聊/漂流瓶/愿望。新增共享内容继续走后端，避免重复持久化。
备份键名及版本保持兼容，相关回归在 `stores/storage/__tests__/`。

## 提交前验证

最低要求：

```sh
pnpm check
pnpm test
pnpm build
```

路由、交互或样式改动还应运行：

```sh
pnpm test:smoke
pnpm test:a11y
pnpm check:seo
pnpm check:links
pnpm check:budget
```

## 部署

`Dockerfile` 构建 Astro SSR 镜像，运行时监听 `4321`，入口为 `node dist/server/entry.mjs`。
`API_URL` 是运行时变量。完整生产栈由上级仓库的 `docker-compose.yml` 或 Kubernetes 清单编排。

## 许可证

[AGPL-3.0-or-later](./LICENSE.md)
