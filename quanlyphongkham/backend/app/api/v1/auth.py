from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token, hash_password
from app.core.deps import get_current_user
from app.models.models import User, Staff, Patient, AuditAction, UserRole
from app.schemas.auth import LoginRequest, Token, RefreshRequest, UserInfo, RegisterRequest
from app.services.audit_service import log_action

router = APIRouter()

import asyncio

@router.post("/login", response_model=Token)
async def login(payload: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    # Find user by email or username
    result = await db.execute(
        select(User).where(
            or_(User.email == payload.username, User.username == payload.username),
            User.deleted_at.is_(None)
        )
    )
    user = result.scalar_one_or_none()
    
    is_valid_pwd = False
    if user:
        is_valid_pwd = await asyncio.to_thread(verify_password, payload.password, user.hashed_password)
        
    if not user or not is_valid_pwd:
        await log_action(db, None, AuditAction.LOGIN, "auth", None,
                        f"Failed login attempt: {payload.username}", 
                        request.client.host if request.client else None, result="failed")
        await db.commit()
        raise HTTPException(status_code=401, detail="Sai tên đăng nhập hoặc mật khẩu")
    
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Tài khoản đã bị vô hiệu hóa")
    
    # Update last login
    user.last_login = datetime.now(timezone.utc)
    
    # Get full name from staff or patient
    full_name = await get_full_name(db, user)
    
    # Create tokens
    token_data = {"sub": user.id, "role": user.role.value, "username": user.username}
    access_token = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)
    
    await log_action(db, user, AuditAction.LOGIN, "auth", user.id,
                    f"Successful login", request.client.host if request.client else None)
    
    await db.commit()
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        user_id=user.id,
        username=user.username,
        full_name=full_name,
    )

async def get_full_name(db: AsyncSession, user: User) -> str:
    staff_result = await db.execute(select(Staff).where(Staff.user_id == user.id))
    staff = staff_result.scalar_one_or_none()
    if staff:
        return staff.full_name
    
    patient_result = await db.execute(select(Patient).where(Patient.user_id == user.id))
    patient = patient_result.scalar_one_or_none()
    if patient:
        return patient.full_name
    
    return user.username

@router.post("/refresh", response_model=Token)
async def refresh_token(payload: RefreshRequest, db: AsyncSession = Depends(get_db)):
    token_data = decode_token(payload.refresh_token)
    if token_data.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user = await db.get(User, token_data.get("sub"))
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found")
    
    token_dict = {"sub": user.id, "role": user.role.value, "username": user.username}
    return Token(
        access_token=create_access_token(token_dict),
        refresh_token=create_refresh_token(token_dict),
        role=user.role,
        user_id=user.id,
        username=user.username,
    )

@router.get("/me", response_model=UserInfo)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserInfo.model_validate(current_user)
import uuid

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    result = await db.execute(select(User).where(User.email == payload.email, User.deleted_at.is_(None)))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")
    
    # Check if phone exists in patients
    phone_result = await db.execute(select(Patient).where(Patient.phone == payload.phone, Patient.deleted_at.is_(None)))
    if phone_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Số điện thoại đã được sử dụng")

    # Create new User
    hashed_pwd = await asyncio.to_thread(hash_password, payload.password)
    new_user_id = str(uuid.uuid4())
    new_user = User(
        id=new_user_id,
        email=payload.email,
        username=payload.email,
        hashed_password=hashed_pwd,
        role=UserRole.PATIENT,
        is_active=True,
        is_verified=False
    )
    db.add(new_user)
    
    # Create associated Patient
    patient_code = f"BN-{uuid.uuid4().hex[:8].upper()}"
    new_patient = Patient(
        user_id=new_user_id,
        patient_code=patient_code,
        full_name=payload.full_name,
        gender=payload.gender,
        date_of_birth=payload.date_of_birth,
        phone=payload.phone,
        email=payload.email
    )
    db.add(new_patient)
    
    await log_action(db, new_user, AuditAction.CREATE, "auth", new_user_id, "User registered", None)
    await db.commit()
    
    return {"message": "Đăng ký thành công"}
