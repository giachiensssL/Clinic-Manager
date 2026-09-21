import asyncio
import uuid
import random
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.models import (
    User, Patient, Doctor, Department, Specialty,
    Appointment, Consultation, Prescription, PrescriptionItem,
    LabResult, Billing, Payment, Notification, Medicine, Service,
    AppointmentStatus, BillingStatus, PaymentMethod, EMRStatus, LabResultStatus, NotificationType, UserRole, Gender
)
from app.core.security import hash_password

async def seed_demo():
    print("Bắt đầu Seed Dữ liệu Patient Demo...")
    async with AsyncSessionLocal() as db:
        # 1. Tìm hoặc tạo User Patient
        user_result = await db.execute(select(User).where(User.username == "dtc245200433@ictu.edu.vn"))
        patient_user = user_result.scalar_one_or_none()
        if not patient_user:
            patient_user = User(
                username="patient",
                email="patient@aiclinic.com",
                hashed_password=hash_password("password123"),
                role=UserRole.PATIENT,
                is_active=True,
                is_verified=True
            )
            db.add(patient_user)
            await db.flush()

        # 2. Tìm hoặc tạo Patient profile
        patient_result = await db.execute(select(Patient).where(Patient.user_id == patient_user.id))
        patient = patient_result.scalar_one_or_none()
        if not patient:
            patient = Patient(
                id=str(uuid.uuid4()),
                user_id=patient_user.id,
                full_name="Nguyễn Văn An",
                date_of_birth=datetime(1990, 5, 15, tzinfo=timezone.utc),
                gender=Gender.MALE,
                phone="0901234567",
                address="123 Nguyễn Văn Cừ, Quận 5, TP.HCM",
                blood_type="O+",
                allergies="Không",
                medical_history="Không có tiền sử bệnh lý nghiêm trọng."
            )
            db.add(patient)
            await db.flush()

        # Delete old demo data for this patient to ensure idempotency
        await db.execute(delete(Payment).where(Payment.billing_id.in_(
            select(Billing.id).where(Billing.patient_id == patient.id)
        )))
        await db.execute(delete(Billing).where(Billing.patient_id == patient.id))
        await db.execute(delete(PrescriptionItem).where(PrescriptionItem.prescription_id.in_(
            select(Prescription.id).where(Prescription.patient_id == patient.id)
        )))
        await db.execute(delete(Prescription).where(Prescription.patient_id == patient.id))
        await db.execute(delete(LabResult).where(LabResult.patient_id == patient.id))
        await db.execute(delete(Consultation).where(Consultation.patient_id == patient.id))
        await db.execute(delete(Appointment).where(Appointment.patient_id == patient.id))
        await db.execute(delete(Notification).where(Notification.user_id == patient_user.id))
        await db.flush()

        # 3. Lấy Data tham chiếu (Doctor, Medicine, Service)
        doctor = (await db.execute(select(Doctor).limit(1))).scalar_one_or_none()
        if not doctor:
            print("Không tìm thấy bác sĩ nào, vui lòng chạy seed chung của hệ thống trước!")
            return

        med1 = (await db.execute(select(Medicine).where(Medicine.name == "Paracetamol 500mg"))).scalar_one_or_none()
        if not med1:
            med1 = Medicine(name="Paracetamol 500mg", type="Thuốc giảm đau", unit="Viên", usage="Uống", price=500)
            db.add(med1)
            await db.flush()

        srv1 = (await db.execute(select(Service).where(Service.name == "Khám tổng quát"))).scalar_one_or_none()
        if not srv1:
            srv1 = Service(name="Khám tổng quát", category="Khám bệnh", price=150000, is_active=True)
            db.add(srv1)
            await db.flush()

        # 4. Sinh dữ liệu từ 2024 đến 2026
        now = datetime.now(timezone.utc)
        
        def create_visit(days_ago, is_future=False):
            visit_date = now + timedelta(days=days_ago) if is_future else now - timedelta(days=days_ago)
            
            # Appointment
            apt = Appointment(
                patient_id=patient.id,
                doctor_id=doctor.id,
                specialty_id=doctor.specialty_id,
                appointment_code=f"APT-{int(visit_date.timestamp())}",
                appointment_date=visit_date.date(),
                start_time=visit_date.time(),
                end_time=(visit_date + timedelta(minutes=30)).time(),
                reason="Kiểm tra sức khỏe định kỳ" if days_ago > 30 else "Đau họng, sốt nhẹ",
                status=AppointmentStatus.SCHEDULED if is_future else AppointmentStatus.COMPLETED
            )
            db.add(apt)
            return apt, visit_date

        visits = [
            create_visit(700), # 2024
            create_visit(600),
            create_visit(400), # 2025
            create_visit(350),
            create_visit(200),
            create_visit(150),
            create_visit(30),  # 2026 recently
            create_visit(10),
            create_visit(2, is_future=True), # Upcoming
            create_visit(5, is_future=True), # Upcoming
        ]
        
        await db.flush()

        for apt, visit_date in visits:
            if apt.status == AppointmentStatus.COMPLETED:
                # Consultation
                cons = Consultation(
                    patient_id=patient.id,
                    doctor_id=doctor.id,
                    appointment_id=apt.id,
                    chief_complaint="Bệnh nhân than mệt mỏi" if random.random() > 0.5 else "Khám sức khỏe bình thường",
                    weight=67,
                    height=170,
                    blood_pressure="120/80",
                    heart_rate=72,
                    temperature=37.0,
                    status=EMRStatus.COMPLETED
                )
                db.add(cons)
                await db.flush()

                # Lab Result (only for some visits)
                if random.random() > 0.3:
                    lab = LabResult(
                        patient_id=patient.id,
                        doctor_id=doctor.id,
                        consultation_id=cons.id,
                        test_code=f"LAB_{int(visit_date.timestamp())}",
                        test_name="Xét nghiệm máu tổng quát",
                        test_date=visit_date,
                        status=LabResultStatus.COMPLETED,
                        result_data=[
                            {"name": "Hồng cầu", "value": 4.5, "unit": "T/L", "ref": "4.0-5.8", "is_abnormal": False},
                            {"name": "Bạch cầu", "value": 11.2 if random.random() > 0.8 else 7.5, "unit": "G/L", "ref": "4.0-10.0", "is_abnormal": True}
                        ]
                    )
                    db.add(lab)

                # Prescription
                if random.random() > 0.2:
                    rx = Prescription(
                        prescription_code=f"RX-{int(visit_date.timestamp())}",
                        patient_id=patient.id,
                        doctor_id=doctor.id,
                        consultation_id=cons.id,
                        notes="Uống nhiều nước, nghỉ ngơi"
                    )
                    db.add(rx)
                    await db.flush()
                    
                    rx_item = PrescriptionItem(
                        prescription_id=rx.id,
                        medicine_id=med1.id,
                        quantity=20,
                        dosage="1 viên",
                        frequency="Sáng 1, Tối 1",
                        duration_days=10,
                        instructions="Sau ăn"
                    )
                    db.add(rx_item)

                # Billing & Payment
                bill = Billing(
                    invoice_code=f"INV-{int(visit_date.timestamp())}",
                    patient_id=patient.id,
                    appointment_id=apt.id,
                    consultation_fee=150000,
                    total_amount=150000,
                    paid_amount=150000,
                    remaining_amount=0,
                    status=BillingStatus.PAID
                )
                db.add(bill)
                await db.flush()

                payment = Payment(
                    billing_id=bill.id,
                    amount=150000,
                    payment_method=PaymentMethod.CASH,
                    created_at=visit_date
                )
                db.add(payment)

            # Notification cho từng lịch khám
            notif_msg = f"Bạn có lịch hẹn vào lúc {apt.start_time.strftime('%H:%M')} ngày {apt.appointment_date.strftime('%d/%m/%Y')}."
            if apt.status == AppointmentStatus.COMPLETED:
                notif_msg = f"Cảm ơn bạn đã đến khám vào ngày {apt.appointment_date.strftime('%d/%m/%Y')}."
            
            notif = Notification(
                user_id=patient_user.id,
                type=NotificationType.APPOINTMENT,
                title="Thông báo lịch hẹn",
                message=notif_msg,
                is_read=True if apt.status == AppointmentStatus.COMPLETED else False,
                created_at=visit_date - timedelta(days=1)
            )
            db.add(notif)

        # Dữ liệu unpaid bill sẽ được tạo từ các lịch hẹn sắp tới chưa hoàn thành (SCHEDULED),
        # nhưng Billing được tạo khi Consultation hoàn thành. Do đó, chỉ cần một Billing chưa thanh toán.
        # Ta lấy lịch hẹn tương lai cuối cùng làm lịch đã khám nhưng chưa thanh toán.
        last_apt = visits[-1][0]
        if last_apt:
            last_apt.status = AppointmentStatus.COMPLETED
            db.add(Billing(
                invoice_code=f"INV-UNPAID-{int(now.timestamp())}",
                patient_id=patient.id,
                appointment_id=last_apt.id,
                consultation_fee=250000,
                total_amount=250000,
                paid_amount=0,
                remaining_amount=250000,
                status=BillingStatus.UNPAID
            ))
        
        # New notification unread
        db.add(Notification(
            user_id=patient_user.id,
            type=NotificationType.LAB_RESULT,
            title="Kết quả xét nghiệm mới",
            message="Bạn có một kết quả xét nghiệm mới cần xem.",
            is_read=False,
            created_at=now
        ))

        await db.commit()
        print(f"Đã tạo thành công dữ liệu demo cho bệnh nhân Nguyễn Văn An (ID: {patient.id})")

if __name__ == "__main__":
    asyncio.run(seed_demo())
