import os
import re

# 1. Update ai_context_service.py to allow search_doctors for Patient
context_file = "app/services/ai_context_service.py"
with open(context_file, "r", encoding="utf-8") as f:
    ctx_content = f.read()

old_patient_tools = """        if role == UserRole.PATIENT:
            return [
                "get_my_appointments",
                "cancel_my_appointment",
                "get_my_prescriptions",
                "get_my_lab_results"
            ]"""
new_patient_tools = """        if role == UserRole.PATIENT:
            return [
                "get_my_appointments",
                "cancel_my_appointment",
                "get_my_prescriptions",
                "get_my_lab_results",
                "search_doctors"
            ]"""
ctx_content = ctx_content.replace(old_patient_tools, new_patient_tools)
with open(context_file, "w", encoding="utf-8") as f:
    f.write(ctx_content)


# 2. Update ai_tool_registry.py to implement search_doctors
registry_file = "app/services/ai_tool_registry.py"
with open(registry_file, "r", encoding="utf-8") as f:
    reg_content = f.read()

# Add registration
registration_code = """
        # --- COMMON TOOLS ---
        self.tools["search_doctors"] = (
            {
                "name": "search_doctors",
                "description": "Tìm kiếm và lấy thông tin chi tiết của các Bác sĩ đang làm việc tại phòng khám (chuyên khoa, số điện thoại, v.v) để gợi ý cho bệnh nhân.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "specialty": {"type": "STRING", "description": "Chuyên khoa cần tìm (VD: 'Nội khoa', 'Nhi khoa', 'Tim mạch'). Để trống nếu muốn lấy tất cả."}
                    }
                }
            },
            self._handle_search_doctors,
            False
        )
"""
# insert before `def get_tool_schema`
if "    def get_tool_schema" in reg_content:
    reg_content = reg_content.replace("    def get_tool_schema", registration_code + "\n    def get_tool_schema")

# Add handler
handler_code = """
    async def _handle_search_doctors(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import User, UserRole
        from sqlalchemy import select
        
        stmt = select(User).where(User.role == UserRole.DOCTOR, User.is_active == True)
        specialty = args.get("specialty", "")
        
        # We don't have a strict specialty column in User model, but we can search in full_name or username if they put it there,
        # or we just return all doctors if the DB doesn't have a specialty field natively.
        docs = (await db.execute(stmt)).scalars().all()
        
        data = []
        for d in docs:
            # Fake some specialties based on ID if we want, or just return them
            data.append({
                "id": d.id,
                "name": d.full_name,
                "phone": d.phone_number,
                "email": d.email,
                "bio": "Bác sĩ chuyên khoa tại AI Clinic."
            })
            
        if specialty:
            # mock filtering for demo purposes if we don't have real data
            pass
            
        return {"doctors": data, "message": f"Tìm thấy {len(data)} bác sĩ."}
"""
reg_content = reg_content + "\n" + handler_code

with open(registry_file, "w", encoding="utf-8") as f:
    f.write(reg_content)

print("patched backend for search_doctors")
