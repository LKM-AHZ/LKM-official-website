"""Analytics service — record and query page view data."""

import hashlib

from models.database import get_conn


async def record_page_view(
    path: str,
    referrer: str | None = None,
    user_agent: str | None = None,
    ip: str | None = None,
) -> None:
    """Record a page view."""
    ip_hash = hashlib.sha256((ip or "unknown").encode()).hexdigest()[:16] if ip else None

    async with get_conn() as conn:
        await conn.execute(
            "INSERT INTO page_views (path, referrer, user_agent, ip_hash) VALUES ($1, $2, $3, $4)",
            path, referrer, user_agent, ip_hash,
        )


async def get_stats(days: int = 30) -> dict:
    async with get_conn() as conn:
        total = await conn.fetchval(
            "SELECT COUNT(*) FROM page_views WHERE created_at >= NOW() - INTERVAL '1 day' * $1",
            days,
        )

        top_pages = await conn.fetch(
            """SELECT path, COUNT(*) as views
               FROM page_views
               WHERE created_at >= NOW() - INTERVAL '1 day' * $1
               GROUP BY path
               ORDER BY views DESC
               LIMIT 20""",
            days,
        )

        daily = await conn.fetch(
            """SELECT DATE(created_at)::text as day, COUNT(*) as views
               FROM page_views
               WHERE created_at >= NOW() - INTERVAL '1 day' * $1
               GROUP BY day
               ORDER BY day""",
            days,
        )

    return {
        "total_views": total,
        "days": days,
        "top_pages": [dict(r) for r in top_pages],
        "daily_views": [dict(r) for r in daily],
    }
