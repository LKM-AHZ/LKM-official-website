"""Event management API."""

from fastapi import APIRouter, Form, HTTPException, Query
from models.database import get_conn

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("")
async def list_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    category: str | None = None,
    upcoming: bool = False,
):
    async with get_conn() as conn:
        params = []
        conditions = ["is_published = TRUE"]
        param_idx = 1

        if category:
            conditions.append(f"category = ${param_idx}")
            params.append(category)
            param_idx += 1
        if upcoming:
            conditions.append("event_date >= NOW()")

        where = " AND ".join(conditions)

        total = await conn.fetchval(f"SELECT COUNT(*) FROM events WHERE {where}", *params)

        rows = await conn.fetch(
            f"""SELECT id, title, description, event_date, end_date, location,
                       category, max_participants, cover_image, created_at
                FROM events WHERE {where}
                ORDER BY event_date {'ASC' if upcoming else 'DESC'}
                LIMIT ${param_idx} OFFSET ${param_idx + 1}""",
            *params, page_size, (page - 1) * page_size,
        )

    return {
        "events": [dict(r) for r in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{event_id}")
async def get_event(event_id: int):
    async with get_conn() as conn:
        row = await conn.fetchrow(
            "SELECT * FROM events WHERE id = $1 AND is_published = TRUE",
            event_id,
        )
        if not row:
            raise HTTPException(status_code=404, detail="活动不存在")

        reg_count = await conn.fetchval(
            "SELECT COUNT(*) FROM event_registrations WHERE event_id = $1",
            event_id,
        )

    result = dict(row)
    result["registration_count"] = reg_count
    return result


@router.post("/{event_id}/register")
async def register_event(
    event_id: int,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(""),
    notes: str = Form(""),
):
    if not name.strip():
        raise HTTPException(status_code=400, detail="姓名不能为空")
    if not email.strip() or "@" not in email:
        raise HTTPException(status_code=400, detail="请输入有效的邮箱地址")

    async with get_conn() as conn:
        event = await conn.fetchrow(
            "SELECT id, max_participants, title, event_date FROM events WHERE id = $1 AND is_published = TRUE",
            event_id,
        )
        if not event:
            raise HTTPException(status_code=404, detail="活动不存在")

        if event["event_date"] < "now()":
            raise HTTPException(status_code=400, detail="活动已过期，无法报名")

        if event["max_participants"]:
            count = await conn.fetchval(
                "SELECT COUNT(*) FROM event_registrations WHERE event_id = $1",
                event_id,
            )
            if count >= event["max_participants"]:
                raise HTTPException(status_code=400, detail="报名人数已满")

        # Check for duplicate registration
        existing = await conn.fetchval(
            "SELECT id FROM event_registrations WHERE event_id = $1 AND email = $2",
            event_id, email.strip(),
        )
        if existing:
            raise HTTPException(status_code=400, detail="您已报名该活动")

        await conn.execute(
            "INSERT INTO event_registrations (event_id, name, email, phone, notes) VALUES ($1, $2, $3, $4, $5)",
            event_id, name.strip(), email.strip(), phone.strip(), notes.strip(),
        )

    return {"ok": True, "message": f"已成功报名「{event['title']}」"}
