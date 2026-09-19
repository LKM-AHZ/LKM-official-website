# LKM 动态前端新手指南

本指南帮助新成员安装工具、启动动态前端、连接真实后端并提交可验证的改动。完整全栈启动可直接使用上级仓库的 `dev.sh`、`dev.ps1` 或 `dev.bat`，详见 [`../DEVELOPMENT.md`](../DEVELOPMENT.md)。

## 1. 准备环境

必需工具：

- Git
- Node.js `>=24`
- pnpm `11`（项目 `packageManager` 字段为权威版本）
- VS Code 或其他支持 Astro、Vue 和 TypeScript 的编辑器

检查版本：

```sh
git --version
node --version
pnpm --version
```

不要混用 npm、Yarn 和 pnpm；锁文件为 `pnpm-lock.yaml`。

## 2. 安装依赖

```sh
cd LKM-official-website
pnpm install
```

CI 使用锁文件安装，提交依赖变更时必须同时提交 `package.json` 和 `pnpm-lock.yaml`。不要提交 `node_modules/`、`.astro/`、`dist/` 或本地 `.env`。

### 网络或缓存问题

先确认 Node、pnpm 和网络正常，再清理 pnpm 未引用的缓存：

```sh
pnpm store prune
pnpm install --network-concurrency=2 --fetch-timeout=60000
```

不要随意删除锁文件来“解决”安装问题；这会升级整棵依赖树。只有明确要更新依赖时才修改锁文件。

## 3. 配置后端

```sh
cp .env.example .env
```

本地联调的最小配置：

```dotenv
API_URL=http://127.0.0.1:8000
PUBLIC_SITE_URL=http://127.0.0.1:4321
PUBLIC_BASE_PATH=/
```

`API_URL` 供 SSR、REST 代理和 GraphQL 使用。`PUBLIC_*` 变量会进入客户端产物，不能存放密码、token 或私有地址。

若只查看静态页面，可将 `API_URL` 留空；登录、论坛、文件库等功能不会正常工作。

## 4. 启动与浏览

```sh
pnpm dev
```

打开 `http://127.0.0.1:4321`。常见入口包括 `/login`、`/forum`、`/files`、`/projects`、`/qa` 和 `/admin`。

遇到 Vite 缓存异常时：

```sh
pnpm dev:clean
```

## 5. 认识目录

```text
src/
├── pages/                 # 文件路由
├── layouts/               # 页面布局
├── components/            # 通用 primitives / patterns
├── features/              # 业务域组件和流程
├── lib/api/               # REST / GraphQL 数据访问
├── lib/http/              # HTTP 客户端、token 与刷新队列
├── stores/                # Pinia 状态
├── styles/                # Tailwind 和全局样式
└── types/                 # TypeScript 类型
```

新增代码前先查找同类实现：

- 页面放在 `src/pages/`，路由由文件名决定；
- 业务组件放在 `src/features/<feature>/components/`；
- 通用组件放在 `src/components/primitives/` 或 `src/components/patterns/`；
- 所有后端调用从 `~/lib/api` 进入，不在组件内重复实现 token 和错误处理；
- 正式博客内容来自后端，公开新闻在 `LKM-official-static`，不要在本仓库创建旧式 `src/content/posts/`。

## 6. 做一个改动

推荐流程：

1. 从主分支更新代码，并确认工作区干净。
2. 创建短生命周期分支。
3. 先定位现有组件、API 模块和测试，再修改。
4. 对用户可见的变化补测试、无障碍属性和必要文档。
5. 运行自动修复，然后执行完整检查。

```sh
pnpm fix
pnpm check
pnpm test
pnpm build
```

页面或交互变化还应运行：

```sh
pnpm test:smoke
pnpm test:a11y
```

不要为了让检查通过而禁用 ESLint、TypeScript 或无障碍规则；应修正根因，或在代码评审中说明确实需要的最小豁免。

## 7. 常见任务

### 新增页面

在 `src/pages/` 新建 `.astro` 文件，使用现有布局，补齐标题和描述。页面需要数据时调用 `~/lib/api`。完成后检查移动端、暗色模式、键盘导航和错误状态。

### 新增组件

先判断是通用组件还是业务组件。交互优先使用 Vue；React 仅限现有编辑器边界。`client:only` island 外层必须有稳定高度。

### 修改样式

优先使用 Tailwind utility 和现有语义 token。入口为 `src/styles/tailwind.css`，变量在 `src/styles/variables.css`。不要为相同语义硬编码第二套颜色。

### 新增图标

项目使用本地 Iconify 包。新增图标后运行：

```sh
node scripts/generate-icons.mjs
```

`pnpm build` 会自动执行该步骤。

## 8. Git 与提交

本目录是独立 Git 仓库。提交前确认：

```sh
git status --short
git diff --check
```

提交应只包含同一目的的改动。不要提交 `.env`、构建产物、浏览器测试报告、编辑器缓存或与任务无关的格式化变化。

## 9. 获取帮助

- 架构与命令：[README.md](./README.md)
- 代码门禁：[CODING_STANDARDS.md](./CODING_STANDARDS.md)
- Agent 约束：[AGENTS.md](./AGENTS.md)
- 全栈开发：[../DEVELOPMENT.md](../DEVELOPMENT.md)
- 后端接口：启动后访问 `http://127.0.0.1:8000/docs` 或 `/redoc`

提问时请附上操作系统、Node/pnpm 版本、执行命令和完整错误信息，并删除其中的密钥与个人数据。
