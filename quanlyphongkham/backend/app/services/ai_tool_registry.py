from sqlalchemy import update
from typing import Dict, Any, Callable
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.models import User, UserRole, Patient, Appointment, AppointmentStatus
import datetime

class AIToolRegistry:
    def __init__(self):
        # Map of tool_name -> (schema_dict, async_handler_func, requires_confirmation)
        self.tools = {}
        self._register_tools()

    def _register_tools(self):
        # 1. get_my_appointments
        self.tools["get_my_appointments"] = (
            {
                "name": "get_my_appointments",
                "description": "Lấy danh sách các lịch hẹn (sắp tới hoặc đã qua) của chính bệnh nhân đang trò chuyện.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "status": {"type": "STRING", "description": "Lọc theo trạng thái: scheduled, completed, cancelled. Để trống nếu lấy tất cả."}
                    }
                }
            },
            self._handle_get_my_appointments,
            False # Không cần confirm
        )
        

        # 3. get_my_prescriptions
        self.tools["get_my_prescriptions"] = (
            {
                "name": "get_my_prescriptions",
                "description": "Lấy danh sách các đơn thuốc của bệnh nhân.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {}
                }
            },
            self._handle_get_my_prescriptions,
            False
        )
        
        # 4. get_my_lab_results
        self.tools["get_my_lab_results"] = (
            {
                "name": "get_my_lab_results",
                "description": "Lấy danh sách kết quả xét nghiệm của bệnh nhân.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {}
                }
            },
            self._handle_get_my_lab_results,
            False
        )
        # 2. cancel_my_appointment
        self.tools["cancel_my_appointment"] = (
            {
                "name": "cancel_my_appointment",
                "description": "Hủy một lịch hẹn của bệnh nhân. Trả về thông tin lịch hẹn để chờ người dùng xác nhận.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "appointment_date": {"type": "STRING", "description": "Ngày của lịch hẹn cần hủy (YYYY-MM-DD)"}
                    },
                    "required": ["appointment_date"]
                }
            },
            self._handle_cancel_my_appointment,
            True # Yêu cầu Confirmation!
        )

        self.tools["book_my_appointment"] = (
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

        # Admin Tools
        self.tools["get_system_stats"] = (
            {
                "name": "get_system_stats",
                "description": "Lấy thống kê tổng quan của hệ thống bao gồm số lượng người dùng, doanh thu, và số lượng lịch hẹn.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {}
                }
            },
            self._handle_get_system_stats,
            False
        )

        self.tools["get_users_list"] = (
            {
                "name": "get_users_list",
                "description": "Lấy danh sách người dùng trong hệ thống (có thể lọc theo vai trò).",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "role": {"type": "STRING", "description": "Lọc theo vai trò: admin, doctor, patient, receptionist, accountant. Để trống để lấy tất cả."}
                    }
                }
            },
            self._handle_get_users_list,
            False
        )

        self.tools["get_audit_logs"] = (
            {
                "name": "get_audit_logs",
                "description": "Lấy danh sách nhật ký hoạt động (Audit Logs) của hệ thống.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "action_type": {"type": "STRING", "description": "Lọc theo loại hành động (vd: login, update_user...). Để trống để lấy tất cả."}
                    }
                }
            },
            self._handle_get_audit_logs,
            False
        )

    
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

        # --- COMMON TOOLS ---
        self.tools["search_doctors"] = (
            {
                "name": "search_doctors",
                "description": "Tìm kiếm và lấy thông tin chi tiết của các Bác sĩ đang làm việc tại phòng khám (chuyên khoa, số điện thoại, v.v) để gợi ý cho bệnh nhân.",
                "parameters": {
                    "type": "OBJECT",
                    "properties": {
                        "specialty": {"type": "STRING", "description": "Chuyên khoa cần tìm (VD: 'Nội khoa', 'Nhi khoa', 'Tim mạch'). Để trống nếu muốn lấy tất cả."}
                    }
                }
            },
            self._handle_search_doctors,
            False
        )


    # ========================== TOOL HANDLERS ========================== #
    
    async def _handle_get_audit_logs(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import AuditLog
        stmt = select(AuditLog).order_by(AuditLog.created_at.desc())
        
        action_type = args.get("action_type")
        if action_type:
            stmt = stmt.where(AuditLog.action.ilike(f"%{action_type}%"))
            
        result = await db.execute(stmt)
        logs = result.scalars().all()
        
        data = []
        for log in logs[:15]: # Giới hạn 15 log gần nhất
            data.append({
                "id": log.id,
                "action": log.action.value if hasattr(log.action, 'value') else str(log.action),
                "user_id": log.user_id,
                "target": log.resource_type,
                "created_at": log.created_at.isoformat()
            })
            
        return {"audit_logs": data, "count": len(logs), "message": "Thành công (giới hạn 15 kết quả)"}

    async def _handle_get_system_stats(self, db: AsyncSession, user: User, args: dict) -> dict:
        from sqlalchemy import func
        from app.models.models import User, Appointment, Billing
        
        total_users = (await db.execute(select(func.count(User.id)))).scalar()
        total_appointments = (await db.execute(select(func.count(Appointment.id)))).scalar()
        total_revenue = (await db.execute(select(func.sum(Billing.total_amount)))).scalar() or 0
        
        return {
            "total_users": total_users,
            "total_appointments": total_appointments,
            "total_revenue_vnd": total_revenue
        }

    async def _handle_get_users_list(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import User, UserRole
        stmt = select(User).order_by(User.created_at.desc())
        
        role_filter = args.get("role")
        if role_filter:
            try:
                stmt = stmt.where(User.role == UserRole(role_filter))
            except ValueError:
                pass
                
        result = await db.execute(stmt)
        users = result.scalars().all()
        
        data = []
        for u in users[:20]: # Giới hạn 20 người dùng
            data.append({
                "id": u.id,
                "username": u.username,
                "role": u.role.value,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat()
            })
            
        return {"users": data, "count": len(users), "message": "Thành công (giới hạn 20 kết quả)"}

    async def _handle_get_my_prescriptions(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Prescription, PrescriptionItem
        from sqlalchemy.orm import selectinload
        pat = (await db.execute(select(Patient).where(Patient.user_id == user.id))).scalar_one_or_none()
        if not pat: return {"error": "Không tìm thấy hồ sơ."}
        
        stmt = select(Prescription).options(selectinload(Prescription.items).selectinload(PrescriptionItem.medicine)).where(Prescription.patient_id == pat.id).order_by(Prescription.created_at.desc())
        result = await db.execute(stmt)
        rxs = result.scalars().all()
        
        data = []
        for rx in rxs[:3]:
            items = []
            for item in rx.items:
                items.append(f"{item.medicine.name if item.medicine else 'Thuốc'} ({item.quantity} {item.medicine.unit if item.medicine else 'viên'} - {item.dosage} - {item.frequency})")
            data.append({
                "date": rx.created_at.isoformat(),
                "notes": rx.notes,
                "items": items
            })
        return {"prescriptions": data}

    async def _handle_get_my_lab_results(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import LabResult
        pat = (await db.execute(select(Patient).where(Patient.user_id == user.id))).scalar_one_or_none()
        if not pat: return {"error": "Không tìm thấy hồ sơ."}
        
        stmt = select(LabResult).where(LabResult.patient_id == pat.id).order_by(LabResult.created_at.desc())
        result = await db.execute(stmt)
        labs = result.scalars().all()
        
        data = []
        for lab in labs[:3]:
            data.append({
                "test_name": lab.test_name,
                "date": lab.test_date.isoformat() if lab.test_date else lab.created_at.isoformat(),
                "status": lab.status.value,
                "result_summary": lab.notes,
                "abnormal_results": [r for r in (lab.result_data or []) if r.get("is_abnormal")]
            })
        return {"lab_results": data}

    async def _handle_get_my_appointments(self, db: AsyncSession, user: User, args: dict) -> dict:
        """Handler lấy lịch hẹn cho Patient"""
        pat = (await db.execute(select(Patient).where(Patient.user_id == user.id))).scalar_one_or_none()
        if not pat:
            return {"error": "Không tìm thấy hồ sơ bệnh nhân."}
            
        stmt = select(Appointment).where(Appointment.patient_id == pat.id).order_by(Appointment.appointment_date.desc())
        status = args.get("status")
        if status:
            try:
                stmt = stmt.where(Appointment.status == AppointmentStatus(status))
            except Exception:
                pass
                
        result = await db.execute(stmt)
        appointments = result.scalars().all()
        
        data = []
        for a in appointments[:5]: # Giới hạn 5 lịch gần nhất tránh vượt token
            data.append({
                "id": a.id,
                "date": a.appointment_date.isoformat(),
                "time": a.start_time.isoformat() if a.start_time else "",
                "status": a.status.value,
                "reason": a.reason or ""
            })
        
        return {"appointments": data, "count": len(data), "message": "Thành công"}

    async def _handle_book_my_appointment(self, db: AsyncSession, user: User, args: dict) -> dict:
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

    async def _handle_cancel_my_appointment(self, db: AsyncSession, user: User, args: dict) -> dict:
        """Tạo yêu cầu Hủy lịch (Chưa thực sự xóa trong DB, chỉ lấy ra chờ confirm)"""
        pat = (await db.execute(select(Patient).where(Patient.user_id == user.id))).scalar_one_or_none()
        if not pat:
            return {"error": "Không tìm thấy hồ sơ bệnh nhân."}
            
        target_date = args.get("appointment_date")
        if not target_date:
            return {"error": "Cần cung cấp ngày hẹn muốn hủy."}
            
        stmt = select(Appointment).where(
            Appointment.patient_id == pat.id,
            Appointment.appointment_date == datetime.date.fromisoformat(target_date),
            Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING])
        )
        result = await db.execute(stmt)
        appointment = result.scalar_one_or_none()
        
        if not appointment:
            return {"error": f"Không tìm thấy lịch hẹn hợp lệ vào ngày {target_date} để hủy."}
            
        # Trả về thông tin để UI hiển thị Confirmation Box
        return {
            "appointment_id": appointment.id,
            "date": appointment.appointment_date.isoformat(),
            "time": appointment.start_time.isoformat(),
            "confirmation_message": f"Bạn có chắc chắn muốn hủy lịch hẹn vào ngày {appointment.appointment_date.isoformat()} lúc {appointment.start_time.isoformat()} không?"
        }

    async def execute_tool(self, db: AsyncSession, user: User, tool_name: str, args: dict, action_confirmed: bool = False) -> dict:
        """Chạy thực tế tool, kiểm tra confirmation"""
        if tool_name not in self.tools:
            return {"error": "Tool không tồn tại hoặc không hợp lệ."}
            
        schema, handler, requires_confirm = self.tools[tool_name]
        
        # Nếu tool này yêu cầu confirm mà user chưa confirm -> Dừng lại và yêu cầu
        if requires_confirm and not action_confirmed:
            # Gọi handler để lấy data cần show lên popup confirm
            dry_run_data = await handler(db, user, args)
            if "error" in dry_run_data:
                return dry_run_data # Có lỗi thì khỏi confirm
                
            return {
                "requires_confirmation": True,
                "tool_name": tool_name,
                "pending_args": args,
                "confirmation_message": dry_run_data.get("confirmation_message", "Bạn có chắc chắn thực hiện hành động này?"),
                "preview_data": dry_run_data
            }
            
        # Nếu không cần confirm hoặc user ĐÃ confirm -> Execute action thật
        if requires_confirm and action_confirmed:
            # Code thực thi thay đổi DB thực sự nằm ở đây
            if tool_name == "book_my_appointment":
                from app.api.v1.appointments import create_appointment
                import datetime
                pat_id = (await handler(db, user, args)).get("patient_id")
                try:
                    from app.models.models import Doctor
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
                    )
                    return {"success": True, "message": "Đã tạo lịch hẹn thành công!"}
                except Exception as e:
                    return {"error": f"Không thể tạo lịch hẹn: {str(e)}"}
            
            if tool_name == "cancel_my_appointment":
                # Do action
                apt_id = args.get("appointment_id")
                if not apt_id:
                    apt_id = (await handler(db, user, args)).get("appointment_id")
                
                if apt_id:
                    await db.execute(update(Appointment).where(Appointment.id == apt_id).values(status=AppointmentStatus.CANCELLED))
                    await db.flush()
                    # Audit log sẽ được ghi ở tầng service gọi vào đây
                    return {"success": True, "message": "Đã hủy lịch hẹn thành công."}
                return {"error": "Không thể hủy lịch."}

        # Nếu không phải high-risk, chạy bình thường
        return await handler(db, user, args)

# --- DOCTOR HANDLERS ---
    async def _handle_get_doctor_schedule(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Appointment, Patient, AppointmentStatus, Queue, QueueStatus, Staff, Doctor
        from sqlalchemy.orm import selectinload
        from sqlalchemy import select
        import datetime
        
        target_date = args.get("date")
        if not target_date or target_date == "hôm nay":
            target_date = datetime.date.today().isoformat()
            
        try:
            query_date = datetime.date.fromisoformat(target_date)
        except ValueError:
            query_date = datetime.date.today()
            
        doc_result = await db.execute(select(Doctor.id).join(Staff).where(Staff.user_id == user.id))
        doc_id = doc_result.scalar_one_or_none()
        if not doc_id:
            return {"error": "Tài khoản không phải là Bác sĩ hoặc chưa được liên kết"}
            
        # Tìm các appointment của user(bác sĩ) này
        stmt = select(Appointment).options(selectinload(Appointment.patient)).where(
            Appointment.doctor_id == doc_id,
            Appointment.appointment_date == query_date
        ).order_by(Appointment.start_time)
        
        result = await db.execute(stmt)
        appointments = result.scalars().all()
        
        # Tìm cả hàng đợi (queue)
        q_stmt = select(Queue).options(selectinload(Queue.patient)).where(
            Queue.doctor_id == doc_id,
            Queue.status.in_([QueueStatus.WAITING, QueueStatus.IN_CONSULTATION])
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
        from app.models.models import Patient, Consultation, ConsultationDiagnosis, LabResult, Prescription
        from sqlalchemy import or_
        from sqlalchemy.orm import selectinload
        
        query = args.get("patient_name_or_id", "")
        if not query:
            return {"error": "Thiếu thông tin bệnh nhân"}
            
        # Tìm patient theo ID hoặc tên
        stmt = select(Patient).where(or_(
            Patient.id == query,
            Patient.full_name.ilike(f"%{query}%"),
            Patient.phone == query
        ))
        pat = (await db.execute(stmt)).scalars().first()
        if not pat:
            return {"error": f"Không tìm thấy hồ sơ bệnh nhân nào khớp với '{query}'"}
            
        # Lấy lịch sử khám gần nhất
        mr_stmt = select(Consultation).options(selectinload(Consultation.diagnoses).selectinload(ConsultationDiagnosis.diagnosis)).where(Consultation.patient_id == pat.id).order_by(Consultation.created_at.desc()).limit(2)
        mrs = (await db.execute(mr_stmt)).scalars().all()
        
        lab_stmt = select(LabResult).where(LabResult.patient_id == pat.id).order_by(LabResult.created_at.desc()).limit(2)
        labs = (await db.execute(lab_stmt)).scalars().all()
        
        return {
            "patient_info": {
                "id": pat.id,
                "name": pat.full_name,
                "gender": pat.gender.value if hasattr(pat.gender, 'value') else pat.gender,
                "dob": pat.date_of_birth.isoformat() if pat.date_of_birth else None,
                "allergies": pat.allergies
            },
            "recent_visits": [{"date": m.created_at.isoformat(), "diagnosis": [d.diagnosis.name for d in m.diagnoses] if m.diagnoses else [], "treatment_plan": m.treatment_plan} for m in mrs],
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
            Patient.phone.ilike(f"%{query}%"),
            Patient.email.ilike(f"%{query}%")
        )).limit(5)
        pats = (await db.execute(stmt)).scalars().all()
        return {"results": [{"id": p.id, "name": p.full_name, "phone": p.phone, "email": p.email} for p in pats]}

    async def _handle_check_doctor_availability(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import User, UserRole, Staff, Appointment, AppointmentStatus
        from sqlalchemy import or_
        import datetime
        q = args.get("doctor_name", "")
        stmt = select(User).join(Staff, User.id == Staff.user_id).where(
            User.role == UserRole.DOCTOR, or_(
            User.username.ilike(f"%{q}%"),
            Staff.full_name.ilike(f"%{q}%")
        ))
        doc = (await db.execute(stmt)).scalars().first()
        if not doc: return {"error": f"Không tìm thấy Bác sĩ nào khớp với '{q}'"}
        
        staff = (await db.execute(select(Staff).where(Staff.user_id == doc.id))).scalars().first()
        doc_name = staff.full_name if staff else doc.username
        
        today = datetime.date.today()
        astmt = select(Appointment).where(
            Appointment.doctor_id == doc.id, 
            Appointment.appointment_date == today,
            Appointment.status.in_([AppointmentStatus.SCHEDULED, AppointmentStatus.WAITING])
        )
        apps = (await db.execute(astmt)).scalars().all()
        return {
            "doctor": {"id": doc.id, "name": doc_name},
            "appointments_today": len(apps),
            "next_available_slot": "Vui lòng kiểm tra trên lịch",
            "message": f"Bác sĩ {doc_name} hôm nay có {len(apps)} lịch khám chưa hoàn thành."
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
        from app.models.models import Billing, BillingStatus
        from sqlalchemy import func
        import datetime
        
        target_date = args.get("date")
        if not target_date:
            target_date = datetime.date.today().isoformat()
            
        stmt = select(func.sum(Billing.total_amount), func.count(Billing.id)).where(
            func.date(Billing.created_at) == target_date,
            Billing.status == BillingStatus.PAID
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
        from app.models.models import Billing, BillingStatus, Patient
        from sqlalchemy.orm import selectinload
        
        stmt = select(Billing).options(selectinload(Billing.patient)).where(
            Billing.status.in_([BillingStatus.UNPAID, BillingStatus.PARTIALLY_PAID])
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


    async def _handle_search_doctors(self, db: AsyncSession, user: User, args: dict) -> dict:
        from app.models.models import Doctor, Staff
        from sqlalchemy.orm import selectinload
        from sqlalchemy import select
        
        stmt = select(Doctor).options(selectinload(Doctor.staff), selectinload(Doctor.specialty))
        docs = (await db.execute(stmt)).scalars().all()
        
        data = []
        for d in docs:
            data.append({
                "id": d.staff.user_id if d.staff else d.id,
                "name": d.staff.full_name if d.staff else "Bác sĩ",
                "phone": d.staff.phone if d.staff else "",
                "specialty": d.specialty.name if d.specialty else "Chung",
                "bio": d.bio or "Bác sĩ tại AI Clinic."
            })
            
        return {"doctors": data, "message": f"Tìm thấy {len(data)} bác sĩ."}

    def get_tool_schema(self, tool_name: str) -> dict:
        if tool_name in self.tools:
            return self.tools[tool_name][0]
        return None



ai_tool_registry = AIToolRegistry()
