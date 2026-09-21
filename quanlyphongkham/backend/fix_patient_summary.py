import os

file_path = "app/services/ai_tool_registry.py"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

old_block = """    async def _handle_get_patient_summary(self, db: AsyncSession, user: User, args: dict) -> dict:
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
            Patient.phone == query
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
        }"""

new_block = """    async def _handle_get_patient_summary(self, db: AsyncSession, user: User, args: dict) -> dict:
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
                "gender": pat.gender,
                "dob": pat.date_of_birth.isoformat() if pat.date_of_birth else None,
                "history": pat.medical_history
            },
            "recent_visits": [{"date": m.created_at.isoformat(), "diagnosis": [d.diagnosis.name for d in m.diagnoses] if m.diagnoses else [], "treatment_plan": m.treatment_plan} for m in mrs],
            "recent_labs": [{"test_name": l.test_name, "status": l.status.value, "abnormal": [r for r in (l.result_data or []) if r.get("is_abnormal")]} for l in labs]
        }"""

content = content.replace(old_block, new_block)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Patched get_patient_summary")
