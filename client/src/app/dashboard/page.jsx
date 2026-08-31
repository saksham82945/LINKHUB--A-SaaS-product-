'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useIsAuthenticated } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();

  const [links, setLinks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddLink, setShowAddLink] = useState(false);
  const [editingLink, setEditingLink] = useState(null);

  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const loadData = useCallback(async () => {
    try {
      const [linksRes, analyticsRes] = await Promise.all([
        api.get('/links'),
        api.get('/analytics/summary'),
      ]);
      setLinks(linksRes.data);
      setAnalytics(analyticsRes.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddLink = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/links', newLink);
      toast.success('Link added!');
      setNewLink({ title: '', url: '' });
      setShowAddLink(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLink = async (e) => {
    e.preventDefault();
    if (!editingLink) return;
    setSubmitting(true);
    try {
      await api.patch(`/links/${editingLink.id}`, {
        title: editingLink.title,
        url: editingLink.url,
      });
      toast.success('Link updated!');
      setEditingLink(null);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLink = async (id) => {
    if (!confirm('Delete this link?')) return;
    try {
      await api.delete(`/links/${id}`);
      toast.success('Link deleted');
      loadData();
    } catch {
      toast.error('Failed to delete link');
    }
  };

  const handleToggleLink = async (id) => {
    try {
      await api.patch(`/links/${id}/toggle`);
      loadData();
    } catch {
      toast.error('Failed to toggle link');
    }
  };

  const handleLogout = async () => {
    // Handled by DashboardLayout
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm">Loading your dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
        {/* Header */}
        <div className="h-16 border-b border-gray-800 flex items-center px-8 gap-4 bg-gray-950">
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">My Links</h1>
            <p className="text-xs text-gray-500">
              linkport.io/{user?.profile?.username}
            </p>
          </div>
          <Link
            href={`/u/${user?.profile?.username}`}
            target="_blank"
            className="text-sm text-gray-400 hover:text-white transition-colors border border-gray-700 hover:border-gray-500 px-4 py-2 rounded-lg"
          >
            View Public Page ↗
          </Link>
          {/* UPGRADE BUTTON — temporarily hidden
          {user?.plan === 'FREE' && (
            <Link
              href="/upgrade"
              className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              ⭐ Upgrade to Pro
            </Link>
          )}
          */}
        </div>

        <div className="p-8">
          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Total Clicks', value: analytics.totalClicks, icon: '🖱️', sub: analytics.dateRange },
                { label: 'Profile Views', value: analytics.profileViews, icon: '👁️', sub: 'all time' },
                { label: 'Active Links', value: analytics.activeLinks, icon: '🔗', sub: 'links live' },
              ].map((card) => (
                <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{card.icon}</span>
                    <span className="text-xs text-gray-500">{card.sub}</span>
                  </div>
                  <div className="text-3xl font-bold text-white">{card.value.toLocaleString()}</div>
                  <div className="text-sm text-gray-400 mt-1">{card.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Links section */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <h2 className="font-semibold text-white">Your Links</h2>
              <button
                onClick={() => setShowAddLink(!showAddLink)}
                id="add-link-btn"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2"
              >
                <span>+</span> Add Link
              </button>
            </div>

            {/* Add link form */}
            {showAddLink && (
              <form onSubmit={handleAddLink} className="p-5 border-b border-gray-800 bg-gray-800/50">
                <div className="flex gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Link title (e.g. My GitHub)"
                    value={newLink.title}
                    onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={newLink.url}
                    onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {submitting ? '...' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddLink(false)}
                    className="text-gray-400 hover:text-white px-3 py-2.5 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Links list */}
            {links.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-3">🔗</div>
                <p className="font-medium text-gray-400">No links yet</p>
                <p className="text-sm mt-1">Add your first link to get started</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-800">
                {links.map((link) => (
                  <li key={link.id} className="p-5 flex items-center gap-4 group hover:bg-gray-800/30 transition-colors">
                    {/* Drag handle (visual) */}
                    <span className="text-gray-600 cursor-grab">⠿</span>

                    {/* Link info */}
                    {editingLink?.id === link.id ? (
                      <form onSubmit={handleUpdateLink} className="flex-1 flex gap-3">
                        <input
                          autoFocus
                          value={editingLink.title}
                          onChange={(e) => setEditingLink({ ...editingLink, title: e.target.value })}
                          className="flex-1 bg-gray-800 border border-indigo-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none"
                        />
                        <input
                          value={editingLink.url}
                          onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                          className="flex-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        />
                        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm" disabled={submitting}>
                          Save
                        </button>
                        <button type="button" onClick={() => setEditingLink(null)} className="text-gray-400 px-3 py-2 text-sm">
                          Cancel
                        </button>
                      </form>
                    ) : (
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white text-sm">{link.title}</span>
                          {!link.isActive && (
                            <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">Hidden</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate mt-0.5">{link.url}</div>
                      </div>
                    )}

                    {/* Stats & actions */}
                    <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-xs text-gray-500">{link.clickCount} clicks</span>

                      {/* Toggle */}
                      <button
                        onClick={() => handleToggleLink(link.id)}
                        title={link.isActive ? 'Hide link' : 'Show link'}
                        className={`w-10 h-5 rounded-full transition-colors relative ${link.isActive ? 'bg-indigo-600' : 'bg-gray-700'}`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${link.isActive ? 'translate-x-5' : 'translate-x-0.5'}`}
                        />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => setEditingLink(link)}
                        className="text-gray-500 hover:text-white transition-colors text-sm"
                      >
                        ✏️
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="text-gray-500 hover:text-red-400 transition-colors text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* FREE PLAN LIMIT NOTICE — temporarily hidden
            {user?.plan === 'FREE' && links.length >= 5 && (
              <div className="p-4 border-t border-gray-800 bg-indigo-950/50 flex items-center justify-between">
                <span className="text-sm text-indigo-300">You&#39;ve reached the 5-link limit on Free plan</span>
                <Link href="/upgrade" className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                  Upgrade for Unlimited
                </Link>
              </div>
            )}
            */}
          </div>
        </div>
    </div>
  );
}
