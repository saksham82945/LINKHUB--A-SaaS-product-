import { create } from 'zustand';
import api from '@/lib/api';

// ── Zustand Auth Store
export const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isInitialized: false,

  // ── Login
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const cleanEmail = email.toLowerCase().trim();
      const { data } = await api.post('/auth/login', { email: cleanEmail, password });

      if (typeof window !== 'undefined') {
        window.__accessToken = data.accessToken;
        try {
          localStorage.setItem('accessToken', data.accessToken);
        } catch {}
      }

      set({ user: data.user, isAuthenticated: true, isInitialized: true });
      return data;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Register
  register: async (name, email, password, username) => {
    set({ isLoading: true });
    try {
      const cleanEmail = email.toLowerCase().trim();
      const res = await api.post('/auth/register', { name, email: cleanEmail, password, username });
      return res.data;
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout api errors
    } finally {
      if (typeof window !== 'undefined') {
        window.__accessToken = undefined;
        try {
          localStorage.removeItem('accessToken');
        } catch {}
      }
      set({ user: null, isAuthenticated: false, isInitialized: true });
    }
  },

  // ── Fetch current user (on app load / refresh)
  fetchMe: async () => {
    set({ isLoading: true });
    try {
      if (typeof window !== 'undefined' && !window.__accessToken) {
        try {
          const savedToken = localStorage.getItem('accessToken');
          if (savedToken) {
            window.__accessToken = savedToken;
          }
        } catch {}
      }

      const { data } = await api.get('/auth/me');
      set({ user: data, isAuthenticated: true, isInitialized: true });
    } catch {
      if (typeof window !== 'undefined') {
        window.__accessToken = undefined;
        try {
          localStorage.removeItem('accessToken');
        } catch {}
      }
      set({ user: null, isAuthenticated: false, isInitialized: true });
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user, isInitialized: true }),
}));

// ── Helper selectors
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useIsInitialized = () => useAuthStore((s) => s.isInitialized);
export const useIsPro = () => useAuthStore((s) =>
  ['PRO', 'AGENCY', 'ENTERPRISE'].includes(s.user?.plan ?? ''),
);
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'ADMIN');
