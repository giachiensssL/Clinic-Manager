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
        # Get a doctor user
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.role == 'doctor'))
        user = result.scalars().first()
        
        if not user:
            print("No doctor found")
            return
            
        print(f"Testing for doctor user {user.username}")
        try:
            res = await ai_tool_registry._handle_get_doctor_schedule(db, user, {})
            print("Result:", res)
        except Exception as e:
            import traceback
            traceback.print_exc()

asyncio.run(main())
