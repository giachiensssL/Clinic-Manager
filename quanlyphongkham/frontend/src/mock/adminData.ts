// Mock Data for System Administration

export const adminKPIs = {
  totalUsers: { value: 1284, change: "+8.2%", trend: "up" },
  totalStaff: { value: 25, change: "+2", trend: "up" },
  todayAppointments: { value: 86, change: "+12.5%", trend: "up" },
  todayRevenue: { value: "45.600.000đ", change: "+9.4%", trend: "up" },
};

export const aiInsights = [
  { id: 1, type: 'info', message: 'Lượt sử dụng hệ thống tăng 12.5% so với tuần trước', time: '08:30' },
  { id: 2, type: 'warning', message: 'Khoa Nội đang có tỷ lệ sử dụng phòng cao nhất (95%)', time: '09:15' },
  { id: 3, type: 'error', message: 'Có 3 tài khoản bị khóa do đăng nhập sai nhiều lần', time: '10:00' },
  { id: 4, type: 'success', message: 'Không phát hiện hoạt động truy cập bất thường', time: '11:20' },
  { id: 5, type: 'warning', message: '2 dịch vụ khám bệnh cần được cập nhật lại giá theo kỳ', time: '14:05' },
  { id: 6, type: 'info', message: 'Có 2 tài khoản nhân viên mới chờ kích hoạt', time: '15:10' },
  { id: 7, type: 'error', message: 'Server dự phòng báo cáo lỗi đồng bộ nhẹ lúc 15:30', time: '15:35' },
  { id: 8, type: 'success', message: 'Quá trình sao lưu dữ liệu tự động hoàn tất', time: '02:00' },
  { id: 9, type: 'info', message: 'Bác sĩ Trần Thị Mai có lịch khám dày đặc nhất tuần này', time: '16:00' },
  { id: 10, type: 'warning', message: 'Hệ thống AI Guardrail chặn 5 câu hỏi không hợp lệ từ bệnh nhân', time: '17:20' },
];

export const mockUsers = Array.from({ length: 25 }).map((_, i) => {
  const roles = ['Bệnh nhân', 'Bác sĩ', 'Lễ tân', 'Kế toán', 'Admin'];
  const statuses = ['Đang hoạt động', 'Bị khóa', 'Chờ kích hoạt'];
  const role = i === 0 ? 'Admin' : (i < 5 ? 'Bác sĩ' : (i < 8 ? 'Lễ tân' : (i < 10 ? 'Kế toán' : 'Bệnh nhân')));
  const status = i === 3 ? 'Bị khóa' : (i === 7 ? 'Chờ kích hoạt' : 'Đang hoạt động');
  
  return {
    id: `USR${1000 + i}`,
    name: ['Giàng A Chỉnh', 'Nguyễn Văn An', 'Trần Thị Mai', 'Lê Văn Nam', 'Phạm Thị Hoa', 'Hoàng Thi Thu', 'Đặng Văn Cường', 'Vũ Thị Lý'][i % 8] + (i > 7 ? ` ${i}` : ''),
    email: `user${i}@aiclinic.com`,
    phone: `090${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    role: role,
    registeredAt: `2026-0${1 + (i % 8)}-${10 + (i % 20)}`,
    lastLogin: `2026-09-17 ${8 + (i % 10)}:${10 + (i % 50)}`,
    status: status
  };
});

export const mockStaff = Array.from({ length: 18 }).map((_, i) => {
  const positions = ['Trưởng khoa', 'Bác sĩ chuyên khoa II', 'Bác sĩ nội trú', 'Trưởng lễ tân', 'Nhân viên lễ tân', 'Kế toán trưởng', 'Chuyên viên IT'];
  const depts = ['Nội tổng quát', 'Tim mạch', 'Da liễu', 'Nhi khoa', 'Sản phụ khoa', 'Ngoại khoa', 'Tai Mũi Họng', 'Hành chính'];
  
  return {
    id: `NV${1000 + i}`,
    name: ['Trần Thị Mai', 'Lê Văn Nam', 'Phạm Thị Hoa', 'Nguyễn Khắc Phục', 'Lý Tự Trọng', 'Hồ Chí Đạt', 'Lê Quang', 'Phạm Thái'][i % 8] + (i > 7 ? ` ${i}` : ''),
    position: i < 2 ? positions[0] : (i < 8 ? positions[1] : (i < 12 ? positions[4] : positions[6])),
    department: depts[i % depts.length],
    email: `staff${i}@aiclinic.com`,
    phone: `098${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
    joinDate: `2024-0${1 + (i % 9)}-01`,
    status: i === 15 ? 'Đã nghỉ việc' : 'Đang làm việc',
    hasAccount: i !== 14
  };
});

export const mockDepartments = [
  { id: 'K01', name: 'Nội tổng quát', doctorCount: 5, roomCount: 3, todayAppointments: 32, status: 'Hoạt động' },
  { id: 'K02', name: 'Tim mạch', doctorCount: 3, roomCount: 2, todayAppointments: 18, status: 'Hoạt động' },
  { id: 'K03', name: 'Da liễu', doctorCount: 2, roomCount: 2, todayAppointments: 25, status: 'Hoạt động' },
  { id: 'K04', name: 'Nhi khoa', doctorCount: 4, roomCount: 3, todayAppointments: 40, status: 'Hoạt động' },
  { id: 'K05', name: 'Sản phụ khoa', doctorCount: 3, roomCount: 2, todayAppointments: 22, status: 'Hoạt động' },
  { id: 'K06', name: 'Ngoại khoa', doctorCount: 4, roomCount: 3, todayAppointments: 15, status: 'Hoạt động' },
  { id: 'K07', name: 'Tai Mũi Họng', doctorCount: 2, roomCount: 2, todayAppointments: 28, status: 'Hoạt động' },
  { id: 'K08', name: 'Răng Hàm Mặt', doctorCount: 2, roomCount: 2, todayAppointments: 20, status: 'Tạm ngưng sửa chữa' }
];

export const mockRooms = [
  { id: 'P101', department: 'Nội tổng quát', type: 'Phòng khám', staff: 'BS. Trần Thị Mai', status: 'Đang sử dụng', todayCount: 15 },
  { id: 'P102', department: 'Nội tổng quát', type: 'Phòng khám', staff: 'BS. Lê Văn Nam', status: 'Đang hoạt động', todayCount: 17 },
  { id: 'P201', department: 'Tim mạch', type: 'Phòng khám chuyên sâu', staff: 'BS. Phạm Thị Hoa', status: 'Đang sử dụng', todayCount: 10 },
  { id: 'P202', department: 'Tim mạch', type: 'Phòng đo điện tâm đồ', staff: 'KTV. Lê Quang', status: 'Bảo trì', todayCount: 0 },
  { id: 'P301', department: 'Da liễu', type: 'Phòng khám', staff: 'BS. Nguyễn Khắc Phục', status: 'Đang hoạt động', todayCount: 12 },
  { id: 'P302', department: 'Da liễu', type: 'Phòng laser', staff: 'KTV. Lý Tự Trọng', status: 'Đang sử dụng', todayCount: 13 },
  { id: 'P401', department: 'Tai Mũi Họng', type: 'Phòng khám & Nội soi', staff: 'BS. Hồ Chí Đạt', status: 'Đang hoạt động', todayCount: 28 },
  { id: 'P402', department: 'Nhi khoa', type: 'Phòng khám', staff: 'BS. Trần Thị C', status: 'Tạm đóng', todayCount: 0 }
];

export const mockSchedules = Array.from({ length: 22 }).map((_, i) => {
  return {
    id: `SCH${1000 + i}`,
    doctor: `BS. ${mockStaff[i % 8].name}`,
    department: mockDepartments[i % 8].name,
    room: mockRooms[i % 8].id,
    shift: i % 2 === 0 ? 'Sáng (07:30 - 11:30)' : 'Chiều (13:00 - 17:00)',
    date: '2026-09-17',
    appointments: Math.floor(Math.random() * 20),
    status: i === 5 ? 'Đã hủy' : 'Bình thường'
  };
});

export const mockSystemNotifications = [
  { id: 1, title: 'Bảo trì hệ thống', category: 'Hệ thống', content: 'Hệ thống sẽ được bảo trì vào 02:00 - 04:00 ngày 18/09.', time: '1 ngày trước', read: false, priority: 'high' },
  { id: 2, title: 'Tài khoản mới được tạo', category: 'Người dùng', content: 'Nhân viên Lê Thị Hương đã được thêm vào hệ thống.', time: '2 giờ trước', read: true, priority: 'normal' },
  { id: 3, title: 'Cảnh báo đăng nhập', category: 'Bảo mật', content: 'Có 3 lần đăng nhập sai liên tiếp vào tài khoản admin.', time: '6 giờ trước', read: false, priority: 'high' },
  { id: 4, title: 'Cập nhật đơn giá dịch vụ', category: 'Hệ thống', content: 'Dịch vụ Xét nghiệm máu đã được cập nhật giá mới.', time: '4 giờ trước', read: true, priority: 'normal' },
  ...Array.from({ length: 11 }).map((_, i) => ({
    id: i + 5,
    title: ['Đồng bộ dữ liệu', 'Cảnh báo hiệu suất', 'Lịch làm việc mới', 'Cập nhật chính sách'][i % 4],
    category: ['Hệ thống', 'Bảo mật', 'Lịch làm việc', 'Người dùng'][i % 4],
    content: 'Nội dung thông báo chi tiết cho sự kiện này trong hệ thống.',
    time: `${i + 1} ngày trước`,
    read: true,
    priority: i % 3 === 0 ? 'high' : 'normal'
  }))
];

export const mockAuditLogs = Array.from({ length: 30 }).map((_, i) => {
  const users = ['Giàng A Chiến', 'Lê Thị Hương', 'Trần Văn B', 'Admin', 'Nguyễn Văn A'];
  const modules = ['Auth', 'System', 'User', 'Schedule', 'Report'];
  const actions = ['Đăng nhập', 'Cập nhật', 'Thêm mới', 'Xóa', 'Đổi mật khẩu', 'Xuất báo cáo'];
  
  return {
    id: `LOG${5000 + i}`,
    time: `2026-09-17 ${8 + (i % 10).toString().padStart(2, '0')}:${10 + (i % 50).toString().padStart(2, '0')}:${(i % 60).toString().padStart(2, '0')}`,
    user: users[i % users.length],
    role: i === 3 ? 'Admin' : (i % 2 === 0 ? 'Bác sĩ' : 'Lễ tân'),
    module: modules[i % modules.length],
    action: actions[i % actions.length],
    details: `Thực hiện thao tác ${actions[i % actions.length].toLowerCase()} trên module ${modules[i % modules.length]}`,
    ip: `192.168.1.${100 + i}`,
    status: i % 9 === 0 ? 'Thất bại' : 'Thành công'
  };
});
