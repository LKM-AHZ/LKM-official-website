# LKM 项目代码规范

> **新手从零部署环境 / 安装工具 / 上传改动，见 [GETTING_STARTED.md](./GETTING_STARTED.md)。项目架构与开发要求见 [AGENTS.md](./AGENTS.md)。**

## 工具链

| 工具         | 用途                                           |
| ------------ | ---------------------------------------------- |
| ESLint       | JavaScript/TypeScript/Astro 语法和最佳实践检查 |
| Prettier     | 代码风格统一格式化                             |
| EditorConfig | 编辑器基础设置（编码、换行、缩进）             |

## Prettier 格式化规则

项目当前没有单独的 Prettier 配置文件，因此使用 Prettier 3 默认值，并由
`prettier-plugin-astro` 处理 `.astro` 文件。若未来增加配置，应以配置文件为唯一来源并同步本节。

| 规则            | 值                      |
| --------------- | ----------------------- |
| `printWidth`    | 80（默认值）            |
| `tabWidth`      | 2                       |
| `useTabs`       | false（使用空格缩进）   |
| `semi`          | true（语句末尾加分号）  |
| `singleQuote`   | false（默认使用双引号） |
| `trailingComma` | all                     |

## ESLint 规则

### 未使用变量

- 变量声明后必须使用，否则报错
- 以 `_` 开头的参数和数组解构变量允许未使用（如 `_req`, `_unused`）

```js
// 允许
function handler(_req, res) { ... }

// 不允许
const base = import.meta.env.BASE_URL;  // 声明但未使用
```

### 其他规则

- `@typescript-eslint/no-non-null-assertion` — 关闭（允许使用 `!` 非空断言）
- `no-mixed-spaces-and-tabs` — 开启 `smart-tabs` 模式

## EditorConfig 规则

| 规则                       | 值                          |
| -------------------------- | --------------------------- |
| `charset`                  | utf-8                       |
| `end_of_line`              | lf（Unix 换行符）           |
| `indent_size`              | 2                           |
| `indent_style`             | space                       |
| `insert_final_newline`     | true（文件末尾插入空行）    |
| `trim_trailing_whitespace` | false（不自动删除行尾空白） |

## 常用命令

```bash
pnpm run check    # Astro + ESLint + Prettier + jscpd
pnpm run fix      # 自动修复 ESLint + Prettier 问题
pnpm run build    # 生产构建（CI 会同时运行 check）
```

## CI 流程

GitHub Actions 配置了一个工作流文件（`.github/workflows/actions.yaml`），内含 4 个 job：

| Job             | 触发              | 内容                                                    |
| --------------- | ----------------- | ------------------------------------------------------- |
| `build`         | PR / Push 到 main | `pnpm install` + `pnpm run build` 生产构建              |
| `artifacts`     | PR / Push 到 main | 构建后运行 `check:seo` / `check:links` / `check:budget` |
| `check`         | PR / Push 到 main | `pnpm run check`（Astro + ESLint + Prettier + jscpd）   |
| `test-frontend` | PR / Push 到 main | `pnpm run test`（Vitest 单元测试）                      |

### 通过 CI 的门槛

1. **`pnpm run build` 必须成功** — 项目可以无错误地构建
2. **`pnpm run check` 必须通过** — 包含四项检查：
   - `astro check` — Astro 类型检查
   - `eslint .` — ESLint 代码规范检查（零 error）
   - `prettier --check .` — Prettier 格式检查（零 warn）
   - `jscpd src --config .jscpdrc.json` — 重复代码门禁
3. **`artifacts`（SEO/links/budget）与 `test-frontend`（单测）必须通过**

> 本仓库的 CI 仅负责构建与检查，**不包含自动部署 job**；实际部署由外层编排（见根目录仓库的部署流程）完成。

## 开发流程

**每次修改代码后，必须先通过本地 CI 检查才能提交：**

```bash
pnpm run fix     # 1. 自动修复 ESLint + Prettier 问题
pnpm run check   # 2. 运行完整检查，确认零 error 零 warn
pnpm run build   # 3. 确认生产构建成功
```

**以上三步全部通过后才能 `git commit`。** 任何一个失败都必须修复后再提交，不允许将报错推到 CI 由远端捕获。

## 语法选择

**优先使用 `.astro` 文件编写组件和页面。** Astro 模板语法是第一选择，只在以下情况引入其他框架：

| 场景                     | 使用框架 | 说明                  |
| ------------------------ | -------- | --------------------- |
| 静态页面和内容组件       | `.astro` | 默认选择              |
| 主要交互组件（社区平台） | Vue 3    | 通过 `@astrojs/vue`   |
| 富文本编辑器             | React 19 | 通过 `@astrojs/react` |

```astro
{/* 推荐：使用 Astro 语法 */}
const items = ['A', 'B', 'C'];
<ul>
  {items.map((item) => <li>{item}</li>)}
</ul>
```

```astro
{/* 避免：不必要地引入 React/Vue 框架组件 */}
<Counter client:load />
{/* 仅当确实需要客户端交互时使用 */}
```

## 组件规范

- 使用 TypeScript 类型定义
- Props 使用 TypeScript 接口
- 使用 `class:list` 进行条件样式绑定
- 接收 `className` 覆写时使用 `twMerge()` 合并
- 布局组合使用具名插槽（named slots）

## 认证与状态规范

- **token 与用户状态必须统一走 `useAuthStore` / HTTP 认证适配器（`configureHttpAuthSession`）**，前端禁止直接经 localStorage 伪造或读写 token。
- **账号状态单一来源**：`src/stores/auth.ts`（`useAuthStore`）负责用户状态、token、localStorage 持久化（key `lkm-auth-store`）；组件经 Flow composable（`useLoginFlow`/`useRegisterFlow`/`useRecoveryFlow`/`useOnboardingFlow`）接入。
- **认证对接真实后端**：仓库不含后端代码，前端经 `API_URL` 指向真实后端完成认证（OAuth/WebAuthn/2FA/找回/绑定/onboarding 能力由真实后端决定）。

## 路径别名

使用 `~/` 替代 `src/`：

```typescript
import Image from "~/components/primitives/Image.astro";
import { siteConfig } from "~/lib/config";
```

## 运行环境

| 项目      | 要求                                                                   |
| --------- | ---------------------------------------------------------------------- |
| 包管理器  | **pnpm**（禁止使用 npm / yarn）                                        |
| 安装命令  | `pnpm install --frozen-lockfile`（CI）/ `pnpm install`（本地新增依赖） |
| Node.js   | `>= 24.0.0`                                                            |
| `.pnpmrc` | `shamefully-hoist=true`（Astro 依赖暴露）                              |

## TypeScript 配置

| 规则               | 值                                          |
| ------------------ | ------------------------------------------- |
| 继承基类           | `astro/tsconfigs/base`                      |
| `strictNullChecks` | `true`                                      |
| `allowJs`          | `true`                                      |
| `baseUrl`          | `.`                                         |
| 路径映射           | `~/*` → `src/*`；代码优先使用这一条通用别名 |
| 包含               | `.astro/types.d.ts`、`**/*`                 |
| 排除               | `dist/`、`node_modules`                     |

## 站点配置

站点元数据集中在 `src/data/config.yaml` 中管理，通过 `~/lib/config` 导入：

```typescript
import { siteConfig, navBarConfig, profileConfig } from "~/lib/config";
```

| 字段        | 说明                                          |
| ----------- | --------------------------------------------- |
| `site.name` | 站点名称（理科迷）                            |
| `site.base` | 部署路径前缀（当前为 `/`）                    |
| `metadata`  | SEO 默认值（标题、描述、Open Graph、Twitter） |
| `i18n`      | 国际化（语言 `zh-cn`、文字方向 `ltr`）        |
| `apps.blog` | 博客开关、每页文章数、路径名                  |
| `ui.theme`  | 主题模式（`system`）                          |
| `analytics` | Google Analytics ID                           |

修改 `config.yaml` 后需要重启 dev server。

## 导航配置

页头、页脚和菜单链接在 `src/lib/navigation.ts` 与 `src/features/shell/menus.ts` 中统一管理：

- `headerData` — 顶部导航栏（含嵌套下拉菜单）
- `footerData` — 底部链接、社交图标、版权信息
- 所有链接必须使用 `getPermalink()` 生成，不能硬编码路径

## 内容来源

`src/content.config.ts` 当前导出空集合。正式博客和社区内容来自真实后端，公开新闻与公告属于相邻的
`LKM-official-static` 项目。不要在本仓库创建旧式 `src/content/posts/`，也不要在页面中建立与
后端并行的生产数据源。

## 性能规范

### 产物检查

CI 的 `artifacts` job 会在构建后运行产物检查（`pnpm run build` 后依次执行）：

| 命令                    | 说明                                                     |
| ----------------------- | -------------------------------------------------------- |
| `pnpm run check:seo`    | SEO 输出检查（`scripts/check-seo-output.mjs`）           |
| `pnpm run check:links`  | 内部链接有效性检查（`scripts/check-links.mjs`）          |
| `pnpm run check:budget` | Bundle 体积预算检查（`scripts/check-bundle-budget.mjs`） |

**性能质量要求（开发时自查）：**

| 指标                 | 目标  |
| -------------------- | ----- |
| 平均 Performance     | >= 80 |
| FAIL (<50) 页面      | 0     |
| PASS (90+) 页面      | >= 4  |
| 平均 Accessibility   | >= 90 |
| Best Practices / SEO | 100   |

### Icon 本地化

- 所有 icon 通过 `astro-icon` 的 `include` 配置本地打包，禁止新增运行时 Iconify API 调用
- `astro.config.ts` → `integrations.icon.include` 已覆盖 `tabler`、`material-symbols`、`fa6-brands`、`fa6-regular`、`fa6-solid`、`flat-color-icons`
- 新增 icon 集需同步更新 `include` 列表

### Vue `client:only` CLS 防护

- 使用 `client:only` 指令的组件（Vue）**必须包裹 `style="min-height: 400px"` 容器**
- 防止组件挂载后内容注入造成 Cumulative Layout Shift
- 例外：已使用全高布局（如 `MainGridLayout`、`SidebarLayout`）的页面，布局本身提供高度保障时可不额外包裹

### Vendor chunk 策略

- `astro.config.ts` → `vite.build.rollupOptions.output.manualChunks`
- 全局使用的框架和图标库加入对应 vendor chunk：
  - `react` / `react-dom` → `vendor-react`
  - `vue` / `@iconify/vue` → `vendor-vue`
  - `katex` / `rehype-katex` → `vendor-katex`
  - TipTap/ProseMirror → `editor-tiptap`，CodeMirror/Lezer → `editor-codemirror`
- 页面级小众依赖（overlayscrollbars、photoswipe）保持独立异步加载
- 新增全局框架依赖时需同步更新 `manualChunks`

### Preconnect

- `BaseLayout.astro` 已配置以下域名 preconnect：
  - `fonts.googleapis.com` / `fonts.gstatic.com`
  - `images.unsplash.com`
  - `api.iconify.design` / `api.simplesvg.com` / `api.unisvg.com`

## Git 规范

| 规则     | 说明                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------- |
| 主分支   | `main`（所有 push 和 PR 的目标）                                                                   |
| 忽略文件 | 以 `.gitignore` 为准；包括 `dist/`、`node_modules/`、`.astro/`、`.env`、测试报告和本地 AI/工具目录 |
| Commit   | 提交前必须通过 `pnpm run check` 和 `pnpm run build`                                                |
| 换行符   | 统一 LF（`.editorconfig` + `git config core.autocrlf`）                                            |
