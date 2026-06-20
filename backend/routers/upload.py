"""File upload API."""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse
from models.database import get_conn

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
ALLOWED_MIMES = {
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
    "application/pdf",
    "text/plain", "text/markdown", "text/csv",
    "application/zip", "application/x-7z-compressed", "application/x-rar-compressed",
}
MAX_SIZE = 10 * 1024 * 1024  # 10 MB

router = APIRouter(prefix="/api/upload", tags=["upload"])


def _get_admin_key() -> str:
    return os.environ.get("ADMIN_API_KEY", "lkm-admin-secret-key")


@router.post("")
async def upload_file(
    file: UploadFile = File(...),
    category: str = Query("general"),
    api_key: str = Query(...),
):
    if api_key != _get_admin_key():
        raise HTTPException(status_code=403, detail="无效的管理员密钥")

    if file.content_type not in ALLOWED_MIMES:
        raise HTTPException(status_code=400, detail=f"不支持的文件类型: {file.content_type}")

    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="文件大小不能超过 10MB")

    ext = Path(file.filename or "file").suffix
    saved_name = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / saved_name
    save_path.write_bytes(content)

    async with get_conn() as conn:
        await conn.execute(
            "INSERT INTO uploads (filename, original_name, mime_type, file_size, category) VALUES ($1, $2, $3, $4, $5)",
            saved_name, file.filename, file.content_type, len(content), category,
        )

    return {
        "ok": True,
        "filename": saved_name,
        "original_name": file.filename,
        "url": f"/api/upload/{saved_name}",
        "size": len(content),
    }


@router.get("/{filename}")
async def serve_file(filename: str):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")

    if file_path.resolve().parent != UPLOAD_DIR.resolve():
        raise HTTPException(status_code=403, detail="禁止访问")

    return FileResponse(str(file_path))


@router.get("")
async def list_uploads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str | None = None,
    api_key: str = Query(...),
):
    if api_key != _get_admin_key():
        raise HTTPException(status_code=403, detail="无效的管理员密钥")

    async with get_conn() as conn:
        if category:
            total = await conn.fetchval("SELECT COUNT(*) FROM uploads WHERE category = $1", category)
            rows = await conn.fetch(
                "SELECT * FROM uploads WHERE category = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
                category, page_size, (page - 1) * page_size,
            )
        else:
            total = await conn.fetchval("SELECT COUNT(*) FROM uploads")
            rows = await conn.fetch(
                "SELECT * FROM uploads ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                page_size, (page - 1) * page_size,
            )

    return {"files": [dict(r) for r in rows], "total": total, "page": page, "page_size": page_size}
