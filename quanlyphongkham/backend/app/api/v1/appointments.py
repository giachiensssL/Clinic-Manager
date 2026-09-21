"""
Appointments API — Quan ly lich hen kham
"""
from app.models.models import Department
import uuid
from typing import Optional
from datetime import date, time, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, get_staff, get_receptionist
from app.models.models import (
    Appointment, AppointmentStatus, Patient, Doctor, Specialty,
    User, UserRole, AuditAction,
)
from app.services.audit_service import log_action
from app.schemas.appointment import AppointmentCreate

router = APIRouter()


def _generate_appointment_code() -> str:
    import random
    return f"LH{random.randint(100000, 999999)}"


@router.get("", summary="Danh sach lich hen")
async def list_appointments(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    appointment_date: Optional[date] = Query(None),
    doctor_id: Optional[str] = Query(None),
    patient_id: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Danh sach lich hen — bac si chi xem lich cua minh, patient xem lich cua minh"""
    query = select(Appointment).options(
        selectinload(Appointment.patient),
        selectinload(Appointment.doctor).selectinload(Doctor.staff),
        selectinload(Appointment.doctor).selectinload(Doctor.specialty),
    )

    # RBAC filter
    if current_user.role == UserRole.PATIENT:
        result = await db.execute(
            select(Patient.id).where(Patient.user_id == current_user.id)
        )
        pid = result.scalar_one_or_none()
        if pid:
            query = query.where(Appointment.patient_id == pid)
        else:
            return {"items": [], "total": 0, "page": page, "size": size, "pages": 0}
    elif current_user.role == UserRole.DOCTOR:
        from app.models.models import Staff
        staff_result = await db.execute(select(Staff.id).where(Staff.user_id == current_user.id))
        staff_id = staff_result.scalar_one_or_none()
        if staff_id:
            doc_result = await db.execute(select(Doctor.id).where(Doctor.staff_id == staff_id))
            doc_id = doc_result.scalar_one_or_none()
            if doc_id:
                query = query.where(Appointment.doctor_id == doc_id)
            else:
                return {"items": [], "total": 0, "page": page, "size": size, "pages": 0}
        else:
            return {"items": [], "total": 0, "page": page, "size": size, "pages": 0}

    if appointment_date:
        query = query.where(Appointment.appointment_date == appointment_date)
    if doctor_id and current_user.role not in (UserRole.PATIENT, UserRole.DOCTOR):
        query = query.where(Appointment.doctor_id == doctor_id)
    if patient_id and current_user.role != UserRole.PATIENT:
        query = query.where(Appointment.patient_id == patient_id)
    if status_filter:
        query = query.where(Appointment.status == status_filter)

    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    offset = (page - 1) * size
    query = query.order_by(Appointment.appointment_date.desc(), Appointment.start_time).offset(offset).limit(size)
    appointments = (await db.execute(query)).scalars().all()

    items = []
    for a in appointments:
        pat = a.patient
        doc = a.doctor
        items.append({
            "id": a.id,
            "appointment_code": a.appointment_code,
            "appointment_date": a.appointment_date.isoformat(),
            "start_time": a.start_time.isoformat(),
            "end_time": a.end_time.isoformat(),
            "status": a.status.value,
            "reason": a.reason,
            "patient": {
                "id": pat.id,
                "full_name": pat.full_name,
                "patient_code": pat.patient_code,
                "phone": pat.phone,
                "gender": pat.gender,
                "blood_type": pat.blood_type,
                "allergies": pat.allergies,
            } if pat else None,
            "doctor": {
                "id": doc.id,
                "full_name": doc.staff.full_name if doc.staff else "N/A",
                "specialty": doc.specialty.name if doc.specialty else None
            } if doc else None,
        })

    return {"items": items, "total": total, "page": page, "size": size, "pages": (total + size - 1) // size}


@router.post("", summary="Dat lich hen moi", status_code=201)
async def create_appointment(
    payload: AppointmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Dat lich hen moi - kiem tra trung lich truoc khi tao"""
    from app.models.models import UserRole, Patient
    if current_user.role == UserRole.PATIENT:
        pat_result = await db.execute(select(Patient.id).where(Patient.user_id == current_user.id))
        pat_id = pat_result.scalar_one_or_none()
        if not pat_id or pat_id != payload.patient_id:
            raise HTTPException(status_code=403, detail="Khong the tao lich hen cho benh nhan khac")

    # Kiem tra bac si ton tai
    doc_result = await db.execute(
        select(Doctor)
        .options(selectinload(Doctor.staff))
        .where(Doctor.id == payload.doctor_id)
    )
    doc = doc_result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Khong tim thay bac si")
    if not doc.staff:
        raise HTTPException(status_code=400, detail="Bac si hien khong hoat dong hoac da nghi viec")

    # Kiem tra trung lich (DB unique constraint se bat, nhung kiem tra truoc cho UX tot hon)
    existing = await db.execute(
        select(Appointment).where(
            and_(
                Appointment.doctor_id == payload.doctor_id,
                Appointment.appointment_date == payload.appointment_date,
                Appointment.start_time == payload.start_time,
                Appointment.status.notin_([AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]),
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Bac si da co lich vao khung gio nay")

    appointment = Appointment(
        id=str(uuid.uuid4()),
        appointment_code=_generate_appointment_code(),
        patient_id=payload.patient_id,
        doctor_id=payload.doctor_id,
        specialty_id=payload.specialty_id if payload.specialty_id != 'general' else None,
        appointment_date=payload.appointment_date,
        start_time=payload.start_time,
        end_time=payload.end_time,
        status=AppointmentStatus.SCHEDULED,
        reason=payload.reason,
        created_by=current_user.id,
    )
    db.add(appointment)
    await db.flush()

    await log_action(db, current_user, AuditAction.CREATE, "appointments", appointment.id)

    return {
        "id": appointment.id,
        "appointment_code": appointment.appointment_code,
        "status": appointment.status.value,
        "appointment_date": appointment.appointment_date.isoformat(),
        "start_time": appointment.start_time.isoformat(),
    }


@router.get("/{appointment_id}", summary="Chi tiet lich hen")
async def get_appointment(
    appointment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Chi tiet lich hen"""
    result = await db.execute(
        select(Appointment)
        .options(
            selectinload(Appointment.patient),
            selectinload(Appointment.doctor).selectinload(Doctor.staff),
            selectinload(Appointment.specialty),
        )
        .where(Appointment.id == appointment_id)
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Khong tim thay lich hen")

    if current_user.role.value == "patient":
        from app.models.models import Patient
        from sqlalchemy import select
        pid_result = await db.execute(select(Patient.id).where(Patient.user_id == current_user.id))
        pid = pid_result.scalar_one_or_none()
        if appt.patient_id != pid:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Không có quyền truy cập dữ liệu của bệnh nhân khác")

    await log_action(db, current_user, AuditAction.READ, "appointments", appointment_id)

    return {
        "id": appt.id,
        "appointment_code": appt.appointment_code,
        "patient": {"id": appt.patient.id, "full_name": appt.patient.full_name} if appt.patient else None,
        "doctor": {"id": appt.doctor.id, "full_name": appt.doctor.staff.full_name if appt.doctor.staff else None} if appt.doctor else None,
        "specialty": appt.specialty.name if appt.specialty else None,
        "appointment_date": appt.appointment_date.isoformat(),
        "start_time": appt.start_time.isoformat(),
        "end_time": appt.end_time.isoformat(),
        "status": appt.status.value,
        "reason": appt.reason,
        "notes": appt.notes,
        "checked_in_at": appt.checked_in_at.isoformat() if appt.checked_in_at else None,
        "cancelled_at": appt.cancelled_at.isoformat() if appt.cancelled_at else None,
        "cancellation_reason": appt.cancellation_reason,
    }


@router.patch("/{appointment_id}/status", summary="Cap nhat trang thai lich hen")
async def update_appointment_status(
    appointment_id: str,
    new_status: str,
    notes: Optional[str] = None,
    cancellation_reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Cap nhat trang thai lich hen (check-in, hoan thanh, huy, ...)"""
    result = await db.execute(select(Appointment).where(Appointment.id == appointment_id))
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Khong tim thay lich hen")

    if current_user.role.value == "patient":
        from app.models.models import Patient
        from sqlalchemy import select
        pid_result = await db.execute(select(Patient.id).where(Patient.user_id == current_user.id))
        pid = pid_result.scalar_one_or_none()
        if appt.patient_id != pid:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Không có quyền truy cập dữ liệu của bệnh nhân khác")

    # RBAC logic
    if current_user.role == UserRole.PATIENT:
        patient_result = await db.execute(select(Patient).where(Patient.user_id == current_user.id))
        patient = patient_result.scalar_one_or_none()
        if not patient or appt.patient_id != patient.id:
            raise HTTPException(status_code=403, detail="Khong co quyen cap nhat lich hen nay")
        if new_status != AppointmentStatus.CANCELLED.value:
            raise HTTPException(status_code=403, detail="Benh nhan chi co the huy lich hen")

    if appt.status in [AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW]:
        raise HTTPException(status_code=400, detail=f"Khong the doi trang thai lich hen da ket thuc hoac da huy")

    try:
        appt.status = AppointmentStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Trang thai khong hop le: {new_status}")

    now = datetime.now(timezone.utc)
    if new_status == AppointmentStatus.WAITING.value:
        appt.checked_in_at = now
    elif new_status == AppointmentStatus.CANCELLED.value:
        appt.cancelled_at = now
        appt.cancellation_reason = cancellation_reason

    if notes and current_user.role != UserRole.PATIENT:
        appt.notes = notes

    await log_action(db, current_user, AuditAction.UPDATE, "appointments", appointment_id,
                     details=f"Status changed to {new_status}")

    await db.commit()

    return {"id": appt.id, "status": appt.status.value}