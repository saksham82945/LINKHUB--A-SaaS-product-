'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    username: '',
  });
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const checkUsername = async (username) => {
    if (username.length < 3) return;
    setCheckingUsername(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || '/api'}/profile/check/${username}`,
      );
      const data = await res.json();
      setUsernameAvailable(data.available);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setForm({ ...form, username: clean });
    setUsernameAvailable(null);
    if (clean.length >= 3) {
      const timer = setTimeout(() => checkUsername(clean), 600);
      return () => clearTimeout(timer);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (!usernameAvailable) {
      toast.error('Please choose a different username');
      return;
    }
    try {
      await register(form.name, form.email, form.password, form.username);
      toast.success('Account created! Please check your email to verify your account.', { duration: 6000 });
      router.push('/login');
    } catch (err) {
      const message = err?.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-white">
            <span className="text-indigo-400">⬡</span> LinkPort
          </Link>
          <p className="text-gray-400 mt-2 text-sm">Create your professional identity</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-6">Get started for free</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Saksham Sharma"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1.5">
                Username <span className="text-gray-500 font-normal">(your public URL)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-500 text-sm pointer-events-none">
                  linkport.io/
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  minLength={3}
                  value={form.username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="saksham"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg pl-24 pr-10 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {checkingUsername && <span className="text-xs text-gray-500">...</span>}
                  {!checkingUsername && usernameAvailable === true && (
                    <span className="text-xs text-green-400">✓ Available</span>
                  )}
                  {!checkingUsername && usernameAvailable === false && (
                    <span className="text-xs text-red-400">✗ Taken</span>
                  )}
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-gray-300 mb-1.5">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-gray-300 mb-1.5">
                Password <span className="text-gray-500 font-normal">(min. 8 characters)</span>
              </label>
              <input
                id="reg-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Consent */}
            <div className="flex items-start gap-3 pt-1">
              <input
                id="gdpr"
                type="checkbox"
                required
                className="mt-0.5 w-4 h-4 accent-indigo-500 cursor-pointer"
              />
              <label htmlFor="gdpr" className="text-xs text-gray-400 leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" className="text-indigo-400 hover:underline">Terms of Service</Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>.
                I consent to data processing as described.
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading || usernameAvailable === false}
              id="register-submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold text-sm transition-all mt-2"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account...
                </span>
              ) : 'Create Free Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
