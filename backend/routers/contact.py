"""Contact form API."""

from fastapi import APIRouter, Form, HTTPException
from models.database import get_conn

router = APIRouter(prefix="/api/contact", tags=["contact"])


@router.post("")
async def submit_contact(
    name: str = Form(...),
    email: str = Form(...),
    message: str = Form(...),
):
    if not name.strip():
        raise HTTPException(status_code=400, detail="姓名不能为空")
    if not email.strip() or "@" not in email:
        raise HTTPException(status_code=400, detail="请输入有效的邮箱地址")
    if not message.strip():
        raise HTTPException(status_code=400, detail="留言内容不能为空")

    async with get_conn() as conn:
        await conn.execute(
            "INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3)",
            name.strip(), email.strip(), message.strip(),
        )

    return {"ok": True, "message": "感谢您的留言，我们会尽快回复！"}
