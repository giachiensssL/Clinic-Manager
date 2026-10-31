import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { aiAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { 
  Send, Menu, Plus, MessageSquare, Trash2, Check, X, Bot, Paperclip, 
  ChevronRight, Activity, Calendar, Users, FileText, AlertTriangle,
  Square, RotateCcw, Copy, ThumbsUp, ThumbsDown, Sparkles, Database, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AIConfirmationModal from '../AIConfirmationModal';
import { cn } from '@/lib/utils';

// --- CONFIGURATION BASED ON ROLE ---
const getRoleConfig = (role: string) => {
  const normalized = role.toLowerCase();
  
  if (normalized === 'doctor') {
    return {
      title: 'AI Medical Assistant',
      subtitle: 'Trợ lý AI Y khoa Lâm sàng – Hỗ trợ Bác sĩ',
      welcomeTitle: 'AI Medical Assistant – Trợ lý Bác sĩ',
      welcomeMessage: 'Tôi là trợ lý AI chuyên trách hỗ trợ Bác sĩ tra cứu lịch khám buồng bệnh, tóm tắt hồ sơ bệnh án EMR, theo dõi kết quả xét nghiệm và cung cấp thông tin chuyên môn tham khảo.',
      introMessage: `Xin chào Bác sĩ! Tôi là **AI Medical Assistant**. Tôi có thể hỗ trợ Bác sĩ:
- **Lịch khám & Hàng đợi**: Tra cứu lịch khám hôm nay, kiểm tra bệnh nhân đang chờ và phát hiện lịch trùng.
- **Hồ sơ bệnh án EMR**: Tóm tắt tiền sử, sinh hiệu, chẩn đoán, phác đồ điều trị và rà soát hồ sơ còn thiếu thông tin.
- **Cận lâm sàng & Thống kê**: Tổng hợp kết quả xét nghiệm, lịch sử các lần khám và báo cáo khối lượng khám trong tháng.`,
      quickActions: [
        'Lịch khám hôm nay',
        'Bệnh nhân đang chờ',
        'Hồ sơ chưa hoàn tất',
        'Thống kê tháng này',
        'Kiểm tra lịch trùng',
        'Tóm tắt bệnh án'
      ],
      suggestedQuestions: [
        'Hôm nay tôi có bao nhiêu bệnh nhân cần khám?',
        'Liệt kê lịch khám của tôi trong ngày hôm nay.',
        'Những bệnh nhân nào đang chờ khám?',
        'Tóm tắt hồ sơ bệnh án của bệnh nhân mã BN000002.',
        'Bệnh nhân này đã từng khám những lần nào?',
        'Những hồ sơ khám nào còn thiếu thông tin?',
        'Thống kê số lượng bệnh nhân tôi đã khám trong tháng này.',
        'Có lịch khám nào bị trùng không?',
        'Tổng hợp các kết quả xét nghiệm gần đây của bệnh nhân này.'
      ],
      contextModules: ['Lịch khám buồng bệnh', 'Hồ sơ EMR & Cận lâm sàng', 'Hỗ trợ lâm sàng'],
      warningText: 'AI chỉ cung cấp thông tin hỗ trợ lâm sàng mang tính tham khảo, tuyệt đối không thay thế quyết định chuyên môn của Bác sĩ.'
    };
  }
  if (normalized === 'receptionist') {
    return {
      title: 'AI Receptionist Assistant',
      subtitle: 'Điều phối Tiếp đón & Buồng khám',
      welcomeTitle: 'AI Receptionist Assistant – Trợ lý Điều phối Lễ tân',
      welcomeMessage: 'Chào bạn! Tôi là trợ lý AI điều phối lễ tân thông minh tại Clinic AI. Tôi hỗ trợ bạn tiếp nhận bệnh nhân, kiểm tra hàng đợi buồng khám, rà soát lịch trống bác sĩ theo chuyên khoa, phát hiện lịch trùng và thống kê tiếp đón thời gian thực.',
      introMessage: `Xin chào! Tôi là **AI Receptionist Assistant – Trợ lý Điều phối Lễ tân Thông minh**. Tôi đồng hành cùng bạn xử lý nhanh các nghiệp vụ:
- **Tiếp đón & Hàng đợi**: Kiểm tra số lượng bệnh nhân cần tiếp nhận hôm nay, xem danh sách chờ khám và cảnh báo ca chờ quá 30 phút.
- **Lịch hẹn & Lịch trống BS**: Tra cứu lịch trống của Bác sĩ theo chuyên khoa (Da liễu, Nội, Nhi...) vào ngày mai / chiều mai, rà soát ca chưa xác nhận hoặc trùng lịch.
- **Hồ sơ hành chính**: Tra cứu nhanh hồ sơ bệnh nhân qua mã định danh (BN001, BN000002...), họ tên hoặc SĐT.
- **Điều phối buồng khám**: Cập nhật danh sách Bác sĩ trực hôm nay, bảng giá dịch vụ niêm yết và vị trí các phòng ban chức năng.`,
      quickActions: [
        'Tiếp nhận hôm nay',
        'Danh sách chờ khám',
        'Bác sĩ trực hôm nay',
        'Kiểm tra trùng lịch',
        'Lịch trống ngày mai',
        'Tra cứu hồ sơ BN'
      ],
      suggestedQuestions: [
        'Hôm nay có bao nhiêu bệnh nhân cần tiếp nhận?',
        'Danh sách bệnh nhân đang chờ khám hiện tại?',
        'Có bệnh nhân nào đã đến nhưng chưa được tiếp nhận không?',
        'Kiểm tra lịch trống của bác sĩ da liễu ngày mai.',
        'Bệnh nhân mã BN001 đã có hồ sơ chưa?',
        'Tôi muốn đặt lịch cho bệnh nhân này vào chiều mai.',
        'Có lịch khám nào bị trùng không?',
        'Những lịch hẹn nào chưa được xác nhận?',
        'Bác sĩ nào đang làm việc hôm nay?',
        'Thống kê số lượng bệnh nhân đã tiếp nhận trong ngày.'
      ],
      contextModules: ['Hàng đợi sảnh & Tiếp đón', 'Lịch hẹn & Điều phối buồng', 'Tra cứu hành chính & Bảng giá'],
      warningText: null
    };
  }
  if (normalized === 'admin') {
    return {
      title: 'AI Cố vấn Quản trị',
      subtitle: 'Clinic AI Administrative Assistant',
      welcomeTitle: 'AI Cố vấn Quản trị Hệ thống',
      welcomeMessage: 'Tôi là trợ lý AI chuyên trách quản trị hệ thống phòng khám Clinic AI. Tôi giúp bạn truy xuất dữ liệu thực tế, giám sát bảo mật, phân tích doanh thu và theo dõi tình trạng hoạt động.',
      introMessage: `Xin chào Quản trị viên! Tôi là **AI Cố vấn Quản trị – Clinic AI Administrative Assistant**. Tôi có thể hỗ trợ bạn các công việc:
- **Tổng quan & Báo cáo**: Phân tích số liệu người dùng, lịch hẹn khám, thống kê doanh thu và đánh giá tăng trưởng.
- **Bảo mật & Bất thường**: Rà soát nhật ký Audit Log, phát hiện các lần đăng nhập thất bại và kiểm tra thay đổi phân quyền.
- **Quản trị Dịch vụ & AI**: Giám sát danh mục dịch vụ phòng khám và theo dõi trạng thái vận hành của dịch vụ AI.`,
      quickActions: ['Tổng quan hệ thống', 'Thống kê người dùng', 'Kiểm tra bảo mật', 'Báo cáo doanh thu', 'Hoạt động hệ thống', 'Giám sát AI'],
      suggestedQuestions: [
        'Hệ thống hôm nay hoạt động như thế nào?',
        'Có bất thường nào trong hệ thống hôm nay không?',
        'Thống kê số lượng người dùng hiện tại.',
        'Phân tích doanh thu tháng này.',
        'Có bao nhiêu tài khoản mới đăng ký?',
        'Những hoạt động quản trị nào diễn ra gần đây?',
        'Các dịch vụ AI có đang hoạt động không?',
        'Thống kê lượng bệnh nhân theo chuyên khoa.'
      ],
      contextModules: ['Tổng quan hệ thống', 'Bảo mật & Audit', 'Tài chính & Dịch vụ'],
      warningText: null
    };
  }
  if (normalized === 'accountant') {
    return {
      title: 'AI Accounting Assistant',
      subtitle: 'Quản lý Tài chính, Doanh thu & Hóa đơn',
      welcomeTitle: 'AI Accounting Assistant – Trợ lý Kế toán & Kiểm soát Tài chính',
      welcomeMessage: 'Chào bạn! Tôi là trợ lý AI chuyên trách kế toán và kiểm soát tài chính tại Clinic AI. Tôi hỗ trợ bạn tra cứu doanh thu đa kỳ, kiểm soát công nợ hóa đơn, theo dõi giao dịch thanh toán thất bại, đối chiếu chéo chứng từ và phân tích cơ cấu doanh thu theo dịch vụ y tế.',
      introMessage: `Xin chào! Tôi là **AI Accounting Assistant – Trợ lý Kế toán & Kiểm soát Tài chính Thông minh**. Tôi hỗ trợ bạn kiểm soát và quản lý dòng tiền phòng khám:
- **Doanh thu đa kỳ**: Tra cứu doanh thu hôm nay, tổng kết doanh thu tháng này, so sánh tăng trưởng cùng kỳ và tỷ lệ thu hồi dòng tiền.
- **Kiểm soát công nợ & Hóa đơn**: Rà soát hóa đơn chưa thanh toán, nợ đọng một phần và tổng hợp dư nợ viện phí cần thu hồi.
- **Thanh toán & Bất thường**: Kiểm tra phương thức thanh toán (Tiền mặt, Thẻ POS, BHYT), phát hiện giao dịch thất bại và cảnh báo thanh toán trùng lặp.
- **Đối chiếu chéo (Reconciliation)**: Đối soát tự động số tiền giữa Hóa đơn (\`Billing\`) và Giao dịch (\`Payments\`), phát hiện sai lệch và chứng từ chưa khớp.
- **Cơ cấu doanh thu dịch vụ**: Phân tích tỷ trọng và xếp hạng các dịch vụ mang lại doanh thu cao nhất phòng khám.`,
      quickActions: [
        'Doanh thu hôm nay',
        'Doanh thu tháng này',
        'So sánh doanh thu',
        'Hóa đơn chưa trả',
        'Đối chiếu giao dịch',
        'Doanh thu theo dịch vụ'
      ],
      suggestedQuestions: [
        'Doanh thu hôm nay của phòng khám là bao nhiêu?',
        'Tổng doanh thu trong tháng này?',
        'So sánh doanh thu tháng này với tháng trước.',
        'Có bao nhiêu hóa đơn chưa thanh toán?',
        'Liệt kê các giao dịch thanh toán thất bại hôm nay.',
        'Những hóa đơn nào chưa được đối chiếu?',
        'Dịch vụ nào có doanh thu cao nhất trong tháng?',
        'Tổng số tiền hoàn trả trong tháng này?',
        'Có giao dịch nào có dấu hiệu trùng lặp không?',
        'Tổng hợp báo cáo doanh thu theo từng dịch vụ.',
        'Có sự chênh lệch nào giữa hóa đơn và giao dịch thanh toán không?'
      ],
      contextModules: ['Doanh thu & Sổ cái', 'Hóa đơn & Công nợ', 'Giao dịch & Đối chiếu'],
      warningText: 'Tuân thủ quy định bảo mật tài chính: Mọi điều chỉnh hóa đơn, hoàn tiền hoặc ghi nhận công nợ đều yêu cầu chứng từ phê duyệt hợp lệ.'
    };
  }
  
  // Default to Patient
  return {
    title: 'AI Patient Assistant',
    subtitle: 'Chăm sóc & Đồng hành Sức khỏe Bệnh nhân',
    welcomeTitle: 'AI Patient Assistant – Trợ lý Chăm sóc Bệnh nhân',
    welcomeMessage: 'Chào bạn! Tôi là trợ lý AI chăm sóc và hỗ trợ bệnh nhân trực tuyến tại Clinic AI. Tôi luôn sẵn sàng hỗ trợ bạn tra cứu lịch khám, đặt lịch, xem hồ sơ sức khỏe EMR, kiểm tra hóa đơn viện phí và nhận hướng dẫn y tế an toàn.',
    introMessage: `Xin chào bạn! Tôi là **AI Patient Assistant – Trợ lý Chăm sóc & Đồng hành cùng Bệnh nhân**. Tôi luôn sẵn sàng hỗ trợ bạn:
- **Lịch khám & Đặt hẹn**: Tra cứu các ca khám sắp tới, tìm kiếm Bác sĩ theo chuyên khoa, kiểm tra khung giờ trống và hướng dẫn đặt / đổi / hủy lịch hẹn.
- **Hồ sơ sức khỏe EMR**: Xem lại chẩn đoán, đơn thuốc đã kê và kết quả xét nghiệm / chẩn đoán hình ảnh gần nhất của chính bạn.
- **Hóa đơn & Viện phí**: Kiểm tra hóa đơn chưa thanh toán, đối soát trạng thái giao dịch ngân hàng hoặc quét mã QR thanh toán nhanh.
- **Chương trình ưu đãi**: Tra cứu các gói khám sức khỏe tổng quát định kỳ và mã giảm giá hiện hành của phòng khám.
- **Dặn dò & Chăm sóc**: Hướng dẫn chuẩn bị chu đáo trước khi khám và chăm sóc sức khỏe an toàn sau khi thực hiện dịch vụ.`,
    quickActions: [
      'Lịch khám của tôi',
      'Đặt lịch khám Da liễu',
      'Bác sĩ chiều mai',
      'Hồ sơ khám gần đây',
      'Hóa đơn chưa trả',
      'Ưu đãi hiện có'
    ],
    suggestedQuestions: [
      'Tôi có lịch khám nào trong tuần này không?',
      'Tôi muốn đặt lịch khám da liễu.',
      'Có bác sĩ nào còn lịch khám chiều mai không?',
      'Tôi muốn đổi lịch khám đã đặt.',
      'Hồ sơ khám gần đây của tôi có kết quả gì?',
      'Tôi còn hóa đơn nào chưa thanh toán không?',
      'Giao dịch thanh toán của tôi đã thành công chưa?',
      'Hiện tại phòng khám có chương trình khuyến mãi nào?',
      'Tôi cần chuẩn bị những gì trước khi khám?',
      'Sau khi thực hiện dịch vụ, tôi cần lưu ý điều gì?'
    ],
    contextModules: ['Hồ sơ sức khỏe cá nhân', 'Lịch hẹn & Tiếp đón', 'Hóa đơn & Viện phí'],
    warningText: null
  };
};

export default function UnifiedAIChatSystem() {
  const { user } = useAuthStore();
  const role = user?.role || 'patient';
  const config = getRoleConfig(role);

  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingTool, setPendingTool] = useState<any>(null);
  const [activeToolCall, setActiveToolCall] = useState<string | null>(null);
  const [feedbackMap, setFeedbackMap] = useState<Record<string, 'up' | 'down'>>({});
  
  const [input, setInput] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const isStreamingRef = useRef(false);  // track streaming để chỉ auto-scroll khi cần
  const isInitialLoadRef = useRef(true); // tránh auto-scroll khi mới load
  const abortControllerRef = useRef<AbortController | null>(null);

  // Ánh xạ tên Tool sang nhãn tiếng Việt trực quan
  const getToolLabel = (toolName: string) => {
    const map: Record<string, string> = {
      get_my_appointments: 'Đang tra cứu lịch hẹn khám cá nhân...',
      get_my_medical_history: 'Đang truy xuất hồ sơ bệnh án EMR...',
      get_my_prescriptions: 'Đang tra cứu đơn thuốc...',
      get_my_lab_results: 'Đang truy xuất kết quả xét nghiệm...',
      get_my_billings: 'Đang kiểm tra hóa đơn và viện phí...',
      get_clinic_services_and_specialties: 'Đang tra cứu chuyên khoa & bảng giá...',
      get_patient_promotions: 'Đang tìm kiếm chương trình ưu đãi...',
      search_doctors: 'Đang tìm kiếm thông tin bác sĩ...',
      create_my_appointment: 'Đang khởi tạo lịch hẹn khám...',
      cancel_my_appointment: 'Đang xử lý yêu cầu hủy lịch...',
      get_doctor_schedule: 'Đang tra cứu lịch khám buồng bệnh...',
      get_patient_summary: 'Đang tổng hợp tóm tắt bệnh án EMR...',
      get_doctor_patient_history: 'Đang tra cứu tiền sử bệnh nhân...',
      get_doctor_incomplete_records: 'Đang rà soát hồ sơ chưa hoàn tất...',
      get_doctor_workload_stats: 'Đang tổng hợp khối lượng công việc...',
      get_doctor_lab_summary: 'Đang tổng hợp kết quả cận lâm sàng...',
      check_doctor_schedule_conflicts: 'Đang kiểm tra trùng lịch khám...',
      get_receptionist_daily_stats: 'Đang thống kê lượt tiếp nhận hôm nay...',
      get_receptionist_waiting_list: 'Đang lấy danh sách bệnh nhân chờ khám...',
      get_receptionist_unreceived_patients: 'Đang kiểm tra ca chưa check-in...',
      check_receptionist_doctor_slots: 'Đang tra cứu khung giờ trống của bác sĩ...',
      search_patient_profile: 'Đang tra cứu hồ sơ hành chính...',
      get_doctors_on_duty: 'Đang kiểm tra bác sĩ trực...',
      get_clinic_services_and_prices: 'Đang tra cứu bảng giá dịch vụ...',
      get_accountant_revenue_report: 'Đang truy xuất báo cáo doanh thu thực tế...',
      get_accountant_unpaid_invoices: 'Đang rà soát hóa đơn chưa thanh toán...',
      get_accountant_failed_payments: 'Đang kiểm tra giao dịch thanh toán thất bại...',
      get_accountant_reconciliation: 'Đang thực hiện đối soát chứng từ...',
      get_accountant_revenue_by_service: 'Đang phân tích doanh thu theo dịch vụ...',
      get_accountant_refund_and_anomalies: 'Đang kiểm tra hoàn tiền & bất thường...',
      get_system_stats: 'Đang thống kê tổng quan hệ thống...',
      get_admin_system_overview: 'Đang kiểm tra hoạt động toàn hệ thống...',
      get_security_audit_anomalies: 'Đang phân tích Audit Log & an ninh...',
      get_users_list: 'Đang tra cứu danh sách người dùng...',
      get_admin_revenue_analytics: 'Đang phân tích tăng trưởng doanh thu...',
      get_ai_service_monitoring: 'Đang giám sát trạng thái dịch vụ AI...',
      get_specialty_patient_stats: 'Đang thống kê lượt khám theo chuyên khoa...',
    };
    return map[toolName] || `Đang xử lý dữ liệu hệ thống (${toolName})...`;
  };

  // Scroll xuống cuối — chỉ gọi khi cần
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    requestAnimationFrame(() => {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    });
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Auto-scroll khi streaming (chunk mới tới)
  useEffect(() => {
    if (isStreamingRef.current) {
      scrollToBottom('auto');
    }
  }, [messages, activeToolCall]);

  const fetchConversations = async (selectFirstIfEmpty = true) => {
    try {
      const { data } = await aiAPI.getConversations();
      setConversations(data);
      if (selectFirstIfEmpty && data.length > 0 && !activeId) {
        loadConversation(data[0].id);
      } else if (selectFirstIfEmpty && data.length === 0) {
        handleNewChat();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      isInitialLoadRef.current = true;
      setActiveId(id);
      setMessages([]);
      const { data } = await aiAPI.getConversationDetail(id);
      setMessages(data.messages || []);
      // Sau khi load xong history thì scroll xuống cuối (không animation)
      setTimeout(() => scrollToBottom('instant'), 50);
    } catch (err) {
      toast.error('Không thể tải hội thoại');
    }
  };

  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setActiveId(undefined);
    setActiveToolCall(null);
    setLoading(false);
    setMessages([{ id: 'intro', role: 'assistant', content: config.introMessage, created_at: new Date().toISOString() }]);
  };

  const handleDelete = async (id: string) => {
    try {
      await aiAPI.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeId === id) {
        handleNewChat();
      }
      toast.success('Đã xóa hội thoại');
    } catch (err) {
      toast.error('Lỗi khi xóa');
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    isStreamingRef.current = false;
    setLoading(false);
    setActiveToolCall(null);
    toast('Đã dừng tạo câu trả lời', { icon: '⏹️' });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép nội dung vào bộ nhớ tạm');
  };

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    setFeedbackMap(prev => {
      const next = { ...prev };
      if (next[msgId] === type) {
        delete next[msgId];
      } else {
        next[msgId] = type;
      }
      return next;
    });
    toast.success(type === 'up' ? 'Cảm ơn bạn đã đánh giá câu trả lời hữu ích!' : 'Cảm ơn bạn đã phản hồi, chúng tôi sẽ cải thiện tốt hơn!');
  };

  const handleRegenerate = () => {
    if (loading) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg && lastUserMsg.content) {
      setMessages(prev => {
        const lastAssistantIdx = prev.map(m => m.role).lastIndexOf('assistant');
        if (lastAssistantIdx !== -1) {
          return prev.slice(0, lastAssistantIdx);
        }
        return prev;
      });
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const tempMsg = { id: Date.now().toString(), role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setLoading(true);
    setActiveToolCall(null);
    isStreamingRef.current = true;
    setTimeout(() => scrollToBottom('smooth'), 30);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    
    try {
      const token = localStorage.getItem('access_token');
      const base = import.meta.env.VITE_API_URL || '';
      const params = new URLSearchParams({ message: text });
      if (activeId) params.append('conversation_id', activeId);
      
      let response = await fetch(`${base}/api/v1/ai/chat/stream?${params}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        signal: abortController.signal
      });

      // Nếu token hết hạn → thử refresh rồi gọi lại
      if (response.status === 401) {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            const refreshRes = await fetch(`${base}/api/v1/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken })
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              localStorage.setItem('access_token', refreshData.access_token);
              localStorage.setItem('refresh_token', refreshData.refresh_token);
              response = await fetch(`${base}/api/v1/ai/chat/stream?${params}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${refreshData.access_token}` },
                signal: abortController.signal
              });
            } else {
              localStorage.clear();
              window.location.href = '/login';
              return;
            }
          } catch {
            localStorage.clear();
            window.location.href = '/login';
            return;
          }
        } else {
          localStorage.clear();
          window.location.href = '/login';
          return;
        }
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Lỗi máy chủ (${response.status})${errText ? ': ' + errText.slice(0, 100) : ''}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      if (!reader) throw new Error('No stream');

      const assistantMsgId = Date.now().toString() + 'ai';
      let conversationIdSet = false;

      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      }]);

      let done = false;
      let fullText = '';
      let eventBuffer = '';

      const processEvent = (eventText: string) => {
        if (!eventText.startsWith('data: ')) return;
        try {
          const data = JSON.parse(eventText.slice(6));

          if (data.conversation_id && !conversationIdSet) {
            conversationIdSet = true;
            if (!activeId) {
              setActiveId(data.conversation_id);
              aiAPI.getConversations().then(res => {
                setConversations(res.data);
              }).catch(() => {});
            }
          }

          if (data.status === 'tool_call' && data.tool_name) {
            setActiveToolCall(data.tool_name);
          }

          if (typeof data.chunk === 'string') {
            setActiveToolCall(null);
            fullText += data.chunk;
            setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: fullText } : m));
          }

          if (data.status === 'done') {
            setActiveToolCall(null);
          }

          if (data.error) {
            setActiveToolCall(null);
            fullText = typeof data.error === 'string'
              ? data.error
              : 'Dịch vụ AI đang tạm gián đoạn. Vui lòng thử lại sau ít phút.';
            setMessages(prev => prev.map(m => m.id === assistantMsgId
              ? { ...m, content: fullText, isError: false }
              : m
            ));
          }

          if (data.is_tool_call && data.tool_call_details?.requires_confirmation) {
            setActiveToolCall(null);
            setPendingTool(data.tool_call_details);
          }
        } catch {
          // Ignore partial JSON chunks
        }
      };

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) eventBuffer += decoder.decode(value, { stream: true });

        let separatorIndex = eventBuffer.indexOf('\n\n');
        while (separatorIndex >= 0) {
          const eventText = eventBuffer.slice(0, separatorIndex);
          eventBuffer = eventBuffer.slice(separatorIndex + 2);
          processEvent(eventText);
          separatorIndex = eventBuffer.indexOf('\n\n');
        }
      }

      eventBuffer += decoder.decode();
      if (eventBuffer.trim()) processEvent(eventBuffer.trim());
      scrollToBottom('smooth');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Người dùng đã nhấn Dừng (Stop Generation)
        return;
      }
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'err',
        role: 'assistant',
        content: 'Không thể kết nối tới dịch vụ AI lúc này. Nội dung của bạn đã được giữ lại; vui lòng thử gửi lại sau ít giây.',
        isError: false,
        created_at: new Date().toISOString()
      }]);
      scrollToBottom('smooth');
    } finally {
      isStreamingRef.current = false;
      setLoading(false);
      setActiveToolCall(null);
      abortControllerRef.current = null;
    }
  };

  const handleConfirmTool = async () => {
    if (!pendingTool) return;
    setLoading(true);
    try {
      const { data } = await aiAPI.chat({
        message: "Xác nhận hành động",
        conversation_id: activeId,
        action_confirmed: true,
        pending_tool_call: pendingTool.data
      });
      setPendingTool(null);
      setMessages(prev => [...prev, 
        { id: Date.now().toString()+'c1', role: 'user', content: '(Đã xác nhận hành động)', created_at: new Date().toISOString() },
        { id: Date.now().toString()+'c2', role: 'assistant', content: data.response, created_at: new Date().toISOString() }
      ]);
    } catch (err) {
      toast.error('Thực hiện hành động thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTool = () => {
    setPendingTool(null);
    setMessages(prev => [...prev, 
      { id: Date.now().toString()+'c1', role: 'user', content: '(Đã hủy hành động)', created_at: new Date().toISOString() },
      { id: Date.now().toString()+'c2', role: 'assistant', content: 'Đã hủy yêu cầu thao tác.', created_at: new Date().toISOString() }
    ]);
  };

  return (
    <div className="h-full w-full flex gap-3 overflow-hidden">
      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* COLUMN 1: SIDEBAR (DRAWER) */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
               <MessageSquare className="w-4 h-4" />
             </div>
             <span className="font-semibold text-slate-800">Lịch sử Chat</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-md transition-colors">
            <X className="w-5 h-5"/>
          </button>
        </div>
        
        <div className="p-4">
          <button 
            onClick={() => { handleNewChat(); setSidebarOpen(false); }}
            className="w-full bg-[#0B3B78] hover:bg-[#092e5d] text-white rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Cuộc trò chuyện mới
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 scrollbar-thin">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-2">Gần đây</p>
          {conversations.length === 0 ? (
             <div className="text-center py-6 text-sm text-slate-400">Chưa có lịch sử.</div>
          ) : conversations.map(conv => (
            <div 
              key={conv.id}
              onClick={() => { loadConversation(conv.id); setSidebarOpen(false); }}
              className={cn(
                "group px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all",
                activeId === conv.id ? "bg-blue-50/80 border border-blue-100" : "hover:bg-slate-50 border border-transparent"
              )}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <MessageSquare className={cn("w-4 h-4 shrink-0", activeId === conv.id ? "text-blue-600" : "text-slate-400")} />
                <div className="overflow-hidden">
                   <p className={cn("text-sm font-medium truncate", activeId === conv.id ? "text-blue-900" : "text-slate-700")}>{conv.title}</p>
                   <p className="text-[10px] text-slate-400 mt-0.5">{format(new Date(conv.updated_at), 'dd/MM HH:mm', {locale: vi})}</p>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* COLUMN 2: MAIN CHAT */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full min-h-0 min-w-0 overflow-hidden relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-100 px-4 sm:px-6 flex items-center justify-between shrink-0 bg-white z-10">
          <div className="flex items-center gap-3">
             <button onClick={() => setSidebarOpen(true)} className="p-1.5 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors" title="Mở lịch sử">
               <Menu className="w-5 h-5"/>
             </button>
             <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-[#0B3B78] rounded-xl flex items-center justify-center shadow-sm">
               <Bot className="w-5 h-5 text-white" />
             </div>
             <div>
                <h1 className="font-semibold text-slate-800 text-sm">{config.title}</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">Đang hoạt động</span>
                </div>
             </div>
          </div>
          <div className="hidden sm:block text-xs font-medium text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
             Hệ thống AI Clinic
          </div>
        </div>

        {/* Messages */}
        <div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 bg-[#FAFAFA]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6">
                <Bot className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-3">{config.welcomeTitle}</h2>
              <p className="text-center text-slate-500 text-sm leading-relaxed mb-8">{config.welcomeMessage}</p>
              
              {/* Context / Quick questions in empty state for mobile view */}
              <div className="w-full lg:hidden space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-4">Gợi ý tác vụ nhanh</p>
                <div className="grid grid-cols-2 gap-2">
                  {config.quickActions.map((qa, i) => (
                    <button key={i} onClick={() => handleSendMessage(qa)} className="p-3 bg-white border border-slate-200 rounded-xl text-left text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm">
                      {qa}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              {messages.map((msg, idx) => (
                <div key={msg.id || idx} className={cn("group flex w-full gap-4", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  {msg.role === 'assistant' && (
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1 shadow-sm border border-blue-200">
                       <Bot className="w-4 h-4 text-blue-600" />
                     </div>
                  )}
                  <div className={cn(
                    "relative px-5 py-3.5 text-[15px] shadow-sm max-w-[85%]",
                    msg.role === 'user' 
                      ? "bg-[#0B3B78] text-white rounded-2xl rounded-tr-sm"
                      : "bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-a:text-blue-600 font-medium hover:prose-a:text-blue-700 prose-code:text-blue-700 prose-code:bg-blue-50/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-table:w-full prose-table:my-4 prose-table:border-collapse prose-table:rounded-xl prose-table:overflow-hidden prose-table:shadow-sm prose-th:bg-slate-50 prose-th:p-3 prose-th:text-left prose-th:font-semibold prose-th:text-slate-700 prose-th:border-b prose-th:border-slate-200 prose-td:p-3 prose-td:border-b prose-td:border-slate-100 prose-tr:last:border-none prose-tr:hover:bg-slate-50/50 transition-colors"
                  )}>
                    {msg.role === 'assistant' ? (
                      msg.isError ? (
                        <div className="flex flex-col gap-3">
                           <div className="flex items-center gap-2 text-red-600 font-medium">
                             <AlertTriangle className="w-4 h-4" /> Đã xảy ra lỗi
                           </div>
                           <p className="text-sm">{msg.content}</p>
                           <button onClick={() => {
                             const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                             if(lastUserMsg) handleSendMessage(lastUserMsg.content);
                           }} className="self-start text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors">
                             Thử lại
                           </button>
                        </div>
                      ) : msg.content === '' ? (
                        activeToolCall ? (
                          <div className="flex items-center gap-2 py-1 px-1 text-xs font-medium text-blue-700">
                            <Database className="w-4 h-4 text-blue-600 animate-spin" />
                            <span>{getToolLabel(activeToolCall)}...</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 h-5 px-1">
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        )
                      ) : (
                        <div>
                          {activeToolCall && idx === messages.length - 1 && (
                            <div className="inline-flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium text-blue-700 bg-blue-50/80 rounded-lg border border-blue-200 mb-2">
                              <Database className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                              <span>{getToolLabel(activeToolCall)}...</span>
                            </div>
                          )}
                          <div className="overflow-x-auto">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                    
                    {/* Timestamp & Actions */}
                    <div className={cn(
                      "absolute -bottom-6 flex items-center gap-2",
                      msg.role === 'user' ? "right-1" : "left-1"
                    )}>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {format(new Date(msg.created_at || new Date()), 'HH:mm')}
                      </span>
                      {msg.role === 'assistant' && !msg.isError && msg.content !== '' && (
                        <div className="flex items-center gap-1 transition-opacity">
                           <button 
                             onClick={() => handleCopy(msg.content)} 
                             className="p-1 hover:bg-slate-200/80 rounded text-slate-400 hover:text-slate-600 transition-colors" 
                             title="Sao chép nội dung"
                           >
                             <Copy className="w-3 h-3" />
                           </button>
                           <button 
                             onClick={() => handleFeedback(msg.id, 'up')} 
                             className={cn("p-1 hover:bg-slate-200/80 rounded transition-colors", feedbackMap[msg.id] === 'up' ? "text-blue-600 bg-blue-50" : "text-slate-400 hover:text-slate-600")}
                             title="Hữu ích"
                           >
                             <ThumbsUp className="w-3 h-3" />
                           </button>
                           <button 
                             onClick={() => handleFeedback(msg.id, 'down')} 
                             className={cn("p-1 hover:bg-slate-200/80 rounded transition-colors", feedbackMap[msg.id] === 'down' ? "text-red-500 bg-red-50" : "text-slate-400 hover:text-slate-600")}
                             title="Chưa hài lòng"
                           >
                             <ThumbsDown className="w-3 h-3" />
                           </button>
                           {idx === messages.length - 1 && !loading && (
                             <button 
                               onClick={handleRegenerate}
                               className="p-1 hover:bg-slate-200/80 rounded text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1 text-[10px] font-medium ml-1"
                               title="Tạo lại phản hồi"
                             >
                               <RotateCcw className="w-3 h-3" />
                               <span>Tạo lại</span>
                             </button>
                           )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
                <div className="flex w-full gap-4 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1 shadow-sm border border-blue-200">
                     <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="px-5 py-4 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                    {activeToolCall ? (
                      <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
                        <Database className="w-4 h-4 text-blue-600 animate-spin" />
                        <span>{getToolLabel(activeToolCall)}...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 h-5 px-1">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div ref={endRef} className="h-6" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="shrink-0 p-3 sm:p-4 bg-white border-t border-slate-200">
           {config.warningText && (
             <div className="max-w-3xl mx-auto mb-2 text-center text-[11px] text-amber-600 font-medium flex items-center justify-center gap-1">
               <AlertTriangle className="w-3 h-3" /> {config.warningText}
             </div>
           )}
           
           {/* ALWAYS VISIBLE SUGGESTIONS */}
           <div className="max-w-3xl mx-auto mb-2.5 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <span className="text-[11px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" /> Gợi ý nhanh:
              </span>
              {config.suggestedQuestions.map((sq, idx) => (
                <button 
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(sq)}
                  className="whitespace-nowrap px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm shrink-0"
                >
                  {sq}
                </button>
              ))}
           </div>
           <form 
             onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
             className="max-w-3xl mx-auto relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
           >
             <button type="button" className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0 mb-0.5">
               <Paperclip className="w-5 h-5" />
             </button>
             <textarea 
               ref={textareaRef}
               value={input}
               onChange={handleInputChange}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleSendMessage(input);
                 }
               }}
               placeholder="Nhập câu hỏi tự nhiên bằng tiếng Việt... (Shift + Enter để xuống dòng)"
               className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-sm text-slate-800 placeholder:text-slate-400 min-h-[44px] max-h-32 scrollbar-thin outline-none"
               rows={1}
               disabled={loading}
             />
             {loading ? (
               <button 
                 type="button" 
                 onClick={handleStopGeneration}
                 className="p-2.5 mb-0.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shrink-0 flex items-center justify-center shadow-sm"
                 title="Dừng phản hồi"
               >
                 <Square className="w-4 h-4 fill-white" />
               </button>
             ) : (
               <button 
                 type="submit" 
                 disabled={!input.trim()}
                 className="p-2.5 mb-0.5 bg-[#0B3B78] text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-colors shrink-0 flex items-center justify-center shadow-sm"
                 title="Gửi câu hỏi"
               >
                 <Send className="w-4 h-4 ml-0.5" />
               </button>
             )}
           </form>
           <p className="text-center text-[10px] text-slate-400 mt-2">Hội thoại AI tạo sinh kết nối trực tiếp cơ sở dữ liệu phòng khám • Tự do đặt câu hỏi bằng ngôn ngữ tự nhiên</p>
        </div>
      </div>

      {/* COLUMN 3: CONTEXT & QUICK ACTIONS PANEL */}
      <div className="hidden lg:flex flex-col w-72 xl:w-80 shrink-0 h-full min-h-0 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Panel Header */}
        <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-xs sm:text-sm">Trợ lý nghiệp vụ</h3>
              <p className="text-[10px] text-slate-400">Ngữ cảnh & tác vụ nhanh</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
            {config.title.split(' ')[0] || 'AI'}
          </span>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {/* Ngữ cảnh */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Ngữ cảnh hoạt động
            </span>
            <div className="p-2.5 bg-blue-50/60 rounded-xl border border-blue-100/60 mb-2">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Vai trò kích hoạt</span>
              <div className="font-semibold text-slate-800 text-xs mt-0.5">{config.title}</div>
            </div>
            <div className="space-y-1.5">
              {config.contextModules.map((ctx, idx) => (
                <div key={idx} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs font-medium text-slate-600">
                  <span className="flex items-center gap-2 truncate">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{ctx}</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center pt-2">Dữ liệu được phân quyền theo tài khoản</p>
          </div>

          {/* Tác vụ nhanh */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Tác vụ nhanh
            </span>
            <div className="space-y-1.5">
              {config.quickActions.map((qa, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSendMessage(qa)}
                  className="w-full text-left p-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm flex items-center justify-between group"
                >
                  <span className="line-clamp-2">{qa}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 shrink-0 ml-1 transition-colors" />
                </button>
              ))}
            </div>
          </div>

          {/* Gợi ý câu hỏi */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">
              Gợi ý câu hỏi thường dùng
            </span>
            <div className="space-y-1">
              {config.suggestedQuestions.map((sq, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSendMessage(sq)}
                  className="w-full text-left px-2.5 py-2 text-xs text-slate-600 hover:text-blue-600 hover:bg-blue-50/60 rounded-lg transition-colors flex items-start gap-1.5 group border border-transparent hover:border-blue-100"
                >
                  <span className="text-blue-400 group-hover:text-blue-600 mt-0.5">•</span>
                  <span className="line-clamp-2">{sq}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AIConfirmationModal 
        isOpen={!!pendingTool}
        message={pendingTool?.confirmation_message || "Bạn có chắc chắn muốn thực hiện hành động này?"}
        loading={loading}
        onConfirm={handleConfirmTool}
        onCancel={handleCancelTool}
      />
    </div>
  );
}
