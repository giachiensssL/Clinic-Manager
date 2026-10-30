import asyncio
from app.core.database import SessionLocal
from app.models.models import User, UserRole
from app.services.ai_core_service import ai_core_service

async def test():
    async with SessionLocal() as db:
        # Get a doctor user
        from sqlalchemy import select
        result = await db.execute(select(User).where(User.role == UserRole.DOCTOR))
        user = result.scalars().first()
        
        if not user:
            print("No doctor found")
            return
            
        print(f"Testing with user: {user.email}")
        
        try:
            async for chunk in ai_core_service.process_chat_stream(db, user, "Gợi ý phác đồ"):
                print(chunk)
        except Exception as e:
            print(f"Outer Exception: {e}")

asyncio.run(test())
