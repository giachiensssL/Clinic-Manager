"""
Seed Doctor Demo Data - Idempotent
Tao du lieu demo cho Doctor Portal: Tran Van Hung (DOC001)
20 benh nhan, 80 appointments, 50 EMR, 40 prescriptions, 50 lab results, 60 notifications
"""
import sys
import os
import uuid
import random
from datetime import date, time, datetime, timedelta, timezone

# Add parent dir to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

DATABASE_URL = "sqlite:///clinic.db"
engine = create_engine(DATABASE_URL, echo=False)

# --- bcrypt for password ---
try:
    import bcrypt
    def hash_password(pwd: str) -> str:
        return bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode()
except ImportError:
    from passlib.context import CryptContext
    _ctx = CryptContext(schemes=["bcrypt"])
    def hash_password(pwd: str) -> str:
        return _ctx.hash(pwd)


# ========== DATA CONSTANTS ==========

SPECIALTIES = [
    {"name": "Nội tổng quát", "description": "Khám và điều trị các bệnh nội khoa thông thường"},
    {"name": "Tim mạch", "description": "Chuyên khoa tim mạch và hệ tuần hoàn"},
    {"name": "Da liễu", "description": "Điều trị các bệnh về da, tóc, móng"},
    {"name": "Nhi khoa", "description": "Chăm sóc sức khỏe trẻ em từ sơ sinh đến 16 tuổi"},
    {"name": "Tiêu hóa", "description": "Chuyên khoa hệ tiêu hóa"},
    {"name": "Hô hấp", "description": "Các bệnh về phổi và đường hô hấp"},
    {"name": "Sản phụ khoa", "description": "Sức khỏe sinh sản và phụ nữ"},
    {"name": "Xương khớp", "description": "Cơ xương khớp và thấp khớp"},
]

PATIENTS_DATA = [
    {"full_name": "Nguyễn Thị Mai", "gender": "female", "dob": "1992-05-14", "phone": "0901234501", "blood_type": "O+", "allergies": "Không ghi nhận", "avatar": "/assets/patients/patient-001.svg"},
    {"full_name": "Lê Văn Nam", "gender": "male", "dob": "1979-08-22", "phone": "0901234502", "blood_type": "A+", "allergies": "Penicillin", "avatar": "/assets/patients/patient-002.svg"},
    {"full_name": "Phạm Thị Hương", "gender": "female", "dob": "1996-11-03", "phone": "0901234503", "blood_type": "B+", "allergies": "Không ghi nhận", "avatar": "/assets/patients/patient-003.svg"},
    {"full_name": "Trần Quang Huy", "gender": "male", "dob": "1974-03-18", "phone": "0901234504", "blood_type": "AB+", "allergies": "Aspirin", "avatar": "/assets/patients/patient-004.svg"},
    {"full_name": "Vũ Thị Lan", "gender": "female", "dob": "1986-07-09", "phone": "0901234505", "blood_type": "O+", "allergies": "Không ghi nhận", "avatar": "/assets/patients/patient-005.svg"},
    {"full_name": "Đỗ Minh Tuấn", "gender": "male", "dob": "2000-01-25", "phone": "0901234506", "blood_type": "A+", "allergies": "Sulfa", "avatar": "/assets/patients/patient-006.svg"},
    {"full_name": "Ngô Thị Bích", "gender": "female", "dob": "1983-09-12", "phone": "0901234507", "blood_type": "B-", "allergies": "Không ghi nhận", "avatar": "/assets/patients/patient-007.svg"},
    {"full_name": "Phan Văn Dũng", "gender": "male", "dob": "1969-12-30", "phone": "0901234508", "blood_type": "O-", "allergies": "Codeine", "avatar": "/assets/patients/patient-008.svg"},
    {"full_name": "Hoàng Thị Thu", "gender": "female", "dob": "1990-04-07", "phone": "0901234509", "blood_type": "A+", "allergies": "Không ghi nhận", "avatar": "/assets/patients/patient-009.svg"},
    {"full_name": "Bùi Thanh Tùng", "gender": "male", "dob": "1988-06-15", "phone": "0901234510", "blood_type": "B+", "allergies": "Latex", "avatar": "/assets/patients/patient-010.svg"},
    {"full_name": "Đinh Thị Nga", "gender": "female", "dob": "1975-02-28", "phone": "0901234511", "blood_type": "O+", "allergies": "Không ghi nhận", "avatar": "/assets/patients/patient-011.svg"},
    {"full_name": "Lý Minh Khoa", "gender": "male", "dob": "1995-10-11", "phone": "0901234512", "blood_type": "AB+", "allergies": "Ibuprofen", "avatar": "/assets/patients/patient-012.svg"},
    {"full_name": "Trịnh Thị Hoa", "gender": "female", "dob": "1982-08-19", "phone": "0901234513", "blood_type": "A-", "allergies": "Không ghi nhận", "avatar": "/assets/patients/patient-013.svg"},
    {"full_name": "Võ Đình Long", "gender": "male", "dob": "1971-05-04", "phone": "0901234514", "blood_type": "O+", "allergies": "Không ghi nhận", "avatar": "/assets/patients/patient-014.svg"},
    {"full_name": "Cao Thị Linh", "gender": "female", "dob": "1998-03-23", "phone": "0901234515", "blood_type": "B+", "allergies": "Phấn hoa", "avatar": "/assets/patients/patient-015.svg"},
    {"full_name": "Đặng Văn Phú", "gender": "male", "dob": "1965-11-08", "phone": "0901234516", "blood_type": "A+", "allergies": "Không ghi nhận", "avatar": "/assets/patients/patient-016.svg"},
    {"full_name": "Nguyễn Thị Tuyết", "gender": "female", "dob": "1993-07-31", "phone": "0901234517", "blood_type": "O+", "allergies": "Codeine", "avatar": "/assets/patients/patient-017.svg"},
    {"full_name": "Phạm Hoàng Anh", "gender": "male", "dob": "1987-01-16", "phone": "0901234518", "blood_type": "B+", "allergies": "Không ghi nhận", "avatar": "/assets/patients/patient-018.svg"},
    {"full_name": "Lê Thị Phương", "gender": "female", "dob": "1978-09-05", "phone": "0901234519", "blood_type": "AB+", "allergies": "Sulfa", "avatar": "/assets/patients/patient-019.svg"},
    {"full_name": "Hà Văn Minh", "gender": "male", "dob": "1970-04-20", "phone": "0901234520", "blood_type": "O+", "allergies": "Không ghi nhận", "avatar": "/assets/patients/patient-020.svg"},
]

REASONS = [
    "Khám Nội tổng quát", "Tái khám viêm họng", "Khám tiêu hóa", "Khám da liễu",
    "Tái khám huyết áp", "Khám hô hấp", "Khám sản phụ khoa", "Khám xương khớp",
    "Đau tức ngực", "Ho kéo dài", "Sốt cao", "Đau bụng", "Mệt mỏi kéo dài",
    "Tái khám tim mạch", "Kiểm tra sức khỏe định kỳ", "Khám tai mũi họng",
    "Đau lưng", "Đau đầu", "Chóng mặt", "Khó thở",
]

MEDICINES_DATA = [
    {"name": "Paracetamol 500mg", "generic_name": "Paracetamol", "form": "Tablet", "strength": "500mg", "unit": "viên", "price": 500},
    {"name": "Amoxicillin 500mg", "generic_name": "Amoxicillin", "form": "Capsule", "strength": "500mg", "unit": "viên", "price": 3000},
    {"name": "Omeprazole 20mg", "generic_name": "Omeprazole", "form": "Capsule", "strength": "20mg", "unit": "viên", "price": 2500},
    {"name": "Cetirizine 10mg", "generic_name": "Cetirizine", "form": "Tablet", "strength": "10mg", "unit": "viên", "price": 1500},
    {"name": "Metformin 500mg", "generic_name": "Metformin", "form": "Tablet", "strength": "500mg", "unit": "viên", "price": 2000},
    {"name": "Amlodipine 5mg", "generic_name": "Amlodipine", "form": "Tablet", "strength": "5mg", "unit": "viên", "price": 4000},
    {"name": "Ibuprofen 400mg", "generic_name": "Ibuprofen", "form": "Tablet", "strength": "400mg", "unit": "viên", "price": 1200},
    {"name": "Vitamin C 500mg", "generic_name": "Ascorbic Acid", "form": "Tablet", "strength": "500mg", "unit": "viên", "price": 800},
    {"name": "Atorvastatin 10mg", "generic_name": "Atorvastatin", "form": "Tablet", "strength": "10mg", "unit": "viên", "price": 5000},
    {"name": "Losartan 50mg", "generic_name": "Losartan", "form": "Tablet", "strength": "50mg", "unit": "viên", "price": 3500},
]

LAB_TESTS = [
    {"name": "Công thức máu toàn phần", "prefix": "LAB-CBC"},
    {"name": "Sinh hóa máu cơ bản", "prefix": "LAB-BIO"},
    {"name": "Tổng phân tích nước tiểu", "prefix": "LAB-URI"},
    {"name": "X-quang ngực thẳng", "prefix": "LAB-XRY"},
    {"name": "Siêu âm bụng tổng quát", "prefix": "LAB-USG"},
    {"name": "Điện tâm đồ 12 chuyển đạo", "prefix": "LAB-ECG"},
    {"name": "Xét nghiệm đường huyết", "prefix": "LAB-GLU"},
    {"name": "Mỡ máu toàn phần", "prefix": "LAB-LIP"},
]

CBC_RESULT = [
    {"name": "Hồng cầu", "value": 4.5, "unit": "T/L", "ref": "4.0-5.8", "is_abnormal": False},
    {"name": "Bạch cầu", "value": 7.2, "unit": "G/L", "ref": "4.0-10.0", "is_abnormal": False},
    {"name": "Tiểu cầu", "value": 220, "unit": "G/L", "ref": "150-400", "is_abnormal": False},
    {"name": "Hemoglobin", "value": 135, "unit": "g/L", "ref": "120-160", "is_abnormal": False},
]

BIO_RESULT = [
    {"name": "Glucose", "value": 5.8, "unit": "mmol/L", "ref": "3.9-6.4", "is_abnormal": False},
    {"name": "Creatinine", "value": 85, "unit": "µmol/L", "ref": "53-106", "is_abnormal": False},
    {"name": "ALT", "value": 32, "unit": "U/L", "ref": "7-56", "is_abnormal": False},
    {"name": "AST", "value": 28, "unit": "U/L", "ref": "10-40", "is_abnormal": False},
]


def main():
    print("=" * 60)
    print("SEED DOCTOR DEMO DATA")
    print("=" * 60)

    with Session(engine) as db:
        # ── SPECIALTIES ─────────────────────────────────────────────
        print("\n[1/9] Tao Specialties...")
        specialty_ids = {}
        for sp in SPECIALTIES:
            existing = db.execute(text("SELECT id FROM specialties WHERE name=:n"), {"n": sp["name"]}).fetchone()
            if existing:
                specialty_ids[sp["name"]] = existing[0]
                print(f"  >> Already exists: {sp['name']}")
            else:
                sid = str(uuid.uuid4())
                db.execute(text("""
                    INSERT INTO specialties (id, name, description, is_active, created_at)
                    VALUES (:id, :name, :desc, 1, CURRENT_TIMESTAMP)
                """), {"id": sid, "name": sp["name"], "desc": sp["description"]})
                specialty_ids[sp["name"]] = sid
                print(f"  ++ Created: {sp['name']}")
        db.commit()

        # ── DEPARTMENT ───────────────────────────────────────────────
        print("\n[2/9] Tao Department...")
        dept_row = db.execute(text("SELECT id FROM departments WHERE name='Khoa Nội'")).fetchone()
        if dept_row:
            dept_id = dept_row[0]
            print(f"  >> Already exists: Khoa Nội")
        else:
            dept_id = str(uuid.uuid4())
            db.execute(text("""
                INSERT INTO departments (id, name, description, is_active, created_at)
                VALUES (:id, 'Khoa Nội', 'Khoa Nội tổng quát', 1, CURRENT_TIMESTAMP)
            """), {"id": dept_id})
            print("  ++ Created: Khoa Nội")
        db.commit()

        # ── DOCTOR USER: TRAN VAN HUNG ───────────────────────────────
        print("\n[3/9] Tao Doctor user: Tran Van Hung (DOC001)...")
        existing_staff = db.execute(text("SELECT id FROM staff WHERE employee_id='DOC001'")).fetchone()
        if existing_staff:
            print("  >> DOC001 already exists, skipping doctor creation...")
            staff_id = existing_staff[0]
            doctor_row = db.execute(text("SELECT id FROM doctors WHERE staff_id=:sid"), {"sid": staff_id}).fetchone()
            doctor_id = doctor_row[0] if doctor_row else None
            user_row = db.execute(text("SELECT id FROM users WHERE username='tran.van.hung'")).fetchone()
            doctor_user_id = user_row[0] if user_row else None
        else:
            # Create user
            doctor_user_id = str(uuid.uuid4())
            hashed = hash_password("Doctor@123456")
            db.execute(text("""
                INSERT INTO users (id, email, username, hashed_password, role, is_active, is_verified, created_at, updated_at)
                VALUES (:id, :email, :username, :pw, 'doctor', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """), {
                "id": doctor_user_id,
                "email": "tvhung@aiclinic.vn",
                "username": "tran.van.hung",
                "pw": hashed,
            })
            # Create staff
            staff_id = str(uuid.uuid4())
            db.execute(text("""
                INSERT INTO staff (id, user_id, employee_id, full_name, phone, gender, created_at, updated_at)
                VALUES (:id, :uid, :eid, :fname, :phone, 'male', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """), {"id": staff_id, "uid": doctor_user_id, "eid": "DOC001", "fname": "Trần Văn Hùng", "phone": "0901999888"})
            # Create doctor
            doctor_id = str(uuid.uuid4())
            noi_tong_quat_id = specialty_ids.get("Nội tổng quát")
            db.execute(text("""
                INSERT INTO doctors (id, staff_id, department_id, specialty_id, license_number, qualification, bio, avatar_url, consultation_fee, is_active, created_at, updated_at)
                VALUES (:id, :sid, :did, :spid, :lic, :qual, :bio, :avatar, 200000, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """), {
                "id": doctor_id, "sid": staff_id, "did": dept_id, "spid": noi_tong_quat_id,
                "lic": "BS-001-HN-2024",
                "qual": "Tiến sĩ Y khoa",
                "bio": "Bác sĩ chuyên khoa II với hơn 15 năm kinh nghiệm trong lĩnh vực Nội tổng quát",
                "avatar": "/assets/doctors/doctor-001.svg"
            })
            db.commit()
            print(f"  ++ Created doctor: Trần Văn Hùng (DOC001), user_id={doctor_user_id}")

        # ── MEDICINES ────────────────────────────────────────────────
        print("\n[4/9] Tao Medicines...")
        medicine_ids = []
        for med in MEDICINES_DATA:
            existing = db.execute(text("SELECT id FROM medicines WHERE name=:n"), {"n": med["name"]}).fetchone()
            if existing:
                medicine_ids.append(existing[0])
            else:
                mid = str(uuid.uuid4())
                db.execute(text("""
                    INSERT INTO medicines (id, name, generic_name, form, strength, unit, price, is_active, created_at)
                    VALUES (:id, :name, :gname, :form, :strength, :unit, :price, 1, CURRENT_TIMESTAMP)
                """), {
                    "id": mid, "name": med["name"], "gname": med["generic_name"],
                    "form": med["form"], "strength": med["strength"],
                    "unit": med["unit"], "price": med["price"]
                })
                medicine_ids.append(mid)
                print(f"  ++ Medicine: {med['name']}")
        db.commit()

        # ── PATIENTS ─────────────────────────────────────────────────
        print("\n[5/9] Tao 20 Patients...")
        patient_ids = []
        for i, p in enumerate(PATIENTS_DATA, 1):
            code = f"BN2024{i:03d}"
            existing = db.execute(text("SELECT id FROM patients WHERE patient_code=:c"), {"c": code}).fetchone()
            if existing:
                patient_ids.append(existing[0])
                print(f"  >> Already exists: {code} - {p['full_name']}")
                continue
            pid = str(uuid.uuid4())
            db.execute(text("""
                INSERT INTO patients (id, patient_code, full_name, date_of_birth, gender, phone, blood_type, allergies, avatar_url, is_active, created_at, updated_at)
                VALUES (:id, :code, :name, :dob, :gender, :phone, :bt, :allg, :avatar, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            """), {
                "id": pid, "code": code, "name": p["full_name"],
                "dob": p["dob"], "gender": p["gender"],
                "phone": p["phone"], "bt": p["blood_type"],
                "allg": p["allergies"], "avatar": p["avatar"]
            })
            patient_ids.append(pid)
            print(f"  ++ Patient: {code} - {p['full_name']}")
        db.commit()
        print(f"  Total patients: {len(patient_ids)}")

        # ── APPOINTMENTS ─────────────────────────────────────────────
        print("\n[6/9] Tao Appointments...")
        # Check existing
        existing_appts = db.execute(text("SELECT COUNT(*) FROM appointments WHERE doctor_id=:did"), {"did": doctor_id}).fetchone()[0]
        if existing_appts >= 50:
            print(f"  >> Already have {existing_appts} appointments, skipping...")
            # Get appointment IDs for later use
            appt_rows = db.execute(text("SELECT id, patient_id, status FROM appointments WHERE doctor_id=:did"), {"did": doctor_id}).fetchall()
            appointment_data = [{"id": r[0], "patient_id": r[1], "status": r[2]} for r in appt_rows]
        else:
            appointment_data = []
            time_slots = [
                (time(8, 30), time(9, 0)),
                (time(9, 15), time(9, 45)),
                (time(10, 0), time(10, 30)),
                (time(11, 0), time(11, 30)),
                (time(14, 0), time(14, 30)),
                (time(14, 45), time(15, 15)),
                (time(15, 30), time(16, 0)),
                (time(16, 15), time(16, 45)),
            ]

            today = date(2026, 9, 18)
            
            # Generate past dates: from 2024-01-01 to today
            past_dates = []
            d = date(2024, 1, 7)  # Start from a Monday
            while d < today:
                if d.weekday() < 6:  # Mon-Sat
                    past_dates.append(d)
                d += timedelta(days=random.randint(1, 4))

            past_dates = past_dates[:65]  # Limit to ~65 past days

            # Today's appointments (8 total, specific statuses)
            today_statuses = ["waiting", "in_consultation", "completed", "completed", "completed", "scheduled", "scheduled", "waiting"]

            all_dates_and_statuses = []

            # Today
            for i, st in enumerate(today_statuses):
                all_dates_and_statuses.append((today, time_slots[i][0], time_slots[i][1], st))

            # Past appointments
            for d in past_dates:
                n_slots = random.randint(3, 6)
                slots = random.sample(time_slots, n_slots)
                for slot in slots:
                    st = random.choice(["completed", "completed", "completed", "cancelled", "no_show"])
                    all_dates_and_statuses.append((d, slot[0], slot[1], st))

            # Future (next 2 weeks)
            for i in range(1, 10):
                fd = today + timedelta(days=i)
                if fd.weekday() < 6:
                    n = random.randint(2, 5)
                    slots = random.sample(time_slots, n)
                    for slot in slots:
                        all_dates_and_statuses.append((fd, slot[0], slot[1], "scheduled"))

            appt_count = 0
            for (appt_date, start_t, end_t, status) in all_dates_and_statuses:
                # Check no duplicate
                dup = db.execute(text("""
                    SELECT id FROM appointments 
                    WHERE doctor_id=:did AND appointment_date=:dt AND start_time=:st
                """), {"did": doctor_id, "dt": appt_date.isoformat(), "st": start_t.isoformat()}).fetchone()
                if dup:
                    continue

                appt_id = str(uuid.uuid4())
                patient_id = random.choice(patient_ids)
                spec_id = specialty_ids.get("Nội tổng quát")
                code = f"LH{random.randint(100000, 999999)}"
                # Ensure code is unique
                while db.execute(text("SELECT id FROM appointments WHERE appointment_code=:c"), {"c": code}).fetchone():
                    code = f"LH{random.randint(100000, 999999)}"

                reason = random.choice(REASONS)

                db.execute(text("""
                    INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, specialty_id, appointment_date, start_time, end_time, status, reason, created_at, updated_at)
                    VALUES (:id, :code, :pid, :did, :spid, :dt, :st, :et, :status, :reason, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {
                    "id": appt_id, "code": code, "pid": patient_id, "did": doctor_id,
                    "spid": spec_id, "dt": appt_date.isoformat(),
                    "st": start_t.isoformat(), "et": end_t.isoformat(),
                    "status": status, "reason": reason
                })
                appointment_data.append({"id": appt_id, "patient_id": patient_id, "status": status, "appt_date": appt_date})
                appt_count += 1

            db.commit()
            print(f"  ++ Created {appt_count} appointments")

        # ── CONSULTATIONS (EMR) ─────────────────────────────────────
        print("\n[7/9] Tao Consultations (EMR)...")
        existing_consults = db.execute(text("SELECT COUNT(*) FROM consultations WHERE doctor_id=:did"), {"did": doctor_id}).fetchone()[0]
        if existing_consults >= 40:
            print(f"  >> Already have {existing_consults} consultations, skipping...")
            # Get consultation IDs for later
            consult_rows = db.execute(text("SELECT id, patient_id FROM consultations WHERE doctor_id=:did LIMIT 40"), {"did": doctor_id}).fetchall()
            consultation_ids = [(r[0], r[1]) for r in consult_rows]
        else:
            consultation_ids = []
            completed_appts = [a for a in appointment_data if a["status"] in ("completed",)]
            consult_count = 0

            for appt in completed_appts[:50]:
                # Check if consultation already exists
                existing = db.execute(text("SELECT id FROM consultations WHERE appointment_id=:aid"), {"aid": appt["id"]}).fetchone()
                if existing:
                    consultation_ids.append((existing[0], appt["patient_id"]))
                    continue

                cid = str(uuid.uuid4())
                status = random.choice(["completed", "completed", "completed", "draft"])
                db.execute(text("""
                    INSERT INTO consultations (
                        id, appointment_id, patient_id, doctor_id,
                        blood_pressure, heart_rate, temperature, weight, height, oxygen_saturation,
                        chief_complaint, clinical_notes, physical_examination, treatment_plan,
                        status, created_at, updated_at
                    )
                    VALUES (
                        :id, :aid, :pid, :did,
                        :bp, :hr, :temp, :wt, :ht, :spo2,
                        :cc, :cn, :pe, :tp,
                        :status, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    )
                """), {
                    "id": cid, "aid": appt["id"], "pid": appt["patient_id"], "did": doctor_id,
                    "bp": f"{random.randint(110, 140)}/{random.randint(70, 90)}",
                    "hr": random.randint(60, 100),
                    "temp": round(random.uniform(36.5, 37.5), 1),
                    "wt": round(random.uniform(50, 85), 1),
                    "ht": round(random.uniform(155, 180), 1),
                    "spo2": round(random.uniform(96, 99), 1),
                    "cc": random.choice(REASONS),
                    "cn": "Bệnh nhân đến khám trong tình trạng tỉnh táo, tiếp xúc tốt. Các chỉ số sinh hiệu trong giới hạn bình thường.",
                    "pe": "Tim đều, phổi thông, bụng mềm, không có điểm đau khu trú.",
                    "tp": "Điều trị ngoại trú. Dùng thuốc theo đơn. Tái khám sau 2 tuần.",
                    "status": status,
                })
                consultation_ids.append((cid, appt["patient_id"]))
                consult_count += 1

            db.commit()
            print(f"  ++ Created {consult_count} consultations")

        # ── PRESCRIPTIONS ────────────────────────────────────────────
        print("\n[8/9] Tao Prescriptions...")
        existing_rx = db.execute(text("SELECT COUNT(*) FROM prescriptions WHERE doctor_id=:did"), {"did": doctor_id}).fetchone()[0]
        if existing_rx >= 30:
            print(f"  >> Already have {existing_rx} prescriptions, skipping...")
        else:
            rx_count = 0
            for cid, patient_id in consultation_ids[:40]:
                # Check if prescription exists for this consultation
                existing = db.execute(text("SELECT id FROM prescriptions WHERE consultation_id=:cid"), {"cid": cid}).fetchone()
                if existing:
                    continue

                rx_id = str(uuid.uuid4())
                rx_code = f"RX{random.randint(100000, 999999)}"
                while db.execute(text("SELECT id FROM prescriptions WHERE prescription_code=:c"), {"c": rx_code}).fetchone():
                    rx_code = f"RX{random.randint(100000, 999999)}"

                db.execute(text("""
                    INSERT INTO prescriptions (id, prescription_code, consultation_id, doctor_id, patient_id, notes, created_at, updated_at)
                    VALUES (:id, :code, :cid, :did, :pid, :notes, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {
                    "id": rx_id, "code": rx_code, "cid": cid, "did": doctor_id,
                    "pid": patient_id, "notes": "Uống thuốc đúng giờ, đủ liều."
                })

                # Add 2-4 items
                selected_meds = random.sample(medicine_ids, min(random.randint(2, 4), len(medicine_ids)))
                for med_id in selected_meds:
                    item_id = str(uuid.uuid4())
                    db.execute(text("""
                        INSERT INTO prescription_items (id, prescription_id, medicine_id, dosage, frequency, duration_days, quantity, instructions, unit_price)
                        VALUES (:id, :rxid, :mid, :dose, :freq, :dur, :qty, :instr, :price)
                    """), {
                        "id": item_id, "rxid": rx_id, "mid": med_id,
                        "dose": random.choice(["1 viên/lần", "2 viên/lần", "1/2 viên/lần"]),
                        "freq": random.choice(["2 lần/ngày", "3 lần/ngày", "1 lần/ngày"]),
                        "dur": random.choice([5, 7, 10, 14]),
                        "qty": random.randint(10, 28),
                        "instr": random.choice(["Sau ăn", "Trước ăn 30 phút", "Trước khi ngủ", "Khi cần"]),
                        "price": random.choice([1000, 2000, 3000, 5000])
                    })
                rx_count += 1

            db.commit()
            print(f"  ++ Created {rx_count} prescriptions")

        # ── LAB RESULTS ─────────────────────────────────────────────
        print("\n[9/10] Tao Lab Results...")
        existing_labs = db.execute(text("SELECT COUNT(*) FROM lab_results WHERE doctor_id=:did"), {"did": doctor_id}).fetchone()[0]
        if existing_labs >= 40:
            print(f"  >> Already have {existing_labs} lab results, skipping...")
        else:
            import json
            lab_count = 0
            statuses = ["pending"] * 10 + ["completed"] * 30 + ["cancelled"] * 10
            random.shuffle(statuses)

            for i, (cid, patient_id) in enumerate(consultation_ids[:50]):
                status = statuses[i] if i < len(statuses) else "completed"
                test = random.choice(LAB_TESTS)
                test_code = f"{test['prefix']}-{random.randint(10000, 99999)}"

                # Ensure unique test_code
                while db.execute(text("SELECT id FROM lab_results WHERE test_code=:c"), {"c": test_code}).fetchone():
                    test_code = f"{test['prefix']}-{random.randint(10000, 99999)}"

                result_data = CBC_RESULT if "CBC" in test["prefix"] else BIO_RESULT if "BIO" in test["prefix"] else None

                lab_id = str(uuid.uuid4())
                db.execute(text("""
                    INSERT INTO lab_results (id, patient_id, doctor_id, consultation_id, test_code, test_name, test_date, status, result_data, notes, created_at, updated_at)
                    VALUES (:id, :pid, :did, :cid, :code, :name, :dt, :status, :rdata, :notes, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                """), {
                    "id": lab_id, "pid": patient_id, "did": doctor_id, "cid": cid,
                    "code": test_code, "name": test["name"],
                    "dt": datetime.now(timezone.utc).isoformat(),
                    "status": status,
                    "rdata": json.dumps(result_data, ensure_ascii=False) if result_data and status == "completed" else None,
                    "notes": "Xét nghiệm thực hiện tại phòng xét nghiệm AI Clinic." if status == "completed" else None,
                })
                lab_count += 1

            db.commit()
            print(f"  ++ Created {lab_count} lab results")

        # ── NOTIFICATIONS ────────────────────────────────────────────
        print("\n[10/10] Tao Notifications...")
        if doctor_user_id:
            existing_notifs = db.execute(text("SELECT COUNT(*) FROM notifications WHERE user_id=:uid"), {"uid": doctor_user_id}).fetchone()[0]
            if existing_notifs >= 40:
                print(f"  >> Already have {existing_notifs} notifications, skipping...")
            else:
                notif_count = 0
                notif_templates = [
                    ("appointment", "Bệnh nhân mới đặt lịch", "Có lịch khám mới được đặt cho hôm nay"),
                    ("appointment", "Bệnh nhân đã check-in", "Bệnh nhân đang chờ khám tại phòng chờ"),
                    ("lab_result", "Kết quả xét nghiệm mới", "Kết quả xét nghiệm đã có, vui lòng xem xét"),
                    ("lab_result", "Kết quả XN cần theo dõi", "Có chỉ số bất thường trong kết quả xét nghiệm"),
                    ("prescription", "Đơn thuốc cần ký", "Vui lòng kiểm tra và ký đơn thuốc"),
                    ("system", "Nhắc nhở lịch khám", "Bạn có 3 lịch khám trong 1 giờ tới"),
                    ("appointment", "Lịch khám thay đổi", "Bệnh nhân đã hủy lịch khám lúc 14:00"),
                    ("system", "Bệnh án chưa hoàn tất", "Có 2 bệnh án đang ở trạng thái nháp cần hoàn thiện"),
                ]
                for i in range(60):
                    tmpl = random.choice(notif_templates)
                    nid = str(uuid.uuid4())
                    is_read = random.choice([True, True, True, False, False])  # 40% unread
                    db.execute(text("""
                        INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
                        VALUES (:id, :uid, :type, :title, :msg, :read, datetime('now', :offset))
                    """), {
                        "id": nid, "uid": doctor_user_id,
                        "type": tmpl[0], "title": tmpl[1], "msg": tmpl[2],
                        "read": 1 if is_read else 0,
                        "offset": f"-{random.randint(0, 720)} minutes"
                    })
                    notif_count += 1

                db.commit()
                print(f"  ++ Created {notif_count} notifications")
        else:
            print("  >> Skipping notifications (no doctor_user_id)")

    print("\n" + "=" * 60)
    print("SEED HOÀN THÀNH!")
    print("=" * 60)
    print("\nThông tin đăng nhập bác sĩ demo:")
    print("  Username: tran.van.hung")
    print("  Password: Doctor@123456")
    print("  Role:     doctor")
    print("=" * 60)


if __name__ == "__main__":
    main()
