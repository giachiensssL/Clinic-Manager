import { create } from 'zustand';

interface AIAdminState {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  messages: { role: 'user' | 'ai'; content: string }[];
  setMessages: (messages: { role: 'user' | 'ai'; content: string }[] | ((prev: { role: 'user' | 'ai'; content: string }[]) => { role: 'user' | 'ai'; content: string }[])) => void;
  conversationId: string | undefined;
  setConversationId: (id: string | undefined) => void;
}

const initialMessages: { role: 'user' | 'ai'; content: string }[] = [
  { role: 'ai', content: 'Xin chào Quản trị viên, tôi là AI Trợ lý quản trị của hệ thống.\n\nTôi có thể hỗ trợ bạn các công việc sau:\n- 📊 Phân tích hoạt động và hiệu suất của phòng khám\n- 👥 Theo dõi và phân tích dữ liệu người dùng, nhân viên\n- 🔐 Kiểm tra các cảnh báo bảo mật và truy cập bất thường\n- 📅 Tối ưu hóa lịch làm việc và phân bổ phòng\n- 📈 Trích xuất và tóm tắt báo cáo hệ thống nhanh chóng\n\nLưu ý: Tôi chỉ truy cập các dữ liệu quản trị hệ thống và sẽ không can thiệp vào hồ sơ bệnh án hay chỉ định y khoa.\n\nBạn cần tôi hỗ trợ vấn đề gì hôm nay?' }
];

export const useAIAdminStore = create<AIAdminState>((set) => ({
  activeTab: 'chat',
  setActiveTab: (tab) => set({ activeTab: tab }),
  messages: initialMessages,
  setMessages: (msgs) => set((state) => ({ 
    messages: typeof msgs === 'function' ? msgs(state.messages) : msgs 
  })),
  conversationId: undefined,
  setConversationId: (id) => set({ conversationId: id }),
}));
