import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User } from 'lucide-react';
import { format } from 'date-fns';

interface AIMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  isTyping?: boolean;
}

export default function AIMessageBubble({ role, content, createdAt, isTyping }: AIMessageBubbleProps) {
  const isAI = role === 'assistant';

  return (
    <div className={`flex gap-3 w-full ${isAI ? 'justify-start' : 'justify-end'} mb-6`}>
      {isAI && (
        <div className="w-8 h-8 rounded-full bg-[#0D6EFD] flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`flex flex-col ${isAI ? 'items-start max-w-[85%]' : 'items-end max-w-[75%]'}`}>
        <div 
          className={`
            px-4 py-3 rounded-2xl relative shadow-sm
            ${isAI 
              ? 'bg-white text-[#17324D] border border-[#E2E8F0] rounded-tl-sm' 
              : 'bg-[#0D6EFD] text-white rounded-tr-sm'}
          `}
        >
          {isTyping ? (
            <div className="flex gap-1 items-center h-5 px-1">
              <span className="w-1.5 h-1.5 bg-[#0D6EFD]/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-[#0D6EFD]/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-[#0D6EFD]/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            <div className={`${isAI ? 'prose prose-sm max-w-none prose-p:leading-relaxed prose-blue' : 'text-white whitespace-pre-wrap text-sm'}`}>
              {isAI ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                content
              )}
            </div>
          )}
        </div>
        
        {!isTyping && createdAt && (
          <span className="text-[10px] text-[#94A3B8] mt-1.5 px-1 font-medium">
            {format(new Date(createdAt), 'HH:mm')}
          </span>
        )}
      </div>

      {!isAI && (
        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
          <User className="w-4 h-4 text-slate-500" />
        </div>
      )}
    </div>
  );
}
