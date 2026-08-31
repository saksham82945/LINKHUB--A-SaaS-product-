'use client';

import { useUser } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const user = useUser();

  const handlePasswordReset = (e) => {
    e.preventDefault();
    toast.success('Password reset email sent! (Demo)');
  };

  const handlePlanUpgrade = () => {
    toast('Stripe integration coming soon!', { icon: '💳' });
  };

  return (
    <div className="min-h-screen">
      <div className="h-16 border-b border-gray-800 flex items-center px-8 bg-gray-950">
        <h1 className="text-lg font-semibold text-white">Account Settings</h1>
      </div>

      <div className="p-8 max-w-3xl space-y-8">
        
        {/* Account Details */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-6">Account Details</h2>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Name</label>
              <div className="bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-2.5">
                {user?.name || 'Loading...'}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
              <div className="bg-gray-950 border border-gray-800 text-white rounded-lg px-4 py-2.5 opacity-70">
                {user?.email || 'Loading...'}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Plan */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Subscription Plan</h2>
            <p className="text-gray-400 text-sm">
              You are currently on the <strong className="text-indigo-400 uppercase">{user?.plan || 'FREE'}</strong> plan.
            </p>
          </div>
          <button 
            onClick={handlePlanUpgrade}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
          >
            Upgrade Plan
          </button>
        </div>

        {/* Security */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Security</h2>
          
          <form onSubmit={handlePasswordReset} className="border-t border-gray-800 pt-6 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium mb-1">Change Password</h3>
                <p className="text-sm text-gray-400">Receive an email with a secure link to update your password.</p>
              </div>
              <button 
                type="submit"
                className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors border border-gray-700"
              >
                Send Reset Link
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-red-500 mb-2">Danger Zone</h2>
          <p className="text-sm text-red-400/80 mb-6">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <button 
            onClick={() => toast.error('Account deletion is disabled in demo mode')}
            className="bg-red-900/50 hover:bg-red-800/50 text-red-200 border border-red-800 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Delete Account
          </button>
        </div>

      </div>
    </div>
  );
}
