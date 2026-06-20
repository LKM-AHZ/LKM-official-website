#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  LKM Official Website — Linux 生产构建部署脚本
#  构建前端静态产物 + 启动后端 (uvicorn + nginx / 独立)
# ============================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
DIST_DIR="$PROJECT_DIR/dist"
BACKEND_PORT="${BACKEND_PORT:-8000}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cleanup() {
    echo ""
    echo -e "${YELLOW}正在停止后端服务...${NC}"
    [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null
    [ -n "${NGINX_PID:-}" ] && kill "$NGINX_PID" 2>/dev/null
    echo -e "${GREEN}服务已停止。${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  LKM 官方网站 — 生产构建${NC}"
echo -e "${GREEN}============================================================${NC}"

# ---------- 1. 构建前端 ----------
echo ""
echo -e "${GREEN}[1/3] 构建前端静态文件...${NC}"
cd "$PROJECT_DIR"
pnpm install
pnpm run build
echo -e "${GREEN}       构建完成 -> $DIST_DIR${NC}"

# ---------- 2. 后端依赖 ----------
echo ""
echo -e "${GREEN}[2/3] 准备后端...${NC}"
cd "$BACKEND_DIR"
if [ ! -d ".venv" ]; then
    uv venv
fi
uv pip install -r requirements.txt

# ---------- 3. 启动 ----------
echo ""
echo -e "${GREEN}[3/3] 启动生产服务...${NC}"

if command -v nginx &>/dev/null; then
    # 用 nginx 托管前端静态文件
    echo "        使用 nginx 托管前端静态文件..."

    NGINX_CONF="$PROJECT_DIR/nginx-server.conf"
    cat > "$NGINX_CONF" << NGINXEOF
worker_processes auto;
error_log /dev/stderr warn;
pid /tmp/lkm-nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    sendfile on;
    gzip on;
    gzip_min_length 1000;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    server {
        listen ${FRONTEND_PORT:-8080};
        server_name _;
        root $DIST_DIR;
        index index.html;

        # API 代理到后端
        location /api/ {
            proxy_pass http://127.0.0.1:$BACKEND_PORT;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }

        location / {
            try_files \$uri \$uri/index.html =404;
        }
    }
}
NGINXEOF

    cd "$BACKEND_DIR"
    uv run uvicorn main:app --host 127.0.0.1 --port "$BACKEND_PORT" &
    BACKEND_PID=$!

    nginx -c "$NGINX_CONF" -p /tmp &
    NGINX_PID=$!

    echo ""
    echo -e "============================================================"
    echo -e "  生产服务已启动！"
    echo -e "  网站:     ${GREEN}http://localhost:${FRONTEND_PORT:-8080}${NC}"
    echo -e "  API:      ${GREEN}http://localhost:${FRONTEND_PORT:-8080}/api/${NC}"
    echo -e "  后端直接: ${GREEN}http://localhost:$BACKEND_PORT${NC}"
    echo -e "============================================================"
else
    # 无 nginx 时用 Python 简易服务器 + 后端
    echo -e "${YELLOW}        未找到 nginx, 使用 python HTTP server 托管静态文件${NC}"

    cd "$DIST_DIR"
    uv run python -m http.server "${FRONTEND_PORT:-8080}" &
    FRONTEND_PID=$!

    cd "$BACKEND_DIR"
    uv run uvicorn main:app --host 0.0.0.0 --port "$BACKEND_PORT" &
    BACKEND_PID=$!

    echo ""
    echo -e "============================================================"
    echo -e "  生产服务已启动 (简易模式)！"
    echo -e "  网站:     ${GREEN}http://localhost:${FRONTEND_PORT:-8080}${NC}"
    echo -e "  API:      ${GREEN}http://localhost:$BACKEND_PORT${NC}"
    echo -e "============================================================"
fi

echo ""
echo -e "按 ${YELLOW}Ctrl+C${NC} 停止服务..."

wait
