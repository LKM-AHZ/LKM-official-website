"""Analytics API router."""

from fastapi import APIRouter, HTTPException, Query, Request
from services.analytics import record_page_view, get_stats

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _get_admin_key() -> str:
    import os
    return os.environ.get("ADMIN_API_KEY", "lkm-admin-secret-key")


@router.post("/track")
async def track_page_view(request: Request):
    body = await request.json()
    path = body.get("path", "/")
    referrer = body.get("referrer")
    user_agent = request.headers.get("user-agent")
    ip = request.client.host if request.client else None

    await record_page_view(path, referrer, user_agent, ip)
    return {"ok": True}


@router.get("/stats")
async def get_analytics(api_key: str = Query(...), days: int = Query(30, ge=1, le=365)):
    if api_key != _get_admin_key():
        raise HTTPException(status_code=403, detail="无效的管理员密钥")

    return await get_stats(days)
