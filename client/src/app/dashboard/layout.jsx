'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore, useUser } from '@/store/authStore';

const NAV_ITEMS = [
  { icon: '🔗', label: 'Links', href: '/dashboard' },
  { icon: '📊', label: 'Analytics', href: '/dashboard/analytics' },
  { icon: '🤖', label: 'AI Studio', href: '/dashboard/ai-studio' },
  { icon: '🔌', label: 'Integrations', href: '/dashboard/integrations' },
  { icon: '👤', label: 'Profile', href: '/dashboard/profile' },
  { icon: '⚙️', label: 'Settings', href: '/dashboard/settings' },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useUser();
  const { logout } = useAuthStore();

  const handleLogout = useCallback(async () => {
    await logout();
    router.push('/');
  }, [logout, router]);

  const isActive = (href) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* ─── SIDEBAR ─── */}
      <aside className="fixed inset-y-0 left-0 w-60 bg-gray-900 border-r border-gray-800 flex flex-col z-40">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-800 shrink-0">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
            <span className="text-indigo-400">⬡</span> LinkPort
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-gray-800 shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{user?.name ?? 'Loading...'}</div>
              <div className="text-xs text-gray-500 capitalize">{user?.plan?.toLowerCase() ?? 'free'} plan</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-gray-500 hover:text-red-400 transition-colors px-1 py-1"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT (offset by sidebar width) ─── */}
      <main className="ml-60 flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
