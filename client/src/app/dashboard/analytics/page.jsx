'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/store/authStore';
import api from '@/lib/api';

export default function AnalyticsPage() {
  const user = useUser();
  // All features enabled — premium gating hidden
  const isPro = true; // was: ['PRO', 'AGENCY', 'ENTERPRISE'].includes(user?.plan ?? '');

  const [summary, setSummary] = useState(null);
  const [byLink, setByLink] = useState([]);
  const [overTime, setOverTime] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes] = await Promise.all([api.get('/analytics/summary')]);
        setSummary(summaryRes.data);

        if (isPro) {
          const [byLinkRes, overTimeRes, devicesRes] = await Promise.all([
            api.get('/analytics/by-link'),
            api.get('/analytics/over-time'),
            api.get('/analytics/devices'),
          ]);
          setByLink(byLinkRes.data);
          setOverTime(overTimeRes.data);
          setDevices(devicesRes.data);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isPro]);

  const maxClicks = Math.max(...(byLink.map((l) => l.clickCount) || [1]), 1);

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="h-16 border-b border-gray-800 flex items-center px-8">
        <h1 className="text-lg font-semibold text-white">Analytics</h1>
        {/* FREE BADGE — temporarily hidden
        {!isPro && (
          <span className="ml-3 text-xs bg-indigo-950 text-indigo-300 border border-indigo-700 px-2 py-1 rounded-full">
            Free — 7 days only
          </span>
        )}
        */}
      </div>

      <div className="p-8">
        {loading ? (
          <div className="text-gray-500 text-center py-16">Loading analytics...</div>
        ) : (
          <>
            {/* Summary */}
            {summary && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: 'Total Clicks', value: summary.totalClicks, icon: '🖱️' },
                  { label: 'Profile Views', value: summary.profileViews, icon: '👁️' },
                  { label: 'Active Links', value: summary.activeLinks, icon: '🔗' },
                ].map((c) => (
                  <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                    <div className="text-2xl mb-3">{c.icon}</div>
                    <div className="text-3xl font-bold text-white">{c.value.toLocaleString()}</div>
                    <div className="text-sm text-gray-400 mt-1">{c.label}</div>
                    <div className="text-xs text-gray-600 mt-0.5">Last {summary.dateRange}</div>
                  </div>
                ))}
              </div>
            )}

            {/* PRO UPGRADE GATE — temporarily hidden
            {!isPro && (
              <div className="bg-indigo-950/50 border border-indigo-700 rounded-2xl p-8 text-center mb-8">
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">Unlock Deep Analytics</h3>
                <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                  Get 90-day history, per-link breakdown, country heatmap, device split, and referrer tracking.
                </p>
                <Link
                  href="/upgrade"
                  className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
                >
                  Upgrade to Pro — ₹399/month
                </Link>
              </div>
            )}
            */}

            {/* Over time chart (simple bar chart) */}
            {isPro && overTime.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-white mb-4">Clicks Over Time (30 days)</h3>
                <div className="flex items-end gap-1 h-32">
                  {overTime.slice(-30).map((d) => {
                    const maxVal = Math.max(...overTime.map((x) => x.count), 1);
                    const height = Math.max((d.count / maxVal) * 100, 4);
                    return (
                      <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full bg-indigo-600/60 hover:bg-indigo-500 rounded-sm transition-colors cursor-pointer"
                          style={{ height: `${height}%` }}
                        />
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                          {d.date}: {d.count}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Per link breakdown */}
            {isPro && byLink.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-white mb-4">Clicks by Link</h3>
                <div className="space-y-4">
                  {byLink.map((link) => (
                    <div key={link.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-white">{link.title}</span>
                        <span className="text-sm text-gray-400 font-medium">{link.clickCount} clicks</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all"
                          style={{ width: `${(link.clickCount / maxClicks) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Device breakdown */}
            {isPro && devices.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <h3 className="font-semibold text-white mb-4">Device Breakdown</h3>
                <div className="grid grid-cols-3 gap-4">
                  {devices.map((d) => (
                    <div key={d.device} className="text-center bg-gray-800 rounded-xl p-4">
                      <div className="text-2xl mb-2">
                        {d.device === 'MOBILE' ? '📱' : d.device === 'TABLET' ? '📟' : '💻'}
                      </div>
                      <div className="text-2xl font-bold text-white">{d.count}</div>
                      <div className="text-xs text-gray-400 mt-1 capitalize">{d.device?.toLowerCase()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
