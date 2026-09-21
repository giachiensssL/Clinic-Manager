import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartPulse, Menu, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_LINKS = [
  { label: 'Trang chủ', href: '#hero' },
  { label: 'Giới thiệu', href: '#intro' },
  { label: 'Tính năng', href: '#features' },
  { label: 'AI', href: '#ai' },
  { label: 'Giải pháp', href: '#roles' },
  { label: 'Bảng giá', href: '#pricing' },
  { label: 'Tin tức', href: '#news' },
  { label: 'Liên hệ', href: '#contact' },
];

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (href: string) => {
    setMobileOpen(false);
    if (href.startsWith('#')) {
      const el = document.getElementById(href.slice(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
        scrolled ? 'bg-white shadow-md' : 'bg-white border-b border-[#D9E5F0]'
      )}
      style={{ height: 72 }}
    >
      <div className="max-w-[1280px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 bg-[#0D6EFD] rounded flex items-center justify-center">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-[#0B3B78] text-base leading-tight">AI Clinic</p>
            <p className="text-[10px] text-[#60758A] leading-tight hidden sm:block">Quản lý phòng khám thông minh</p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map(link => (
            <button
              key={link.label}
              onClick={() => scrollTo(link.href)}
              className="px-3 py-2 text-sm font-medium text-[#17324D] hover:text-[#0D6EFD] hover:bg-[#F2F8FF] rounded transition-colors"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* CTA Buttons */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-semibold text-[#0D6EFD] border border-[#0D6EFD] rounded hover:bg-[#F2F8FF] transition-colors"
          >
            Đăng nhập
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#0D6EFD] rounded hover:bg-[#0B5ED7] transition-colors"
          >
            Đăng ký dùng thử
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="lg:hidden p-2 text-[#17324D] hover:bg-[#F2F8FF] rounded"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-[#D9E5F0] shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map(link => (
              <button
                key={link.label}
                onClick={() => scrollTo(link.href)}
                className="w-full text-left px-3 py-2 text-sm font-medium text-[#17324D] hover:text-[#0D6EFD] hover:bg-[#F2F8FF] rounded transition-colors"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <button onClick={() => navigate('/login')} className="w-full px-4 py-2 text-sm font-semibold text-[#0D6EFD] border border-[#0D6EFD] rounded">Đăng nhập</button>
              <button onClick={() => navigate('/login')} className="w-full px-4 py-2 text-sm font-semibold text-white bg-[#0D6EFD] rounded">Đăng ký dùng thử</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
