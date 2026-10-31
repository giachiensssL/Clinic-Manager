# BÁO CÁO KIỂM TOÁN TOÀN DIỆN HỆ THỐNG PHÒNG KHÁM THÔNG MINH (AI CLINIC MANAGEMENT SYSTEM)

**Thời điểm kiểm toán:** Ngày 31 tháng 10 năm 2026  
**Chế độ kiểm toán:** STRICT AUDIT & PLANNING ONLY (Tuyệt đối không sửa mã nguồn dự án)  
**Phạm vi kiểm toán:** Toàn bộ Frontend (React/TypeScript), Backend (FastAPI), Database (SQLite/PostgreSQL), AI Chat System (Gemini Tool Calling) và 5 vai trò người dùng (Admin, Bác sĩ, Lễ tân, Bệnh nhân, Kế toán).

---

## 1. TỔNG QUAN HỆ THỐNG VÀ NGĂN XẾP CÔNG NGHỆ (TECH STACK)

### 1.1. Kiến trúc Frontend
- **Framework & Bundler:** React 18, TypeScript, Vite.
- **Quản lý Định tuyến:** React Router DOM v6 với 4 Layout chính:
  - `AppLayout.tsx`: Dành cho Quản trị viên (Admin) và Kế toán (Accountant), hỗ trợ submenu đa cấp (Users, Clinic, Reports, System).
  - `DoctorLayout.tsx`: Dành riêng cho Bác sĩ (`/doctor/*`), sidebar 10 mục điều hướng lâm sàng.
  - `ReceptionistLayout.tsx`: Dành riêng cho Lễ tân (`/receptionist/*`), sidebar 10 mục tiếp đón, hàng đợi, thu ngân.
  - `PatientLayout.tsx` & `PatientSidebar.tsx`: Cổng thông tin Bệnh nhân (`/portal/*`), 10 mục quản lý hồ sơ cá nhân, lịch hẹn, kết quả và thanh toán.
- **Quản lý Trạng thái & Dữ liệu:**
  - `authStore` (Zustand): Lưu trữ User Session, Token, Role, và Avatar.
  - `@tanstack/react-query`: Dùng cho đồng bộ dữ liệu server tại phân hệ Hóa đơn (Billing), Lịch hẹn (Appointments), và Hàng đợi (Queue).
  - `Axios Interceptor` (`api.ts`): Tự động gắn Bearer Token và cơ chế Refresh Token xoay vòng tự động khi gặp lỗi HTTP 401.
- **Thư viện UI & Trực quan hóa:**
  - Radix UI primitives (`@/components/ui/*`), TailwindCSS, Lucide React icons, React Hot Toast.
  - `Recharts`: Vẽ biểu đồ diện tích, biểu đồ cột, biểu đồ tròn và biểu đồ đường cho Báo cáo & Thống kê.

### 1.2. Kiến trúc Backend
- **Framework:** FastAPI (Python 3.10+ async/await).
- **ORM & CSDL:** SQLAlchemy 2.0 Async (hỗ trợ kép `asyncpg` cho PostgreSQL và `aiosqlite` cho SQLite cục bộ với chế độ WAL `NullPool`).
- **Xác thực & Bảo mật:**
  - JWT (JSON Web Token) với thuật toán ký `HS256`.
  - Hashing mật khẩu bằng `Passlib/Bcrypt`.
  - Phân quyền RBAC qua các FastAPI dependency: `get_current_user`, `get_admin`, `get_doctor`, `get_clinical_doctor`, `get_receptionist`, `get_accountant`, `get_staff`.
- **Hệ thống AI Generative & Tool Calling:**
  - Tích hợp Google Gemini 2.5 Flash / 1.5 Flash (`google-generativeai`).
  - Hỗ trợ Native Function / Tool Calling với định dạng chuẩn OpenAPI schema.
  - Cơ chế xoay vòng khóa API tự động (`GeminiKeyManager`) với Cooldown 30s khi chạm ngưỡng rate limit hoặc HTTP 429 Quota Exhausted.
  - Hỗ trợ phản hồi Streaming qua Server-Sent Events (`/api/v1/ai/chat/stream`).
  - Medical Guardrails (InputGuardrail, OutputGuardrail) ngăn chặn Prompt Injection và tự ý chẩn đoán ngoài phạm vi.

### 1.3. Trạng thái Vận hành Hiện tại (Services Operating State)
- **FastAPI Backend:** Đang chạy ngầm ổn định tại `http://127.0.0.1:8000` (PID Task 1672), endpoint `/health` trả về HTTP 200 OK.
- **Vite Frontend:** Đang chạy ngầm ổn định tại `http://localhost:5173` (PID Task 1674), phản hồi HTTP 200 OK.
- **Cơ sở dữ liệu:** Tệp CSDL SQLite `clinic.db` (~1.5 MB) với đầy đủ 25 bảng quan hệ và dữ liệu thực tế đang hoạt động.

---

## 2. BÁO CÁO KIỂM TOÁN TỪNG VAI TRÒ (ROLE-BASED DETAILED AUDIT)

### 2.1. Phân hệ Quản trị viên (Admin)
- **Quản lý Tài khoản (`/admin/users`):**
  - *Đã hoạt động thực tế:* Tải danh sách người dùng (`GET /admin/users`), tạo tài khoản mới vào DB (`POST /admin/users`), khóa/mở khóa tài khoản (`PUT /admin/users/{id}/status`).
  - *Khiếm khuyết:* Nút "Đổi mật khẩu" và "Chỉnh sửa" chỉ bắn toast notification ảo, chưa có API backend. Số điện thoại nhập ở modal không được lưu vào bảng `staff`/`users`. Lọc và tìm kiếm thực hiện thuần client-side trên mảng bộ nhớ.
- **Vai trò & Phân quyền (`/admin/roles`):**
  - *Khiếm khuyết nghiêm trọng:* 100% Mock State trong bộ nhớ RAM (`initialPermissions`). Thêm vai trò mới hay bật tắt quyền bị mất sạch khi F5. Dùng `window.alert()` thô sơ. Chưa có bảng RBAC động trong CSDL.
- **Nhân sự, Khoa phòng, Buồng khám (`/admin/staff`, `/admin/departments`, `/admin/rooms`):**
  - *Khiếm khuyết:* Lưu trữ tạm vào `localStorage` của trình duyệt thay vì lưu vào DB. Bảng `rooms` hoàn toàn chưa tồn tại trong schema CSDL backend `models.py`. Dropdown chọn khoa ở trang Phòng khám bị lệch dữ liệu nếu có khoa mới được tạo.
- **Lịch làm việc (`/admin/schedules`):**
  - *Khiếm khuyết nghiêm trọng:* Ngày lọc bị hardcode cứng `'2026-09-17'`, không có bộ chọn ngày (`DatePicker`). Nút "Phân ca tự động bằng AI" chỉ là fake timer `setTimeout(1000ms)`. Cảnh báo trùng lịch bị viết cứng tĩnh trong code JSX.
- **Nhật ký Kiểm toán (`/admin/audit-logs`):**
  - *Khiếm khuyết:* Dữ liệu mock tĩnh; nút "Làm mới", "Xuất CSV" và các nút phân trang (1, 2, Trước, Sau) đều là nút chết (dead buttons không có sự kiện `onClick`). Backend file `audit.py` hiện tại là file rỗng (12 bytes).
- **Cấu hình Hệ thống (`/admin/settings`):**
  - *Khiếm khuyết nghiêm trọng:* Hai tab "Thông báo" và "Bảo mật" bị thiếu thẻ `<TabsContent>`, click vào bị màn hình trắng toát. Nút "Lưu cài đặt" chỉ hiển thị `alert()` giả lập sau 800ms. Các nút Sao lưu/Khôi phục là nút chết.
- **Trung tâm Giám sát An toàn AI (`AISecurityCenter.tsx`):**
  - *Khiếm khuyết:* File bị bỏ quên (Orphaned Code) — không được đăng ký route trong `App.tsx` và không có liên kết trên menu navigation. 100% dữ liệu cứng tĩnh.

### 2.2. Phân hệ Bác sĩ (Doctor)
- **Dashboard Bác sĩ (`/doctor`):** Hoạt động tốt với số liệu thực từ API (`doctorAPI.getDashboardStats`, `doctorAPI.getTodayAppointments`).
- **Lịch hẹn Bác sĩ (`/doctor/appointments`):** Xem lịch khám thực, chuyển trạng thái khám bệnh hoạt động tốt. Thiếu bộ lọc theo khoảng ngày linh hoạt.
- **Bệnh án điện tử EMR (`/doctor/emr`):**
  - *Khiếm khuyết P0:* Endpoint backend `update_consultation` nhận tham số qua Query Parameters URL thay vì Request Body JSON. Nếu bác sĩ ghi bệnh án dài, hệ thống sẽ báo lỗi HTTP 414 URI Too Long và mất toàn bộ nội dung bệnh án!
  - Chưa tích hợp tra cứu mã ICD-10 từ bảng `diagnoses` có sẵn trong CSDL.
- **Kê đơn thuốc (`/doctor/prescriptions`):**
  - *Khiếm khuyết P1:* Backend query `Doctor.user_id` thay vì join qua `Staff.user_id`, khiến đơn thuốc có thể bị gán nhầm cho bác sĩ đầu tiên trong CSDL nếu ID không khớp.
  - Ô tìm kiếm đơn thuốc trên đầu bảng thiếu sự kiện `onChange` (không gõ tìm kiếm được).
  - Nút In đơn thuốc gọi `window.print()` thiếu CSS định dạng mẫu đơn thuốc y tế khổ chuẩn A4/A5.
- **Chỉ định & Kết quả Xét nghiệm (`/doctor/lab-results`):**
  - *Khiếm khuyết P0:* Nút "Đánh dấu Đã đọc" gọi `axios.patch('/api/v1/lab-results/' + id + '/status', { status: 'completed' })` (gửi JSON Body), nhưng backend `lab_results.py` lại khai báo `new_status: str` là Query Parameter -> Bác sĩ nhấn nút sẽ bị lỗi **HTTP 422 Unprocessable Entity**!

### 2.3. Phân hệ Lễ tân (Receptionist)
- **Hàng đợi khám bệnh (`/receptionist/queue`):** Đã kết nối bảng `queues` trong CSDL, tăng số thứ tự tự động. Thiếu màn hình hiển thị công cộng tại sảnh (Public Display Screen) và thiếu chuông âm thanh phát loa khi gọi số.
- **Tiếp đón & Check-in (`/receptionist/appointments`):** Tiếp đón và check-in chuyển trạng thái sang `waiting` và sinh số thứ tự thành công. Tuy nhiên nút check-in có chứa lệnh `window.location.reload()` gây tải lại toàn trang không cần thiết.
- **Thu phí tại quầy (`/receptionist/payments`):** Xử lý thanh toán viện phí tốt qua `receptionistApi.processPayment`. Thiếu mẫu in phiếu thu nhiệt POS mini 80mm/58mm.

### 2.4. Phân hệ Bệnh nhân (Patient Portal)
- **Đặt lịch trực tuyến (`/portal/appointments/create`):** Wizard 5 bước kết nối dữ liệu bác sĩ và khung giờ trống thực tế từ database rất mượt mà.
- **Hồ sơ sức khỏe & Xét nghiệm (`/portal/health-record`, `/portal/lab-results`):** Xem được lịch sử điều trị và kết quả cận lâm sàng của chính mình. Nút tải file PDF xét nghiệm chưa kết nối kho lưu trữ file thực tế.
- **Thanh toán trực tuyến (`/portal/payments`):** Chỉ hiển thị mã QR mô phỏng, chưa tích hợp Webhook đồng bộ tự động với cổng thanh toán điện tử (VNPay/MoMo/PayOS).

### 2.5. Phân hệ Kế toán (Accountant)
- **Danh sách Hóa đơn (`/billing`):** Kết nối API thực tế `billingAPI.getAll`, tự động tính toán phí khám, tiền thuốc, dịch vụ, BHYT, chiết khấu và lập hóa đơn mới trực tiếp vào DB. Thiếu bộ lọc theo trạng thái hóa đơn và khoảng thời gian.
- **Chi tiết Hóa đơn (`/billing/:id`):** Nút "In hóa đơn" không có sự kiện `onClick`. Nút "Nhận thanh toán" tự động thu toàn bộ số dư bằng tiền mặt mà không cho kế toán chọn hình thức chuyển khoản hay thu từng phần.
- **Báo cáo Thống kê (`/reports`):**
  - *Khiếm khuyết nghiêm trọng P1:* Backend **hoàn toàn chưa có router `/api/v1/reports`**, gọi API sẽ bị lỗi HTTP 404.
  - *Lệch nghiệp vụ:* Trang `/reports` của Kế toán lại hiển thị thông số CPU/RAM máy chủ IT thay vì biểu đồ doanh thu tài chính, dòng tiền và công nợ phòng khám. Nút "Xuất báo cáo" không hoạt động.

---

## 3. MA TRẬN TỔNG HỢP LỖI & RỦI RO ĐÃ XÁC MINH (VERIFIED DEFECTS MATRIX)

| Mã lỗi | Phân hệ | Mức độ | Mô tả chi tiết khiếm khuyết | Tác động thực tế | Nguyên nhân gốc rễ | Trạng thái |
|---|---|---|---|---|---|---|
| **DEF-001** | Bác sĩ / Lab Results | **P0 - Khẩn cấp** | Nút "Đánh dấu Đã đọc" xét nghiệm bị lỗi HTTP 422 | Bác sĩ không cập nhật được trạng thái xét nghiệm | Frontend gửi JSON body `{status}`, backend chờ query param `new_status` | Đã xác minh |
| **DEF-002** | Bác sĩ / EMR | **P0 - Khẩn cấp** | Endpoint cập nhật EMR nhận qua Query Params | Bệnh án dài bị lỗi HTTP 414 URI Too Long, mất dữ liệu | Chưa khai báo Pydantic Body Model cho `PUT /emr/{id}` | Đã xác minh |
| **DEF-003** | Kế toán / Reports | **P1 - Nghiêm trọng**| Thiếu router backend `/api/v1/reports` | Gọi API báo cáo trả về HTTP 404 Not Found | Chưa lập trình file router `reports.py` trong backend | Đã xác minh |
| **DEF-004** | Admin / Settings | **P1 - Nghiêm trọng**| Tab "Thông báo" và "Bảo mật" trong Cài đặt bị trắng trang | Admin không thể cấu hình thông báo và bảo mật | Thiếu component `TabsContent` tương ứng trong JSX | Đã xác minh |
| **DEF-005** | Admin / Security | **P1 - Nghiêm trọng**| Trang `AISecurityCenter.tsx` bị mồ côi | Không giám sát được Prompt Injection và Guardrails | Không khai báo Route trong `App.tsx` và menu `AppLayout.tsx` | Đã xác minh |
| **DEF-006** | Bác sĩ / Prescriptions | **P1 - Nghiêm trọng**| Lỗi truy vấn gán sai bác sĩ trong tạo đơn thuốc | Đơn thuốc có thể bị gán cho bác sĩ đầu tiên trong DB | Backend query `Doctor.user_id` thay vì join qua `Staff.user_id` | Đã xác minh |
| **DEF-007** | Admin / Rooms | **P1 - Nghiêm trọng**| Chưa có bảng `rooms` trong CSDL backend | Dữ liệu phòng khám chỉ lưu tạm ở trình duyệt (localStorage) | Thiếu model `Room` trong `models.py` và thiếu API CRUD | Đã xác minh |
| **DEF-008** | Admin / Roles | **P1 - Nghiêm trọng**| Ma trận phân quyền chỉ lưu state | Đổi quyền người dùng không có hiệu lực thực tế | Thiếu bảng phân quyền động trong CSDL | Đã xác minh |
| **DEF-009** | Admin / Schedules | **P1 - Nghiêm trọng**| Ngày xếp ca bị fix cứng `'2026-09-17'`, nút AI là fake | Không thể quản lý lịch làm việc của các ngày khác | Hardcode biến state `dateFilter`, thiếu DatePicker | Đã xác minh |
| **DEF-010** | Bác sĩ / Prescriptions | **P2 - Vừa** | Ô tìm kiếm đơn thuốc bị tê liệt không gõ được | Bác sĩ không thể lọc tìm nhanh đơn thuốc cũ | Thiếu state gắn vào `onChange` và `value` của thẻ input | Đã xác minh |
| **DEF-011** | Kế toán / Billing Detail | **P2 - Vừa** | Nút in hóa đơn không chạy, thanh toán ép cứng tiền mặt | Kế toán không in được hóa đơn và không chọn được hình thức thu tiền | Thiếu window.print template và thiếu modal thu tiền chi tiết | Đã xác minh |
| **DEF-012** | Admin / Audit Logs | **P2 - Vừa** | Nút Xuất CSV, Làm mới, Phân trang là Dead Buttons | Admin không trích xuất được file nhật ký kiểm toán | Thiếu hàm xử lý và backend `audit.py` đang rỗng | Đã xác minh |
| **DEF-013** | Kế toán / Reports | **P2 - Vừa** | Báo cáo Kế toán hiển thị thông số CPU/RAM máy chủ | Kế toán không theo dõi được doanh thu và dòng tiền | Sai persona thiết kế trang báo cáo kế toán | Đã xác minh |
| **DEF-014** | Lễ tân / Queue | **P2 - Vừa** | Thiếu màn hình gọi số công cộng và âm thanh gọi loa | Bệnh nhân không biết khi nào đến lượt khám | Chưa xây dựng màn hình Public Display Screen | Đã xác minh |
| **DEF-015** | Toàn hệ thống | **P2 - Vừa** | Thiếu template in ấn chuẩn y tế cho đơn thuốc và phiếu thu | Bản in vỡ layout, không đạt quy chuẩn mẫu biểu y tế | Chưa tạo CSS `@media print` cho phiếu thu và đơn thuốc | Đã xác minh |
| **DEF-016** | Bệnh nhân / Payments | **P3 - Nhẹ** | Thanh toán trực tuyến chỉ hiển thị QR mô phỏng | Bệnh nhân chưa thể thanh toán tự động qua cổng thanh toán | Chưa tích hợp Webhook cổng thanh toán trực tuyến | Đã xác minh |

---

## 4. ĐÁNH GIÁ MỨC ĐỘ SẴN SÀNG HỆ THỐNG (SYSTEM READINESS ASSESSMENT)
- **Tỷ lệ sẵn sàng hiện tại (System Readiness Score):** **72%**
- **Đánh giá tổng thể:** Kiến trúc tổng thể của hệ thống rất tốt, phân tách vai trò rõ ràng, CSDL thiết kế chuẩn hóa cao, hệ thống AI Tool Calling hoạt động thông minh trên dữ liệu thực tế. Tuy nhiên, hệ thống còn tồn tại một số điểm gãy nghiêm trọng giữa Frontend và Backend (HTTP 422, HTTP 414, các trang dùng localStorage, thiếu route và thiếu router Reports).
- **Kết luận:** Hệ thống cần triển khai khắc phục theo đúng lộ trình Roadmap ưu tiên (P0 -> P1 -> P2 -> P3) để đạt mức độ sẵn sàng 100% cho môi trường vận hành thực tế.
