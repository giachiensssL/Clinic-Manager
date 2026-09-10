from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List, Dict, Any

from app.core.database import get_db
from app.core.security import get_current_user, get_password_hash
from app.models.models import User, UserRole, Staff, Patient

router = APIRouter()

@router.get("/users")
async def get_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    query = select(User)
    
    if search:
        search = f"%{search}%"
        query = query.where(
            (User.username.ilike(search)) |
            (User.email.ilike(search))
        )
        
    if role and role != "all":
        try:
            r = UserRole(role)
            query = query.where(User.role == r)
        except:
            pass

    result = await db.execute(query)
    users = result.scalars().all()
    
    # manually fetch related full names if needed
    # for simplicity, we do N+1 or just fetch all staff and patients
    staff_res = await db.execute(select(Staff))
    staffs = {s.user_id: s.full_name for s in staff_res.scalars().all()}
    
    patient_res = await db.execute(select(Patient))
    patients = {p.user_id: p.full_name for p in patient_res.scalars().all()}
    
    response = []
    for u in users:
        fname = staffs.get(u.id) or patients.get(u.id) or u.username
        response.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "fullName": fname,
            "role": u.role.value,
            "status": "active" if u.is_active else "inactive",
            "lastLogin": u.last_login.strftime("%d/%m/%Y %H:%M") if u.last_login else "—"
        })
        
    return {"items": response, "total": len(response)}

@router.post("/users")
async def create_user(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    username = data.get("username")
    email = data.get("email", f"{username}@clinicai.vn")
    role_str = data.get("role", "doctor")
    full_name = data.get("fullName", username)
    
    hashed = get_password_hash("Password123!")
    
    new_user = User(
        username=username,
        email=email,
        hashed_password=hashed,
        role=UserRole(role_str),
        is_active=True
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    if role_str == "patient":
        new_patient = Patient(
            user_id=new_user.id,
            full_name=full_name,
            patient_code=f"BN{new_user.id[:6].upper()}",
            date_of_birth="2000-01-01",
            gender="male"
        )
        db.add(new_patient)
    else:
        new_staff = Staff(
            user_id=new_user.id,
            full_name=full_name,
            staff_code=f"NV{new_user.id[:6].upper()}"
        )
        db.add(new_staff)
        
    await db.commit()
    return {"id": new_user.id}

@router.put("/users/{id}/status")
async def toggle_status(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    result = await db.execute(select(User).where(User.id == id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.is_active = not user.is_active
    await db.commit()
    return {"status": "ok"}