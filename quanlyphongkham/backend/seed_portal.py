import sys
import os
import uuid
import random
from datetime import date, time, datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text
from app.core.security import hash_password

DATABASE_URL = "sqlite:///clinic.db"
engine = create_engine(DATABASE_URL, echo=False)

def run_seed():
    with engine.begin() as db:
        print("1. Seed Specialties")
        specialties = [
            ("Nội tổng quát", "Khám và điều trị các bệnh nội khoa thông thường"),
            ("Tim mạch", "Chuyên khoa tim mạch và hệ tuần hoàn"),
            ("Da liễu", "Điều trị các bệnh về da, tóc, móng"),
            ("Tai Mũi Họng", "Chuyên khoa Tai Mũi Họng"),
            ("Nhi khoa", "Chăm sóc sức khỏe trẻ em từ sơ sinh đến 16 tuổi"),
            ("Cơ xương khớp", "Cơ xương khớp và thấp khớp"),
        ]
        sp_ids = {}
        for name, desc in specialties:
            row = db.execute(text("SELECT id FROM specialties WHERE name=:n"), {"n": name}).fetchone()
            if row:
                sp_ids[name] = row[0]
            else:
                uid = str(uuid.uuid4())
                db.execute(text("INSERT INTO specialties (id, name, description, is_active, created_at) VALUES (:id, :n, :d, 1, CURRENT_TIMESTAMP)"), {"id": uid, "n": name, "d": desc})
                sp_ids[name] = uid
        
        print("2. Seed Department (using a default one)")
        dept_row = db.execute(text("SELECT id FROM departments WHERE name='Khoa Khám Bệnh'")).fetchone()
        if dept_row:
            dept_id = dept_row[0]
        else:
            dept_id = str(uuid.uuid4())
            db.execute(text("INSERT INTO departments (id, name, description, is_active, created_at) VALUES (:id, 'Khoa Khám Bệnh', 'Khoa Khám Bệnh Chung', 1, CURRENT_TIMESTAMP)"), {"id": dept_id})

        print("3. Seed Doctors")
        doctors_data = [
            ("Trần Văn Hùng", "DOC001", "tvhung", "Nội tổng quát", 12, 350000, "male", "Tiến sĩ Y khoa"),
            ("Nguyễn Thu Hà", "DOC002", "ntha", "Da liễu", 9, 400000, "female", "Thạc sĩ Y khoa"),
            ("Lê Minh Tuấn", "DOC003", "lmtuan", "Tim mạch", 15, 500000, "male", "PGS.TS.BS"),
            ("Phạm Ngọc Lan", "DOC004", "pnlan", "Tai Mũi Họng", 8, 300000, "female", "BS CK1"),
            ("Vũ Đức Đam", "DOC005", "vddam", "Nhi khoa", 20, 450000, "male", "Tiến sĩ Y khoa"),
            ("Đỗ Bích Thủy", "DOC006", "dbthuy", "Cơ xương khớp", 11, 400000, "female", "Thạc sĩ Y khoa"),
            ("Ngô Trọng Nghĩa", "DOC007", "ntnghia", "Nội tổng quát", 5, 250000, "male", "BS CK1"),
            ("Bùi Thanh Trúc", "DOC008", "bttruc", "Tim mạch", 7, 350000, "female", "BS CK1"),
        ]
        doc_ids = []
        for name, eid, username, sp_name, exp, fee, gender, qual in doctors_data:
            staff_row = db.execute(text("SELECT id, user_id FROM staff WHERE employee_id=:eid"), {"eid": eid}).fetchone()
            if staff_row:
                staff_id = staff_row[0]
                user_id = staff_row[1]
                doc_row = db.execute(text("SELECT id FROM doctors WHERE staff_id=:sid"), {"sid": staff_id}).fetchone()
                doc_id = doc_row[0]
                doc_ids.append(doc_id)
            else:
                user_id = str(uuid.uuid4())
                pw = hash_password("123456")
                db.execute(text("INSERT INTO users (id, email, username, hashed_password, role, is_active, is_verified, created_at, updated_at) VALUES (:id, :e, :u, :p, 'doctor', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"), {"id": user_id, "e": f"{username}@aiclinic.vn", "u": username, "p": pw})
                
                staff_id = str(uuid.uuid4())
                db.execute(text("INSERT INTO staff (id, user_id, employee_id, full_name, phone, gender, created_at, updated_at) VALUES (:id, :uid, :eid, :fn, :ph, :g, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"), {"id": staff_id, "uid": user_id, "eid": eid, "fn": name, "ph": "09" + str(random.randint(10000000, 99999999)), "g": gender})
                
                doc_id = str(uuid.uuid4())
                db.execute(text("INSERT INTO doctors (id, staff_id, department_id, specialty_id, license_number, qualification, bio, avatar_url, consultation_fee, is_active, created_at, updated_at) VALUES (:id, :sid, :did, :spid, :lic, :qual, :bio, :avt, :fee, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"), {"id": doc_id, "sid": staff_id, "did": dept_id, "spid": sp_ids[sp_name], "lic": f"LIC-{eid}", "qual": qual, "bio": f"Bác sĩ {name} với {exp} năm kinh nghiệm.", "avt": f"/assets/doctors/{eid.lower()}.svg", "fee": fee})
                doc_ids.append(doc_id)

        print("4. Seed Working Schedules")
        db.execute(text("DELETE FROM working_schedules"))
        for doc_id in doc_ids:
            # Create schedule for Mon-Fri (0-4) and maybe Sat (5). Wait, day_of_week is 0-6 where 0=Mon.
            for day in range(0, 6):
                if random.random() > 0.1: # 90% chance to work that day
                    sched_id = str(uuid.uuid4())
                    db.execute(text("INSERT INTO working_schedules (id, doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active) VALUES (:id, :did, :dow, :st, :et, 30, 1)"), {"id": sched_id, "did": doc_id, "dow": day, "st": "08:00:00", "et": "17:00:00"})

        print("5. Seed Patients")
        # Current Patient (Nguyễn Văn An)
        user_row = db.execute(text("SELECT id FROM users WHERE username='patient' OR username='dtc245200433@ictu.edu.vn'")).fetchone()
        if not user_row:
            patient_user_id = str(uuid.uuid4())
            pw = hash_password("password123")
            db.execute(text("INSERT INTO users (id, email, username, hashed_password, role, is_active, is_verified, created_at, updated_at) VALUES (:id, 'patient@aiclinic.com', 'patient', :pw, 'patient', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"), {"id": patient_user_id, "pw": pw})
        else:
            patient_user_id = user_row[0]

        patient_row = db.execute(text("SELECT id FROM patients WHERE user_id=:uid"), {"uid": patient_user_id}).fetchone()
        if not patient_row:
            main_patient_id = str(uuid.uuid4())
            db.execute(text("INSERT INTO patients (id, user_id, patient_code, full_name, date_of_birth, gender, phone, blood_type, is_active, created_at, updated_at) VALUES (:id, :uid, 'BN000001', 'Nguyễn Văn An', '1990-05-15', 'male', '0901234567', 'O+', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"), {"id": main_patient_id, "uid": patient_user_id})
        else:
            main_patient_id = patient_row[0]
            
        # Other 19 patients
        patient_names = ["Trần Thị Mai", "Lê Minh Hoàng", "Phạm Thu Trang", "Hoàng Anh Tú", "Đinh Bích Phương", "Võ Văn Kiệt", "Lý Thu Thảo", "Ngô Thanh Vân", "Trịnh Xuân Thanh", "Bùi Vĩ Hào", "Nguyễn Thành Chung", "Phạm Hùng Sơn", "Lê Quỳnh Hoa", "Đỗ Hữu Trọng", "Trần Khánh Dư", "Hoàng Thị Ngân", "Đặng Quang Huy", "Mai Xuân Thưởng", "Cao Kim Bảo"]
        patient_ids = [main_patient_id]
        
        for i, pname in enumerate(patient_names):
            pcode = f"BN{i+2:06d}"
            p_row = db.execute(text("SELECT id FROM patients WHERE patient_code=:c"), {"c": pcode}).fetchone()
            if not p_row:
                pid = str(uuid.uuid4())
                gender = "female" if i % 2 == 0 else "male"
                db.execute(text("INSERT INTO patients (id, patient_code, full_name, date_of_birth, gender, phone, blood_type, is_active, created_at, updated_at) VALUES (:id, :code, :name, '1985-10-20', :g, '0987654321', 'A+', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"), {"id": pid, "code": pcode, "name": pname, "g": gender})
                patient_ids.append(pid)
            else:
                patient_ids.append(p_row[0])

        print("6. Seed Demo Appointments")
        db.execute(text("DELETE FROM appointments"))
        
        now = datetime.now()
        apt_count = 0
        
        for _ in range(200): # Try more times to get 80 successful appointments
            if apt_count >= 80: break
            
            d = doc_ids[random.randint(0, len(doc_ids)-1)]
            p = patient_ids[random.randint(0, len(patient_ids)-1)]
            apt_id = str(uuid.uuid4())
            is_past = random.choice([True, False, False]) # 33% past, 66% future
            status = 'scheduled'
            if is_past:
                status = random.choice(['completed', 'completed', 'cancelled', 'no_show'])
                apt_date = now - timedelta(days=random.randint(2, 60))
            else:
                apt_date = now + timedelta(days=random.randint(1, 20))
                
            hour = random.choice([8, 9, 10, 14, 15, 16])
            try:
                db.execute(text("""
                    INSERT INTO appointments (id, appointment_code, patient_id, doctor_id, specialty_id, appointment_date, start_time, end_time, status, reason, created_at, updated_at)
                    SELECT :id, :code, :pid, :did, specialty_id, :adate, :st, :et, :stt, 'Khám bệnh', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    FROM doctors WHERE id=:did
                """), {
                    "id": apt_id, 
                    "code": f"APT-{int(now.timestamp())}+{apt_count}",
                    "pid": p,
                    "did": d,
                    "adate": apt_date.strftime('%Y-%m-%d'),
                    "st": f"{hour:02d}:00:00",
                    "et": f"{hour:02d}:30:00",
                    "stt": status
                })
                apt_count += 1
            except Exception:
                # ignore double booking
                pass
            
        print("7. Seed Notifications for Nguyễn Văn An")
        db.execute(text("DELETE FROM notifications WHERE user_id=:uid"), {"uid": patient_user_id})
        for i in range(25):
            notif_id = str(uuid.uuid4())
            db.execute(text("INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES (:id, :uid, 'appointment', 'Thông báo lịch khám', 'Thông báo về lịch hẹn của bạn...', 0, CURRENT_TIMESTAMP)"), {"id": notif_id, "uid": patient_user_id})

        print(f"Done! Created {len(patient_ids)} patients, {apt_count} appointments, 25 notifications.")

if __name__ == "__main__":
    run_seed()
