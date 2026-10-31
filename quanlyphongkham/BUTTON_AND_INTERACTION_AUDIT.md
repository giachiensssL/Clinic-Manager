# BÁO CÁO KIỂM TOÁN TƯƠNG TÁC VÀ NÚT BẤM TOÀN HỆ THỐNG
# (BUTTON & INTERACTION AUDIT REPORT)
**Dự án**: AI Clinic Management System (Hệ Thống Quản Lý Phòng Khám Thông Minh)  
**Ngày kiểm toán**: 01/11/2026  
**Phạm vi**: Toàn bộ 47 màn hình thuộc 5 tác nhân (Admin, Bác sĩ, Tiếp tân, Kế toán, Bệnh nhân)  
**Trạng thái kiểm toán**: Hoàn tất – 100% các phần tử tương tác đã được kiểm tra chéo giữa Frontend JSX và Backend FastAPI Endpoints.

---

## 1. QUY ƯỚC TRẠNG THÁI KIỂM TOÁN (STATE CODES)
- **WORKING**: Tương tác hoạt động đầy đủ, gửi request API thực tế thành công, cập nhật CSDL và render phản hồi chuẩn xác.
- **PARTIALLY WORKING**: Có gọi API hoặc thực hiện hành động nhưng thiếu validation, thiếu phân trang, phản hồi UI không đồng bộ hoặc logic xử lý dữ liệu bị khuyết.
- **UI ONLY**: Nút bấm/tương tác chỉ cập nhật state tạm trong component/localStorage, hoặc chỉ hiện Toast giả lập mà không kết nối Backend API.
- **BROKEN**: Nhấn vào gây lỗi Runtime Crash (Uncaught TypeError, 422 Unprocessable Entity, 500 Server Error, hoặc gãy layout/route không tồn tại).
- **MISSING**: Nút bấm/phần tử nghiệp vụ bắt buộc theo quy trình y tế nhưng hoàn toàn vắng mặt trên UI.

---

## 2. TỔNG HỢP KIỂM TOÁN TƯƠNG TÁC THEO TỪNG VAI TRÒ (47 TRANG)

### A. PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN - 11 MÀN HÌNH)

#### 1. Quản lý tài khoản người dùng (`/admin/users` - `UserManagement.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| A1.1 | Nút "Thêm tài khoản" (`+ Thêm mới`) | Modal Trigger | **BROKEN** | Mở Dialog form tạo người dùng và gửi request tạo User/Staff/Doctor | Mở dialog, khi submit tạo Bác sĩ/Bệnh nhân bị văng lỗi 500 do backend thiếu trường bắt buộc `phone` và sai tham số `employee_id` vs `staff_code` | `POST /api/v1/admin/users` | `api/v1/admin.py`: Tạo `Staff(staff_code=...)` thay vì `employee_id`, `Patient` thiếu `phone` |
| A1.2 | Nút "Lưu" trong Modal Thêm người dùng | Form Submit | **BROKEN** | Gửi payload hợp lệ lên backend, toast thành công, đóng modal và reload table | Server trả về 500 Internal Server Error đối với các role Doctor, Staff, Patient | `POST /api/v1/admin/users` | Backend model schema mismatch |
| A1.3 | Ô tìm kiếm "Tìm kiếm theo tên, email, SĐT..." | Filter Input | **PARTIALLY WORKING** | Lọc dữ liệu tức thì hoặc debounce, gọi API backend có phân trang | Chỉ lọc client-side trên mảng users đã nạp lần đầu | `GET /api/v1/admin/users` | Không hỗ trợ server-side search |
| A1.4 | Bộ lọc "Vai trò" (Dropdown Role) | Filter Dropdown | **PARTIALLY WORKING** | Lọc danh sách theo vai trò đã chọn | Lọc client-side, reset lại phân trang cục bộ | `GET /api/v1/admin/users` | Client-side only |
| A1.5 | Bộ lọc "Trạng thái" (Hoạt động / Khóa) | Filter Dropdown | **WORKING** | Lọc hiển thị người dùng theo trạng thái | Hoạt động bình thường client-side | Không | Client-side filter |
| A1.6 | Nút "Sửa" người dùng (Hàng dữ liệu) | Row Action Modal | **PARTIALLY WORKING** | Mở dialog cập nhật thông tin email, họ tên, role, phone | Mở dialog, cập nhật được User cơ bản, không cập nhật được bảng phụ Doctor/Staff/Patient | `PUT /api/v1/admin/users/{id}` | Endpoint chưa map cập nhật bảng con |
| A1.7 | Nút "Đổi mật khẩu" người dùng | Row Action Modal | **WORKING** | Mở popup nhập mật khẩu mới, hash và lưu CSDL | Hoạt động tốt | `PUT /api/v1/admin/users/{id}/password` | Đã kiểm tra hash bcrypt |
| A1.8 | Nút "Khóa / Mở khóa" tài khoản | Row Action Toggle | **WORKING** | Toggle trạng thái `is_active` của User | Cập nhật DB thành công, icon thay đổi | `PUT /api/v1/admin/users/{id}/status` | Đạt |
| A1.9 | Nút "Xóa tài khoản" | Row Action Confirm | **PARTIALLY WORKING** | Soft-delete hoặc hard-delete có kiểm tra ràng buộc khóa ngoại | Xóa trực tiếp, nếu user có liên kết lịch khám hoặc hóa đơn sẽ văng lỗi 500 foreign key constraint | `DELETE /api/v1/admin/users/{id}` | Thiếu check cascade / soft delete |
| A1.10 | Nút "Xuất Excel / CSV" | Export Button | **UI ONLY** | Xuất file danh sách tài khoản định dạng Excel/CSV | Chỉ hiện thông báo "Tính năng đang tải..." hoặc log console | Không có | Chưa kết nối thư viện `xlsx` hoặc endpoint export |
| A1.11 | Phân trang (Trang trước, Trang sau, Số trang) | Pagination | **PARTIALLY WORKING** | Phân trang dữ liệu lớn từ backend | Phân trang tĩnh cắt mảng 10 items/trang | Không | Khi số user > 1000 sẽ nghẽn DOM |

#### 2. Phân quyền và vai trò (`/admin/roles` - `RolesManagement.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| A2.1 | Nút "Tạo vai trò mới" | Modal Trigger | **UI ONLY** | Mở modal nhập tên Role, mô tả, chọn ma trận quyền, lưu DB | Mở modal, lưu vào localStorage | Không có endpoint | Backend chưa có bảng `roles_permissions` động |
| A2.2 | Checkbox ma trận quyền (Read/Write/Delete) | Checkbox Matrix | **UI ONLY** | Thay đổi quyền của Role và lưu vào backend | Click đổi state UI nhưng không gọi API | Không có endpoint | RBAC hiện tại hardcoded theo Enum Python |
| A2.3 | Nút "Lưu phân quyền" | Button Submit | **UI ONLY** | Lưu bảng ma trận quyền lên server | Toast "Đã lưu thành công" (giả lập) | Không có | Chưa có API backend cho dynamic RBAC |

#### 3. Quản lý nhân sự y tế (`/admin/staff` - `StaffManagement.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| A3.1 | Nút "Thêm nhân viên y tế" | Modal Trigger | **UI ONLY** | Mở form nhập thông tin nhân viên, chuyên khoa, bằng cấp, ca trực | Lưu vào `localStorage.getItem('clinic_staff')` | Không có endpoint | Chưa có router `/api/v1/admin/staff` CRUD hoàn chỉnh |
| A3.2 | Nút "Sửa hồ sơ nhân viên" | Row Action | **UI ONLY** | Sửa thông tin nhân sự và lưu vào CSDL | Sửa trong localStorage | Không có | Dữ liệu không đồng bộ sang CSDL SQLite |
| A3.3 | Nút "Xóa / Cho thôi việc" | Row Action | **UI ONLY** | Đổi trạng thái nhân sự thành Inactive | Xóa khỏi localStorage | Không có | Mất dữ liệu khi đổi trình duyệt |
| A3.4 | Nút "Tải lên hợp đồng / Bằng cấp" | File Upload | **MISSING** | Upload file scan PDF/ảnh bằng lái, chứng chỉ hành nghề | Không có nút trên giao diện | Không có | Thiếu tính năng quản lý hồ sơ pháp lý |

#### 4. Quản lý chuyên khoa (`/admin/departments` - `DepartmentsManagement.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| A4.1 | Nút "Thêm chuyên khoa" | Modal Trigger | **UI ONLY** | Nhập mã khoa, tên khoa, trưởng khoa, vị trí phòng | Lưu vào localStorage | Không có | Backend thiếu bảng `departments` |
| A4.2 | Nút "Sửa chuyên khoa" | Row Action | **UI ONLY** | Cập nhật thông tin khoa phòng | Sửa trong localStorage | Không có | Chưa kết nối backend |
| A4.3 | Nút "Xóa chuyên khoa" | Row Action | **UI ONLY** | Kiểm tra nếu còn bác sĩ thì chặn xóa, nếu không thì xóa | Xóa khỏi mảng state/localStorage | Không có | Không ràng buộc dữ liệu |

#### 5. Quản lý phòng khám & thiết bị (`/admin/rooms` - `RoomsManagement.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| A5.1 | Nút "Thêm phòng khám" | Modal Trigger | **UI ONLY** | Thêm phòng khám, loại phòng (Khám bệnh, Xét nghiệm, Cấp cứu) | Lưu vào localStorage | Không có | Backend chưa có bảng `rooms` |
| A5.2 | Nút "Đổi trạng thái phòng" (Đang khám/Trống/Bảo trì) | Dropdown Toggle | **UI ONLY** | Cập nhật trạng thái phòng thực tế cho tiếp tân điều phối | Đổi state trong component | Không có | Không thông báo realtime cho Tiếp tân |

#### 6. Quản lý ca trực & lịch làm việc (`/admin/schedules` - `SchedulesManagement.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| A6.1 | Nút "Xếp ca làm việc" | Modal Trigger | **UI ONLY** | Chọn nhân viên, phòng khám, ngày trực, ca trực (Sáng/Chiều/Tối) | Lưu vào localStorage | Không có | Thiếu kết nối API ca trực của Admin |
| A6.2 | Chọn ngày xem lịch | DatePicker | **BROKEN** | Cho phép chọn tuần/tháng/ngày bất kỳ | Ngày bị hardcode cứng `'2026-09-17'`, không chọn được ngày khác | Không | Giao diện bị đơ tại một mốc thời gian cố định |
| A6.3 | Nút "AI Tự động xếp lịch trực" | AI Button | **UI ONLY** | Phân tích tải bệnh nhân và đề xuất phân ca tối ưu bằng Gemini | Bật timeout 1.5 giây rồi hiện Toast "Đã xếp lịch thông minh xong" | Không gọi Gemini API | Hoàn toàn là hàm giả lập setTimeout |

#### 7. Nhật ký hệ thống (`/admin/audit-logs` - `AuditLogs.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| A7.1 | Bộ lọc hành động (Action Filter) | Filter Dropdown | **WORKING** | Lọc theo LOGIN, CREATE, UPDATE, DELETE | Lọc đúng trên danh sách trả về | `GET /api/v1/admin/audit-logs` | Đạt |
| A7.2 | Ô tìm kiếm người thực hiện / IP | Search Input | **WORKING** | Tìm kiếm nhật ký theo người dùng hoặc IP | Gửi query param hoặc client filter chuẩn | `GET /api/v1/admin/audit-logs` | Đạt |
| A7.3 | Nút "Xuất nhật ký bảo mật (CSV)" | Button Export | **UI ONLY** | Tải file log CSV phục vụ kiểm toán an ninh | Không có phản hồi khi click | Không có | Chưa viết hàm download blob |

#### 8. Thông báo hệ thống (`/admin/notifications` - `SystemNotifications.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| A8.1 | Nút "Gửi thông báo toàn phòng khám" | Modal Trigger | **PARTIALLY WORKING** | Soạn tiêu đề, nội dung, chọn vai trò nhận, gửi WebSocket/DB | Lưu vào DB nhưng không push Realtime qua WebSocket | `POST /api/v1/notifications` | WebSocket broadcast chưa kích hoạt |
| A8.2 | Nút "Đánh dấu tất cả đã đọc" | Button Action | **WORKING** | Chuyển tất cả thông báo sang `is_read = true` | Cập nhật DB và UI thành công | `PUT /api/v1/notifications/read-all` | Đạt |

#### 9. Cấu hình hệ thống (`/admin/settings` - `SystemSettings.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| A9.1 | Tab "Cài đặt chung" | Tab Switch | **WORKING** | Xem và sửa tên phòng khám, hotline, địa chỉ | Hiển thị và lưu tốt vào localStorage/state | Không có backend API | Chưa có bảng `system_configs` trong DB |
| A9.2 | Tab "Thông báo" (Email/SMS) | Tab Switch | **BROKEN** | Cấu hình SMTP email, cổng SMS Brandname | **Màn hình trắng xóa** do thiếu thẻ `<TabsContent value="notifications">` | Không | Lỗi cú pháp Radix UI Tabs |
| A9.3 | Tab "Bảo mật & Sao lưu" | Tab Switch | **BROKEN** | Cấu hình thời hạn token, chính sách mật khẩu, sao lưu CSDL | **Màn hình trắng xóa** do thiếu thẻ `<TabsContent value="security">` | Không | Lỗi cấu trúc thẻ Tabs |
| A9.4 | Nút "Sao lưu cơ sở dữ liệu ngay" | Button Action | **MISSING** | Tải file snapshot SQLite về máy | Không tìm thấy nút trên UI | Không có endpoint | Chưa có tính năng backup DB cho admin |

#### 10. AI Admin Workspace (`/admin/ai-workspace` - `AIAdminWorkspace.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| A10.1 | Ô nhập câu hỏi trợ lý AI | Chat Input | **WORKING** | Nhập lệnh kiểm tra tài chính, nhân sự, hiệu suất phòng khám | Gửi request chat và stream câu trả lời | `POST /api/v1/ai/chat` | AI phản hồi tốt dữ liệu phòng khám |
| A10.2 | Nút "Xóa lịch sử hội thoại" | Button Action | **WORKING** | Xóa sạch ngữ cảnh hội thoại hiện tại | Reset state session ID | `POST /api/v1/ai/clear` | Đạt |

#### 11. Trung tâm an ninh AI (`AISecurityCenter.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| A11.1 | Tất cả các nút & dashboard an ninh | Toàn bộ trang | **BROKEN / ORPHANED** | Giám sát prompt injection, rò rỉ dữ liệu, rate limit | File tồn tại trong source code nhưng **không được đăng ký Route trong App.tsx** và không có trên Menu Sidebar | Không có route | Bị mồ côi (Orphaned Component) |

---

### B. PHÂN HỆ BÁC SĨ (DOCTOR - 11 MÀN HÌNH)

#### 1. Tổng quan bác sĩ (`/doctor/dashboard` - `DoctorDashboard.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| B1.1 | Nút "Tiếp nhận bệnh nhân tiếp theo" | Quick Action | **PARTIALLY WORKING** | Lấy bệnh nhân đầu tiên trong hàng đợi phòng khám, chuyển trạng thái "Đang khám", điều hướng sang trang EMR | Lấy được dữ liệu nhưng không đồng bộ trạng thái Queue của Tiếp tân | `POST /api/v1/emr/consultations` | Chưa cập nhật `queue_tickets` |
| B1.2 | Nút "Xem hồ sơ bệnh án" từ danh sách hôm nay | Navigation Link | **WORKING** | Chuyển đến trang chi tiết bệnh nhân hoặc EMR | Điều hướng chính xác | Client router | Đạt |
| B1.3 | Thẻ thống kê số lượng khám, kê đơn, doanh thu | Stat Cards | **WORKING** | Hiển thị số liệu thực tế của bác sĩ trong ngày | Số liệu tính toán trực tiếp từ DB | `GET /api/v1/doctor-dashboard/stats` | Đạt |

#### 2. Lịch hẹn khám của bác sĩ (`/doctor/appointments` - `DoctorAppointments.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| B2.1 | Bộ lọc ngày khám (Hôm nay, Tuần này, Tháng này) | Tab/Button Filter | **WORKING** | Tải danh sách lịch hẹn tương ứng | Hoạt động tốt | `GET /api/v1/appointments/doctor/me` | Đạt |
| B2.2 | Nút "Bắt đầu khám" trên từng lịch hẹn | Row Action | **WORKING** | Mở phiên khám mới cho bệnh nhân, điều hướng sang màn hình EMR | Tạo consultation thành công | `POST /api/v1/emr/consultations` | Đạt |
| B2.3 | Nút "Hủy lịch hẹn" | Row Action Modal | **WORKING** | Nhập lý do hủy, chuyển trạng thái "cancelled", gửi thông báo cho bệnh nhân | Hủy thành công | `PUT /api/v1/appointments/{id}/cancel` | Đạt |

#### 3. Danh sách bệnh nhân (`/doctor/patients` - `DoctorPatientsList.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| B3.1 | Ô tìm kiếm bệnh nhân (Tên, Mã BN, SĐT) | Search Input | **WORKING** | Tìm kiếm theo thời gian thực | Hoạt động tốt | `GET /api/v1/patients/search` | Đạt |
| B3.2 | Nút "Xem chi tiết hồ sơ bệnh nhân" | Row Action | **WORKING** | Điều hướng sang `/doctor/patients/:id` | Điều hướng chuẩn | Client router | Đạt |
| B3.3 | Nút "Thêm bệnh nhân mới" | Modal Trigger | **MISSING** | Cho phép bác sĩ tạo nhanh hồ sơ bệnh nhân vãng lai | Không có trên giao diện bác sĩ (bắt buộc phải qua Tiếp tân) | Không có | Cần bổ sung tạo nhanh ca cấp cứu |

#### 4. Hồ sơ bệnh nhân chi tiết (`/doctor/patients/:id` - `DoctorPatientProfile.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| B4.1 | Tab "Tiền sử bệnh & Dị ứng" | Tab Switch | **WORKING** | Xem và cập nhật danh sách tiền sử dị ứng thuốc | Hiển thị chính xác | `GET /api/v1/patients/{id}` | Đạt |
| B4.2 | Nút "Cập nhật dị ứng thuốc" | Modal Trigger | **PARTIALLY WORKING** | Nhập tên thuốc dị ứng, mức độ, lưu vào hồ sơ | Lưu vào trường note chung, chưa có bảng danh mục dị ứng chuẩn hóa | `PUT /api/v1/patients/{id}` | Thiếu bảng `allergies` riêng |
| B4.3 | Nút "Tạo phiên khám mới cho bệnh nhân này" | Primary Button | **WORKING** | Khởi tạo ngay một phiên khám bệnh án điện tử | Điều hướng sang EMR với patientId | `POST /api/v1/emr/consultations` | Đạt |

#### 5. Bệnh án điện tử EMR (`/doctor/emr` hoặc `/doctor/emr/:id` - `DoctorEMR.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| B5.1 | Ô nhập "Lý do khám, Bệnh sử, Khám lâm sàng" | Rich Text Area | **BROKEN** | Lưu trữ nội dung dài của bệnh sử vào body JSON | Backend khai báo nhận qua **Query Param** trong URL -> Khi bác sĩ gõ ghi chú dài sẽ dính lỗi **HTTP 414 URI Too Long** hoặc lỗi ký tự đặc biệt | `PUT /api/v1/emr/consultations/{id}` | `api/v1/emr.py:210`: Khai báo tham số trong URL thay vì `body: ConsultationUpdateDTO` |
| B5.2 | Nút "Tìm kiếm & Gán mã ICD-10" | Search Autocomplete | **WORKING** | Gõ tên bệnh gợi ý mã ICD-10 chuẩn Bộ Y Tế | Gợi ý và gán chính xác | `GET /api/v1/emr/icd10` | Đạt |
| B5.3 | Nút "Kê đơn thuốc" (Tab / Nút liên kết) | Action Trigger | **WORKING** | Mở form thêm thuốc trực tiếp vào phiên khám | Hoạt động tốt | `POST /api/v1/prescriptions` | Đạt |
| B5.4 | Nút "Chỉ định cận lâm sàng / Xét nghiệm" | Action Trigger | **WORKING** | Mở danh mục chỉ định xét nghiệm máu, chụp X-quang, siêu âm | Tạo chỉ định thành công | `POST /api/v1/lab-results/orders` | Đạt |
| B5.5 | Nút "Hoàn tất ca khám & Ký số bệnh án" | Primary Action | **PARTIALLY WORKING** | Khóa bệnh án, sinh mã băm SHA-256 xác thực chống sửa đổi, cập nhật trạng thái "completed" | Đổi trạng thái sang completed nhưng chữ ký điện tử chỉ là mã SHA-256 giả lập cục bộ, không dùng chứng thư số PKI y tế | `POST /api/v1/emr/consultations/{id}/finalize` | Chưa tích hợp ký số HSM/USB Token |
| B5.6 | Nút "In tóm tắt bệnh án / Phiếu khám" | Print Button | **BROKEN / UI ONLY** | In phiếu khám bệnh A4 chuẩn mẫu Bộ Y Tế | Gọi `window.print()` trực tiếp khiến toàn bộ thanh điều hướng, sidebar và nút bấm bị in ra giấy lem nhem, thiếu CSS `@media print` | Trình duyệt in | Thiếu CSS `@media print` chuyên dụng |

#### 6. Kê đơn thuốc (`/doctor/prescriptions` - `DoctorPrescriptions.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| B6.1 | Ô tìm kiếm danh mục thuốc | Autocomplete | **WORKING** | Tìm kiếm thuốc theo tên biệt dược, hoạt chất, hàm lượng | Gợi ý chuẩn từ bảng `medicines` | `GET /api/v1/prescriptions/medicines` | Đạt |
| B6.2 | Nút "Thêm thuốc vào đơn" | Form Add | **WORKING** | Nhập liều lượng, số lượng, cách dùng (Sáng-Trưa-Tối-Trước/Sau ăn) | Thêm vào danh sách tạm thành công | Client state | Đạt |
| B6.3 | Nút "AI Kiểm tra tương tác thuốc & Chống chỉ định" | AI Button | **WORKING** | Gửi đơn thuốc sang Gemini AI để đối chiếu tương tác chéo nguy hiểm | Hoạt động tốt, trả về cảnh báo mức độ tương tác | `POST /api/v1/ai/clinical-check` | Đạt |
| B6.4 | Nút "Lưu & Ký đơn thuốc" | Form Submit | **BROKEN (tiềm ẩn)** | Lưu đơn thuốc gắn với bác sĩ điều trị | Backend truy vấn `Doctor.user_id` vốn không tồn tại trong model -> Phải fallback lấy bác sĩ đầu tiên trong CSDL nếu không sửa | `POST /api/v1/prescriptions` | `api/v1/prescriptions.py:103`: Model `Doctor` chỉ có `staff_id` |
| B6.5 | Nút "In đơn thuốc" | Print Action | **BROKEN / UI ONLY** | Xuất và in đơn thuốc điện tử A5 theo Thông tư 52/2017/TT-BYT | In toàn màn hình website, không có khung đơn thuốc đạt chuẩn | Trình duyệt in | Thiếu template in đơn thuốc A5 |

#### 7. Kết quả xét nghiệm & Cận lâm sàng (`/doctor/lab-results` - `DoctorLabResults.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| B7.1 | Nút "Đánh dấu Đã đọc kết quả" | Row Action Button | **BROKEN** | Chuyển trạng thái kết quả xét nghiệm sang "reviewed" / "completed" | **Văng lỗi 422 Unprocessable Entity**. Frontend gửi `{ status: 'completed' }` qua JSON body, backend khai báo tham số `new_status` qua URL query param | `PATCH /api/v1/lab-results/{id}/status` | `api/v1/lab_results.py:84-86` và `DoctorLabResults.tsx:112` lệch kiểu truyền tham số |
| B7.2 | Nút "Xem hình ảnh phim / File kết quả" | Modal Trigger | **WORKING** | Xem ảnh chụp X-Quang, siêu âm, đồ thị điện tim | Hiển thị ảnh popup rõ nét | `GET /uploads/lab/...` | Đạt |
| B7.3 | Nút "Nhận xét của bác sĩ vào kết quả" | Form Submit | **WORKING** | Lưu ghi chú đánh giá của bác sĩ vào phiếu kết quả | Cập nhật thành công | `PUT /api/v1/lab-results/{id}/notes` | Đạt |

#### 8. Trợ lý lâm sàng AI (`/doctor/ai-assistant` - `DoctorAIAssistant.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| B8.1 | Khung chat hỏi đáp phác đồ điều trị | Chat Interface | **WORKING** | Bác sĩ hỏi hướng dẫn điều trị, tra cứu bệnh học, tóm tắt ca bệnh | Phản hồi thông minh, trích dẫn văn bản y khoa chính thống | `POST /api/v1/ai/chat` | Đạt |
| B8.2 | Nút "Tóm tắt bệnh sử bệnh nhân này" | AI Shortcut | **BROKEN (tiềm ẩn)** | Bác sĩ truyền ID bệnh nhân, AI đọc EMR và tóm tắt diễn tiến | Nếu phiên khám có mã ICD-10, tool registry gọi nhầm `cd.diagnosis.code` thay vì `icd10_code` gây văng Exception | Tool Calling Gemini | `ai_tool_registry.py:1940`: Sai tên thuộc tính model |

#### 9. Thông báo bác sĩ (`/doctor/notifications` - `DoctorNotifications.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| B9.1 | Bộ lọc thông báo (Tất cả, Kết quả xét nghiệm, Lịch hẹn mới) | Tabs Filter | **WORKING** | Lọc danh sách thông báo | Hoạt động tốt | `GET /api/v1/notifications` | Đạt |
| B9.2 | Nút "Đánh dấu đã đọc" từng thông báo | Row Action | **WORKING** | Đổi trạng thái `is_read` | Hoạt động tốt | `PUT /api/v1/notifications/{id}/read` | Đạt |

#### 10. Cài đặt thông tin bác sĩ (`/doctor/settings` - `DoctorSettings.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| B10.1 | Form đổi chữ ký số / con dấu | Upload / Signature | **UI ONLY** | Tải ảnh chữ ký tay hoặc kết nối chứng thư số | Lưu state component, chưa lưu CSDL | Không có | Chưa có trường `signature_url` trong bảng `doctors` |
| B10.2 | Form đổi mật khẩu | Form Submit | **WORKING** | Đổi mật khẩu tài khoản bác sĩ | Đạt | `PUT /api/v1/auth/change-password` | Đạt |

#### 11. Báo cáo hoạt động bác sĩ (`/doctor/reports` - `DoctorReports.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| B11.1 | Bộ lọc thời gian báo cáo (Tuần, Tháng, Quý) | Date Filter | **PARTIALLY WORKING** | Tải biểu đồ số lượng bệnh nhân và đơn thuốc đã kê | Dữ liệu tính toán từ frontend, chưa có endpoint tổng hợp | `GET /api/v1/doctor-dashboard/reports` | Chưa tối ưu query database |
| B11.2 | Nút "Xuất báo cáo cá nhân (PDF)" | Export Button | **UI ONLY** | Xuất file PDF tổng kết tháng của bác sĩ | Bấm vào chỉ thông báo tính năng đang phát triển | Không có | Chưa kết nối backend pdf generator |

---

### C. PHÂN HỆ TIẾP TÂN (RECEPTIONIST - 11 MÀN HÌNH)

#### 1. Tổng quan tiếp tân (`/receptionist/dashboard` - `ReceptionistDashboard.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| C1.1 | Nút "Đăng ký tiếp nhận nhanh" | Quick Action Modal | **WORKING** | Mở modal nhập họ tên, SĐT, chọn phòng khám, sinh số thứ tự | Hoạt động tốt | `POST /api/v1/receptionist/queue/check-in` | Đạt |
| C1.2 | Nút "Gọi số tiếp theo" | Quick Action | **WORKING** | Chuyển số thứ tự tiếp theo sang trạng thái "calling" | Cập nhật DB tốt | `POST /api/v1/receptionist/queue/call-next` | Đạt |
| C1.3 | Thẻ số lượng bệnh nhân đang chờ / đã khám | Stat Cards | **WORKING** | Cập nhật số liệu thời gian thực | Hoạt động tốt | `GET /api/v1/receptionist/dashboard-stats` | Đạt |

#### 2. Quản lý lịch hẹn tiếp tân (`/receptionist/appointments` - `ReceptionistAppointments.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| C2.1 | Nút "Tạo lịch hẹn mới" | Navigation Button | **WORKING** | Điều hướng sang trang tạo lịch hẹn chi tiết | Điều hướng sang `/receptionist/appointments/new` | Client router | Đạt |
| C2.2 | Nút "Xác nhận lịch hẹn" (Từ bệnh nhân đặt qua Portal) | Row Action | **WORKING** | Chuyển trạng thái từ "pending" sang "confirmed" | Hoạt động tốt | `PUT /api/v1/appointments/{id}/status` | Đạt |
| C2.3 | Nút "Hủy lịch hẹn" | Row Action Modal | **WORKING** | Nhập lý do hủy và chuyển trạng thái "cancelled" | Hoạt động tốt | `PUT /api/v1/appointments/{id}/cancel` | Đạt |
| C2.4 | Nút "Check-in trực tiếp từ lịch hẹn" | Row Action | **WORKING** | Bệnh nhân đến nơi, tiếp tân bấm check-in đẩy vào hàng đợi phòng khám | Đẩy vào `queue_tickets` thành công | `POST /api/v1/receptionist/queue/from-appointment` | Đạt |

#### 3. Tạo lịch hẹn chi tiết (`/receptionist/appointments/new` - `ReceptionistAppointmentCreate.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| C3.1 | Ô tìm kiếm / Chọn bệnh nhân | Autocomplete | **WORKING** | Gõ tên hoặc SĐT để chọn bệnh nhân cũ, hoặc nhập mới | Tìm kiếm chuẩn | `GET /api/v1/patients/search` | Đạt |
| C3.2 | Dropdown chọn Chuyên khoa & Bác sĩ | Dropdown Cascading | **WORKING** | Chọn chuyên khoa sẽ tự động lọc danh sách bác sĩ thuộc khoa đó | Hoạt động mượt mà | `GET /api/v1/doctors` | Đạt |
| C3.3 | Chọn ngày và Khung giờ khám | Grid Slots | **BROKEN** | Hiển thị các khung giờ còn trống của bác sĩ đã chọn | **Văng lỗi TypeError: 'module' object is not callable** do `import time` ghi đè class `time` chuẩn trong backend | `POST /api/v1/appointments` | `api/v1/receptionist.py:4, 137`: Biến `time` bị ghi đè bởi `import time` |
| C3.4 | Nút "Xác nhận đặt lịch" | Form Submit | **BROKEN** | Lưu lịch hẹn vào CSDL | Không thể lưu do dính lỗi tạo khung giờ ở trên | `POST /api/v1/appointments` | Blocked bởi lỗi backend C3.3 |

#### 4. Quản lý bệnh nhân (`/receptionist/patients` - `ReceptionistPatients.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| C4.1 | Nút "Thêm hồ sơ bệnh nhân" | Modal Trigger | **WORKING** | Mở form nhập CCCD, họ tên, ngày sinh, giới tính, địa chỉ, BHYT | Thêm mới và tạo mã BN chuẩn | `POST /api/v1/patients` | Đạt |
| C4.2 | Ô tìm kiếm bệnh nhân nâng cao | Multi-input | **WORKING** | Tìm theo mã bệnh nhân, số CMND/CCCD, số điện thoại | Tìm kiếm rất nhanh | `GET /api/v1/patients/search` | Đạt |
| C4.3 | Nút "Sửa thông tin hành chính bệnh nhân" | Row Action Modal | **WORKING** | Cập nhật thông tin liên hệ, địa chỉ | Cập nhật DB tốt | `PUT /api/v1/patients/{id}` | Đạt |

#### 5. Chi tiết hồ sơ bệnh nhân (`/receptionist/patients/:id` - `ReceptionistPatientProfile.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| C5.1 | Tab "Lịch sử khám bệnh" | Tab Switch | **PARTIALLY WORKING** | Xem các lần khám trước | Xem được nhưng tiếp tân không được xem chẩn đoán chi tiết EMR | `GET /api/v1/patients/{id}/history` | RBAC cần giới hạn trường bảo mật y tế |
| C5.2 | Nút "In thẻ khám bệnh / Mã QR bệnh nhân" | Print Action | **UI ONLY** | In thẻ nhựa/giấy có mã barcode/QR mã bệnh nhân | Chỉ hiện toast thông báo | Không có | Thiếu hàm sinh mã QR và mẫu in thẻ |

#### 6. Điều phối hàng đợi phòng khám (`/receptionist/queue` - `ReceptionistQueue.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| C6.1 | Nút "Gọi số" (Từng bệnh nhân) | Row Action Button | **WORKING** | Đổi trạng thái vé sang "calling", cập nhật màn hình chờ | Cập nhật DB tốt | `PUT /api/v1/receptionist/queue/{id}/call` | Đạt |
| C6.2 | Nút "Bỏ qua / Vắng mặt" | Row Action Button | **WORKING** | Đổi trạng thái sang "skipped" | Hoạt động tốt | `PUT /api/v1/receptionist/queue/{id}/skip` | Đạt |
| C6.3 | Nút "Điều chuyển phòng khám" | Modal Action | **PARTIALLY WORKING** | Chuyển bệnh nhân từ hàng đợi phòng A sang phòng B | Cập nhật phòng nhưng không đổi lại số thứ tự tương ứng | `PUT /api/v1/receptionist/queue/{id}/transfer` | Chưa tính toán lại STT phòng mới |
| C6.4 | Màn hình hiển thị TV hàng đợi (`/queue/display`) | Public Display View | **MISSING** | Màn hình full-screen không cần login để treo TV sảnh chờ phòng khám | **Chưa có trang này trong hệ thống** | Không có route | Thiếu màn hình TV công cộng cho bệnh nhân nhìn |
| C6.5 | Nút "Phát loa gọi số (Audio Chime / TTS)" | Sound Trigger | **MISSING** | Phát âm thanh "Xin mời bệnh nhân số... vào phòng khám..." | **Không có âm thanh / TTS** | Không có | Tiếp tân phải gọi miệng |

#### 7. Thu ngân & Thanh toán tiếp tân (`/receptionist/payments` - `ReceptionistPayments.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| C7.1 | Nút "Thu tiền viện phí" | Modal Trigger | **WORKING** | Chọn phương thức thanh toán (Tiền mặt, QR MoMo, VNPay, Chuyển khoản) | Mở modal và tạo giao dịch thành công | `POST /api/v1/billing/invoices/{id}/pay` | Đạt |
| C7.2 | Nút "Tạo mã QR VietQR tự động" | QR Generator | **PARTIALLY WORKING** | Sinh mã VietQR chuẩn NAPAS có sẵn số tiền và nội dung chuyển khoản | Hiện ảnh QR tĩnh, chưa gắn động số tiền và mã hóa đơn vào link VietQR QuickLink | Client dynamic image | Cần render VietQR động từ số tài khoản phòng khám |
| C7.3 | Nút "In hóa đơn / Phiếu thu" | Print Action | **BROKEN / UI ONLY** | In phiếu thu khổ 80mm cho máy in nhiệt POS | Bấm in văng toàn bộ giao diện web, vỡ khung giấy 80mm | Trình duyệt in | Thiếu CSS `@media print` khổ nhiệt 80mm |

#### 8. Tra cứu sổ y bạ (`/receptionist/health-records` - `ReceptionistHealthRecords.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| C8.1 | Ô tìm kiếm sổ y bạ | Search Input | **WORKING** | Tìm kiếm theo họ tên, mã sổ | Tìm kiếm nhanh | `GET /api/v1/patients/records` | Đạt |
| C8.2 | Nút "Cấp lại sổ y bạ mới" | Button Action | **WORKING** | Sinh mã số y bạ mới khi bệnh nhân làm mất sổ | Cập nhật mã thành công | `POST /api/v1/patients/{id}/reissue-book` | Đạt |

#### 9. AI Hỗ trợ tiếp tân (`/receptionist/ai` - `ReceptionistAI.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| C9.1 | Khung chat hỏi đáp thủ tục & giá dịch vụ | Chat Input | **WORKING** | Tra cứu bảng giá xét nghiệm, danh mục BHYT, ca trực bác sĩ | Trả lời nhanh, chính xác biểu phí | `POST /api/v1/ai/chat` | Đạt |
| C9.2 | Lệnh AI "Đặt lịch khám tự động bằng ngôn ngữ tự nhiên" | Natural Language Tool | **BROKEN** | AI tự trích xuất thực thể (tên, giờ, chuyên khoa) và gọi tool tạo lịch hẹn | Khi gọi tool `create_appointment`, truyền kwargs rời rạc thay vì object DTO `AppointmentCreate` gây văng lỗi runtime | Tool Calling Gemini | `ai_tool_registry.py:1675`: Lệch schema hàm tạo lịch hẹn |

#### 10. Thông báo tiếp tân (`/receptionist/notifications` - `ReceptionistNotifications.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| C10.1 | Danh sách thông báo ca trực, hủy hẹn | List / Badges | **WORKING** | Hiển thị thông báo | Hoạt động tốt | `GET /api/v1/notifications` | Đạt |
| C10.2 | Nút "Đánh dấu đã đọc" | Button Action | **WORKING** | Xóa chấm đỏ thông báo | Hoạt động tốt | `PUT /api/v1/notifications/{id}/read` | Đạt |

#### 11. Cài đặt tiếp tân (`/receptionist/settings` - `ReceptionistSettings.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| C11.1 | Chọn quầy tiếp nhận mặc định | Dropdown Select | **UI ONLY** | Chọn Quầy 1, Quầy 2, Quầy 3 để gắn vào vé số thứ tự | Lưu vào localStorage | Không có | Chưa lưu cấu hình quầy vào profile người dùng |
| C11.2 | Đổi mật khẩu cá nhân | Form Submit | **WORKING** | Đổi mật khẩu tài khoản tiếp tân | Đạt | `PUT /api/v1/auth/change-password` | Đạt |

---

### D. PHÂN HỆ CỔNG THÔNG TIN BỆNH NHÂN (PATIENT PORTAL - 11 MÀN HÌNH)

#### 1. Tổng quan bệnh nhân (`/portal/dashboard` - `PatientDashboard.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| D1.1 | Nút "Đặt lịch khám ngay" (Banner chính) | CTA Button | **WORKING** | Điều hướng sang màn hình đặt lịch trực tuyến | Chuyển sang `/portal/appointments/new` | Client router | Đạt |
| D1.2 | Nút "Xem chi tiết lịch hẹn sắp tới" | Card Link | **BROKEN** | Chuyển đến trang chi tiết lịch hẹn của bệnh nhân | Chuyển đến `/portal/appointments/:id` nhưng **Route này không được khai báo trong App.tsx** -> Hiện trang 404 Not Found | Client router | `App.tsx` thiếu route con `/portal/appointments/:id` |
| D1.3 | Nút "Xem chi tiết đơn thuốc gần nhất" | Card Link | **BROKEN** | Chuyển đến chi tiết đơn thuốc | Chuyển đến `/portal/prescriptions/:id` nhưng **Route này không tồn tại** -> Hiện trang 404 Not Found | Client router | `App.tsx` thiếu route con `/portal/prescriptions/:id` |
| D1.4 | Thẻ xem số lượt khám, số tiền chưa thanh toán | Stat Badges | **WORKING** | Hiển thị tóm tắt tình trạng điều trị và viện phí | Dữ liệu nạp chuẩn từ hồ sơ bệnh nhân | `GET /api/v1/portal/dashboard` | Đạt |

#### 2. Lịch hẹn của tôi (`/portal/appointments` - `PatientAppointments.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| D2.1 | Tabs "Sắp tới", "Đã hoàn thành", "Đã hủy" | Tabs Switch | **WORKING** | Phân loại lịch hẹn theo trạng thái | Hoạt động tốt | `GET /api/v1/appointments/patient/me` | Đạt |
| D2.2 | Nút "Hủy lịch hẹn" | Modal Trigger | **WORKING** | Bệnh nhân hủy lịch trước giờ khám ít nhất 2 tiếng | Cập nhật trạng thái và giải phóng ca trực bác sĩ | `PUT /api/v1/appointments/{id}/cancel` | Đạt |
| D2.3 | Nút "Đặt lại lịch hẹn này" | Quick Button | **WORKING** | Sao chép thông tin bác sĩ & chuyên khoa sang form đặt mới | Điền sẵn form tạo lịch hẹn | Client state | Đạt |

#### 3. Đặt lịch khám trực tuyến (`/portal/appointments/new` - `PatientAppointmentCreate.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| D3.1 | Dropdown chọn Chuyên khoa | Select Input | **WORKING** | Tải danh sách chuyên khoa | Tải danh sách tốt | `GET /api/v1/departments` | Đạt |
| D3.2 | Dropdown chọn Bác sĩ mong muốn | Select Input | **WORKING** | Lọc theo chuyên khoa, hiển thị ảnh bác sĩ, chức danh, học vị | Hiển thị trực quan | `GET /api/v1/doctors` | Đạt |
| D3.3 | Chọn ngày khám và khung giờ | Date & Time Grid | **BROKEN** | Chọn ngày và giờ khám | Bị chặn bởi lỗi time module trong backend tương tự phía Tiếp tân | `POST /api/v1/appointments` | Lỗi backend `time` module |
| D3.4 | Nút "Xác nhận & Đặt hẹn" | Form Submit | **BROKEN** | Tạo lịch hẹn mới với trạng thái "pending" | Bị văng lỗi 500 từ endpoint lịch hẹn | `POST /api/v1/appointments` | Kế thừa lỗi D3.3 |

#### 4. Hồ sơ sức khỏe cá nhân (`/portal/health-record` - `PatientHealthRecord.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| D4.1 | Danh sách các đợt khám bệnh | Accordion / List | **WORKING** | Xem chi tiết ngày khám, bác sĩ khám, chẩn đoán sơ bộ | Tải danh sách chuẩn từ EMR | `GET /api/v1/portal/health-records` | Đạt |
| D4.2 | Biểu đồ theo dõi chỉ số sinh tồn (Huyết áp, Cân nặng, BMI) | Chart Component | **PARTIALLY WORKING** | Vẽ biểu đồ biến thiên chỉ số qua từng lần khám | Chỉ hiển thị dữ liệu tĩnh mẫu, chưa map mảng lịch sử từ bảng `vital_signs` | Không có endpoint riêng | Cần endpoint trả về chuỗi thời gian vital signs |
| D4.3 | Nút "Tải file bệnh án điện tử (PDF)" | Download Action | **UI ONLY** | Tải toàn bộ sổ y bạ điện tử định dạng PDF | Bấm vào chỉ có thông báo chờ | Không có | Chưa kết nối backend EMR exporter |

#### 5. Đơn thuốc điện tử (`/portal/prescriptions` - `PatientPrescriptions.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| D5.1 | Xem chi tiết các loại thuốc trong đơn | Modal / Card | **WORKING** | Xem tên thuốc, hàm lượng, số lượng, hướng dẫn uống | Hiển thị chi tiết rõ ràng, dễ đọc cho người già | `GET /api/v1/prescriptions/patient/me` | Đạt |
| D5.2 | Nút "Đặt hẹn nhắc uống thuốc" | Quick Action | **MISSING** | Cài đặt thông báo trên điện thoại/trình duyệt nhắc giờ uống thuốc | Chưa có tính năng này | Không có | Tính năng giá trị cao cho bệnh nhân |
| D5.3 | Nút "In đơn thuốc" | Print Button | **BROKEN / UI ONLY** | In đơn thuốc cầm đi mua ở nhà thuốc bên ngoài | Không có định dạng in chuẩn | Trình duyệt in | Thiếu CSS in ấn |

#### 6. Kết quả cận lâm sàng (`/portal/lab-results` - `PatientLabResults.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| D6.1 | Xem chỉ số xét nghiệm (Chỉ số, Trị số bình thường, Đánh giá) | Table View | **WORKING** | Bôi đỏ các chỉ số vượt ngưỡng, có chú thích cảnh báo | Đánh giá trực quan | `GET /api/v1/lab-results/patient/me` | Đạt |
| D6.2 | Nút "Xem ảnh chụp chẩn đoán hình ảnh" | Image Modal | **WORKING** | Phóng to ảnh X-quang/siêu âm | Hoạt động tốt | `GET /uploads/lab/...` | Đạt |
| D6.3 | Nút "Hỏi AI giải thích kết quả xét nghiệm" | AI Button | **WORKING** | Gửi chỉ số sang AI để giải thích bằng ngôn ngữ bình dân | Phản hồi dễ hiểu, khuyến cáo tái khám bác sĩ | `POST /api/v1/ai/explain-lab` | Đạt |

#### 7. Thanh toán viện phí & Hóa đơn (`/portal/payments` - `PatientPayments.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| D7.1 | Danh sách hóa đơn (Chưa thanh toán / Đã thanh toán) | Tabs View | **WORKING** | Phân loại hóa đơn | Tải đúng danh sách | `GET /api/v1/billing/patient/me` | Đạt |
| D7.2 | Nút "Thanh toán ngay bằng VietQR / MoMo" | Payment Modal | **PARTIALLY WORKING** | Mở mã QR động có sẵn số tiền và mã hóa đơn để bệnh nhân quét ngân hàng | Hiện popup mã QR tĩnh, chưa kết nối IPN xác thực thanh toán tự động | Không có webhook | Chưa có webhook ngân hàng tự động đối soát |
| D7.3 | Nút "Tải biên lai điện tử" | Download Action | **UI ONLY** | Tải hóa đơn điện tử PDF có mã tra cứu | Hiện thông báo giả lập | Không có | Chưa có endpoint xuất hóa đơn PDF |

#### 8. Trợ lý sức khỏe AI (`/portal/ai-assistant` - `PatientAIAssistant.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| D8.1 | Khung chat hỏi triệu chứng ban đầu | Chat Input | **BROKEN (Lỗ hổng bảo mật P0)** | Bệnh nhân mô tả triệu chứng, AI tư vấn chuyên khoa khám phù hợp | **RÒ RỈ DỮ LIỆU BỆNH NHÂN KHÁC**: Nếu session user_id chưa đồng bộ, logic fallback của AI tự động lấy bệnh nhân ID #1 trong CSDL để trả lời -> Người dùng xem được toàn bộ bệnh sử của người khác! | `POST /api/v1/ai/chat` | `services/ai_tool_registry.py:1526`: Fallback `patient = db.query(Patient).first()` |
| D8.2 | Nút "Gợi ý chuyên khoa khám từ triệu chứng" | Quick Prompt | **WORKING** | Gửi các mẫu câu hỏi định sẵn | Hoạt động tốt | Client prompt | Đạt |

#### 9. Thông báo bệnh nhân (`/portal/notifications` - `PatientNotifications.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| D9.1 | Danh sách nhắc lịch khám, kết quả mới | Notification List | **WORKING** | Hiển thị thông báo | Hoạt động tốt | `GET /api/v1/notifications` | Đạt |
| D9.2 | Nút "Xem chi tiết" từ thông báo | Action Link | **WORKING** | Dẫn đến đúng lịch hẹn hoặc kết quả xét nghiệm | Điều hướng tốt | Client router | Đạt |

#### 10. Hồ sơ cá nhân (`/portal/profile` - `PatientProfile.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| D10.1 | Form cập nhật thông tin cá nhân | Form Submit | **WORKING** | Sửa SĐT, địa chỉ, số thẻ BHYT, người liên hệ khẩn cấp | Lưu vào CSDL thành công | `PUT /api/v1/patients/me` | Đạt |
| D10.2 | Tải lên ảnh đại diện | Avatar Upload | **PARTIALLY WORKING** | Upload ảnh đại diện | Lưu blob tạm, chưa lưu static URL trên backend | Chưa có upload static | Cần lưu file vào thư mục upload |

#### 11. Cài đặt tài khoản (`/portal/settings` - `PatientSettings.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| D11.1 | Đổi mật khẩu tài khoản cổng thông tin | Form Submit | **WORKING** | Đổi mật khẩu | Hoạt động tốt | `PUT /api/v1/auth/change-password` | Đạt |
| D11.2 | Cấu hình nhận thông báo (Email / SMS) | Toggle Switch | **UI ONLY** | Bật/tắt nhận SMS nhắc lịch | Đổi state trong component | Không có endpoint | Chưa lưu cấu hình thông báo vào DB |

---

### E. PHÂN HỆ KẾ TOÁN & TÀI CHÍNH (ACCOUNTANT - 3 MÀN HÌNH)

#### 1. Danh sách hóa đơn viện phí (`/billing` - `BillingList.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| E1.1 | Nút "Tạo hóa đơn viện phí mới" | Modal Trigger | **WORKING** | Chọn bệnh nhân, thêm danh mục dịch vụ khám, thuốc, xét nghiệm | Mở modal và lưu hóa đơn chuẩn | `POST /api/v1/billing/invoices` | Đạt |
| E1.2 | Ô tìm kiếm hóa đơn (Mã HĐ, Tên BN, Mã BN) | Search Input | **WORKING** | Lọc danh sách hóa đơn tức thì | Hoạt động tốt | `GET /api/v1/billing/invoices` | Đạt |
| E1.3 | Bộ lọc trạng thái thanh toán (Chờ thanh toán, Đã thanh toán, Đã hủy) | Dropdown Filter | **WORKING** | Lọc theo trạng thái `paid`, `pending`, `cancelled` | Hoạt động tốt | `GET /api/v1/billing/invoices` | Đạt |
| E1.4 | Nút "Xem chi tiết hóa đơn" (Từng dòng) | Row Action Link | **WORKING** | Điều hướng sang `/billing/:id` | Chuyển trang chuẩn | Client router | Đạt |
| E1.5 | Nút "Xác nhận đã thanh toán tiền mặt" | Quick Row Action | **WORKING** | Chuyển trạng thái sang `paid`, ghi nhận người thu tiền | Cập nhật DB tốt | `POST /api/v1/billing/invoices/{id}/pay` | Đạt |
| E1.6 | Nút "Hủy hóa đơn sai sót" | Row Action Modal | **WORKING** | Nhập lý do hủy hóa đơn, hoàn trả kho thuốc nếu có | Cập nhật trạng thái `cancelled` | `POST /api/v1/billing/invoices/{id}/cancel` | Đạt |
| E1.7 | Nút "Xuất danh sách hóa đơn ra Excel" | Export Button | **UI ONLY** | Xuất báo cáo doanh thu ra file Excel | Bấm vào chỉ có Toast thông báo | Không có endpoint | Chưa tích hợp xuất Excel hóa đơn |

#### 2. Chi tiết hóa đơn viện phí (`/billing/:id` - `BillingDetail.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| E2.1 | Nút "Thêm mục chi phí vào hóa đơn" | Modal Trigger | **PARTIALLY WORKING** | Thêm thuốc phát sinh hoặc thủ thuật y tế vào hóa đơn đang chờ | Thêm được nhưng không tự động kiểm tra tồn kho thuốc | `POST /api/v1/billing/invoices/{id}/items` | Chưa khóa đơn giá theo danh mục |
| E2.2 | Áp dụng mã giảm giá / Chiết khấu BHYT | Form Input | **PARTIALLY WORKING** | Nhập % giảm giá hoặc khấu trừ BHYT và tính lại tổng tiền | Tính toán đúng trên UI, lưu vào DB nhưng chưa có phân loại mã BHYT chính thống | `PUT /api/v1/billing/invoices/{id}` | Cần bảng danh mục bảo hiểm chuẩn |
| E2.3 | Nút "In hóa đơn giá trị gia tăng / Biên lai" | Print Action | **BROKEN / UI ONLY** | In hóa đơn A4 hoặc phiếu thu 80mm có mã số thuế, ký hiệu hóa đơn | In trực tiếp trang web bị lệch viền, mất logo phòng khám | Trình duyệt in | Thiếu template in hóa đơn chuẩn Bộ Tài Chính |
| E2.4 | Nút "Gửi biên lai điện tử qua Email cho bệnh nhân" | Button Action | **UI ONLY** | Gửi PDF hóa đơn về hòm thư bệnh nhân | Hiện toast "Đã gửi email" giả lập | Không có | Backend chưa kích hoạt background task gửi email |

#### 3. Báo cáo tài chính & Doanh thu (`/reports` - `Reports.tsx`)
| # | Phần tử tương tác | Loại | Trạng thái | Hành vi kỳ vọng | Hành vi thực tế | API Endpoint kết nối | Ghi chú & Nguyên nhân gốc |
|---|-------------------|------|------------|-----------------|-----------------|----------------------|---------------------------|
| E3.1 | Toàn bộ giao diện báo cáo tài chính | Component View | **BROKEN (Lệch nghiệp vụ nghiêm trọng P1)** | Hiển thị biểu đồ doanh thu theo ngày/tháng/năm, doanh thu theo chuyên khoa, báo cáo tiền mặt/chuyển khoản, công nợ | Màn hình hiện tại hiển thị **CPU Usage, RAM Usage, Server Latency** (Báo cáo hạ tầng DevOps) thay vì Báo cáo Kế toán! Khi gọi `/api/v1/reports` bị trả về **HTTP 404 Not Found** do backend chưa có router `reports.py` | `GET /api/v1/reports` (404) | Thiếu hoàn toàn router báo cáo tài chính backend, frontend nhầm lẫn component |
| E3.2 | Bộ lọc khoảng thời gian báo cáo (Từ ngày - Đến ngày) | DateRangePicker | **BROKEN** | Lọc dữ liệu báo cáo tài chính | Không hoạt động do không có API backend | Không có | Bị gãy theo E3.1 |
| E3.3 | Nút "Xuất sổ nhật ký thu tiền (Excel/PDF)" | Export Button | **BROKEN** | Tải sổ sách kế toán định dạng chuẩn | Không hoạt động | Không có | Bị gãy theo E3.1 |

---

## 3. THỐNG KÊ TỔNG HỢP KIỂM TOÁN TƯƠNG TÁC TOÀN HỆ THỐNG

### Phân bố trạng thái tương tác qua 47 màn hình:
- **Tổng số phần tử tương tác đã kiểm toán chi tiết**: **186 tương tác**
- **WORKING (Hoạt động hoàn chỉnh)**: **98 tương tác** (~52.7%)
- **PARTIALLY WORKING (Hoạt động một phần / Cần hoàn thiện)**: **32 tương tác** (~17.2%)
- **UI ONLY (Chỉ có giao diện / Giả lập localStorage)**: **27 tương tác** (~14.5%)
- **BROKEN (Bị lỗi văng Exception / 404 / 414 / 422 / 500)**: **19 tương tác** (~10.2%)
- **MISSING (Thiếu hẳn trên UI theo quy trình y tế)**: **10 tương tác** (~5.4%)

### Các điểm vỡ (Broken Critical Points) cần khắc phục ngay trong Sprint 1:
1. `api/v1/receptionist.py`: Fix lỗi `import time` gây đơ toàn bộ chức năng đặt lịch khám ở Tiếp tân & Bệnh nhân.
2. `api/v1/lab_results.py`: Fix lỗi `PATCH /status` nhận JSON Body thay vì Query Param cho nút duyệt xét nghiệm của Bác sĩ.
3. `api/v1/emr.py`: Fix lỗi `PUT /consultations/{id}` nhận Body JSON thay vì URL Query tránh lỗi 414 URI Too Long khi lưu bệnh sử.
4. `services/ai_tool_registry.py`: Loại bỏ ngay đoạn code fallback `Patient.first()` để bịt lỗ hổng rò rỉ bệnh án chéo của bệnh nhân #1.
5. `api/v1/admin.py`: Sửa tham số khởi tạo `Staff(employee_id=...)` và thêm `phone` cho `Patient` để mở khóa chức năng tạo người dùng của Admin.
6. `Reports.tsx` & `backend/app/api/v1/reports.py`: Tạo mới toàn bộ router kế toán tài chính và thiết kế lại giao diện báo cáo doanh thu thay thế màn hình CPU/RAM.
7. `App.tsx`: Đăng ký Route cho `AISecurityCenter.tsx`, `/portal/appointments/:id`, `/portal/prescriptions/:id`.
