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


@router.get("/{patient_id}", response_model=PatientDetail)
async def get_patient(
    patient_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Xem chi tiết bệnh nhân — RBAC check"""
    # Bệnh nhân chỉ được xem thông tin của mình
    if current_user.role == UserRole.PATIENT:
        result = await db.execute(
            select(Patient).where(Patient.user_id == current_user.id)
        )
        patient = result.scalar_one_or_none()
        if not patient or patient.id != patient_id:
            raise HTTPException(status_code=403, detail="Bạn không có quyền xem thông tin này")
    else:
        result = await db.execute(
            select(Patient)
            .options(selectinload(Patient.appointments).selectinload(Appointment.doctor))
            .where(Patient.id == patient_id, Patient.deleted_at.is_(None))
        )
        patient = result.scalar_one_or_none()

    if not patient:
        raise HTTPException(status_code=404, detail="Không tìm thấy bệnh nhân")

    await log_action(db, current_user, AuditAction.READ, "patients", patient_id)

    # Mask sensitive PII for Receptionist role
    response = PatientDetail.model_validate(patient)
    if current_user.role == UserRole.RECEPTIONIST:
        response.identity_number = "***MASKED***" if response.identity_number else None

    return response


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
