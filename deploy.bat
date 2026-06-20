@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1

:: ============================================================
::  LKM Official Website — Windows 一键部署脚本
::  需要: Node.js >= 22.12.0, pnpm, Python >= 3.11, PostgreSQL
:: ============================================================

set "PROJECT_DIR=%~dp0"
set "BACKEND_DIR=%PROJECT_DIR%backend"
set "FRONTEND_PORT=4321"
set "BACKEND_PORT=8000"

:: ---------- 环境检测 ----------
echo [1/5] 检测运行环境...

where node >nul 2>&1 || (echo [ERROR] 未找到 Node.js, 请安装 Node.js >= 22.12.0 && pause && exit /b 1)
for /f "tokens=2 delims=v." %%a in ('node -v') do set "NODE_VER=%%a"
if %NODE_VER% LSS 22 (
    echo [WARN] Node.js 版本过低, 需要 >= 22.12.0, 当前:
    node -v
)

where pnpm >nul 2>&1 || (
    echo [INFO] 安装 pnpm...
    where npm >nul 2>&1 && npm install -g pnpm || corepack enable && corepack prepare pnpm@latest --activate
)

where uv >nul 2>&1 || (
    echo [INFO] 安装 uv...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-RestMethod https://astral.sh/uv/install.ps1 | Invoke-Expression"
)

set "PG_AVAILABLE=0"
where psql >nul 2>&1 && set "PG_AVAILABLE=1"
if %PG_AVAILABLE% EQU 0 (
    echo [WARN] 未找到 psql, 请确保 PostgreSQL 已安装并加入 PATH
)

echo        Node.js:
node -v
echo        pnpm:
pnpm -v 2>nul || echo        未安装
echo        uv:
uv --version 2>nul || echo      未安装
echo        Python:
uv run python --version 2>nul || echo  未安装

:: ---------- 环境变量（用户可修改） ----------
if not defined PG_HOST set "PG_HOST=localhost"
if not defined PG_PORT set "PG_PORT=5432"
if not defined PG_DATABASE set "PG_DATABASE=lkm"
if not defined PG_USER set "PG_USER=lkm"
if not defined PG_PASSWORD set "PG_PASSWORD=lkm123"

:: ---------- 前端依赖 ----------
echo.
echo [2/5] 安装前端依赖...
cd /d "%PROJECT_DIR%"
call pnpm install
if %errorlevel% neq 0 (
    echo [ERROR] 前端依赖安装失败
    pause
    exit /b 1
)

:: ---------- 后端依赖 ----------
echo.
echo [3/5] 安装后端依赖...
cd /d "%PROJECT_DIR%"
if not exist ".venv" (
    uv venv
)
uv pip install -r "%BACKEND_DIR%\requirements.txt"
if %errorlevel% neq 0 (
    echo [ERROR] 后端依赖安装失败
    pause
    exit /b 1
)

:: ---------- 数据库 ----------
echo.
echo [4/5] 检查数据库连接...

if %PG_AVAILABLE% EQU 1 (
    :: 尝试创建数据库（若不存在则忽略错误）
    psql -h %PG_HOST% -p %PG_PORT% -U %PG_USER% -d postgres -c "CREATE DATABASE %PG_DATABASE%;" 2>nul
    echo        数据库 %PG_DATABASE% 已就绪
) else (
    echo        [SKIP] 未检测到 psql, 跳过数据库创建, 请手动确保数据库 %PG_DATABASE% 存在
)

:: 测试数据库连接 (即使 psql 不可用也尝试，通过后端直连 PostgreSQL)
cd /d "%PROJECT_DIR%"
uv run python "%BACKEND_DIR%\test_db.py"
if %errorlevel% neq 0 (
    echo [WARN] 数据库连接测试失败，请检查 PostgreSQL 服务是否启动
)

:: ---------- 启动 ----------
echo.
echo [5/5] 启动服务...

:: 启动后端
echo        启动 FastAPI 后端 (port %BACKEND_PORT%)...
start "LKM Backend" cmd /c "cd /d "%PROJECT_DIR%" && uv run uvicorn backend.main:app --host 0.0.0.0 --port %BACKEND_PORT%""

:: 等待后端就绪
echo        等待后端启动...
timeout /t 2 >nul

:: 启动前端
echo        启动 Astro 前端 (port %FRONTEND_PORT%)...
cd /d "%PROJECT_DIR%"
start "LKM Frontend" cmd /c "pnpm run dev"

echo.
echo ============================================================
echo   LKM 官方网站已启动！
echo   前端: http://localhost:%FRONTEND_PORT%
echo   后端: http://localhost:%BACKEND_PORT%
echo   API 文档: http://localhost:%BACKEND_PORT%/docs
echo ============================================================
echo.
echo 按任意键停止服务...

pause >nul

:: 停止服务
taskkill /fi "WINDOWTITLE eq LKM Backend*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq LKM Frontend*" /f >nul 2>&1
echo 服务已停止。
endlocal
