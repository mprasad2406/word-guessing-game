import asyncio
from app.db.session import async_engine
from sqlalchemy import text

async def main():
    async with async_engine.connect() as conn:
        res = await conn.execute(text("DESCRIBE game_sessions"))
        cols = res.fetchall()
        print("Columns in game_sessions:")
        for c in cols:
            print(" ", c)

        res = await conn.execute(text("SELECT id, public_id, status FROM game_sessions LIMIT 5"))
        print("Sample rows:")
        for r in res.fetchall():
            print(" ", r)

if __name__ == "__main__":
    asyncio.run(main())
