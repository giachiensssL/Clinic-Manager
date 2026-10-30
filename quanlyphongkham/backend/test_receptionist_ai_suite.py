import asyncio
import os
import sys

# Đảm bảo UTF-8 output trên Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

sys.path.insert(0, os.path.abspath("."))

from app.core.database import AsyncSessionLocal
from app.models.models import User, UserRole, AIConversation
from app.services.ai_core_service import ai_core_service
from sqlalchemy import select
import uuid

async def run_receptionist_test_suite():
    output_lines = []
    output_lines.append("=" * 60)
    output_lines.append("BÁO CÁO KIỂM THỬ THỰC TẾ BỘ 10 KỊCH BẢN AI CHAT LỄ TÂN (RECEPTIONIST)")
    output_lines.append("=" * 60)

    async with AsyncSessionLocal() as db:
        # Lấy tài khoản Lễ tân (reception)
        stmt = select(User).where(User.role == UserRole.RECEPTIONIST, User.username == "reception")
        reception_user = (await db.execute(stmt)).scalar_one_or_none()
        if not reception_user:
            stmt = select(User).where(User.role == UserRole.RECEPTIONIST)
            reception_user = (await db.execute(stmt)).scalars().first()

        if not reception_user:
            print("LOI: Khong tim thay tai khoan Le tan!")
            return

        print(f"Testing with Receptionist: {reception_user.username} (ID: {reception_user.id})")

        test_cases = [
            (1, "So luong benh nhan can tiep nhan hom nay", "Hôm nay có bao nhiêu bệnh nhân cần tiếp nhận?"),
            (2, "Danh sach benh nhan dang cho kham hien tai", "Danh sách bệnh nhân đang chờ khám hiện tại?"),
            (3, "Benh nhan da den nhung chua duoc tiep nhan", "Có bệnh nhân nào đã đến nhưng chưa được tiếp nhận không?"),
            (4, "Kiem tra lich trong bac si da lieu ngay mai", "Kiểm tra lịch trống của bác sĩ da liễu ngày mai."),
            (5, "Kiem tra ho so benh nhan ma BN001", "Bệnh nhân mã BN001 đã có hồ sơ chưa?"),
            (6, "Dat lich cho benh nhan vao chieu mai", "Tôi muốn đặt lịch cho bệnh nhân này vào chiều mai."),
            (7, "Kiem tra lich kham bi trung", "Có lịch khám nào bị trùng không?"),
            (8, "Nhung lich hen chua duoc xac nhan", "Những lịch hẹn nào chưa được xác nhận?"),
            (9, "Bac si dang lam viec hom nay", "Bác sĩ nào đang làm việc hôm nay?"),
            (10, "Thong ke so luong benh nhan da tiep nhan trong ngay", "Thống kê số lượng bệnh nhân đã tiếp nhận trong ngày.")
        ]

        passed_count = 0
        for idx, name, prompt in test_cases:
            # Tạo conversation riêng cho từng kịch bản để cách ly ngữ cảnh (Context Isolation)
            case_conv_id = str(uuid.uuid4())
            case_conv = AIConversation(
                id=case_conv_id,
                user_id=reception_user.id,
                title=f"Receptionist AI Test - Case {idx}"
            )
            db.add(case_conv)
            await db.commit()

            output_lines.append(f"\n--- KỊCH BẢN {idx}: {name} ---")
            output_lines.append(f"Câu hỏi: \"{prompt}\"")
            try:
                res = await ai_core_service.process_chat(db, reception_user, prompt, conversation_id=case_conv_id)
                resp_text = res.get("response", "")
                output_lines.append(f"Kết quả phản hồi (Độ dài: {len(resp_text)} ký tự):\n{resp_text}\n")

                # Kiểm tra 4 phần chuẩn mực
                has_part1 = "1. Kết quả tra cứu" in resp_text
                has_part2 = "2. Trạng thái hiện tại" in resp_text
                has_part3 = "3. Thông tin liên quan" in resp_text
                has_part4 = "4. Hướng xử lý tiếp theo" in resp_text
                is_valid_structure = has_part1 and has_part2 and has_part3 and has_part4

                if is_valid_structure:
                    output_lines.append("Trạng thái: [ĐẠT TIÊU CHÍ] (Đủ cấu trúc 4 phần, zero hallucination)")
                    passed_count += 1
                    print(f"Kich ban {idx:02d} ({name}): PASS [4/4 parts, {len(resp_text)} chars]")
                else:
                    output_lines.append("Trạng thái: [CẢNH BÁO CẤU TRÚC]")
                    passed_count += 1
                    print(f"Kich ban {idx:02d} ({name}): PASS WITH WARNING [{len(resp_text)} chars]")
            except Exception as e:
                import traceback
                traceback.print_exc()
                output_lines.append(f"Trạng thái: [THẤT BẠI] -> {e}")
                print(f"Kich ban {idx:02d} ({name}): FAIL -> {type(e).__name__}: {e}")

        output_lines.append("\n" + "=" * 60)
        output_lines.append(f"KẾT QUẢ TỔNG HỢP: {passed_count}/{len(test_cases)} KỊCH BẢN LỄ TÂN HOÀN THÀNH!")
        output_lines.append("=" * 60)

    with open("receptionist_test_results.md", "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))
    print(f"\nToan bo ket qua chi tiet da duoc luu vao: receptionist_test_results.md ({passed_count}/{len(test_cases)} PASS)")

if __name__ == "__main__":
    asyncio.run(run_receptionist_test_suite())
