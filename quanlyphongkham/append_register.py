import uuid

content = """
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
"""
with open('backend/app/api/v1/auth.py', 'a', encoding='utf-8') as f:
    f.write(content)
