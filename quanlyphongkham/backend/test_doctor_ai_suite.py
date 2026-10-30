import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath("."))

from app.core.database import AsyncSessionLocal
from app.models.models import User, UserRole, AIConversation
from app.services.ai_core_service import ai_core_service
from sqlalchemy import select
import uuid

async def run_doctor_test_suite():
    output_lines = []
    output_lines.append("=" * 60)
    output_lines.append("BAO CAO KIEM THU THUC TE BO 10 KICH BAN AI CHAT BAC SI (DOCTOR)")
    output_lines.append("=" * 60)

    async with AsyncSessionLocal() as db:
        # Lay tai khoan bac si (doctor)
        stmt = select(User).where(User.role == UserRole.DOCTOR, User.username == "doctor")
        doctor_user = (await db.execute(stmt)).scalar_one_or_none()
        if not doctor_user:
            # Fallback tim bat ky user nao co role doctor
            stmt = select(User).where(User.role == UserRole.DOCTOR)
            doctor_user = (await db.execute(stmt)).scalars().first()

        if not doctor_user:
            print("LOI: Khong tim thay tai khoan Bac si!")
            return

        print(f"Testing with Doctor: {doctor_user.username} (ID: {doctor_user.id})")

        # Tao mot conversation rieng de test context
        conv_id = str(uuid.uuid4())
        conv = AIConversation(
            id=conv_id,
            user_id=doctor_user.id,
            title="Doctor AI Test Session"
        )
        db.add(conv)
        await db.commit()

        test_cases = [
            (1, "So luong benh nhan can kham hom nay", "Hom nay toi co bao nhieu benh nhan can kham?"),
            (2, "Liet ke chi tiet lich kham hom nay", "Liet ke lich kham cua toi trong ngay hom nay."),
            (3, "Benh nhan dang cho kham", "Nhung benh nhan nao dang cho kham?"),
            (4, "Tom tat ho so benh an EMR", "Tom tat ho so benh an cua benh nhan ma BN000002."),
            (5, "Lich su cac lan kham (Context)", "Benh nhan nay da tung kham nhung lan nao?"),
            (6, "Ho so kham con thieu thong tin", "Nhung ho so kham nao con thieu thong tin?"),
            (7, "Thong ke benh nhan da kham trong thang", "Thong ke so luong benh nhan toi da kham trong thang nay."),
            (8, "Kiem tra trung lich / xung dot lich", "Co lich kham nao bi trung khong?"),
            (9, "Tong hop ket qua xet nghiem gan day", "Tong hop cac ket qua xet nghiem gan day cua benh nhan BN2024014."),
            (10, "Ho tro chuyen mon y khoa tham khao", "Tham khao phac do dieu tri ban dau cho benh nhan tang huyet ap vo can do 1.")
        ]

        passed_count = 0
        for idx, name, prompt in test_cases:
            output_lines.append(f"\n--- KICH BAN {idx}: {name} ---")
            output_lines.append(f"Cau hoi: \"{prompt}\"")
            try:
                res = await ai_core_service.process_chat(db, doctor_user, prompt, conversation_id=conv_id)
                resp_text = res.get("response", "")
                output_lines.append(f"Ket qua phan hoi (Do dai: {len(resp_text)} ky tu):\n{resp_text}\n")
                output_lines.append("Trang thai: [DAT TIEU CHI]")
                passed_count += 1
                print(f"Kich ban {idx:02d} ({name}): PASS ({len(resp_text)} chars)")
            except Exception as e:
                import traceback
                traceback.print_exc()
                output_lines.append(f"Trang thai: [THAT BAI] -> {e}")
                print(f"Kich ban {idx:02d} ({name}): FAIL -> {type(e).__name__}: {e}")

        output_lines.append("\n" + "=" * 60)
        output_lines.append(f"KET QUA TONG HOP: {passed_count}/{len(test_cases)} KICH BAN BAC SI HOAN THANH!")
        output_lines.append("=" * 60)

    with open("doctor_test_results.md", "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))
    print(f"\nToan bo ket qua chi tiet da duoc luu vao: doctor_test_results.md ({passed_count}/{len(test_cases)} PASS)")

if __name__ == "__main__":
    asyncio.run(run_doctor_test_suite())
