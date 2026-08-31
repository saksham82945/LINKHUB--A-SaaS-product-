import { create } from 'zustand';
import api from '@/lib/api';

// ── Zustand Auth Store
export const useAuthStore = create((set) => ({
  user: null,
  isLoading: false,
  isAuthenticated: false,

  // ── Login
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', { email, password });

      // Store access token in memory (XSS safe)
      if (typeof window !== 'undefined') {
        window.__accessToken = data.accessToken;
      }

      set({ user: data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Register
  register: async (name, email, password, username) => {
    set({ isLoading: true });
    try {
      await api.post('/auth/register', { name, email, password, username });
      // Don't auto-login — user must verify email first
    } finally {
      set({ isLoading: false });
    }
  },

  // ── Logout
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      // Clear everything regardless of API response
      if (typeof window !== 'undefined') {
        window.__accessToken = undefined;
      }
      set({ user: null, isAuthenticated: false });
    }
  },

  // ── Fetch current user (on app load / refresh)
  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data, isAuthenticated: true });
    } catch {
      // Not logged in — that's fine
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user }),
}));

// ── Helper selectors (use these in components instead of the whole store)
export const useUser = () => useAuthStore((s) => s.user);
export const useIsAuthenticated = () => useAuthStore((s) => s.isAuthenticated);
export const useIsPro = () => useAuthStore((s) =>
  ['PRO', 'AGENCY', 'ENTERPRISE'].includes(s.user?.plan ?? ''),
);
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'ADMIN');
