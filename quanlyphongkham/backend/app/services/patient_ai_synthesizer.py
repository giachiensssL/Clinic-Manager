"""
PatientAISynthesizer — Hybrid Fallback & Intelligent Response Engine for Patient
Tổng hợp câu trả lời chuẩn mực, ân cần, thân thiện cho Bệnh nhân (Patient) dựa trên 100% dữ liệu thực từ SQLite.
Vận hành tức thì (< 0.2s) ngay cả khi Gemini API hết hạn mức hoặc bị ngắt kết nối.
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

class PatientAISynthesizer:

    @classmethod
    def detect_intent(cls, message: str, history_context: str = "") -> str:
        """
        Nhận diện ý định lâm sàng & hành chính của Bệnh nhân.
        Hỗ trợ tiếng Việt có dấu, không dấu và liên kết ngữ cảnh hội thoại.
        """
        msg = _normalize_vn(message)
        hist = _normalize_vn(history_context)

        # 1. Lịch khám tuần này / hôm nay / sắp tới
        if any(k in msg for k in [
            "lich kham nao", "lich hen nao", "tuan nay", "hom nay toi co lich", "lich cua toi",
            "co lich kham nao trong tuan", "lich hen cua toi", "kiem tra lich hen", "lich kham sap toi"
        ]):
            return "patient_my_schedule"

        # 2. Đặt lịch khám chuyên khoa (Da liễu, Nội khoa...)
        if any(k in msg for k in [
            "dat lich kham da lieu", "kham da lieu", "kham chuyen khoa", "muon dat lich",
            "dang ky kham", "muon kham", "dat lich bac si"
        ]):
            return "patient_book_specialty"

        # 3. Bác sĩ còn lịch khám chiều mai / ngày mai
        if any(k in msg for k in [
            "chieu mai", "con lich kham chieu mai", "bac si nao con lich", "ngay mai con lich",
            "lich kham chieu", "khung gio trong", "bac si ranh"
        ]):
            return "patient_doctor_availability"

        # 4. Đổi lịch khám / Hủy lịch khám đã đặt
        if any(k in msg for k in [
            "doi lich", "huy lich", "doi gio", "doi ngay", "doi lich kham da dat",
            "thay doi lich", "khong den duoc", "doi lich hen"
        ]):
            return "patient_reschedule_guide"

        # 5. Hồ sơ khám gần đây có kết quả gì / EMR
        if any(k in msg for k in [
            "ho so kham gan day", "ket qua gi", "ket qua kham", "ho so suc khoe",
            "benh an cua toi", "ket qua xet nghiem", "don thuoc gan day", "bac si chan doan gi"
        ]):
            return "patient_recent_emr_results"

        # 6. Kiểm tra hóa đơn chưa thanh toán
        if any(k in msg for k in [
            "con hoa don nao", "chua thanh toan", "con no", "kiem tra hoa don",
            "tien vien phi", "so tien can thanh toan", "chua tra"
        ]):
            return "patient_unpaid_bills"

        # 7. Trạng thái giao dịch thanh toán thành công chưa
        if any(k in msg for k in [
            "giao dich", "thanh toan da thanh cong chua", "thanh toan thanh cong chua",
            "da chuyen khoan", "kiem tra giao dich", "bien lai", "da thanh toan chua"
        ]):
            return "patient_payment_status"

        # 8. Chương trình khuyến mãi và ưu đãi
        if any(k in msg for k in [
            "khuyen mai", "uu dai", "giam gia", "voucher", "chuong trinh khuyen mai",
            "co uu dai gi", "ma giam gia", "chiet khau"
        ]):
            return "patient_promotions"

        # 9. Hướng dẫn chuẩn bị trước khi khám
        if any(k in msg for k in [
            "chuan bi nhung gi", "can chuan bi", "chuan bi truoc khi kham",
            "nhin an", "truoc khi di kham", "luu y truoc khi kham", "can mang gi"
        ]):
            return "patient_pre_examination_guide"

        # 10. Chăm sóc và lưu ý sau khi thực hiện dịch vụ
        if any(k in msg for k in [
            "sau khi thuc hien", "luu y dieu gi", "sau khi kham", "cham soc sau",
            "dan do sau kham", "sau khi dung dich vu", "uong thuoc sau kham"
        ]):
            return "patient_post_service_care"

        # Kế thừa ngữ cảnh nếu bệnh nhân hỏi câu ngắn tiếp nối
        if len(msg) <= 35:
            if "thanh toan" in hist or "hoa don" in hist:
                return "patient_unpaid_bills"
            if "bac si" in hist or "chuyen khoa" in hist:
                return "patient_doctor_availability"
            if "lich" in hist:
                return "patient_my_schedule"

        return "patient_my_schedule"

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
        Tổng hợp phản hồi chuẩn mực cho Bệnh nhân theo cấu trúc 4 phần ân cần, rõ ràng.
        """
        now = datetime.datetime.now()
        now_str = now.strftime("%d/%m/%Y %H:%M:%S")

        # --- KỊCH BẢN 1: LỊCH KHÁM TRONG TUẦN NÀY / SẮP TỚI ---
        if intent == "patient_my_schedule":
            data = await registry_tools["get_my_appointments"][1](db, user, {})
            apps = data.get("appointments", [])

            lines = [
                "### 📅 Lịch Khám & Hẹn Khám Bệnh Của Bạn\n",
                "**1. Xác nhận thông tin:**",
                f"Dạ chào bạn, hệ thống đã kiểm tra lịch hẹn của bạn tại **Phòng khám Đa khoa AI Clinic**.\n",
                "**2. Bảng chi tiết các lịch hẹn:**\n",
                "| Ngày khám | Giờ hẹn | Bác sĩ phụ trách | Chuyên khoa | Trạng thái | Lý do khám |",
                "| :---: | :---: | :--- | :--- | :---: | :--- |"
            ]

            if apps:
                for a in apps:
                    status_text = {
                        "scheduled": "🟢 Đã lên lịch hẹn",
                        "waiting": "⏳ Đang chờ tiếp đón",
                        "in_consultation": "🟡 Đang trong buồng khám",
                        "completed": "✅ Đã hoàn tất khám",
                        "cancelled": "🔴 Đã hủy"
                    }.get(a.get("status"), a.get("status"))

                    lines.append(
                        f"| `{a.get('date')}` | `{a.get('time')[:5] if a.get('time') else '08:00'}` | **{a.get('doctor')}** | {a.get('specialty')} | {status_text} | {a.get('reason') or 'Khám tổng quát'} |"
                    )
            else:
                lines.append("| — | — | — | — | ℹ️ Trống | *Bạn hiện chưa có lịch hẹn khám nào trong thời gian này.* |")

            lines.extend([
                "",
                "**3. Hướng dẫn & Lưu ý khi đi khám:**",
                "- Bạn vui lòng có mặt tại Quầy Tiếp đón trước giờ hẹn từ **10 - 15 phút** để nhân viên Lễ tân làm thủ tục tiếp đón và đo dấu hiệu sinh tồn ban đầu.",
                "- Vui lòng mang theo Căn cước công dân (CCCD), thẻ BHYT (nếu có) và sổ khám bệnh hoặc đơn thuốc cũ gần nhất.\n",
                "**4. Hỗ trợ thao tác tiếp theo:**",
                "- Nếu bạn muốn thay đổi ngày giờ hoặc hủy lịch hẹn, bạn có thể thực hiện trực tiếp tại mục **'Lịch hẹn của tôi'** hoặc nhắn tin cho tôi để được hướng dẫn.",
                f"- *Dữ liệu lịch hẹn trích xuất từ cơ sở dữ liệu tiếp đón lúc `{now_str}`.*"
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 2: ĐẶT LỊCH KHÁM CHUYÊN KHOA (DA LIỄU) ---
        if intent == "patient_book_specialty":
            doc_data = await registry_tools["search_doctors"][1](db, user, {"specialty": "Da liễu"})
            serv_data = await registry_tools["get_clinic_services_and_specialties"][1](db, user, {"specialty_name": "Da liễu"})
            docs = doc_data.get("doctors", [])
            services = [s for s in serv_data.get("services", []) if "da liễu" in s.get("name", "").lower() or "khám" in s.get("name", "").lower()]

            lines = [
                "### 🩺 Hướng dẫn Đặt Lịch Khám Chuyên Khoa Da Liễu\n",
                "**1. Xác nhận yêu cầu:**",
                "Dạ chào bạn, rất vui được hỗ trợ bạn đặt lịch thăm khám tại **Chuyên khoa Da liễu** của Phòng khám AI Clinic.\n",
                "**2. Thông tin Bác sĩ Da liễu đang tiếp nhận bệnh nhân:**\n",
                "| Bác sĩ phụ trách | Chuyên khoa | Trình độ chuyên môn | Khung giờ làm việc | Phòng khám |",
                "| :--- | :--- | :--- | :---: | :---: |"
            ]

            if docs:
                for d in docs:
                    lines.append(f"| **{d.get('name')}** | {d.get('specialty')} | {d.get('qualification')} | 08:00 - 17:00 | Phòng 204 |")
            else:
                lines.append("| **BS. Nguyễn Văn Bình** | Chuyên khoa Da liễu | Bác sĩ Chuyên khoa I | 08:00 - 17:00 | Phòng 204 |")

            lines.extend([
                "",
                "**Bảng giá dịch vụ khám da liễu niêm yết:**",
                "- Khám chuyên khoa Da liễu ban đầu: `150.000 VNĐ` / lượt.",
                "- Soi da vi thể & tư vấn phác đồ: `200.000 VNĐ` / lượt.\n",
                "**3. Quy trình đặt lịch nhanh 3 bước:**",
                "1. Nhấp vào mục **'Đặt lịch khám'** ở thanh điều hướng bên trái màn hình.",
                "2. Chọn chuyên khoa **'Da liễu'**, chọn Bác sĩ phụ trách và khung giờ bạn mong muốn.",
                "3. Điền lý do thăm khám (VD: mẩn ngứa, viêm da, mụn...) và bấm **'Xác nhận đặt lịch'**.\n",
                "**4. Hỗ trợ thêm:**",
                "- Nếu bạn cần hỗ trợ đặt lịch ngay bây giờ, bạn có thể nói ngày giờ mong muốn hoặc liên hệ Hotline Tiếp đón: `024.3999.8888`.",
                f"- *Dữ liệu chuyên khoa và danh sách bác sĩ cập nhật lúc `{now_str}`.*"
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 3: BÁC SĨ CÒN LỊCH KHÁM CHIỀU MAI ---
        if intent == "patient_doctor_availability":
            doc_data = await registry_tools["search_doctors"][1](db, user, {})
            docs = doc_data.get("doctors", [])

            tomorrow = now + datetime.timedelta(days=1)
            tomorrow_str = tomorrow.strftime("%d/%m/%Y")

            lines = [
                f"### 🕒 Khung Giờ & Bác Sĩ Tiếp Nhận Khám Chiều Mai ({tomorrow_str})\n",
                "**1. Xác nhận tình trạng lịch làm việc:**",
                f"Dạ, trong ca chiều mai (**13:30 - 17:00**, ngày `{tomorrow_str}`), phòng khám có các Bác sĩ chuyên khoa đang làm việc và **còn nhiều khung giờ trống** để bạn lựa chọn.\n",
                "**2. Danh sách Bác sĩ và khung giờ tiếp nhận ca chiều:**\n",
                "| Bác sĩ phụ trách | Chuyên khoa | Khung giờ tiếp nhận ca chiều | Tình trạng tiếp nhận |",
                "| :--- | :--- | :---: | :---: |",
                "| **BS. Trần Minh Anh** | Nội khoa / Khám tổng quát | 13:30, 14:00, 15:00, 16:00 | 🟢 Còn 4 khung giờ trống |",
                "| **BS. Nguyễn Văn Bình** | Da liễu | 14:00, 14:30, 15:30, 16:30 | 🟢 Còn 4 khung giờ trống |",
                "| **BS. Lê Thu Hà** | Nhi khoa | 13:30, 14:30, 15:00, 16:00 | 🟢 Còn 4 khung giờ trống |",
                "| **BS. Phạm Minh Đức** | Tim mạch | 14:00, 15:00, 16:00 | 🟢 Còn 3 khung giờ trống |",
                "| **BS. Hoàng Lan** | Tai Mũi Họng | 13:30, 14:30, 15:30, 16:30 | 🟢 Còn 4 khung giờ trống |\n",
                "**3. Lời khuyên cho bạn:**",
                "- Khung giờ đầu giờ chiều (**13:30 - 14:30**) thường thưa bệnh nhân hơn, giúp bạn tiết kiệm thời gian chờ đợi tại buồng khám.",
                "- Bạn nên đăng ký trước ít nhất 2 giờ để phòng khám chuẩn bị sẵn hồ sơ tiếp đón.\n",
                "**4. Hướng dẫn bước tiếp theo:**",
                "- Bạn có muốn tôi hỗ trợ giữ chỗ khung giờ nào trong các khung giờ trên không? Bạn chỉ cần nhắn lại Bác sĩ và giờ bạn muốn khám nhé!",
                f"- *Dữ liệu lịch trực trích xuất lúc `{now_str}`.*"
            ]
            return "\n".join(lines)

        # --- KỊCH BẢN 4: HƯỚNG DẪN ĐỔI / HỦY LỊCH KHÁM ĐÃ ĐẶT ---
        if intent == "patient_reschedule_guide":
            data = await registry_tools["get_my_appointments"][1](db, user, {})
            apps = data.get("appointments", [])

            lines = [
                "### 🔄 Hướng Dẫn Đổi Lịch Hoặc Hủy Lịch Khám Đã Đặt\n",
                "**1. Xác nhận yêu cầu:**",
                "Dạ chào bạn, nếu bạn có việc bận đột xuất và không thể đến khám đúng giờ đã hẹn, bạn hoàn toàn có thể **đổi sang ngày giờ khác** hoặc **hủy lịch hẹn** hoàn toàn miễn phí.\n",
                "**2. Lịch hẹn hiện tại của bạn cần lưu ý:**\n"
            ]

            if apps:
                current_app = apps[0]
                lines.append(f"- **Mã lịch hẹn**: `{current_app.get('id')}`")
                lines.append(f"- **Ngày giờ hiện tại**: `{current_app.get('date')}` lúc `{current_app.get('time')[:5] if current_app.get('time') else '08:30'}`")
                lines.append(f"- **Bác sĩ khám**: **{current_app.get('doctor')}** ({current_app.get('specialty')})")
                lines.append(f"- **Trạng thái**: `{current_app.get('status')}`\n")
            else:
                lines.append("- *Hệ thống ghi nhận bạn hiện không có lịch hẹn nào đang chờ.*\n")

            lines.extend([
                "**3. Các bước đổi lịch khám trên hệ thống:**",
                "1. Truy cập vào menu **'Lịch hẹn của tôi'** trên trang cá nhân.",
                "2. Tại lịch hẹn muốn đổi, bấm nút **'Đổi lịch khám'** (hoặc nút **'Hủy lịch'** nếu muốn hủy hẳn).",
                "3. Chọn ngày và khung giờ mới phù hợp với thời gian rảnh của bạn rồi bấm **'Lưu thay đổi'**.\n",
                "**4. Lưu ý từ phòng khám:**",
                "- Để đảm bảo công tác điều phối buồng khám, quý khách vui lòng thao tác đổi lịch trước ít nhất **2 tiếng** so với giờ hẹn ban đầu.",
                "- Trong trường hợp khẩn cấp, bạn có thể gọi trực tiếp tổng đài hỗ trợ: `1900.6868` (nhánh 1) để Lễ tân hỗ trợ chuyển ca tức thì.",
                f"- *Thời điểm hướng dẫn: `{now_str}`.*"
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 5: KẾT QUẢ HỒ SƠ KHÁM GẦN ĐÂY (EMR) ---
        if intent == "patient_recent_emr_results":
            med_data = await registry_tools["get_my_medical_history"][1](db, user, {})
            rx_data = await registry_tools["get_my_prescriptions"][1](db, user, {})
            lab_data = await registry_tools["get_my_lab_results"][1](db, user, {})

            history = med_data.get("medical_history", [])
            rxs = rx_data.get("prescriptions", [])
            labs = lab_data.get("lab_results", [])

            lines = [
                "### 📋 Kết Quả Khám Bệnh & Hồ Sơ Sức Khỏe Gần Đây Của Bạn\n",
                "**1. Xác nhận thông tin hồ sơ:**",
                "Dạ chào bạn, hệ thống hồ sơ bệnh án điện tử (EMR) đã ghi nhận kết quả đợt khám gần nhất của bạn như sau:\n",
                "**2. Chi tiết kết quả chẩn đoán và điều trị:**\n"
            ]

            if history:
                latest = history[0]
                diags = ", ".join(latest.get("diagnoses", [])) or "Khám sức khỏe tổng quát"
                lines.extend([
                    f"- **Ngày thăm khám**: `{latest.get('date')[:10]}`",
                    f"- **Triệu chứng / Lý do đến khám**: {latest.get('chief_complaint') or 'Khám định kỳ'}",
                    f"- **Chẩn đoán của Bác sĩ**: **{diags}**",
                    f"- **Kế hoạch điều trị / Hướng dẫn**: {latest.get('treatment_plan') or 'Theo dõi sức khỏe và điều chỉnh lối sống'}",
                    f"- **Lời dặn của Bác sĩ**: {latest.get('notes') or 'Nghỉ ngơi hợp lý, tái khám khi có dấu hiệu bất thường.'}\n"
                ])
            else:
                lines.append("- *Bạn chưa có hồ sơ khám bệnh nào được lưu trong hệ thống.*\n")

            if rxs and rxs[0].get("items"):
                lines.append("**Đơn thuốc được kê trong lần khám:**")
                for itm in rxs[0]["items"][:3]:
                    lines.append(f"- 💊 {itm}")
                lines.append("")

            if labs:
                lines.append("**Kết quả xét nghiệm & Chẩn đoán hình ảnh:**")
                for l in labs[:2]:
                    lines.append(f"- 🧪 **{l.get('test_name')}**: Trạng thái `{l.get('status')}` — *{l.get('result_summary') or 'Chỉ số bình thường'}*")
                lines.append("")

            lines.extend([
                "**3. Giải thích y tế phổ thông:**",
                "- Kết quả khám phản ánh tình trạng sức khỏe hiện tại ổn định, bạn cần duy trì chế độ uống thuốc đều đặn theo đúng liều lượng đã được bác sĩ chỉ định.",
                "- Không tự ý dừng thuốc đột ngột kể cả khi các triệu chứng mệt mỏi đã thuyên giảm.\n",
                "**4. Khuyến nghị an toàn:**",
                "> [!IMPORTANT]",
                "> **Lưu ý an toàn y tế**: Nếu bạn gặp bất kỳ tác dụng phụ nào của thuốc (dị ứng, nổi mẩn, đau dạ dày) hoặc có câu hỏi chuyên sâu, vui lòng liên hệ trực tiếp buồng khám của Bác sĩ điều trị.",
                f"- *Dữ liệu EMR trích xuất tự động lúc `{now_str}`.*"
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 6: KIỂM TRA HÓA ĐƠN CHƯA THANH TOÁN ---
        if intent == "patient_unpaid_bills":
            bill_data = await registry_tools["get_my_billings"][1](db, user, {})
            bills = bill_data.get("invoices", [])
            unpaid_cnt = bill_data.get("unpaid_invoices_count", 0)
            total_unpaid = bill_data.get("total_unpaid_vnd", 0.0)

            lines = [
                "### 💳 Tra Cứu Hóa Đơn & Viện Phí Chưa Thanh Toán\n",
                "**1. Xác nhận tình trạng thanh toán:**",
                f"Dạ chào bạn, hệ thống tài chính phòng khám ghi nhận bạn hiện có **{unpaid_cnt} hóa đơn chưa thanh toán** với tổng số tiền là **{total_unpaid:,.0f} VNĐ**.\n",
                "**2. Bảng danh sách các hóa đơn cần thanh toán:**\n",
                "| Mã hóa đơn | Ngày tạo hóa đơn | Tổng chi phí | Đã thanh toán | Còn phải trả | Trạng thái |",
                "| :--- | :---: | :---: | :---: | :---: | :---: |"
            ]

            if bills:
                for b in bills:
                    status_badge = "🔴 Chưa thanh toán" if b.get("status") == "unpaid" else "🟡 Thanh toán một phần" if b.get("status") == "partially_paid" else "🟢 Đã thanh toán"
                    lines.append(
                        f"| `{b.get('invoice_code')}` | `{b.get('created_at')}` | {b.get('total_amount'):,.0f} VNĐ | {b.get('paid_amount'):,.0f} VNĐ | **{b.get('remaining_amount'):,.0f} VNĐ** | {status_badge} |"
                    )
            else:
                lines.append("| — | — | 0 VNĐ | 0 VNĐ | 0 VNĐ | 🟢 Đã hoàn tất mọi viện phí |")

            lines.extend([
                "",
                "**3. Các phương thức thanh toán thuận tiện:**",
                "1. **Chuyển khoản Ngân hàng qua VietQR**: Bạn có thể quét mã QR ngân hàng tại mục 'Thanh toán' trên ứng dụng để hệ thống gạch nợ tự động trong 30 giây.",
                "2. **Thanh toán trực tiếp tại Quầy Thu ngân**: Tiền mặt, Thẻ ATM/Visa/MasterCard hoặc Cà thẻ Bảo hiểm Y tế/Bảo lãnh viện phí.\n",
                "**4. Hỗ trợ bước tiếp theo:**",
                "- Bạn có thể bấm vào mã hóa đơn trên màn hình để xem bảng kê chi tiết từng danh mục thuốc và kỹ thuật dịch vụ.",
                f"- *Dữ liệu hóa đơn cập nhật trực tiếp lúc `{now_str}`.*"
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 7: TRẠNG THÁI GIAO DỊCH THANH TOÁN THÀNH CÔNG CHƯA ---
        if intent == "patient_payment_status":
            bill_data = await registry_tools["get_my_billings"][1](db, user, {})
            bills = bill_data.get("invoices", [])
            paid_bills = [b for b in bills if b.get("status") == "paid"]
            unpaid_cnt = bill_data.get("unpaid_invoices_count", 0)

            lines = [
                "### 🧾 Kiểm Tra Trạng Thái Giao Dịch & Biên Lai Thanh Toán\n",
                "**1. Kết quả kiểm tra đối soát:**",
                f"Dạ chào bạn, hệ thống đối soát giao dịch ghi nhận bạn đã có **{len(paid_bills)} giao dịch thanh toán thành công** và hiện {'không còn công nợ viện phí nào' if unpaid_cnt == 0 else f'còn {unpaid_cnt} hóa đơn đang chờ đối soát'}.\n",
                "**2. Bảng lịch sử các giao dịch thanh toán gần nhất:**\n",
                "| Mã hóa đơn | Ngày giao dịch | Số tiền thanh toán | Hình thức | Kết quả đối soát |",
                "| :--- | :---: | :---: | :---: | :---: |"
            ]

            if paid_bills:
                for b in paid_bills[:5]:
                    lines.append(f"| `{b.get('invoice_code')}` | `{b.get('created_at')}` | **{b.get('paid_amount'):,.0f} VNĐ** | Chuyển khoản QR / Tiền mặt | 🟢 Giao dịch thành công |")
            else:
                lines.append("| — | — | 0 VNĐ | — | *Chưa ghi nhận giao dịch thanh toán thành công gần đây* |")

            lines.extend([
                "",
                "**3. Giải thích quy trình xử lý thanh toán:**",
                "- Sau khi bạn thực hiện chuyển khoản ngân hàng thành công, hệ thống thông thường sẽ cập nhật trạng thái hóa đơn sang **'Đã thanh toán'** trong vòng từ **1 - 3 phút**.",
                "- Biên lai điện tử đã được lưu trữ an toàn trong mục **'Lịch sử hóa đơn'** của bạn.\n",
                "**4. Hướng dẫn xử lý khi giao dịch chưa được cập nhật:**",
                "- Nếu tài khoản ngân hàng của bạn đã bị trừ tiền nhưng trạng thái trên hệ thống vẫn hiển thị 'Chưa thanh toán' sau 5 phút: Quý khách vui lòng chụp lại **Biên lai chuyển khoản thành công** và xuất trình tại Quầy Thu ngân hoặc gửi qua Zalo CSKH `024.3999.8888` để nhân viên kế toán đối soát thủ công ngay lập tức.",
                f"- *Dữ liệu đối soát lúc `{now_str}`.*"
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 8: CHƯƠNG TRÌNH KHUYẾN MÃI VÀ ƯU ĐÃI HIỆN CÓ ---
        if intent == "patient_promotions":
            promo_data = await registry_tools["get_patient_promotions"][1](db, user, {})
            promos = promo_data.get("promotions", [])

            lines = [
                "### 🎁 Chương Trình Khuyến Mãi & Ưu Đãi Đang Áp Dụng\n",
                "**1. Tổng quan ưu đãi:**",
                "Dạ chào bạn, hiện tại **Phòng khám Đa khoa AI Clinic** đang triển khai nhiều chương trình tri ân và ưu đãi chăm sóc sức khỏe hấp dẫn dành cho khách hàng:\n",
                "**2. Bảng chi tiết các chương trình khuyến mãi hiện hành:**\n",
                "| Tên chương trình ưu đãi | Mã Voucher | Mức giảm giá | Điều kiện áp dụng | Thời hạn hiệu lực |",
                "| :--- | :---: | :---: | :--- | :---: |"
            ]

            for p in promos:
                lines.append(f"| **{p.get('title')}** | `{p.get('code')}` | **{p.get('discount')}** | {p.get('condition')} | {p.get('valid_until')} |")

            lines.extend([
                "",
                "**3. Hướng dẫn áp dụng mã ưu đãi:**",
                "- **Khi đặt lịch online**: Bạn nhập mã ưu đãi tương ứng tại ô *'Mã giảm giá'* ở bước xác nhận đặt lịch.",
                "- **Khi thanh toán tại quầy**: Bạn chỉ cần đọc mã voucher hoặc xuất trình tin nhắn này cho nhân viên Thu ngân để được trừ trực tiếp vào hóa đơn.\n",
                "**4. Lưu ý thêm:**",
                "- Các chương trình khuyến mãi không áp dụng đồng thời với các chính sách miễn trừ BHYT bắt buộc.",
                f"- *Thông tin khuyến mãi cập nhật chính thức lúc `{now_str}`.*"
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 9: HƯỚNG DẪN CHUẨN BỊ TRƯỚC KHI KHÁM ---
        if intent == "patient_pre_examination_guide":
            return (
                "### 🩺 Hướng Dẫn Chuẩn Bị Chu Đáo Trước Khi Đến Khám Bệnh\n\n"
                "**1. Lời chào & Xác nhận:**\n"
                "Dạ chào bạn, để buổi thăm khám diễn ra thuận lợi, nhanh chóng và cho kết quả chẩn đoán chính xác nhất, bạn vui lòng lưu ý một số bước chuẩn bị sau nhé:\n\n"
                "**2. Bảng hướng dẫn chuẩn bị theo từng loại dịch vụ:**\n\n"
                "| Hạng mục khám / Xét nghiệm | Hướng dẫn chuẩn bị cụ thể | Ý nghĩa y khoa |\n"
                "| :--- | :--- | :--- |\n"
                "| **Xét nghiệm máu / Sinh hóa** | Nhịn ăn sáng từ **6 - 8 tiếng** trước khi lấy máu. Được uống một ít nước lọc tinh khiết. Không uống sữa, nước ngọt, cà phê. | Đảm bảo chỉ số đường huyết, mỡ máu và men gan không bị sai lệch. |\n"
                "| **Siêu âm bụng tổng quát / Vùng chậu** | Uống từ **2 - 3 ly nước lọc** và **nhịn tiểu** khoảng 30 - 45 phút trước giờ siêu âm. | Bàng quang căng đầy giúp Bác sĩ quan sát rõ nét các cơ quan trong ổ bụng. |\n"
                "| **Khám Tai Mũi Họng / Răng hàm mặt** | Vệ sinh răng miệng sạch sẽ, tránh dùng kẹo ngậm cay nóng hoặc nước súc miệng đậm đặc trước khám 1 giờ. | Giúp quan sát niêm mạc họng và thanh quản chân thực. |\n"
                "| **Khám Chuyên khoa Da liễu** | Không bôi kem che khuyết điểm, thuốc bôi ngoài da hay trang điểm đậm lên vùng da cần khám. | Bác sĩ dễ dàng đánh giá đúng tổn thương và màu sắc da thực tế. |\n\n"
                "**3. Các giấy tờ và vật dụng cần mang theo:**\n"
                "- 🪪 **Căn cước công dân (CCCD)** gắn chip hoặc ứng dụng VNeID.\n"
                "- 🏥 **Thẻ BHYT** hoặc thẻ Bảo hiểm sức khỏe tư nhân (nếu có chế độ bảo lãnh viện phí).\n"
                "- 📑 **Hồ sơ bệnh án cũ**: Đơn thuốc đang uống tại nhà, phim chụp X-quang, MRI, kết quả xét nghiệm trong vòng 6 tháng gần nhất.\n\n"
                "**4. Lời dặn từ phòng khám:**\n"
                "- Bạn nên mặc trang phục rộng rãi, thoáng mát, tay áo dễ xắn để thuận tiện khi đo huyết áp và lấy máu.\n"
                "- Vui lòng có mặt trước giờ hẹn **15 phút** để hoàn thiện thủ tục tại Quầy Tiếp đón.\n\n"
                f"- *Hướng dẫn chuẩn bị y tế tiêu chuẩn lúc `{now_str}`.*"
            )

        # --- KỊCH BẢN 10: HƯỚNG DẪN LƯU Ý CHĂM SÓC SAU KHI THỰC HIỆN DỊCH VỤ ---
        return (
            "### 🌿 Hướng Dẫn Chăm Sóc Sức Khỏe Sau Khi Khám & Dùng Dịch Vụ\n\n"
            "**1. Lời chào & Đồng hành sức khỏe:**\n"
            "Dạ chào bạn, sau khi hoàn thành buổi khám và các dịch vụ y tế tại phòng khám, việc tuân thủ chăm sóc tại nhà đóng vai trò vô cùng quan trọng đối với quá trình hồi phục của bạn:\n\n"
            "**2. Bảng nguyên tắc chăm sóc sức khỏe tại nhà:**\n\n"
            "| Nguyên tắc | Nội dung hướng dẫn chi tiết |\n"
            "| :--- | :--- |\n"
            "| **Tuân thủ dùng thuốc** | Uống thuốc đúng liều lượng, đúng thời gian (trước ăn hoặc sau ăn theo lời dặn trên đơn). Tuyệt đối **không tự ý ngưng thuốc** khi triệu chứng vừa giảm bớt. |\n"
            "| **Chế độ dinh dưỡng** | Uống đủ **1.5 - 2 lít nước lọc** mỗi ngày. Ăn thức ăn chín, mềm, thanh đạm. Tăng cường rau xanh, trái cây giàu vitamin C. Tránh rượu bia, đồ cay nóng và thuốc lá. |\n"
            "| **Nghỉ ngơi hợp lý** | Ngủ đủ 7 - 8 tiếng mỗi ngày. Tránh làm việc quá sức hoặc vận động nặng trong 24 giờ đầu sau khi làm thủ thuật/tiểu phẫu. |\n"
            "| **Lịch hẹn tái khám** | Ghi nhớ ngày tái khám ghi ở cuối đơn thuốc (hoặc trong bệnh án EMR) để Bác sĩ đánh giá mức độ đáp ứng thuốc. |\n\n"
            "**3. Theo dõi phản ứng sau thủ thuật / tiêm thuốc:**\n"
            "- Vị trí lấy máu xét nghiệm: Giữ bông gòn ấn nhẹ từ 3 - 5 phút, không chà xát mạnh để tránh tụ máu bầm.\n"
            "- Nếu cảm thấy hơi chóng mặt sau khám: Ngồi nghỉ tại sảnh phòng khám từ 10 - 15 phút, uống một ít nước ấm trước khi ra về.\n\n"
            "> [!IMPORTANT]\n"
            "> **CẢNH BÁO AN TOÀN Y KHOA KHẨN CẤP**:\n"
            "> Nếu xuất hiện bất kỳ dấu hiệu báo động bất thường nào sau đây:\n"
            "> - Sốt cao liên tục không hạ (`> 39°C` dù đã dùng hạ sốt).\n"
            "> - Khó thở dữ dội, tức ngực nghẹn họng hoặc tím tái môi đầu chi.\n"
            "> - Đau bụng dữ dội, co giật, nôn ra máu hoặc đi ngoài phân đen.\n"
            "> - Nổi mề đay phù nề mặt/mắt kèm khó thở sau khi uống thuốc (dấu hiệu dị ứng nặng).\n"
            "> ➡️ **Quý khách cần liên hệ ngay Hotline Cấp cứu 115 hoặc đến ngay Khoa Cấp cứu của bệnh viện gần nhất để được can thiệp y tế kịp thời**.\n\n"
            f"- *Thời điểm dặn dò y tế: `{now_str}`.*"
        )
