import uuid
from datetime import datetime, date, time
from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from app.models.models import (
    Doctor, Specialty, WorkingSchedule, Appointment, AppointmentStatus, Patient, Staff
)


async def check_availability(
    db: AsyncSession, 
    appointment_date: str, 
    specialty_name: Optional[str] = None
) -> str:
    """
    Tìm kiếm các bác sĩ có lịch trống trong một ngày cụ thể (định dạng YYYY-MM-DD).
    Nếu specialty_name được cung cấp, lọc theo chuyên khoa (ví dụ: "Nội khoa", "Nha khoa").
    """
    try:
        query_date = datetime.strptime(appointment_date, "%Y-%m-%d").date()
        day_of_week = query_date.weekday()  # 0: Mon, ..., 6: Sun
        
        # Build query
        stmt = (
            select(WorkingSchedule, Doctor, Staff, Specialty)
            .join(Doctor, WorkingSchedule.doctor_id == Doctor.id)
            .join(Staff, Doctor.staff_id == Staff.id)
            .join(Specialty, Doctor.specialty_id == Specialty.id)
            .where(WorkingSchedule.day_of_week == day_of_week)
            .where(WorkingSchedule.is_active == True)
            .where(Doctor.is_active == True)
        )
        
        if specialty_name:
            stmt = stmt.where(func.lower(Specialty.name).like(f"%{specialty_name.lower()}%"))
            
        result = await db.execute(stmt)
        rows = result.all()
        
        if not rows:
            return f"Không có bác sĩ nào có lịch làm việc vào ngày {appointment_date}."
            
        # Get existing appointments to find free slots
        doctor_ids = [row.Doctor.id for row in rows]
        apt_stmt = select(Appointment).where(
            and_(
                Appointment.doctor_id.in_(doctor_ids),
                Appointment.appointment_date == query_date,
                Appointment.status.notin_([AppointmentStatus.CANCELLED])
            )
        )
        apt_result = await db.execute(apt_stmt)
        existing_apts = apt_result.scalars().all()
        
        booked_slots = {}
        for apt in existing_apts:
            if apt.doctor_id not in booked_slots:
                booked_slots[apt.doctor_id] = set()
            booked_slots[apt.doctor_id].add(apt.start_time.strftime("%H:%M"))
            
        # Format response
        response_lines = [f"Danh sách bác sĩ trống lịch ngày {appointment_date}:"]
        
        for ws, doctor, staff, specialty in rows:
            # Generate slots based on duration (simplistic version for AI)
            start_min = ws.start_time.hour * 60 + ws.start_time.minute
            end_min = ws.end_time.hour * 60 + ws.end_time.minute
            duration = ws.slot_duration_minutes
            
            available_slots = []
            current_min = start_min
            while current_min + duration <= end_min:
                h = current_min // 60
                m = current_min % 60
                slot_str = f"{h:02d}:{m:02d}"
                
                doc_booked = booked_slots.get(doctor.id, set())
                if slot_str not in doc_booked:
                    available_slots.append(slot_str)
                    
                current_min += duration
                if len(available_slots) >= 5:  # Limit to 5 slots to keep response concise
                    break
                    
            if available_slots:
                response_lines.append(
                    f"- Bác sĩ: {staff.full_name} (Chuyên khoa: {specialty.name}) - ID: {doctor.id}\n"
                    f"  Các khung giờ trống: {', '.join(available_slots)}"
                )
        
        if len(response_lines) == 1:
            return f"Các bác sĩ có ca làm việc nhưng đã kín lịch trong ngày {appointment_date}."
            
        return "\n".join(response_lines)
        
    except Exception as e:
        return f"Lỗi khi tra cứu lịch trống: {str(e)}"


async def book_appointment(
    db: AsyncSession, 
    user_id: str,
    doctor_id: str, 
    date_str: str, 
    time_str: str, 
    reason: str
) -> str:
    """
    Đặt lịch khám mới.
    """
    try:
        apt_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        apt_time = datetime.strptime(time_str, "%H:%M").time()
        
        # Validate patient
        patient_stmt = select(Patient).where(Patient.user_id == user_id)
        patient_res = await db.execute(patient_stmt)
        patient = patient_res.scalar_one_or_none()
        
        if not patient:
            return "Không tìm thấy hồ sơ bệnh nhân của bạn. Vui lòng cập nhật hồ sơ trước khi đặt lịch."
            
        # Validate doctor
        doc_stmt = select(Doctor).where(Doctor.id == doctor_id)
        doc_res = await db.execute(doc_stmt)
        doctor = doc_res.scalar_one_or_none()
        
        if not doctor:
            return f"Không tìm thấy bác sĩ với ID {doctor_id}."
            
        # Check double booking
        check_stmt = select(Appointment).where(
            and_(
                Appointment.doctor_id == doctor_id,
                Appointment.appointment_date == apt_date,
                Appointment.start_time == apt_time,
                Appointment.status.notin_([AppointmentStatus.CANCELLED])
            )
        )
        check_res = await db.execute(check_stmt)
        if check_res.scalar_one_or_none():
            return f"Khung giờ {time_str} ngày {date_str} đã có người đặt. Vui lòng chọn giờ khác."
            
        # Create appointment
        from datetime import timedelta
        # Estimate end time based on 30 min duration
        dt_start = datetime.combine(apt_date, apt_time)
        dt_end = dt_start + timedelta(minutes=30)
        
        appointment_code = f"APT-{uuid.uuid4().hex[:8].upper()}"
        
        new_apt = Appointment(
            id=str(uuid.uuid4()),
            appointment_code=appointment_code,
            patient_id=patient.id,
            doctor_id=doctor_id,
            specialty_id=doctor.specialty_id,
            appointment_date=apt_date,
            start_time=apt_time,
            end_time=dt_end.time(),
            status=AppointmentStatus.SCHEDULED,
            reason=reason,
            created_by=user_id
        )
        
        db.add(new_apt)
        await db.commit()
        
        return f"Đặt lịch thành công! Mã lịch hẹn của bạn là {appointment_code}. Bạn vui lòng đến sớm 15 phút so với giờ hẹn."
        
    except Exception as e:
        await db.rollback()
        return f"Có lỗi xảy ra khi đặt lịch: {str(e)}"
