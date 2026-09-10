import { create } from 'zustand';
import { AuthToken, UserRole } from '@/types';

interface AuthState {
  user: AuthToken | null;
  isAuthenticated: boolean;
  login: (token: AuthToken) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  rehydrate: () => void;
}

// Restore user from localStorage on init
function loadUserFromStorage(): AuthToken | null {
  try {
    const token = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    const role = localStorage.getItem('user_role') as UserRole;
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    const fullName = localStorage.getItem('full_name');
    if (token && role && userId && username) {
      return {
        access_token: token,
        refresh_token: refreshToken || '',
        token_type: 'bearer',
        role,
        user_id: userId,
        username,
        full_name: fullName || undefined,
      };
    }
  } catch {
    // ignore
  }
  return null;
}

const storedUser = loadUserFromStorage();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: storedUser,
  isAuthenticated: !!storedUser,

  login: (token) => {
    localStorage.setItem('access_token', token.access_token);
    localStorage.setItem('refresh_token', token.refresh_token);
    localStorage.setItem('user_role', token.role);
    localStorage.setItem('user_id', token.user_id);
    localStorage.setItem('username', token.username);
    localStorage.setItem('full_name', token.full_name || '');
    set({ user: token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('full_name');
    set({ user: null, isAuthenticated: false });
  },

  hasRole: (...roles) => {
    const { user } = get();
    if (!user) return false;
    return roles.includes(user.role);
  },

  rehydrate: () => {
    const user = loadUserFromStorage();
    set({ user, isAuthenticated: !!user });
  },
}));
