import { useNavigate } from 'react-router-dom';
import PublicHeader from '@/components/layout/PublicHeader';
import PublicFooter from '@/components/layout/PublicFooter';
import {
  Users, Calendar, FileText, Pill, CreditCard, Bot, BarChart3,
  UserCog, FlaskConical, Shield, CheckCircle2, ArrowRight,
  HeartPulse, Stethoscope, Activity, Star, Quote,
  Zap, Clock, TrendingUp, Lock, Bell, Layers,
  ChevronRight, Play, Award, Phone,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ─── Static data ──────────────────────────────────────────────────────────────
const STATS = [
  { value: '10.000+', label: 'Bệnh nhân tin dùng', icon: Users },
  { value: '48',      label: 'Phòng khám đối tác', icon: HeartPulse },
  { value: '320+',   label: 'Bác sĩ & nhân viên y tế', icon: Stethoscope },
  { value: '99.9%',  label: 'Thời gian hoạt động hệ thống', icon: Activity },
];

const FEATURES = [
  { icon: Users,       color: '#0D6EFD', bg: '#EBF3FF', title: 'Quản lý bệnh nhân',         desc: 'Lưu trữ, tìm kiếm và quản lý toàn bộ hồ sơ bệnh nhân tập trung.' },
  { icon: Calendar,   color: '#10B981', bg: '#ECFDF5', title: 'Quản lý lịch hẹn',           desc: 'Đặt lịch, xác nhận và theo dõi lịch hẹn theo thời gian thực.' },
  { icon: Stethoscope,color: '#8B5CF6', bg: '#F5F3FF', title: 'Quản lý khám bệnh',          desc: 'Tiếp nhận, quản lý phòng khám và theo dõi quy trình thăm khám.' },
  { icon: FileText,   color: '#F59E0B', bg: '#FFFBEB', title: 'Hồ sơ bệnh án điện tử',      desc: 'EMR số hóa, chữ ký điện tử và lưu trữ an toàn theo chuẩn y tế.' },
  { icon: Pill,        color: '#EF4444', bg: '#FEF2F2', title: 'Quản lý đơn thuốc',          desc: 'Kê đơn điện tử, kiểm tra tương tác thuốc và quản lý kho dược.' },
  { icon: FlaskConical,color:'#06B6D4', bg: '#ECFEFF', title: 'Quản lý xét nghiệm',         desc: 'Tích hợp kết quả xét nghiệm, chẩn đoán hình ảnh trực tiếp.' },
  { icon: CreditCard, color: '#0EA5E9', bg: '#F0F9FF', title: 'Thanh toán & hóa đơn',       desc: 'Hỗ trợ BHYT, nhiều hình thức thanh toán và xuất hóa đơn điện tử.' },
  { icon: BarChart3,  color: '#16A34A', bg: '#F0FDF4', title: 'Báo cáo & thống kê',         desc: 'Dashboard trực quan, báo cáo doanh thu và phân tích hiệu suất.' },
  { icon: UserCog,    color: '#7C3AED', bg: '#F5F3FF', title: 'Quản lý nhân sự',            desc: 'Phân quyền theo vai trò, quản lý ca làm việc và hiệu suất.' },
  { icon: Bot,         color: '#0D6EFD', bg: '#EBF3FF', title: 'AI hỗ trợ thông minh',       desc: 'Trợ lý AI 24/7, tóm tắt bệnh án, gợi ý chẩn đoán và đặt lịch tự động.' },
];

const INTRO_FEATURES = [
  { icon: Users,       title: 'Quản lý bệnh nhân',     desc: 'Lưu trữ hồ sơ, lịch sử khám, tra cứu nhanh chóng' },
  { icon: Calendar,    title: 'Đặt lịch & Tiếp đón',   desc: 'Đặt lịch trực tuyến, quản lý lịch hẹn, giảm thời gian chờ' },
  { icon: FileText,    title: 'Khám bệnh & Bệnh án',   desc: 'Ghi chép, lưu trữ, tra cứu bệnh án điện tử' },
  { icon: Pill,        title: 'Nhà thuốc & Kê đơn',    desc: 'Quản lý thuốc, đơn thuốc, tương tác thuốc' },
  { icon: CreditCard,  title: 'Thanh toán & Bảo hiểm', desc: 'Tích hợp thanh toán, BHYT, ví điện tử, hóa đơn' },
  { icon: BarChart3,   title: 'Báo cáo & Thống kê',    desc: 'Doanh thu, hiệu suất, báo cáo dễ dàng' },
  { icon: UserCog,     title: 'Quản lý danh mục',      desc: 'Thuốc, dịch vụ, chi phí, nhân sự' },
  { icon: Bot,         title: 'AI Hỗ trợ',             desc: 'Chẩn đoán, tóm tắt bệnh án, tư vấn chăm sóc' },
  { icon: Phone,       title: 'Ứng dụng di động',      desc: 'Đồng bộ dữ liệu, tiện lợi mọi lúc mọi nơi' },
];

const AI_ROLES = [
  { role: 'AI hỗ trợ Bác sĩ',      desc: 'Tóm tắt bệnh án, gợi ý chẩn đoán, nhắc nhở điều trị và phân tích dữ liệu lâm sàng.', color: '#0D6EFD', bg: '#EBF3FF', icon: Stethoscope },
  { role: 'AI hỗ trợ Bệnh nhân',   desc: 'Đặt lịch tự động, nhắc thuốc, trả lời câu hỏi sức khỏe và hướng dẫn quy trình khám.', color: '#10B981', bg: '#ECFDF5', icon: Users },
  { role: 'AI hỗ trợ Lễ tân',      desc: 'Tiếp nhận thông tin bệnh nhân, xác nhận lịch hẹn và điều phối hàng chờ thông minh.', color: '#8B5CF6', bg: '#F5F3FF', icon: Phone },
  { role: 'AI hỗ trợ Quản trị',    desc: 'Phân tích doanh thu, dự báo xu hướng và đưa ra đề xuất tối ưu hóa vận hành.', color: '#F59E0B', bg: '#FFFBEB', icon: BarChart3 },
  { role: 'AI phân tích dữ liệu',  desc: 'Khai thác dữ liệu lớn, phát hiện bất thường và tạo báo cáo thông minh tự động.', color: '#EF4444', bg: '#FEF2F2', icon: Activity },
];

const ROLES = [
  { role: 'Bệnh nhân',    icon: Users,     color: '#0D6EFD', bg: '#EBF3FF', desc: 'Đặt lịch trực tuyến, theo dõi lịch khám, xem hồ sơ sức khỏe và nhận hỗ trợ từ AI 24/7.' },
  { role: 'Bác sĩ',       icon: Stethoscope,color:'#10B981', bg: '#ECFDF5', desc: 'Quản lý lịch khám, lập bệnh án điện tử, chẩn đoán và kê đơn thuốc nhanh chóng.' },
  { role: 'Lễ tân',       icon: Phone,     color: '#8B5CF6', bg: '#F5F3FF', desc: 'Tiếp nhận bệnh nhân, quản lý lịch hẹn, điều phối hàng chờ và check-in thông minh.' },
  { role: 'Kế toán',      icon: CreditCard,color: '#F59E0B', bg: '#FFFBEB', desc: 'Quản lý hóa đơn, thanh toán BHYT, thu công nợ và xuất báo cáo tài chính.' },
  { role: 'Quản trị viên',icon: UserCog,   color: '#EF4444', bg: '#FEF2F2', desc: 'Toàn quyền quản lý hệ thống: người dùng, cấu hình, phân quyền và theo dõi audit log.' },
];

const WORKFLOW_STEPS = [
  { step: 1, title: 'Đặt lịch',   desc: 'Online / AI' },
  { step: 2, title: 'Tiếp nhận', desc: 'Check-in nhanh' },
  { step: 3, title: 'Khám bệnh', desc: 'Phòng khám' },
  { step: 4, title: 'Chẩn đoán', desc: 'AI hỗ trợ' },
  { step: 5, title: 'Điều trị',  desc: 'Kê đơn số' },
  { step: 6, title: 'Thanh toán',desc: 'BHYT / Cash' },
  { step: 7, title: 'Theo dõi',  desc: 'Hồ sơ số' },
];

const BENEFITS = [
  'Giảm 60% thời gian xử lý hành chính',
  'Loại bỏ hồ sơ giấy, quản lý số hóa toàn phần',
  'Quản lý tập trung mọi hoạt động phòng khám',
  'Tăng trải nghiệm và hài lòng bệnh nhân',
  'AI hỗ trợ bác sĩ 24/7, giảm sai sót',
  'Theo dõi hoạt động theo thời gian thực',
  'Bảo mật dữ liệu chuẩn y tế quốc tế',
  'Báo cáo trực quan, quyết định dựa trên dữ liệu',
];

const SERVICES = [
  { icon: Stethoscope, label: 'Khám tổng quát',       color: '#0D6EFD', bg: '#EBF3FF' },
  { icon: Activity,    label: 'Khám chuyên khoa',      color: '#10B981', bg: '#ECFDF5' },
  { icon: FlaskConical,label: 'Xét nghiệm',            color: '#8B5CF6', bg: '#F5F3FF' },
  { icon: Shield,      label: 'Chẩn đoán hình ảnh',   color: '#F59E0B', bg: '#FFFBEB' },
  { icon: HeartPulse,  label: 'Tiêm chủng',            color: '#EF4444', bg: '#FEF2F2' },
  { icon: Bot,         label: 'Tư vấn sức khỏe AI',   color: '#7C3AED', bg: '#F5F3FF' },
];

const TESTIMONIALS = [
  {
    name: 'BS. Nguyễn Thị Lan',
    role: 'Bác sĩ nội khoa - Phòng khám Minh Đức',
    stars: 5,
    text: 'AI Clinic giúp tôi tiết kiệm hơn 2 giờ mỗi ngày cho công việc giấy tờ. Hệ thống bệnh án điện tử và AI gợi ý chẩn đoán thực sự hữu ích và chính xác.',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    name: 'Trần Văn Minh',
    role: 'Giám đốc - Phòng khám Đa khoa An Bình',
    stars: 5,
    text: 'Sau 3 tháng sử dụng AI Clinic, doanh thu phòng khám tăng 35% và số lượng bệnh nhân tái khám tăng đáng kể nhờ hệ thống nhắc lịch tự động.',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    name: 'Phạm Thị Hoa',
    role: 'Lễ tân - Phòng khám Sức khỏe Xanh',
    stars: 5,
    text: 'Giao diện thân thiện, dễ sử dụng. Tôi chỉ mất 30 phút để nắm được hệ thống. Check-in bệnh nhân nhanh gấp 3 lần so với trước đây.',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
];

const NEWS = [
  { 
    date: '12/09/2026', 
    tag: 'Công nghệ', 
    title: 'AI trong y tế: Tương lai của khám chữa bệnh tại Việt Nam', 
    color: '#0D6EFD',
    url: 'https://suckhoedoisong.vn/tri-tue-nhan-tao-trong-cham-soc-suc-khoe-qua-khu-hien-tai-va-tuong-lai-doi-voi-nen-y-te-viet-nam-169240919165417254.htm',
    image: 'https://suckhoedoisong.qltns.mediacdn.vn/zoom/1200_630/324455921873985536/2024/9/19/tri-tue-nhan-tao-trong-linh-vuc-y-te-17267393179541957349110-66-0-475-653-crop-1726739616116455523336.png'
  },
  { 
    date: '08/09/2026', 
    tag: 'Sức khỏe', 
    title: 'Số hóa hồ sơ bệnh án điện tử - xu hướng tất yếu của phòng khám hiện đại', 
    color: '#10B981',
    url: 'https://chinhsachcuocsong.vnanet.vn/hieu-qua-tu-so-hoa-benh-an-dien-tu/19842.html',
    image: 'https://imgchinhsachcuocsong.vnanet.vn/MediaUpload/Medium/2023/06/14/094022-benhandientu.jpg'
  },
  { 
    date: '05/09/2026', 
    tag: 'Tư vấn',   
    title: '5 cách giúp phòng khám tăng trải nghiệm bệnh nhân với công nghệ', 
    color: '#8B5CF6',
    url: 'https://vttechsolution.com/chi-tiet-ban-tin/bat-mi-5-cach-giup-ban-van-hanh-va-quan-ly-phong-kham-hieu-qua',
    image: 'https://cdnvttimg.vttechsolution.com/ImageDocsys/_Library/5-cach-van-hanh-va-quan-ly-phong-kham%20copy(20230725091519).webp'
  },
];

// Chart data for system preview
const CHART_DATA = [
  { name: 'T2', value: 32 }, { name: 'T3', value: 45 }, { name: 'T4', value: 38 },
  { name: 'T5', value: 52 }, { name: 'T6', value: 61 }, { name: 'T7', value: 48 }, { name: 'CN', value: 55 },
];
const PIE_DATA = [
  { name: 'Nội khoa', value: 40 }, { name: 'Da liễu', value: 25 },
  { name: 'Tim mạch', value: 20 }, { name: 'Khác', value: 15 },
];
const PIE_COLORS = ['#0D6EFD', '#10B981', '#8B5CF6', '#F59E0B'];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans" style={{ color: '#17324D' }}>
      <PublicHeader />

      {/* ════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section id="hero" className="relative pt-[72px] overflow-hidden min-h-[600px] flex items-center">
        {/* Full Background Image */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-no-repeat"
          style={{ backgroundImage: "url('/anh/backgroud.webp')", backgroundPosition: 'center center' }}
        />
        
        {/* Lớp sương mù (gradient) chỉ phủ khu vực có chữ để ảnh nền được rõ nét nhất */}
        {/* Mobile: phủ từ trên xuống */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-white/95 via-white/80 to-white/20 lg:hidden" />
        
        {/* Desktop: phủ từ trái sang phải, mờ dần sớm hơn bản cũ để lộ nhiều ảnh nền hơn */}
        <div 
          className="hidden lg:block absolute inset-0 z-0"
          style={{ background: 'linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 30%, rgba(255,255,255,0) 55%)' }}
        />

        <div className="relative z-10 max-w-[1280px] w-full mx-auto px-6 py-16 lg:py-28 flex flex-col lg:flex-row items-center gap-12">
          {/* Left content - Trả lại bố cục cũ (không viền ô vuông) */}
          <div className="flex-1 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-[#D9E5F0] rounded px-3 py-1.5 mb-5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#0D6EFD] animate-pulse" />
              <span className="text-xs font-semibold text-[#0D6EFD] uppercase tracking-wide">Hệ thống quản lý phòng khám 4.0</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-5" style={{ color: '#0B3B78' }}>
              Quản lý phòng khám<br />
              <span style={{ color: '#0D6EFD' }}>thông minh cùng AI</span>
            </h1>
            <p className="text-base font-medium leading-relaxed mb-8" style={{ color: '#60758A' }}>
              Giải pháp quản lý phòng khám hiện đại, giúp tối ưu quy trình khám chữa bệnh, quản lý bệnh nhân và hỗ trợ đội ngũ y tế bằng trí tuệ nhân tạo.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded transition-all hover:opacity-90 shadow-lg shadow-blue-200"
                style={{ background: '#0D6EFD' }}
              >
                Dùng thử miễn phí <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-white/80 backdrop-blur-sm border rounded transition-colors hover:bg-white"
                style={{ color: '#0B3B78', borderColor: '#D9E5F0' }}
              >
                <Play className="w-4 h-4" /> Khám phá hệ thống
              </button>
            </div>
            {/* Feature pills */}
            <div className="grid grid-cols-2 gap-3 max-w-md">
              {[
                { icon: Zap,        label: 'Triển khai nhanh' },
                { icon: Lock,       label: 'Bảo mật cao' },
                { icon: Bot,        label: 'AI tích hợp sẵn' },
                { icon: BarChart3,  label: 'Báo cáo thông minh' },
              ].map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex items-center gap-2.5 bg-white/90 backdrop-blur-sm border border-[#D9E5F0] rounded px-3 py-2.5 shadow-sm">
                    <div className="w-7 h-7 rounded bg-[#EBF3FF] flex items-center justify-center flex-shrink-0">
                      <Icon className="w-3.5 h-3.5 text-[#0D6EFD]" />
                    </div>
                    <span className="text-xs font-medium" style={{ color: '#17324D' }}>{f.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Empty right area to let the background image shine */}
          <div className="flex-1 hidden lg:block">
             <div className="h-[300px] w-full"></div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-[#D9E5F0] bg-white">
          <div className="max-w-[1280px] mx-auto px-6 py-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#EBF3FF] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#0D6EFD]" />
                  </div>
                  <div>
                    <p className="text-xl font-bold" style={{ color: '#0B3B78' }}>{s.value}</p>
                    <p className="text-xs" style={{ color: '#60758A' }}>{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          ABOUT / INTRO
      ════════════════════════════════════════════════════ */}
      <section id="intro" className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0D6EFD] mb-3">Về AI Clinic</p>
            <h2 className="text-3xl font-bold mb-5" style={{ color: '#0B3B78' }}>
              Đối tác tin cậy của y tế hiện đại
            </h2>
            <p className="text-[15px] max-w-3xl mx-auto leading-relaxed" style={{ color: '#60758A' }}>
              Hơn cả một phần mềm quản lý, AI Clinic là giải pháp chuyển đổi số toàn diện kết hợp trí tuệ nhân tạo, giúp các cơ sở y tế vận hành thông minh, tối ưu chi phí và nâng tầm trải nghiệm chăm sóc sức khỏe cho bệnh nhân.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Background line connecting the cards on desktop */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-[#D9E5F0] to-transparent z-0" />
            
            {/* Sứ mệnh */}
            <div className="relative z-10 flex flex-col items-center text-center p-6 bg-white">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#EBF3FF] to-white border border-[#D9E5F0] shadow-sm flex items-center justify-center mb-6 rotate-3 hover:rotate-0 transition-transform">
                <HeartPulse className="w-10 h-10 text-[#0D6EFD]" />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#0B3B78' }}>Sứ mệnh</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#60758A' }}>
                Giải phóng đội ngũ y tế khỏi gánh nặng thủ tục hành chính, trao quyền cho họ tập trung 100% vào việc cứu chữa và chăm sóc bệnh nhân.
              </p>
            </div>

            {/* Tầm nhìn */}
            <div className="relative z-10 flex flex-col items-center text-center p-6 bg-white">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#ECFDF5] to-white border border-[#A7F3D0] shadow-sm flex items-center justify-center mb-6 -rotate-3 hover:rotate-0 transition-transform">
                <Activity className="w-10 h-10 text-[#10B981]" />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#0B3B78' }}>Tầm nhìn</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#60758A' }}>
                Trở thành nền tảng quản trị y tế thông minh số 1 Đông Nam Á, tiên phong đưa công nghệ AI vào hỗ trợ chẩn đoán lâm sàng và vận hành.
              </p>
            </div>

            {/* Giá trị cốt lõi */}
            <div className="relative z-10 flex flex-col items-center text-center p-6 bg-white">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F5F3FF] to-white border border-[#DDD6FE] shadow-sm flex items-center justify-center mb-6 rotate-3 hover:rotate-0 transition-transform">
                <Shield className="w-10 h-10 text-[#8B5CF6]" />
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ color: '#0B3B78' }}>Giá trị cốt lõi</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#60758A' }}>
                Bảo mật dữ liệu tuyệt đối theo chuẩn quốc tế Y tế. Đặt bệnh nhân làm trung tâm và không ngừng cải tiến đột phá công nghệ.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          BENEFITS BANNER (clinic image section)
      ════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="rounded overflow-hidden grid grid-cols-1 lg:grid-cols-2 min-h-[320px]">
            {/* Left: text */}
            <div className="p-10 flex flex-col justify-center" style={{ background: 'linear-gradient(135deg, #0B3B78 0%, #1565C0 100%)' }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-3">Lợi ích khi sử dụng AI Clinic</p>
              <h2 className="text-2xl font-bold text-white mb-4 leading-snug">
                Giải pháp giúp phòng khám vận hành hiệu quả, nâng cao trải nghiệm bệnh nhân và tối ưu doanh thu.
              </h2>
              <ul className="space-y-2 mb-6">
                {BENEFITS.slice(0, 4).map(b => (
                  <li key={b} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-white/80 text-sm">{b}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/login')}
                className="self-start flex items-center gap-2 px-5 py-2.5 bg-white text-[#0B3B78] font-semibold text-sm rounded hover:bg-blue-50 transition-colors"
              >
                Tìm hiểu thêm <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Clinic visual */}
            <div 
              className="relative min-h-[260px] bg-cover bg-center" 
              style={{ backgroundImage: "url('/anh/loiich.webp')" }}
            >
              <div className="absolute inset-0 bg-[#0B3B78]/20"></div>
              <div className="absolute inset-0 flex items-center justify-center relative z-10">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-white/50 border-2 border-white/70 flex items-center justify-center mx-auto mb-4">
                    <HeartPulse className="w-12 h-12 text-[#0D6EFD]" />
                  </div>
                  <div className="bg-white/80 border border-white/50 rounded px-4 py-2 inline-block">
                    <p className="font-bold text-[#0B3B78] text-base">AI Clinic</p>
                    <p className="text-[#0D6EFD] text-xs">Vì sức khỏe cộng đồng</p>
                  </div>
                </div>
              </div>
              {/* Decorative circles */}
              <div className="absolute top-6 right-6 w-16 h-16 rounded-full border-2 border-[#0D6EFD]/20" />
              <div className="absolute bottom-6 left-6 w-10 h-10 rounded-full border-2 border-[#0D6EFD]/20" />
              <div className="absolute top-1/2 right-8 w-6 h-6 rounded-full bg-[#0D6EFD]/15" />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════ */}
      <section id="features" className="py-20" style={{ background: '#F6FAFE' }}>
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex flex-col xl:flex-row items-center xl:items-start gap-12 xl:gap-8">
            
            {/* Left text column */}
            <div className="w-full xl:w-[380px] flex-shrink-0 text-center xl:text-left">
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#0D6EFD] mb-4">Tính năng nổi bật</p>
              <h2 className="text-[28px] lg:text-[32px] font-bold mb-5 leading-[1.3]" style={{ color: '#0B3B78' }}>
                Giải pháp toàn diện cho<br />mọi hoạt động của phòng khám
              </h2>
              <p className="text-[13px] leading-relaxed mb-8 max-w-xl mx-auto xl:mx-0" style={{ color: '#60758A' }}>
                Từ quản lý bệnh nhân, lịch hẹn, hồ sơ bệnh án đến báo cáo tài chính, AI Clinic giúp bạn vận hành phòng khám một cách thông minh, nhanh chóng và chuyên nghiệp.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-white rounded-lg transition-all hover:bg-blue-700 shadow-md shadow-blue-200"
                style={{ background: '#0D6EFD' }}
              >
                Khám phá tất cả tính năng
              </button>
            </div>

            {/* Right: 3x3 Feature Grid */}
            <div className="flex-1 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {INTRO_FEATURES.map(f => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} className="bg-white border border-[#EBF3FF] rounded-xl p-4 flex items-start gap-3 hover:shadow-md transition-shadow">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#EBF3FF]">
                        <Icon className="w-4.5 h-4.5 text-[#0D6EFD]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[13px] mb-1" style={{ color: '#17324D' }}>{f.title}</h3>
                        <p className="text-[#60758A] text-[11px] leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          SYSTEM PREVIEW
      ════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0D6EFD] mb-3">Tổng quan hệ thống</p>
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#0B3B78' }}>Quản lý toàn bộ phòng khám trên một nền tảng</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: '#60758A' }}>
              Dashboard trực quan, báo cáo thời gian thực và công cụ AI giúp bạn nắm bắt toàn bộ hoạt động phòng khám chỉ trong một màn hình.
            </p>
          </div>

          {/* Dashboard mockup */}
          <div className="border border-[#D9E5F0] rounded overflow-hidden shadow-xl">
            {/* Mockup header */}
            <div className="h-9 bg-[#F6FAFE] border-b border-[#D9E5F0] flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-4 h-5 bg-white border border-[#D9E5F0] rounded text-[10px] flex items-center justify-center text-[#60758A]">
                aiclinic.vn/dashboard
              </div>
            </div>

            <div className="flex" style={{ minHeight: 420 }}>
              {/* Fake sidebar */}
              <div className="w-40 border-r border-[#D9E5F0] flex-shrink-0" style={{ background: '#0B3B78' }}>
                <div className="p-3 border-b border-white/10 flex items-center gap-2">
                  <div className="w-6 h-6 bg-white rounded flex items-center justify-center">
                    <HeartPulse className="w-3.5 h-3.5 text-[#0D6EFD]" />
                  </div>
                  <span className="text-white text-xs font-bold">AI Clinic</span>
                </div>
                <div className="p-2 space-y-0.5">
                  {['Tổng quan', 'Bệnh nhân', 'Lịch khám', 'Bệnh án', 'Thuốc', 'Thanh toán', 'Báo cáo', 'Cài đặt'].map((item, i) => (
                    <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded text-[10px] ${i === 0 ? 'bg-[#0D6EFD] text-white' : 'text-white/55 hover:text-white'}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fake content */}
              <div className="flex-1 bg-[#F6FAFE] p-4 overflow-hidden">
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Tổng bệnh nhân', value: '186', change: '+12%', icon: Users, color: '#0D6EFD' },
                    { label: 'Lịch hẹn hôm nay', value: '32', change: '+8%', icon: Calendar, color: '#10B981' },
                    { label: 'Doanh thu hôm nay', value: '24.5M', change: '+15%', icon: CreditCard, color: '#F59E0B' },
                    { label: 'Tỉ lệ hoàn thành', value: '98%', change: '+2%', icon: CheckCircle2, color: '#8B5CF6' },
                  ].map(s => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="bg-white border border-[#D9E5F0] rounded p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[9px] text-[#60758A]">{s.label}</p>
                          <Icon className="w-3 h-3" style={{ color: s.color }} />
                        </div>
                        <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
                        <p className="text-[9px] text-green-600">↑ {s.change}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Area chart */}
                  <div className="col-span-2 bg-white border border-[#D9E5F0] rounded p-3">
                    <p className="text-[10px] font-semibold text-[#17324D] mb-2">Thống kê lịch khám 7 ngày</p>
                    <div className="h-28">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={CHART_DATA}>
                          <defs>
                            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0D6EFD" stopOpacity={0.15} />
                              <stop offset="95%" stopColor="#0D6EFD" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F4F8" />
                          <XAxis dataKey="name" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 8 }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ fontSize: 10 }} />
                          <Area type="monotone" dataKey="value" stroke="#0D6EFD" strokeWidth={1.5} fill="url(#g1)" name="Lượt khám" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Pie chart */}
                  <div className="bg-white border border-[#D9E5F0] rounded p-3">
                    <p className="text-[10px] font-semibold text-[#17324D] mb-2">Cơ cấu bệnh nhân</p>
                    <div className="h-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={22} outerRadius={36} dataKey="value" paddingAngle={2}>
                            {PIE_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-1 mt-1">
                      {PIE_DATA.map((d, i) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                            <span className="text-[8px] text-[#60758A]">{d.name}</span>
                          </div>
                          <span className="text-[8px] font-semibold text-[#17324D]">{d.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          AI SECTION
      ════════════════════════════════════════════════════ */}
      <section id="ai" className="py-20" style={{ background: '#F6FAFE' }}>
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0D6EFD] mb-3">Công nghệ AI</p>
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#0B3B78' }}>
              Trí tuệ nhân tạo đồng hành<br />cùng phòng khám
            </h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: '#60758A' }}>
              AI Clinic tích hợp sẵn các mô hình AI tiên tiến, hỗ trợ toàn bộ quy trình từ tiếp nhận đến chẩn đoán và quản lý vận hành.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Left: AI visual card */}
            <div className="rounded overflow-hidden shadow-xl" style={{ background: 'linear-gradient(135deg, #0B3B78 0%, #1565C0 100%)' }}>
              <div className="p-8">
                <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center mb-5">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Trợ lý AI thông minh</h3>
                <p className="text-white/70 text-sm leading-relaxed mb-6">
                  Hỗ trợ phân tích triệu chứng, đề xuất chẩn đoán, tóm tắt bệnh án và tư vấn sức khỏe. Hoạt động 24/7, không giới hạn.
                </p>

                {/* Chat mockup */}
                <div className="bg-white/10 border border-white/20 rounded p-4 space-y-3">
                  <div className="flex gap-2">
                    <div className="w-6 h-6 bg-[#0D6EFD] rounded flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white/15 rounded px-3 py-2 text-xs text-white/90 max-w-[80%]">
                      Xin chào! Tôi có thể hỗ trợ bạn đặt lịch, tra cứu thông tin và nhiều hơn nữa.
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <div className="bg-[#0D6EFD]/60 rounded px-3 py-2 text-xs text-white max-w-[80%]">
                      Tôi muốn đặt lịch khám nội tổng quát vào chiều mai.
                    </div>
                    <div className="w-6 h-6 bg-white/20 rounded flex items-center justify-center flex-shrink-0">
                      <Users className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 bg-[#0D6EFD] rounded flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white/15 rounded px-3 py-2 text-xs text-white/90 max-w-[80%]">
                      Đặt lịch thành công! Thứ 4 – 15:00, BS. Nguyễn Thị Lan, Phòng 101 ✓
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/60 text-xs">AI đang hoạt động • Phản hồi dưới 2 giây</span>
                </div>
              </div>
            </div>

            {/* Right: AI roles */}
            <div className="space-y-3">
              {AI_ROLES.map(r => {
                const Icon = r.icon;
                return (
                  <div key={r.role}
                    className="flex items-start gap-4 bg-white border border-[#D9E5F0] rounded p-4 hover:shadow-md hover:border-[#0D6EFD]/30 transition-all">
                    <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0" style={{ background: r.bg }}>
                      <Icon className="w-5 h-5" style={{ color: r.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-1" style={{ color: '#17324D' }}>{r.role}</p>
                      <p className="text-xs leading-relaxed" style={{ color: '#60758A' }}>{r.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          ROLES
      ════════════════════════════════════════════════════ */}
      <section id="roles" className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0D6EFD] mb-3">Hệ thống vai trò</p>
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#0B3B78' }}>Một hệ thống — Nhiều vai trò</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: '#60758A' }}>
              Mỗi vai trò có giao diện riêng biệt, được tối ưu để phục vụ công việc cụ thể, phân quyền bảo mật và dễ sử dụng.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ROLES.map(r => {
              const Icon = r.icon;
              return (
                <div key={r.role}
                  className="bg-white border border-[#D9E5F0] rounded p-5 hover:shadow-lg hover:border-[#0D6EFD]/40 transition-all group text-center">
                  <div className="w-12 h-12 rounded flex items-center justify-center mx-auto mb-3" style={{ background: r.bg }}>
                    <Icon className="w-6 h-6" style={{ color: r.color }} />
                  </div>
                  <p className="font-bold text-sm mb-2 group-hover:text-[#0D6EFD] transition-colors" style={{ color: '#17324D' }}>{r.role}</p>
                  <p className="text-xs leading-relaxed" style={{ color: '#60758A' }}>{r.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          WORKFLOW
      ════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: '#F6FAFE' }}>
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0D6EFD] mb-3">Quy trình</p>
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#0B3B78' }}>Quy trình khám bệnh đơn giản hơn</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: '#60758A' }}>
              AI Clinic số hóa toàn bộ quy trình, từ đặt lịch đến theo dõi sau khám, đảm bảo liền mạch và hiệu quả.
            </p>
          </div>
          {/* Horizontal steps */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-0">
            {WORKFLOW_STEPS.map((s, i) => (
              <div key={s.step} className="flex lg:flex-1 flex-row lg:flex-col items-center gap-3 lg:gap-0">
                <div className="flex flex-col lg:flex-row items-center flex-shrink-0">
                  {/* Circle */}
                  <div className="w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{ borderColor: '#0D6EFD', color: '#0D6EFD', background: '#EBF3FF' }}>
                    {s.step}
                  </div>
                  {/* Connector (only between steps) */}
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div className="hidden lg:block h-0.5 flex-1 min-w-[20px]" style={{ background: '#D9E5F0' }} />
                  )}
                </div>
                <div className="lg:mt-3 text-center lg:px-2">
                  <p className="font-semibold text-sm" style={{ color: '#17324D' }}>{s.title}</p>
                  <p className="text-xs" style={{ color: '#60758A' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          BENEFITS LIST
      ════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0D6EFD] mb-3">Lý do chọn chúng tôi</p>
              <h2 className="text-3xl font-bold mb-5" style={{ color: '#0B3B78' }}>
                Tại sao phòng khám nên<br />sử dụng AI Clinic?
              </h2>
              <p className="text-sm leading-relaxed mb-8" style={{ color: '#60758A' }}>
                Hơn 500 phòng khám và bệnh viện đang tin tưởng sử dụng AI Clinic để vận hành hiệu quả và nâng cao chất lượng chăm sóc bệnh nhân.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded hover:opacity-90 transition-opacity"
                style={{ background: '#0D6EFD' }}
              >
                Bắt đầu dùng thử miễn phí <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BENEFITS.map(b => (
                <div key={b} className="flex items-start gap-3 bg-[#F6FAFE] border border-[#D9E5F0] rounded p-3.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0D6EFD] flex-shrink-0 mt-0.5" />
                  <span className="text-sm" style={{ color: '#17324D' }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          SERVICES
      ════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: '#F6FAFE' }}>
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0D6EFD] mb-3">Dịch vụ</p>
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#0B3B78' }}>Dịch vụ khám chữa bệnh</h2>
            <p className="text-sm max-w-xl mx-auto" style={{ color: '#60758A' }}>
              AI Clinic hỗ trợ toàn bộ các loại hình dịch vụ y tế phổ biến tại phòng khám.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {SERVICES.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label}
                  className="bg-white border border-[#D9E5F0] rounded p-5 flex flex-col items-center text-center hover:shadow-md hover:border-[#0D6EFD]/30 transition-all cursor-pointer">
                  <div className="w-12 h-12 rounded flex items-center justify-center mb-3" style={{ background: s.bg }}>
                    <Icon className="w-6 h-6" style={{ color: s.color }} />
                  </div>
                  <p className="text-xs font-semibold" style={{ color: '#17324D' }}>{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#0D6EFD] mb-3">Đánh giá</p>
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#0B3B78' }}>Khách hàng nói gì về AI Clinic?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name}
                className="bg-white border border-[#D9E5F0] rounded p-6 hover:shadow-md transition-shadow">
                <Quote className="w-7 h-7 text-[#0D6EFD] opacity-30 mb-3" />
                <p className="text-sm leading-relaxed mb-5" style={{ color: '#17324D' }}>{t.text}</p>
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div className="border-t border-[#D9E5F0] pt-4 flex items-center gap-3">
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm" style={{ color: '#0B3B78' }}>{t.name}</p>
                    <p className="text-xs" style={{ color: '#60758A' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          NEWS
      ════════════════════════════════════════════════════ */}
      <section id="news" className="py-20" style={{ background: '#F6FAFE' }}>
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#0D6EFD] mb-2">Tin tức</p>
              <h2 className="text-3xl font-bold" style={{ color: '#0B3B78' }}>Tin tức & kiến thức sức khỏe</h2>
            </div>
            <button className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-[#0D6EFD] hover:underline">
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {NEWS.map((n, i) => {
              const cardContent = (
                <>
                  <div className="h-40 flex items-center justify-center bg-cover bg-center" style={{ 
                    background: n.image ? `url('${n.image}') center/cover no-repeat` : (i === 0 ? '#EBF3FF' : i === 1 ? '#ECFDF5' : '#F5F3FF') 
                  }}>
                    {!n.image && <HeartPulse className="w-14 h-14 opacity-20" style={{ color: n.color }} />}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ background: n.color + '20', color: n.color }}>{n.tag}</span>
                      <span className="text-[10px]" style={{ color: '#60758A' }}>{n.date}</span>
                    </div>
                    <p className="text-sm font-semibold leading-snug mb-3 group-hover:text-[#0D6EFD] transition-colors" style={{ color: '#17324D' }}>{n.title}</p>
                    <button className="text-xs text-[#0D6EFD] font-medium hover:underline flex items-center gap-1">
                      Xem thêm <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </>
              );

              return n.url ? (
                <a key={n.title} href={n.url} className="bg-white border border-[#D9E5F0] rounded overflow-hidden hover:shadow-md transition-shadow cursor-pointer group block">
                  {cardContent}
                </a>
              ) : (
                <div key={n.title} className="bg-white border border-[#D9E5F0] rounded overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                  {cardContent}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          CTA
      ════════════════════════════════════════════════════ */}
      <section id="contact" className="py-20">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="rounded overflow-hidden text-center py-16 px-8 relative"
            style={{ background: 'linear-gradient(135deg, #0B3B78 0%, #1565C0 60%, #1E88E5 100%)' }}>
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
            <div className="relative z-10">
              <p className="text-white/70 text-sm mb-3 font-medium">Bắt đầu ngay hôm nay</p>
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight">
                Sẵn sàng đưa phòng khám<br />lên một tầm cao mới?
              </h2>
              <p className="text-white/75 text-base mb-8 max-w-lg mx-auto">
                Bắt đầu quản lý phòng khám thông minh cùng AI Clinic. Miễn phí 30 ngày, không cần thẻ tín dụng.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-8 py-3.5 bg-white font-bold text-sm rounded hover:bg-blue-50 transition-colors shadow-xl"
                  style={{ color: '#0B3B78' }}
                >
                  Dùng thử miễn phí <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 px-8 py-3.5 bg-white/15 border border-white/30 text-white font-semibold text-sm rounded hover:bg-white/25 transition-colors"
                >
                  Đăng nhập
                </button>
              </div>
              <p className="text-white/50 text-xs mt-5">✓ Không cần thẻ tín dụng • ✓ Hỗ trợ 24/7 • ✓ Dùng thử 30 ngày</p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
