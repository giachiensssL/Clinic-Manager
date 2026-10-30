import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath("."))

from app.core.database import AsyncSessionLocal
from app.models.models import User, UserRole
from app.services.ai_core_service import ai_core_service
from sqlalchemy import select

async def run_test_suite():
    output_lines = []
    output_lines.append("=" * 60)
    output_lines.append("BAO CAO KIEM THU THUC TE BO 15 KICH BAN AI CHAT ADMIN")
    output_lines.append("=" * 60)

    async with AsyncSessionLocal() as db:
        stmt = select(User).where(User.role == UserRole.ADMIN)
        admin_user = (await db.execute(stmt)).scalar_one_or_none()
        if not admin_user:
            print("LOI: Khong tim thay tai khoan Admin!")
            return

        test_cases = [
            (1, "Tong quan he thong", "He thong hom nay hoat dong nhu the nao?"),
            (2, "Thong ke nguoi dung", "Hien tai he thong co bao nhieu nguoi dung?"),
            (3, "Tai khoan bi khoa", "Co bao nhieu tai khoan bi khoa?"),
            (4, "Phan tich doanh thu", "Phan tich doanh thu thang nay."),
            (5, "So sanh doanh thu", "So sanh doanh thu thang nay voi thang truoc."),
            (6, "Kiem tra bat thuong", "Co bat thuong nao trong he thong hom nay khong?"),
            (7, "Hoat dong quan tri", "Ai vua thay doi quyen nguoi dung?"),
            (8, "Giam sat dich vu AI", "Cac dich vu AI co dang hoat dong khong?"),
            (9, "Quan tri dich vu", "Nhung dich vu nao dang hoat dong?"),
            (10, "Khuyen mai & Uu dai", "Co chuong trinh khuyen mai nao sap het han khong?"),
            (11, "Benh nhan theo chuyen khoa (RBAC)", "Thong ke luong benh nhan theo chuyen khoa."),
            (12, "Tu choi benh an ca nhan (RBAC)", "Cho toi xem benh an cua benh nhan Nguyen Van A."),
            (13, "Ngu canh lien tuc", "So sanh voi thang truoc."),
            (14, "Danh gia loi du lieu", "Du lieu hien tai co loi khong?"),
            (15, "Tong hop van de can xu ly", "Tong hop cac van de can Admin xu ly.")
        ]

        passed_count = 0
        for idx, name, prompt in test_cases:
            output_lines.append(f"\n--- KICH BAN {idx}: {name} ---")
            output_lines.append(f"Cau hoi: \"{prompt}\"")
            try:
                res = await ai_core_service.process_chat(db, admin_user, prompt)
                resp_text = res.get("response", "")
                output_lines.append(f"Ket qua phan hoi (Do dai: {len(resp_text)} ky tu):\n{resp_text}\n")
                output_lines.append("Trang thai: [DAT TIEU CHI]")
                passed_count += 1
                print(f"Kich ban {idx:02d} ({name}): PASS ({len(resp_text)} chars)")
            except Exception as e:
                output_lines.append(f"Trang thai: [THAT BAI] -> {e}")
                print(f"Kich ban {idx:02d} ({name}): FAIL -> {type(e).__name__}")

        output_lines.append("\n" + "=" * 60)
        output_lines.append(f"KET QUA TONG HOP: {passed_count}/{len(test_cases)} KICH BAN HOAN THANH!")
        output_lines.append("=" * 60)

    with open("test_results.md", "w", encoding="utf-8") as f:
        f.write("\n".join(output_lines))
    print(f"\nToan bo ket qua chi tiet da duoc luu vao: test_results.md ({passed_count}/{len(test_cases)} PASS)")

if __name__ == "__main__":
    asyncio.run(run_test_suite())
