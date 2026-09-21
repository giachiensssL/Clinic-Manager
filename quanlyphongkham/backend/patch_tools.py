import os
import re

file_path = "app/services/ai_tool_registry.py"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add tool registrations
register_block = """
        # --- DOCTOR TOOLS ---
        self.tools["get_doctor_schedule"] = (
            {
                "name": "get_doctor_schedule",
                "description": "Lấy lịch khám của Bác sĩ trong ngày hôm nay hoặc ngày được chỉ định, bao gồm danh sách bệnh nhân và trạng thái chờ.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "date": {"type": "STRING", "description": "Ngày cần xem lịch (YYYY-MM-DD). Để trống để xem hôm nay."}
                    }
                }
            },
            self._handle_get_doctor_schedule,
            False
        )

        self.tools["get_patient_summary"] = (
            {
                "name": "get_patient_summary",
                "description": "Lấy tóm tắt hồ sơ y tế, lịch sử khám, xét nghiệm và đơn thuốc của một bệnh nhân cụ thể dựa vào tên hoặc mã ID.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "patient_name_or_id": {"type": "STRING", "description": "Tên, mã ID hoặc số điện thoại của bệnh nhân cần tra cứu."}
                    },
                    "required": ["patient_name_or_id"]
                }
            },
            self._handle_get_patient_summary,
            False
        )

        # --- RECEPTIONIST TOOLS ---
        self.tools["search_patient"] = (
            {
                "name": "search_patient",
                "description": "Tìm kiếm bệnh nhân dựa vào tên, số điện thoại, hoặc email.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "query": {"type": "STRING", "description": "Tên, số điện thoại hoặc email."}
                    },
                    "required": ["query"]
                }
            },
            self._handle_search_patient,
            False
        )

        self.tools["check_doctor_availability"] = (
            {
                "name": "check_doctor_availability",
                "description": "Kiểm tra lịch làm việc, hàng đợi và các lịch hẹn hiện tại của một Bác sĩ để xem Bác sĩ có rảnh không.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "doctor_name": {"type": "STRING", "description": "Tên hoặc ID của Bác sĩ."}
                    },
                    "required": ["doctor_name"]
                }
            },
            self._handle_check_doctor_availability,
            False
        )

        self.tools["book_appointment_for_patient"] = (
            {
                "name": "book_appointment_for_patient",
                "description": "Lễ tân tạo lịch hẹn mới cho một bệnh nhân.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "patient_id": {"type": "STRING", "description": "Mã ID (UUID) của bệnh nhân."},
                        "doctor_id": {"type": "STRING", "description": "Mã ID (UUID) của bác sĩ. (Nếu không biết, hãy gọi check_doctor_availability trước)"},
                        "appointment_date": {"type": "STRING", "description": "Ngày hẹn (YYYY-MM-DD)"},
                        "start_time": {"type": "STRING", "description": "Giờ hẹn (HH:MM)"},
                        "reason": {"type": "STRING", "description": "Lý do khám"}
                    },
                    "required": ["patient_id", "doctor_id", "appointment_date", "start_time"]
                }
            },
            self._handle_book_appointment,
            True # Yêu cầu Confirmation!
        )

        # --- ACCOUNTANT TOOLS ---
        self.tools["get_daily_revenue"] = (
            {
                "name": "get_daily_revenue",
                "description": "Lấy thống kê doanh thu trong ngày hôm nay hoặc ngày cụ thể.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "date": {"type": "STRING", "description": "Ngày cần xem doanh thu (YYYY-MM-DD). Để trống lấy hôm nay."}
                    }
                }
            },
            self._handle_get_daily_revenue,
            False
        )

        self.tools["get_unpaid_invoices"] = (
            {
                "name": "get_unpaid_invoices",
                "description": "Lấy danh sách các hóa đơn (Billing) chưa thanh toán (UNPAID hoặc PARTIAL).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {}
                }
            },
            self._handle_get_unpaid_invoices,
            False
        )
"""
# We will inject this right before `# ========================== TOOL HANDLERS ========================== #`
content = content.replace("# ========================== TOOL HANDLERS ========================== #", register_block + "\n    # ========================== TOOL HANDLERS ========================== #")


handlers_block = """
    # --- DOCTOR HANDLERS ---
    async def _handle_get_doctor_schedule(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Appointment, Patient, AppointmentStatus, Queue, QueueStatus
        from sqlalchemy.orm import selectinload
        import datetime
        
        target_date = args.get("date")
        if not target_date:
            target_date = datetime.date.today().isoformat()
            
        # Tìm các appointment của user(bác sĩ) này
        stmt = select(Appointment).options(selectinload(Appointment.patient)).where(
            Appointment.doctor_id == user.id,
            Appointment.appointment_date == datetime.date.fromisoformat(target_date)
        ).order_by(Appointment.start_time)
        
        result = await db.execute(stmt)
        appointments = result.scalars().all()
        
        # Tìm cả hàng đợi (queue)
        q_stmt = select(Queue).options(selectinload(Queue.patient)).where(
            Queue.doctor_id == user.id,
            Queue.status.in_([QueueStatus.WAITING, QueueStatus.IN_PROGRESS])
        ).order_by(Queue.queue_number)
        
        q_result = await db.execute(q_stmt)
        queues = q_result.scalars().all()
        
        data = []
        for a in appointments:
            data.append({
                "type": "Lịch hẹn (Appointment)",
                "patient_name": a.patient.full_name if a.patient else "N/A",
                "patient_id": a.patient.id if a.patient else "N/A",
                "time": a.start_time.isoformat() if a.start_time else "N/A",
                "status": a.status.value,
                "reason": a.reason or ""
            })
            
        q_data = []
        for q in queues:
            q_data.append({
                "type": "Hàng đợi (Queue)",
                "queue_number": q.queue_number,
                "patient_name": q.patient.full_name if q.patient else "N/A",
                "patient_id": q.patient.id if q.patient else "N/A",
                "status": q.status.value
            })
            
        return {
            "date": target_date,
            "appointments": data,
            "queues": q_data,
            "message": f"Tìm thấy {len(data)} lịch hẹn và {len(q_data)} bệnh nhân đang chờ khám."
        }

    async def _handle_get_patient_summary(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Patient, MedicalRecord, LabResult, Prescription
        from sqlalchemy import or_
        from sqlalchemy.orm import selectinload
        
        query = args.get("patient_name_or_id", "")
        if not query:
            return {"error": "Thiếu thông tin bệnh nhân"}
            
        # Tìm patient theo ID hoặc tên
        stmt = select(Patient).where(or_(
            Patient.id == query,
            Patient.full_name.ilike(f"%{query}%"),
            Patient.phone_number == query
        ))
        pat = (await db.execute(stmt)).scalars().first()
        if not pat:
            return {"error": f"Không tìm thấy hồ sơ bệnh nhân nào khớp với '{query}'"}
            
        # Lấy lịch sử khám gần nhất
        mr_stmt = select(MedicalRecord).where(MedicalRecord.patient_id == pat.id).order_by(MedicalRecord.created_at.desc()).limit(2)
        mrs = (await db.execute(mr_stmt)).scalars().all()
        
        lab_stmt = select(LabResult).where(LabResult.patient_id == pat.id).order_by(LabResult.created_at.desc()).limit(2)
        labs = (await db.execute(lab_stmt)).scalars().all()
        
        return {
            "patient_info": {
                "id": pat.id,
                "name": pat.full_name,
                "gender": pat.gender,
                "dob": pat.date_of_birth.isoformat() if pat.date_of_birth else None,
                "history": pat.medical_history
            },
            "recent_visits": [{"date": m.created_at.isoformat(), "diagnosis": m.diagnosis, "treatment_plan": m.treatment_plan} for m in mrs],
            "recent_labs": [{"test_name": l.test_name, "status": l.status.value, "abnormal": [r for r in (l.result_data or []) if r.get("is_abnormal")]} for l in labs]
        }

    # --- RECEPTIONIST HANDLERS ---
    async def _handle_search_patient(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Patient
        from sqlalchemy import or_
        query = args.get("query", "")
        if not query: return {"error": "Cần cung cấp từ khóa"}
        stmt = select(Patient).where(or_(
            Patient.full_name.ilike(f"%{query}%"),
            Patient.phone_number.ilike(f"%{query}%"),
            Patient.email.ilike(f"%{query}%")
        )).limit(5)
        pats = (await db.execute(stmt)).scalars().all()
        return {"results": [{"id": p.id, "name": p.full_name, "phone": p.phone_number, "email": p.email} for p in pats]}

    async def _handle_check_doctor_availability(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import User, UserRole, Appointment, AppointmentStatus
        from sqlalchemy import or_
        import datetime
        q = args.get("doctor_name", "")
        stmt = select(User).where(User.role == UserRole.DOCTOR, or_(
            User.username.ilike(f"%{q}%"),
            User.full_name.ilike(f"%{q}%")
        ))
        doc = (await db.execute(stmt)).scalars().first()
        if not doc: return {"error": f"Không tìm thấy Bác sĩ nào khớp với '{q}'"}
        
        today = datetime.date.today()
        astmt = select(Appointment).where(
            Appointment.doctor_id == doc.id, 
            Appointment.appointment_date == today,
            Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING])
        )
        apps = (await db.execute(astmt)).scalars().all()
        return {
            "doctor": {"id": doc.id, "name": doc.full_name},
            "appointments_today": len(apps),
            "next_available_slot": "Vui lòng kiểm tra trên lịch",
            "message": f"Bác sĩ {doc.full_name} hôm nay có {len(apps)} lịch khám chưa hoàn thành."
        }

    async def _handle_book_appointment(self, db: AsyncSession, user: User, args: dict) -> dict:
        # Nếu chưa confirm, chỉ trả về preview
        pat_id = args.get("patient_id")
        doc_id = args.get("doctor_id")
        return {
            "confirmation_message": f"Tạo lịch hẹn cho bệnh nhân (ID: {pat_id}) với Bác sĩ (ID: {doc_id}) vào ngày {args.get('appointment_date')} lúc {args.get('start_time')}?",
            "action_type": "CREATE_APPOINTMENT",
            "preview_data": args
        }

    # --- ACCOUNTANT HANDLERS ---
    async def _handle_get_daily_revenue(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Billing, PaymentStatus
        from sqlalchemy import func
        import datetime
        
        target_date = args.get("date")
        if not target_date:
            target_date = datetime.date.today().isoformat()
            
        stmt = select(func.sum(Billing.total_amount), func.count(Billing.id)).where(
            func.date(Billing.created_at) == datetime.date.fromisoformat(target_date),
            Billing.status == PaymentStatus.PAID
        )
        res = (await db.execute(stmt)).first()
        total_amount = res[0] or 0
        count = res[1] or 0
        
        return {
            "date": target_date,
            "total_revenue_vnd": float(total_amount),
            "paid_bills_count": count
        }

    async def _handle_get_unpaid_invoices(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Billing, PaymentStatus, Patient
        from sqlalchemy.orm import selectinload
        
        stmt = select(Billing).options(selectinload(Billing.patient)).where(
            Billing.status.in_([PaymentStatus.UNPAID, PaymentStatus.PARTIAL])
        ).order_by(Billing.created_at.desc()).limit(10)
        
        bills = (await db.execute(stmt)).scalars().all()
        data = []
        for b in bills:
            data.append({
                "id": b.id,
                "patient_name": b.patient.full_name if b.patient else "N/A",
                "total_amount": float(b.total_amount),
                "status": b.status.value,
                "date": b.created_at.isoformat()
            })
        return {"unpaid_invoices": data, "count": len(data), "message": "Hiển thị tối đa 10 hóa đơn gần nhất"}
"""

# We'll just append handlers_block to the end of the file
content = content + "\n" + handlers_block

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("done patching ai_tool_registry.py")
