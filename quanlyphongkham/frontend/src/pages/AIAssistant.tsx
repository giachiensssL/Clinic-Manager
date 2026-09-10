import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Send, ShieldAlert, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiAPI } from '@/services/api';

interface Message {
  id: number;
  role: 'assistant' | 'user';
  content: string;
  isGuardrail?: boolean;
  isLoading?: boolean;
}

const QUICK_ACTIONS = [
  'Đặt lịch khám',
  'Giờ làm việc',
  'Quy trình khám',
  'Kiểm tra lịch trống',
  'Hướng dẫn thanh toán',
  'Hồ sơ cần mang',
];

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      content:
        'Xin chào! Tôi là **Trợ lý AI** của Phòng khám Clinic AI.\n\nTôi có thể hỗ trợ bạn về:\n• 📅 Đặt lịch và kiểm tra lịch trống\n• ⏰ Giờ làm việc và quy trình khám\n• 💳 Thanh toán và bảo hiểm y tế\n• 📄 Hồ sơ cần mang khi khám\n• 🏥 Thông tin chuyên khoa và bác sĩ\n\nBạn cần hỗ trợ gì hôm nay?',
      isGuardrail: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const userMessage = text || input;
    if (!userMessage.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Add loading placeholder
    const loadingId = Date.now() + 1;
    setMessages(prev => [
      ...prev,
      { id: loadingId, role: 'assistant', content: '', isLoading: true },
    ]);

    try {
      const res = await aiAPI.chat({
        message: userMessage,
        conversation_id: conversationId,
      });

      const data = res.data;
      setConversationId(data.conversation_id);

      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId
            ? {
                id: loadingId,
                role: 'assistant',
                content: data.response,
                isGuardrail: data.guardrail_blocked,
                isLoading: false,
              }
            : m
        )
      );
    } catch (err: any) {
      // Fallback nếu backend không kết nối được
      const fallbackMsg = err.response
        ? `Lỗi từ server: ${err.response.data?.detail || 'Không xác định'}`
        : 'Không kết nối được server. Vui lòng kiểm tra backend đang chạy.';

      setMessages(prev =>
        prev.map(m =>
          m.id === loadingId
            ? {
                id: loadingId,
                role: 'assistant',
                content: fallbackMsg,
                isGuardrail: false,
                isLoading: false,
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        id: Date.now(),
        role: 'assistant',
        content:
          'Xin chào! Tôi là **Trợ lý AI** của Phòng khám Clinic AI.\n\nTôi có thể hỗ trợ bạn về:\n• 📅 Đặt lịch và kiểm tra lịch trống\n• ⏰ Giờ làm việc và quy trình khám\n• 💳 Thanh toán và bảo hiểm y tế\n• 📄 Hồ sơ cần mang khi khám\n• 🏥 Thông tin chuyên khoa và bác sĩ\n\nBạn cần hỗ trợ gì hôm nay?',
      },
    ]);
    setConversationId(undefined);
  };

  // Render markdown-like formatting
  const renderContent = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        const boldLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return (
          <span key={i}>
            <span dangerouslySetInnerHTML={{ __html: boldLine }} />
            {i < content.split('\n').length - 1 && <br />}
          </span>
        );
      });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border rounded-t-xl shadow-sm">
        <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
          <Bot className="w-6 h-6 text-violet-600" />
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            AI Clinic Assistant
            <span className="text-xs font-normal bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Powered by Gemini
            </span>
          </h2>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-500">Online • Hỗ trợ hành chính</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleReset}
          title="Bắt đầu cuộc trò chuyện mới"
          className="text-slate-400 hover:text-slate-600"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-6 space-y-6 border-x">
        {messages.map(m => (
          <div
            key={m.id}
            className={cn(
              'flex gap-3 max-w-[88%]',
              m.role === 'user' ? 'ml-auto flex-row-reverse' : ''
            )}
          >
            <div
              className={cn(
                'w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center mt-1',
                m.role === 'assistant'
                  ? 'bg-violet-100 text-violet-600'
                  : 'bg-[#0ea5e9] text-white'
              )}
            >
              {m.role === 'assistant' ? (
                <Bot className="w-5 h-5" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>

            <div
              className={cn(
                'p-4 rounded-2xl shadow-sm text-sm leading-relaxed',
                m.role === 'user'
                  ? 'bg-[#0ea5e9] text-white rounded-tr-none'
                  : m.isGuardrail
                  ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-none'
                  : 'bg-white border text-slate-700 rounded-tl-none'
              )}
            >
              {m.isGuardrail && (
                <div className="flex items-center gap-1.5 text-amber-600 font-bold mb-2 text-xs">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  AI Guardrail Active — Nội dung y tế bị chặn
                </div>
              )}
              {m.isLoading ? (
                <div className="flex items-center gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </div>
              ) : (
                <div className="whitespace-pre-line">{renderContent(m.content)}</div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border rounded-b-xl shadow-sm">
        {/* Quick actions */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 hide-scrollbar">
          {QUICK_ACTIONS.map(q => (
            <button
              key={q}
              onClick={() => handleSend(q)}
              disabled={isLoading}
              className="whitespace-nowrap px-3 py-1.5 rounded-full bg-violet-50 hover:bg-violet-100 text-xs text-violet-700 border border-violet-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Nhập câu hỏi của bạn..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-3">
          🛡️ AI chỉ hỗ trợ hành chính • Không cung cấp tư vấn y tế hay chẩn đoán bệnh
        </p>
      </div>
    </div>
  );
}
