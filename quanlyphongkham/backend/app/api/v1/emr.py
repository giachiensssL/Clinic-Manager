"""
EMR API — Quan ly ho so benh an dien tu (Electronic Medical Records)
Bao gom vitals, chan doan, ghi chu lam sang, ky so va khoa EMR
"""
import uuid
import hashlib
from typing import Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_doctor, get_current_user
from app.models.models import (
    Consultation, EMRStatus, Appointment, AppointmentStatus,
    ConsultationDiagnosis, Diagnosis, User, AuditAction,
)
from app.services.audit_service import log_action

router = APIRouter()


@router.post("", summary="Tao EMR moi cho cuoc kham", status_code=201)
async def create_consultation(
    appointment_id: str,
    chief_complaint: Optional[str] = None,
    blood_pressure: Optional[str] = None,
    heart_rate: Optional[int] = None,
    temperature: Optional[float] = None,
    weight: Optional[float] = None,
    height: Optional[float] = None,
    oxygen_saturation: Optional[float] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_doctor),
) -> dict:
    """Tao ho so benh an moi cho mot lich hen — chi bac si duoc phep"""
    # Lay appointment va kiem tra trang thai
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    appt = result.scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Khong tim thay lich hen")

    # Kiem tra da co consultation chua
    existing = await db.execute(
        select(Consultation).where(Consultation.appointment_id == appointment_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Lich hen nay da co ho so benh an")

    # Cap nhat trang thai appointment -> IN_CONSULTATION
    appt.status = AppointmentStatus.IN_CONSULTATION

    consultation = Consultation(
        id=str(uuid.uuid4()),
        appointment_id=appointment_id,
        patient_id=appt.patient_id,
        doctor_id=appt.doctor_id,
        chief_complaint=chief_complaint,
        blood_pressure=blood_pressure,
        heart_rate=heart_rate,
        temperature=temperature,
        weight=weight,
        height=height,
        oxygen_saturation=oxygen_saturation,
        status=EMRStatus.DRAFT,
    )
    db.add(consultation)
    await db.flush()

    await log_action(db, current_user, AuditAction.CREATE, "consultations", consultation.id)
    return {"id": consultation.id, "status": consultation.status.value, "appointment_id": appointment_id}


@router.get("/{consultation_id}", summary="Xem ho so benh an")
async def get_consultation(
    consultation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Lay thong tin day du cua mot ho so benh an"""
    result = await db.execute(
        select(Consultation)
        .options(
            selectinload(Consultation.diagnoses).selectinload(ConsultationDiagnosis.diagnosis),
            selectinload(Consultation.prescription),
        )
        .where(Consultation.id == consultation_id)
    )
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Khong tim thay ho so benh an")

    await log_action(db, current_user, AuditAction.READ, "consultations", consultation_id)

    return {
        "id": c.id,
        "appointment_id": c.appointment_id,
        "patient_id": c.patient_id,
        "doctor_id": c.doctor_id,
        "status": c.status.value,
        "vitals": {
            "blood_pressure": c.blood_pressure,
            "heart_rate": c.heart_rate,
            "temperature": c.temperature,
            "weight": c.weight,
            "height": c.height,
            "oxygen_saturation": c.oxygen_saturation,
        },
        "chief_complaint": c.chief_complaint,
        "clinical_notes": c.clinical_notes,
        "physical_examination": c.physical_examination,
        "treatment_plan": c.treatment_plan,
        "follow_up_date": c.follow_up_date.isoformat() if c.follow_up_date else None,
        "diagnoses": [
            {
                "icd10_code": d.diagnosis.icd10_code,
                "name": d.diagnosis.name,
                "is_primary": d.is_primary,
                "notes": d.notes,
            }
            for d in c.diagnoses
        ],
        "signed_by": c.signed_by,
        "signed_at": c.signed_at.isoformat() if c.signed_at else None,
        "locked_at": c.locked_at.isoformat() if c.locked_at else None,
    }


@router.get("/appointment/{appointment_id}", summary="Xem ho so benh an theo lich hen")
async def get_consultation_by_appointment(
    appointment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Lay thong tin day du cua ho so benh an thong qua appointment_id"""
    result = await db.execute(
        select(Consultation)
        .options(
            selectinload(Consultation.diagnoses).selectinload(ConsultationDiagnosis.diagnosis),
            selectinload(Consultation.prescription),
        )
        .where(Consultation.appointment_id == appointment_id)
    )
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Khong tim thay ho so benh an cho lich hen nay")

    return await get_consultation(c.id, db, current_user)


@router.get("/patient/{patient_id}", summary="Xem danh sach ho so theo benh nhan")
async def list_consultations_by_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Lay danh sach ho so benh an cua mot benh nhan"""
    from app.models.models import Patient, UserRole
    
    if current_user.role == UserRole.PATIENT:
        pid_result = await db.execute(select(Patient.id).where(Patient.user_id == current_user.id))
        pid = pid_result.scalar_one_or_none()
        if not pid or pid != patient_id:
            raise HTTPException(status_code=403, detail="Khong co quyen truy cap")
            
    result = await db.execute(
        select(Consultation)
        .options(
            selectinload(Consultation.diagnoses).selectinload(ConsultationDiagnosis.diagnosis),
            selectinload(Consultation.doctor).selectinload(User.staff) # Or Doctor model
        )
        .where(Consultation.patient_id == patient_id)
        .order_by(Consultation.created_at.desc())
    )
    items = result.scalars().all()
    
    response = []
    for c in items:
        response.append({
            "id": c.id,
            "appointment_id": c.appointment_id,
            "status": c.status.value,
            "chief_complaint": c.chief_complaint,
            "created_at": c.created_at.isoformat(),
        })

    return {"items": response}

@router.put("/{consultation_id}", summary="Cap nhat ho so benh an")
async def update_consultation(
    consultation_id: str,
    clinical_notes: Optional[str] = None,
    physical_examination: Optional[str] = None,
    treatment_plan: Optional[str] = None,
    chief_complaint: Optional[str] = None,
    follow_up_notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_doctor),
) -> dict:
    """Cap nhat noi dung ho so benh an — chi khi chua khoa"""
    result = await db.execute(select(Consultation).where(Consultation.id == consultation_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Khong tim thay ho so benh an")
    if c.status == EMRStatus.LOCKED:
        raise HTTPException(status_code=403, detail="Ho so benh an da bi khoa, khong the sua")

    if clinical_notes is not None:
        c.clinical_notes = clinical_notes
    if physical_examination is not None:
        c.physical_examination = physical_examination
    if treatment_plan is not None:
        c.treatment_plan = treatment_plan
    if chief_complaint is not None:
        c.chief_complaint = chief_complaint
    if follow_up_notes is not None:
        c.follow_up_notes = follow_up_notes

    await log_action(db, current_user, AuditAction.UPDATE, "consultations", consultation_id)
    return {"id": c.id, "status": c.status.value}


@router.post("/{consultation_id}/sign", summary="Ky so va khoa ho so benh an")
async def sign_and_lock_consultation(
    consultation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_doctor),
) -> dict:
    """
    Bac si ky so va khoa ho so benh an.
    Tao SHA-256 hash tu noi dung lam chu ky so don gian.
    Sau khi khoa, ho so khong the sua duoc.
    """
    result = await db.execute(select(Consultation).where(Consultation.id == consultation_id))
    c = result.scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Khong tim thay ho so benh an")
    if c.status == EMRStatus.LOCKED:
        raise HTTPException(status_code=400, detail="Ho so da duoc khoa truoc do")

    now = datetime.now(timezone.utc)

    # Tao signature hash tu noi dung chinh
    content = f"{c.id}|{c.patient_id}|{c.doctor_id}|{c.clinical_notes}|{now.isoformat()}"
    signature_hash = hashlib.sha256(content.encode()).hexdigest()

    c.status = EMRStatus.LOCKED
    c.signed_by = current_user.id
    c.signed_at = now
    c.locked_at = now
    c.signature_hash = signature_hash

    await log_action(db, current_user, AuditAction.LOCK, "consultations", consultation_id,
                     details=f"Signed and locked. Hash: {signature_hash[:16]}...")
    return {
        "id": c.id,
        "status": c.status.value,
        "signed_at": now.isoformat(),
        "signature_hash": signature_hash,
    }