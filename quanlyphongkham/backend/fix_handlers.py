import re

file_path = "app/services/ai_tool_registry.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix _handle_search_doctors
old_search_doctors = """    async def _handle_search_doctors(self, db: AsyncSession, user: User, args: dict) -> dict:
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
            
        return {"doctors": data, "message": f"Tìm thấy {len(data)} bác sĩ."}"""

new_search_doctors = """    async def _handle_search_doctors(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Doctor, Staff
        from sqlalchemy.orm import selectinload
        from sqlalchemy import select
        
        stmt = select(Doctor).options(selectinload(Doctor.staff), selectinload(Doctor.specialty))
        docs = (await db.execute(stmt)).scalars().all()
        
        data = []
        for d in docs:
            data.append({
                "id": d.staff.user_id if d.staff else d.id,
                "name": d.staff.full_name if d.staff else "Bác sĩ",
                "phone": d.staff.phone if d.staff else "",
                "specialty": d.specialty.name if d.specialty else "Chung",
                "bio": d.bio or "Bác sĩ tại AI Clinic."
            })
            
        return {"doctors": data, "message": f"Tìm thấy {len(data)} bác sĩ."}"""

content = content.replace(old_search_doctors, new_search_doctors)

# 2. Fix _handle_check_doctor_availability
old_check_doc = """    async def _handle_check_doctor_availability(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import User, UserRole, Appointment, AppointmentStatus
        from sqlalchemy import or_
        import datetime
        q = args.get("doctor_name", "")
        stmt = select(User).where(User.role == UserRole.DOCTOR, or_(
            User.username.ilike(f"%{q}%"),
            User.full_name.ilike(f"%{q}%")
        ))
        doc = (await db.execute(stmt)).scalars().first()
        if not doc: return {"error": f"Không tìm thấy Bác sĩ nào khớp với '{q}'"}
        
        today = datetime.date.today()
        astmt = select(Appointment).where(
            Appointment.doctor_id == doc.id, 
            Appointment.appointment_date == today,
            Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING])
        )
        apps = (await db.execute(astmt)).scalars().all()
        return {
            "doctor": {"id": doc.id, "name": doc.full_name},
            "appointments_today": len(apps),
            "next_available_slot": "Vui lòng kiểm tra trên lịch",
            "message": f"Bác sĩ {doc.full_name} hôm nay có {len(apps)} lịch khám chưa hoàn thành."
        }"""

new_check_doc = """    async def _handle_check_doctor_availability(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import User, UserRole, Staff, Appointment, AppointmentStatus
        from sqlalchemy import or_
        import datetime
        q = args.get("doctor_name", "")
        stmt = select(User).join(Staff, User.id == Staff.user_id).where(
            User.role == UserRole.DOCTOR, or_(
            User.username.ilike(f"%{q}%"),
            Staff.full_name.ilike(f"%{q}%")
        ))
        doc = (await db.execute(stmt)).scalars().first()
        if not doc: return {"error": f"Không tìm thấy Bác sĩ nào khớp với '{q}'"}
        
        staff = (await db.execute(select(Staff).where(Staff.user_id == doc.id))).scalars().first()
        doc_name = staff.full_name if staff else doc.username
        
        today = datetime.date.today()
        astmt = select(Appointment).where(
            Appointment.doctor_id == doc.id, 
            Appointment.appointment_date == today,
            Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING])
        )
        apps = (await db.execute(astmt)).scalars().all()
        return {
            "doctor": {"id": doc.id, "name": doc_name},
            "appointments_today": len(apps),
            "next_available_slot": "Vui lòng kiểm tra trên lịch",
            "message": f"Bác sĩ {doc_name} hôm nay có {len(apps)} lịch khám chưa hoàn thành."
        }"""

content = content.replace(old_check_doc, new_check_doc)

# 3. Fix Patient.phone_number
content = content.replace("Patient.phone_number", "Patient.phone")
content = content.replace('"phone": p.phone_number', '"phone": p.phone')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("fixed all handlers")
