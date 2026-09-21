import os

file_path = "app/services/ai_tool_registry.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Register the tool for the Patient (around line 75, before # Admin Tools)
old_tool_reg = """        # Admin Tools"""

new_tool_reg = """        self.tools["book_my_appointment"] = (
            {
                "name": "book_my_appointment",
                "description": "Đặt lịch hẹn mới cho chính bệnh nhân.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "doctor_id": {"type": "STRING", "description": "Mã ID (UUID) của bác sĩ. Bắt buộc phải có."},
                        "appointment_date": {"type": "STRING", "description": "Ngày hẹn (YYYY-MM-DD)"},
                        "start_time": {"type": "STRING", "description": "Giờ hẹn (HH:MM)"},
                        "reason": {"type": "STRING", "description": "Lý do khám"}
                    },
                    "required": ["doctor_id", "appointment_date", "start_time"]
                }
            },
            self._handle_book_my_appointment,
            True # Yêu cầu Confirmation!
        )

        # Admin Tools"""
content = content.replace(old_tool_reg, new_tool_reg)

# 2. Add the handler function (around cancel_my_appointment)
old_handler = """    async def _handle_cancel_my_appointment(self, db: AsyncSession, user: User, args: dict) -> dict:"""

new_handler = """    async def _handle_book_my_appointment(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Patient
        pat = (await db.execute(select(Patient).where(Patient.user_id == user.id))).scalar_one_or_none()
        if not pat:
            return {"error": "Không tìm thấy hồ sơ bệnh nhân."}
            
        doc_id = args.get("doctor_id")
        return {
            "confirmation_message": f"Bạn muốn đặt lịch hẹn vào lúc {args.get('start_time')} ngày {args.get('appointment_date')} với Bác sĩ (ID: {doc_id})?",
            "action_type": "CREATE_APPOINTMENT",
            "preview_data": args,
            "patient_id": pat.id
        }

    async def _handle_cancel_my_appointment(self, db: AsyncSession, user: User, args: dict) -> dict:"""
content = content.replace(old_handler, new_handler)

# 3. Add execution logic in execute_tool (around line 440)
old_exec = """        # Nếu không cần confirm hoặc user ĐÃ confirm -> Execute action thật
        if requires_confirm and action_confirmed:
            # Code thực thi thay đổi DB thực sự nằm ở đây
            if tool_name == "cancel_my_appointment":"""

new_exec = """        # Nếu không cần confirm hoặc user ĐÃ confirm -> Execute action thật
        if requires_confirm and action_confirmed:
            # Code thực thi thay đổi DB thực sự nằm ở đây
            if tool_name == "book_my_appointment":
                from app.api.v1.appointments import create_appointment
                import datetime
                pat_id = (await handler(db, user, args)).get("patient_id")
                try:
                    await create_appointment(
                        patient_id=pat_id,
                        doctor_id=args.get("doctor_id"),
                        specialty_id=args.get("doctor_id"), # fallback if we dont fetch
                        appointment_date=datetime.date.fromisoformat(args.get("appointment_date")),
                        start_time=datetime.time.fromisoformat(args.get("start_time")),
                        end_time=datetime.time.fromisoformat(args.get("start_time")),
                        reason=args.get("reason"),
                        db=db,
                        current_user=user
                    )
                    return {"success": True, "message": "Đã tạo lịch hẹn thành công!"}
                except Exception as e:
                    return {"error": f"Không thể tạo lịch hẹn: {str(e)}"}
            
            if tool_name == "cancel_my_appointment":"""
content = content.replace(old_exec, new_exec)

# wait, specialty_id in create_appointment is required. We must get the doctor's specialty!
# I will modify the execute logic to fetch doctor's specialty.

old_exec2 = """                    await create_appointment(
                        patient_id=pat_id,
                        doctor_id=args.get("doctor_id"),
                        specialty_id=args.get("doctor_id"), # fallback if we dont fetch
                        appointment_date=datetime.date.fromisoformat(args.get("appointment_date")),
                        start_time=datetime.time.fromisoformat(args.get("start_time")),
                        end_time=datetime.time.fromisoformat(args.get("start_time")),
                        reason=args.get("reason"),
                        db=db,
                        current_user=user
                    )"""

new_exec2 = """                    from app.models.models import Doctor
                    doc = (await db.execute(select(Doctor).where(Doctor.id == args.get("doctor_id")))).scalar_one_or_none()
                    specialty_id = doc.specialty_id if doc else "dummy"
                    
                    # Need to calculate end_time (start_time + 30 mins)
                    start_t = datetime.time.fromisoformat(args.get("start_time"))
                    dt = datetime.datetime.combine(datetime.date.today(), start_t)
                    end_t = (dt + datetime.timedelta(minutes=30)).time()
                    
                    await create_appointment(
                        patient_id=pat_id,
                        doctor_id=args.get("doctor_id"),
                        specialty_id=specialty_id,
                        appointment_date=datetime.date.fromisoformat(args.get("appointment_date")),
                        start_time=start_t,
                        end_time=end_t,
                        reason=args.get("reason"),
                        db=db,
                        current_user=user
                    )"""
content = content.replace(old_exec2, new_exec2)


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Added book_my_appointment")
