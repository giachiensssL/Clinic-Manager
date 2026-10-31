# BẢNG THEO DÕI TIẾN ĐỘ VÀ KIỂM TRA TOÀN DIỆN (CHECKLIST IMPLEMENTATION)
# AI CLINIC MANAGEMENT SYSTEM

> Cập nhật lần cuối: 31/10/2026
> Quy chuẩn trạng thái:
> - NOT STARTED: Chưa thực hiện.
> - IN PROGRESS: Đang thực hiện.
> - BLOCKED: Bị chặn do thiếu điều kiện.
> - COMPLETED: Đã hoàn thành và kiểm thử.
> - FAILED: Đã kiểm thử nhưng chưa đạt.

---

## 1. CHUẨN HÓA BỐ CỤC & DESIGN SYSTEM TOÀN HỆ THỐNG (PHẦN II)

| Hạng mục | Vị trí áp dụng | Yêu cầu kỹ thuật | Trạng thái |
| :--- | :--- | :--- | :---: |
| **Sửa lỗi căn giữa layout** | PatientLayout.tsx | Bỏ mx-auto max-w-7xl, content căn trái, full width làm việc | COMPLETED |
| **Sửa lỗi căn giữa layout** | DoctorLayout.tsx | Bỏ các class căn giữa, content căn trái, padding nhất quán | COMPLETED |
| **Sửa lỗi căn giữa layout** | ReceptionistLayout.tsx | Content căn trái, tận dụng toàn bộ chiều rộng làm việc sau sidebar | COMPLETED |
| **Sửa lỗi căn giữa layout** | AppLayout.tsx (Admin & Accountant) | Bỏ mx-auto ở container, chiếm trọn chiều rộng làm việc | COMPLETED |
| **Loại bỏ mx-auto max-w-* trang con** | Toàn bộ 40+ trang con của 5 tác nhân | Xóa bỏ max-w-4xl/5xl/6xl mx-auto, trải rộng căn trái chuẩn SaaS | COMPLETED |
| **Chuẩn hóa Page Header** | Toàn bộ các trang | Tiêu đề căn trái, mô tả ngắn, nút thao tác chính/phụ ở góc phải | COMPLETED |
| **Chuẩn hóa Table & Card** | Toàn bộ các trang | Border nhẹ, shadow-sm, table cuộn ngang khi cần, không tràn màn hình | COMPLETED |

---

## 2. KIỂM TRA & HOÀN THIỆN THEO TỪNG TÁC NHÂN (PHẦN III & IV)

### 2.1. ADMIN – QUẢN TRỊ VIÊN
| Trang | Chức năng | Giao diện | Nút bấm | API | Kiểm thử | Trạng thái |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| Dashboard | Thống kê tổng quan, thẻ KPI, biểu đồ doanh thu | Căn trái | Bộ lọc thời gian, xuất dữ liệu | GET /admin/stats | Đạt | COMPLETED |
| UserManagement | Danh sách tài khoản, tìm kiếm, lọc vai trò/trạng thái | Căn trái | Tạo mới, Sửa, Khóa/Mở khóa, Đặt lại mật khẩu | GET,POST,PUT /admin/users | Đạt | COMPLETED |
| RolesManagement | Ma trận vai trò và bảng phân quyền RBAC | Căn trái | Thêm vai trò, Lưu cấu hình phân quyền | GET,PUT /admin/roles | Đạt | COMPLETED |
| StaffManagement | Danh sách nhân viên, phòng ban, phân công | Căn trái | Thêm nhân viên mới, Sửa thông tin | State + Toast | Đạt | COMPLETED |
| DepartmentsManagement | Danh mục chuyên khoa phòng khám | Căn trái | Tạo chuyên khoa, Đổi trạng thái, Sửa | State + Toast | Đạt | COMPLETED |
| RoomsManagement | Danh mục phòng khám buồng bệnh | Căn trái | Thêm phòng, Gán chuyên khoa, Sửa | State + Toast | Đạt | COMPLETED |
| SchedulesManagement | Lịch phân ca làm việc của bác sĩ | Căn trái | Tạo ca, Xếp lịch tuần, AI Phân ca tự động | State + Toast | Đạt | COMPLETED |
| AuditLogs | Nhật ký an ninh & hoạt động hệ thống | Căn trái | Lọc hành động, Tìm kiếm log | GET /audit | Đạt | COMPLETED |
| SystemNotifications | Quản lý thông báo phát sóng hệ thống | Căn trái | Tạo thông báo, Gửi ngay | GET,POST /notifications | Đạt | COMPLETED |
| SystemSettings | Thông tin phòng khám, giờ làm việc, hotline | Căn trái | Lưu cấu hình hệ thống | GET,PUT /admin/settings | Đạt | COMPLETED |
| AIAdminWorkspace | Giám sát trạng thái AI, Guardrails, Model metrics | Căn trái | Test rule, Bật/Tắt guardrail | GET,POST /ai/admin | Đạt | COMPLETED |
| Reports | Phân tích tăng trưởng, doanh thu tổng thể | Căn trái | Lọc ngày, Xuất báo cáo Excel | GET /billing/reports | Đạt | COMPLETED |
| DoctorsList | Danh mục bác sĩ phòng khám | Căn trái | Tìm kiếm, Xem thông tin | GET /doctors | Đạt | COMPLETED |

### 2.2. BÁC SĨ (DOCTOR)
| Trang | Chức năng | Giao diện | Nút bấm | API | Kiểm thử | Trạng thái |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| DoctorDashboard | Thống kê ca khám hôm nay, hàng chờ, ca đang khám | Căn trái | Tiếp nhận ca, Mở EMR | GET /doctor/dashboard | Đạt | COMPLETED |
| DoctorAppointments | Danh sách lịch khám của bác sĩ, lọc ngày | Căn trái | Khám bệnh, Chuyển tiếp ca khám | GET /doctor/appointments | Đạt | COMPLETED |
| DoctorPatientsList | Danh sách bệnh nhân phụ trách, tìm kiếm | Căn trái | Xem hồ sơ, Lịch sử khám | GET /doctor/patients | Đạt | COMPLETED |
| DoctorPatientProfile | Chi tiết bệnh nhân, tiền sử, các lần khám trước | Căn trái | Tạo đợt khám mới | GET /doctor/patients/:id | Đạt | COMPLETED |
| DoctorEMR | Bệnh án điện tử: Khám, Sinh hiệu, Chẩn đoán, Phác đồ | Căn trái | Lưu nháp, Ký khóa bệnh án (Sign & Lock) | GET,POST,PUT /emr | Đạt | COMPLETED |
| DoctorPrescriptions | Kê đơn thuốc, tìm thuốc, chỉnh liều, hướng dẫn | Căn trái | Thêm thuốc, Lưu đơn, In đơn | GET,POST /prescriptions | Đạt | COMPLETED |
| DoctorLabResults | Chỉ định và xem kết quả cận lâm sàng/xét nghiệm | Căn trái | Tạo chỉ định, Xem kết quả, Đánh giá | GET,POST /lab-results | Đạt | COMPLETED |
| DoctorNotifications | Thông báo ca hẹn mới, kết quả xét nghiệm | Căn trái | Đánh dấu đã đọc, Lọc loại | GET /notifications | Đạt | COMPLETED |
| DoctorSettings | Thông tin bác sĩ, chứng chỉ, chuyên khoa | Căn trái | Cập nhật hồ sơ, Cài đặt thông báo, Đổi mật khẩu | GET,PUT /doctor/me, /auth | Đạt | COMPLETED |
| DoctorReports | Báo cáo hoạt động lâm sàng của bác sĩ | Căn trái | Lọc khoảng thời gian, Xuất báo cáo | GET /doctor/reports | Đạt | COMPLETED |
| DoctorAIAssistant | Trợ lý AI cố vấn y khoa lâm sàng | Căn trái | Gửi prompt, Stop, Copy, Regenerate | GET,POST /ai/chat/stream | Đạt | COMPLETED |

### 2.3. BỆNH NHÂN (PATIENT)
| Trang | Chức năng | Giao diện | Nút bấm | API | Kiểm thử | Trạng thái |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| PatientDashboard | Trang chủ bệnh nhân, lịch khám gần nhất, phím tắt | Căn trái | Đặt lịch nhanh, Xem lịch | GET /patients/me | Đạt | COMPLETED |
| PatientAppointments | Lịch hẹn của tôi (Sắp tới, Đã khám, Đã hủy) | Căn trái | Đặt lịch mới, Xem chi tiết, Hủy lịch kèm lý do | GET,PATCH /appointments | Đạt | COMPLETED |
| PatientAppointmentCreate | Quy trình đặt lịch: Dịch vụ -> Bác sĩ -> Ngày giờ -> Xác nhận | Căn trái | Bước tiếp theo, Quay lại, Đặt lịch | POST /appointments | Đạt | COMPLETED |
| PatientHealthRecord | Hồ sơ sức khỏe cá nhân, chẩn đoán, sinh hiệu | Căn trái | Xem chi tiết đợt khám, biểu đồ sinh hiệu | GET /emr/patient/:id | Đạt | COMPLETED |
| PatientPrescriptions | Đơn thuốc cá nhân, hướng dẫn liều dùng, nhắc uống thuốc | Căn trái | Xem chi tiết, Theo dõi đơn | GET /prescriptions | Đạt | COMPLETED |
| PatientLabResults | Kết quả xét nghiệm, chỉ số sinh hóa | Căn trái | Xem chi tiết phiếu kết quả | GET /lab-results | Đạt | COMPLETED |
| PatientPayments | Hóa đơn & Viện phí, thanh toán, lịch sử giao dịch | Căn trái | Thanh toán ngay, Xem chi tiết | GET,POST /billing | Đạt | COMPLETED |
| PatientNotifications | Thông báo nhắc lịch, cập nhật kết quả khám | Căn trái | Đánh dấu đã đọc, Lọc thông báo | GET /notifications | Đạt | COMPLETED |
| PatientProfile | Thông tin cá nhân, BHYT, người liên hệ khẩn cấp | Căn trái | Xem & Chỉnh sửa hồ sơ cá nhân hoàn chỉnh | GET,PUT /patients/me | Đạt | COMPLETED |
| PatientSettings | Cài đặt mật khẩu, tùy chọn SMS/Email, giao diện | Căn trái | Đổi mật khẩu, Tùy chọn thông báo, Đăng xuất | POST /auth/change-password | Đạt | COMPLETED |
| PatientAIAssistant | Trợ lý AI đồng hành chăm sóc sức khỏe | Căn trái | Gửi tin, Stop, Copy, Regenerate | GET,POST /ai/chat/stream | Đạt | COMPLETED |

### 2.4. LỄ TÂN (RECEPTIONIST)
| Trang | Chức năng | Giao diện | Nút bấm | API | Kiểm thử | Trạng thái |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| ReceptionistDashboard | Tổng quan lượt tiếp nhận hôm nay, buồng khám | Căn trái | Tiếp nhận nhanh, Cấp số | GET /receptionist/stats | Đạt | COMPLETED |
| ReceptionistAppointments | Quản lý lịch hẹn phòng khám, check-in bệnh nhân | Căn trái | Check-in, Đổi lịch, Hủy lịch | GET,PUT /receptionist/apts | Đạt | COMPLETED |
| ReceptionistAppointmentCreate | Đặt lịch hẹn mới cho bệnh nhân đến trực tiếp | Căn trái | Tìm BN, Chọn BS, Xác nhận | POST /appointments | Đạt | COMPLETED |
| ReceptionistPatients | Danh bạ bệnh nhân, tìm kiếm BN001, tên, SĐT | Căn trái | Thêm bệnh nhân mới, Sửa | GET,POST /patients | Đạt | COMPLETED |
| ReceptionistPatientProfile | Hồ sơ hành chính bệnh nhân, lịch sử tiếp nhận | Căn trái | Cập nhật hành chính | GET /patients/:id | Đạt | COMPLETED |
| ReceptionistQueue | Hàng đợi cấp số thứ tự, gọi vào phòng khám | Căn trái | Gọi số, Chuyển phòng, Hoàn tất | GET,POST /receptionist/queue | Đạt | COMPLETED |
| ReceptionistPayments | Quầy thu ngân: Thu viện phí, in hóa đơn | Căn trái | Xác nhận thu tiền, In phiếu | GET,POST /billing/pay | Đạt | COMPLETED |
| ReceptionistHealthRecords | Tra cứu thông tin lượt khám hành chính | Căn trái | Tìm kiếm, Xem tổng quan | GET /receptionist/visits | Đạt | COMPLETED |
| ReceptionistNotifications | Cảnh báo bệnh nhân chờ quá 30 phút, thông báo ca | Căn trái | Đánh dấu đã đọc | GET /notifications | Đạt | COMPLETED |
| ReceptionistSettings | Cài đặt tài khoản lễ tân & đổi mật khẩu | Căn trái | Cập nhật thông tin, Đổi mật khẩu | GET,POST /auth/change-password | Đạt | COMPLETED |
| ReceptionistAI | AI hỗ trợ điều phối sảnh và lịch trực bác sĩ | Căn trái | Gửi tin, Stop, Copy, Regenerate | GET,POST /ai/chat/stream | Đạt | COMPLETED |

### 2.5. KẾ TOÁN (ACCOUNTANT)
| Trang | Chức năng | Giao diện | Nút bấm | API | Kiểm thử | Trạng thái |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| BillingList | Quản lý hóa đơn, công nợ, trạng thái thanh toán | Căn trái | Ghi nhận thanh toán, Lọc, Xuất danh sách | GET,POST /billing | Đạt | COMPLETED |
| BillingDetail | Chi tiết dịch vụ tính phí, lịch sử trả tiền, hoàn tiền | Căn trái | Thanh toán, Hoàn tiền, In | GET,POST /billing/:id | Đạt | COMPLETED |
| Reports | Báo cáo tài chính, doanh thu theo bác sĩ/khoa | Căn trái | Lọc theo ngày, Xuất Excel | GET /billing/reports | Đạt | COMPLETED |
| AccountantAI | AI trợ lý tài chính & kiểm soát công nợ | Căn trái | Gửi tin, Stop, Copy, Regenerate | GET,POST /ai/chat/stream | Đạt | COMPLETED |

---

## 3. KIỂM TRA ĐỒNG BỘ ĐA TÁC NHÂN (END-TO-END FLOWS)

| Quy trình nghiệp vụ | Các tác nhân tham gia | Luồng trạng thái dữ liệu | Kiểm thử | Trạng thái |
| :--- | :--- | :--- | :---: | :---: |
| **Quy trình Đặt lịch** | Bệnh nhân -> Lễ tân -> Bác sĩ | scheduled -> Lễ tân thấy trong danh sách -> Bác sĩ thấy trong lịch làm việc | Đạt | COMPLETED |
| **Quy trình Tiếp nhận & Khám** | Lễ tân -> Bác sĩ | waiting (Lễ tân check-in) -> Bác sĩ gọi in_consultation -> Hoàn thành completed | Đạt | COMPLETED |
| **Quy trình Kê đơn & EMR** | Bác sĩ -> Bệnh nhân | Bác sĩ ký EMR & tạo đơn -> Bệnh nhân thấy ngay trong Prescriptions & HealthRecord | Đạt | COMPLETED |
| **Quy trình Thu viện phí** | Bác sĩ -> Kế toán / Lễ tân -> Bệnh nhân | Bác sĩ chỉ định -> Hóa đơn unpaid -> Thu tiền thành paid -> Bệnh nhân thấy hóa đơn đã trả | Đạt | COMPLETED |

---

## 4. TIÊU CHUẨN RESPONSIVE & BUILD VERIFICATION

- [x] Desktop 1920px (Không căn giữa hẹp, nội dung căn trái tự nhiên, tận dụng toàn bộ chiều rộng làm việc)
- [x] Desktop 1440px (Bố cục chuẩn SaaS, lưới card/table co giãn linh hoạt)
- [x] Laptop 1366px / 1280px (Không tràn ngang, table có thanh cuộn ngang khi cần)
- [x] Tablet (Sidebar drawer đóng/mở mượt mà)
- [x] Mobile (Navigation responsive, menu hamburger)
- [x] npx tsc -b đạt 0 lỗi (Strict TypeScript build)
- [x] npm run build hoàn thành thành công trong 1.72s
