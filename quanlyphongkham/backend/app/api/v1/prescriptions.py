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
    User, AuditAction, Doctor, UserRole
)
from app.services.audit_service import log_action

router = APIRouter()


def _generate_prescription_code() -> str:
    import random
    return f"DT{random.randint(100000, 999999)}"

@router.get("", summary="Danh sach don thuoc")
async def list_prescriptions(
    patient_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    query = select(Prescription).options(
        selectinload(Prescription.consultation).selectinload(Consultation.patient),
        selectinload(Prescription.consultation).selectinload(Consultation.doctor).selectinload(Doctor.staff),
        selectinload(Prescription.items).selectinload(PrescriptionItem.medicine)
    ).order_by(Prescription.created_at.desc())
    
    if current_user.role == UserRole.PATIENT:
        from app.models.models import Patient
        pid_result = await db.execute(select(Patient.id).where(Patient.user_id == current_user.id))
        pid = pid_result.scalar_one_or_none()
        if not pid:
            return {"items": [], "total": 0}
        query = query.where(Prescription.patient_id == pid)
    elif patient_id:
        query = query.where(Prescription.patient_id == patient_id)
        
    result = await db.execute(query)
    items = result.scalars().all()
    
    response = []
    for rx in items:
        response.append({
            "id": rx.id,
            "prescription_code": rx.prescription_code,
            "patient_name": rx.consultation.patient.full_name if (rx.consultation and rx.consultation.patient) else "N/A",
            "doctor_name": rx.consultation.doctor.staff.full_name if (rx.consultation and rx.consultation.doctor and rx.consultation.doctor.staff) else "N/A",
            "created_at": rx.created_at.isoformat(),
            "status": "dispensed" if rx.dispensed_at else "pending",
            "items_count": len(rx.items)
        })
    return {"items": response, "total": len(response)}


from pydantic import BaseModel
from app.models.models import EMRStatus

class PrescriptionItemCreateDTO(BaseModel):
    medicine_id: Optional[str] = None
    medicine_name: Optional[str] = None
    dosage: str = "1 viên"
    frequency: str = "2 lần/ngày"
    duration_days: int = 5
    quantity: int = 10
    instructions: Optional[str] = "Uống sau khi ăn"
    unit_price: float = 0.0

class CreatePrescriptionDTO(BaseModel):
    consultation_id: Optional[str] = None
    patient_id: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[PrescriptionItemCreateDTO]] = None

@router.post("", summary="Tao don thuoc moi", status_code=201)
async def create_prescription(
    payload: CreatePrescriptionDTO,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_doctor),
) -> dict:
    """Tao don thuoc moi gan voi mot cuoc kham hoac truc tiep cho benh nhan"""
    consultation_id = payload.consultation_id
    patient_id = payload.patient_id
    doctor_id = None

    if current_user.role == UserRole.DOCTOR:
        doc_res = await db.execute(select(Doctor.id).where(Doctor.user_id == current_user.id))
        doctor_id = doc_res.scalar_one_or_none()

    if not consultation_id:
        if not patient_id:
            raise HTTPException(status_code=400, detail="Cần cung cấp consultation_id hoặc patient_id")
        
        # Tạo hoặc tái sử dụng một consultation cho bệnh nhân
        cons = Consultation(
            id=str(uuid.uuid4()),
            patient_id=patient_id,
            doctor_id=doctor_id,
            chief_complaint=payload.notes or "Kê đơn thuốc ngoại trú",
            clinical_notes="Kê đơn trực tiếp",
            status=EMRStatus.DRAFT,
        )
        db.add(cons)
        await db.flush()
        consultation_id = cons.id
    else:
        result = await db.execute(select(Consultation).where(Consultation.id == consultation_id))
        consultation = result.scalar_one_or_none()
        if not consultation:
            raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ khám bệnh")
        patient_id = consultation.patient_id
        doctor_id = consultation.doctor_id

    existing = await db.execute(
        select(Prescription).where(Prescription.consultation_id == consultation_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Cuộc khám này đã có đơn thuốc")

    prescription = Prescription(
        id=str(uuid.uuid4()),
        prescription_code=_generate_prescription_code(),
        consultation_id=consultation_id,
        doctor_id=doctor_id or str(uuid.uuid4()),
        patient_id=patient_id,
        notes=payload.notes,
    )
    db.add(prescription)
    await db.flush()

    # Thêm các danh mục thuốc nếu có
    if payload.items:
        for item in payload.items:
            med_id = item.medicine_id
            if not med_id and item.medicine_name:
                # Tìm hoặc tạo thuốc theo tên
                med_res = await db.execute(select(Medicine).where(Medicine.name.ilike(item.medicine_name.strip())))
                existing_med = med_res.scalar_one_or_none()
                if existing_med:
                    med_id = existing_med.id
                else:
                    new_med = Medicine(
                        id=str(uuid.uuid4()),
                        name=item.medicine_name.strip(),
                        price=item.unit_price or 15000.0,
                        unit="Viên"
                    )
                    db.add(new_med)
                    await db.flush()
                    med_id = new_med.id
            
            if not med_id:
                # Lấy ngẫu nhiên thuốc đầu tiên trong kho nếu không chỉ định
                any_med = (await db.execute(select(Medicine).limit(1))).scalar_one_or_none()
                if any_med:
                    med_id = any_med.id
                else:
                    new_med = Medicine(
                        id=str(uuid.uuid4()),
                        name="Paracetamol 500mg",
                        price=10000.0,
                        unit="Viên"
                    )
                    db.add(new_med)
                    await db.flush()
                    med_id = new_med.id

            px_item = PrescriptionItem(
                id=str(uuid.uuid4()),
                prescription_id=prescription.id,
                medicine_id=med_id,
                dosage=item.dosage,
                frequency=item.frequency,
                duration_days=item.duration_days,
                quantity=item.quantity,
                instructions=item.instructions,
                unit_price=item.unit_price or 15000.0,
            )
            db.add(px_item)

    await db.commit()
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

    if current_user.role.value == "patient":
        from app.models.models import Patient
        from sqlalchemy import select
        pid_result = await db.execute(select(Patient.id).where(Patient.user_id == current_user.id))
        pid = pid_result.scalar_one_or_none()
        if rx.patient_id != pid:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Không có quyền truy cập dữ liệu của bệnh nhân khác")

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

    if current_user.role.value == "patient":
        from app.models.models import Patient
        from sqlalchemy import select
        pid_result = await db.execute(select(Patient.id).where(Patient.user_id == current_user.id))
        pid = pid_result.scalar_one_or_none()
        if rx.patient_id != pid:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Không có quyền truy cập dữ liệu của bệnh nhân khác")

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

    if current_user.role.value == "patient":
        from app.models.models import Patient
        from sqlalchemy import select
        pid_result = await db.execute(select(Patient.id).where(Patient.user_id == current_user.id))
        pid = pid_result.scalar_one_or_none()
        if rx.patient_id != pid:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Không có quyền truy cập dữ liệu của bệnh nhân khác")
    if rx.dispensed_at:
        raise HTTPException(status_code=400, detail="Don thuoc da duoc cap phat truoc do")

    rx.dispensed_at = datetime.now(timezone.utc)
    await log_action(db, current_user, AuditAction.UPDATE, "prescriptions", prescription_id,
                     details="Prescription dispensed")
    return {"id": rx.id, "dispensed_at": rx.dispensed_at.isoformat()}