import os

content_template = """import { useState, useEffect } from 'react';
import AIChatLayout from '@/components/ai/AIChatLayout';
import AIConversationSidebar from '@/components/ai/AIConversationSidebar';
import AIChatWindow from '@/components/ai/AIChatWindow';
import AIConfirmationModal from '@/components/ai/AIConfirmationModal';
import { aiAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function {COMPONENT_NAME}() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<string | undefined>();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Pending Tool Call State
  const [pendingTool, setPendingTool] = useState<any>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

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
    // Add temporary message
    const tempMsg = { id: Date.now().toString(), role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, tempMsg]);
    setLoading(true);
    
    try {
      const { data } = await aiAPI.chat({
        message: text,
        conversation_id: activeId
      });
      
      // Update Active ID if new
      if (data.conversation_id && data.conversation_id !== activeId) {
        setActiveId(data.conversation_id);
        fetchConversations(); // refresh list
      }
      
      // Load exact messages from server to be safe, or just append AI response
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
      toast.error('Có lỗi xảy ra khi gọi AI');
      setMessages(prev => [...prev, {
        id: Date.now().toString() + 'err',
        role: 'assistant',
        content: 'Xin lỗi, tôi chưa thể xử lý yêu cầu lúc này.',
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
    <>
      <div className="p-6 h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0B3B78]">{TITLE}</h1>
          <p className="text-slate-500 mt-1">{SUBTITLE}</p>
        </div>

        <div className="flex-1 min-h-[500px]">
          <AIChatLayout 
            sidebar={
              <AIConversationSidebar 
                conversations={conversations}
                activeId={activeId}
                onSelect={loadConversation}
                onNew={handleNewChat}
                onDelete={handleDelete}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
              />
            }
            chatWindow={
              <AIChatWindow 
                conversationId={activeId}
                messages={messages}
                loading={loading}
                onSendMessage={handleSendMessage}
                onToggleMobileSidebar={() => setMobileOpen(true)}
              />
            }
          />
        </div>
      </div>

      <AIConfirmationModal 
        isOpen={!!pendingTool}
        message={pendingTool?.confirmation_message || "Bạn có chắc chắn muốn thực hiện hành động này?"}
        loading={loading}
        onConfirm={handleConfirmTool}
        onCancel={handleCancelTool}
      />
    </>
  );
}
"""

targets = [
    {
        "file": "src/pages/receptionist/ReceptionistAI.tsx",
        "component": "ReceptionistAI",
        "title": "Tư vấn & Hỗ trợ (AI Lễ Tân)",
        "subtitle": "Trợ lý AI giúp tra cứu lịch khám, xử lý hàng đợi và giải đáp thắc mắc của bệnh nhân."
    },
    {
        "file": "src/pages/doctor/DoctorAIAssistant.tsx",
        "component": "DoctorAIAssistant",
        "title": "Trợ lý Y khoa (AI Bác sĩ)",
        "subtitle": "Hỗ trợ phân tích bệnh án, gợi ý chẩn đoán và tra cứu thông tin y khoa chuyên sâu."
    },
    {
        "file": "src/pages/admin/AIAdminWorkspace.tsx",
        "component": "AIAdminWorkspace",
        "title": "AI Quản trị viên (Admin)",
        "subtitle": "Hỗ trợ phân tích dữ liệu phòng khám, lập báo cáo và quản lý hệ thống."
    }
]

for t in targets:
    content = content_template.replace("{COMPONENT_NAME}", t["component"]).replace("{TITLE}", t["title"]).replace("{SUBTITLE}", t["subtitle"])
    with open(t["file"], "w", encoding="utf-8") as f:
        f.write(content)

print("done")
