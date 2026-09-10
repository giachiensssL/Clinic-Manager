from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.core.deps import get_current_user, get_admin, get_receptionist
from app.models.models import Doctor, User, UserRole, Staff, Department, Specialty
from app.schemas.doctor import DoctorResponse, DoctorDetail
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
