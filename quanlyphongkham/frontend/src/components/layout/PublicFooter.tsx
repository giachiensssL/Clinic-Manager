import { HeartPulse, MapPin, Phone, Mail, Globe, MessageCircle } from 'lucide-react';

const FOOTER_NAV = [
  { title: 'Sản phẩm', links: ['Tính năng', 'Bảng giá', 'AI hỗ trợ', 'Bảo mật', 'Cập nhật'] },
  { title: 'Giải pháp', links: ['Phòng khám đa khoa', 'Phòng khám chuyên khoa', 'Bệnh viện', 'Phòng khám tư nhân'] },
  { title: 'Công ty', links: ['Giới thiệu', 'Tin tức', 'Tuyển dụng', 'Đối tác', 'Liên hệ'] },
];

export default function PublicFooter() {
  return (
    <footer style={{ background: 'linear-gradient(180deg, #0B3B78 0%, #07315F 100%)' }}>
      <div className="max-w-[1280px] mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-white rounded flex items-center justify-center flex-shrink-0">
                <HeartPulse className="w-5 h-5 text-[#0D6EFD]" />
              </div>
              <div>
                <p className="font-bold text-white text-base">AI Clinic</p>
                <p className="text-[11px] text-white/50">Vì sức khỏe cộng đồng</p>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-5 max-w-xs">
              Giải pháp quản lý phòng khám thông minh với công nghệ AI tiên tiến, giúp tối ưu hóa quy trình khám chữa bệnh và nâng cao trải nghiệm bệnh nhân.
            </p>
            {/* Contact info */}
            <div className="space-y-2.5">
              {[
                { icon: MapPin, text: 'Số 123 Đường ABC, Quận XY, Hà Nội' },
                { icon: Phone, text: '0123 456 789' },
                { icon: Mail, text: 'support@aiclinic.vn' },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.text} className="flex items-start gap-2.5">
                    <Icon className="w-4 h-4 text-[#0D6EFD] mt-0.5 flex-shrink-0" />
                    <span className="text-white/60 text-sm">{item.text}</span>
                  </div>
                );
              })}
            </div>
            {/* Social */}
            <div className="flex gap-2 mt-5">
              {[Globe, MessageCircle].map((Icon, i) => (
                <button key={i} className="w-8 h-8 rounded border border-white/20 flex items-center justify-center text-white/50 hover:text-white hover:border-white/50 transition-colors">
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          {FOOTER_NAV.map(col => (
            <div key={col.title}>
              <p className="font-semibold text-white text-sm mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map(link => (
                  <li key={link}>
                    <button className="text-white/55 text-sm hover:text-white transition-colors">{link}</button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/40 text-xs">© 2026 AI Clinic. Tất cả quyền được bảo lưu.</p>
          <div className="flex gap-4">
            <button className="text-white/40 text-xs hover:text-white/70 transition-colors">Chính sách bảo mật</button>
            <button className="text-white/40 text-xs hover:text-white/70 transition-colors">Điều khoản sử dụng</button>
            <button className="text-white/40 text-xs hover:text-white/70 transition-colors">Cookie</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
