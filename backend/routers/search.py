"""Search API router."""

import os

from fastapi import APIRouter, HTTPException, Query
from services.search import search_engine

router = APIRouter(prefix="/api/search", tags=["search"])


def _get_admin_key() -> str:
    return os.environ.get("ADMIN_API_KEY", "lkm-admin-secret-key")


@router.get("")
async def search(
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(20, ge=1, le=50),
):
    results = await search_engine.search(q, limit)
    return {
        "query": q,
        "total": len(results),
        "results": [
            {"type": r.type, "title": r.title, "snippet": r.snippet, "url": r.url, "score": r.score}
            for r in results
        ],
    }
