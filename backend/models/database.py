"""PostgreSQL database connection and initialization via asyncpg."""

import asyncio
import os
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import asyncpg

logger = logging.getLogger("lkm.db")

DB_CONFIG = {
    "host": os.environ.get("PG_HOST", "localhost"),
    "port": int(os.environ.get("PG_PORT", "5432")),
    "user": os.environ.get("PG_USER", "lkm"),
    "password": os.environ.get("PG_PASSWORD", "lkm123"),
    "database": os.environ.get("PG_DATABASE", "lkm"),
}

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    """Get or create the connection pool with retry."""
    global _pool
    if _pool is None:
        for attempt in range(5):
            try:
                _pool = await asyncpg.create_pool(**DB_CONFIG, min_size=1, max_size=10)
                logger.info("Connected to PostgreSQL")
                break
            except Exception as e:
                logger.warning(f"DB connection attempt {attempt + 1} failed: {e}")
                if attempt < 4:
                    await asyncio.sleep(1)
                else:
                    raise
    return _pool


async def close_pool() -> None:
    """Close the connection pool."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


@asynccontextmanager
async def get_conn() -> AsyncGenerator[asyncpg.Connection, None]:
    """Get a connection from the pool as a context manager."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn


async def init_db() -> None:
    """Create all tables if they don't exist."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS contacts (
                id SERIAL PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                is_read BOOLEAN DEFAULT FALSE
            );

            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                post_slug TEXT NOT NULL,
                author TEXT NOT NULL,
                email TEXT,
                content TEXT NOT NULL,
                parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
                is_approved BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_slug);
            CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

            CREATE TABLE IF NOT EXISTS events (
                id SERIAL PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                event_date TIMESTAMPTZ NOT NULL,
                end_date TIMESTAMPTZ,
                location TEXT,
                category TEXT DEFAULT '讲座',
                max_participants INTEGER,
                cover_image TEXT,
                is_published BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS event_registrations (
                id SERIAL PRIMARY KEY,
                event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                notes TEXT,
                status TEXT DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(event_id, email)
            );

            CREATE TABLE IF NOT EXISTS contents (
                id SERIAL PRIMARY KEY,
                slug TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                body TEXT,
                type TEXT DEFAULT 'page',
                is_published BOOLEAN DEFAULT TRUE,
                meta_description TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_contents_slug ON contents(slug);

            CREATE TABLE IF NOT EXISTS uploads (
                id SERIAL PRIMARY KEY,
                filename TEXT NOT NULL,
                original_name TEXT NOT NULL,
                mime_type TEXT,
                file_size INTEGER,
                category TEXT DEFAULT 'general',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS page_views (
                id SERIAL PRIMARY KEY,
                path TEXT NOT NULL,
                referrer TEXT,
                user_agent TEXT,
                ip_hash TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
            CREATE INDEX IF NOT EXISTS idx_page_views_date ON page_views(created_at);
        """)
