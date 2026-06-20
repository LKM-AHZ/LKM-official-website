#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  LKM Official Website — Linux 一键部署脚本
#  需要: Node.js >= 22.12.0, pnpm, Python >= 3.11, PostgreSQL
#  可通过环境变量覆盖:
#    PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD
#    FRONTEND_PORT, BACKEND_PORT
# ============================================================

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_PORT="${FRONTEND_PORT:-4321}"
BACKEND_PORT="${BACKEND_PORT:-8000}"

# ---------- 数据库配置（可通过环境变量覆盖） ----------
PG_HOST="${PG_HOST:-localhost}"
PG_PORT="${PG_PORT:-5432}"
PG_DATABASE="${PG_DATABASE:-lkm}"
PG_USER="${PG_USER:-lkm}"
PG_PASSWORD="${PG_PASSWORD:-lkm123}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cleanup() {
    local ret=$?
    echo ""
    echo -e "${YELLOW}正在停止服务...${NC}"
    [ -n "${BACKEND_PID:-}" ] && kill "$BACKEND_PID" 2>/dev/null
    [ -n "${FRONTEND_PID:-}" ] && kill "$FRONTEND_PID" 2>/dev/null
    echo -e "${GREEN}服务已停止。${NC}"
    exit "$ret"
}
trap cleanup SIGINT SIGTERM

# ---------- 1. 环境检测 ----------
echo -e "${GREEN}[1/5] 检测运行环境...${NC}"

if ! command -v node &>/dev/null; then
    echo -e "${RED}[ERROR] 未找到 Node.js, 请安装 Node.js >= 22.12.0${NC}"
    exit 1
fi
NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 22 ]; then
    echo -e "${YELLOW}[WARN] Node.js 版本过低 ($(node -v)), 需要 >= 22.12.0${NC}"
fi

if ! command -v pnpm &>/dev/null; then
    echo -e "${YELLOW}[INFO] 安装 pnpm...${NC}"
    if command -v npm &>/dev/null; then
        npm install -g pnpm
    elif command -v corepack &>/dev/null; then
        corepack enable && corepack prepare pnpm@latest --activate
    else
        echo -e "${RED}[ERROR] 无法安装 pnpm，请手动安装 Node.js >= 22.12.0${NC}"
        exit 1
    fi
    hash -r 2>/dev/null || rehash 2>/dev/null || true
fi

if ! command -v uv &>/dev/null; then
    echo -e "${YELLOW}[INFO] 安装 uv...${NC}"
    curl -LsSf https://astral.sh/uv/install.sh | bash
    export PATH="$HOME/.local/bin:$PATH"
    hash -r 2>/dev/null || rehash 2>/dev/null || true
fi

PG_CLI=""
if command -v psql &>/dev/null; then
    PG_CLI="psql"
elif command -v createdb &>/dev/null; then
    PG_CLI="createdb"
else
    echo -e "${YELLOW}[WARN] 未找到 psql/createdb, 请确保 PostgreSQL 客户端已安装${NC}"
fi

# 刷新 PATH 后重新确认
echo "        Node.js: $(node -v)"
echo "        pnpm:    $(pnpm -v 2>/dev/null || echo 'N/A')"
echo "        uv:      $(uv --version 2>/dev/null || echo 'N/A')"
echo "        Python:  $(uv run python --version 2>/dev/null || echo 'N/A')"

# ---------- 2. 前端依赖 ----------
echo ""
echo -e "${GREEN}[2/5] 安装前端依赖...${NC}"
cd "$PROJECT_DIR"
pnpm install

# ---------- 3. 后端依赖 ----------
echo ""
echo -e "${GREEN}[3/5] 安装后端依赖...${NC}"
cd "$PROJECT_DIR"
if [ ! -d ".venv" ]; then
    uv venv
fi
uv pip install -r "$BACKEND_DIR/requirements.txt"

# ---------- 4. 数据库 ----------
echo ""
echo -e "${GREEN}[4/5] 检查数据库连接...${NC}"

if [ -n "$PG_CLI" ]; then
    # 尝试创建数据库（若不存在则忽略错误）
    if [ "$PG_CLI" = "createdb" ]; then
        PGPASSWORD="$PG_PASSWORD" createdb -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" "$PG_DATABASE" 2>/dev/null || true
    else
        PGPASSWORD="$PG_PASSWORD" psql -h "$PG_HOST" -p "$PG_PORT" -U "$PG_USER" -d postgres -c "CREATE DATABASE $PG_DATABASE;" 2>/dev/null || true
    fi
    echo "        数据库 $PG_DATABASE 已就绪"
else
    echo "        [SKIP] 未检测到 psql/createdb, 跳过数据库创建, 请手动确保数据库 $PG_DATABASE 存在"
fi

# 测试数据库连接
cd "$PROJECT_DIR"
uv run python "$BACKEND_DIR/test_db.py" || echo -e "${YELLOW}[WARN] 数据库连接测试失败，请检查 PostgreSQL 服务是否启动${NC}"

# ---------- 5. 启动 ----------
echo ""
echo -e "${GREEN}[5/5] 启动服务...${NC}"

# 启动后端
echo "        启动 FastAPI 后端 (port $BACKEND_PORT)..."
cd "$PROJECT_DIR"
uv run uvicorn backend.main:app --host 0.0.0.0 --port "$BACKEND_PORT" &
BACKEND_PID=$!

# 等待后端就绪
sleep 2

# 启动前端
echo "        启动 Astro 前端 (port $FRONTEND_PORT)..."
cd "$PROJECT_DIR"
if [ -n "${FRONTEND_PORT:-}" ]; then
    pnpm run dev -- --port "$FRONTEND_PORT" &
else
    pnpm run dev &
fi
FRONTEND_PID=$!

echo ""
echo -e "============================================================"
echo -e "  LKM 官方网站已启动！"
echo -e "  前端:     ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "  后端:     ${GREEN}http://localhost:$BACKEND_PORT${NC}"
echo -e "  API 文档: ${GREEN}http://localhost:$BACKEND_PORT/docs${NC}"
echo -e "============================================================"
echo ""
echo -e "按 ${YELLOW}Ctrl+C${NC} 停止服务..."

# 等待前端/后端进程
wait
