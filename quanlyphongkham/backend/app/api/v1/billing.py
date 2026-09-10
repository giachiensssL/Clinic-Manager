"""
Billing API — Quan ly hoa don va thanh toan
"""
import uuid
from typing import Optional
from datetime import datetime, timezone, date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.deps import get_accountant, get_staff, get_current_user
from app.models.models import (
    Billing, BillingStatus, Payment, PaymentMethod,
    Appointment, AppointmentStatus, User, AuditAction,
)
from app.services.audit_service import log_action

router = APIRouter()


def _generate_invoice_code() -> str:
    import random
    return f"HD{random.randint(100000, 999999)}"

@router.get("", summary="Danh sach hoa don")
async def list_billings(
    patient_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    from app.models.models import Patient, UserRole
    query = select(Billing).options(
        selectinload(Billing.patient)
    ).order_by(Billing.created_at.desc())
    
    if current_user.role == UserRole.PATIENT:
        pid_result = await db.execute(select(Patient.id).where(Patient.user_id == current_user.id))
        pid = pid_result.scalar_one_or_none()
        if not pid:
            return {"items": [], "total": 0}
        query = query.where(Billing.patient_id == pid)
    elif patient_id:
        query = query.where(Billing.patient_id == patient_id)
        
    result = await db.execute(query)
    items = result.scalars().all()
    
    response = []
    for b in items:
        response.append({
            "id": b.id,
            "invoice_code": b.invoice_code,
            "patient_name": b.patient.full_name if b.patient else "N/A",
            "total_amount": b.total_amount,
            "remaining_amount": b.remaining_amount,
            "status": b.status.value,
            "created_at": b.created_at.isoformat()
        })
    return {"items": response, "total": len(response)}


@router.post("", summary="Tao hoa don moi", status_code=201)
async def create_billing(
    appointment_id: str,
    consultation_fee: float = 0.0,
    medicine_fee: float = 0.0,
    service_fee: float = 0.0,
    insurance_covered: float = 0.0,
    discount: float = 0.0,
    due_date: Optional[date] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_accountant),
) -> dict:
    """Tao hoa don cho mot lich hen — chi ke toan va admin duoc phep"""
    appt = (await db.execute(select(Appointment).where(Appointment.id == appointment_id))).scalar_one_or_none()
    if not appt:
        raise HTTPException(status_code=404, detail="Khong tim thay lich hen")

    existing = (await db.execute(select(Billing).where(Billing.appointment_id == appointment_id))).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Lich hen nay da co hoa don")

    total = consultation_fee + medicine_fee + service_fee - insurance_covered - discount
    if total < 0:
        total = 0.0

    billing = Billing(
        id=str(uuid.uuid4()),
        invoice_code=_generate_invoice_code(),
        patient_id=appt.patient_id,
        appointment_id=appointment_id,
        consultation_fee=consultation_fee,
        medicine_fee=medicine_fee,
        service_fee=service_fee,
        total_amount=total,
        insurance_covered=insurance_covered,
        discount=discount,
        paid_amount=0.0,
        remaining_amount=total,
        status=BillingStatus.UNPAID,
        due_date=due_date,
        notes=notes,
    )
    db.add(billing)
    await db.flush()

    await log_action(db, current_user, AuditAction.CREATE, "billing", billing.id)
    return {
        "id": billing.id,
        "invoice_code": billing.invoice_code,
        "total_amount": billing.total_amount,
        "status": billing.status.value,
    }


@router.get("/{billing_id}", summary="Chi tiet hoa don")
async def get_billing(
    billing_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Xem chi tiet hoa don va lich su thanh toan"""
    result = await db.execute(
        select(Billing)
        .options(selectinload(Billing.payments))
        .where(Billing.id == billing_id)
    )
    b = result.scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Khong tim thay hoa don")

    await log_action(db, current_user, AuditAction.READ, "billing", billing_id)

    return {
        "id": b.id,
        "invoice_code": b.invoice_code,
        "patient_id": b.patient_id,
        "appointment_id": b.appointment_id,
        "consultation_fee": b.consultation_fee,
        "medicine_fee": b.medicine_fee,
        "service_fee": b.service_fee,
        "total_amount": b.total_amount,
        "insurance_covered": b.insurance_covered,
        "discount": b.discount,
        "paid_amount": b.paid_amount,
        "remaining_amount": b.remaining_amount,
        "status": b.status.value,
        "due_date": b.due_date.isoformat() if b.due_date else None,
        "notes": b.notes,
        "payments": [
            {
                "id": p.id,
                "amount": p.amount,
                "payment_method": p.payment_method.value,
                "transaction_id": p.transaction_id,
                "notes": p.notes,
                "created_at": p.created_at.isoformat(),
            }
            for p in b.payments
        ],
    }


@router.post("/{billing_id}/payments", summary="Ghi nhan thanh toan", status_code=201)
async def record_payment(
    billing_id: str,
    amount: float,
    payment_method: str,
    transaction_id: Optional[str] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_accountant),
) -> dict:
    """Ghi nhan mot lan thanh toan cho hoa don — tu dong cap nhat trang thai"""
    b = (await db.execute(select(Billing).where(Billing.id == billing_id))).scalar_one_or_none()
    if not b:
        raise HTTPException(status_code=404, detail="Khong tim thay hoa don")
    if b.status == BillingStatus.PAID:
        raise HTTPException(status_code=400, detail="Hoa don nay da duoc thanh toan day du")

    try:
        method = PaymentMethod(payment_method)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Phuong thuc thanh toan khong hop le: {payment_method}")

    if amount <= 0:
        raise HTTPException(status_code=400, detail="So tien thanh toan phai lon hon 0")
    if amount > b.remaining_amount:
        raise HTTPException(status_code=400, detail=f"So tien vuot qua con lai: {b.remaining_amount}")

    payment = Payment(
        id=str(uuid.uuid4()),
        billing_id=billing_id,
        amount=amount,
        payment_method=method,
        transaction_id=transaction_id,
        notes=notes,
        created_by=current_user.id,
    )
    db.add(payment)

    # Cap nhat tong da thanh toan va con lai
    b.paid_amount += amount
    b.remaining_amount = b.total_amount - b.paid_amount

    # Cap nhat trang thai hoa don
    if b.remaining_amount <= 0:
        b.status = BillingStatus.PAID
        b.remaining_amount = 0.0
        # Cap nhat trang thai lich hen -> PAID
        appt = (await db.execute(select(Appointment).where(Appointment.id == b.appointment_id))).scalar_one_or_none()
        if appt:
            appt.status = AppointmentStatus.PAID
    elif b.paid_amount > 0:
        b.status = BillingStatus.PARTIALLY_PAID

    await db.flush()

    await log_action(db, current_user, AuditAction.PAYMENT, "billing", billing_id,
                     details=f"Payment {amount} via {payment_method}")
    return {
        "id": payment.id,
        "amount": payment.amount,
        "billing_status": b.status.value,
        "remaining_amount": b.remaining_amount,
    }