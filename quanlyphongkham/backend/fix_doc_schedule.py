import os

file_path = "app/services/ai_tool_registry.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_schedule = """    async def _handle_get_doctor_schedule(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Appointment, Patient, AppointmentStatus, Queue, QueueStatus
        from sqlalchemy.orm import selectinload
        import datetime
        
        target_date = args.get("date")
        if not target_date:
            target_date = datetime.date.today().isoformat()
            
        # Tìm các appointment của user(bác sĩ) này
        stmt = select(Appointment).options(selectinload(Appointment.patient)).where(
            Appointment.doctor_id == user.id,
            Appointment.appointment_date == datetime.date.fromisoformat(target_date)
        ).order_by(Appointment.start_time)
        
        result = await db.execute(stmt)
        appointments = result.scalars().all()
        
        # Tìm cả hàng đợi (queue)
        q_stmt = select(Queue).options(selectinload(Queue.patient)).where(
            Queue.doctor_id == user.id,
            Queue.status.in_([QueueStatus.WAITING, QueueStatus.IN_PROGRESS])
        ).order_by(Queue.queue_number)"""

new_schedule = """    async def _handle_get_doctor_schedule(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Appointment, Patient, AppointmentStatus, Queue, QueueStatus, Staff, Doctor
        from sqlalchemy.orm import selectinload
        from sqlalchemy import select
        import datetime
        
        target_date = args.get("date")
        if not target_date or target_date == "hôm nay":
            target_date = datetime.date.today().isoformat()
            
        try:
            query_date = datetime.date.fromisoformat(target_date)
        except ValueError:
            query_date = datetime.date.today()
            
        doc_result = await db.execute(select(Doctor.id).join(Staff).where(Staff.user_id == user.id))
        doc_id = doc_result.scalar_one_or_none()
        if not doc_id:
            return {"error": "Tài khoản không phải là Bác sĩ hoặc chưa được liên kết"}
            
        # Tìm các appointment của user(bác sĩ) này
        stmt = select(Appointment).options(selectinload(Appointment.patient)).where(
            Appointment.doctor_id == doc_id,
            Appointment.appointment_date == query_date
        ).order_by(Appointment.start_time)
        
        result = await db.execute(stmt)
        appointments = result.scalars().all()
        
        # Tìm cả hàng đợi (queue)
        q_stmt = select(Queue).options(selectinload(Queue.patient)).where(
            Queue.doctor_id == doc_id,
            Queue.status.in_([QueueStatus.WAITING, QueueStatus.IN_PROGRESS])
        ).order_by(Queue.queue_number)"""

content = content.replace(old_schedule, new_schedule)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Patched get_doctor_schedule")
