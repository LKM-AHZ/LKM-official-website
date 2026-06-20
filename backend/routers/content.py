"""Dynamic content management API."""

import os

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from models.database import get_conn

router = APIRouter(prefix="/api/content", tags=["content"])


class ContentUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    meta_description: str | None = None
    is_published: bool | None = None


def _get_admin_key() -> str:
    return os.environ.get("ADMIN_API_KEY", "lkm-admin-secret-key")


@router.get("/{slug}")
async def get_content(slug: str):
    async with get_conn() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM contents WHERE slug = $1 AND is_published = TRUE",
            slug,
        )
    if not row:
        raise HTTPException(status_code=404, detail="内容不存在")
    return dict(row)


@router.get("")
async def list_contents(
    type: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    async with get_conn() as conn:
        params = []
        conditions = ["is_published = TRUE"]
        param_idx = 1

        if type:
            conditions.append(f"type = ${param_idx}")
            params.append(type)
            param_idx += 1

        where = " AND ".join(conditions)

        total = await conn.fetchval(f"SELECT COUNT(*) FROM contents WHERE {where}", *params)
        rows = await conn.fetch(
            f"SELECT id, slug, title, type, meta_description, created_at, updated_at FROM contents WHERE {where} ORDER BY updated_at DESC LIMIT ${param_idx} OFFSET ${param_idx + 1}",
            *params, page_size, (page - 1) * page_size,
        )

    return {"contents": [dict(r) for r in rows], "total": total, "page": page, "page_size": page_size}


@router.put("/{slug}")
async def upsert_content(slug: str, data: ContentUpdate, api_key: str = Query(...)):
    if api_key != _get_admin_key():
        raise HTTPException(status_code=403, detail="无效的管理员密钥")

    async with get_conn() as conn:
        existing = await conn.fetchval("SELECT id FROM contents WHERE slug = $1", slug)

        if existing:
            updates = []
            params = []
            param_idx = 1

            if data.title is not None:
                updates.append(f"title = ${param_idx}")
                params.append(data.title)
                param_idx += 1
            if data.body is not None:
                updates.append(f"body = ${param_idx}")
                params.append(data.body)
                param_idx += 1
            if data.meta_description is not None:
                updates.append(f"meta_description = ${param_idx}")
                params.append(data.meta_description)
                param_idx += 1
            if data.is_published is not None:
                updates.append(f"is_published = ${param_idx}")
                params.append(data.is_published)
                param_idx += 1

            if updates:
                updates.append("updated_at = NOW()")
                params.append(slug)
                await conn.execute(
                    f"UPDATE contents SET {', '.join(updates)} WHERE slug = ${param_idx}",
                    *params,
                )
        else:
            await conn.execute(
                "INSERT INTO contents (slug, title, body, type, meta_description, is_published) VALUES ($1, $2, $3, 'page', $4, TRUE)",
                slug, data.title or slug, data.body or "", data.meta_description or "",
            )

    return {"ok": True, "slug": slug}
