import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath("."))

from app.core.database import AsyncSessionLocal
from app.models.models import User, UserRole, AIConversation
from app.services.ai_core_service import ai_core_service
from sqlalchemy import select
import uuid

async def run_patient_test_suite():
    output_lines = []
    output_lines.append("=" * 60)
    output_lines.append("BAO CAO KIEM THU THUC TE BO 10 KICH BAN AI CHAT BENH NHAN (PATIENT)")
    output_lines.append("=" * 60)

    async with AsyncSessionLocal() as db:
        # Lay tai khoan benh nhan (patient)
        stmt = select(User).where(User.role == UserRole.PATIENT, User.username == "patient")
        patient_user = (await db.execute(stmt)).scalar_one_or_none()
        if not patient_user:
            # Fallback tim bat ky user nao co role patient
            stmt = select(User).where(User.role == UserRole.PATIENT)
            patient_user = (await db.execute(stmt)).scalars().first()

        if not patient_user:
            print("LOI: Khong tim thay tai khoan Benh nhan!")
            return

        print(f"Testing with Patient: {patient_user.username} (ID: {patient_user.id})")

        # Tao mot conversation rieng de test context
        conv_id = str(uuid.uuid4())
        conv = AIConversation(
            id=conv_id,
            user_id=patient_user.id,
            title="Patient AI Test Session"
        )
        db.add(conv)
        await db.commit()

        test_cases = [
            (1, "Lich kham trong tuan nay", "Tôi có lịch khám nào trong tuần này không?"),
            (2, "Dat lich kham da lieu", "Tôi muốn đặt lịch khám da liễu."),
            (3, "Bac si con lich kham chieu mai", "Có bác sĩ nào còn lịch khám chiều mai không?"),
            (4, "Huong dan doi lich kham da dat", "Tôi muốn đổi lịch khám đã đặt."),
            (5, "Ket qua ho so kham gan day", "Hồ sơ khám gần đây của tôi có kết quả gì?"),
            (6, "Kiem tra hoa don chua thanh toan", "Tôi còn hóa đơn nào chưa thanh toán không?"),
            (7, "Trang thai giao dich thanh toan", "Giao dịch thanh toán của tôi đã thành công chưa?"),
            (8, "Chuong trinh khuyen mai va uu dai", "Hiện tại phòng khám có chương trình khuyến mãi nào?"),
            (9, "Huong dan chuan bi truoc khi kham", "Tôi cần chuẩn bị những gì trước khi khám?"),
            (10, "Luu y cham soc sau khi dung dich vu", "Sau khi thực hiện dịch vụ, tôi cần lưu ý điều gì?")
        ]

        passed_count = 0
        for idx, name, prompt in test_cases:
            # Tạo conversation riêng cho từng kịch bản
            case_conv_id = str(uuid.uuid4())
            case_conv = AIConversation(
                id=case_conv_id,
                user_id=patient_user.id,
                title=f"Patient AI Test - Case {idx}"
            )
            db.add(case_conv)
            await db.commit()

            output_lines.append(f"\n--- KICH BAN {idx}: {name} ---")
            output_lines.append(f"Cau hoi: \"{prompt}\"")
            try:
                res = await ai_core_service.process_chat(db, patient_user, prompt, conversation_id=case_conv_id)
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
        output_lines.append(f"KET QUA TONG HOP: {passed_count}/{len(test_cases)} KICH BAN BENH NHAN HOAN THANH!")
        output_lines.append("=" * 60)

    with open("patient_test_results.md", "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))
    print(f"\nToan bo ket qua chi tiet da duoc luu vao: patient_test_results.md ({passed_count}/{len(test_cases)} PASS)")

if __name__ == "__main__":
    asyncio.run(run_patient_test_suite())
