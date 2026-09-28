"""
Patients API — CRUD với RBAC
"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user, get_staff, get_doctor
from app.models.models import Patient, User, UserRole, Appointment
from app.schemas.patient import (
    PatientCreate, PatientUpdate, PatientResponse, PatientDetail,
    PatientListResponse
)
from app.services.audit_service import log_action
from app.models.models import AuditAction
import uuid

router = APIRouter()


def generate_patient_code() -> str:
    """Sinh mã bệnh nhân unique"""
    import random
    return f"BN{random.randint(100000, 999999)}"


@router.get("", response_model=PatientListResponse)
async def list_patients(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    gender: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_staff),
):
    """Danh sách bệnh nhân — Staff only (không hiển thị cho Patient role)"""
    query = select(Patient).where(Patient.deleted_at.is_(None))

    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Patient.full_name.ilike(search_term),
                Patient.phone.ilike(search_term),
                Patient.patient_code.ilike(search_term),
                Patient.identity_number.ilike(search_term),
            )
        )

    if gender:
        query = query.where(Patient.gender == gender)

    if is_active is not None:
        query = query.where(Patient.is_active == is_active)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    # Paginate
    offset = (page - 1) * size
    query = query.order_by(Patient.created_at.desc()).offset(offset).limit(size)
    patients = (await db.execute(query)).scalars().all()

    await log_action(
        db, current_user, AuditAction.READ, "patients", None,
        f"Listed patients, page={page}, search={search}"
    )

    return PatientListResponse(
        items=[PatientResponse.model_validate(p) for p in patients],
        total=total,
        page=page,
        size=size,
        pages=(total + size - 1) // size,
    )


@router.post("", response_model=PatientResponse, status_code=status.HTTP_201_CREATED)
async def create_patient(
    payload: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_staff),
):
    """Tạo bệnh nhân mới"""
    patient = Patient(
        id=str(uuid.uuid4()),
        patient_code=generate_patient_code(),
        **payload.model_dump(),
    )
    db.add(patient)
    await db.flush()

    await log_action(db, current_user, AuditAction.CREATE, "patients", patient.id)
    return PatientResponse.model_validate(patient)


@router.get("/me", response_model=PatientDetail)
async def get_my_patient_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Bệnh nhân lấy hồ sơ của chính mình"""
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Chỉ bệnh nhân mới có hồ sơ")
        
    result = await db.execute(
        select(Patient)
        .options(selectinload(Patient.appointments).selectinload(Appointment.doctor))
        .where(Patient.user_id == current_user.id, Patient.deleted_at.is_(None))
    )
    patient = result.scalar_one_or_none()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Không tìm thấy hồ sơ bệnh nhân của bạn")
        
    return PatientDetail.model_validate(patient)


@router.get("/{patient_id}", response_model=PatientDetail)
async def get_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Xem chi tiết bệnh nhân — RBAC check & Medical Records"""
    from app.models.models import Doctor, Staff, Appointment, Consultation, Prescription, PrescriptionItem, Specialty
    from sqlalchemy.orm import selectinload
    
    # 1. Base Query
    stmt = select(Patient).where(Patient.id == patient_id, Patient.deleted_at.is_(None))
    
    # 2. Authorization Check
    if current_user.role == UserRole.PATIENT:
        # Bệnh nhân chỉ được xem thông tin của mình
        stmt = stmt.where(Patient.user_id == current_user.id)
    elif current_user.role == UserRole.DOCTOR:
        # Bác sĩ chỉ được xem bệnh nhân có lịch hẹn hoặc đã khám
        doc_stmt = select(Doctor).join(Staff).where(Staff.user_id == current_user.id)
        doc = (await db.execute(doc_stmt)).scalars().first()
        if not doc:
            raise HTTPException(status_code=403, detail="Tài khoản bác sĩ không hợp lệ")
            
        auth_check = select(1).where(or_(
            Appointment.patient_id == patient_id,
            Consultation.patient_id == patient_id
        )).where(
            or_(Appointment.doctor_id == doc.id, Consultation.doctor_id == doc.id)
        ).limit(1)
        is_auth = (await db.execute(auth_check)).scalar()
        if not is_auth:
            raise HTTPException(status_code=403, detail="Bạn không có quyền xem bệnh án của bệnh nhân này vì chưa từng khám hoặc đặt lịch.")
            
    # Lấy bệnh nhân
    patient = (await db.execute(stmt)).scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh nhân hoặc bạn không có quyền truy cập")
        
    await log_action(db, current_user, AuditAction.READ, "patients", patient_id)
    
    # Lấy các lịch sử khám gần đây (Consultations & Appointments)
    recent_visits = []
    current_medications = []
    
    if current_user.role in [UserRole.DOCTOR, UserRole.PATIENT, UserRole.ADMIN]:
        # Lấy lịch sử khám
        cons_stmt = select(Consultation).options(
            selectinload(Consultation.doctor).selectinload(Doctor.staff),
            selectinload(Consultation.appointment).selectinload(Appointment.specialty),
            selectinload(Consultation.diagnoses)
        ).where(Consultation.patient_id == patient_id).order_by(Consultation.created_at.desc()).limit(5)
        consultations = (await db.execute(cons_stmt)).scalars().all()
        
        for c in consultations:
            diag_str = ", ".join([d.notes or "Chẩn đoán" for d in c.diagnoses]) if c.diagnoses else c.chief_complaint
            recent_visits.append({
                "id": c.id,
                "date": c.created_at.date(),
                "department": c.appointment.specialty.name if c.appointment and c.appointment.specialty else "Đa khoa",
                "doctor": c.doctor.staff.full_name if c.doctor and c.doctor.staff else "Unknown",
                "reason": c.chief_complaint,
                "diagnosis": diag_str,
                "treatment": c.treatment_plan,
                "notes": c.clinical_notes
            })
            
        # Lấy thuốc đang sử dụng (từ đơn thuốc gần nhất trong vòng 30 ngày)
        from datetime import datetime, timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        rx_stmt = select(PrescriptionItem).join(Prescription).where(
            Prescription.patient_id == patient_id,
            Prescription.created_at >= thirty_days_ago
        ).options(selectinload(PrescriptionItem.medicine))
        rx_items = (await db.execute(rx_stmt)).scalars().all()
        
        for rx in rx_items:
            current_medications.append({
                "id": rx.id,
                "medicine_name": rx.medicine.name if rx.medicine else "Unknown",
                "dosage": rx.dosage,
                "frequency": rx.frequency,
                "instructions": rx.instructions
            })

    # Prepare response dict
    response_dict = {
        "id": patient.id,
        "patient_code": patient.patient_code,
        "full_name": patient.full_name,
        "date_of_birth": patient.date_of_birth,
        "gender": patient.gender,
        "phone": patient.phone,
        "email": patient.email,
        "is_active": patient.is_active,
        "created_at": patient.created_at,
        "address": patient.address,
        "identity_number": patient.identity_number,
        "blood_type": patient.blood_type,
        "allergies": patient.allergies,
        "medical_history": patient.medical_history,
        "insurance_number": patient.insurance_number,
        "insurance_provider": patient.insurance_provider,
        "emergency_contact_name": patient.emergency_contact_name,
        "emergency_contact_phone": patient.emergency_contact_phone,
        "updated_at": patient.updated_at,
        "recent_visits": recent_visits,
        "current_medications": current_medications
    }

    if current_user.role == UserRole.RECEPTIONIST:
        response_dict["identity_number"] = "***MASKED***" if response_dict.get("identity_number") else None
        
    return response_dict



@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str,
    payload: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_staff),
):
    """Cập nhật thông tin bệnh nhân"""
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.deleted_at.is_(None))
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh nhân")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)

    await log_action(db, current_user, AuditAction.UPDATE, "patients", patient_id)
    return PatientResponse.model_validate(patient)


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_staff),
):
    """Soft delete bệnh nhân"""
    from datetime import datetime, timezone
    result = await db.execute(
        select(Patient).where(Patient.id == patient_id, Patient.deleted_at.is_(None))
    )
    patient = result.scalar_one_or_none()
    if not patient:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh nhân")

    patient.deleted_at = datetime.now(timezone.utc)
    await log_action(db, current_user, AuditAction.DELETE, "patients", patient_id)
