import time
import asyncio
from app.core.database import AsyncSessionLocal
from app.services.ai_core_service import ai_core_service
from app.models.models import User, UserRole

async def test():
    async with AsyncSessionLocal() as db:
        user = User(id="test_user", role=UserRole.PATIENT, username="test_patient")
        t1 = time.time()
        print("Sending request...")
        result = await ai_core_service.process_chat(db, user, "Hello")
        t2 = time.time()
        print(f"Time taken: {t2 - t1} seconds")

if __name__ == '__main__':
    asyncio.run(test())
