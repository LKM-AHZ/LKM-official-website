"""Search service — PostgreSQL full-text search."""

from dataclasses import dataclass

from models.database import get_conn


@dataclass
class SearchResult:
    type: str
    title: str
    snippet: str
    url: str
    date: str | None = None
    score: float = 0.0


class SearchEngine:
    """Full-text search using PostgreSQL tsvector."""

    async def search(self, query: str, limit: int = 20) -> list[SearchResult]:
        if not query.strip():
            return []

        # Use plainto_tsquery for Chinese safety; fallback to simple dict
        async with get_conn() as conn:
            # Ensure pg_trgm for fuzzy matching
            await conn.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")

            rows = await conn.fetch(
                """SELECT * FROM (
                    SELECT 'page' AS source_type, slug AS source_id, title,
                           COALESCE(left(body, 200), '') AS snippet,
                           similarity(title || ' ' || COALESCE(body, ''), $1) AS score,
                           updated_at AS date
                    FROM contents WHERE is_published = TRUE
                      AND (title ILIKE '%' || $1 || '%' OR body ILIKE '%' || $1 || '%')
                    UNION ALL
                    SELECT 'event' AS source_type, id::text AS source_id, title,
                           COALESCE(left(description, 200), '') AS snippet,
                           similarity(title || ' ' || COALESCE(description, ''), $1) AS score,
                           event_date AS date
                    FROM events WHERE is_published = TRUE
                      AND (title ILIKE '%' || $1 || '%' OR description ILIKE '%' || $1 || '%')
                ) results
                ORDER BY score DESC
                LIMIT $2""",
                query, limit,
            )

        results = []
        for row in rows:
            d = dict(row)
            results.append(SearchResult(
                type=d["source_type"],
                title=d["title"],
                snippet=d["snippet"] or "",
                url=self._build_url(d["source_type"], d["source_id"]),
                date=str(d.get("date")) if d.get("date") else None,
                score=float(d["score"]) if d.get("score") else 0.0,
            ))

        return results

    def _build_url(self, source_type: str, source_id: str) -> str:
        if source_type == "page":
            return f"/{source_id}"
        elif source_type == "event":
            return f"/events#{source_id}"
        return "/"


search_engine = SearchEngine()
