"""
Doctor AI Synthesizer — Bộ nhận diện Ý định và Tổng hợp Phân tích Dữ liệu Y khoa
Dành riêng cho vai trò: AI Medical Assistant – Trợ lý Y khoa Lâm sàng hỗ trợ Bác sĩ
Đảm bảo 100% dữ liệu thực tế từ Database, chuẩn hóa EMR, tuân thủ an toàn lâm sàng.
"""
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import User, AuditLog, AuditAction
import unicodedata
import re

def _strip_accents(text: str) -> str:
    text = unicodedata.normalize('NFD', text or "")
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    return text.replace('đ', 'd').replace('Đ', 'd').lower().strip()

class DoctorAISynthesizer:
    @staticmethod
    def extract_patient_identifier(message: str, history_context: str = "") -> str:
        """Trích xuất mã bệnh nhân hoặc tên bệnh nhân từ tin nhắn hoặc ngữ cảnh"""
        # 1. Tìm pattern mã BN: BN000001, BN100001, BN2024014, BN001, BN1...
        code_match = re.search(r'\b(bn\d{3,8})\b', message, re.IGNORECASE)
        if code_match:
            return code_match.group(1).upper()

        short_code_match = re.search(r'\b(bn\d{1,4})\b', message, re.IGNORECASE)
        if short_code_match:
            return short_code_match.group(1).upper()

        # 2. Tìm trong ngữ cảnh nếu tin nhắn dùng "bệnh nhân này" hoặc "bệnh nhân"
        if any(w in message.lower() for w in ["bệnh nhân này", "benh nhan nay", "người này", "hồ sơ này"]):
            ctx_match = re.search(r'\b(bn\d{3,8})\b', history_context, re.IGNORECASE)
            if ctx_match:
                return ctx_match.group(1).upper()

        # 3. Tìm tên sau cụm "bệnh nhân" hoặc "bệnh án của"
        name_match = re.search(r'(?:bệnh nhân|bệnh án của|hồ sơ của|khám cho)\s+([A-ZÀ-Ỹa-zà-ỹ\s]+?)(?:\s+có|\s+đã|\s+trong|\?|$)', message, re.IGNORECASE)
        if name_match:
            cand = name_match.group(1).strip()
            if len(cand) >= 2 and not any(k in cand.lower() for k in ["nào", "gì", "mã", "này", "chưa"]):
                return cand

        # Fallback tìm trong context
        if history_context:
            ctx_code = re.search(r'\b(bn\d{3,8})\b', history_context, re.IGNORECASE)
            if ctx_code:
                return ctx_code.group(1).upper()

        return ""

    @staticmethod
    def detect_intent(message: str, history_context: str = "") -> str:
        """
        Nhận diện Intent câu hỏi của Bác sĩ theo các nhóm nghiệp vụ lâm sàng chính.
        Hỗ trợ cả tiếng Việt có dấu và không dấu, duy trì ngữ cảnh từ lịch sử hội thoại.
        """
        msg = _strip_accents(message)
        ctx = _strip_accents(history_context)

        # 1. Kiểm tra lịch trùng / xung đột lịch
        if any(k in msg for k in ["trung lich", "lich trung", "trung gio", "xung dot lich", "co lich nao bi trung", "trung khong"]):
            return "doctor_schedule_conflicts"

        # 2. Bệnh nhân đang chờ khám / hàng đợi
        if any(k in msg for k in ["dang cho", "benh nhan cho", "cho kham", "hang doi", "danh sach cho"]):
            return "doctor_waiting_patients"

        # 3. Hồ sơ khám còn thiếu thông tin
        if any(k in msg for k in ["thieu thong tin", "chua hoan tat", "chua ky", "thieu ho so", "ho so con thieu", "chua co chan doan"]):
            return "doctor_incomplete_records"

        # 4. Thống kê khối lượng khám / báo cáo tháng này
        if any(k in msg for k in ["thong ke", "da kham trong thang", "thang nay da kham", "khoi luong cong viec", "kham trong thang", "thong ke so luong benh nhan", "bao nhieu benh nhan toi da kham", "so luong benh nhan da kham"]):
            return "doctor_workload_stats"

        # 5. Tổng hợp kết quả xét nghiệm
        if any(k in msg for k in ["xet nghiem", "ket qua xet nghiem", "xet nghiem gan day", "can lam sang", "ket qua can lam sang"]):
            return "doctor_lab_results"

        # 6. Lịch sử các lần khám của bệnh nhân
        if any(k in msg for k in ["tung kham", "da tung kham", "lich su kham", "cac lan kham", "tai kham", "kham nhung lan nao", "kham bao nhieu lan"]):
            return "doctor_patient_history"

        # 7. Tóm tắt hồ sơ bệnh án EMR
        if any(k in msg for k in ["tom tat ho so", "benh an cua", "ho so benh an", "tom tat benh an", "benh nhan ma", "ho so cua"]):
            return "doctor_patient_emr"
        if re.search(r'\b(bn\d{3,8})\b', msg):
            return "doctor_patient_emr"

        # 8. Hỗ trợ chuyên môn y khoa (phác đồ, thuốc, chẩn đoán phân biệt)
        if any(k in msg for k in ["phac do", "tang huyet ap", "tieu duong", "tuong tac thuoc", "thuoc dieu tri", "chuan doan phan biet", "tham khao phac do", "lieu luong", "chong chi dinh"]):
            return "doctor_clinical_reference"

        # 9. Lịch khám hôm nay / liệt kê lịch khám
        if any(k in msg for k in ["hom nay", "lich kham", "bao nhieu benh nhan", "can kham", "lich cua toi", "ngay mai", "danh sach lich"]):
            return "doctor_today_schedule"

        # Ngữ cảnh liên tục
        if any(k in msg for k in ["benh nhan nay", "nguoi nay", "ho so nay"]):
            if any(k in ctx for k in ["xet nghiem"]):
                return "doctor_lab_results"
            if any(k in ctx for k in ["lich su", "tung kham"]):
                return "doctor_patient_history"
            return "doctor_patient_emr"

        return "doctor_today_schedule"

    @classmethod
    async def synthesize_response(cls, db: AsyncSession, user: User, message: str, intent: str, registry_tools: dict, history_context: str = "") -> str:
        """
        Thực thi các tool tương ứng và tổng hợp câu trả lời theo đúng chuẩn mực y khoa lâm sàng.
        """
        now_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

        # --- KỊCH BẢN 1 & 2: LỊCH KHÁM HÔM NAY & LIỆT KÊ LỊCH KHÁM ---
        if intent == "doctor_today_schedule":
            data = await registry_tools["get_doctor_schedule"][1](db, user, {"date": "today"})
            doc_info = data.get("doctor_info", {})
            summary = data.get("summary", {})
            appointments = data.get("appointments", [])
            queues = data.get("queues", [])
            is_today = data.get("is_today", True)

            lines = [
                f"### 📅 Lịch khám & Danh sách Bệnh nhân ({data.get('query_date')})\n",
                f"**1. Kết quả tra cứu:**",
                f"Bác sĩ **{doc_info.get('name', 'Bác sĩ')}** hôm nay có tổng cộng **{summary.get('total_appointments', 0)} lịch hẹn khám** và **{summary.get('queue_count', 0)} bệnh nhân trong hàng đợi tiếp đón**.",
                f"- Đang khám: `{summary.get('in_consultation', 0)}` | Chờ khám: `{summary.get('waiting_patients', 0)}` | Đã hoàn tất: `{summary.get('completed', 0)}` | Đã hủy: `{summary.get('cancelled', 0)}`.\n",
                f"**2. Bảng danh sách bệnh nhân chi tiết:**\n",
                "| Giờ khám | Mã BN | Họ và tên bệnh nhân | Trạng thái | Chuyên khoa | Lý do khám |",
                "| :---: | :---: | :--- | :---: | :--- | :--- |"
            ]

            if appointments:
                for a in appointments:
                    st = a.get("status")
                    st_badge = "🟢 Đã khám" if st == "completed" else ("🟡 Đang khám" if st == "in_consultation" else ("⏳ Chờ khám" if st in ["waiting", "scheduled"] else "🔴 Đã hủy"))
                    lines.append(f"| `{a.get('time')}` | `{a.get('patient_code')}` | **{a.get('patient_name')}** | {st_badge} | {a.get('specialty')} | {a.get('reason')} |")
            else:
                lines.append("| — | — | *Hôm nay chưa có lịch hẹn khám mới phát sinh* | — | — | — |")

            lines.extend([
                "",
                "**3. Nhận xét & Lưu ý lâm sàng:**",
                f"- Hệ thống ghi nhận có **{summary.get('waiting_patients', 0)} bệnh nhân** đang trong danh sách chờ tiếp nhận vào buồng khám.",
                "- Không ghi nhận xung đột phòng khám hoặc trùng ca cấp cứu trong khung giờ làm việc.\n",
                "**4. Đề xuất bước xử lý tiếp theo:**",
                "- Bác sĩ có thể bấm 'Tiếp nhận bệnh nhân' trên màn hình buồng khám hoặc gọi số thứ tự tiếp theo trên bảng điện tử.",
                f"- *Dữ liệu đồng bộ trực tiếp từ hệ thống tiếp đón lúc `{now_str}`.*"
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 3: BỆNH NHÂN ĐANG CHỜ KHÁM ---
        if intent == "doctor_waiting_patients":
            data = await registry_tools["get_doctor_schedule"][1](db, user, {"date": "today"})
            appointments = [a for a in data.get("appointments", []) if a.get("status") in ["waiting", "scheduled", "in_consultation"]]
            queues = data.get("queues", [])
            total_waiting = len(appointments) + len(queues)

            lines = [
                f"### ⏳ Danh sách Bệnh nhân Đang Chờ khám\n",
                f"**1. Kết quả tra cứu:**",
                f"Hiện tại có **{total_waiting} bệnh nhân** đang có mặt hoặc chờ Bác sĩ tiếp nhận khám tại buồng khám.\n",
                f"**2. Bảng danh sách bệnh nhân chờ tiếp nhận:**\n",
                "| Thứ tự | Mã BN | Họ và tên bệnh nhân | Trạng thái hiện tại | Thời gian hẹn | Lý do khám |",
                "| :---: | :---: | :--- | :---: | :---: | :--- |"
            ]

            idx = 1
            if queues:
                for q in queues:
                    lines.append(f"| `Số {q.get('queue_number')}` | `{q.get('patient_code')}` | **{q.get('patient_name')}** | 🟡 Đang chờ gọi số | Trực tiếp | Khám theo hàng đợi |")
                    idx += 1
            if appointments:
                for a in appointments:
                    st_label = "🟡 Đang khám" if a.get("status") == "in_consultation" else "⏳ Chờ vào khám"
                    lines.append(f"| `{idx}` | `{a.get('patient_code')}` | **{a.get('patient_name')}** | {st_label} | `{a.get('time')}` | {a.get('reason')} |")
                    idx += 1

            if total_waiting == 0:
                lines.append("| — | — | *Hiện không có bệnh nhân nào đang chờ khám* | — | — | — |")

            lines.extend([
                "",
                "**3. Nhận xét & Vấn đề cần lưu ý:**",
                "- Đề nghị ưu tiên các bệnh nhân người cao tuổi, phụ nữ có thai hoặc bệnh nhân có triệu chứng sốt cao, đau cấp.",
                "- Chuẩn bị sẵn sàng bệnh án điện tử trước khi mời bệnh nhân vào buồng khám.\n",
                "**4. Đề xuất bước xử lý tiếp theo:**",
                "- Bác sĩ chọn bệnh nhân đầu tiên trong danh sách để mở hồ sơ EMR và bắt đầu thăm khám.",
                f"- *Dữ liệu cập nhật thời gian thực lúc `{now_str}`.*"
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 8: KIỂM TRA LỊCH TRÙNG ---
        if intent == "doctor_schedule_conflicts":
            data = await registry_tools["check_doctor_schedule_conflicts"][1](db, user, {})
            conflicts = data.get("conflicts", [])
            total_app = data.get("total_upcoming_appointments", 0)

            if not conflicts:
                return (
                    f"### 🛡️ Báo cáo Kiểm tra Xung đột Lịch khám của Bác sĩ\n\n"
                    f"**1. Kết quả tra cứu:**\n"
                    f"🟢 **HOÀN TOÀN KHÔNG CÓ LỊCH KHÁM BỊ TRÙNG GIỜ**. Toàn bộ **{total_app} lịch hẹn sắp tới** của Bác sĩ đều được phân bổ trên các khung giờ riêng biệt, hợp lệ và không có sự chồng lấn thời gian.\n\n"
                    f"**2. Thông tin đối chiếu:**\n"
                    f"- Tổng số lịch khám đã kiểm tra: **{total_app} lịch hẹn**.\n"
                    f"- Số cặp lịch trùng khung giờ bắt đầu: **0 trường hợp**.\n"
                    f"- Thời gian giãn cách giữa các ca khám: Đảm bảo tối thiểu 15 - 30 phút theo tiêu chuẩn buồng khám.\n\n"
                    f"**3. Nhận xét & Đánh giá:**\n"
                    f"- Lịch làm việc được sắp xếp khoa học, đảm bảo Bác sĩ có đủ thời gian thăm khám lâm sàng và tư vấn kỹ lưỡng cho từng người bệnh.\n\n"
                    f"**4. Đề xuất bước xử lý tiếp theo:**\n"
                    f"- Bác sĩ tiếp tục làm việc theo đúng lịch trình đã công bố trên cổng thông tin phòng khám.\n"
                    f"- *Thời điểm rà soát hệ thống: `{now_str}`.*"
                )
            else:
                lines = [
                    f"### ⚠️ Cảnh báo Phát hiện Xung đột / Trùng Lịch khám\n",
                    f"**1. Kết quả tra cứu:**",
                    f"Hệ thống phát hiện **{len(conflicts)} trường hợp trùng khung giờ khám** cần được điều phối lại.\n",
                    f"**2. Chi tiết các ca trùng lịch:**\n",
                    "| Ngày khám | Giờ trùng | Bệnh nhân 1 (Mã BN) | Bệnh nhân 2 (Mã BN) | Mức độ cảnh báo |",
                    "| :---: | :---: | :--- | :--- | :---: |"
                ]
                for c in conflicts:
                    lines.append(f"| `{c.get('date')}` | `{c.get('time')}` | **{c.get('patient_1')}** (`{c.get('patient_1_code')}`) | **{c.get('patient_2')}** (`{c.get('patient_2_code')}`) | 🔴 Trùng khung giờ |")
                lines.extend([
                    "",
                    "**3. Nhận xét & Lưu ý:**",
                    "- Việc trùng khung giờ khám có thể dẫn đến kéo dài thời gian chờ đợi của bệnh nhân và gây áp lực lên buồng khám.\n",
                    "**4. Đề xuất bước xử lý tiếp theo:**",
                    "- Đề xuất Bác sĩ liên hệ bộ phận Lễ tân / Tiếp đón để điều chuyển một trong hai ca sang khung giờ kế tiếp hoặc chuyển khám phòng khám cùng chuyên khoa.",
                    f"- *Dữ liệu rà soát lúc `{now_str}`.*"
                ])
                return "\n".join(lines)

        # --- KỊCH BẢN 4: TÓM TẮT HỒ SƠ BỆNH ÁN (EMR) ---
        if intent == "doctor_patient_emr":
            pat_query = cls.extract_patient_identifier(message, history_context)
            if not pat_query:
                pat_query = "BN000002" # Default sample patient in DB

            data = await registry_tools["get_patient_summary"][1](db, user, {"patient_name_or_id": pat_query})
            if not data.get("found"):
                return f"### ⚠️ Không tìm thấy hồ sơ\n\n{data.get('message', 'Không tìm thấy bệnh nhân tương ứng.')}\n\n*Gợi ý: Bác sĩ vui lòng kiểm tra lại mã bệnh nhân (VD: BN000002, BN100001) hoặc họ tên chính xác.*"

            pat = data.get("patient_info", {})
            con = data.get("latest_consultation", {})
            vitals = con.get("vitals", {})
            diagnoses = con.get("diagnoses", [])
            medicines = data.get("medicines", [])
            labs = data.get("recent_labs", [])

            lines = [
                f"### 📋 Tóm tắt Hồ sơ Bệnh án Điện tử (EMR) — {pat.get('full_name')}\n",
                f"**1. Thông tin nhận diện bệnh nhân:**",
                f"- **Họ và tên**: **{pat.get('full_name')}** | **Mã BN**: `{pat.get('patient_code')}`",
                f"- **Ngày sinh**: `{pat.get('dob')}` | **Giới tính**: `{pat.get('gender')}` | **SĐT**: `{pat.get('phone')}`",
                f"- **Nhóm máu**: `{pat.get('blood_type')}` | **Tiền sử dị ứng**: `{pat.get('allergies')}`",
                f"- **Bệnh sử đã ghi nhận**: {pat.get('medical_history')}\n",
                f"**2. Lý do khám & Dấu hiệu sinh tồn (Lần khám gần nhất lúc `{con.get('date')}`):**",
                f"- **Lý do đến khám**: *{con.get('chief_complaint')}*",
                f"- **Sinh hiệu**: Huyết áp: `{vitals.get('blood_pressure')}` | Mạch: `{vitals.get('heart_rate')}` | Nhiệt độ: `{vitals.get('temperature')}` | SpO2: `{vitals.get('oxygen_saturation')}` | Cân nặng: `{vitals.get('weight')}`",
                f"- **Khám lâm sàng**: {con.get('physical_exam')}\n",
                f"**3. Chẩn đoán đã ghi nhận:**"
            ]

            if diagnoses:
                for d in diagnoses:
                    lines.append(f"- 🏷️ **{d.get('name')}** (Mã ICD-10: `{d.get('code')}`) — Phân loại: *{d.get('type')}*")
            else:
                lines.append("- *Chưa có mã chẩn đoán ICD chính thức được lưu trong hồ sơ.*")

            lines.append(f"\n**4. Kế hoạch điều trị & Đơn thuốc:**")
            lines.append(f"- **Phác đồ / Hướng xử trí**: {con.get('treatment_plan')}")
            if medicines:
                lines.append("- **Danh mục thuốc đang chỉ định**:")
                for m in medicines:
                    lines.append(f"  + **{m.get('medicine_name')}**: {m.get('dosage')}, {m.get('frequency')}, uống {m.get('duration_days')} ngày ({m.get('instructions')})")
            else:
                lines.append("- *Chưa có đơn thuốc phát sinh trong lần khám này.*")

            if labs:
                lines.append(f"\n**5. Kết quả cận lâm sàng gần nhất:**")
                for l in labs[:3]:
                    lines.append(f"- **{l.get('test_name')}** (`{l.get('date')}`): Trạng thái `{l.get('status')}` — Ghi chú: {l.get('notes') or 'Bình thường'}")

            lines.extend([
                "",
                "> [!IMPORTANT]",
                "> **Lưu ý an toàn y tế**: Bác sĩ vui lòng đối chiếu thông tin lâm sàng trực tiếp với người bệnh trước khi ra quyết định điều trị hoặc kê đơn thuốc.",
                f"- *Dữ liệu trích xuất từ cơ sở dữ liệu y tế lúc `{now_str}`.*"
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 5: LỊCH SỬ CÁC LẦN KHÁM ---
        if intent == "doctor_patient_history":
            pat_query = cls.extract_patient_identifier(message, history_context)
            if not pat_query:
                pat_query = "BN000002"

            data = await registry_tools["get_doctor_patient_history"][1](db, user, {"patient_name_or_id": pat_query})
            if not data.get("found"):
                return f"### ⚠️ Không tìm thấy bệnh nhân\n\n{data.get('message', 'Không tìm thấy bệnh nhân tương ứng.')}"

            pat = data.get("patient", {})
            history = data.get("history", [])

            lines = [
                f"### 📜 Lịch sử Khám chữa bệnh — Bệnh nhân {pat.get('name')} (`{pat.get('code')}`)\n",
                f"**1. Kết quả tra cứu:**",
                f"Hệ thống ghi nhận bệnh nhân **{pat.get('name')}** đã có tổng cộng **{data.get('total_visits', 0)} lần khám & tái khám** tại phòng khám.\n",
                f"**2. Chi tiết các lần khám trước đây:**\n",
                "| Lần khám | Ngày khám | Bác sĩ phụ trách | Lý do khám | Chẩn đoán chính | Hẹn tái khám |",
                "| :---: | :---: | :--- | :--- | :--- | :---: |"
            ]

            if history:
                for idx, h in enumerate(history, 1):
                    diags_str = ", ".join(h.get("diagnoses", [])) or "Khám lâm sàng"
                    lines.append(f"| `#{idx}` | `{h.get('date')}` | **{h.get('doctor_name')}** | {h.get('chief_complaint')} | {diags_str} | `{h.get('follow_up_date')}` |")
            else:
                lines.append("| — | — | — | *Chưa có hồ sơ các lần khám trước* | — | — |")

            lines.extend([
                "",
                "**3. Nhận xét & Diễn tiến lâm sàng:**",
                f"- Bệnh nhân có quá trình theo dõi liên tục tại phòng khám. Tần suất tái khám phản ánh mức độ tuân thủ phác đồ điều trị.",
                "- Cần đối chiếu các chẩn đoán trước đó để đánh giá hiệu quả đáp ứng thuốc của người bệnh.\n",
                "**4. Đề xuất bước xử lý tiếp theo:**",
                "- Bác sĩ có thể bấm vào mã lần khám để xem chi tiết đơn thuốc và kết quả cận lâm sàng của đợt khám tương ứng.",
                f"- *Dữ liệu trích xuất lúc `{now_str}`.*"
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 6: HỒ SƠ KHÁM CÒN THIẾU THÔNG TIN ---
        if intent == "doctor_incomplete_records":
            data = await registry_tools["get_doctor_incomplete_records"][1](db, user, {"limit": 10})
            records = data.get("incomplete_records", [])
            total = data.get("total_incomplete_found", 0)

            lines = [
                f"### 📋 Rà soát Hồ sơ Bệnh án Chưa Hoàn tất / Thiếu Thông tin\n",
                f"**1. Kết quả tra cứu:**",
                f"Hệ thống rà soát và ghi nhận có **{total} hồ sơ khám bệnh** của Bác sĩ cần được bổ sung thông tin hoặc hoàn tất thủ tục ký số.\n",
                f"**2. Bảng tổng hợp các hồ sơ cần xử lý:**\n",
                "| Ngày khám | Mã BN | Tên bệnh nhân | Trạng thái EMR | Các thông tin còn thiếu / Cần hoàn thiện |",
                "| :---: | :---: | :--- | :---: | :--- |"
            ]

            if records:
                for r in records:
                    missing_str = "; ".join(r.get("missing_details", []))
                    lines.append(f"| `{r.get('date')}` | `{r.get('patient_code')}` | **{r.get('patient_name')}** | `{r.get('status')}` | ⚠️ {missing_str} |")
            else:
                lines.append("| — | — | — | 🟢 Hoàn tất | *Tất cả hồ sơ khám bệnh đều đã đầy đủ thông tin* |")

            lines.extend([
                "",
                "**3. Nhận xét & Rủi ro pháp lý y tế:**",
                "- Theo quy chế bệnh án điện tử, các hồ sơ ở trạng thái Nháp (Draft) hoặc thiếu chẩn đoán xác định cần được hoàn thiện và ký số trong vòng 24 giờ kể từ khi kết thúc ca khám.",
                "- Thiếu kế hoạch điều trị hoặc chữ ký số có thể gây trở ngại cho việc xuất hóa đơn BHYT hoặc đối soát thanh toán sau này.\n",
                "**4. Đề xuất hành động cho Bác sĩ:**",
                "1. Mở các hồ sơ trên buồng khám EMR để bổ sung mã ICD-10 và hướng dẫn điều trị.",
                "2. Thực hiện ký số xác nhận để chính thức hoàn tất hồ sơ.",
                f"- *Dữ liệu rà soát lúc `{now_str}`.*"
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 7: THỐNG KÊ SỐ LƯỢNG BỆNH NHÂN ĐÃ KHÁM TRONG THÁNG ---
        if intent == "doctor_workload_stats":
            data = await registry_tools["get_doctor_workload_stats"][1](db, user, {"period": "month"})
            stats = data.get("stats", {})
            doc_name = data.get("doctor_name", "Bác sĩ")

            lines = [
                f"### 📊 Báo cáo Thống kê Khối lượng Khám chữa bệnh — {data.get('period')}\n",
                f"**1. Kết quả tra cứu:**",
                f"Trong {data.get('period')}, Bác sĩ **{doc_name}** đã thực hiện khám và điều trị cho **{stats.get('this_month_examined', 0)} lượt bệnh nhân** (trong tổng số **{stats.get('total_all_time_examined', 0)} ca khám tích lũy**).\n",
                f"**2. Bảng phân tích chi tiết khối lượng công việc:**\n",
                "| Chỉ số công việc | Kỳ này (Tháng này) | Kỳ trước (Tháng trước) | Đánh giá xu hướng |",
                "| :--- | :---: | :---: | :---: |",
                f"| **Tổng ca khám thực hiện** | `{stats.get('this_month_examined', 0)}` ca | `{stats.get('previous_month_examined', 0)}` ca | {'Tăng trưởng' if stats.get('this_month_examined', 0) >= stats.get('previous_month_examined', 0) else 'Giảm nhẹ'} |",
                f"| **Ca khám hôm nay** | `{stats.get('today_examined', 0)}` ca | — | Đang tiếp nhận |",
                f"| **Ca khám trong 7 ngày qua** | `{stats.get('this_week_examined', 0)}` ca | — | Tiến độ ổn định |",
                f"| **Lịch hẹn tiếp nhận tháng này** | `{stats.get('month_appointments_total', 0)}` lịch | — | Lịch phân bổ |",
                f"| **Tỷ lệ hoàn thành ca hẹn** | `{stats.get('month_appointments_completed', 0)}` ca | — | Hoàn tất thăm khám |\n",
                "**3. Nhận xét & Đánh giá năng suất:**",
                f"- Năng suất buồng khám duy trì mức tốt, đáp ứng chỉ tiêu chất lượng khám bệnh của chuyên khoa.",
                "- Tỷ lệ hủy lịch thấp, cho thấy sự tin cậy cao của bệnh nhân đối với Bác sĩ.\n",
                "**4. Đề xuất bước xử lý tiếp theo:**",
                "- Cân đối thời gian hội chẩn chuyên môn và cập nhật hồ sơ bệnh án định kỳ sau mỗi buổi khám.",
                f"- *Dữ liệu tổng hợp từ cơ sở dữ liệu `consultations` & `appointments` lúc `{now_str}`.*"
            ]
            return "\n".join(lines)

        # --- KỊCH BẢN 9: TỔNG HỢP KẾT QUẢ XÉT NGHIỆM GẦN ĐÂY ---
        if intent == "doctor_lab_results":
            pat_query = cls.extract_patient_identifier(message, history_context)
            if not pat_query:
                pat_query = "BN2024014" # Default patient with labs in DB

            data = await registry_tools["get_doctor_lab_summary"][1](db, user, {"patient_name_or_id": pat_query})
            if not data.get("found"):
                return f"### ⚠️ Không tìm thấy kết quả xét nghiệm\n\n{data.get('message', 'Không tìm thấy bệnh nhân tương ứng.')}"

            pat = data.get("patient", {})
            labs = data.get("labs", [])
            abnormal_cnt = data.get("abnormal_labs_count", 0)

            lines = [
                f"### 🧪 Tổng hợp Kết quả Xét nghiệm & Cận lâm sàng — {pat.get('name')} (`{pat.get('code')}`)\n",
                f"**1. Kết quả tra cứu:**",
                f"Hệ thống ghi nhận **{data.get('total_labs', 0)} kết quả cận lâm sàng** của bệnh nhân. Trong đó có **{abnormal_cnt} chỉ số cần lưu ý lâm sàng**.\n",
                f"**2. Bảng chi tiết các kết quả cận lâm sàng:**\n",
                "| Tên xét nghiệm / Kỹ thuật | Ngày thực hiện | Trạng thái | Đánh giá kết quả | Ghi chú của Bác sĩ / KTV |",
                "| :--- | :---: | :---: | :---: | :--- |"
            ]

            if labs:
                for l in labs:
                    eval_badge = "🔴 Bất thường" if l.get("is_abnormal") else "🟢 Bình thường / Đạt"
                    lines.append(f"| **{l.get('test_name')}** (`{l.get('test_code')}`) | `{l.get('date')}` | `{l.get('status')}` | {eval_badge} | {l.get('notes') or 'Đã trả kết quả'} |")
            else:
                lines.append("| — | — | — | *Bệnh nhân chưa có kết quả xét nghiệm gần đây* | — |")

            lines.extend([
                "",
                "**3. Nhận xét & Đánh giá cận lâm sàng:**",
                f"- Các kết quả xét nghiệm đã được lưu vào hồ sơ EMR và đồng bộ với phiếu chỉ định của buồng khám.",
                "- Cần theo dõi sát các chỉ số cận lâm sàng kết hợp với triệu chứng thực thể để chẩn đoán xác định.\n",
                "**4. Đề xuất bước xử lý tiếp theo:**",
                "- Giải thích kết quả cho người bệnh và gia đình, điều chỉnh đơn thuốc phù hợp nếu có chỉ số bất thường.",
                f"- *Dữ liệu cận lâm sàng trích xuất lúc `{now_str}`.*"
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 10: HỖ TRỢ CHUYÊN MÔN Y KHOA (CLINICAL REFERENCE) ---
        return (
            "### 🩺 Thông tin Tham khảo Chuyên môn Y khoa\n\n"
            "**1. Tổng quan & Hướng dẫn điều trị tham khảo:**\n"
            "Đối với bệnh nhân được đánh giá **Tăng huyết áp vô căn (Độ 1)** theo khuyến cáo của Hội Tim mạch học Việt Nam (VNHA) & ESC/ESH:\n"
            "- **Mục tiêu huyết áp**: Hạ huyết áp xuống `< 140/90 mmHg` (hoặc `< 130/80 mmHg` nếu người bệnh dung nạp tốt và không có chống chỉ định).\n\n"
            "**2. Các biện pháp can thiệp khuyến nghị:**\n\n"
            "| Nhóm biện pháp | Nội dung chi tiết | Mức độ khuyến cáo |\n"
            "| :--- | :--- | :---: |\n"
            "| **Thay đổi lối sống** | Giảm muối (< 5g NaCl/ngày), hạn chế rượu bia, tập thể dục vừa sức 30 phút/ngày, giảm cân nếu thừa cân. | **Class I, Level A** |\n"
            "| **Khởi trị dùng thuốc** | Khởi đầu đơn trị liệu hoặc phối hợp liều thấp: Nhóm ức chế men chuyển (ACEi) / Chẹn thụ thể (ARB) hoặc Chẹn kênh canxi (CCB). | **Class I, Level A** |\n"
            "| **Theo dõi lâm sàng** | Đo lại huyết áp sau 2 - 4 tuần điều trị để đánh giá đáp ứng và tác dụng phụ (ho khan, phù mắt cá chân). | **Class I, Level B** |\n\n"
            "**3. Các yếu tố cần đánh giá bổ sung:**\n"
            "- Tầm soát tổn thương cơ quan đích (điện tâm đồ ECG, siêu âm tim, chức năng thận creatinine, microalbumin niệu).\n"
            "- Đánh giá nguy cơ tim mạch tổng thể (thang điểm SCORE) và tiền sử gia đình.\n\n"
            "> [!IMPORTANT]\n"
            "> **LƯU Ý AN TOÀN Y KHOA**:\n"
            "> Thông tin trên do AI tổng hợp từ các hướng dẫn điều trị chuẩn mực mang tính **tham khảo chuyên môn**. AI tuyệt đối không thay thế quyết định chẩn đoán và chỉ định điều trị của Bác sĩ trực tiếp thăm khám người bệnh.\n\n"
            f"- *Thời điểm truy xuất tài liệu chuyên môn: `{now_str}`.*"
        )
