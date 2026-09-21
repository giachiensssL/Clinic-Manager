import os

unified_system = """import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { aiAPI } from '@/services/api';
import toast from 'react-hot-toast';
import { Send, Menu, Plus, MessageSquare, Trash2, Check, X, Bot, Paperclip, ChevronRight, Activity, Calendar, Users, FileText, AlertTriangle } from 'lucide-react';
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
      title: 'AI Trợ lý Y khoa',
      subtitle: 'Trợ lý thông minh của Bác sĩ',
      welcomeTitle: 'Trợ lý Y khoa (AI Bác sĩ)',
      welcomeMessage: 'Tôi hỗ trợ phân tích hồ sơ bệnh án, gợi ý chẩn đoán, tổng hợp kết quả xét nghiệm và tra cứu phác đồ điều trị chuyên sâu.',
      quickActions: ['Tóm tắt bệnh án', 'Gợi ý phác đồ', 'Kiểm tra tương tác thuốc', 'Xem lịch khám hôm nay'],
      suggestedQuestions: ['Có bao nhiêu bệnh nhân đang chờ khám?', 'Tóm tắt lịch sử khám của bệnh nhân tiếp theo.', 'Tra cứu phác đồ điều trị tiểu đường type 2.'],
      contextModules: ['Bệnh nhân đang khám', 'Lịch hẹn'],
      warningText: 'AI chỉ cung cấp thông tin hỗ trợ, không thay thế quyết định lâm sàng của bác sĩ.'
    };
  }
  if (normalized === 'receptionist') {
    return {
      title: 'AI Trợ lý Lễ tân',
      subtitle: 'Hỗ trợ hành chính & tiếp đón',
      welcomeTitle: 'Trợ lý AI Lễ Tân',
      welcomeMessage: 'Tôi có thể hỗ trợ bạn tra cứu lịch khám của bác sĩ, quản lý hàng đợi, xử lý các câu hỏi thường gặp của bệnh nhân, hoặc tạo nhanh lịch hẹn.',
      quickActions: ['Tìm bệnh nhân', 'Kiểm tra lịch hẹn', 'Kiểm tra lịch bác sĩ', 'Danh sách chờ'],
      suggestedQuestions: ['Hôm nay có những bác sĩ nào đang làm việc?', 'Tìm lịch hẹn của bệnh nhân Nguyễn Văn A.', 'Hướng dẫn quy trình check-in.'],
      contextModules: ['Hàng đợi', 'Lịch hẹn'],
      warningText: null
    };
  }
  if (normalized === 'admin') {
    return {
      title: 'AI Cố vấn Quản trị',
      subtitle: 'Phân tích hệ thống & vận hành',
      welcomeTitle: 'AI Quản trị viên (Admin)',
      welcomeMessage: 'Tôi giúp phân tích dữ liệu phòng khám, tổng hợp báo cáo doanh thu, đánh giá hiệu suất nhân sự và giám sát hoạt động hệ thống.',
      quickActions: ['Thống kê hệ thống', 'Người dùng', 'Hoạt động hệ thống', 'Báo cáo doanh thu'],
      suggestedQuestions: ['Phân tích doanh thu tháng này.', 'Có bất thường nào trong hệ thống hôm nay không?', 'Thống kê lượng bệnh nhân theo chuyên khoa.'],
      contextModules: ['Thống kê', 'Hoạt động'],
      warningText: null
    };
  }
  if (normalized === 'accountant') {
    return {
      title: 'AI Trợ lý Kế toán',
      subtitle: 'Quản lý tài chính & hóa đơn',
      welcomeTitle: 'AI Kế toán',
      welcomeMessage: 'Tôi hỗ trợ tra cứu hóa đơn, tổng hợp doanh thu, đối soát thanh toán và quản lý các giao dịch tài chính.',
      quickActions: ['Tra cứu hóa đơn', 'Thanh toán', 'Doanh thu', 'Đối soát'],
      suggestedQuestions: ['Tổng doanh thu hôm nay là bao nhiêu?', 'Danh sách hóa đơn chưa thanh toán.', 'Phân tích doanh thu theo bác sĩ.'],
      contextModules: ['Hóa đơn', 'Giao dịch'],
      warningText: null
    };
  }
  
  // Default to Patient
  return {
    title: 'AI Trợ lý Sức khỏe',
    subtitle: 'Đồng hành cùng sức khỏe của bạn',
    welcomeTitle: 'Trợ lý sức khỏe của bạn',
    welcomeMessage: 'Hãy hỏi tôi về lịch hẹn, quy trình khám bệnh, theo dõi hồ sơ sức khỏe, thanh toán hoặc các thông tin y tế khác. Tôi luôn sẵn sàng hỗ trợ bạn 24/7.',
    quickActions: ['Lịch hẹn của tôi', 'Hồ sơ sức khỏe', 'Đơn thuốc', 'Hỏi AI y tế'],
    suggestedQuestions: ['Lịch hẹn sắp tới của tôi là khi nào?', 'Tôi cần chuẩn bị gì trước khi xét nghiệm máu?', 'Quy trình thanh toán bảo hiểm như thế nào?'],
    contextModules: ['Hồ sơ y tế', 'Lịch hẹn cá nhân'],
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingTool, setPendingTool] = useState<any>(null);
  
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchConversations = async () => {
    try {
      const { data } = await aiAPI.getConversations();
      setConversations(data);
      if (data.length > 0 && !activeId) {
        loadConversation(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      setActiveId(id);
      setMessages([]);
      const { data } = await aiAPI.getConversationDetail(id);
      setMessages(data.messages || []);
    } catch (err) {
      toast.error('Không thể tải hội thoại');
    }
  };

  const handleNewChat = () => {
    setActiveId(undefined);
    setMessages([]);
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

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    
    setInput('');
    const tempMsg = { id: Date.now().toString(), role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setLoading(true);
    
    try {
      const { data } = await aiAPI.chat({
        message: text,
        conversation_id: activeId
      });
      
      if (data.conversation_id && data.conversation_id !== activeId) {
        setActiveId(data.conversation_id);
        fetchConversations();
      }
      
      if (data.is_tool_call && data.tool_call_details?.requires_confirmation) {
        setPendingTool(data.tool_call_details);
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString() + 'ai',
          role: 'assistant',
          content: data.response,
          created_at: new Date().toISOString()
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'err',
        role: 'assistant',
        content: 'Không thể xử lý yêu cầu lúc này.',
        isError: true,
        created_at: new Date().toISOString()
      }]);
    } finally {
      setLoading(false);
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
    <div className="h-[calc(100vh-90px)] p-4 flex gap-4 bg-slate-50">
      {/* COLUMN 1: SIDEBAR */}
      <div className={cn(
        "bg-white rounded-2xl shadow-sm border border-slate-200 flex-col w-72 shrink-0 transition-transform lg:flex",
        mobileOpen ? "fixed inset-y-0 left-0 z-50 shadow-2xl flex" : "hidden"
      )}>
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
               <MessageSquare className="w-4 h-4" />
             </div>
             <span className="font-semibold text-slate-800">Trò chuyện</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1 text-slate-400 hover:bg-slate-100 rounded-md"><X className="w-5 h-5"/></button>
        </div>
        
        <div className="p-4">
          <button 
            onClick={() => { handleNewChat(); setMobileOpen(false); }}
            className="w-full bg-[#0B3B78] hover:bg-[#092e5d] text-white rounded-xl py-2.5 px-4 flex items-center justify-center gap-2 transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" /> Cuộc trò chuyện mới
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-2">Gần đây</p>
          {conversations.length === 0 ? (
             <div className="text-center py-6 text-sm text-slate-400">Chưa có lịch sử.</div>
          ) : conversations.map(conv => (
            <div 
              key={conv.id}
              onClick={() => { loadConversation(conv.id); setMobileOpen(false); }}
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
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden relative">
        {/* Chat Header */}
        <div className="h-16 border-b border-slate-100 px-6 flex items-center justify-between shrink-0 bg-white/50 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
             <button onClick={() => setMobileOpen(true)} className="lg:hidden p-1.5 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md">
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#FAFAFA]">
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
                <div key={msg.id || idx} className={cn("flex w-full gap-4", msg.role === 'user' ? "justify-end" : "justify-start")}>
                  {msg.role === 'assistant' && (
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1 shadow-sm border border-blue-200">
                       <Bot className="w-4 h-4 text-blue-600" />
                     </div>
                  )}
                  <div className={cn(
                    "relative px-5 py-3.5 text-[15px] shadow-sm max-w-[85%]",
                    msg.role === 'user' 
                      ? "bg-[#0B3B78] text-white rounded-2xl rounded-tr-sm"
                      : "bg-white border border-slate-200 text-slate-700 rounded-2xl rounded-tl-sm prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-a:text-blue-600 prose-code:text-blue-700 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 prose-table:w-full prose-table:border-collapse prose-th:bg-slate-50 prose-th:p-2 prose-th:border prose-th:border-slate-200 prose-td:p-2 prose-td:border prose-td:border-slate-200"
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
                      ) : (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      )
                    ) : (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    )}
                    
                    {/* Timestamp */}
                    <span className={cn(
                      "text-[10px] absolute -bottom-5 whitespace-nowrap",
                      msg.role === 'user' ? "right-1 text-slate-400" : "left-1 text-slate-400"
                    )}>
                      {format(new Date(msg.created_at || new Date()), 'HH:mm')}
                    </span>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex w-full gap-4 justify-start">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1 shadow-sm border border-blue-200">
                     <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="px-5 py-4 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              <div ref={endRef} className="h-6" />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
           {config.warningText && (
             <div className="max-w-3xl mx-auto mb-2 text-center text-[11px] text-amber-600 font-medium flex items-center justify-center gap-1">
               <AlertTriangle className="w-3 h-3" /> {config.warningText}
             </div>
           )}
           <form 
             onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
             className="max-w-3xl mx-auto relative flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all"
           >
             <button type="button" className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0 mb-0.5">
               <Paperclip className="w-5 h-5" />
             </button>
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleSendMessage(input);
                 }
               }}
               placeholder="Nhập câu hỏi của bạn... (Shift + Enter để xuống dòng)"
               className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 text-sm text-slate-800 placeholder:text-slate-400 min-h-[44px] max-h-32 scrollbar-thin"
               rows={1}
               disabled={loading}
             />
             <button 
               type="submit" 
               disabled={!input.trim() || loading}
               className="p-2.5 mb-0.5 bg-[#0B3B78] text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-colors shrink-0 flex items-center justify-center shadow-sm"
             >
               <Send className="w-4 h-4 ml-0.5" />
             </button>
           </form>
           <p className="text-center text-[10px] text-slate-400 mt-2">AI có thể mắc lỗi. Vui lòng kiểm tra lại thông tin quan trọng.</p>
        </div>
      </div>

      {/* COLUMN 3: CONTEXT PANEL */}
      <div className="hidden lg:flex flex-col w-72 shrink-0 space-y-4">
        {/* Context Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" /> Ngữ cảnh hiện tại
            </h3>
          </div>
          
          <div className="space-y-3">
             <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
               <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 block">Vai trò</span>
               <div className="font-medium text-slate-800 text-sm">{config.title}</div>
             </div>
             
             {config.contextModules.map((ctx, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" /> {ctx}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
             ))}
             <p className="text-[10px] text-slate-400 text-center pt-2">Dữ liệu được cấp quyền tự động</p>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex-1">
          <h3 className="font-semibold text-slate-800 text-sm mb-4">Tác vụ nhanh</h3>
          <div className="space-y-2">
            {config.quickActions.map((qa, idx) => (
              <button 
                key={idx}
                onClick={() => handleSendMessage(qa)}
                className="w-full text-left p-3 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all shadow-sm"
              >
                {qa}
              </button>
            ))}
          </div>

          <h3 className="font-semibold text-slate-800 text-sm mb-3 mt-6">Gợi ý câu hỏi</h3>
          <div className="space-y-2">
            {config.suggestedQuestions.map((sq, idx) => (
              <button 
                key={idx}
                onClick={() => handleSendMessage(sq)}
                className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:text-blue-600 transition-colors"
              >
                "{sq}"
              </button>
            ))}
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
"""

with open("src/components/ai/unified/UnifiedAIChatSystem.tsx", "w", encoding="utf-8") as f:
    f.write(unified_system)

# Generate export file for the new component
with open("src/components/ai/unified/index.ts", "w", encoding="utf-8") as f:
    f.write("export { default as UnifiedAIChatSystem } from './UnifiedAIChatSystem';\n")

print("done creating UnifiedAIChatSystem.tsx")
