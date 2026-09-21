import { useState, useRef, useEffect } from 'react';
import { Send, Menu } from 'lucide-react';
import AIMessageBubble from './AIMessageBubble';
import { aiAPI } from '@/services/api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface AIChatWindowProps {
  conversationId?: string;
  messages: Message[];
  loading: boolean;
  onSendMessage: (msg: string) => void;
  onToggleMobileSidebar: () => void;
  welcomeTitle?: string;
  welcomeMessage?: React.ReactNode;
  quickActions?: string[];
  warningText?: string;
}

export default function AIChatWindow({
  conversationId, messages, loading, onSendMessage, onToggleMobileSidebar,
  welcomeTitle = 'Xin chào! Tôi có thể giúp gì cho bạn?',
  welcomeMessage = 'Hãy hỏi tôi về lịch hẹn, quy trình khám bệnh hoặc các thông tin y tế khác. Tôi luôn sẵn sàng hỗ trợ bạn 24/7.',
  quickActions = [],
  warningText
}: AIChatWindowProps) {
  
  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex-1 flex flex-col relative h-full">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center p-3 border-b border-[#E2E8F0] bg-white shadow-sm z-10">
        <button 
          onClick={onToggleMobileSidebar}
          className="p-2 text-[#64748B] hover:bg-slate-100 rounded-lg mr-2"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#0B3B78]">AI Assistant</span>
          <span className="text-[10px] text-[#10B981] flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full"></span> Trực tuyến
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto opacity-90">
            <div className="w-16 h-16 bg-blue-100 text-[#0D6EFD] rounded-2xl flex items-center justify-center mb-4">
              <span className="text-2xl">👋</span>
            </div>
            <h3 className="text-lg font-bold text-[#0B3B78] mb-2">{welcomeTitle}</h3>
            <div className="text-sm text-[#64748B] mb-6">{welcomeMessage}</div>
            {quickActions.length > 0 && (
               <div className="flex flex-wrap justify-center gap-2">
                 {quickActions.map((action, idx) => (
                   <button 
                     key={idx} 
                     onClick={() => { setInput(action); onSendMessage(action); }}
                     className="px-3 py-1.5 bg-slate-100 text-[#0B3B78] hover:bg-slate-200 border border-slate-200 rounded-full text-xs font-medium transition-colors"
                   >
                     {action}
                   </button>
                 ))}
               </div>
            )}
          </div>
        ) : (
          messages.map(msg => (
            <AIMessageBubble 
              key={msg.id} 
              role={msg.role} 
              content={msg.content} 
              createdAt={msg.created_at} 
            />
          ))
        )}
        
        {loading && (
          <AIMessageBubble role="assistant" content="" isTyping={true} />
        )}
        <div ref={endRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-[#E2E8F0]">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Nhập câu hỏi của bạn..."
            className="w-full pl-5 pr-14 py-3.5 bg-slate-50 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0D6EFD]/20 focus:border-[#0D6EFD] transition-shadow disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 bottom-2 w-10 bg-[#0D6EFD] text-white rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:hover:bg-[#0D6EFD]"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
        {warningText && (
          <div className="max-w-4xl mx-auto mt-2 text-center text-[11px] text-amber-600 font-medium">
            ⚠️ {warningText}
          </div>
        )}
      </div>
    </div>
  );
}
