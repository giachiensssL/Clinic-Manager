import { useState } from 'react';
import { Plus, MessageSquare, Trash2, Edit2, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

interface AIConversationSidebarProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function AIConversationSidebar({
  conversations, activeId, onSelect, onNew, onDelete, mobileOpen, setMobileOpen
}: AIConversationSidebarProps) {
  
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        absolute lg:relative inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#E2E8F0] transform transition-transform duration-300 ease-in-out flex flex-col
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <button 
            onClick={() => { onNew(); setMobileOpen(false); }}
            className="flex-1 bg-[#0D6EFD] text-white flex items-center justify-center gap-2 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" /> Đoạn chat mới
          </button>
          <button 
            className="lg:hidden ml-2 p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
          <p className="text-xs font-bold text-[#94A3B8] uppercase px-3 py-2">Lịch sử trò chuyện</p>
          
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-[#94A3B8] text-sm">
              Chưa có lịch sử trò chuyện.
            </div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv.id}
                className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                  activeId === conv.id ? 'bg-blue-50 text-[#0B3B78]' : 'hover:bg-slate-50 text-[#334155]'
                }`}
                onClick={() => { onSelect(conv.id); setMobileOpen(false); }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare className={`w-4 h-4 flex-shrink-0 ${activeId === conv.id ? 'text-[#0D6EFD]' : 'text-[#94A3B8]'}`} />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-[10px] text-[#64748B] mt-0.5">
                      {format(new Date(conv.updated_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  {deletingId === conv.id ? (
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(conv.id); setDeletingId(null); }}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded"
                        title="Xác nhận xóa"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDeletingId(null); }}
                        className="p-1.5 text-slate-600 hover:bg-slate-200 rounded"
                        title="Hủy"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDeletingId(conv.id); }}
                      className={`p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity ${activeId === conv.id ? 'opacity-100' : ''}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
