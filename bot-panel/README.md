# LKMBot 管理面板

LKMBot 的 Web 管理面板（Vue 3 + Vuetify，基于 CodedThemes/Berry 模板）。

**这个目录已经不在 bot 仓库里**：面板原先位于 `LKM-bot/dashboard/`，现已整体迁到社区站仓库
`LKM-official-website/bot-panel/`，构建产物由 Astro 托管在站点同域的 `/bot/` 前缀下。
LKM-bot 仓库只保留面板 API（`/bot/api/*` 由网关剥前缀后转发到 lkmbot），不再构建或下载前端。

## 目录与产物

| 项 | 位置 |
| --- | --- |
| 源码 | `LKM-official-website/bot-panel/src/` |
| 构建产物 | `LKM-official-website/public/bot/`（`vite.config.ts` 的 `outDir: '../public/bot'`） |
| 对外访问路径 | `/bot/`（构建期传 `VITE_BASE_PATH=/bot/`；默认 `/` 表示根路径） |
| 面板 API | `/bot/api/*` → 网关剥前缀 → `lkmbot:6185` |
| 生成代码 | `src/api/generated/` 由 `@hey-api/openapi-ts` 依 LKM-bot 的 OpenAPI 规范生成，**不要手改** |

## 本地开发

面板调的是 LKM-bot 后端的 API，所以先起后端（在 `LKM-bot` 仓库）：

```bash
uv sync
uv run main.py          # 监听 6185
```

再起面板（在本目录）：

```bash
pnpm install
pnpm dev                # vite --host，默认 http://localhost:3000
```

`vite.config.ts` 的 dev proxy 会把 `/api` 转发到 `http://127.0.0.1:6185`，并像生产网关一样剥掉
子路径前缀，保证 dev 与线上路径语义一致。后端地址不同时改 `vite.config.ts` 的 `server.proxy`。

## 构建

```bash
pnpm build              # mdi 字体子集 + vue-tsc --noEmit + vite build
pnpm build:deploy       # 同上但不做类型检查（镜像构建用）
VITE_BASE_PATH=/bot/ pnpm build:deploy   # 子路径部署的产物
```

生产镜像由本仓库 `Dockerfile` 的 `bot-panel` stage 完成：

```dockerfile
RUN pnpm install --frozen-lockfile && VITE_BASE_PATH=/bot/ pnpm build:deploy
COPY --from=bot-panel /public/bot ./public/bot
```

即升级面板只需要重建官网镜像（`docker compose build astro`），不必重建 lkmbot。
站点根 `package.json` 的 `build:bot-panel` = `cd bot-panel && pnpm install --frozen-lockfile && pnpm build`。

## 检查

```bash
pnpm typecheck                          # vue-tsc --noEmit
pnpm i18n:check                         # 中英文键集一致性（node scripts/check-i18n-keys.mjs）
node --test "tests/*.test.mjs"          # 纯函数与「防回潮」门禁
pnpm lint                               # eslint --fix
```

`tests/` 里的用例除了覆盖纯函数，还守着两类**运行期才暴露**的回归：子路径前缀必须经统一工具
补齐（裸 `fetch` / `WebSocket` / `EventSource` / iframe `src` 会被扫描拦下），以及构建脚本与
产物落点符合上表契约。

## 国际化

只支持 **简体中文（zh-CN）** 与 **英文（en-US）** 两种，基准语言是 zh-CN。
`pnpm i18n:check` 要求两种语言的键集完全一致，缺键或多键都会 FAILED。
`localStorage` 里残留的其他语言值会回落到 zh-CN。

## 已知边界

- 面板与社区站同域不同路径，浏览器可见的所有绝对路径都必须经 `src/api/base.ts` 与子路径工具
  补前缀，不要直接拼 `/api`。
- 生成代码（`src/api/generated/`）随 LKM-bot 的 OpenAPI 规范变化重新生成；接口变更时同步更新
  对应测试和文档。
- WebUI 顶部的更新入口通过后端 API 获取版本信息并触发升级，面板侧不读取发布地址类环境变量。
