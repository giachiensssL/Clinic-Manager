# DANH SÁCH CÁC TÍNH NĂNG CÒN THIẾU HOẶC CHƯA HOÀN THIỆN (MISSING FEATURES CHECKLIST)
## HỆ THỐNG QUẢN LÝ PHÒNG KHÁM THÔNG MINH (AI CLINIC MANAGEMENT SYSTEM)

**Ngày rà soát:** 01/11/2026  
**Quy chuẩn phân loại trạng thái:**
- **Missing (Chưa có):** Hoàn toàn chưa được lập trình ở cả Frontend và Backend.
- **Partial (Một phần):** Đã có giao diện và một phần API nhưng luồng dữ liệu bị đứt gãy hoặc thiếu trường.
- **Mock-Only (Chỉ có UI/Dữ liệu giả):** Giao diện đã dựng nhưng dùng dữ liệu giả lập (mock data), `localStorage` hoặc `setTimeout`, chưa kết nối CSDL thực tế.
- **Real (Hoàn chỉnh):** Đã kết nối đầy đủ từ giao diện đến API và lưu trữ Database bền vững.

---

## 1. PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN MODULE)

| STT | Tên tính năng | Trạng thái hiện tại | Mô tả hiện trạng | Vai trò bị ảnh hưởng | Giải pháp đề xuất |
|:---:|---|:---:|---|---|---|
| **AD-01** | Quản lý Buồng/Phòng khám | **Mock-Only** | Dữ liệu lưu trong `localStorage` (`clinic_rooms`), schema backend `models.py` chưa có bảng `rooms`. | Admin, Lễ tân, Bác sĩ | Tạo model `Room`, thêm migration DB và xây dựng bộ API CRUD `/api/v1/admin/rooms`. |
| **AD-02** | Phân quyền Vai trò động (Dynamic RBAC) | **Mock-Only** | Ma trận quyền 12 module chỉ lưu trong React state, F5 mất sạch. Backend chỉ có enum cố định 5 role. | Toàn hệ thống | Tạo bảng `roles`, `permissions`, `role_permissions` trong DB và API cập nhật quyền hạn động. |
| **AD-03** | Quản lý Nhân sự & Khoa phòng | **Mock-Only** | Màn hình `StaffManagement` và `DepartmentsManagement` đọc/ghi vào `localStorage`. | Admin | Viết API CRUD `/admin/staff` và `/admin/departments` kết nối các bảng có sẵn trong CSDL. |
| **AD-04** | Bộ chọn ngày xếp ca & Phân ca AI thực | **Partial** | Ngày lọc bị fix cứng `'2026-09-17'`, thiếu DatePicker; nút "Phân ca AI" chỉ là timer giả lập 1s. | Admin | Thêm DatePicker, xây dựng thuật toán phân ca AI tối ưu dựa trên số ca khám dự kiến. |
| **AD-05** | Truy xuất & Xuất file Nhật ký Kiểm toán | **Mock-Only** | `AuditLogs.tsx` dùng mảng tĩnh; nút Xuất CSV, Làm mới, Phân trang bị liệt; backend `audit.py` rỗng. | Admin, Thanh tra | Lập trình router `/admin/audit-logs` đọc bảng `audit_logs` thực tế và viết chức năng tải file CSV. |
| **AD-06** | Lưu Cấu hình Hệ thống & Sao lưu DB | **Partial** | 2 tab "Thông báo" và "Bảo mật" bị trắng toát; nút Lưu là fake alert; nút Sao lưu/Khôi phục bị liệt. | Admin, DevOps | Bổ sung component tab còn thiếu; tạo bảng `system_settings` và API tạo snapshot backup DB. |
| **AD-07** | Trung tâm Giám sát An toàn AI | **Missing (Route)** | `AISecurityCenter.tsx` có sẵn trong code nhưng không có route trong `App.tsx` và không có trên sidebar. | Admin | Đăng ký route `/admin/ai-security`, thêm vào sidebar và kết nối API thống kê Prompt Injection. |

---

## 2. PHÂN HỆ BÁC SĨ (DOCTOR MODULE)

| STT | Tên tính năng | Trạng thái hiện tại | Mô tả hiện trạng | Vai trò bị ảnh hưởng | Giải pháp đề xuất |
|:---:|---|:---:|---|---|---|
| **DC-01** | Cập nhật Bệnh án EMR dài | **Partial** | `update_consultation` nhận query param URL, bệnh án dài gây lỗi HTTP 414 URI Too Long. | Bác sĩ, Bệnh nhân | Đổi sang nhận Pydantic Request Body Model (`clinical_notes`, `treatment_plan`,...). |
| **DC-02** | Chọn mã chẩn đoán ICD-10 trong EMR | **Missing** | Giao diện EMR chưa có ô tra cứu/chọn mã ICD-10 từ bảng `diagnoses` sẵn có trong DB. | Bác sĩ | Thêm Combobox autocomplete tra cứu mã ICD-10 và lưu vào bảng `consultation_diagnoses`. |
| **DC-03** | Kê đơn thuốc gán đúng Bác sĩ | **Partial** | Backend query sai `Doctor.user_id` dẫn đến gán nhầm đơn thuốc cho bác sĩ đầu tiên trong DB. | Bác sĩ, Dược sĩ | Sửa câu truy vấn join qua `Staff.user_id` để lấy chính xác ID của Bác sĩ đang đăng nhập. |
| **DC-04** | Tìm kiếm danh sách Đơn thuốc | **Partial** | Ô input tìm kiếm trên đầu trang kê đơn thuốc thiếu `value` và `onChange` nên không gõ được. | Bác sĩ | Gắn state `searchTerm` vào input và lọc danh sách đơn thuốc theo tên bệnh nhân/mã đơn. |
| **DC-05** | Duyệt & Đánh dấu Đã đọc Xét nghiệm | **Partial** | Bấm "Đánh dấu Đã đọc" bị lỗi HTTP 422 do frontend gửi JSON body còn backend chờ query param. | Bác sĩ | Tạo DTO body cho endpoint `PATCH /lab-results/{id}/status`. |
| **DC-06** | Mẫu in Đơn thuốc chuẩn Bộ Y Tế | **Missing** | Nút In đơn thuốc gọi `window.print()` trực tiếp không có CSS định dạng mẫu đơn thuốc y tế chuẩn. | Bác sĩ, Bệnh nhân | Xây dựng template in ấn đơn thuốc khổ A4/A5 với tiêu đề phòng khám, mã đơn và chữ ký bác sĩ. |
| **DC-07** | Báo cáo Hiệu suất Khám của Bác sĩ | **Mock-Only** | Trang `DoctorReports.tsx` chứa các thẻ số liệu cứng tĩnh và biểu đồ placeholder chưa vẽ. | Bác sĩ | Viết API tổng hợp số ca khám, đơn thuốc và cận lâm sàng đã chỉ định của bác sĩ theo tuần/tháng. |

---

## 3. PHÂN HỆ LỄ TÂN (RECEPTIONIST MODULE)

| STT | Tên tính năng | Trạng thái hiện tại | Mô tả hiện trạng | Vai trò bị ảnh hưởng | Giải pháp đề xuất |
|:---:|---|:---:|---|---|---|
| **RC-01** | Màn hình Gọi số Công cộng tại Sảnh | **Missing** | Hàng đợi có trong DB nhưng chưa có màn hình giao diện toàn màn hình cho TV sảnh chờ. | Lễ tân, Bệnh nhân | Xây dựng route `/queue/display` tự động refresh danh sách số thứ tự đang khám và chờ khám. |
| **RC-02** | Chuông âm thanh gọi bệnh nhân vào phòng | **Missing** | Nút "Gọi khám" chỉ đổi trạng thái DB, không có chuông âm thanh hay giọng đọc số thứ tự. | Lễ tân, Bác sĩ | Tích hợp Web Audio API phát tiếng "Bính boong" và giọng đọc Web Speech API ("Mời số..."). |
| **RC-03** | Tiếp nhận Bệnh nhân vãng lai (Walk-in) | **Partial** | Bảng `queues` bắt buộc `appointment_id` không được null, vãng lai không bốc số được (DB error). | Lễ tân, Bệnh nhân | Sửa model `queues.appointment_id` thành `nullable=True`, hỗ trợ bốc số trực tiếp tại quầy. |
| **RC-04** | Mẫu in Phiếu thu Viện phí khổ POS mini | **Missing** | Nút in biên lai thu tiền chưa có CSS định dạng khổ giấy in nhiệt 80mm/58mm cho máy in bill. | Lễ tân, Bệnh nhân | Xây dựng CSS `@media print` cho phiếu thu tiền mặt/chuyển khoản khổ 80mm. |
| **RC-05** | Đặt lịch khám tại quầy không bị crash | **Partial** | Đặt lịch tại quầy crash do file `receptionist.py` import đè module `time` chuẩn của Python. | Lễ tân | Sửa `import time as time_module` hoặc dùng `datetime.time`. |

---

## 4. PHÂN HỆ BỆNH NHÂN (PATIENT PORTAL)

| STT | Tên tính năng | Trạng thái hiện tại | Mô tả hiện trạng | Vai trò bị ảnh hưởng | Giải pháp đề xuất |
|:---:|---|:---:|---|---|---|
| **PT-01** | Thanh toán Trực tuyến qua Cổng tự động | **Mock-Only** | Trang thanh toán chỉ hiển thị ảnh mã QR giả lập, chưa có Webhook đồng bộ tự động. | Bệnh nhân, Kế toán | Tích hợp Webhook PayOS/VNPay/MoMo sandbox tự động gạch nợ hóa đơn khi chuyển khoản thành công. |
| **PT-02** | Tải File PDF Kết quả Xét nghiệm thực tế | **Partial** | Nút "Xem file PDF / Ảnh" mở đường dẫn giả lập nếu phòng khám chưa tải file lên server. | Bệnh nhân, Bác sĩ | Xây dựng API upload/download file đính kèm lưu trữ trên server cục bộ hoặc S3. |
| **PT-03** | Đặt lịch khám qua AI Chat không bị crash | **Partial** | Bệnh nhân chat AI đặt lịch, khi bấm "Xác nhận đặt lịch" bị crash do sai kiểu tham số DTO. | Bệnh nhân | Sửa hàm `execute_tool` trong `ai_tool_registry.py` truyền đúng payload DTO cho `create_appointment`. |
| **PT-04** | Đổi ảnh đại diện & Cập nhật Dị ứng | **Partial** | Bệnh nhân cập nhật dị ứng thuốc và tiền sử bệnh nhưng form chưa có thông báo kiểm tra tương tác thuốc. | Bệnh nhân, Bác sĩ | Tích hợp cảnh báo tự động khi bác sĩ kê đơn có thành phần thuốc trùng với dị ứng của bệnh nhân. |
| **PT-05** | Hủy lịch hẹn kèm Lý do bắt buộc | **Real** | Đã hoạt động tốt qua API `appointmentsAPI.updateStatus`. Cần thêm bộ lọc theo trạng thái trên UI. | Bệnh nhân | Bổ sung các tab phân loại: Sắp tới, Lịch sử, Đã hủy rõ ràng hơn. |

---

## 5. PHÂN HỆ KẾ TOÁN (ACCOUNTANT MODULE)

| STT | Tên tính năng | Trạng thái hiện tại | Mô tả hiện trạng | Vai trò bị ảnh hưởng | Giải pháp đề xuất |
|:---:|---|:---:|---|---|---|
| **AC-01** | API Báo cáo Doanh thu & Dòng tiền Backend | **Missing** | Backend thiếu hoàn toàn router `/api/v1/reports`, frontend gọi `reportsAPI` trả về HTTP 404. | Kế toán, Giám đốc | Lập trình router `reports.py` với các endpoint `/stats`, `/revenue`, `/unpaid-aging`. |
| **AC-02** | Báo cáo Tài chính đúng nghiệp vụ Kế toán | **Mock-Only** | Trang `/reports` của Kế toán hiển thị tải CPU/RAM máy chủ IT thay vì doanh thu và công nợ. | Kế toán | Thiết kế lại giao diện Reports: Biểu đồ doanh thu theo chuyên khoa, theo phương thức, công nợ. |
| **AC-03** | In Hóa đơn Viện phí chi tiết | **Partial** | Nút "In" trong `BillingDetail.tsx` là dead button (thiếu sự kiện `onClick`). | Kế toán, Bệnh nhân | Gán hàm in và CSS template mẫu hóa đơn thu viện phí khổ A5 chuẩn tài chính. |
| **AC-04** | Thanh toán linh hoạt đa phương thức | **Partial** | Bấm "Nhận thanh toán" tự động thu tiền mặt 100% số dư; không cho chọn chuyển khoản/quẹt thẻ. | Kế toán, Bệnh nhân | Bổ sung Modal thu tiền cho phép chọn phương thức (Tiền mặt, Thẻ, Chuyển khoản) và thu từng phần. |

---

## 6. PHÂN HỆ AN TOÀN, BẢO MẬT & HỆ THỐNG (SECURITY & SYSTEM)

| STT | Tên tính năng | Trạng thái hiện tại | Mô tả hiện trạng | Vai trò bị ảnh hưởng | Giải pháp đề xuất |
|:---:|---|:---:|---|---|---|
| **SC-01** | Khắc phục IDOR Rò rỉ Dữ liệu qua AI Chat | **Critical Bug** | Bệnh nhân chưa map ID khi hỏi AI sẽ bị tự động fallback trả về hồ sơ của Bệnh nhân #1. | Toàn bộ Bệnh nhân | Xóa bỏ đoạn code fallback nguy hiểm trong `ai_tool_registry.py:1526`. |
| **SC-02** | Thu hồi quyền xem EMR của Kế toán | **Critical RBAC** | Kế toán viên không bị chặn khi xem hồ sơ bệnh án EMR của bệnh nhân tại `patients.py` và `emr.py`. | Toàn bộ Bệnh nhân | Chặn role `ACCOUNTANT` truy cập các endpoint chứa dữ liệu lâm sàng y tế nhạy cảm. |
| **SC-03** | Khóa và Thu hồi Refresh Token khi Logout | **Missing** | Người dùng đăng xuất chỉ xóa token ở trình duyệt; Refresh Token vẫn có hiệu lực 7 ngày trên server. | Toàn hệ thống | Xây dựng API `/auth/logout` lưu token bị thu hồi vào Blacklist bảng DB/Cache. |
| **SC-04** | Dọn dẹp Mã nguồn Thừa (Dead Code) | **Technical Debt** | Tồn tại ~210 KB code thừa các file `*ai_synthesizer.py` cũ không được import hay sử dụng. | Lập trình viên | Xóa các file thừa để mã nguồn tinh gọn, giảm kích thước gói triển khai. |

---

## 7. TỔNG KẾT TIẾN ĐỘ TÍNH NĂNG TOÀN DỰ ÁN
- **Tổng số tính năng được kiểm toán:** **31 tính năng**
- **Hoàn chỉnh (Real):** **11 tính năng** (35.5%)
- **Một phần (Partial):** **11 tính năng** (35.5%)
- **Chỉ có giao diện/Dữ liệu giả (Mock-Only):** **7 tính năng** (22.6%)
- **Chưa có hoàn toàn (Missing):** **2 tính năng** (6.4%)
- **Kết luận:** Khi hoàn thành 4 giai đoạn trong `IMPLEMENTATION_ROADMAP.md`, 100% các tính năng sẽ chuyển sang trạng thái **Real (Hoàn chỉnh)**.
