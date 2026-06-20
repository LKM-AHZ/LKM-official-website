"""Comment system API."""

from fastapi import APIRouter, Form, HTTPException, Query
from models.database import get_conn

router = APIRouter(prefix="/api/comments", tags=["comments"])


def _row_to_dict(row: dict) -> dict:
    row["created_at"] = str(row["created_at"])
    row["replies"] = []
    return row


@router.get("")
async def list_comments(
    post_slug: str = Query(..., description="Blog post slug"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    async with get_conn() as conn:
        total = await conn.fetchval(
            "SELECT COUNT(*) FROM comments WHERE post_slug = $1 AND is_approved = TRUE AND parent_id IS NULL",
            post_slug,
        )

        rows = await conn.fetch(
            """SELECT id, post_slug, author, content, parent_id, created_at
               FROM comments
               WHERE post_slug = $1 AND is_approved = TRUE
               ORDER BY created_at ASC""",
            post_slug,
        )

    # Build nested comment tree
    comments = [_row_to_dict(dict(r)) for r in rows]
    root_comments = []
    children_map = {}

    for c in comments:
        if c["parent_id"]:
            children_map.setdefault(c["parent_id"], []).append(c)
        else:
            root_comments.append(c)

    for c in comments:
        if c["id"] in children_map:
            c["replies"] = children_map[c["id"]]

    return {"comments": root_comments, "total": total, "page": page, "page_size": page_size}


@router.post("")
async def create_comment(
    post_slug: str = Form(...),
    author: str = Form(...),
    email: str = Form(""),
    content: str = Form(...),
    parent_id: int | None = Form(None),
):
    if not author.strip():
        raise HTTPException(status_code=400, detail="昵称不能为空")
    if not content.strip():
        raise HTTPException(status_code=400, detail="评论内容不能为空")
    if len(content) > 2000:
        raise HTTPException(status_code=400, detail="评论内容不能超过2000字")

    async with get_conn() as conn:
        if parent_id is not None:
            parent = await conn.fetchrow(
                "SELECT id FROM comments WHERE id = $1 AND is_approved = TRUE",
                parent_id,
            )
            if not parent:
                raise HTTPException(status_code=400, detail="回复的评论不存在")

        row = await conn.fetchrow(
            """INSERT INTO comments (post_slug, author, email, content, parent_id)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING id, post_slug, author, content, parent_id, created_at""",
            post_slug.strip(), author.strip(), email.strip(), content.strip(), parent_id,
        )

    result = _row_to_dict(dict(row))
    return {"ok": True, "comment": result}
