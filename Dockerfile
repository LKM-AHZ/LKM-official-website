# Astro SSR 部署 Dockerfile
FROM node:24-alpine AS deps
WORKDIR /app
# .pnpmrc（shamefully-hoist）与 patches（tsup patch）均为 pnpm install 必需
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmrc ./
COPY patches/ ./patches/
# 全量安装：构建（astro build）需要 devDependencies（tailwindcss、@tailwindcss/vite 等）
RUN corepack enable && pnpm install --frozen-lockfile

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm run build

# ---------- 生产依赖（仅运行时所需，剔除 devDependencies） ----------
FROM node:24-alpine AS prod-deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .pnpmrc ./
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --prod

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
# 真实后端地址由运行时环境注入（如 -e API_URL=https://api.lkm.app），
# 服务端代码通过 process.env.API_URL 在运行时读取。

# standalone 服务入口 + 生产依赖 + 清单
# 属主在 COPY 时一次给到 node：下面那条 chown 是非递归的，只改 /app 目录本身，
# dist/ 与 node_modules/ 仍归 root，运行时往子目录写（sessions/日志/缓存）依旧 EACCES。
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=prod-deps /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package.json ./package.json

# /app 目录本身也归 node：Astro sessions 会在 /app 下新建 .astro/（目录级授权即可，无需 -R 复制整个 node_modules 层）
RUN chown node:node /app
# Astro standalone 服务未注册 SIGTERM handler，而 PID 1 收到「默认处置」的 SIGTERM 会被内核忽略：
# 没有 init 时 docker stop / k8s 删 Pod 只能等到超时被 SIGKILL，在途 SSR 请求全部丢弃。
RUN apk add --no-cache tini
# 以非 root 用户运行（node:alpine 内置 node 用户）
USER node
EXPOSE 4321

# 健康检查：请求静态 robots.txt（不依赖后端，避免误报）
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4321/robots.txt >/dev/null || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/server/entry.mjs"]
