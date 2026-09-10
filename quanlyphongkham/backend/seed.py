"""
seed.py — Tạo dữ liệu demo đầy đủ cho Clinic Management System
Chạy: python seed.py
"""
import asyncio
import uuid
import json
import random
from datetime import datetime, date, time, timedelta, timezone

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.models.models import (
    User, Staff, Patient, Department, Specialty, Doctor, WorkingSchedule,
    Appointment, Consultation, Diagnosis, ConsultationDiagnosis,
    Medicine, Prescription, PrescriptionItem, Service, Billing, Payment,
    AuditLog, AIConversation, AIMessage, AIGuardrailRule,
    UserRole, Gender, AppointmentStatus, BillingStatus, PaymentMethod, EMRStatus, AuditAction
)
from app.core.database import Base


# ===== DEMO ACCOUNTS =====
DEMO_USERS = [
    {
        "email": "admin@clinic.local",
        "username": "admin",
        "password": "Admin123!",
        "role": UserRole.ADMIN,
        "full_name": "Quản trị viên",
        "employee_id": "NV001",
    },
    {
        "email": "doctor@clinic.local",
        "username": "doctor",
        "password": "Doctor123!",
        "role": UserRole.DOCTOR,
        "full_name": "BS. Trần Minh Anh",
        "employee_id": "BS001",
    },
    {
        "email": "reception@clinic.local",
        "username": "reception",
        "password": "Reception123!",
        "role": UserRole.RECEPTIONIST,
        "full_name": "Lê Thị Hương",
        "employee_id": "LT001",
    },
    {
        "email": "accountant@clinic.local",
        "username": "accountant",
        "password": "Accountant123!",
        "role": UserRole.ACCOUNTANT,
        "full_name": "Nguyễn Văn Kế",
        "employee_id": "KT001",
    },
    {
        "email": "patient@clinic.local",
        "username": "patient",
        "password": "Patient123!",
        "role": UserRole.PATIENT,
        "full_name": "Nguyễn Văn An",
    },
]

DEPARTMENTS = [
    "Nội khoa tổng quát",
    "Da liễu",
    "Nhi khoa",
    "Tim mạch",
    "Tai Mũi Họng",
    "Mắt",
    "Cơ xương khớp",
]

SPECIALTIES = [
    "Nội khoa",
    "Da liễu",
    "Nhi khoa",
    "Tim mạch",
    "Tai Mũi Họng",
    "Nhãn khoa",
    "Cơ xương khớp",
]

DOCTORS_DATA = [
    {
        "full_name": "BS. Trần Minh Anh",
        "specialty": "Nội khoa",
        "department": "Nội khoa tổng quát",
        "license": "BS-2015-001",
        "qualification": "Thạc sĩ Y khoa",
        "fee": 200000,
    },
    {
        "full_name": "BS. Nguyễn Văn Bình",
        "specialty": "Da liễu",
        "department": "Da liễu",
        "license": "BS-2018-002",
        "qualification": "Bác sĩ chuyên khoa I",
        "fee": 250000,
    },
    {
        "full_name": "BS. Lê Thu Hà",
        "specialty": "Nhi khoa",
        "department": "Nhi khoa",
        "license": "BS-2016-003",
        "qualification": "Tiến sĩ Y khoa",
        "fee": 300000,
    },
    {
        "full_name": "BS. Phạm Minh Đức",
        "specialty": "Tim mạch",
        "department": "Tim mạch",
        "license": "BS-2012-004",
        "qualification": "Phó Giáo sư, Tiến sĩ",
        "fee": 350000,
    },
    {
        "full_name": "BS. Hoàng Lan",
        "specialty": "Tai Mũi Họng",
        "department": "Tai Mũi Họng",
        "license": "BS-2019-005",
        "qualification": "Bác sĩ chuyên khoa II",
        "fee": 220000,
    },
]

PATIENT_NAMES = [
    ("Nguyễn Văn An", Gender.MALE, "0901234567"),
    ("Trần Thị Bình", Gender.FEMALE, "0912345678"),
    ("Lê Văn Cường", Gender.MALE, "0923456789"),
    ("Phạm Thị Dung", Gender.FEMALE, "0934567890"),
    ("Hoàng Văn Em", Gender.MALE, "0945678901"),
    ("Vũ Thị Phương", Gender.FEMALE, "0956789012"),
    ("Đặng Văn Giang", Gender.MALE, "0967890123"),
    ("Bùi Thị Hoa", Gender.FEMALE, "0978901234"),
    ("Ngô Văn Ích", Gender.MALE, "0989012345"),
    ("Đinh Thị Kim", Gender.FEMALE, "0990123456"),
    ("Lý Văn Long", Gender.MALE, "0901234568"),
    ("Mai Thị Mỹ", Gender.FEMALE, "0912345679"),
    ("Phan Văn Nam", Gender.MALE, "0923456780"),
    ("Tô Thị Oanh", Gender.FEMALE, "0934567891"),
    ("Đỗ Văn Phúc", Gender.MALE, "0945678902"),
    ("Hà Thị Quỳnh", Gender.FEMALE, "0956789013"),
    ("Trịnh Văn Sơn", Gender.MALE, "0967890124"),
    ("Cù Thị Thảo", Gender.FEMALE, "0978901235"),
    ("Võ Văn Uy", Gender.MALE, "0989012346"),
    ("Lưu Thị Vân", Gender.FEMALE, "0990123457"),
]

ICD10_DIAGNOSES = [
    ("J06.9", "Nhiễm khuẩn hô hấp trên cấp tính, không đặc hiệu", "Hô hấp"),
    ("K29.7", "Viêm dạ dày, không đặc hiệu", "Tiêu hóa"),
    ("I10", "Tăng huyết áp nguyên phát", "Tim mạch"),
    ("E11.9", "Đái tháo đường type 2 không có biến chứng", "Nội tiết"),
    ("J45.9", "Hen phế quản, không đặc hiệu", "Hô hấp"),
    ("M54.5", "Đau thắt lưng", "Cơ xương khớp"),
    ("L30.9", "Viêm da, không đặc hiệu", "Da liễu"),
    ("H10.9", "Viêm kết mạc, không đặc hiệu", "Nhãn khoa"),
    ("J32.0", "Viêm xoang hàm mạn tính", "Tai Mũi Họng"),
    ("F41.9", "Rối loạn lo âu, không đặc hiệu", "Tâm thần"),
    ("A09", "Tiêu chảy và viêm dạ dày ruột do nguyên nhân không rõ", "Tiêu hóa"),
    ("R51", "Đau đầu", "Thần kinh"),
    ("B34.9", "Nhiễm virus, không đặc hiệu", "Nhiễm khuẩn"),
    ("Z00.0", "Khám sức khỏe định kỳ", "Phòng ngừa"),
    ("N39.0", "Nhiễm khuẩn đường tiết niệu, vị trí không đặc hiệu", "Tiết niệu"),
]

MEDICINES = [
    {
        "name": "Paracetamol 500mg",
        "generic_name": "Paracetamol",
        "form": "Viên nén",
        "strength": "500mg",
        "unit": "Viên",
        "drug_class": "Analgesic",
        "price": 2000,
    },
    {
        "name": "Amoxicillin 500mg",
        "generic_name": "Amoxicillin",
        "form": "Viên nang",
        "strength": "500mg",
        "unit": "Viên",
        "drug_class": "Penicillin",
        "price": 5000,
    },
    {
        "name": "Cetirizine 10mg",
        "generic_name": "Cetirizine Hydrochloride",
        "form": "Viên nén",
        "strength": "10mg",
        "unit": "Viên",
        "drug_class": "Antihistamine",
        "price": 3000,
    },
    {
        "name": "Omeprazole 20mg",
        "generic_name": "Omeprazole",
        "form": "Viên nén",
        "strength": "20mg",
        "unit": "Viên",
        "drug_class": "Proton pump inhibitor",
        "price": 8000,
    },
    {
        "name": "Metformin 500mg",
        "generic_name": "Metformin Hydrochloride",
        "form": "Viên nén",
        "strength": "500mg",
        "unit": "Viên",
        "drug_class": "Biguanide",
        "price": 4000,
    },
    {
        "name": "Amlodipine 5mg",
        "generic_name": "Amlodipine Besilate",
        "form": "Viên nén",
        "strength": "5mg",
        "unit": "Viên",
        "drug_class": "Calcium channel blocker",
        "price": 6000,
    },
    {
        "name": "Ibuprofen 400mg",
        "generic_name": "Ibuprofen",
        "form": "Viên nén",
        "strength": "400mg",
        "unit": "Viên",
        "drug_class": "NSAID",
        "price": 3500,
    },
    {
        "name": "Azithromycin 500mg",
        "generic_name": "Azithromycin Dihydrate",
        "form": "Viên nén",
        "strength": "500mg",
        "unit": "Viên",
        "drug_class": "Macrolide",
        "price": 25000,
    },
    {
        "name": "Vitamin C 1000mg",
        "generic_name": "Ascorbic Acid",
        "form": "Viên sủi",
        "strength": "1000mg",
        "unit": "Viên",
        "drug_class": "Vitamin",
        "price": 5000,
    },
    {
        "name": "Loratadine 10mg",
        "generic_name": "Loratadine",
        "form": "Viên nén",
        "strength": "10mg",
        "unit": "Viên",
        "drug_class": "Antihistamine",
        "price": 4000,
    },
]

SERVICES = [
    ("DV001", "Khám tổng quát", 100000),
    ("DV002", "Xét nghiệm máu cơ bản", 200000),
    ("DV003", "Chụp X-quang ngực", 150000),
    ("DV004", "Siêu âm ổ bụng", 300000),
    ("DV005", "Điện tim (ECG)", 120000),
    ("DV006", "Đo huyết áp", 20000),
    ("DV007", "Xét nghiệm nước tiểu", 80000),
    ("DV008", "Khám da liễu", 150000),
]

GUARDRAIL_RULES = [
    {
        "name": "Block Medical Diagnosis Vietnamese",
        "rule_type": "keyword",
        "pattern": "chẩn đoán bệnh",
        "description": "Chặn yêu cầu chẩn đoán bệnh bằng tiếng Việt",
        "applies_to": "input",
    },
    {
        "name": "Block Treatment Recommendation",
        "rule_type": "keyword",
        "pattern": "kê đơn thuốc",
        "description": "Chặn yêu cầu kê đơn thuốc",
        "applies_to": "input",
    },
    {
        "name": "Block Prompt Injection",
        "rule_type": "regex",
        "pattern": r"ignore\s+(all\s+)?previous\s+instructions?",
        "description": "Chặn prompt injection attempts",
        "applies_to": "both",
    },
    {
        "name": "Block DAN Jailbreak",
        "rule_type": "keyword",
        "pattern": "do anything now",
        "description": "Chặn DAN jailbreak pattern",
        "applies_to": "input",
    },
    {
        "name": "Block Prescribe",
        "rule_type": "keyword",
        "pattern": "prescribe",
        "description": "Chặn yêu cầu kê thuốc bằng tiếng Anh",
        "applies_to": "input",
    },
]


async def seed(db: AsyncSession):
    print("🌱 Bắt đầu seed dữ liệu demo...")

    # ===== 1. Departments =====
    print("  → Tạo departments...")
    dept_map = {}
    for dept_name in DEPARTMENTS:
        dept = Department(id=str(uuid.uuid4()), name=dept_name)
        db.add(dept)
        dept_map[dept_name] = dept
    await db.flush()

    # ===== 2. Specialties =====
    print("  → Tạo specialties...")
    spec_map = {}
    for spec_name in SPECIALTIES:
        spec = Specialty(id=str(uuid.uuid4()), name=spec_name)
        db.add(spec)
        spec_map[spec_name] = spec
    await db.flush()

    # ===== 3. Demo Users & Staff =====
    print("  → Tạo demo users...")
    user_map = {}
    for u_data in DEMO_USERS:
        user = User(
            id=str(uuid.uuid4()),
            email=u_data["email"],
            username=u_data["username"],
            hashed_password=hash_password(u_data["password"]),
            role=u_data["role"],
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        user_map[u_data["username"]] = user

        if u_data["role"] != UserRole.PATIENT:
            staff = Staff(
                id=str(uuid.uuid4()),
                user_id=user.id,
                employee_id=u_data.get("employee_id", f"NV{random.randint(100,999)}"),
                full_name=u_data["full_name"],
                phone=f"09{random.randint(10000000, 99999999)}",
            )
            db.add(staff)
    await db.flush()

    # ===== 4. Doctors =====
    print("  → Tạo doctors...")
    doctor_users = []
    doctor_objs = []

    for i, d_data in enumerate(DOCTORS_DATA):
        # Create user for each doctor
        if i == 0:
            # First doctor = demo account
            user = user_map["doctor"]
            staff_result = await db.execute(select(Staff).where(Staff.user_id == user.id))
            staff = staff_result.scalar_one_or_none()
            if not staff:
                staff = Staff(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    employee_id=f"BS{i+1:03d}",
                    full_name=d_data["full_name"],
                )
                db.add(staff)
                await db.flush()
        else:
            doc_user = User(
                id=str(uuid.uuid4()),
                email=f"doctor{i+1}@clinic.local",
                username=f"doctor{i+1}",
                hashed_password=hash_password("Doctor123!"),
                role=UserRole.DOCTOR,
                is_active=True,
                is_verified=True,
            )
            db.add(doc_user)
            staff = Staff(
                id=str(uuid.uuid4()),
                user_id=doc_user.id,
                employee_id=f"BS{i+1:03d}",
                full_name=d_data["full_name"],
                phone=f"09{random.randint(10000000, 99999999)}",
            )
            db.add(staff)
            await db.flush()
            user = doc_user

        doctor = Doctor(
            id=str(uuid.uuid4()),
            staff_id=staff.id,
            department_id=dept_map[d_data["department"]].id,
            specialty_id=spec_map[d_data["specialty"]].id,
            license_number=d_data["license"],
            qualification=d_data["qualification"],
            consultation_fee=d_data["fee"],
            is_active=True,
        )
        db.add(doctor)
        doctor_users.append(user)
        doctor_objs.append(doctor)

    await db.flush()

    # ===== 5. Working Schedules =====
    print("  → Tạo working schedules...")
    for doctor in doctor_objs:
        for day in range(0, 6):  # Mon-Sat
            schedule = WorkingSchedule(
                id=str(uuid.uuid4()),
                doctor_id=doctor.id,
                day_of_week=day,
                start_time=time(7, 30),
                end_time=time(17, 0),
                slot_duration_minutes=30,
            )
            db.add(schedule)
    await db.flush()

    # ===== 6. ICD-10 Diagnoses =====
    print("  → Tạo ICD-10 diagnoses...")
    diagnosis_objs = []
    for code, name, category in ICD10_DIAGNOSES:
        d = Diagnosis(id=str(uuid.uuid4()), icd10_code=code, name=name, category=category)
        db.add(d)
        diagnosis_objs.append(d)
    await db.flush()

    # ===== 7. Medicines =====
    print("  → Tạo medicines...")
    medicine_objs = []
    for m_data in MEDICINES:
        m = Medicine(id=str(uuid.uuid4()), **m_data)
        db.add(m)
        medicine_objs.append(m)
    await db.flush()

    # ===== 8. Services =====
    print("  → Tạo services...")
    for code, name, price in SERVICES:
        s = Service(id=str(uuid.uuid4()), code=code, name=name, price=price)
        db.add(s)
    await db.flush()

    # ===== 9. Patients =====
    print("  → Tạo 20 bệnh nhân...")
    patient_objs = []
    for i, (name, gender, phone) in enumerate(PATIENT_NAMES):
        if i == 0:
            # First patient = demo patient account
            p_user = user_map["patient"]
        else:
            p_user = None

        birth_year = random.randint(1960, 2005)
        patient = Patient(
            id=str(uuid.uuid4()),
            user_id=p_user.id if p_user else None,
            patient_code=f"BN{100001 + i}",
            full_name=name,
            date_of_birth=date(birth_year, random.randint(1, 12), random.randint(1, 28)),
            gender=gender,
            phone=phone,
            email=f"patient{i+1}@example.com" if i > 0 else "patient@clinic.local",
            address=f"{random.randint(1, 200)} Đường {random.choice(['Lê Lợi', 'Nguyễn Huệ', 'Hai Bà Trưng', 'Trần Hưng Đạo'])}, Q.{random.randint(1, 12)}, TP.HCM",
            blood_type=random.choice(["A", "B", "AB", "O"]) + random.choice(["+", "-"]),
            allergies=json.dumps(random.choice([[], ["Penicillin"], ["Aspirin"], ["Sulfa"]])),
            insurance_number=f"BH{random.randint(10000000, 99999999)}" if random.random() > 0.3 else None,
            insurance_provider="BHYT" if random.random() > 0.3 else None,
        )
        db.add(patient)
        patient_objs.append(patient)

    # Also add patient user info
    patient_staff = Staff(
        id=str(uuid.uuid4()),
        user_id=user_map["patient"].id,
        employee_id="BN001",
        full_name="Nguyễn Văn An",
    )
    # Actually patient should NOT be in staff — fix: link patient to user
    await db.flush()

    # ===== 10. Appointments =====
    print("  → Tạo appointments...")
    today = date.today()
    appointment_objs = []
    appointment_statuses = [
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.WAITING,
        AppointmentStatus.IN_CONSULTATION,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.PAID,
        AppointmentStatus.PAID,
        AppointmentStatus.CANCELLED,
        AppointmentStatus.SCHEDULED,
        AppointmentStatus.WAITING,
    ]

    slot_hour = 8
    slot_min = 0
    used_slots = {}  # (doctor_id, date, time) -> True

    for i in range(30):  # Tạo 30 appointments
        patient = random.choice(patient_objs)
        doctor = random.choice(doctor_objs)
        status = random.choice(appointment_statuses)

        # Pick a date
        if status in [AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING]:
            apt_date = today + timedelta(days=random.randint(0, 7))
        elif status == AppointmentStatus.CANCELLED:
            apt_date = today - timedelta(days=random.randint(1, 30))
        else:
            apt_date = today - timedelta(days=random.randint(0, 14))

        # Find available slot
        found_slot = False
        for hour in range(8, 17):
            for minute in [0, 30]:
                slot_key = (doctor.id, apt_date.isoformat(), f"{hour:02d}:{minute:02d}")
                if slot_key not in used_slots:
                    used_slots[slot_key] = True
                    start = time(hour, minute)
                    end = time(hour, minute + 30) if minute == 0 else time(hour + 1, 0)
                    found_slot = True
                    break
            if found_slot:
                break

        if not found_slot:
            continue

        apt = Appointment(
            id=str(uuid.uuid4()),
            appointment_code=f"LH{100001 + i}",
            patient_id=patient.id,
            doctor_id=doctor.id,
            specialty_id=doctor.specialty_id,
            appointment_date=apt_date,
            start_time=start,
            end_time=end,
            status=status,
            reason=random.choice(["Khám tổng quát", "Tái khám", "Khám chuyên khoa", "Tư vấn"]),
            created_by=user_map["reception"].id,
        )

        if status == AppointmentStatus.CANCELLED:
            apt.cancelled_at = datetime.now(timezone.utc)
            apt.cancellation_reason = "Bệnh nhân bận"

        db.add(apt)
        appointment_objs.append(apt)

    await db.flush()

    # ===== 11. Consultations (EMR) for completed appointments =====
    print("  → Tạo EMR records...")
    completed_apts = [a for a in appointment_objs if a.status in [AppointmentStatus.COMPLETED, AppointmentStatus.PAID]]
    consultation_objs = []

    for apt in completed_apts:
        consultation = Consultation(
            id=str(uuid.uuid4()),
            appointment_id=apt.id,
            patient_id=apt.patient_id,
            doctor_id=apt.doctor_id,
            blood_pressure=f"{random.randint(110, 140)}/{random.randint(70, 90)}",
            heart_rate=random.randint(60, 100),
            temperature=round(random.uniform(36.0, 37.5), 1),
            weight=round(random.uniform(45, 90), 1),
            height=round(random.uniform(155, 180), 1),
            chief_complaint=random.choice([
                "Đau đầu, sốt nhẹ",
                "Ho khan kéo dài",
                "Đau bụng vùng thượng vị",
                "Mệt mỏi, chóng mặt",
                "Đau lưng dưới",
            ]),
            clinical_notes=random.choice([
                "Bệnh nhân tỉnh táo, tiếp xúc tốt. Không có dấu hiệu bất thường.",
                "Khám lâm sàng: họng đỏ nhẹ, hạch cổ không to. Phổi thông khí bình thường.",
                "Bụng mềm, ấn đau nhẹ vùng thượng vị. Không có phản ứng thành bụng.",
            ]),
            status=EMRStatus.LOCKED,
            signed_by=user_map["doctor"].id,
            signed_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48)),
            locked_at=datetime.now(timezone.utc) - timedelta(hours=random.randint(1, 48)),
            signature_hash="a" * 64,  # Demo hash
        )
        db.add(consultation)
        consultation_objs.append(consultation)

    await db.flush()

    # ===== 12. Diagnoses for consultations =====
    print("  → Gắn diagnoses vào EMR...")
    for consultation in consultation_objs:
        diag = random.choice(diagnosis_objs)
        cd = ConsultationDiagnosis(
            id=str(uuid.uuid4()),
            consultation_id=consultation.id,
            diagnosis_id=diag.id,
            is_primary=True,
        )
        db.add(cd)

    await db.flush()

    # ===== 13. Prescriptions =====
    print("  → Tạo prescriptions...")
    for consultation in consultation_objs[:len(consultation_objs)//2]:
        presc = Prescription(
            id=str(uuid.uuid4()),
            prescription_code=f"DT{random.randint(100000, 999999)}",
            consultation_id=consultation.id,
            doctor_id=consultation.doctor_id,
            patient_id=consultation.patient_id,
            notes="Dùng thuốc đúng giờ. Tái khám sau 7 ngày nếu không đỡ.",
        )
        db.add(presc)
        await db.flush()

        # Add 1-3 medicine items
        selected_medicines = random.sample(medicine_objs, min(2, len(medicine_objs)))
        for med in selected_medicines:
            item = PrescriptionItem(
                id=str(uuid.uuid4()),
                prescription_id=presc.id,
                medicine_id=med.id,
                dosage="1 viên",
                frequency="2 lần/ngày",
                duration_days=random.choice([5, 7, 10, 14]),
                quantity=random.randint(10, 28),
                instructions="Uống sau bữa ăn",
                unit_price=med.price,
            )
            db.add(item)

    await db.flush()

    # ===== 14. Billing =====
    print("  → Tạo billing records...")
    billing_objs = []
    billing_statuses = [BillingStatus.PAID, BillingStatus.PAID, BillingStatus.UNPAID, BillingStatus.PARTIALLY_PAID]

    for apt in [a for a in appointment_objs if a.status in [AppointmentStatus.COMPLETED, AppointmentStatus.PAID]]:
        status = random.choice(billing_statuses)
        consultation_fee = 200000.0
        medicine_fee = random.choice([0, 150000, 250000, 350000])
        service_fee = random.choice([0, 100000, 200000, 300000])
        total = consultation_fee + medicine_fee + service_fee
        insurance_covered = total * 0.3 if random.random() > 0.5 else 0
        actual_total = total - insurance_covered

        paid = actual_total if status == BillingStatus.PAID else (actual_total * 0.5 if status == BillingStatus.PARTIALLY_PAID else 0)

        billing = Billing(
            id=str(uuid.uuid4()),
            invoice_code=f"HD{random.randint(100000, 999999)}",
            patient_id=apt.patient_id,
            appointment_id=apt.id,
            consultation_fee=consultation_fee,
            medicine_fee=medicine_fee,
            service_fee=service_fee,
            total_amount=actual_total,
            insurance_covered=insurance_covered,
            paid_amount=paid,
            remaining_amount=actual_total - paid,
            status=status,
        )
        db.add(billing)
        billing_objs.append(billing)

    await db.flush()

    # ===== 15. Payments =====
    print("  → Tạo payment records...")
    for billing in billing_objs:
        if billing.status in [BillingStatus.PAID, BillingStatus.PARTIALLY_PAID]:
            payment = Payment(
                id=str(uuid.uuid4()),
                billing_id=billing.id,
                amount=billing.paid_amount,
                payment_method=random.choice([PaymentMethod.CASH, PaymentMethod.CARD, PaymentMethod.INSURANCE]),
                created_by=user_map["accountant"].id,
            )
            db.add(payment)

    await db.flush()

    # ===== 16. Audit Logs (demo) =====
    print("  → Tạo demo audit logs...")
    for _ in range(50):
        action = random.choice(list(AuditAction))
        user = random.choice([user_map["doctor"], user_map["reception"], user_map["admin"]])
        log = AuditLog(
            id=str(uuid.uuid4()),
            user_id=user.id,
            username=user.username,
            user_role=user.role.value,
            action=action,
            resource_type=random.choice(["patients", "appointments", "emr", "billing"]),
            resource_id=str(uuid.uuid4()),
            ip_address=f"192.168.1.{random.randint(1, 254)}",
            result=random.choice(["success", "success", "success", "blocked"]),
            created_at=datetime.now(timezone.utc) - timedelta(minutes=random.randint(0, 1440)),
        )
        db.add(log)

    await db.flush()

    # ===== 17. Guardrail Rules =====
    print("  → Tạo AI guardrail rules...")
    admin_user = user_map["admin"]
    for rule_data in GUARDRAIL_RULES:
        rule = AIGuardrailRule(
            id=str(uuid.uuid4()),
            created_by=admin_user.id,
            **rule_data,
        )
        db.add(rule)

    await db.commit()
    print("\n✅ Seed hoàn tất!")
    print(f"   - {len(DEMO_USERS)} demo accounts")
    print(f"   - {len(DOCTORS_DATA)} doctors")
    print(f"   - 20 patients")
    print(f"   - {len(appointment_objs)} appointments")
    print(f"   - {len(consultation_objs)} EMR records")
    print(f"   - {len(billing_objs)} billing records")
    print(f"   - {len(ICD10_DIAGNOSES)} ICD-10 diagnoses")
    print(f"   - {len(MEDICINES)} medicines")
    print(f"   - {len(GUARDRAIL_RULES)} guardrail rules")
    print("\n🔑 Demo accounts:")
    for u in DEMO_USERS:
        print(f"   {u['role'].value:15} | {u['email']:35} | {u['password']}")


async def main():
    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        try:
            await seed(session)
        except Exception as e:
            await session.rollback()
            print(f"❌ Lỗi: {e}")
            raise
    
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
