with open('app/services/ai_tool_registry.py', 'r', encoding='utf-8') as f:
    content = f.read()

new_handler = """
    async def _handle_get_my_medical_history(self, db: AsyncSession, user: User, args: dict) -> dict:
        \"\"\"Lấy lịch sử khám bệnh (Consultation) của bệnh nhân đang trò chuyện\"\"\"
        from app.models.models import Consultation, ConsultationDiagnosis, Patient
        from sqlalchemy.orm import selectinload
        pat = (await db.execute(select(Patient).where(Patient.user_id == user.id))).scalar_one_or_none()
        if not pat:
            return {"error": "Không tìm thấy hồ sơ bệnh nhân."}

        stmt = (
            select(Consultation)
            .options(selectinload(Consultation.diagnoses).selectinload(ConsultationDiagnosis.diagnosis))
            .where(Consultation.patient_id == pat.id)
            .order_by(Consultation.created_at.desc())
            .limit(5)
        )
        consults = (await db.execute(stmt)).scalars().all()

        data = []
        for c in consults:
            diagnoses = [d.diagnosis.name for d in c.diagnoses if d.diagnosis] if c.diagnoses else []
            data.append({
                "date": c.created_at.isoformat(),
                "chief_complaint": c.chief_complaint or "",
                "diagnoses": diagnoses,
                "treatment_plan": c.treatment_plan or "",
                "notes": c.notes or ""
            })
        return {"medical_history": data, "count": len(data), "message": "Lịch sử khám bệnh gần nhất"}

"""

# Must use the windows line-ending version of target string
target_win = "    async def _handle_book_my_appointment(self, db: AsyncSession, user: User, args: dict) -> dict:\r\n"
target_unix = "    async def _handle_book_my_appointment(self, db: AsyncSession, user: User, args: dict) -> dict:\n"

if target_win in content:
    content = content.replace(target_win, new_handler + target_win)
    print("Found CRLF target")
elif target_unix in content:
    content = content.replace(target_unix, new_handler + target_unix)
    print("Found LF target")
else:
    print("ERROR: Target not found in content!")
    # Print surrounding context
    idx = content.find("_handle_book_my_appointment")
    if idx >= 0:
        print("Found at idx:", idx)
        print(repr(content[idx-50:idx+100]))
    raise SystemExit(1)

with open('app/services/ai_tool_registry.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Handler _handle_get_my_medical_history added to ai_tool_registry.py")
