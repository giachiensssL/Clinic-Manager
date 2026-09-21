import os
import re

registry_file = "app/services/ai_tool_registry.py"
with open(registry_file, "r", encoding="utf-8") as f:
    content = f.read()

handler_code = """
    async def _handle_search_doctors(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import User, UserRole
        from sqlalchemy import select
        
        stmt = select(User).where(User.role == UserRole.DOCTOR, User.is_active == True)
        specialty = args.get("specialty", "")
        
        docs = (await db.execute(stmt)).scalars().all()
        
        data = []
        for d in docs:
            data.append({
                "id": d.id,
                "name": d.full_name,
                "phone": d.phone_number,
                "email": d.email,
                "bio": "Bác sĩ chuyên khoa tại AI Clinic."
            })
            
        return {"doctors": data, "message": f"Tìm thấy {len(data)} bác sĩ."}
"""

if "    def get_tool_schema" in content:
    content = content.replace("    def get_tool_schema", handler_code + "\n    def get_tool_schema")

with open(registry_file, "w", encoding="utf-8") as f:
    f.write(content)

print("fixed handler placement")
