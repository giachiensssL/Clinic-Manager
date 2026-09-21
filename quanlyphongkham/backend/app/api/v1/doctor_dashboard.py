"""
Doctor Dashboard API - Endpoints rieng cho Doctor Portal
"""
from sqlalchemy import func
from datetime import date, datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, get_doctor
from app.models.models import (
    User, Doctor, Staff, Patient, Appointment, AppointmentStatus,
    Consultation, EMRStatus, LabResult, LabResultStatus, Notification,
    Prescription, Specialty, Department, AuditLog, AuditAction
)

router = APIRouter()


async def _get_doctor_for_user(user: User, db: AsyncSession) -> Doctor:
    """Helper: lay Doctor record tu current user"""
    result = await db.execute(
        select(Doctor)
        .options(
            selectinload(Doctor.staff),
            selectinload(Doctor.specialty),
            selectinload(Doctor.department),
        )
        .join(Staff, Doctor.staff_id == Staff.id)
        .where(Staff.user_id == user.id)
    )
    doctor = result.scalar_one_or_none()
    if not doctor:
        raise HTTPException(status_code=404, detail="Khong tim thay thong tin bac si. Vui long lien he admin.")
    return doctor


@router.get("/me")
async def get_doctor_me(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_doctor),
):
    """Lay thong tin bac si hien tai"""
    doctor = await _get_doctor_for_user(current_user, db)
    return {
        "id": doctor.id,
        "employee_id": doctor.staff.employee_id if doctor.staff else None,
        "full_name": doctor.staff.full_name if doctor.staff else None,
        "phone": doctor.staff.phone if doctor.staff else None,
        "gender": doctor.staff.gender.value if doctor.staff and doctor.staff.gender else None,
        "specialty": doctor.specialty.name if doctor.specialty else None,
        "specialty_id": doctor.specialty_id,
        "department": doctor.department.name if doctor.department else None,
        "department_id": doctor.department_id,
        "license_number": doctor.license_number,
        "qualification": doctor.qualification,
        "bio": doctor.bio,
        "avatar_url": doctor.avatar_url,
        "consultation_fee": doctor.consultation_fee,
        "is_active": doctor.is_active,
    }


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_doctor),
):
    """Thong ke tong quan cho doctor dashboard"""
    doctor = await _get_doctor_for_user(current_user, db)
    today = date.today()

    # Today appointments
    today_count = (await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == today,
            Appointment.status.notin_([AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW])
        )
    )).scalar_one()

    # Waiting
    waiting_count = (await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == today,
            Appointment.status == AppointmentStatus.WAITING
        )
    )).scalar_one()

    # In consultation
    consulting_count = (await db.execute(
        select(func.count(Appointment.id)).where(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == today,
            Appointment.status == AppointmentStatus.IN_CONSULTATION
        )
    )).scalar_one()

    # Pending EMR (draft consultations of this doctor)
    pending_emr_count = (await db.execute(
        select(func.count(Consultation.id)).where(
            Consultation.doctor_id == doctor.id,
            Consultation.status == EMRStatus.DRAFT
        )
    )).scalar_one()

    # Pending lab results
    pending_lab_count = (await db.execute(
        select(func.count(LabResult.id)).where(
            LabResult.doctor_id == doctor.id,
            LabResult.status == LabResultStatus.PENDING,
            LabResult.deleted_at.is_(None)
        )
    )).scalar_one()

    # Unread notifications
    unread_notif_count = (await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    )).scalar_one()

    return {
        "today_appointments_count": today_count,
        "patients_waiting_count": waiting_count,
        "patients_in_consultation_count": consulting_count,
        "pending_emr_count": pending_emr_count,
        "pending_lab_results_count": pending_lab_count,
        "unread_notifications_count": unread_notif_count,
        "doctor_id": doctor.id,
    }


@router.get("/appointments/today")
async def get_today_appointments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_doctor),
):
    """Lich kham hom nay cua bac si - day du thong tin"""
    doctor = await _get_doctor_for_user(current_user, db)
    today = date.today()

    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.patient),
            selectinload(Appointment.specialty),
        )
        .where(
            Appointment.doctor_id == doctor.id,
            Appointment.appointment_date == today,
        )
        .order_by(Appointment.start_time)
    )
    appointments = result.scalars().all()

    items = []
    for a in appointments:
        pat = a.patient
        age = None
        if pat and pat.date_of_birth:
            age = (date.today() - pat.date_of_birth).days // 365

        items.append({
            "id": a.id,
            "appointment_code": a.appointment_code,
            "start_time": a.start_time.strftime("%H:%M"),
            "end_time": a.end_time.strftime("%H:%M"),
            "status": a.status.value,
            "reason": a.reason,
            "notes": a.notes,
            "specialty": a.specialty.name if a.specialty else None,
            "patient": {
                "id": pat.id,
                "patient_code": pat.patient_code,
                "full_name": pat.full_name,
                "age": age,
                "gender": pat.gender.value if pat.gender else None,
                "phone": pat.phone,
                "avatar_url": getattr(pat, 'avatar_url', None),
                "blood_type": pat.blood_type,
                "allergies": pat.allergies,
            } if pat else None,
        })

    return {"items": items, "total": len(items), "date": today.isoformat()}


@router.get("/dashboard/recent-activity")
async def get_recent_activity(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_doctor),
):
    """Hoat dong gan day cua bac si"""
    result = await db.execute(
        select(AuditLog)
        .where(
            AuditLog.user_id == current_user.id,
            AuditLog.resource_type.in_(['consultations', 'prescriptions', 'lab_results', 'appointments'])
        )
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    logs = result.scalars().all()

    action_map = {
        "consultations": {"create": "Tạo bệnh án", "update": "Cập nhật bệnh án", "sign": "Ký bệnh án", "read": "Xem bệnh án"},
        "prescriptions": {"create": "Kê đơn thuốc", "update": "Cập nhật đơn thuốc", "read": "Xem đơn thuốc"},
        "lab_results": {"create": "Yêu cầu xét nghiệm", "update": "Xem kết quả xét nghiệm", "read": "Xem kết quả"},
        "appointments": {"update": "Cập nhật lịch khám", "read": "Xem lịch khám"},
    }

    items = []
    for log in logs:
        action_text = action_map.get(log.resource_type, {}).get(log.action.value, log.action.value)
        now = datetime.now(timezone.utc)
        if log.created_at.tzinfo is None:
            log_time = log.created_at.replace(tzinfo=timezone.utc)
        else:
            log_time = log.created_at
        diff = now - log_time
        total_seconds = int(diff.total_seconds())
        if total_seconds < 3600:
            time_ago = f"{max(1, total_seconds // 60)} phút trước"
        elif diff.days == 0:
            time_ago = f"{total_seconds // 3600} giờ trước"
        elif diff.days == 1:
            time_ago = "Hôm qua"
        else:
            time_ago = f"{diff.days} ngày trước"

        items.append({
            "id": log.id,
            "action": log.action.value,
            "action_text": action_text,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "time_ago": time_ago,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        })

    return {"items": items}


@router.get("/patients/search")
async def search_patients(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_doctor),
):
    """Tim kiem benh nhan theo ten, ma BN, so dien thoai"""
    search_term = f"%{q}%"
    result = await db.execute(
        select(Patient)
        .where(
            Patient.deleted_at.is_(None),
            or_(
                Patient.full_name.ilike(search_term),
                Patient.patient_code.ilike(search_term),
                Patient.phone.ilike(search_term),
            )
        )
        .order_by(Patient.full_name)
        .limit(limit)
    )
    patients = result.scalars().all()

    items = []
    for p in patients:
        age = (date.today() - p.date_of_birth).days // 365 if p.date_of_birth else None

        last_visit = (await db.execute(
            select(Appointment.appointment_date)
            .where(Appointment.patient_id == p.id)
            .order_by(Appointment.appointment_date.desc())
            .limit(1)
        )).scalar_one_or_none()

        items.append({
            "id": p.id,
            "patient_code": p.patient_code,
            "full_name": p.full_name,
            "age": age,
            "gender": p.gender.value if p.gender else None,
            "phone": p.phone,
            "avatar_url": getattr(p, 'avatar_url', None),
            "blood_type": p.blood_type,
            "last_visit_date": last_visit.isoformat() if last_visit else None,
        })

    return {"items": items, "total": len(items)}
