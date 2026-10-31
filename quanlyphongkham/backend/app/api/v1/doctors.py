from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_user, get_admin, get_receptionist
from app.models.models import Doctor, User, UserRole, Staff, Department, Specialty
from app.schemas.doctor import DoctorResponse, DoctorDetail, SpecialtyBriefResponse
from app.services.audit_service import log_action

router = APIRouter()

@router.get("", response_model=List[DoctorResponse])
async def list_doctors(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all doctors (with staff, department, specialty info)"""
    result = await db.execute(
        select(Doctor)
        .options(
            selectinload(Doctor.staff),
            selectinload(Doctor.department),
            selectinload(Doctor.specialty),
        )
        .where(Doctor.is_active == True)
    )
    doctors = result.scalars().all()
    return [DoctorResponse.model_validate(doc) for doc in doctors]

@router.get("/specialties", response_model=List[SpecialtyBriefResponse])
async def list_specialties(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all available specialties for patient appointment booking"""
    result = await db.execute(select(Specialty).order_by(Specialty.name))
    specialties = result.scalars().all()
    return [SpecialtyBriefResponse.model_validate(s) for s in specialties]

@router.get("/{doctor_id}", response_model=DoctorDetail)
async def get_doctor(
    doctor_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get doctor details including working schedule"""
    result = await db.execute(
        select(Doctor)
        .options(
            selectinload(Doctor.staff),
            selectinload(Doctor.department),
            selectinload(Doctor.specialty),
            selectinload(Doctor.working_schedules),
        )
        .where(Doctor.id == doctor_id)
    )
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Không tìm thấy bác sĩ")
    
    return DoctorDetail.model_validate(doctor)

@router.get("/{doctor_id}/slots")
async def get_doctor_slots(
    doctor_id: str,
    date: str, # YYYY-MM-DD
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    import datetime
    from app.models.models import WorkingSchedule, Appointment, AppointmentStatus
    
    try:
        target_date = datetime.date.fromisoformat(date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Ngày không hợp lệ")
        
    day_of_week = target_date.weekday() # 0=Mon, 6=Sun
    
    # 1. Get working schedule
    sched_result = await db.execute(
        select(WorkingSchedule)
        .where(WorkingSchedule.doctor_id == doctor_id)
        .where(WorkingSchedule.day_of_week == day_of_week)
        .where(WorkingSchedule.is_active == True)
    )
    schedules = sched_result.scalars().all()
    
    # 2. Get existing appointments
    apt_result = await db.execute(
        select(Appointment)
        .where(Appointment.doctor_id == doctor_id)
        .where(Appointment.appointment_date == target_date)
        .where(Appointment.status.in_([
            AppointmentStatus.SCHEDULED,
            AppointmentStatus.WAITING,
            AppointmentStatus.IN_CONSULTATION,
            AppointmentStatus.COMPLETED
        ]))
    )
    appointments = apt_result.scalars().all()
    booked_times = set(apt.start_time.strftime("%H:%M") for apt in appointments if apt.start_time)
    
    # 3. Khung giờ hành chính chuẩn (Giờ hành chính Việt Nam):
    # Ca sáng: 08:00 - 12:00 (các ca khám 30 phút: 08:00 đến 11:30)
    # Ca chiều: 13:30 - 17:00 (các ca khám 30 phút: 13:30 đến 16:30)
    ADMIN_SLOTS = [
        # Ca sáng
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        # Ca chiều
        "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
    ]
    
    now = datetime.datetime.now()
    generated_time_strings = set()
    
    if schedules:
        for sched in schedules:
            current_time = datetime.datetime.combine(target_date, sched.start_time)
            end_time = datetime.datetime.combine(target_date, sched.end_time)
            
            while current_time < end_time:
                t = current_time.time()
                # Loại trừ giờ nghỉ trưa hành chính (12:00 - 13:30) nếu ca kéo dài cả ngày
                if not (datetime.time(12, 0) <= t < datetime.time(13, 30)):
                    generated_time_strings.add(current_time.strftime("%H:%M"))
                current_time += datetime.timedelta(minutes=sched.slot_duration_minutes)
    
    # Nếu không có lịch hoặc lịch trống, luôn đảm bảo khung giờ hành chính chuẩn
    if not generated_time_strings:
        generated_time_strings = set(ADMIN_SLOTS)
    else:
        # Hợp nhất với khung giờ hành chính chuẩn
        generated_time_strings.update(ADMIN_SLOTS)
        
    slots = []
    for time_str in sorted(generated_time_strings):
        slot_hour, slot_min = map(int, time_str.split(":"))
        slot_time = datetime.time(slot_hour, slot_min)
        
        # Nếu là ngày hôm nay và thời gian đã qua thì không khả dụng
        is_past = False
        if target_date == now.date() and slot_time <= now.time():
            is_past = True
            
        slots.append({
            "time": time_str,
            "is_available": time_str not in booked_times and not is_past
        })
        
    slots.sort(key=lambda x: x["time"])
    return {"date": date, "slots": slots}
