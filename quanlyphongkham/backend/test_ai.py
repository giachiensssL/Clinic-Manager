import asyncio
from app.core.database import AsyncSessionLocal
from app.services.ai_core_service import ai_core_service
from app.models.models import User
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        user = (await db.execute(select(User).where(User.username == 'patient'))).scalar_one()
        try:
            res = await ai_core_service.process_chat(db, user, "Khám bệnh")
            print(res)
        except Exception as e:
            import traceback
            traceback.print_exc()

asyncio.run(main())
