import re

with open("app/services/ai_tool_registry.py", "r", encoding="utf-8") as f:
    content = f.read()

new_tools = """
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
"""

content = content.replace("        # 2. cancel_my_appointment", new_tools + "        # 2. cancel_my_appointment")

new_handlers = """
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
"""

content = content.replace("    async def _handle_get_my_appointments", new_handlers + "\n    async def _handle_get_my_appointments")

with open("app/services/ai_tool_registry.py", "w", encoding="utf-8") as f:
    f.write(content)
