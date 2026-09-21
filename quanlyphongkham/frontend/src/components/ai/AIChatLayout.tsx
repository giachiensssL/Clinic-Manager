import React from 'react';

interface AIChatLayoutProps {
  sidebar: React.ReactNode;
  chatWindow: React.ReactNode;
}

export default function AIChatLayout({ sidebar, chatWindow }: AIChatLayoutProps) {
  return (
    <div className="flex h-[calc(100vh-120px)] bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden relative">
      {sidebar}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
        {chatWindow}
      </div>
    </div>
  );
}
