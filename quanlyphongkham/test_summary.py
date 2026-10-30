import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import sys
import os

sys.path.append(os.getcwd() + '/backend')
from app.services.ai_tool_registry import ai_tool_registry
from app.models.models import User

async def main():
    engine = create_async_engine("sqlite+aiosqlite:///backend/clinic.db")
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as db:
        result = await db.execute(select(User).where(User.role == 'doctor'))
        user = result.scalars().first()
        if not user: return
            
        try:
            res = await ai_tool_registry._handle_get_patient_summary(db, user, {"patient_name_or_id": "Nguyễn Văn A"})
            print("Summary works!")
        except Exception as e:
            import traceback
            traceback.print_exc()

from sqlalchemy import select
asyncio.run(main())
