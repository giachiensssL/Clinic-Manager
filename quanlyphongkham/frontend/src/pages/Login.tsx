import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse, LogIn, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { authAPI } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin123!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const login = useAuthStore(state => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await authAPI.login({ username, password });
      login(response.data);
      navigate('/dashboard');
    } catch (err: any) {
      if (!err.response) {
        setError('Không kết nối được server. Vui lòng kiểm tra backend đang chạy.');
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
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
        
        <div className="bg-medical-blue p-6 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
            <HeartPulse className="w-8 h-8 text-medical-cyan" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CLINIC AI</h1>
          <p className="text-blue-100 text-sm mt-1">Hệ thống quản lý phòng khám thông minh</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400 rounded-md border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tài khoản (Email / Username)</label>
              <Input 
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Nhập tài khoản..." 
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mật khẩu</label>
              <Input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..." 
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
              {isLoading ? 'Đang đăng nhập...' : 'ĐĂNG NHẬP'}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">Tài khoản Demo</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Button type="button" variant="outline" size="sm" onClick={() => setDemoAccount('admin', 'Admin123!')}>Admin</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setDemoAccount('doctor', 'Doctor123!')}>Bác sĩ</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setDemoAccount('reception', 'Reception123!')}>Lễ tân</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setDemoAccount('accountant', 'Accountant123!')}>Kế toán</Button>
              <Button type="button" variant="outline" size="sm" className="col-span-2" onClick={() => setDemoAccount('patient', 'Patient123!')}>Bệnh nhân</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
