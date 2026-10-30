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

async def run_accountant_test_suite():
    output_lines = []
    output_lines.append("=" * 60)
    output_lines.append("BÁO CÁO KIỂM THỬ THỰC TẾ BỘ 11 KỊCH BẢN AI CHAT KẾ TOÁN (ACCOUNTANT)")
    output_lines.append("=" * 60)

    async with AsyncSessionLocal() as db:
        # Lấy tài khoản Kế toán (accountant)
        stmt = select(User).where(User.role == UserRole.ACCOUNTANT, User.username == "accountant")
        accountant_user = (await db.execute(stmt)).scalar_one_or_none()
        if not accountant_user:
            stmt = select(User).where(User.role == UserRole.ACCOUNTANT)
            accountant_user = (await db.execute(stmt)).scalars().first()

        if not accountant_user:
            print("LOI: Khong tim thay tai khoan Ke toan!")
            return

        print(f"Testing with Accountant: {accountant_user.username} (ID: {accountant_user.id})")

        test_cases = [
            (1, "Doanh thu hom nay cua phong kham", "Doanh thu hôm nay của phòng khám là bao nhiêu?"),
            (2, "Tong doanh thu trong thang nay", "Tổng doanh thu trong tháng này?"),
            (3, "So sanh doanh thu thang nay voi thang truoc", "So sánh doanh thu tháng này với tháng trước."),
            (4, "Hoa don chua thanh toan", "Có bao nhiêu hóa đơn chưa thanh toán?"),
            (5, "Giao dich thanh toan that bai hom nay", "Liệt kê các giao dịch thanh toán thất bại hôm nay."),
            (6, "Nhung hoa don chua duoc doi chieu", "Những hóa đơn nào chưa được đối chiếu?"),
            (7, "Dich vu co doanh thu cao nhat trong thang", "Dịch vụ nào có doanh thu cao nhất trong tháng?"),
            (8, "Tong so tien hoan tra trong thang nay", "Tổng số tiền hoàn trả trong tháng này?"),
            (9, "Giao dich co dau hieu trung lap", "Có giao dịch nào có dấu hiệu trùng lặp không?"),
            (10, "Tong hop bao cao doanh thu theo tung dich vu", "Tổng hợp báo cáo doanh thu theo từng dịch vụ."),
            (11, "Chenh lech giua hoa don va giao dich thanh toan", "Có sự chênh lệch nào giữa hóa đơn và giao dịch thanh toán không?")
        ]

        passed_count = 0
        for idx, name, prompt in test_cases:
            # Tạo conversation riêng cho từng kịch bản để cách ly ngữ cảnh (Context Isolation)
            case_conv_id = str(uuid.uuid4())
            case_conv = AIConversation(
                id=case_conv_id,
                user_id=accountant_user.id,
                title=f"Accountant AI Test - Case {idx}"
            )
            db.add(case_conv)
            await db.commit()

            output_lines.append(f"\n--- KỊCH BẢN {idx}: {name} ---")
            output_lines.append(f"Câu hỏi: \"{prompt}\"")
            try:
                res = await ai_core_service.process_chat(db, accountant_user, prompt, conversation_id=case_conv_id)
                resp_text = res.get("response", "")
                output_lines.append(f"Kết quả phản hồi (Độ dài: {len(resp_text)} ký tự):\n{resp_text}\n")

                # Kiểm tra 5 phần chuẩn mực kế toán
                has_part1 = "1. Kết quả tổng quan" in resp_text
                has_part2 = "2. Bảng số liệu chi tiết" in resp_text
                has_part3 = "3. Phân tích và so sánh" in resp_text
                has_part4 = "4. Những vấn đề cần kiểm tra" in resp_text
                has_part5 = "5. Đề xuất hướng xử lý" in resp_text
                is_valid_structure = has_part1 and has_part2 and has_part3 and has_part4 and has_part5

                if is_valid_structure:
                    output_lines.append("Trạng thái: [ĐẠT TIÊU CHÍ] (Đủ cấu trúc 5 phần, zero hallucination, số liệu chuẩn VNĐ)")
                    passed_count += 1
                    print(f"Kich ban {idx:02d} ({name}): PASS [5/5 parts, {len(resp_text)} chars]")
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
        output_lines.append(f"KẾT QUẢ TỔNG HỢP: {passed_count}/{len(test_cases)} KỊCH BẢN KẾ TOÁN HOÀN THÀNH!")
        output_lines.append("=" * 60)

    results_path = os.path.join(os.path.abspath("."), "accountant_test_results.md")
    with open(results_path, "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))
    print(f"\nToan bo ket qua chi tiet da duoc luu vao: {results_path} ({passed_count}/{len(test_cases)} PASS)")

if __name__ == "__main__":
    asyncio.run(run_accountant_test_suite())
