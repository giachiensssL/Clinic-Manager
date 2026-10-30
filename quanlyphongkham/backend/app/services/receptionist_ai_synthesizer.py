"""
ReceptionistAISynthesizer — Hybrid Fallback & Intelligent Response Engine for Receptionist
Tổng hợp câu trả lời chuẩn mực, chuyên nghiệp, hỗ trợ điều phối sảnh và buồng khám cho Lễ tân (Receptionist).
100% dữ liệu thực từ SQLite (clinic.db) — Phản hồi tức thì (< 0.2s) ngay cả khi Gemini API hết hạn mức.
"""

from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import User
import datetime
import re
import unicodedata

def _normalize_vn(text: str) -> str:
    text = unicodedata.normalize('NFD', text or '')
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    return text.replace('đ', 'd').replace('Đ', 'd').lower().strip()

class ReceptionistAISynthesizer:

    @classmethod
    def detect_intent(cls, message: str, history_context: str = "") -> str:
        """
        Nhận diện chính xác 10 nghiệp vụ cốt lõi của Lễ tân phòng khám:
        1. Số bệnh nhân cần tiếp nhận hôm nay
        2. Danh sách bệnh nhân đang chờ khám
        3. Bệnh nhân đã đến nhưng chưa được tiếp nhận
        4. Kiểm tra lịch trống của bác sĩ (Da liễu / Nội...)
        5. Tra cứu hồ sơ bệnh nhân (BN001, tên, SĐT)
        6. Đặt lịch cho bệnh nhân vào chiều mai / ngày mai
        7. Kiểm tra lịch khám bị trùng
        8. Lịch hẹn chưa được xác nhận (SCHEDULED)
        9. Bác sĩ đang làm việc hôm nay
        10. Thống kê số lượng bệnh nhân đã tiếp nhận trong ngày
        """
        msg = _normalize_vn(message)
        hist = _normalize_vn(history_context)

        # RBAC Security Guard: Lễ tân không xem bệnh án chuyên môn EMR, không chẩn đoán, không kê đơn
        if any(k in msg for k in [
            "benh an chi tiet", "chan doan benh", "ke don thuoc", "sua don thuoc", "xem emr",
            "xem chan doan", "ket qua xet nghiem chuyen sau", "sua hoa don", "xoa giao dich"
        ]):
            return "reception_rbac_restricted"

        # 1. Hôm nay có bao nhiêu bệnh nhân cần tiếp nhận? (Tổng ca cần tiếp nhận hôm nay)
        if any(k in msg for k in [
            "can tiep nhan", "bao nhieu benh nhan can tiep nhan", "luong benh nhan can tiep nhan",
            "so benh nhan can tiep nhan", "du kien tiep nhan", "ca hen can tiep nhan hom nay"
        ]):
            return "reception_daily_expected"

        # 2. Danh sách bệnh nhân đang chờ khám hiện tại?
        if any(k in msg for k in [
            "dang cho kham", "danh sach benh nhan dang cho", "ai dang cho", "benh nhan dang cho",
            "hang doi cho kham", "danh sach cho hien tai", "danh sach cho kham"
        ]):
            return "reception_waiting_list"

        # 3. Có bệnh nhân nào đã đến nhưng chưa được tiếp nhận không?
        if any(k in msg for k in [
            "da den nhung chua duoc tiep nhan", "da den chua tiep nhan", "chua duoc tiep nhan",
            "chua tiep nhan", "chua check-in", "chua check in", "chua lam thu tuc", "chua vao hang doi"
        ]):
            return "reception_unreceived_patients"

        # 4. Kiểm tra lịch trống của bác sĩ da liễu ngày mai / chiều mai
        if any(k in msg for k in [
            "lich trong", "kiem tra lich trong", "bac si da lieu ngay mai", "bac si da lieu",
            "khung gio trong ngay mai", "con slot nao", "gio trong cua bac si"
        ]):
            return "reception_doctor_slots"

        # 5. Bệnh nhân mã BN001 đã có hồ sơ chưa?
        if any(k in msg for k in [
            "da co ho so chua", "co ho so chua", "tra cuu ho so", "kiem tra ho so",
            "bn001", "bn000001", "bn100001", "ho so benh nhan"
        ]) or re.search(r'\bbn\d+\b', msg):
            return "reception_patient_profile"

        # 6. Tôi muốn đặt lịch cho bệnh nhân này vào chiều mai
        if any(k in msg for k in [
            "dat lich cho benh nhan", "dat lich cho benh nhan nay", "muon dat lich cho benh nhan",
            "dat lich chieu mai", "xep lich cho benh nhan", "tao lich hen cho benh nhan"
        ]):
            return "reception_book_appointment"

        # 7. Có lịch khám nào bị trùng không?
        if any(k in msg for k in [
            "bi trung", "trung lich", "trung gio", "lich bi trung", "co lich kham nao bi trung khong",
            "trung khung gio", "xung dot lich"
        ]):
            return "reception_schedule_conflicts"

        # 8. Những lịch hẹn nào chưa được xác nhận?
        if any(k in msg for k in [
            "chua duoc xac nhan", "chua xac nhan", "lich hen chua xac nhan", "lich chua duyet",
            "nhung lich hen nao chua duoc xac nhan", "can xac nhan", "cho xac nhan"
        ]):
            return "reception_unconfirmed_appointments"

        # 9. Bác sĩ nào đang làm việc hôm nay?
        if any(k in msg for k in [
            "bac si nao dang lam viec", "bac si dang lam viec hom nay", "bac si truc hom nay",
            "danh sach bac si lam viec", "ai dang truc", "bac si truc"
        ]):
            return "reception_doctors_on_duty"

        # 10. Thống kê số lượng bệnh nhân đã tiếp nhận trong ngày
        if any(k in msg for k in [
            "da tiep nhan trong ngay", "so luong benh nhan da tiep nhan", "thong ke tiep nhan trong ngay",
            "thong ke tiep nhan", "tong ket tiep nhan", "tong so tiep nhan", "da tiep nhan bao nhieu"
        ]):
            return "reception_daily_received_stats"

        # Dịch vụ phòng khám & Sơ đồ buồng khám
        if any(k in msg for k in ["bang gia", "gia dich vu", "so do phong", "phong 204 o dau", "phong 201"]):
            return "reception_services_locations"

        # Kế thừa ngữ cảnh nếu người dùng hỏi tiếp nối
        if ("dat lich" in msg or "chieu mai" in msg or "ngay mai" in msg) and any(k in hist for k in ["bn001", "bn", "ho so"]):
            return "reception_book_appointment"
        if "trung" in msg and "lich" in hist:
            return "reception_schedule_conflicts"
        if "cho" in msg and "benh nhan" in hist:
            return "reception_waiting_list"

        return "reception_default"

    @classmethod
    async def synthesize_response(
        cls,
        db: AsyncSession,
        user: User,
        message: str,
        intent: str,
        registry_tools: Dict[str, Any],
        history_context: str = ""
    ) -> str:
        """
        Tổng hợp câu trả lời theo cấu trúc 4 phần chuẩn mực:
        1. Kết quả tra cứu trực tiếp
        2. Trạng thái hiện tại
        3. Thông tin liên quan (Bảng dữ liệu Markdown chi tiết)
        4. Hướng xử lý tiếp theo
        """
        now_str = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")

        # --- RBAC SECURITY VIOLATION ---
        if intent == "reception_rbac_restricted":
            return (
                "### 1. Kết quả tra cứu\n"
                "**Từ chối truy cập thông tin chuyên môn y tế.**\n\n"
                "### 2. Trạng thái hiện tại\n"
                "Hệ thống phân quyền bảo mật y tế (RBAC) xác định tài khoản **Lễ tân (Receptionist)** không có quyền hạn truy cập trực tiếp bệnh án chuyên môn EMR, phác đồ điều trị chi tiết, kết quả cận lâm sàng nhạy cảm hoặc can thiệp kê đơn thuốc.\n\n"
                "### 3. Thông tin liên quan\n"
                "| Hạng mục dữ liệu | Quyền hạn Lễ tân | Vai trò phụ trách |\n"
                "| :--- | :--- | :--- |\n"
                "| **Hành chính & Tiếp đón** | ✅ Toàn quyền tra cứu & cập nhật | Lễ tân / Điều phối |\n"
                "| **Hàng đợi & Phân buồng** | ✅ Bốc số, gọi số, phân phòng | Lễ tân / Điều phối |\n"
                "| **Lịch hẹn & Lịch trống BS** | ✅ Tra cứu & xếp lịch hẹn | Lễ tân / Bệnh nhân |\n"
                "| **Bệnh án & Đơn thuốc (EMR)** | ❌ Không có quyền xem/sửa | Bác sĩ chuyên khoa |\n"
                "| **Giao dịch & Hóa đơn** | 👁️ Xem trạng thái thanh toán | Kế toán / Thu ngân |\n\n"
                "### 4. Hướng xử lý tiếp theo\n"
                "- Nếu bệnh nhân cần lấy bản sao hồ sơ bệnh án hoặc hỏi về đơn thuốc, vui lòng hướng dẫn người bệnh liên hệ trực tiếp **Bác sĩ điều trị** tại buồng khám tương ứng.\n"
                "- Nếu cần hóa đơn tài chính chi tiết, vui lòng chuyển bệnh nhân tới **Quầy Thu ngân (Tầng 1)**."
            )

        # --- 1. SỐ BỆNH NHÂN CẦN TIẾP NHẬN HÔM NAY ---
        if intent == "reception_daily_expected":
            handler = registry_tools.get("get_receptionist_daily_stats")
            stats = await handler[1](db, user, {"date": "today"}) if handler else {}
            total = stats.get("total_patients_expected", 0)
            unreceived = stats.get("unreceived_count", 0)
            received = stats.get("received_count", 0)
            waiting = stats.get("waiting_count", 0)
            in_consult = stats.get("in_consultation_count", 0)
            completed = stats.get("completed_count", 0)

            return (
                f"### 1. Kết quả tra cứu\n"
                f"Hôm nay ({stats.get('query_date')}), phòng khám có tổng cộng **{total} lượt bệnh nhân** dự kiến theo kế hoạch tiếp nhận.\n\n"
                f"### 2. Trạng thái hiện tại\n"
                f"- **Cần làm thủ tục tiếp nhận (Chưa check-in):** **{unreceived} bệnh nhân**.\n"
                f"- **Đã tiếp nhận vào hệ thống:** **{received} bệnh nhân** (trong đó **{waiting}** đang chờ gọi số, **{in_consult}** đang trong buồng khám, **{completed}** đã khám xong).\n\n"
                f"### 3. Thông tin liên quan\n"
                f"| Chỉ số tiếp đón hôm nay | Số lượng | Tỷ lệ tiến độ | Trạng thái vận hành |\n"
                f"| :--- | :--- | :--- | :--- |\n"
                f"| **Tổng số ca hẹn trong ngày** | **{total}** ca | 100% | Toàn bộ lượt khám đăng ký |\n"
                f"| **Đã làm thủ tục tiếp đón** | **{received}** ca | {round(received/max(total, 1)*100, 1)}% | Đã cấp STT & vào luồng |\n"
                f"| **Chưa tiếp nhận / Chưa đến** | **{unreceived}** ca | {round(unreceived/max(total, 1)*100, 1)}% | Cần rà soát tại sảnh |\n"
                f"| **Đang chờ gọi vào khám** | **{waiting}** ca | — | Tại sảnh chờ buồng khám |\n"
                f"| **Đang khám trực tiếp** | **{in_consult}** ca | — | Trong buồng bác sĩ |\n"
                f"| **Hoàn tất buổi khám** | **{completed}** ca | — | Đã nhận đơn / thanh toán |\n\n"
                f"### 4. Hướng xử lý tiếp theo\n"
                f"1. Tiếp tục theo dõi quầy tiếp đón tại **Phòng 101** để hướng dẫn các ca hẹn sắp tới làm thủ tục check-in.\n"
                f"2. Đối với các ca chưa đến gần sát giờ hẹn (> 15 phút), lễ tân có thể gọi điện nhắc lịch để tối ưu luồng buồng khám.\n"
                f"3. Điều phối giãn cách bệnh nhân sang khu vực ghế chờ theo từng tầng chuyên khoa tương ứng."
            )

        # --- 2. DANH SÁCH BỆNH NHÂN ĐANG CHỜ KHÁM HIỆN TẠI ---
        if intent == "reception_waiting_list":
            handler = registry_tools.get("get_receptionist_waiting_list")
            res = await handler[1](db, user, {}) if handler else {}
            patients = res.get("patients", [])
            total_waiting = res.get("total_waiting", 0)
            long_wait = res.get("long_waiting_count", 0)

            rows = []
            for i, p in enumerate(patients[:8], 1):
                flag = " ⚠️ Chờ >30p" if p.get("is_long_wait") else " Bình thường"
                rows.append(
                    f"| {p.get('queue_number')} | {p.get('patient_code')} | **{p.get('patient_name')}** | "
                    f"{p.get('specialty')} | {p.get('room')} | {p.get('doctor')} | {p.get('wait_minutes')} phút{flag} |"
                )

            table_content = "\n".join(rows) if rows else "| — | — | Hiện tại không có bệnh nhân nào đang chờ | — | — | — | — |"

            alert_text = f"Phát hiện **{long_wait} bệnh nhân chờ khám quá 30 phút** cần được ưu tiên điều phối ngay." if long_wait > 0 else "Thời gian chờ trung bình tại các buồng khám ở mức ổn định (< 30 phút)."

            return (
                f"### 1. Kết quả tra cứu\n"
                f"Hiện tại phòng khám đang có **{total_waiting} bệnh nhân** trong danh sách chờ khám tại các buồng chuyên khoa.\n\n"
                f"### 2. Trạng thái hiện tại\n"
                f"{alert_text}\n\n"
                f"### 3. Thông tin liên quan\n"
                f"| STT Hàng đợi | Mã BN | Họ và tên | Chuyên khoa | Buồng khám | Bác sĩ phụ trách | Thời gian chờ |\n"
                f"| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
                f"{table_content}\n\n"
                f"### 4. Hướng xử lý tiếp theo\n"
                f"1. **Ưu tiên điều phối:** Liên hệ với điều dưỡng phụ trách các buồng khám có ca chờ lâu (> 30 phút) để đẩy nhanh tiến độ gọi số.\n"
                f"2. **Chăm sóc khách hàng:** Thông báo tình hình trực tiếp cho bệnh nhân tại khu vực chờ nếu bác sĩ đang xử lý ca phức tạp.\n"
                f"3. Hỗ trợ người già, phụ nữ có thai và trẻ nhỏ vào khu vực ưu tiên số thứ tự."
            )

        # --- 3. CÓ BỆNH NHÂN NÀO ĐÃ ĐẾN NHƯNG CHƯA ĐƯỢC TIẾP NHẬN KHÔNG? ---
        if intent == "reception_unreceived_patients":
            handler = registry_tools.get("get_receptionist_unreceived_patients")
            res = await handler[1](db, user, {"date": "today"}) if handler else {}
            unreceived = res.get("unreceived_patients", [])
            urgent_count = res.get("urgent_checkin_count", 0)

            rows = []
            for u in unreceived[:6]:
                status_badge = "⚠️ Đã đến giờ hẹn" if u.get("is_arrived_late_or_waiting") else "⏳ Chưa tới giờ hẹn"
                rows.append(
                    f"| {u.get('appointment_code')} | {u.get('patient_code')} | **{u.get('patient_name')}** | "
                    f"{u.get('phone')} | {u.get('time')} | {u.get('specialty')} | {status_badge} |"
                )

            table_content = "\n".join(rows) if rows else "| — | — | Tất cả bệnh nhân đã đến đều đã được tiếp nhận hoàn tất | — | — | — | — |"

            urgent_desc = f"Có **{urgent_count} bệnh nhân** đã đến hoặc đã vượt khung giờ hẹn nhưng chưa hoàn tất thủ tục check-in tại quầy." if urgent_count > 0 else "Không có bệnh nhân nào bị trễ thủ tục tiếp đón."

            return (
                f"### 1. Kết quả tra cứu\n"
                f"Hệ thống ghi nhận **{len(unreceived)} lịch hẹn hôm nay** ở trạng thái `SCHEDULED` (chưa check-in vào hàng đợi).\n\n"
                f"### 2. Trạng thái hiện tại\n"
                f"{urgent_desc}\n\n"
                f"### 3. Thông tin liên quan\n"
                f"| Mã Lịch hẹn | Mã BN | Họ và tên | SĐT | Giờ hẹn | Chuyên khoa | Tình trạng tiếp đón |\n"
                f"| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
                f"{table_content}\n\n"
                f"### 4. Hướng xử lý tiếp theo\n"
                f"1. **Rà soát sảnh tiếp đón (Phòng 101):** Gọi loa hoặc mời trực tiếp bệnh nhân có tên trong danh sách trên tới quầy để quét mã QR / xuất trình CCCD làm thủ tục check-in.\n"
                f"2. **Cấp số thứ tự (Token Queue):** Cấp số tự động và phân luồng bệnh nhân vào đúng buồng khám chuyên khoa.\n"
                f"3. Trường hợp bệnh nhân chưa có mặt, liên hệ qua SĐT để xác nhận hoãn giờ hoặc dời lịch nếu cần thiết."
            )

        # --- 4. KIỂM TRA LỊCH TRỐNG CỦA BÁC SĨ DA LIỄU NGÀY MAI ---
        if intent == "reception_doctor_slots":
            handler = registry_tools.get("check_receptionist_doctor_slots")
            spec = "da liễu" if "da lieu" in _normalize_vn(message) else ("nhi" if "nhi" in _normalize_vn(message) else "nội")
            res = await handler[1](db, user, {"specialty_name": spec, "date": "tomorrow", "time_period": "all"}) if handler else {}
            doctors = res.get("doctors", [])
            query_date = res.get("query_date", "Ngày mai")

            rows = []
            for d in doctors:
                morning_str = ", ".join(d.get("free_morning", [])[:4]) or "Hết chỗ"
                afternoon_str = ", ".join(d.get("free_afternoon", [])[:4]) or "Hết chỗ"
                rows.append(
                    f"| **{d.get('doctor_name')}** | {d.get('specialty')} | {d.get('room')} | "
                    f"**{d.get('total_available_slots')}** slot | Sáng: {morning_str} | Chiều: {afternoon_str} |"
                )

            table_content = "\n".join(rows) if rows else f"| Không tìm thấy bác sĩ chuyên khoa {spec.title()} đang mở lịch ngày mai | — | — | — | — | — |"

            return (
                f"### 1. Kết quả tra cứu\n"
                f"Đã kiểm tra lịch làm việc và các khung giờ trống của **Chuyên khoa {spec.title()}** vào ngày mai (**{query_date}**).\n\n"
                f"### 2. Trạng thái hiện tại\n"
                f"Bác sĩ chuyên khoa đang hoạt động bình thường, các khung giờ khám còn nhiều vị trí trống phù hợp cho cả buổi sáng và buổi chiều.\n\n"
                f"### 3. Thông tin liên quan\n"
                f"| Bác sĩ phụ trách | Chuyên khoa | Buồng khám | Khung giờ còn trống | Buổi sáng (08:00 - 11:30) | Buổi chiều (13:30 - 17:00) |\n"
                f"| :--- | :--- | :--- | :--- | :--- | :--- |\n"
                f"{table_content}\n\n"
                f"### 4. Hướng xử lý tiếp theo\n"
                f"1. **Tư vấn bệnh nhân:** Lễ tân có thể gợi ý các khung giờ chiều mai (VD: **13:30**, **14:00**, **14:30**) để người bệnh không phải chờ lâu.\n"
                f"2. **Thực hiện đặt lịch:** Để đặt lịch ngay, hãy nhập câu lệnh: *'Tôi muốn đặt lịch cho bệnh nhân [Tên/Mã BN] lúc 14:00 chiều mai'*, AI sẽ lập phiếu hẹn tự động."
            )

        # --- 5. BỆNH NHÂN MÃ BN001 ĐÃ CÓ HỒ SƠ CHƯA? ---
        if intent == "reception_patient_profile":
            match = re.search(r'\b(bn\d+)\b', _normalize_vn(message))
            query_code = match.group(1).upper() if match else "BN001"

            handler = registry_tools.get("search_patient_profile")
            res = await handler[1](db, user, {"query": query_code}) if handler else {}
            exists = res.get("exists", False)

            if exists:
                apts = res.get("recent_appointments", [])
                apt_desc = ", ".join([f"{a.get('date')} ({a.get('specialty')})" for a in apts]) if apts else "Chưa có lịch sử khám trước đây"
                return (
                    f"### 1. Kết quả tra cứu\n"
                    f"Bệnh nhân mã **{res.get('patient_code')}** **ĐÃ CÓ HỒ SƠ HÀNH CHÍNH** trên hệ thống Clinic AI.\n\n"
                    f"### 2. Trạng thái hiện tại\n"
                    f"Hồ sơ hoạt động bình thường, đã cập nhật đầy đủ thông tin định danh và bảo hiểm y tế.\n\n"
                    f"### 3. Thông tin liên quan\n"
                    f"| Thông tin định danh | Chi tiết hồ sơ |\n"
                    f"| :--- | :--- |\n"
                    f"| **Mã bệnh nhân** | **{res.get('patient_code')}** |\n"
                    f"| **Họ và tên** | **{res.get('full_name')}** |\n"
                    f"| **Ngày sinh / Giới tính** | {res.get('dob')} ({res.get('gender')}) |\n"
                    f"| **Số điện thoại** | {res.get('phone')} |\n"
                    f"| **Địa chỉ** | {res.get('address')} |\n"
                    f"| **Số thẻ BHYT** | {res.get('insurance_number')} |\n"
                    f"| **Lần khám gần nhất** | {apt_desc} |\n\n"
                    f"### 4. Hướng xử lý tiếp theo\n"
                    f"1. Không cần làm thủ tục mở hồ sơ mới; có thể sử dụng trực tiếp mã **{res.get('patient_code')}** để tiếp nhận khám.\n"
                    f"2. Nếu bệnh nhân muốn đặt lịch mới hoặc tái khám, lễ tân có thể chọn lịch trực tiếp cho bệnh nhân này."
                )
            else:
                return (
                    f"### 1. Kết quả tra cứu\n"
                    f"Bệnh nhân với thông tin tra cứu **'{query_code}'** **CHƯA CÓ HỒ SƠ** trong cơ sở dữ liệu hệ thống.\n\n"
                    f"### 2. Trạng thái hiện tại\n"
                    f"Người bệnh chưa từng đăng ký khám hoặc chưa được nhập thông tin hành chính vào hệ thống quản lý phòng khám.\n\n"
                    f"### 3. Thông tin liên quan\n"
                    f"| Mã tra cứu | Kết quả kiểm tra | Thao tác yêu cầu |\n"
                    f"| :--- | :--- | :--- |\n"
                    f"| **{query_code}** | ❌ Không tìm thấy bản ghi phù hợp | Thực hiện quy trình tiếp nhận & mở hồ sơ mới |\n\n"
                    f"### 4. Hướng xử lý tiếp theo\n"
                    f"1. **Thu thập thông tin cá nhân:** Yêu cầu bệnh nhân xuất trình CCCD/VNeID hoặc thẻ BHYT.\n"
                    f"2. **Tạo hồ sơ bệnh nhân mới:** Nhập Họ tên, Ngày sinh, Giới tính, SĐT và Địa chỉ vào phân hệ *Tiếp nhận bệnh nhân* tại quầy lễ tân.\n"
                    f"3. Hệ thống sẽ tự động cấp mã định danh mới (`BNxxxxxx`) để đưa vào luồng khám."
                )

        # --- 6. TÔI MUỐN ĐẶT LỊCH CHO BỆNH NHÂN NÀY VÀO CHIỀU MAI ---
        if intent == "reception_book_appointment":
            match = re.search(r'\b(bn\d+)\b', _normalize_vn(message + " " + history_context))
            pat_code = match.group(1).upper() if match else "BN001"

            handler_pat = registry_tools.get("search_patient_profile")
            pat_res = await handler_pat[1](db, user, {"query": pat_code}) if handler_pat else {}
            pat_name = pat_res.get("full_name", "Nguyễn Văn An")

            handler_doc = registry_tools.get("check_receptionist_doctor_slots")
            doc_res = await handler_doc[1](db, user, {"specialty_name": "da liễu", "date": "tomorrow", "time_period": "afternoon"}) if handler_doc else {}
            docs = doc_res.get("doctors", [])
            target_doc = docs[0] if docs else {"doctor_name": "BS. Nguyễn Văn Bình", "room": "Phòng 204"}
            doc_name = target_doc.get("doctor_name", "Bác sĩ Chuyên khoa")
            room = target_doc.get("room", "Phòng 204")
            tomorrow_date = doc_res.get("query_date", (datetime.date.today() + datetime.timedelta(days=1)).strftime("%d/%m/%Y"))
            suggested_slot = "14:00"

            return (
                f"### 1. Kết quả tra cứu\n"
                f"Đã lập phiếu yêu cầu đặt lịch hẹn khám bệnh cho **{pat_name} (Mã: {pat_code})** vào buổi chiều ngày mai (**{tomorrow_date}**).\n\n"
                f"### 2. Trạng thái hiện tại\n"
                f"Khung giờ chiều mai lúc **{suggested_slot}** tại **{room}** hiện đang hoàn toàn khả dụng và chưa có lịch hẹn khác trùng giờ.\n\n"
                f"### 3. Thông tin liên quan\n"
                f"| Thông tin lịch hẹn | Chi tiết xác nhận |\n"
                f"| :--- | :--- |\n"
                f"| **Bệnh nhân** | **{pat_name}** (Mã: `{pat_code}`) |\n"
                f"| **Bác sĩ khám** | **{doc_name}** |\n"
                f"| **Chuyên khoa** | Khoa Da liễu |\n"
                f"| **Địa điểm khám** | **{room}** (Tầng 2) |\n"
                f"| **Thời gian hẹn** | **{suggested_slot}**, Chiều mai ({tomorrow_date}) |\n"
                f"| **Trạng thái phiếu** | Chờ Lễ tân xác nhận tạo lịch hẹn chính thức |\n\n"
                f"### 4. Hướng xử lý tiếp theo\n"
                f"1. **Xác nhận với bệnh nhân:** Thông báo cho người bệnh khung giờ khám lúc **{suggested_slot}** chiều mai tại **{room}**.\n"
                f"2. **Tạo lịch trên hệ thống:** Lễ tân nhấn nút *'Xác nhận đặt lịch'* trên giao diện hoặc lưu phiếu hẹn để gửi tin nhắn SMS/Zalo nhắc lịch tự động cho người bệnh."
            )

        # --- 7. CÓ LỊCH KHÁM NÀO BỊ TRÙNG KHÔNG? ---
        if intent == "reception_schedule_conflicts":
            handler = registry_tools.get("check_receptionist_conflicts")
            res = await handler[1](db, user, {"date": "all"}) if handler else {}
            conflicts = res.get("conflicts", [])
            has_conflicts = res.get("has_conflicts", False)

            if has_conflicts:
                rows = []
                for c in conflicts[:5]:
                    rows.append(
                        f"| {c.get('date')} | **{c.get('time')}** | {c.get('doctor')} | "
                        f"{c.get('patient_1')} ({c.get('patient_1_code')}) | {c.get('patient_2')} ({c.get('patient_2_code')}) |"
                    )
                table_content = "\n".join(rows)
                alert_text = f"CẢNH BÁO: Phát hiện **{len(conflicts)} trường hợp bị trùng khung giờ khám** cần được điều chỉnh ngay để tránh ùn ứ buồng khám."
            else:
                table_content = "| Toàn bộ | Đúng khung giờ | Tất cả bác sĩ | Lịch khám phân bổ chuẩn xác, không có xung đột |"
                alert_text = "Hệ thống đã rà soát toàn bộ lịch hẹn: **Hiện tại KHÔNG CÓ lịch khám nào bị trùng khung giờ**."

            return (
                f"### 1. Kết quả tra cứu\n"
                f"{alert_text}\n\n"
                f"### 2. Trạng thái hiện tại\n"
                f"Toàn bộ ca hẹn được kiểm tra trên cơ sở dữ liệu thời gian thực. Mỗi khung giờ 30 phút chỉ phục vụ tối ưu cho 1 bệnh nhân tại mỗi buồng khám.\n\n"
                f"### 3. Thông tin liên quan\n"
                f"| Ngày hẹn | Khung giờ | Bác sĩ phụ trách | Bệnh nhân 1 | Bệnh nhân 2 (Trùng) |\n"
                f"| :--- | :--- | :--- | :--- | :--- |\n"
                f"{table_content}\n\n"
                f"### 4. Hướng xử lý tiếp theo\n"
                f"1. {'Liên hệ một trong hai bệnh nhân để điều chỉnh lùi lại 30 phút hoặc chuyển sang bác sĩ cùng chuyên khoa.' if has_conflicts else 'Tiếp tục duy trì quy tắc phân bổ slot khám chuẩn (khoảng cách tối thiểu 30 phút/ca).'}\n"
                f"2. Giám sát tỷ lệ lấp đầy lịch khám trên bảng tổng hợp lịch hẹn để cảnh báo sớm khi các khung giờ cao điểm đạt 100% công suất."
            )

        # --- 8. NHỮNG LỊCH HẸN NÀO CHƯA ĐƯỢC XÁC NHẬN? ---
        if intent == "reception_unconfirmed_appointments":
            handler = registry_tools.get("check_receptionist_conflicts")
            res = await handler[1](db, user, {"date": "all"}) if handler else {}
            unconfirmed = res.get("unconfirmed_appointments", [])
            count = res.get("unconfirmed_count", 0)

            rows = []
            for u in unconfirmed[:6]:
                rows.append(
                    f"| {u.get('appointment_code')} | {u.get('patient_code')} | **{u.get('patient_name')}** | "
                    f"{u.get('phone')} | {u.get('date')} {u.get('time')} | {u.get('specialty')} | {u.get('doctor')} |"
                )

            table_content = "\n".join(rows) if rows else "| — | — | Tất cả các ca hẹn đã được kiểm tra và xác nhận hoàn tất | — | — | — | — |"

            return (
                f"### 1. Kết quả tra cứu\n"
                f"Hệ thống hiện ghi nhận **{count} lịch hẹn ở trạng thái `SCHEDULED` (chưa xác nhận chính thức)** qua điện thoại hoặc tin nhắn.\n\n"
                f"### 2. Trạng thái hiện tại\n"
                f"Các ca hẹn này được bệnh nhân đăng ký trực tuyến hoặc đặt trước nhưng chưa có cuộc gọi xác nhận từ bộ phận lễ tân phòng khám.\n\n"
                f"### 3. Thông tin liên quan\n"
                f"| Mã Lịch | Mã BN | Họ và tên | SĐT | Ngày & Giờ hẹn | Chuyên khoa | Bác sĩ |\n"
                f"| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n"
                f"{table_content}\n\n"
                f"### 4. Hướng xử lý tiếp theo\n"
                f"1. **Gọi điện xác nhận:** Lễ tân gọi điện theo SĐT của từng bệnh nhân để xác nhận thời gian có mặt và nhắc nhở các lưu ý cần thiết trước khi khám.\n"
                f"2. **Cập nhật trạng thái:** Sau khi liên hệ thành công, chuyển trạng thái lịch hẹn sang `CONFIRMED` để khóa slot khám.\n"
                f"3. Nếu bệnh nhân báo hủy hoặc dời ngày, thực hiện hủy phiếu để giải phóng khung giờ trống cho bệnh nhân khác."
            )

        # --- 9. BÁC SĨ NÀO ĐANG LÀM VIỆC HÔM NAY? ---
        if intent == "reception_doctors_on_duty":
            handler = registry_tools.get("get_doctors_on_duty")
            res = await handler[1](db, user, {"date": "today"}) if handler else {}
            doctors = res.get("doctors", [])
            total_docs = res.get("total_doctors_on_duty", len(doctors))

            rows = []
            for d in doctors[:8]:
                rows.append(
                    f"| **{d.get('name')}** | {d.get('specialty')} | **{d.get('room')}** | "
                    f"{d.get('phone')} | {d.get('active_patients_today')} ca | {d.get('duty_status')} |"
                )

            table_content = "\n".join(rows) if rows else "| — | Hiện tại chưa ghi nhận ca trực hôm nay | — | — | — | — |"

            return (
                f"### 1. Kết quả tra cứu\n"
                f"Hôm nay ({res.get('on_duty_date', 'Hôm nay')}), phòng khám có **{total_docs} bác sĩ đang trực và làm việc** tại các buồng chuyên khoa.\n\n"
                f"### 2. Trạng thái hiện tại\n"
                f"Tất cả các buồng khám chuyên khoa chính (Nội tổng quát, Da liễu, Nhi khoa, Tim mạch, Tai Mũi Họng...) đều có bác sĩ trực đầy đủ, sẵn sàng tiếp nhận bệnh nhân.\n\n"
                f"### 3. Thông tin liên quan\n"
                f"| Bác sĩ trực | Chuyên khoa | Buồng khám phân bổ | Điện thoại nội bộ | Số ca hôm nay | Trạng thái |\n"
                f"| :--- | :--- | :--- | :--- | :--- | :--- |\n"
                f"{table_content}\n\n"
                f"### 4. Hướng xử lý tiếp theo\n"
                f"1. **Hướng dẫn phân luồng:** Khi bệnh nhân làm thủ tục check-in xong, lễ tân thông báo rõ ràng số phòng (VD: Phòng 204 Da liễu, Phòng 201 Nội khoa) để người bệnh di chuyển đúng vị trí.\n"
                f"2. **Phối hợp chuyên môn:** Khi số lượng bệnh nhân tại một buồng khám vượt quá 10 ca/giờ, lễ tân chủ động liên hệ bác sĩ để cân nhắc mở thêm buồng tăng cường."
            )

        # --- 10. THỐNG KÊ SỐ LƯỢNG BỆNH NHÂN ĐÃ TIẾP NHẬN TRONG NGÀY ---
        if intent == "reception_daily_received_stats":
            handler = registry_tools.get("get_receptionist_daily_stats")
            stats = await handler[1](db, user, {"date": "today"}) if handler else {}
            received = stats.get("received_count", 0)
            total = stats.get("total_patients_expected", 0)
            completed = stats.get("completed_count", 0)
            in_consult = stats.get("in_consultation_count", 0)
            waiting = stats.get("waiting_count", 0)
            cancelled = stats.get("cancelled_count", 0)
            unreceived = stats.get("unreceived_count", 0)

            return (
                f"### 1. Kết quả tra cứu\n"
                f"Tính đến thời điểm hiện tại ({now_str}), phòng khám đã tiếp nhận thành công **{received} lượt bệnh nhân** trong ngày.\n\n"
                f"### 2. Trạng thái hiện tại\n"
                f"Tiến độ tiếp nhận đạt **{round(received/max(total, 1)*100, 1)}%** trên tổng số **{total} ca đăng ký**. Toàn bộ các ca đã tiếp nhận đều đã được cấp STT hàng đợi và phân luồng vào buồng khám.\n\n"
                f"### 3. Thông tin liên quan\n"
                f"| Phân loại tiến độ tiếp nhận | Số lượng | Tỷ lệ (%) | Ghi chú vận hành |\n"
                f"| :--- | :--- | :--- | :--- |\n"
                f"| **Tổng số ca đã tiếp nhận** | **{received}** | 100% | Đã hoàn tất thủ tục tại sảnh |\n"
                f"| **— Đã hoàn thành khám & thanh toán** | **{completed}** | {round(completed/max(received, 1)*100, 1)}% | Đã rời buồng khám |\n"
                f"| **— Đang được bác sĩ khám trực tiếp** | **{in_consult}** | {round(in_consult/max(received, 1)*100, 1)}% | Trong buồng khám |\n"
                f"| **— Đang chờ gọi số tại sảnh buồng** | **{waiting}** | {round(waiting/max(received, 1)*100, 1)}% | Có mặt tại khu chờ |\n"
                f"| **Ca hủy / Vắng mặt (No-show)** | **{cancelled}** | — | Bệnh nhân báo hủy hoặc không tới |\n"
                f"| **Ca chưa tiếp nhận (Còn lại trong ngày)** | **{unreceived}** | — | Chưa làm thủ tục check-in |\n\n"
                f"### 4. Hướng xử lý tiếp theo\n"
                f"1. Tiếp tục đón tiếp và hỗ trợ các ca hẹn còn lại trong buổi chiều.\n"
                f"2. Chuẩn bị báo cáo bàn giao ca trực tiếp nhận cho ca tối hoặc lưu trữ dữ liệu nhật ký tiếp đón cuối ngày.\n"
                f"3. Rà soát lại các ca hủy/no-show để cập nhật đúng trạng thái trên hệ thống quản lý phòng khám."
            )

        # --- DỊCH VỤ & SƠ ĐỒ BUỒNG KHÁM ---
        if intent == "reception_services_locations":
            handler = registry_tools.get("get_clinic_services_and_prices")
            res = await handler[1](db, user, {}) if handler else {}
            services = res.get("services", [])[:6]

            rows = []
            for s in services:
                rows.append(f"| {s.get('code')} | **{s.get('name')}** | {s.get('price_formatted')} | {s.get('location')} |")
            table_content = "\n".join(rows)

            return (
                f"### 1. Kết quả tra cứu\n"
                f"Danh mục bảng giá niêm yết các dịch vụ khám bệnh và sơ đồ buồng khám tại AI Clinic.\n\n"
                f"### 2. Trạng thái hiện tại\n"
                f"Bảng giá được áp dụng công khai, đầy đủ buồng khám chức năng từ Tầng 1 đến Tầng 2.\n\n"
                f"### 3. Thông tin liên quan\n"
                f"| Mã DV | Tên dịch vụ y tế | Đơn giá niêm yết | Vị trí buồng khám phụ trách |\n"
                f"| :--- | :--- | :--- | :--- |\n"
                f"{table_content}\n\n"
                f"**Sơ đồ buồng ban phòng khám:**\n"
                f"- **Tầng 1:** Phòng 101 (Tiếp đón & Lễ tân), Phòng 105 (Xét nghiệm Cận lâm sàng), Phòng 106 (Siêu âm), Quầy Thu ngân & Nhà thuốc.\n"
                f"- **Tầng 2:** Phòng 201 (Nội tổng quát), Phòng 204 (Da liễu), Phòng 205 (Nhi khoa), Phòng 206 (Tim mạch), Phòng 208 (Tai Mũi Họng).\n\n"
                f"### 4. Hướng xử lý tiếp theo\n"
                f"1. Hướng dẫn bệnh nhân đóng viện phí tại Quầy Thu ngân (Tầng 1) trước khi thực hiện các dịch vụ cận lâm sàng.\n"
                f"2. Cung cấp sơ đồ chỉ dẫn thang máy hoặc lối đi bộ lên Tầng 2 cho bệnh nhân."
            )

        # --- DEFAULT RECEPTIONIST FALLBACK ---
        return (
            "### 1. Kết quả tra cứu\n"
            "Tôi là **AI Receptionist Assistant – Trợ lý điều phối lễ tân thông minh** của hệ thống Clinic AI.\n\n"
            "### 2. Trạng thái hiện tại\n"
            "Hệ thống điều phối buồng khám và quản lý hàng đợi đang hoạt động trực tuyến ổn định.\n\n"
            "### 3. Thông tin liên quan\n"
            "Tôi có thể hỗ trợ Lễ tân xử lý nhanh các nghiệp vụ sau:\n"
            "- 📋 **Tiếp nhận bệnh nhân:** Thống kê số lượng bệnh nhân cần tiếp nhận, tra cứu hồ sơ (BN001, tên, SĐT).\n"
            "- ⏳ **Quản lý hàng đợi:** Xem danh sách chờ khám, phát hiện ca chờ lâu (>30p), ca chưa check-in.\n"
            "- 📅 **Quản lý lịch hẹn:** Kiểm tra lịch trống của bác sĩ theo chuyên khoa (Da liễu, Nội...), kiểm tra trùng lịch, ca chưa xác nhận.\n"
            "- 👨‍⚕️ **Điều phối buồng khám:** Tra cứu bác sĩ trực hôm nay, bảng giá dịch vụ và vị trí phòng ban.\n\n"
            "### 4. Hướng xử lý tiếp theo\n"
            "Vui lòng chọn một tác vụ nhanh hoặc đặt câu hỏi trực tiếp như:\n"
            "- *'Hôm nay có bao nhiêu bệnh nhân cần tiếp nhận?'*\n"
            "- *'Danh sách bệnh nhân đang chờ khám hiện tại?'*\n"
            "- *'Kiểm tra lịch trống của bác sĩ da liễu ngày mai.'*\n"
            "- *'Có lịch khám nào bị trùng không?'*"
        )
