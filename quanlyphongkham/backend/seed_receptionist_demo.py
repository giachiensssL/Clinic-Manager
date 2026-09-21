import asyncio
import uuid
import random
from datetime import date, datetime, time, timedelta, timezone


from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, func, and_

from app.core.config import settings
from app.models.models import (
    User, Staff, Patient, Doctor, Appointment, AppointmentStatus,
    Billing, BillingStatus, AuditLog, AuditAction, UserRole, Gender,
    Specialty, Department, Payment, PaymentMethod, Queue, QueueStatus,
    Notification, NotificationType, WorkingSchedule
)

from app.core.security import hash_password

def get_password_hash(password: str) -> str:
    return hash_password(password)

async def seed_receptionist_demo(db: AsyncSession):
    print("🌱 Bắt đầu tạo dữ liệu Demo cho module Lễ Tân...")

    # 1. Create Specialties & Departments if < 8
    result = await db.execute(select(Specialty))
    specialties = result.scalars().all()
    if len(specialties) < 8:
        print("Tạo thêm Specialties & Departments...")
        dep = Department(name=f"Khám Tổng Hợp {uuid.uuid4().hex[:4]}", description="Khoa khám bệnh")
        db.add(dep)
        await db.flush()
        
        spec_names = ["Nội khoa", "Ngoại khoa", "Nhi khoa", "Sản phụ khoa", "Mắt", "Tai Mũi Họng", "Da liễu", "Răng Hàm Mặt"]
        for name in spec_names:
            if not any(s.name == name for s in specialties):
                s = Specialty(name=name, description=f"Chuyên khoa {name}")
                db.add(s)
                specialties.append(s)
        await db.flush()
        
    result = await db.execute(select(Department))
    departments = result.scalars().all()

    # 2. Create Doctors if < 8
    result = await db.execute(select(Doctor))
    doctors = result.scalars().all()
    if len(doctors) < 8:
        print("Tạo thêm Doctors...")
        for i in range(8 - len(doctors)):
            u = User(
                username=f"doctor_demo_{i}_{uuid.uuid4().hex[:4]}",
                email=f"doctor_demo_{i}_{uuid.uuid4().hex[:4]}@clinic.com",
                hashed_password=get_password_hash("123456"),
                role=UserRole.DOCTOR
            )
            db.add(u)
            await db.flush()
            
            s = Staff(
                user_id=u.id,
                employee_id=f"EMP-DOC-{random.randint(1000, 9999)}",
                full_name=f"BS. Demo {i}",
                phone=f"09{random.randint(10000000, 99999999)}",
                gender=random.choice([Gender.MALE, Gender.FEMALE])
            )
            db.add(s)
            await db.flush()
            
            d = Doctor(
                staff_id=s.id,
                department_id=random.choice(departments).id,
                specialty_id=random.choice(specialties).id,
                license_number=f"LIC-{random.randint(1000, 9999)}",
                consultation_fee=random.choice([150000, 200000, 300000, 500000])
            )
            db.add(d)
            doctors.append(d)
            await db.flush()
            
            # Schedules
            for day in range(1, 6):
                sch = WorkingSchedule(
                    doctor_id=d.id, day_of_week=day, start_time=time(8, 0), end_time=time(17, 0)
                )
                db.add(sch)
        await db.flush()

    # 3. Create Receptionists if < 8
    result = await db.execute(select(User).where(User.role == UserRole.RECEPTIONIST))
    receptionists = result.scalars().all()
    if len(receptionists) < 8:
        print("Tạo thêm Receptionists...")
        for i in range(8 - len(receptionists)):
            u = User(
                username=f"reception_demo_{i}_{uuid.uuid4().hex[:4]}",
                email=f"reception_demo_{i}_{uuid.uuid4().hex[:4]}@clinic.com",
                hashed_password=get_password_hash("123456"),
                role=UserRole.RECEPTIONIST
            )
            db.add(u)
            await db.flush()
            
            s = Staff(
                user_id=u.id,
                employee_id=f"EMP-REC-{random.randint(1000, 9999)}",
                full_name=f"Lễ tân Demo {i}",
                phone=f"09{random.randint(10000000, 99999999)}",
                gender=random.choice([Gender.MALE, Gender.FEMALE])
            )
            db.add(s)
            receptionists.append(u)
        await db.flush()

    # 4. Create Patients if < 30
    result = await db.execute(select(Patient))
    patients = result.scalars().all()
    if len(patients) < 30:
        print("Tạo thêm Patients...")
        for i in range(30 - len(patients)):
            p = Patient(
                patient_code=f"PAT-{uuid.uuid4().hex[:6].upper()}",
                full_name=f"Bệnh nhân Demo {uuid.uuid4().hex[:4]}",
                date_of_birth=date(random.randint(1960, 2010), random.randint(1, 12), random.randint(1, 28)),
                gender=random.choice([Gender.MALE, Gender.FEMALE]),
                phone=f"09{random.randint(10000000, 99999999)}",
                address="Hà Nội"
            )
            db.add(p)
            patients.append(p)
        await db.flush()

    # 5. Create Appointments, Queues, Payments, Notifications, ActivityLogs
    print("Tạo thêm Appointments, Queues, Payments, Notifications, ActivityLogs...")
    
    result = await db.execute(select(Appointment))
    appointments = result.scalars().all()
    
    # We need ~150 appointments
    target_appointments = 150 - len(appointments)
    
    now = datetime.now(timezone.utc)
    today = now.date()
    
    for i in range(target_appointments):
        doc = random.choice(doctors)
        pat = random.choice(patients)
        rec = random.choice(receptionists)
        
        # Decide date: some in past, some today, some future
        day_offset = random.choice([-5, -4, -3, -2, -1, 0, 0, 0, 1, 2, 3])
        apt_date = today + timedelta(days=day_offset)
        
        status = AppointmentStatus.COMPLETED
        if day_offset > 0:
            status = AppointmentStatus.SCHEDULED
        elif day_offset == 0:
            status = random.choice([AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING, AppointmentStatus.IN_CONSULTATION, AppointmentStatus.COMPLETED, AppointmentStatus.CANCELLED])
            
        hour = random.randint(8, 16)
        minute = random.choice([0, 30])
        start_t = time(hour, minute)
        end_t = time(hour, minute + 30) if minute == 0 else time(hour + 1, 0)
        
        apt = Appointment(
            appointment_code=f"LH-{uuid.uuid4().hex[:6].upper()}",
            patient_id=pat.id,
            doctor_id=doc.id,
            specialty_id=doc.specialty_id,
            appointment_date=apt_date,
            start_time=start_t,
            end_time=end_t,
            status=status,
            reason="Khám tổng quát",
            created_by=rec.id,
            checked_in_at=now if status in [AppointmentStatus.WAITING, AppointmentStatus.IN_CONSULTATION, AppointmentStatus.COMPLETED] else None,
        )
        db.add(apt)
        await db.flush()
        
        # Queue
        if status in [AppointmentStatus.WAITING, AppointmentStatus.IN_CONSULTATION, AppointmentStatus.COMPLETED]:
            q_status = QueueStatus.WAITING
            if status == AppointmentStatus.IN_CONSULTATION: q_status = QueueStatus.IN_CONSULTATION
            if status == AppointmentStatus.COMPLETED: q_status = QueueStatus.COMPLETED
            
            q = Queue(
                appointment_id=apt.id,
                patient_id=pat.id,
                doctor_id=doc.id,
                queue_number=random.randint(1, 100),
                check_in_time=now - timedelta(minutes=random.randint(30, 60)),
                status=q_status,
                created_by=rec.id
            )
            if q_status in [QueueStatus.IN_CONSULTATION, QueueStatus.COMPLETED]:
                q.called_time = q.check_in_time + timedelta(minutes=random.randint(5, 15))
                q.start_consultation_time = q.called_time
            if q_status == QueueStatus.COMPLETED:
                q.completed_time = q.start_consultation_time + timedelta(minutes=random.randint(10, 30))
            db.add(q)
            
        # Billing & Payment
        if status == AppointmentStatus.COMPLETED:
            bill = Billing(
                invoice_code=f"HD-{uuid.uuid4().hex[:6].upper()}",
                patient_id=pat.id,
                appointment_id=apt.id,
                consultation_fee=doc.consultation_fee,
                total_amount=doc.consultation_fee,
                paid_amount=doc.consultation_fee,
                remaining_amount=0,
                status=BillingStatus.PAID
            )
            db.add(bill)
            await db.flush()
            
            pay = Payment(
                billing_id=bill.id,
                amount=doc.consultation_fee,
                payment_method=random.choice([PaymentMethod.CASH, PaymentMethod.TRANSFER, PaymentMethod.CARD]),
                created_by=rec.id
            )
            db.add(pay)
            
        # Notifications
        notif = Notification(
            user_id=rec.id,
            type=NotificationType.APPOINTMENT,
            title="Lịch hẹn mới",
            message=f"Bệnh nhân {pat.full_name} vừa đặt lịch khám.",
            reference_id=apt.id
        )
        db.add(notif)
        
        # Activity Logs
        log = AuditLog(
            user_id=rec.id,
            username=rec.username,
            user_role=rec.role.value,
            action=AuditAction.CREATE,
            resource_type="appointments",
            resource_id=apt.id,
            details=f"Tạo lịch hẹn cho {pat.full_name}",
            ip_address="127.0.0.1"
        )
        db.add(log)
        
        if i % 20 == 0:
            await db.commit()

    await db.commit()
    print("✅ Seed dữ liệu Lễ Tân hoàn tất!")

async def main():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            await seed_receptionist_demo(session)
        except Exception as e:
            await session.rollback()
            print(f"❌ Lỗi: {e}")
            raise
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
