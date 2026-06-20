"""Test PostgreSQL database connection and backend CRUD operations."""

import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

# 强制 UTF-8 输出，避免 Windows GBK 编码问题
sys.stdout.reconfigure(encoding="utf-8")

from models.database import get_pool, init_db, close_pool


async def test_connection():
    print(f"Config: host={os.environ.get('PG_HOST', 'localhost')}, "
          f"port={os.environ.get('PG_PORT', '5432')}, "
          f"database={os.environ.get('PG_DATABASE', 'lkm')}, "
          f"user={os.environ.get('PG_USER', 'lkm')}")

    pool = await get_pool()
    print("[OK] Connection pool created")

    async with pool.acquire() as conn:
        version = await conn.fetchval("SELECT version()")
        print(f"[OK] PostgreSQL version: {version.split(',')[0]}")

        tables = await conn.fetch(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
        )
        print(f"[OK] Tables ({len(tables)}):")
        for t in tables:
            print(f"    - {t['table_name']}")


async def test_init_db():
    await init_db()
    print("[OK] Tables initialized")


async def test_crud():
    pool = await get_pool()
    async with pool.acquire() as conn:
        contact = await conn.fetchrow(
            "INSERT INTO contacts (name, email, message) VALUES ($1, $2, $3) RETURNING id, name, email",
            "test_user", "test@example.com", "test message"
        )
        print(f"[OK] Insert contacts: id={contact['id']}, name={contact['name']}")

        rows = await conn.fetchval("SELECT COUNT(*) FROM contacts")
        print(f"[OK] contacts row count: {rows}")

        await conn.execute("DELETE FROM contacts WHERE email = $1", "test@example.com")
        print("[OK] Test data cleaned up")


async def main():
    print("=" * 50)
    print("LKM Backend PostgreSQL DB Test")
    print("=" * 50)

    try:
        await test_connection()
        await test_init_db()
        await test_crud()
        print("\n" + "=" * 50)
        print("[OK] All database tests passed!")
    except Exception as e:
        print(f"\n[FAIL] Test failed: {e}")
        raise
    finally:
        await close_pool()
        print("Connection pool closed")


if __name__ == "__main__":
    asyncio.run(main())
