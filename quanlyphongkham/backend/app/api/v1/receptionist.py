"""
Receptionist Module API
"""
import time
import random
from datetime import date, datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, desc
from sqlalchemy.orm import selectinload
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_receptionist
from app.models.models import (
    User, Staff, Patient, Appointment, AppointmentStatus, Doctor, Specialty,
    Billing, BillingStatus, AuditLog, AuditAction, Queue, QueueStatus,
    Payment, PaymentMethod, Notification, NotificationType, Gender
)
import uuid

router = APIRouter()

def _now():
    return datetime.now(timezone.utc)

async def log_activity(db, user, action, resource_type, resource_id, details):
    log = AuditLog(
        user_id=user.id,
        username=user.username,
        user_role=user.role.value,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details,
        ip_address="127.0.0.1",
    )
    db.add(log)

# ==================== ME ====================
@router.get("/me")
async def get_receptionist_me(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    result = await db.execute(select(Staff).where(Staff.user_id == current_user.id))
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    return {
        "id": staff.id,
        "employee_id": staff.employee_id,
        "full_name": staff.full_name,
        "phone": staff.phone,
        "gender": staff.gender.value if staff.gender else None,
        "email": current_user.email,
        "avatar_url": None
    }

# ==================== DASHBOARD ====================
@router.get("/dashboard/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    today = date.today()
    today_apts = (await db.execute(select(func.count(Appointment.id)).where(Appointment.appointment_date == today))).scalar_one()
    waiting = (await db.execute(select(func.count(Queue.id)).where(func.date(Queue.created_at) == today, Queue.status == QueueStatus.WAITING))).scalar_one()
    checked_in = (await db.execute(select(func.count(Queue.id)).where(func.date(Queue.created_at) == today))).scalar_one()
    pending_pay = (await db.execute(select(func.count(Billing.id)).where(Billing.status.in_([BillingStatus.UNPAID, BillingStatus.PARTIALLY_PAID])))).scalar_one()
    return {
        "todayAppointments": today_apts,
        "waitingPatients": waiting,
        "checkedInPatients": checked_in,
        "pendingPayments": pending_pay
    }

@router.get("/dashboard/recent-activity")
async def get_recent_activity(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    res = await db.execute(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(10))
    logs = res.scalars().all()
    return [{"id": l.id, "action": l.action.value, "details": l.details, "created_at": l.created_at} for l in logs]

# ==================== APPOINTMENTS ====================
@router.get("/appointments")
async def list_appointments(
    date: Optional[date] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_receptionist)
):
    query = select(Appointment).options(
        selectinload(Appointment.patient),
        selectinload(Appointment.doctor).selectinload(Doctor.staff),
        selectinload(Appointment.specialty)
    ).order_by(Appointment.appointment_date.desc(), Appointment.start_time.asc())
    
    if date: query = query.where(Appointment.appointment_date == date)
    if status: query = query.where(Appointment.status == status)
    
    if search:
        query = query.join(Patient).where(or_(
            Patient.full_name.ilike(f"%{search}%"),
            Patient.phone.ilike(f"%{search}%"),
            Appointment.appointment_code.ilike(f"%{search}%")
        ))
        
    res = await db.execute(query)
    items = res.scalars().all()
    
    def format_apt(a):
        return {
            "id": a.id,
            "appointment_code": a.appointment_code,
            "date": a.appointment_date.isoformat(),
            "start_time": a.start_time.strftime("%H:%M"),
            "status": a.status.value,
            "reason": a.reason,
            "patient": {"id": a.patient.id, "full_name": a.patient.full_name, "phone": a.patient.phone, "patient_code": a.patient.patient_code} if a.patient else None,
            "doctor": {"id": a.doctor.id, "full_name": a.doctor.staff.full_name} if a.doctor else None,
            "specialty": {"id": a.specialty.id, "name": a.specialty.name} if a.specialty else None,
        }
    return [format_apt(a) for a in items]

class CreateAppointmentDTO(BaseModel):
    patient_id: str
    doctor_id: str
    date: date
    time: str
    reason: str

@router.post("/appointments")
async def create_appointment(data: CreateAppointmentDTO, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    doc = (await db.execute(select(Doctor).where(Doctor.id == data.doctor_id))).scalar_one_or_none()
    if not doc: raise HTTPException(400, "Doctor not found")
    
    pat = (await db.execute(select(Patient).where(Patient.id == data.patient_id))).scalar_one_or_none()
    if not pat: raise HTTPException(400, "Patient not found")
    
    h, m = map(int, data.time.split(":"))
    st = time(h, m)
    et = time(h, m+30) if m == 0 else time(h+1, 0)
    
    apt = Appointment(
        appointment_code=f"LH-{uuid.uuid4().hex[:6].upper()}",
        patient_id=pat.id,
        doctor_id=doc.id,
        specialty_id=doc.specialty_id,
        appointment_date=data.date,
        start_time=st,
        end_time=et,
        status=AppointmentStatus.SCHEDULED,
        reason=data.reason,
        created_by=current_user.id
    )
    db.add(apt)
    await db.flush()
    await log_activity(db, current_user, AuditAction.CREATE, "appointments", apt.id, f"Tạo lịch hẹn cho {pat.full_name}")
    await db.commit()
    return {"id": apt.id, "appointment_code": apt.appointment_code}

@router.post("/appointments/{id}/check-in")
async def check_in_appointment(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    apt = (await db.execute(select(Appointment).options(selectinload(Appointment.patient)).where(Appointment.id == id))).scalar_one_or_none()
    if not apt: raise HTTPException(404, "Appointment not found")
    
    if apt.status not in [AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING]:
        raise HTTPException(400, "Invalid status for check-in")
        
    apt.status = AppointmentStatus.WAITING
    apt.checked_in_at = _now()
    
    # Create queue
    q = Queue(
        appointment_id=apt.id,
        patient_id=apt.patient_id,
        doctor_id=apt.doctor_id,
        queue_number=random.randint(1, 999),
        check_in_time=_now(),
        status=QueueStatus.WAITING,
        created_by=current_user.id
    )
    db.add(q)
    await log_activity(db, current_user, AuditAction.UPDATE, "appointments", apt.id, f"Check-in bệnh nhân {apt.patient.full_name}")
    await db.commit()
    return {"success": True}

@router.patch("/appointments/{id}/status")
async def update_apt_status(id: str, status: str = Body(..., embed=True), reason: Optional[str] = Body(None, embed=True), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    apt = (await db.execute(select(Appointment).where(Appointment.id == id))).scalar_one_or_none()
    if not apt: raise HTTPException(404, "Appointment not found")
    apt.status = AppointmentStatus(status)
    if status == "cancelled":
        apt.cancelled_at = _now()
        apt.cancellation_reason = reason
    await log_activity(db, current_user, AuditAction.UPDATE, "appointments", apt.id, f"Đổi trạng thái lịch hẹn thành {status}")
    await db.commit()
    return {"success": True}

# ==================== PATIENTS ====================
@router.get("/patients")
async def list_patients(search: Optional[str] = None, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    query = select(Patient).order_by(Patient.created_at.desc())
    if search:
        query = query.where(or_(
            Patient.full_name.ilike(f"%{search}%"),
            Patient.phone.ilike(f"%{search}%"),
            Patient.patient_code.ilike(f"%{search}%")
        ))
    res = await db.execute(query)
    return res.scalars().all()

class CreatePatientDTO(BaseModel):
    full_name: str
    phone: str
    date_of_birth: date
    gender: str
    email: Optional[str] = None
    address: Optional[str] = None

@router.post("/patients")
async def create_patient(data: CreatePatientDTO, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    pat = Patient(
        patient_code=f"PAT-{uuid.uuid4().hex[:6].upper()}",
        full_name=data.full_name,
        phone=data.phone,
        date_of_birth=data.date_of_birth,
        gender=Gender(data.gender),
        email=data.email,
        address=data.address
    )
    db.add(pat)
    await db.flush()
    await log_activity(db, current_user, AuditAction.CREATE, "patients", pat.id, f"Tạo hồ sơ bệnh nhân {pat.full_name}")
    await db.commit()
    return {"id": pat.id}

@router.get("/patients/{id}")
async def get_patient_profile(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    pat = (await db.execute(select(Patient).where(Patient.id == id))).scalar_one_or_none()
    if not pat: raise HTTPException(404, "Patient not found")
    return pat

# ==================== QUEUE ====================
@router.get("/queue")
async def get_queue_list(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    today = date.today()
    res = await db.execute(
        select(Queue).options(
            selectinload(Queue.patient),
            selectinload(Queue.doctor).selectinload(Doctor.staff),
            selectinload(Queue.appointment)
        ).where(func.date(Queue.check_in_time) == today).order_by(Queue.created_at.desc())
    )
    items = res.scalars().all()
    return [{
        "id": q.id,
        "queue_number": q.queue_number,
        "status": q.status.value,
        "check_in_time": q.check_in_time.isoformat() if q.check_in_time else None,
        "patient": {"id": q.patient.id, "full_name": q.patient.full_name, "patient_code": q.patient.patient_code},
        "doctor": {"id": q.doctor.id, "full_name": q.doctor.staff.full_name},
        "appointment_code": q.appointment.appointment_code if q.appointment else None
    } for q in items]

@router.patch("/queue/{id}/status")
async def update_queue_status(id: str, status: str = Body(..., embed=True), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    q = (await db.execute(select(Queue).where(Queue.id == id))).scalar_one_or_none()
    if not q: raise HTTPException(404, "Queue not found")
    q.status = QueueStatus(status)
    if status == "called": q.called_time = _now()
    if status == "in_consultation": q.start_consultation_time = _now()
    if status == "completed": q.completed_time = _now()
    
    # Sync appointment status
    if q.appointment_id:
        apt = (await db.execute(select(Appointment).where(Appointment.id == q.appointment_id))).scalar_one_or_none()
        if apt:
            if status == "in_consultation": apt.status = AppointmentStatus.IN_CONSULTATION
            if status == "completed": apt.status = AppointmentStatus.COMPLETED
            
    await log_activity(db, current_user, AuditAction.UPDATE, "queue", q.id, f"Đổi trạng thái hàng đợi thành {status}")
    await db.commit()
    return {"success": True}

# ==================== PAYMENTS ====================
@router.get("/payments")
async def list_payments(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    res = await db.execute(select(Billing).options(selectinload(Billing.patient), selectinload(Billing.appointment)).order_by(Billing.created_at.desc()).limit(100))
    return res.scalars().all()

@router.post("/payments/{billing_id}/pay")
async def process_payment(billing_id: str, amount: float = Body(..., embed=True), method: str = Body(..., embed=True), db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    bill = (await db.execute(select(Billing).where(Billing.id == billing_id))).scalar_one_or_none()
    if not bill: raise HTTPException(404, "Billing not found")
    
    pay = Payment(billing_id=bill.id, amount=amount, payment_method=PaymentMethod(method), created_by=current_user.id)
    db.add(pay)
    
    bill.paid_amount += amount
    bill.remaining_amount = bill.total_amount - bill.paid_amount
    if bill.remaining_amount <= 0:
        bill.status = BillingStatus.PAID
    else:
        bill.status = BillingStatus.PARTIALLY_PAID
        
    await log_activity(db, current_user, AuditAction.PAYMENT, "billing", bill.id, f"Thanh toán {amount} qua {method}")
    await db.commit()
    return {"success": True}

# ==================== NOTIFICATIONS ====================
@router.get("/notifications")
async def get_notifications(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    res = await db.execute(select(Notification).order_by(Notification.created_at.desc()).limit(50))
    return res.scalars().all()

@router.patch("/notifications/{id}/read")
async def mark_notif_read(id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_receptionist)):
    if id == "all":
        await db.execute(Notification.__table__.update().values(is_read=True))
    else:
        n = (await db.execute(select(Notification).where(Notification.id == id))).scalar_one_or_none()
        if n: n.is_read = True
    await db.commit()
    return {"success": True}

