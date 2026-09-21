from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import LabResult, User, UserRole, Patient, Doctor, Staff
from app.schemas.lab_result import LabResultListResponse, LabResultResponse

router = APIRouter()

@router.get("", response_model=LabResultListResponse)
async def list_lab_results(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(LabResult).options(
        selectinload(LabResult.patient),
        selectinload(LabResult.doctor).selectinload(Doctor.staff)
    ).where(LabResult.deleted_at.is_(None))
    
    if current_user.role == UserRole.PATIENT:
        pid_result = await db.execute(select(Patient.id).where(Patient.user_id == current_user.id))
        pid = pid_result.scalar_one_or_none()
        if not pid:
            return {"items": [], "total": 0}
        query = query.where(LabResult.patient_id == pid)
        
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()
    
    offset = (page - 1) * size
    query = query.order_by(LabResult.test_date.desc()).offset(offset).limit(size)
    items = (await db.execute(query)).scalars().all()
    
    response_items = []
    for item in items:
        resp = LabResultResponse.model_validate(item)
        resp.patient_name = item.patient.full_name if item.patient else None
        resp.doctor_name = item.doctor.staff.full_name if (item.doctor and item.doctor.staff) else None
        response_items.append(resp)
        
    return LabResultListResponse(
        items=response_items,
        total=total,
    )

@router.get("/{result_id}", response_model=LabResultResponse)
async def get_lab_result(
    result_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(LabResult).options(
        selectinload(LabResult.patient),
        selectinload(LabResult.doctor).selectinload(Doctor.staff)
    ).where(LabResult.id == result_id, LabResult.deleted_at.is_(None))
    
    result = await db.execute(query)
    lab_result = result.scalar_one_or_none()
    
    if not lab_result:
        raise HTTPException(status_code=404, detail="Khong tim thay ket qua xet nghiem")
        
    if current_user.role == UserRole.PATIENT:
        pid_result = await db.execute(select(Patient.id).where(Patient.user_id == current_user.id))
        pid = pid_result.scalar_one_or_none()
        if lab_result.patient_id != pid:
            raise HTTPException(status_code=403, detail="Khong co quyen truy cap")
            
    resp = LabResultResponse.model_validate(lab_result)
    resp.patient_name = lab_result.patient.full_name if lab_result.patient else None
    resp.doctor_name = lab_result.doctor.staff.full_name if (lab_result.doctor and lab_result.doctor.staff) else None
    
    return resp

from app.models.models import LabResultStatus

@router.patch("/{result_id}/status")
async def update_lab_result_status(
    result_id: str,
    new_status: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN, UserRole.RECEPTIONIST]:
        raise HTTPException(status_code=403, detail="Không có quyền cập nhật trạng thái")

    query = select(LabResult).where(LabResult.id == result_id, LabResult.deleted_at.is_(None))
    result = await db.execute(query)
    lab_result = result.scalar_one_or_none()
    
    if not lab_result:
        raise HTTPException(status_code=404, detail="Không tìm thấy kết quả xét nghiệm")
    
    try:
        lab_result.status = LabResultStatus(new_status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ")
        
    await db.commit()
    return {"message": "Đã cập nhật trạng thái"}
