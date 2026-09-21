import os
import re

file_path = "app/api/v1/appointments.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_doc_check = """    # Kiem tra bac si ton tai
    doc = (await db.execute(select(Doctor).where(Doctor.id == doctor_id))).scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Khong tim thay bac si")"""

new_doc_check = """    # Kiem tra bac si ton tai
    from app.models.models import Staff
    doc = (await db.execute(
        select(Doctor)
        .options(selectinload(Doctor.staff).selectinload(Staff.user))
        .where(Doctor.id == doctor_id)
    )).scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Khong tim thay bac si")
    if not doc.staff or not doc.staff.user or not doc.staff.user.is_active:
        raise HTTPException(status_code=400, detail="Bac si hien khong hoat dong hoac da nghi viec")"""

content = content.replace(old_doc_check, new_doc_check)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Patched doctor active check in appointments.py")
