import sys, io, asyncio, traceback
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, '.')
import warnings
warnings.filterwarnings("ignore")

# Setup database
import os
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./clinic.db")

async def main():
    from app.core.database import AsyncSessionLocal
    from app.services.ai_core_service import ai_core_service
    from app.models.models import User, UserRole
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        # Get admin user
        result = await db.execute(select(User).where(User.username == "admin"))
        user = result.scalar_one_or_none()
        if not user:
            print("ERROR: admin user not found")
            return
        
        print(f"Testing with user: {user.username} ({user.role.value})")
        print("Starting stream...\n")
        
        try:
            chunks = []
            async for chunk in ai_core_service.process_chat_stream(db, user, "xin chao", None):
                print(f"CHUNK: {chunk}")
                chunks.append(chunk)
        except Exception as e:
            print(f"EXCEPTION: {type(e).__name__}: {e}")
            traceback.print_exc()

asyncio.run(main())
