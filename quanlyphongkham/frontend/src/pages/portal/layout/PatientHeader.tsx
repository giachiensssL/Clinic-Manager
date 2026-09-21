import { Search, Bell, Menu, User, LogOut, Settings } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function PatientHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 flex-shrink-0 bg-white border-b border-[#E2E8F0] px-4 md:px-6 lg:px-8 flex items-center justify-between z-30 relative shadow-sm">
      <div className="flex items-center gap-3 flex-1">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-[#64748B] hover:bg-[#F8FAFC] rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        
        <div className="hidden sm:flex items-center gap-2 bg-[#F8FAFC] px-3 py-2 rounded-lg border border-[#E2E8F0] focus-within:border-[#0D6EFD] focus-within:ring-1 focus-within:ring-blue-100 transition-all w-full max-w-md">
          <Search className="w-4 h-4 text-[#94A3B8]" />
          <input 
            type="text" 
            placeholder="Tìm kiếm bác sĩ, chuyên khoa, bệnh viện..." 
            className="bg-transparent border-none outline-none text-sm w-full text-[#334155] placeholder:text-[#94A3B8]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Mobile Search Icon */}
        <button className="p-2 text-[#64748B] hover:bg-[#F8FAFC] rounded-full sm:hidden">
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button 
          onClick={() => navigate('/portal/notifications')}
          className="p-2 text-[#64748B] hover:bg-[#F8FAFC] rounded-full relative"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
        </button>

        <div className="w-px h-6 bg-[#E2E8F0] mx-1" />

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-[#F8FAFC] transition-colors"
          >
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.username || 'User')}&background=0D6EFD&color=fff`} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full border border-[#E2E8F0]"
            />
            <div className="hidden md:block text-left">
              <p className="text-sm font-bold text-[#0B3B78] leading-tight">{user?.full_name || user?.username}</p>
              <p className="text-xs text-[#64748B]">Bệnh nhân</p>
            </div>
          </button>

          {profileOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setProfileOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#E2E8F0] py-2 z-50">
                <div className="px-4 py-2 border-b border-[#F1F5F9] mb-1 md:hidden">
                  <p className="text-sm font-bold text-[#0B3B78]">{user?.full_name || user?.username}</p>
                  <p className="text-xs text-[#64748B]">Bệnh nhân</p>
                </div>
                
                <button 
                  onClick={() => { setProfileOpen(false); navigate('/portal/profile'); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC] flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-[#64748B]" />
                  Hồ sơ cá nhân
                </button>
                <button 
                  onClick={() => { setProfileOpen(false); navigate('/portal/settings'); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#334155] hover:bg-[#F8FAFC] flex items-center gap-2"
                >
                  <Settings className="w-4 h-4 text-[#64748B]" />
                  Cài đặt
                </button>
                <div className="h-px bg-[#F1F5F9] my-1" />
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng xuất
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
