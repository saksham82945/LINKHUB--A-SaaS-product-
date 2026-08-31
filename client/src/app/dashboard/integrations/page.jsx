'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const PLATFORMS = [
  { service: 'GITHUB', label: 'GitHub', icon: '🐙', desc: 'Show repos, stars, contribution activity', color: '#24292e' },
  { service: 'LINKEDIN', label: 'LinkedIn', icon: '💼', desc: 'Import name, headline, experience', color: '#0077b5' },
  { service: 'LEETCODE', label: 'LeetCode', icon: '💡', desc: 'Show problems solved, ranking, rating', color: '#ffa116' },
  { service: 'CODECHEF', label: 'CodeChef', icon: '👨‍🍳', desc: 'Show stars, rating, contest history', color: '#5b4638' },
  { service: 'TWITTER', label: 'Twitter / X', icon: '🐦', desc: 'Show tweets, follower count', color: '#1da1f2' },
];

export default function IntegrationsPage() {
  const user = useUser();
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const [usernames, setUsernames] = useState({});
  const [scorecard, setScorecard] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [statusRes, scorecardRes] = await Promise.all([
          api.get('/integrations/status'),
          api.get('/integrations/scorecard'),
        ]);
        setStatus(statusRes.data);
        setScorecard(scorecardRes.data);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleConnect = async (service) => {
    const username = usernames[service]?.trim();
    if (!username) {
      toast.error('Please enter your username');
      return;
    }
    setConnecting(service);
    try {
      await api.post('/integrations/connect', { service, username });
      toast.success(`${service} connected!`);
      // Reload status
      const res = await api.get('/integrations/status');
      setStatus(res.data);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to connect');
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (service) => {
    if (!confirm(`Disconnect ${service}?`)) return;
    try {
      await api.delete(`/integrations/${service}`);
      toast.success(`${service} disconnected`);
      const res = await api.get('/integrations/status');
      setStatus(res.data);
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const handleSync = async (service) => {
    setConnecting(service + '_sync');
    try {
      await api.post(`/integrations/sync/${service}`);
      toast.success('Synced successfully!');
    } catch {
      toast.error('Sync failed');
    } finally {
      setConnecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="h-16 border-b border-gray-800 flex items-center px-8">
        <h1 className="text-lg font-semibold text-white">Integrations</h1>
      </div>

      <div className="p-8">
        {/* Dev ScoreCard */}
        {scorecard && scorecard.overallScore > 0 && (
          <div className="bg-gradient-to-r from-indigo-950 to-purple-950 border border-indigo-700 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-indigo-300 font-medium mb-1">🏆 Developer ScoreCard</div>
                <div className="text-5xl font-bold text-white">{scorecard.overallScore}</div>
                <div className="text-indigo-300 font-medium mt-1">{scorecard.badge}</div>
              </div>
              <div className="grid grid-cols-3 gap-6 text-center">
                {scorecard.details.github && (
                  <div>
                    <div className="text-2xl font-bold text-white">{scorecard.details.github.score}</div>
                    <div className="text-xs text-gray-400">GitHub Score</div>
                  </div>
                )}
                {scorecard.details.leetcode && (
                  <div>
                    <div className="text-2xl font-bold text-white">{scorecard.details.leetcode.score}</div>
                    <div className="text-xs text-gray-400">LeetCode Score</div>
                  </div>
                )}
                {scorecard.details.codechef && (
                  <div>
                    <div className="text-2xl font-bold text-white">{scorecard.details.codechef.score}</div>
                    <div className="text-xs text-gray-400">CodeChef Score</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Platforms */}
        <div className="space-y-4">
          {PLATFORMS.map((platform) => {
            const s = status[platform.service];
            const isConnected = s?.connected;
            const isSyncing = connecting === platform.service + '_sync';

            return (
              <div key={platform.service} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ backgroundColor: platform.color + '33', border: `1px solid ${platform.color}55` }}
                  >
                    {platform.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{platform.label}</span>
                      {isConnected && (
                        <span className="text-xs bg-green-900/50 text-green-400 border border-green-700 px-2 py-0.5 rounded-full">
                          ✓ Connected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{platform.desc}</p>
                    {isConnected && s?.username && (
                      <p className="text-xs text-gray-500 mt-0.5">@{s.username}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => handleSync(platform.service)}
                          disabled={isSyncing}
                          className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 px-3 py-2 rounded-lg transition-colors"
                        >
                          {isSyncing ? '⟳ Syncing...' : '⟳ Sync'}
                        </button>
                        <button
                          onClick={() => handleDisconnect(platform.service)}
                          className="text-xs text-red-500 hover:text-red-400 border border-red-900 hover:border-red-700 px-3 py-2 rounded-lg transition-colors"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Your ${platform.label} username`}
                          value={usernames[platform.service] || ''}
                          onChange={(e) => setUsernames({ ...usernames, [platform.service]: e.target.value })}
                          className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 w-44"
                          onKeyDown={(e) => e.key === 'Enter' && handleConnect(platform.service)}
                        />
                        <button
                          onClick={() => handleConnect(platform.service)}
                          disabled={connecting === platform.service}
                          className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                          {connecting === platform.service ? 'Connecting...' : 'Connect'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
