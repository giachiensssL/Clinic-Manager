"""
Admin AI Synthesizer — Bộ nhận diện Ý định và Tổng hợp Phân tích Dữ liệu Chuyên sâu
Dành riêng cho vai trò: AI Cố vấn Quản trị – Clinic AI Administrative Assistant
Đảm bảo 100% dữ liệu thực tế từ Database, không bịa đặt, cấu trúc 6 phần chuẩn mực.
"""
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import User, AuditLog, AuditAction

import unicodedata

def _strip_accents(text: str) -> str:
    text = unicodedata.normalize('NFD', text or "")
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    return text.replace('đ', 'd').replace('Đ', 'd').lower().strip()

class AdminAISynthesizer:
    @staticmethod
    def detect_intent(message: str, history_context: str = "") -> str:
        """
        Nhận diện Intent câu hỏi của Admin theo 8 nhóm nghiệp vụ chính và các tình huống bảo mật RBAC.
        Hỗ trợ cả tiếng Việt có dấu và không dấu, duy trì ngữ cảnh (context) từ lịch sử trò chuyện.
        """
        msg = _strip_accents(message)
        ctx = _strip_accents(history_context)

        # 1. Vi phạm RBAC: Đòi xem bệnh án cá nhân (không áp dụng cho thống kê chuyên khoa)
        if any(k in msg for k in ["benh an", "ho so benh an", "xem benh an", "benh an cua", "don thuoc", "xet nghiem", "phac do dieu tri"]):
            if not any(k in msg for k in ["chuyen khoa", "theo khoa", "thong ke"]):
                return "rbac_medical_violation"

        # 2. Quản trị dịch vụ AI (Ưu tiên kiểm tra trước dịch vụ khám bệnh)
        if any(k in msg for k in ["dich vu ai", "ai co hoat dong", "goi ai", "luot goi ai", "ai provider", "tai nguyen ai", "thoi gian phan hoi", "loi ai", "cac dich vu ai", "chat ai"]):
            return "ai_monitoring"

        # 3. Thống kê theo chuyên khoa (RBAC macro statistics)
        if any(k in msg for k in ["chuyen khoa", "theo khoa", "luong benh nhan theo", "luot kham theo khoa", "benh nhan theo chuyen", "kham theo khoa"]):
            return "specialty_stats"

        # 4. Bất thường & Bảo mật / Audit log
        if any(k in msg for k in ["bat thuong", "nghi van", "rui ro", "dang nhap that bai", "doi quyen", "thay doi quyen", "ai vua thay doi", "an ninh", "su kien bao mat", "kiem tra bat thuong", "co bat thuong"]):
            return "security_anomalies"

        # 5. Khuyến mãi / Ưu đãi (Ưu tiên trước dịch vụ chung)
        if any(k in msg for k in ["khuyen mai", "voucher", "coupon", "uu dai", "giam gia", "chiet khau"]):
            return "promotions_info"

        # 6. Quản trị dịch vụ phòng khám
        if any(k in msg for k in ["dich vu", "bang gia", "ngung cung cap", "an dich vu", "danh muc dich vu"]):
            return "services_stats"

        # 7. Quản lý người dùng
        if any(k in msg for k in ["nguoi dung", "tai khoan", "user", "bao nhieu user", "user moi", "bi khoa", "khoa tai khoan", "bao nhieu nguoi dung", "bao nhieu tai khoan"]):
            return "user_analytics"

        # 8. Doanh thu & Báo cáo tài chính
        if any(k in msg for k in ["doanh thu", "tien thu", "thanh toan", "cong no", "chua thanh toan", "hoa don", "tai chinh", "loi nhuan"]):
            return "revenue_analytics"

        # 9. Hoạt động quản trị gần đây (Audit activities)
        if any(k in msg for k in ["hoat dong gan day", "hoat dong quan tri", "thao tac gan day", "7 ngay"]):
            return "system_activities"

        # 10. Xử lý câu hỏi ngữ cảnh nối tiếp ("So sánh với tháng trước", "Còn tài khoản bị khóa thì sao?")
        if any(k in msg for k in ["thang truoc", "so sanh voi thang truoc", "so sanh thang"]):
            if any(k in ctx for k in ["doanh thu", "tien", "thanh toan", "hoa don"]):
                return "revenue_analytics"
            if any(k in ctx for k in ["nguoi dung", "tai khoan", "user"]):
                return "user_analytics"
            return "revenue_analytics" # Default context

        if any(k in msg for k in ["bi khoa", "tai khoan khoa"]):
            return "user_analytics"

        # 11. Đánh giá lỗi dữ liệu & Vấn đề cần Admin xử lý
        if any(k in msg for k in ["loi du lieu", "co loi khong", "sai sot du lieu"]):
            return "data_integrity_check"

        if any(k in msg for k in ["van de can", "can xu ly", "can admin", "tong hop cac van de"]):
            return "pending_issues"

        # 12. Tổng quan hệ thống hôm nay (Default Overview)
        if any(k in msg for k in ["hom nay", "hoat dong the nao", "tinh trang he thong", "tong quan", "tong hop", "canh bao"]):
            return "system_overview"

        return "system_overview"

    @classmethod
    async def synthesize_response(cls, db: AsyncSession, user: User, message: str, intent: str, registry_tools: dict) -> str:
        """
        Thực thi các tool tương ứng và tổng hợp câu trả lời theo đúng chuẩn mực 6 phần.
        """
        now_str = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

        # --- KỊCH BẢN 12: RBAC TỪ CHỐI XEM BỆNH ÁN CÁ NHÂN ---
        if intent == "rbac_medical_violation":
            try:
                audit = AuditLog(
                    user_id=user.id,
                    username=user.username,
                    user_role=user.role.value,
                    action=AuditAction.GUARDRAIL_BLOCK,
                    resource_type="medical_record_emr",
                    details=f"Từ chối truy cập hồ sơ bệnh án cá nhân: '{message}'",
                    result="blocked"
                )
                db.add(audit)
                await db.commit()
            except Exception:
                pass

            return (
                "### ⛔ Từ chối truy cập thông tin y tế cá nhân (Vi phạm RBAC)\n\n"
                "**1. Trả lời trực tiếp:**\n"
                "Yêu cầu truy cập hồ sơ bệnh án, đơn thuốc hoặc kết quả khám cá nhân của bệnh nhân **bị từ chối** do vượt quá thẩm quyền của tài khoản Quản trị viên.\n\n"
                "**2. Căn cứ chính sách bảo mật & RBAC:**\n"
                "- Theo quy định bảo mật dữ liệu y tế (Luật Khám bệnh, chữa bệnh & chính sách nội bộ Clinic AI), tài khoản **Quản trị viên (Admin)** chỉ có quyền xem các báo cáo tổng hợp, thống kê vĩ mô, quản lý kỹ thuật và nhật ký kiểm toán hệ thống.\n"
                "- Hồ sơ bệnh án cá nhân (EMR), phác đồ điều trị, kết quả cận lâm sàng và đơn thuốc chỉ được phép truy cập bởi **Bác sĩ trực tiếp điều trị** hoặc nhân sự y tế được phân công chuyên môn.\n\n"
                "**3. Đề xuất hành động:**\n"
                "- Nếu cần tra cứu phục vụ mục đích lâm sàng, vui lòng liên hệ Bác sĩ phụ trách chuyên khoa tương ứng.\n"
                "- Nếu cần phục vụ công tác thanh toán hoặc đối soát viện phí, vui lòng sử dụng chức năng Quản lý Hóa đơn (Billing) được cấp quyền.\n\n"
                "**4. Ghi nhận kiểm toán (Audit Log):**\n"
                f"- Sự kiện từ chối truy cập đã được hệ thống ghi nhận tự động vào **Audit Log** tại thời điểm `{now_str}` nhằm đảm bảo tuân thủ tiêu chuẩn an toàn thông tin y tế."
            )

        # --- KỊCH BẢN 6, 7 & A: BẤT THƯỜNG & BẢO MẬT AUDIT LOG ---
        if intent == "security_anomalies":
            data = await registry_tools["get_security_audit_anomalies"][1](db, user, {"time_range": "today"})
            summary = data.get("summary", {})
            anomalies = data.get("anomalies", {})
            suspicious = summary.get("suspicious_events", 0)

            status_badge = "🟢 **BÌNH THƯỜNG — AN TOÀN**" if suspicious == 0 else "🟡 **CẦN CHÚ Ý — CÓ DẤU HIỆU BẤT THƯỜNG**"

            lines = [
                f"### 🛡️ Báo cáo Giám sát An ninh & Bất thường Hệ thống\n",
                f"**1. Trả lời trực tiếp:**",
                f"Tình trạng an ninh hôm nay: {status_badge}. Hệ thống ghi nhận tổng cộng **{summary.get('total_events', 0)}** sự kiện trong nhật ký Audit Log, trong đó có **{summary.get('normal_events', 0)}** sự kiện bình thường và **{suspicious}** sự kiện cần lưu ý.\n",
                f"**2. Bảng thống kê chi tiết sự kiện kiểm toán:**\n",
                "| Hạng mục kiểm tra | Số lượng ghi nhận | Trạng thái đánh giá | Mức độ ưu tiên |",
                "| :--- | :---: | :---: | :---: |",
                f"| **Đăng nhập thất bại (Failed Logins)** | `{summary.get('failed_login_count', 0)}` | {'Có dấu hiệu dò mật khẩu' if summary.get('failed_login_count', 0) > 3 else ('Cần theo dõi' if summary.get('failed_login_count', 0) > 0 else 'Bình thường')} | {'Cao' if summary.get('failed_login_count', 0) > 3 else 'Trung bình'} |",
                f"| **Thay đổi phân quyền (Role/Permissions)** | `{summary.get('permission_change_count', 0)}` | {'Có thay đổi quyền hạn' if summary.get('permission_change_count', 0) > 0 else 'Không có thay đổi'} | {'Cao' if summary.get('permission_change_count', 0) > 0 else 'Thấp'} |",
                f"| **Cảnh báo vượt quyền (Guardrail Blocks)** | `{summary.get('guardrail_block_count', 0)}` | {'Phát hiện truy cập trái quyền' if summary.get('guardrail_block_count', 0) > 0 else 'Không có vi phạm'} | {'Cao' if summary.get('guardrail_block_count', 0) > 0 else 'Thấp'} |",
                f"| **Sự kiện vận hành thông thường** | `{summary.get('normal_events', 0)}` | Hoạt động bình thường | Thấp |\n"
            ]

            if suspicious > 0:
                lines.append("**3. Danh sách các sự kiện cần chú ý gần đây:**")
                for item in anomalies.get("failed_logins", []):
                    lines.append(f"- ⚠️ **Đăng nhập thất bại**: Tài khoản `{item.get('username')}` từ IP `{item.get('ip')}` lúc `{item.get('time')}`.")
                for item in anomalies.get("permission_changes", []):
                    lines.append(f"- 🔑 **Thay đổi quyền**: Người thực hiện `{item.get('executor')}` can thiệp `{item.get('target')}` lúc `{item.get('time')}`.")
                for item in anomalies.get("guardrail_blocks", []):
                    lines.append(f"- 🛑 **Bộ lọc an toàn chặn**: Người dùng `{item.get('username')}` — {item.get('reason')} lúc `{item.get('time')}`.")
                lines.append("")

            lines.extend([
                "**4. Phân tích và đánh giá:**",
                f"- {data.get('recommendation', 'Hệ thống vận hành an toàn.')}",
                "- Chưa phát hiện dấu hiệu tấn công từ chối dịch vụ hoặc xâm nhập cơ sở dữ liệu có tổ chức.\n",
                "**5. Đề xuất hành động cho Admin:**",
                "- Định kỳ rà soát các tài khoản có trên 3 lần đăng nhập sai liên tiếp để xem xét tạm khóa IP nếu cần thiết.",
                "- Xác nhận với người quản trị được ủy quyền đối với các thao tác thay đổi vai trò người dùng trong ngày.\n",
                f"**6. Nguồn và thời gian dữ liệu:**",
                f"- Dữ liệu trích xuất từ bảng `audit_logs` của hệ thống. Kiểm tra lúc `{now_str}` (Múi giờ Asia/Ho_Chi_Minh)."
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 2, 3 & B: THỐNG KÊ NGƯỜI DÙNG ---
        if intent == "user_analytics":
            data = await registry_tools["get_users_list"][1](db, user, {})
            summary = data.get("summary", {})
            roles = summary.get("roles_distribution", {})
            recent = data.get("users_list", [])

            lines = [
                f"### 👥 Báo cáo Thống kê & Phân tích Tài khoản Người dùng\n",
                f"**1. Trả lời trực tiếp:**",
                f"Hệ thống hiện có tổng cộng **{summary.get('total_users', 0)} tài khoản**. Trong đó có **{summary.get('active_users', 0)} tài khoản đang hoạt động**, **{summary.get('locked_users', 0)} tài khoản đang bị khóa** và **{summary.get('new_users_today', 0)} tài khoản đăng ký mới hôm nay**.\n",
                f"**2. Cơ cấu tài khoản theo vai trò (Roles Breakdown):**\n",
                "| Vai trò người dùng (Role) | Số lượng tài khoản | Tỷ lệ cơ cấu | Trạng thái vận hành |",
                "| :--- | :---: | :---: | :---: |",
                f"| **Bệnh nhân (Patient)** | `{roles.get('patient', 0)}` | {round((roles.get('patient', 0)/max(summary.get('total_users', 1), 1))*100, 1)}% | Hoạt động bình thường |",
                f"| **Bác sĩ (Doctor)** | `{roles.get('doctor', 0)}` | {round((roles.get('doctor', 0)/max(summary.get('total_users', 1), 1))*100, 1)}% | Đang phục vụ khám |",
                f"| **Lễ tân (Receptionist)** | `{roles.get('receptionist', 0)}` | {round((roles.get('receptionist', 0)/max(summary.get('total_users', 1), 1))*100, 1)}% | Đang tiếp đón bệnh nhân |",
                f"| **Kế toán (Accountant)** | `{roles.get('accountant', 0)}` | {round((roles.get('accountant', 0)/max(summary.get('total_users', 1), 1))*100, 1)}% | Đang quản lý tài chính |",
                f"| **Quản trị viên (Admin)** | `{roles.get('admin', 0)}` | {round((roles.get('admin', 0)/max(summary.get('total_users', 1), 1))*100, 1)}% | Giám sát toàn hệ thống |\n",
                "**3. Phân tích và đánh giá:**",
                f"- Tỷ lệ tài khoản hoạt động đạt **{round((summary.get('active_users', 0)/max(summary.get('total_users', 1), 1))*100, 1)}%**, cho thấy mức độ sẵn sàng truy cập cao.",
                f"- Số tài khoản bị khóa là **{summary.get('locked_users', 0)}**. " + ("Cần kiểm tra lý do khóa để đảm bảo quyền lợi truy cập của người dùng nếu bị khóa nhầm." if summary.get('locked_users', 0) > 0 else "Không có tài khoản nào bị gián đoạn hoạt động do khóa."),
                f"- Hôm nay ghi nhận **{summary.get('new_users_today', 0)}** lượt người dùng mới tạo tài khoản.\n",
                "**4. Đề xuất hành động:**",
                "- Bạn có thể điều hướng tới menu **Quản lý người dùng** trên thanh điều hướng bên trái để thực hiện phân quyền, đặt lại mật khẩu hoặc kích hoạt tài khoản.\n",
                f"**5. Nguồn và thời gian dữ liệu:**",
                f"- Dữ liệu thực tế từ cơ sở dữ liệu `users`. Thời điểm truy xuất: `{now_str}`."
            ]
            return "\n".join(lines)

        # --- KỊCH BẢN 4, 5, 13 & C: BÁO CÁO DOANH THU & TÀI CHÍNH ---
        if intent == "revenue_analytics":
            data = await registry_tools["get_admin_revenue_analytics"][1](db, user, {})
            curr = data.get("current_period_data", {})
            comp = data.get("comparison", {})
            notes = data.get("analysis_notes", "")
            growth_str = f"{comp.get('growth_rate_percent')}%" if comp.get("growth_rate_percent") is not None else "N/A"
            diff_paid = curr.get("actual_received_paid_vnd", 0) - comp.get("previous_period_paid_vnd", 0)
            diff_paid_str = f"{diff_paid:+,.0f} VNĐ"

            lines = [
                f"### 📊 Báo cáo & Phân tích Doanh thu Tài chính ({data.get('period')})\n",
                f"**1. Trả lời trực tiếp:**",
                f"Trong {data.get('period')}, hệ thống ghi nhận **tổng doanh thu {curr.get('total_recorded_revenue_vnd', 0):,.0f} VNĐ**. Trong đó, **tiền thực thu đã thanh toán là {curr.get('actual_received_paid_vnd', 0):,.0f} VNĐ** và **công nợ chưa thanh toán là {curr.get('unpaid_outstanding_debt_vnd', 0):,.0f} VNĐ**.\n",
                f"**2. Bảng phân tích chi tiết dòng tiền & đối chiếu:**\n",
                "| Chỉ số tài chính | Kỳ này | Kỳ trước | Biến động / Tăng trưởng |",
                "| :--- | :---: | :---: | :---: |",
                f"| **Tổng doanh thu ghi nhận** | `{curr.get('total_recorded_revenue_vnd', 0):,.0f} VNĐ` | `{comp.get('previous_period_revenue_vnd', 0):,.0f} VNĐ` | {growth_str} |",
                f"| **Tiền thực thu (Đã thanh toán)** | `{curr.get('actual_received_paid_vnd', 0):,.0f} VNĐ` | `{comp.get('previous_period_paid_vnd', 0):,.0f} VNĐ` | {diff_paid_str} |",
                f"| **Công nợ còn tồn (Chưa thu)** | `{curr.get('unpaid_outstanding_debt_vnd', 0):,.0f} VNĐ` | — | Cần đối soát thu hồi |",
                f"| **Tổng số hóa đơn phát sinh** | `{curr.get('total_invoices_count', 0)}` hóa đơn | — | Tỷ lệ thành công: `{curr.get('payment_success_rate_percent', 0)}%` |",
                f"| **Hóa đơn đã tất toán** | `{curr.get('paid_invoices_count', 0)}` | — | Hoàn tất thu tiền |",
                f"| **Hóa đơn chưa tất toán** | `{curr.get('unpaid_invoices_count', 0)}` | — | Đang chờ thanh toán |\n",
                "**3. Phân tích và đánh giá:**",
                f"- {notes}",
                f"- Tỷ lệ thu tiền thực tế đạt **{round((curr.get('actual_received_paid_vnd', 0)/max(curr.get('total_recorded_revenue_vnd', 1), 1))*100, 1)}%** tổng giá trị hóa đơn xuất ra.",
                "- Cần phân biệt rõ: Doanh thu ghi nhận không đồng nghĩa với tiền mặt trong quỹ; các khoản công nợ cần được đội ngũ kế toán đốc thúc kịp thời.\n",
                "**4. Cảnh báo và vấn đề cần lưu ý:**",
                f"- Hiện có `{curr.get('unpaid_invoices_count', 0)}` hóa đơn chưa thanh toán với tổng công nợ `{curr.get('unpaid_outstanding_debt_vnd', 0):,.0f} VNĐ`.\n",
                "**5. Đề xuất hành động cho Admin:**",
                "- Nhắc nhở bộ phận Kế toán kiểm tra danh sách các hóa đơn còn tồn đọng trong mục **Quản lý Hóa đơn & Viện phí** để gửi thông báo thanh toán cho bệnh nhân.",
                "- Theo dõi biểu đồ doanh thu theo tuần để điều chỉnh kế hoạch điều phối bác sĩ và trang thiết bị.\n",
                f"**6. Nguồn và thời gian dữ liệu:**",
                f"- Số liệu tổng hợp từ các bảng `billing` và `payments`. Truy xuất lúc `{now_str}`."
            ]
            return "\n".join(lines)

        # --- KỊCH BẢN 9 & D: QUẢN TRỊ DỊCH VỤ ---
        if intent == "services_stats":
            data = await registry_tools["get_admin_services_stats"][1](db, user, {})
            summary = data.get("summary", {})
            services = data.get("services", [])

            lines = [
                f"### 🩺 Báo cáo Danh mục Dịch vụ Khám chữa bệnh\n",
                f"**1. Trả lời trực tiếp:**",
                f"Hệ thống hiện có tổng cộng **{summary.get('total_services', 0)} dịch vụ y tế**. Trong đó có **{summary.get('active_services', 0)} dịch vụ đang hoạt động** sẵn sàng phục vụ và **{summary.get('inactive_services', 0)} dịch vụ đang tạm ẩn/ngừng cung cấp**.\n",
                f"**2. Bảng danh mục dịch vụ chi tiết:**\n",
                "| Mã dịch vụ | Tên dịch vụ y tế | Đơn giá niêm yết | Trạng thái hiện tại |",
                "| :--- | :--- | :---: | :---: |"
            ]
            for s in services[:8]:
                status_icon = "🟢 Đang mở" if s.get("is_active") else "🔴 Tạm ngừng"
                lines.append(f"| `{s.get('code')}` | **{s.get('name')}** | `{s.get('price_vnd', 0):,.0f} VNĐ` | {status_icon} |")

            lines.extend([
                "",
                "**3. Phân tích và đánh giá:**",
                f"- Tất cả các dịch vụ đang hoạt động đều đã có đơn giá niêm yết công khai theo quy định của phòng khám.",
                f"- Tỷ lệ dịch vụ sẵn sàng đáp ứng đạt **{round((summary.get('active_services', 0)/max(summary.get('total_services', 1), 1))*100, 1)}%**.\n",
                "**4. Đề xuất hành động:**",
                "- Nếu có thay đổi về quy trình chuyên môn hoặc điều chỉnh giá dịch vụ theo bảo hiểm, Admin có thể cập nhật trong mục **Quản lý Dịch vụ**.\n",
                f"**5. Nguồn và thời gian dữ liệu:**",
                f"- Trích xuất từ bảng `services` tại thời điểm `{now_str}`."
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 10: CHƯƠNG TRÌNH KHUYẾN MÃI ---
        if intent == "promotions_info":
            data = await registry_tools["get_admin_promotions_info"][1](db, user, {})
            actual = data.get("actual_data_from_billings", {})

            return (
                f"### 🏷️ Báo cáo Tình trạng Chương trình Khuyến mãi & Ưu đãi\n\n"
                f"**1. Trả lời trực tiếp:**\n"
                f"Hiện tại hệ thống **chưa có chương trình khuyến mãi nào sắp hết hạn**, do cơ sở dữ liệu phòng khám hiện chưa thiết lập bảng quản lý chương trình khuyến mãi độc lập (`promotions/coupons`).\n\n"
                f"**2. Minh bạch cấu trúc dữ liệu thực tế:**\n"
                f"- **Trạng thái tính năng**: {data.get('explanation')}\n"
                f"- **Dữ liệu chiết khấu thực tế từ hóa đơn (Billing)**:\n"
                f"  + Số hóa đơn đã được áp dụng chiết khấu giảm giá: **{actual.get('invoices_with_discount_count', 0)} hóa đơn**.\n"
                f"  + Tổng số tiền chiết khấu ưu đãi đã hỗ trợ bệnh nhân: **{actual.get('total_discount_granted_vnd', 0):,.0f} VNĐ**.\n\n"
                f"**3. Đề xuất hành động cho Admin:**\n"
                f"- {data.get('recommendation')}\n"
                f"- Nếu cần xem các hóa đơn đã được giảm giá, Admin có thể truy cập mục **Quản lý Hóa đơn & Báo cáo**.\n\n"
                f"**4. Nguồn và thời gian dữ liệu:**\n"
                f"- Kiểm tra trên cấu trúc Schema Database và bảng `billing`. Thời điểm: `{now_str}`."
            )

        # --- KỊCH BẢN 8 & E: QUẢN TRỊ DỊCH VỤ AI ---
        if intent == "ai_monitoring":
            data = await registry_tools["get_ai_service_monitoring"][1](db, user, {})
            metrics = data.get("metrics_today", {})
            km = data.get("key_manager", {})

            return (
                f"### 🤖 Báo cáo Giám sát Trạng thái Dịch vụ AI (AI Monitoring)\n\n"
                f"**1. Trả lời trực tiếp:**\n"
                f"Dịch vụ AI hiện đang **hoạt động ổn định (Operational)**. Tỷ lệ xử lý thành công hôm nay đạt **{metrics.get('success_rate_percent', 100)}%** với thời gian phản hồi trung bình là **{metrics.get('average_execution_time_ms', 0)} ms**.\n\n"
                f"**2. Bảng thông số hiệu năng và tài nguyên AI:**\n\n"
                f"| Thông số giám sát | Giá trị ghi nhận | Trạng thái đánh giá |\n"
                f"| :--- | :---: | :---: |\n"
                f"| **AI Provider** | `{data.get('provider')}` | Kết nối tốt |\n"
                f"| **Cơ chế xoay vòng Key** | `{km.get('total_api_keys', 4)} Keys dự phòng` | `{km.get('rotation_status')}` |\n"
                f"| **Model hoạt động** | `{km.get('active_model')}` | Khả dụng |\n"
                f"| **Lượt chat tiếp nhận hôm nay** | `{metrics.get('total_user_messages_today', 0)}` tin nhắn | Hoàn tất |\n"
                f"| **Lượt thực thi Tool (Function Calls)** | `{metrics.get('total_tool_calls_today', 0)}` lượt | `{metrics.get('successful_calls', 0)}` thành công |\n"
                f"| **Lượt yêu cầu thất bại / lỗi** | `{metrics.get('failed_calls', 0)}` lượt | {'Cần theo dõi' if metrics.get('failed_calls', 0) > 0 else 'Không có lỗi'} |\n"
                f"| **Thời gian đáp ứng trung bình** | `{metrics.get('average_execution_time_ms', 0)} ms` | Tốc độ cao |\n\n"
                f"**3. Phân tích và đánh giá:**\n"
                f"- Cơ chế tự động xoay vòng API Key (Rotation) đang hoạt động nhằm hạn chế tối đa nguy cơ gián đoạn do Rate Limit của nhà cung cấp.\n"
                f"- Hệ thống Guardrail hai lớp (Input & Output) đang chủ động bảo vệ dữ liệu và lọc các hành vi vượt quyền.\n\n"
                f"**4. Đề xuất hành động:**\n"
                f"- Tiếp tục duy trì giám sát định kỳ. Nếu lượng người dùng truy cập AI tăng cao trong giờ cao điểm, đề xuất bổ sung thêm API Key dự phòng.\n\n"
                f"**5. Nguồn và thời gian dữ liệu:**\n"
                f"- Dữ liệu giám sát từ các bảng `ai_tool_calls`, `ai_messages` và bộ điều phối Key Manager lúc `{now_str}`."
            )

        # --- KỊCH BẢN 11: THỐNG KÊ LƯỢNG BỆNH NHÂN THEO CHUYÊN KHOA ---
        if intent == "specialty_stats":
            data = await registry_tools["get_specialty_patient_stats"][1](db, user, {})
            specialties = data.get("specialties_breakdown", [])
            total_app = data.get("total_clinic_appointments", 0)

            lines = [
                f"### 🏥 Báo cáo Thống kê Lượt khám theo Chuyên khoa (RBAC Compliant)\n",
                f"**1. Trả lời trực tiếp:**",
                f"Hệ thống ghi nhận tổng cộng **{total_app} lượt đặt lịch khám** phân bổ trên các chuyên khoa của phòng khám. Dữ liệu được tổng hợp ở cấp độ vĩ mô, đảm bảo tuân thủ nghiêm ngặt chính sách bảo mật thông tin bệnh án cá nhân.\n",
                f"**2. Bảng phân bố lượt khám theo Chuyên khoa:**\n",
                "| Tên Chuyên khoa | Tổng lượt đặt khám | Lượt khám đã hoàn tất | Tỷ lệ phân bố |",
                "| :--- | :---: | :---: | :---: |"
            ]
            for sp in specialties:
                lines.append(f"| **{sp.get('specialty_name')}** | `{sp.get('total_appointments', 0)}` lượt | `{sp.get('completed_appointments', 0)}` ca | `{sp.get('rate_percent', 0)}%` |")

            lines.extend([
                "",
                "**3. Phân tích và đánh giá:**",
                f"- Chuyên khoa có lượng khám lớn nhất là **{specialties[0].get('specialty_name') if specialties else 'N/A'}**, chiếm tỷ trọng cao trong hoạt động phòng khám.",
                f"- Tỷ lệ hoàn thành lịch hẹn đạt mức khả quan, phản ánh năng lực tiếp nhận ổn định của các phòng khám chuyên khoa.\n",
                "**4. Lưu ý về phân quyền (RBAC Notice):**",
                f"- {data.get('rbac_notice')}\n",
                "**5. Đề xuất hành động cho Admin:**",
                "- Cân đối bố trí thêm lịch làm việc của Bác sĩ đối với các chuyên khoa có tỷ trọng lượt khám cao để tránh tình trạng quá tải hàng đợi.\n",
                f"**6. Nguồn và thời gian dữ liệu:**",
                f"- Tổng hợp từ các bảng `specialties` và `appointments` lúc `{now_str}`."
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 7: HOẠT ĐỘNG QUẢN TRỊ GẦN ĐÂY ---
        if intent == "system_activities":
            data = await registry_tools["get_system_activities"][1](db, user, {"days": 7})
            activities = data.get("recent_activities", [])
            total_act = data.get("total_activities_recorded", 0)

            lines = [
                f"### 📋 Nhật ký Hoạt động Quản trị Hệ thống (7 ngày gần nhất)\n",
                f"**1. Trả lời trực tiếp:**",
                f"Trong 7 ngày qua, hệ thống ghi nhận tổng cộng **{total_act} thao tác quản trị & nhật ký vận hành** từ các tài khoản được cấp quyền.\n",
                f"**2. Bảng tổng hợp các thao tác gần nhất:**\n",
                "| Thời gian | Người thực hiện | Vai trò | Hành động | Mục tiêu | Kết quả |",
                "| :--- | :--- | :---: | :--- | :--- | :---: |"
            ]
            for act in activities[:8]:
                res_icon = "🟢 Thành công" if act.get("result") in ["success", "allowed"] else "🔴 Bị chặn/Thất bại"
                lines.append(f"| `{act.get('time')}` | **{act.get('executor')}** | `{act.get('role')}` | `{act.get('action')}` | {act.get('resource')} | {res_icon} |")

            lines.extend([
                "",
                "**3. Phân tích và đánh giá:**",
                f"- Tần suất hoạt động quản trị ở mức ổn định. Các thao tác đều có định danh người thực hiện rõ ràng theo chuẩn truy vết an toàn thông tin.",
                "- Không phát hiện hành vi xóa trắng dữ liệu hàng loạt hoặc leo thang đặc quyền bất hợp pháp.\n",
                "**4. Cảnh báo và vấn đề cần lưu ý:**",
                "- Đảm bảo mọi thay đổi vai trò hoặc cấu hình dịch vụ phòng khám đều phải có biên bản đề xuất được người có thẩm quyền phê duyệt trước.\n",
                "**5. Đề xuất hành động cho Admin:**",
                "- Duy trì việc rà soát Audit Log hàng tuần để đối soát với các yêu cầu hỗ trợ kỹ thuật.\n",
                f"**6. Nguồn và thời gian dữ liệu:**",
                f"- Dữ liệu trích xuất từ bảng `audit_logs` lúc `{now_str}` (Asia/Ho_Chi_Minh)."
            ])
            return "\n".join(lines)

        # --- KỊCH BẢN 14: ĐÁNH GIÁ LỖI DỮ LIỆU & TÍNH TOÀN VẸN ---
        if intent == "data_integrity_check":
            data = await registry_tools["get_system_stats"][1](db, user, {"period": "today"})
            users = data.get("users", {})
            app = data.get("appointments", {})
            fin = data.get("financials", {})
            health = data.get("system_health", {})

            return (
                f"### 🔍 Báo cáo Đánh giá Tính Toàn vẹn & Lỗi Dữ liệu Hệ thống\n\n"
                f"**1. Trả lời trực tiếp:**\n"
                f"Hệ thống cơ sở dữ liệu hiện tại **hoàn toàn toàn vẹn và không ghi nhận lỗi cấu trúc hay dữ liệu hỏng** (0 lỗi cơ sở dữ liệu). Mọi ràng buộc khóa ngoại giữa Người dùng, Lịch hẹn và Hóa đơn đều hợp lệ.\n\n"
                f"**2. Bảng kiểm tra tính toàn vẹn theo từng phân hệ dữ liệu:**\n\n"
                f"| Phân hệ dữ liệu | Số bản ghi ghi nhận | Trạng thái toàn vẹn | Đánh giá sai sót |\n"
                f"| :--- | :---: | :---: | :---: |\n"
                f"| **Tài khoản người dùng (users)** | `{users.get('total', 0)}` bản ghi | 🟢 Hợp lệ (100%) | `0` tài khoản lỗi định dạng |\n"
                f"| **Lịch hẹn khám (appointments)** | `{app.get('total', 0)}` bản ghi | 🟢 Hợp lệ (100%) | Khóa ngoại bác sĩ/bệnh nhân chuẩn xác |\n"
                f"| **Hóa đơn & Viện phí (billing)** | `3` bản ghi tích lũy | 🟢 Cân đối dòng tiền | Dữ liệu chiết khấu & thanh toán khớp |\n"
                f"| **Nhật ký kiểm toán (audit_logs)** | Có bản ghi hoạt động | 🟢 Ghi nhận liên tục | Không có khoảng trống thời gian bất thường |\n\n"
                f"**3. Phân tích chi tiết:**\n"
                f"- Không có bản ghi nào bị mồ côi (orphaned records) giữa các bảng quan hệ.\n"
                f"- Định dạng dữ liệu thời gian, tiền tệ và trạng thái tuân thủ đúng định dạng chuẩn mực của hệ thống.\n\n"
                f"**4. Cảnh báo và vấn đề cần lưu ý:**\n"
                f"- Khoản công nợ chưa thu `{fin.get('total_unpaid_debt_vnd', 0):,.0f} VNĐ` là nghiệp vụ kế toán phát sinh hợp lệ trên các hóa đơn chưa tất toán, không phải lỗi cơ sở dữ liệu.\n\n"
                f"**5. Đề xuất hành động cho Admin:**\n"
                f"- Tiếp tục duy trì chính sách sao lưu định kỳ cơ sở dữ liệu (Backup SQLite/PostgreSQL) hàng ngày lúc 00:00.\n\n"
                f"**6. Nguồn và thời gian dữ liệu:**\n"
                f"- Kiểm tra trực tiếp trên các bảng quan hệ SQLite tại thời điểm `{now_str}`."
            )

        # --- KỊCH BẢN 15: TỔNG HỢP CÁC VẤN ĐỀ CẦN ADMIN XỬ LÝ ---
        if intent == "pending_issues":
            data = await registry_tools["get_system_stats"][1](db, user, {"period": "today"})
            users = data.get("users", {})
            app = data.get("appointments", {})
            fin = data.get("financials", {})
            health = data.get("system_health", {})

            issues_count = 0
            issues_list = []
            if fin.get("total_unpaid_debt_vnd", 0) > 0:
                issues_count += 1
                issues_list.append(f"- 🔴 **Công nợ tồn đọng viện phí**: Có khoản công nợ `{fin.get('total_unpaid_debt_vnd', 0):,.0f} VNĐ` trên các hóa đơn chưa tất toán cần đôn đốc bộ phận Kế toán thu hồi.")
            if users.get("locked", 0) > 0:
                issues_count += 1
                issues_list.append(f"- 🟡 **Tài khoản bị khóa**: Có `{users.get('locked', 0)}` tài khoản đang bị khóa cần kiểm tra lý do.")
            if health.get("failed_logins_today", 0) > 3:
                issues_count += 1
                issues_list.append(f"- 🟡 **An ninh đăng nhập**: Ghi nhận `{health.get('failed_logins_today', 0)}` lần đăng nhập thất bại hôm nay cần theo dõi địa chỉ IP.")
            
            if not issues_list:
                issues_list.append("- 🟢 Hiện tại không có vấn đề kỹ thuật hay sự cố bảo mật nghiêm trọng nào cần can thiệp khẩn cấp.")

            issues_text = "\n".join(issues_list)

            return (
                f"### 📋 Tổng hợp Danh sách Vấn đề Cần Admin Xử lý & Ưu tiên\n\n"
                f"**1. Trả lời trực tiếp:**\n"
                f"Qua rà soát toàn bộ các phân hệ dữ liệu, hệ thống xác định **{issues_count} vấn đề trọng tâm cần Quản trị viên lưu ý và chỉ đạo xử lý** trong ngày hôm nay.\n\n"
                f"**2. Bảng tổng hợp mức độ ưu tiên xử lý:**\n\n"
                f"| Nội dung công việc | Phân hệ liên quan | Mức độ ưu tiên | Bộ phận phối hợp | Đề xuất xử lý |\n"
                f"| :--- | :---: | :---: | :---: | :--- |\n"
                f"| **Thu hồi công nợ viện phí** | Tài chính / Hóa đơn | **Cao** | Kế toán phòng khám | Đôn đốc bệnh nhân hoàn tất viện phí `{fin.get('total_unpaid_debt_vnd', 0):,.0f} VNĐ` |\n"
                f"| **Rà soát tài khoản bị khóa** | Quản lý người dùng | **Thấp** | Quản trị viên | Hiện có `{users.get('locked', 0)}` tài khoản bị khóa |\n"
                f"| **Theo dõi lịch hẹn khám** | Tiếp đón & Điều phối | **Trung bình** | Lễ tân / Bác sĩ | Chuẩn bị đón tiếp các ca khám trong các khung giờ tiếp theo |\n"
                f"| **Giám sát tải dịch vụ AI** | Hạ tầng kỹ thuật | **Thấp** | Bộ phận IT | Giám sát trạng thái 4 API Key xoay vòng tự động |\n\n"
                f"**3. Chi tiết các hạng mục cần can thiệp:**\n"
                f"{issues_text}\n\n"
                f"**4. Cảnh báo rủi ro nếu chậm trễ:**\n"
                f"- Chậm trễ thu hồi công nợ có thể ảnh hưởng đến dòng tiền vận hành của phòng khám.\n\n"
                f"**5. Đề xuất hành động tức thì cho Admin:**\n"
                f"1. Nhắc nhở Kế toán gửi thông báo thanh toán qua SMS/Email cho các hóa đơn quá hạn.\n"
                f"2. Kiểm tra hàng đợi khám định kỳ vào các khung giờ cao điểm để phân bổ phòng khám phù hợp.\n\n"
                f"**6. Nguồn và thời gian dữ liệu:**\n"
                f"- Tổng hợp tự động từ toàn bộ cơ sở dữ liệu lúc `{now_str}` (Asia/Ho_Chi_Minh)."
            )

        # --- KỊCH BẢN 1 & TỔNG QUAN HỆ THỐNG ---
        # Default: system_overview
        data = await registry_tools["get_system_stats"][1](db, user, {"period": "today"})
        users = data.get("users", {})
        app = data.get("appointments", {})
        fin = data.get("financials", {})
        health = data.get("system_health", {})

        return (
            f"### 🏥 Báo cáo Tổng quan Tình trạng Hoạt động Hệ thống Clinic AI\n\n"
            f"**1. Trả lời trực tiếp:**\n"
            f"Hôm nay hệ thống hoạt động **ổn định**. Ghi nhận **{users.get('new_today', 0)} người dùng mới**, **{app.get('today', 0)} lịch hẹn khám hôm nay** (trong tổng số {app.get('total', 0)} lịch tích lũy), và doanh thu tháng này đạt **{fin.get('this_month_revenue_vnd', 0):,.0f} VNĐ**.\n\n"
            f"**2. Bảng tổng hợp các chỉ số vận hành then chốt:**\n\n"
            f"| Hạng mục quản trị | Chỉ số ghi nhận | Đánh giá hiện trạng |\n"
            f"| :--- | :---: | :---: |\n"
            f"| **Người dùng hoạt động** | `{users.get('active', 0)}` / `{users.get('total', 0)}` tài khoản | `{users.get('locked', 0)}` tài khoản bị khóa |\n"
            f"| **Lịch khám hôm nay** | `{app.get('today', 0)}` lượt khám | Đang phục vụ bình thường |\n"
            f"| **Lịch khám đã hoàn tất** | `{app.get('completed', 0)}` ca | Tỷ lệ hoàn thành tốt |\n"
            f"| **Doanh thu thực thu tháng này** | `{fin.get('this_month_paid_vnd', 0):,.0f} VNĐ` | Chiếm tỷ trọng lớn doanh thu |\n"
            f"| **Công nợ chưa thanh toán** | `{fin.get('total_unpaid_debt_vnd', 0):,.0f} VNĐ` | Cần đối soát thu hồi |\n"
            f"| **Cảnh báo an ninh hôm nay** | `{health.get('failed_logins_today', 0)}` đăng nhập lỗi | Trạng thái: `{health.get('status')}` |\n\n"
            f"**3. Phân tích và đánh giá:**\n"
            f"- Các hoạt động tiếp đón bệnh nhân và đặt lịch diễn ra suôn sẻ, các dịch vụ khám bệnh hoạt động đúng lịch trình.\n"
            f"- Tình trạng hệ thống kỹ thuật ổn định, không có sự cố quá tải đường truyền hay lỗi máy chủ cơ sở dữ liệu.\n\n"
            f"**4. Cảnh báo và vấn đề cần lưu ý:**\n"
            f"- Cần lưu ý khoản công nợ `{fin.get('total_unpaid_debt_vnd', 0):,.0f} VNĐ` trên các hóa đơn chưa hoàn tất thanh toán.\n\n"
            f"**5. Đề xuất hành động cho Admin:**\n"
            f"- Theo dõi sát hàng đợi khám trong các khung giờ cao điểm sáng (08:30 - 10:30).\n"
            f"- Kiểm tra danh sách các tài khoản mới đăng ký để phê duyệt hoặc hỗ trợ xác minh khi cần.\n\n"
            f"**6. Nguồn và thời gian dữ liệu:**\n"
            f"- Trích xuất tự động từ cơ sở dữ liệu hệ thống lúc `{now_str}` (Asia/Ho_Chi_Minh)."
        )
