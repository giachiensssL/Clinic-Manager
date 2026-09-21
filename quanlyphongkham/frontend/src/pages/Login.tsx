import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HeartPulse, LogIn, Loader2, ShieldCheck, User, Lock, Eye, EyeOff, Brain, Shield, Clock, Heart, Headphones, Activity, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login({ username: username.trim(), password });
      login(response.data);
      
      const role = (response.data.role || response.data.user?.role)?.toLowerCase();
      if (role === 'doctor') {
        navigate('/doctor');
      } else if (role === 'patient') {
        navigate('/portal');
      } else if (role === 'receptionist') {
        navigate('/receptionist');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      if (!err.response) {
        setError('Không kết nối được server. Vui lòng kiểm tra backend đang chạy.');
        return;
      }
      
      const status = err.response.status;
      if (status === 502 || status === 504 || status === 404) {
        setError('Không thể kết nối đến API. Hãy chắc chắn backend (uvicorn) đang chạy ở port 8000.');
        return;
      }
      if (status === 500) {
        setError('Lỗi máy chủ (500). Có thể backend bị lỗi kết nối cơ sở dữ liệu.');
        return;
      }
      
      setError(err.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDemoAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">

      {/* Header */}
      <header className="relative z-10 w-full px-6 py-3 flex justify-between items-center bg-white border-b border-slate-200">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-[#0D6EFD]" />
            <span className="text-lg font-extrabold text-[#0B3B78] tracking-tight">AI Clinic</span>
          </Link>
          <div className="hidden md:block h-5 w-px bg-slate-300"></div>
          <span className="hidden md:block text-xs font-medium text-slate-500">Đi cùng bạn trên hành trình chăm sóc sức khỏe</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[#0D6EFD] border border-blue-50">
            <Headphones className="w-4 h-4" />
          </div>
          <div className="hidden sm:block text-right leading-none">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Hỗ trợ 24/7</div>
            <div className="text-sm font-bold text-[#0B3B78]">1900 1234</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative z-10 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-[1200px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 xl:gap-16">
          
          {/* Left Column: Info & Features */}
          <div className="flex-1 w-full lg:w-1/2 hidden md:flex flex-col relative py-4">
            <h1 className="text-3xl lg:text-4xl font-extrabold text-[#0B3B78] leading-[1.2] tracking-tight mb-3">
              Hệ thống quản lý phòng khám<br />
              <span className="text-[#0D6EFD]">thông minh với AI</span>
            </h1>
            <p className="text-base text-slate-600 font-semibold mb-8">
              Tối ưu vận hành – Nâng cao trải nghiệm – Chăm sóc sức khỏe tốt hơn
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 mb-10 max-w-xl">
              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-blue-50 flex items-center justify-center flex-shrink-0 text-[#0D6EFD]">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0B3B78] text-[13px] mb-0.5">Quản lý thông minh</h3>
                  <p className="text-[12px] text-slate-500 leading-tight font-medium">Tự động hóa quy trình, giảm thủ tục</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-blue-50 flex items-center justify-center flex-shrink-0 text-[#0D6EFD]">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0B3B78] text-[13px] mb-0.5">Bảo mật dữ liệu</h3>
                  <p className="text-[12px] text-slate-500 leading-tight font-medium">An toàn, tin cậy, tuân thủ y tế</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-blue-50 flex items-center justify-center flex-shrink-0 text-[#0D6EFD]">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0B3B78] text-[13px] mb-0.5">Tiết kiệm thời gian</h3>
                  <p className="text-[12px] text-slate-500 leading-tight font-medium">Đặt lịch nhanh chóng, dễ theo dõi</p>
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-blue-50 flex items-center justify-center flex-shrink-0 text-[#0D6EFD]">
                  <Heart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0B3B78] text-[13px] mb-0.5">Vì sức khỏe cộng đồng</h3>
                  <p className="text-[12px] text-slate-500 leading-tight font-medium">Xây dựng y tế hiện đại, hiệu quả</p>
                </div>
              </div>
            </div>

            {/* Handwritten Text */}
            <div className="mb-8 -rotate-3 ml-4">
              <p className="text-xl text-[#0D6EFD] opacity-90 font-medium" style={{ fontFamily: '"Caveat", "Dancing Script", cursive', letterSpacing: '0.5px' }}>
                Sức khỏe của bạn<br />là ưu tiên của chúng tôi
              </p>
            </div>

            {/* Bottom 3 Features */}
            <div className="flex flex-wrap gap-3 mt-auto">
              <div className="flex items-center gap-2.5 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[#0D6EFD] bg-blue-50 p-1.5 rounded-lg"><HeartPulse className="w-4 h-4" /></div>
                <div className="text-[10px] leading-tight"><span className="block font-bold text-[#0B3B78]">Bệnh nhân hài lòng</span><span className="text-slate-500">là mục tiêu của chúng tôi</span></div>
              </div>
              <div className="flex items-center gap-2.5 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[#0D6EFD] bg-blue-50 p-1.5 rounded-lg"><Monitor className="w-4 h-4" /></div>
                <div className="text-[10px] leading-tight"><span className="block font-bold text-[#0B3B78]">Công nghệ tiên tiến</span><span className="text-slate-500">Hỗ trợ bác sĩ tối đa</span></div>
              </div>
              <div className="flex items-center gap-2.5 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                <div className="text-[#0D6EFD] bg-blue-50 p-1.5 rounded-lg"><Activity className="w-4 h-4" /></div>
                <div className="text-[10px] leading-tight"><span className="block font-bold text-[#0B3B78]">Dịch vụ chuyên nghiệp</span><span className="text-slate-500">Tận tâm - Uy tín</span></div>
              </div>
            </div>

          </div>

          {/* Right Column: Login Card */}
          <div className="w-full max-w-[440px] lg:w-[440px] flex-shrink-0">
            <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-6 sm:p-8 relative overflow-hidden">
              
              <div className="relative z-10 text-center mb-5">
                <div className="inline-flex items-center justify-center gap-2 mb-2">
                  <HeartPulse className="w-8 h-8 text-[#0D6EFD]" />
                  <span className="text-xl font-extrabold text-[#0B3B78] tracking-tight">AI Clinic</span>
                </div>
                <h2 className="text-lg font-bold text-slate-800">Đăng nhập hệ thống</h2>
              </div>

              <div className="relative z-10 bg-[#F0F5FF] border border-[#D9E5F0] rounded-xl p-3 flex gap-2.5 items-start mb-5 text-[#0B3B78]">
                <ShieldCheck className="w-4 h-4 text-[#0D6EFD] flex-shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed font-semibold">Chỉ dành cho tài khoản được cấp bởi quản trị viên. Vui lòng đăng nhập để tiếp tục.</p>
              </div>

              <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
                {error && (
                  <div className="p-2.5 text-xs font-medium text-red-600 bg-red-50 rounded-xl border border-red-200">
                    {error}
                  </div>
                )}
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">Tên đăng nhập</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <User className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <Input 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="Nhập tên đăng nhập" 
                      required
                      className="pl-10 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-[#0D6EFD] focus:ring-[#0D6EFD]/20 transition-all font-medium text-slate-700"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 ml-1">Mật khẩu</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4.5 w-4.5 text-slate-400" />
                    </div>
                    <Input 
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu" 
                      required
                      className="pl-10 pr-11 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:border-[#0D6EFD] focus:ring-[#0D6EFD]/20 transition-all font-medium text-slate-700"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="peer w-4 h-4 rounded border-slate-300 text-[#0D6EFD] focus:ring-[#0D6EFD] transition-all cursor-pointer"
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 group-hover:text-slate-800 transition-colors">Ghi nhớ đăng nhập</span>
                  </label>
                  <a href="#" className="text-xs font-bold text-[#0D6EFD] hover:text-[#0B5ED7] transition-colors">Quên mật khẩu?</a>
                </div>

                <Button type="submit" className="w-full h-11 rounded-xl text-sm font-bold bg-[#0D6EFD] hover:bg-[#0B5ED7] shadow-lg shadow-blue-500/30 group transition-all" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />}
                  {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
                </Button>
              </form>

              <div className="relative z-10 mt-6 mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-white text-[10px] text-slate-400 uppercase tracking-widest font-bold">Hoặc đăng nhập bằng</span>
                </div>
              </div>

              {/* Social Login Buttons */}
              <div className="relative z-10 grid grid-cols-2 gap-3 mb-5">
                <button 
                  type="button" 
                  onClick={() => alert('Chức năng Đăng nhập bằng Google đang được phát triển')} 
                  className="flex items-center justify-center gap-1.5 h-10 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-semibold text-slate-700 text-xs"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button 
                  type="button" 
                  onClick={() => alert('Chức năng Đăng nhập bằng Facebook đang được phát triển')} 
                  className="flex items-center justify-center gap-1.5 h-10 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-semibold text-slate-700 text-xs"
                >
                  <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>
              
              {/* Dev Demo Accounts */}
              <div className="mt-5 pt-4 border-t border-slate-100 relative z-10">
                <div className="text-[9px] text-slate-400 mb-2 font-bold text-center tracking-wider">TÀI KHOẢN DÙNG THỬ (DEMO)</div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1">
                  <button type="button" onClick={() => setDemoAccount('admin', 'Admin123!')} className="text-[9px] font-semibold py-1 border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-colors">Admin</button>
                  <button type="button" onClick={() => setDemoAccount('doctor', 'Doctor123!')} className="text-[9px] font-semibold py-1 border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-colors">Bác sĩ</button>
                  <button type="button" onClick={() => setDemoAccount('reception', 'Reception123!')} className="text-[9px] font-semibold py-1 border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-colors">Lễ tân</button>
                  <button type="button" onClick={() => setDemoAccount('accountant', 'Accountant123!')} className="text-[9px] font-semibold py-1 border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-colors">Kế toán</button>
                  <button type="button" onClick={() => setDemoAccount('patient', 'Patient123!')} className="text-[9px] font-semibold py-1 border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 text-slate-600 transition-colors col-span-3 sm:col-span-1">Bệnh nhân</button>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-6 text-sm text-slate-600 font-medium">
              Chưa có tài khoản? <Link to="/register" className="text-[#0D6EFD] font-bold hover:text-[#0B5ED7] hover:underline transition-colors ml-1">Đăng ký ngay</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
