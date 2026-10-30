import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import sys
import os
from sqlalchemy import select

sys.path.append(os.getcwd() + '/backend')
from app.models.models import Base

async def main():
    engine = create_async_engine("sqlite+aiosqlite:///backend/clinic.db")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        for name, cls in Base.metadata.tables.items():
            try:
                await db.execute(cls.select().limit(1))
                print(f"Table {name} is OK")
            except Exception as e:
                print(f"Table {name} failed schema check!")
                print(e)

asyncio.run(main())
