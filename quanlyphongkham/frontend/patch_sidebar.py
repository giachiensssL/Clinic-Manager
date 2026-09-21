import os
import re

file_path = "src/components/ai/unified/UnifiedAIChatSystem.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Rename mobileOpen to sidebarOpen
content = content.replace("mobileOpen", "sidebarOpen")
content = content.replace("setMobileOpen", "setSidebarOpen")

# 2. Update Sidebar CSS to be hidden by default and toggleable as a drawer/overlay
# Find COLUMN 1
col1_pattern = r'\{/\* COLUMN 1: SIDEBAR \*/\}.*?(?=\{/\* COLUMN 2: MAIN CHAT \*/\})'
col1_match = re.search(col1_pattern, content, re.DOTALL)
if col1_match:
    old_col1 = col1_match.group(0)
    
    # We will wrap it in an overlay for when sidebarOpen is true
    new_col1 = """{/* SIDEBAR OVERLAY */}
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
      
"""
    content = content.replace(old_col1, new_col1)

# 3. Always show Menu icon to open sidebar, even on Desktop
# Replace:
# <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md">
# with:
# <button onClick={() => setSidebarOpen(true)} className="p-1.5 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors" title="Mở lịch sử">
content = content.replace('className="lg:hidden p-1.5 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md"', 'className="p-1.5 -ml-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors" title="Mở lịch sử"')

# 4. Add always-visible suggested questions right above the input
# Find the Input Area start
input_pattern = r'\{/\* Input Area \*/\}[\s\S]*?(?=<form)'
input_match = re.search(input_pattern, content)
if input_match:
    old_input_header = input_match.group(0)
    
    new_input_header = old_input_header + """
           {/* ALWAY VISIBLE SUGGESTIONS */}
           <div className="max-w-3xl mx-auto mb-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {config.suggestedQuestions.map((sq, idx) => (
                <button 
                  key={idx}
                  onClick={() => handleSendMessage(sq)}
                  className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-medium text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors shadow-sm shrink-0"
                >
                  {sq}
                </button>
              ))}
           </div>
           """
    content = content.replace(old_input_header, new_input_header)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("done patching sidebar and suggestions")
