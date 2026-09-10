"""
Prescriptions API — Quan ly don thuoc
"""
import uuid
from typing import Optional, List
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_doctor, get_staff, get_current_user
from app.models.models import (
    Prescription, PrescriptionItem, Medicine, Consultation,
    User, AuditAction,
)
from app.services.audit_service import log_action

router = APIRouter()


def _generate_prescription_code() -> str:
    import random
    return f"DT{random.randint(100000, 999999)}"


@router.post("", summary="Tao don thuoc moi", status_code=201)
async def create_prescription(
    consultation_id: str,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_doctor),
) -> dict:
    """Tao don thuoc moi gan voi mot cuoc kham"""
    result = await db.execute(select(Consultation).where(Consultation.id == consultation_id))
    consultation = result.scalar_one_or_none()
    if not consultation:
        raise HTTPException(status_code=404, detail="Khong tim thay ho so kham benh")

    existing = await db.execute(
        select(Prescription).where(Prescription.consultation_id == consultation_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Cuoc kham nay da co don thuoc")

    prescription = Prescription(
        id=str(uuid.uuid4()),
        prescription_code=_generate_prescription_code(),
        consultation_id=consultation_id,
        doctor_id=consultation.doctor_id,
        patient_id=consultation.patient_id,
        notes=notes,
    )
    db.add(prescription)
    await db.flush()

    await log_action(db, current_user, AuditAction.CREATE, "prescriptions", prescription.id)
    return {"id": prescription.id, "prescription_code": prescription.prescription_code}


@router.get("/{prescription_id}", summary="Chi tiet don thuoc")
async def get_prescription(
    prescription_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Xem chi tiet don thuoc va danh sach thuoc"""
    result = await db.execute(
        select(Prescription)
        .options(selectinload(Prescription.items).selectinload(PrescriptionItem.medicine))
        .where(Prescription.id == prescription_id)
    )
    rx = result.scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=404, detail="Khong tim thay don thuoc")

    await log_action(db, current_user, AuditAction.READ, "prescriptions", prescription_id)

    return {
        "id": rx.id,
        "prescription_code": rx.prescription_code,
        "consultation_id": rx.consultation_id,
        "patient_id": rx.patient_id,
        "doctor_id": rx.doctor_id,
        "notes": rx.notes,
        "dispensed_at": rx.dispensed_at.isoformat() if rx.dispensed_at else None,
        "items": [
            {
                "id": item.id,
                "medicine_name": item.medicine.name if item.medicine else None,
                "generic_name": item.medicine.generic_name if item.medicine else None,
                "dosage": item.dosage,
                "frequency": item.frequency,
                "duration_days": item.duration_days,
                "quantity": item.quantity,
                "instructions": item.instructions,
                "unit_price": item.unit_price,
                "subtotal": item.quantity * item.unit_price,
            }
            for item in rx.items
        ],
        "total_price": sum(item.quantity * item.unit_price for item in rx.items),
    }


@router.post("/{prescription_id}/items", summary="Them thuoc vao don", status_code=201)
async def add_prescription_item(
    prescription_id: str,
    medicine_id: str,
    dosage: str,
    frequency: str,
    duration_days: int,
    quantity: int,
    instructions: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_doctor),
) -> dict:
    """Them mot loai thuoc vao don thuoc"""
    rx = (await db.execute(select(Prescription).where(Prescription.id == prescription_id))).scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=404, detail="Khong tim thay don thuoc")

    medicine = (await db.execute(select(Medicine).where(Medicine.id == medicine_id, Medicine.is_active == True))).scalar_one_or_none()
    if not medicine:
        raise HTTPException(status_code=404, detail="Khong tim thay thuoc")

    item = PrescriptionItem(
        id=str(uuid.uuid4()),
        prescription_id=prescription_id,
        medicine_id=medicine_id,
        dosage=dosage,
        frequency=frequency,
        duration_days=duration_days,
        quantity=quantity,
        instructions=instructions,
        unit_price=medicine.price,
    )
    db.add(item)
    await db.flush()

    await log_action(db, current_user, AuditAction.UPDATE, "prescriptions", prescription_id,
                     details=f"Added medicine: {medicine.name}")
    return {"id": item.id, "medicine_name": medicine.name, "quantity": quantity}


@router.post("/{prescription_id}/dispense", summary="Cap phat thuoc")
async def dispense_prescription(
    prescription_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_staff),
) -> dict:
    """Danh dau don thuoc da duoc cap phat"""
    rx = (await db.execute(select(Prescription).where(Prescription.id == prescription_id))).scalar_one_or_none()
    if not rx:
        raise HTTPException(status_code=404, detail="Khong tim thay don thuoc")
    if rx.dispensed_at:
        raise HTTPException(status_code=400, detail="Don thuoc da duoc cap phat truoc do")

    rx.dispensed_at = datetime.now(timezone.utc)
    await log_action(db, current_user, AuditAction.UPDATE, "prescriptions", prescription_id,
                     details="Prescription dispensed")
    return {"id": rx.id, "dispensed_at": rx.dispensed_at.isoformat()}