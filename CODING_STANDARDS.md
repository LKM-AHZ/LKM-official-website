# LKM 项目代码规范

## 工具链

| 工具         | 用途                                           |
| ------------ | ---------------------------------------------- |
| ESLint       | JavaScript/TypeScript/Astro 语法和最佳实践检查 |
| Prettier     | 代码风格统一格式化                             |
| EditorConfig | 编辑器基础设置（编码、换行、缩进）             |

## Prettier 格式化规则

| 规则            | 值                     |
| --------------- | ---------------------- |
| `printWidth`    | 120                    |
| `tabWidth`      | 2                      |
| `useTabs`       | false（使用空格缩进）  |
| `semi`          | true（语句末尾加分号） |
| `singleQuote`   | true（使用单引号）     |
| `trailingComma` | es5（允许尾逗号）      |

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
npm run check    # 运行所有检查：astro check + ESLint + Prettier
npm run fix      # 自动修复 ESLint + Prettier 问题
npm run build    # 生产构建（CI 会同时运行 check）
```

## CI 流程

GitHub Actions 配置了两个工作流：

### actions.yaml — PR 与 Push 检查 + 部署

| Job      | 触发                                   | 内容                                                |
| -------- | -------------------------------------- | --------------------------------------------------- |
| `build`  | PR 到 main / Push 到 main              | `pnpm run build` 生产构建                           |
| `check`  | PR 到 main / Push 到 main              | `pnpm run check`（astro check + ESLint + Prettier） |
| `deploy` | Push 到 main（build + check 都通过后） | 部署到 GitHub Pages                                 |

### static.yml — 静态页面部署

Push 到 main 分支时构建并部署到 GitHub Pages。

### 通过 CI 的门槛

1. **`pnpm run build` 必须成功** — 项目可以无错误地构建
2. **`pnpm run check` 必须通过** — 包含三项检查：
   - `astro check` — Astro 类型检查
   - `eslint .` — ESLint 代码规范检查（零 error）
   - `prettier --check .` — Prettier 格式检查（零 warn）
3. **deploy job 依赖 build 和 check 都通过** — 任一失败则不会部署

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

| 场景                   | 使用框架 | 说明                  |
| ---------------------- | -------- | --------------------- |
| 静态页面和内容组件     | `.astro` | 默认选择              |
| 需要状态管理的交互组件 | React    | 通过 `@astrojs/react` |
| 已有 Vue 组件复用      | Vue      | 通过 `@astrojs/vue`   |

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
- Props 接口继承自 `~/types`
- 使用 `class:list` 进行条件样式绑定
- 接收 `className` 覆写时使用 `twMerge()` 合并
- 布局组合使用具名插槽（named slots）

## 路径别名

使用 `~/` 替代 `src/`：

```typescript
import Image from '~/components/common/Image.astro';
import { SITE } from 'astrowind:config';
```

## 运行环境

| 项目      | 要求                                                                   |
| --------- | ---------------------------------------------------------------------- |
| 包管理器  | **pnpm**（禁止使用 npm / yarn）                                        |
| 安装命令  | `pnpm install --frozen-lockfile`（CI）/ `pnpm install`（本地新增依赖） |
| Node.js   | `>= 24.0.0`                                                            |
| `.pnpmrc` | `shamefully-hoist=true`（Astro 依赖暴露）                              |

## TypeScript 配置

| 规则               | 值                          |
| ------------------ | --------------------------- |
| 继承基类           | `astro/tsconfigs/base`      |
| `strictNullChecks` | `true`                      |
| `allowJs`          | `true`                      |
| `baseUrl`          | `.`                         |
| 路径映射           | `~/*` → `src/*`             |
| 包含               | `.astro/types.d.ts`、`**/*` |
| 排除               | `dist/`、`node_modules`     |

## 站点配置

站点元数据集中在 `src/config.yaml` 中管理，通过虚拟模块 `astrowind:config` 导入：

```typescript
import { SITE, METADATA, I18N, APP_BLOG, UI, ANALYTICS } from 'astrowind:config';
```

| 字段        | 说明                                          |
| ----------- | --------------------------------------------- |
| `site.name` | 站点名称（理科迷）                            |
| `site.base` | 部署路径前缀（`/LKM-official-website`）       |
| `metadata`  | SEO 默认值（标题、描述、Open Graph、Twitter） |
| `i18n`      | 国际化（语言 `zh-cn`、文字方向 `ltr`）        |
| `apps.blog` | 博客开关、每页文章数、路径名                  |
| `ui.theme`  | 主题模式（`system`）                          |
| `analytics` | Google Analytics ID                           |

修改 `config.yaml` 后需要重启 dev server。

## 导航配置

页头和页脚链接在 `src/navigation.ts` 中统一管理：

- `headerData` — 顶部导航栏（含嵌套下拉菜单）
- `footerData` — 底部链接、社交图标、版权信息
- 所有链接必须使用 `getPermalink()` 生成，不能硬编码路径

## 内容集合（博客文章）

### 文件位置

博客文章放在 `src/data/post/`，支持 `.md` 和 `.mdx` 格式。

### 必需字段

| 字段          | 类型      | 说明                        |
| ------------- | --------- | --------------------------- |
| `title`       | `string`  | **必填**，文章标题          |
| `publishDate` | `Date`    | 发布日期                    |
| `draft`       | `boolean` | 草稿模式（`true` 时不发布） |

### 可选字段

| 字段         | 类型       | 说明            |
| ------------ | ---------- | --------------- |
| `updateDate` | `Date`     | 更新日期        |
| `excerpt`    | `string`   | 文章摘要        |
| `image`      | `string`   | 封面图路径      |
| `category`   | `string`   | 分类            |
| `tags`       | `string[]` | 标签列表        |
| `author`     | `string`   | 作者名          |
| `metadata`   | `object`   | 覆盖 SEO 元数据 |

### 示例

```markdown
---
title: 我的第一篇文章
publishDate: 2026-07-04
excerpt: 这是一篇示例文章。
category: tutorials
tags: [astro, tailwind]
author: LKM
---
```

## Git 规范

| 规则     | 说明                                                              |
| -------- | ----------------------------------------------------------------- |
| 主分支   | `main`（所有 push 和 PR 的目标）                                  |
| 忽略文件 | `dist/`、`node_modules/`、`.astro/`、`.env`、`tools/`、`.claude/` |
| Commit   | 提交前必须通过 `pnpm run check` 和 `pnpm run build`               |
| 换行符   | 统一 LF（`.editorconfig` + `git config core.autocrlf`）           |
