"""
Script  m bo c d liu cho hm nay (appointments, waiting patients, billing, audit logs).
Chy: python seed_today.py
"""
import asyncio
import uuid
import random
from datetime import date, datetime, time, timezone

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.models.models import (
    User, Staff, Patient, Doctor, Appointment, AppointmentStatus,
    Billing, BillingStatus, AuditLog, AuditAction
)

async def seed_today_data(db: AsyncSession):
    print(" Bt u kim tra v to d liu cho hm nay...")
    today = date.today()

    # Get random doctor and patient
    result = await db.execute(select(Doctor))
    doctors = result.scalars().all()
    if not doctors:
        print("Khng c doctor no, vui lng chy seed.py trc.")
        return

    result = await db.execute(select(Patient))
    patients = result.scalars().all()
    if not patients:
        print("Khng c patient no, vui lng chy seed.py trc.")
        return
        
    result = await db.execute(select(User).where(User.username == "reception"))
    receptionist = result.scalar_one_or_none()
    receptionist_id = receptionist.id if receptionist else None

    # Check today's appointments
    result = await db.execute(select(Appointment).where(Appointment.appointment_date == today))
    today_appointments = result.scalars().all()
    
    if len(today_appointments) < 5:
        print(f"Ch c {len(today_appointments)} lch hn hm nay. ang to thm...")
        for i in range(5 - len(today_appointments)):
            doc = random.choice(doctors)
            pat = random.choice(patients)
            
            status = random.choice([AppointmentStatus.WAITING, AppointmentStatus.SCHEDULED])
            hour = random.randint(8, 16)
            minute = random.choice([0, 30])
            
            apt = Appointment(
                id=str(uuid.uuid4()),
                appointment_code=f"LH-TODAY-{random.randint(1000, 9999)}",
                patient_id=pat.id,
                doctor_id=doc.id,
                specialty_id=doc.specialty_id,
                appointment_date=today,
                start_time=time(hour, minute),
                end_time=time(hour, minute + 30) if minute == 0 else time(hour + 1, 0),
                status=status,
                reason="Khm bnh trong ngy",
                created_by=receptionist_id
            )
            
            if status == AppointmentStatus.WAITING:
                apt.checked_in_at = datetime.now(timezone.utc)
                
            db.add(apt)
            today_appointments.append(apt)
            
        await db.flush()
        print(" to thm lch hn.")
    else:
        print(" c  lch hn cho hm nay.")

    # Make sure at least some are WAITING
    waiting = [a for a in today_appointments if a.status == AppointmentStatus.WAITING]
    if not waiting and today_appointments:
        apt = today_appointments[0]
        apt.status = AppointmentStatus.WAITING
        apt.checked_in_at = datetime.now(timezone.utc)
        print(f" cp nht lch hn {apt.appointment_code} thnh WAITING.")
        await db.flush()

    # Make sure we have some pending billing
    result = await db.execute(select(Billing).where(Billing.status == BillingStatus.UNPAID))
    unpaid_bills = result.scalars().all()
    if len(unpaid_bills) < 2:
        print("ang to thm ha n UNPAID...")
        for a in today_appointments[:2]:
            bill = Billing(
                id=str(uuid.uuid4()),
                invoice_code=f"HD-TODAY-{random.randint(1000, 9999)}",
                patient_id=a.patient_id,
                appointment_id=a.id,
                consultation_fee=200000.0,
                medicine_fee=0,
                service_fee=0,
                total_amount=200000.0,
                insurance_covered=0,
                paid_amount=0,
                remaining_amount=200000.0,
                status=BillingStatus.UNPAID,
            )
            db.add(bill)
        await db.flush()
    else:
        print(" c  ha n UNPAID.")

    # Make sure we have some audit logs for receptionist
    if receptionist_id:
        result = await db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == receptionist_id)
        )
        logs = result.scalars().all()
        if len(logs) < 5:
            print("ang to thm Audit Logs cho receptionist...")
            for i in range(5):
                log = AuditLog(
                    id=str(uuid.uuid4()),
                    user_id=receptionist_id,
                    username=receptionist.username,
                    user_role=receptionist.role.value,
                    action=AuditAction.UPDATE,
                    resource_type="appointments",
                    resource_id=str(uuid.uuid4()),
                    details="Cp nht trng thi lch hn",
                    ip_address="127.0.0.1",
                    result="success",
                )
                db.add(log)
            await db.flush()

    await db.commit()
    print(" Seed d liu hm nay hon tt!")


async def main():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            await seed_today_data(session)
        except Exception as e:
            await session.rollback()
            print(f" Li: {e}")
            raise
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
