'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

/**
 * AuthProvider — Wraps the app to restore auth state on page load.
 * On first render, calls /auth/me using the httpOnly refresh cookie.
 * If valid, sets the user in Zustand store (access token stored in memory).
 */
export default function AuthProvider({ children }) {
  const fetchMe = useAuthStore((s) => s.fetchMe);

  useEffect(() => {
    // Try to restore session on app load (using httpOnly refresh cookie)
    fetchMe();
  }, [fetchMe]);

  return <>{children}</>;
}
