'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useIsAuthenticated, useIsInitialized } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const LINK_TYPES = [
  { id: 'LINK', label: 'Standard Link', icon: '🔗', desc: 'Direct URL to portfolio, website, or social profile' },
  { id: 'PRODUCT', label: 'Product Card', icon: '🛍️', desc: 'Showcase digital/physical goods with price & buy CTA' },
  { id: 'YOUTUBE', label: 'YouTube Embed', icon: '▶️', desc: 'Inline responsive video player directly on your page' },
  { id: 'SPOTIFY', label: 'Spotify Track / Album', icon: '🎵', desc: 'Stream your tracks, podcast, or playlists inline' },
  { id: 'TIPJAR', label: 'Tip Jar / Support', icon: '☕', desc: 'Accept direct donations & tips with preset amounts' },
  { id: 'GATED', label: 'Gated Secret Link', icon: '🔒', desc: 'Lock behind password or email subscriber capture' },
];

export default function DashboardPage() {
  const router = useRouter();
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const isInitialized = useIsInitialized();

  const [links, setLinks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Link Studio Modal State
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form State
  const defaultFormData = {
    title: '',
    url: '',
    type: 'LINK',
    iconUrl: '',
    scheduledAt: '',
    expiresAt: '',
    targetDevice: 'ALL',
    productPrice: '',
    productImage: '',
    gateType: 'PASSWORD',
    gateAmount: '',
  };
  const [formData, setFormData] = useState(defaultFormData);
  const [showSmartOptions, setShowSmartOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // QR Code Modal State
  const [qrModal, setQrModal] = useState({ open: false, title: '', url: '', qrCode: '', loading: false });

  // Link Health State
  const [healthMap, setHealthMap] = useState({});
  const [checkingHealth, setCheckingHealth] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isInitialized, isAuthenticated, router]);

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

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(defaultFormData);
    setShowSmartOptions(false);
    setShowStudioModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (link) => {
    setIsEditing(true);
    setEditingId(link.id);
    setFormData({
      title: link.title || '',
      url: link.url || '',
      type: link.type || 'LINK',
      iconUrl: link.iconUrl || '',
      scheduledAt: link.scheduledAt ? new Date(link.scheduledAt).toISOString().slice(0, 16) : '',
      expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString().slice(0, 16) : '',
      targetDevice: link.targetDevice || 'ALL',
      productPrice: link.productPrice ? String(link.productPrice) : '',
      productImage: link.productImage || '',
      gateType: link.gateType || 'PASSWORD',
      gateAmount: link.gateAmount ? String(link.gateAmount) : '',
    });
    setShowSmartOptions(!!(link.scheduledAt || link.expiresAt || link.targetDevice !== 'ALL'));
    setShowStudioModal(true);
  };

  // Submit Link (Create or Update)
  const handleSubmitLink = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const payload = {
      title: formData.title,
      url: formData.url,
      type: formData.type,
      targetDevice: formData.targetDevice,
      iconUrl: formData.iconUrl || undefined,
      scheduledAt: formData.scheduledAt ? new Date(formData.scheduledAt).toISOString() : undefined,
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : undefined,
      productPrice: formData.productPrice ? parseFloat(formData.productPrice) : undefined,
      productImage: formData.productImage || undefined,
      gateType: formData.type === 'GATED' ? formData.gateType : undefined,
      gateAmount: formData.gateAmount ? parseFloat(formData.gateAmount) : undefined,
    };

    try {
      if (isEditing) {
        await api.patch(`/links/${editingId}`, payload);
        toast.success('Smart Link updated!');
      } else {
        await api.post('/links', payload);
        toast.success('Smart Link created!');
      }
      setShowStudioModal(false);
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save link');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLink = async (id) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
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

  // QR Code Handlers
  const handleOpenProfileQr = async () => {
    setQrModal({ open: true, title: 'Profile QR Code', url: '', qrCode: '', loading: true });
    try {
      const res = await api.get('/links/profile/qr');
      setQrModal({
        open: true,
        title: `@${res.data.username}'s LinkHub QR`,
        url: res.data.url,
        qrCode: res.data.qrCode,
        loading: false,
      });
    } catch {
      toast.error('Failed to generate profile QR');
      setQrModal((prev) => ({ ...prev, open: false }));
    }
  };

  const handleOpenLinkQr = async (link) => {
    setQrModal({ open: true, title: link.title, url: link.url, qrCode: '', loading: true });
    try {
      const res = await api.get(`/links/${link.id}/qr`);
      setQrModal({
        open: true,
        title: `QR for: ${res.data.title}`,
        url: res.data.url,
        qrCode: res.data.qrCode,
        loading: false,
      });
    } catch {
      toast.error('Failed to generate link QR');
      setQrModal((prev) => ({ ...prev, open: false }));
    }
  };

  const handleDownloadQr = (qrCode, filename) => {
    const a = document.createElement('a');
    a.href = qrCode;
    a.download = `${filename.replace(/\s+/g, '_').toLowerCase()}_qr.png`;
    a.click();
    toast.success('QR Code image downloaded!');
  };

  // Link Health Check Handlers
  const handleCheckSingleHealth = async (linkId) => {
    setHealthMap((prev) => ({ ...prev, [linkId]: { loading: true } }));
    try {
      const res = await api.post(`/links/${linkId}/health`);
      setHealthMap((prev) => ({ ...prev, [linkId]: res.data }));
      if (res.data.status === 'HEALTHY') {
        toast.success(`Active (${res.data.responseTimeMs}ms)`);
      } else {
        toast.error(res.data.message || 'Link error');
      }
    } catch {
      setHealthMap((prev) => ({
        ...prev,
        [linkId]: { status: 'DOWN', message: 'Check failed' },
      }));
    }
  };

  const handleCheckAllHealth = async () => {
    setCheckingHealth(true);
    toast.loading('Checking all link destinations...', { id: 'health-check' });
    try {
      const res = await api.post('/links/health-all');
      setHealthMap(res.data);
      toast.success('Link health scan complete!', { id: 'health-check' });
    } catch {
      toast.error('Failed to scan links', { id: 'health-check' });
    } finally {
      setCheckingHealth(false);
    }
  };

  const username = user?.profile?.username || user?.username || 'user';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-400 text-sm font-medium">Loading Smart Links Studio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-gray-950">
      {/* Top Bar Header */}
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-gray-950/80 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>🔗</span> Smart Links & Creator Tools
          </h1>
          <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-800/80 px-2.5 py-0.5 rounded-full font-semibold">
            ⚡ Phase 9 Active
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCheckAllHealth}
            disabled={checkingHealth || links.length === 0}
            className="text-xs bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-gray-300 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
            title="Scan all links for broken URLs"
          >
            <span>{checkingHealth ? '⏳' : '⚡'}</span>
            <span>Scan Health</span>
          </button>

          <button
            onClick={handleOpenProfileQr}
            className="text-xs bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
          >
            <span>📱</span> Profile QR
          </button>

          <Link
            href={`/u/${username}`}
            target="_blank"
            className="text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-700/60 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
          >
            <span>View Public Page</span>
            <span>↗</span>
          </Link>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto space-y-8">
        {/* Analytics Summary */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: 'Total Clicks', value: analytics.totalClicks, icon: '🖱️', sub: analytics.dateRange, color: 'from-blue-950/40 to-indigo-950/20' },
              { label: 'Profile Views', value: analytics.profileViews, icon: '👁️', sub: 'all-time traffic', color: 'from-purple-950/40 to-pink-950/20' },
              { label: 'Active Smart Links', value: analytics.activeLinks, icon: '⚡', sub: `${links.length} total blocks`, color: 'from-emerald-950/40 to-teal-950/20' },
            ].map((card) => (
              <div
                key={card.label}
                className={`bg-gradient-to-br ${card.color} bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-lg shadow-black/20`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{card.icon}</span>
                  <span className="text-xs text-gray-400 font-medium">{card.sub}</span>
                </div>
                <div className="text-3xl font-extrabold text-white tracking-tight">{card.value.toLocaleString()}</div>
                <div className="text-sm font-medium text-gray-400 mt-1">{card.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Links Manager Container */}
        <div className="bg-gray-900/80 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          {/* Header Action */}
          <div className="p-6 border-b border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>My Smart Blocks</span>
                <span className="text-xs bg-gray-800 text-gray-400 font-normal px-2.5 py-0.5 rounded-md">
                  {links.length} Blocks
                </span>
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">
                Standard links, embedded players, digital products, and scheduled creator tools.
              </p>
            </div>

            <button
              onClick={handleOpenCreate}
              id="add-link-btn"
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-900/30 flex items-center gap-2"
            >
              <span>✨</span> + Add Smart Block
            </button>
          </div>

          {/* Links List */}
          {links.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-3xl mx-auto mb-4">
                🔗
              </div>
              <h3 className="text-lg font-bold text-white mb-1">No smart links created yet</h3>
              <p className="text-gray-400 text-sm max-w-sm mx-auto mb-6">
                Add standard links, YouTube video embeds, Spotify playlists, product cards, or locked secret downloads.
              </p>
              <button
                onClick={handleOpenCreate}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-900/30"
              >
                Create Your First Smart Link
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-800/80">
              {links.map((link) => {
                const health = healthMap[link.id];
                const typeInfo = LINK_TYPES.find((t) => t.id === link.type) || LINK_TYPES[0];

                return (
                  <li
                    key={link.id}
                    className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-gray-800/30 transition-colors group"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Link Type Icon */}
                      <div className="w-10 h-10 rounded-xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-center text-lg shrink-0 mt-0.5">
                        {typeInfo.icon}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white text-sm truncate">{link.title}</span>

                          {/* Link Type Badge */}
                          <span className="text-[11px] font-medium bg-gray-800 text-gray-300 border border-gray-700/60 px-2 py-0.5 rounded-md">
                            {typeInfo.label}
                          </span>

                          {/* Product price tag if applicable */}
                          {link.type === 'PRODUCT' && link.productPrice && (
                            <span className="text-[11px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                              ${link.productPrice}
                            </span>
                          )}

                          {/* Hidden status */}
                          {!link.isActive && (
                            <span className="text-[11px] bg-red-950 text-red-300 border border-red-800/60 px-2 py-0.5 rounded-md">
                              Hidden
                            </span>
                          )}

                          {/* Device targeting badge */}
                          {link.targetDevice && link.targetDevice !== 'ALL' && (
                            <span className="text-[11px] bg-purple-950 text-purple-300 border border-purple-800/60 px-2 py-0.5 rounded-md">
                              {link.targetDevice === 'MOBILE' ? '📱 Mobile' : '💻 Desktop'}
                            </span>
                          )}

                          {/* Scheduling badge */}
                          {link.scheduledAt && new Date(link.scheduledAt) > new Date() && (
                            <span className="text-[11px] bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-md">
                              ⏰ Scheduled: {new Date(link.scheduledAt).toLocaleDateString()}
                            </span>
                          )}

                          {link.expiresAt && (
                            <span className={`text-[11px] px-2 py-0.5 rounded-md border ${
                              new Date(link.expiresAt) <= new Date()
                                ? 'bg-red-950 text-red-300 border-red-800/60'
                                : 'bg-gray-800 text-gray-400 border-gray-700'
                            }`}>
                              ⏳ Expires: {new Date(link.expiresAt).toLocaleDateString()}
                            </span>
                          )}

                          {/* Health status badge */}
                          {health && (
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-md border font-medium flex items-center gap-1 ${
                                health.loading
                                  ? 'bg-gray-800 text-gray-400 border-gray-700'
                                  : health.status === 'HEALTHY'
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-800/80'
                                  : 'bg-red-950 text-red-300 border-red-800/80'
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {health.loading ? 'Checking...' : health.status === 'HEALTHY' ? 'Online' : 'Down'}
                            </span>
                          )}
                        </div>

                        {/* URL snippet */}
                        <div className="text-xs text-gray-500 truncate mt-1 max-w-lg">
                          {link.url}
                        </div>
                      </div>
                    </div>

                    {/* Stats & Controls */}
                    <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                      <span className="text-xs text-gray-400 bg-gray-950 border border-gray-800 px-2.5 py-1 rounded-md font-mono">
                        {link.clickCount} clicks
                      </span>

                      {/* Health Check Button */}
                      <button
                        onClick={() => handleCheckSingleHealth(link.id)}
                        title="Check destination link reachability"
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-lg border border-gray-700/60 transition-colors"
                      >
                        ⚡
                      </button>

                      {/* QR Code Button */}
                      <button
                        onClick={() => handleOpenLinkQr(link)}
                        title="Generate scannable QR Code"
                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 p-2 rounded-lg border border-gray-700/60 transition-colors"
                      >
                        📱
                      </button>

                      {/* Toggle Active Switch */}
                      <button
                        onClick={() => handleToggleLink(link.id)}
                        title={link.isActive ? 'Hide on public profile' : 'Show on public profile'}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          link.isActive ? 'bg-indigo-600' : 'bg-gray-700'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                            link.isActive ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(link)}
                        title="Edit link details"
                        className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                      >
                        ✏️
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        title="Delete link"
                        className="text-gray-400 hover:text-red-400 p-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────── */}
      {/* SMART LINK STUDIO MODAL (Create & Edit)             */}
      {/* ─────────────────────────────────────────────────── */}
      {showStudioModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl my-8 overflow-hidden shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {isEditing ? 'Edit Smart Link' : 'Add New Smart Link'}
                </h3>
                <p className="text-xs text-gray-400">
                  Configure interactive media, product checkout, or scheduled targeting.
                </p>
              </div>
              <button
                onClick={() => setShowStudioModal(false)}
                className="text-gray-400 hover:text-white text-xl leading-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitLink} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Link Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-2.5">
                  Select Link Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {LINK_TYPES.map((type) => {
                    const isSelected = formData.type === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.id })}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-950/40'
                            : 'bg-gray-800/60 border-gray-700/60 text-gray-300 hover:border-gray-600'
                        }`}
                      >
                        <div className="text-xl mb-1">{type.icon}</div>
                        <div className="text-xs font-bold leading-tight">{type.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Basic Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    Link Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      formData.type === 'PRODUCT'
                        ? 'e.g., Ultimate React Handbook eBook'
                        : formData.type === 'YOUTUBE'
                        ? 'e.g., Watch My Latest Full-Stack Tutorial'
                        : formData.type === 'TIPJAR'
                        ? 'e.g., ☕ Support My Open-Source Projects'
                        : formData.type === 'GATED'
                        ? 'e.g., Exclusive System Design Cheat Sheet'
                        : 'e.g., GitHub Portfolio / Blog'
                    }
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                    {formData.type === 'PRODUCT'
                      ? 'Checkout / Product URL *'
                      : formData.type === 'YOUTUBE'
                      ? 'YouTube Video URL (watch?v=... or youtu.be/...) *'
                      : formData.type === 'SPOTIFY'
                      ? 'Spotify Track / Album / Playlist URL *'
                      : formData.type === 'TIPJAR'
                      ? 'Tipping / Support Link (or external checkout URL) *'
                      : formData.type === 'GATED'
                      ? 'Secret Protected URL to Reveal *'
                      : 'Destination URL *'}
                  </label>
                  <input
                    type="url"
                    required
                    placeholder={
                      formData.type === 'YOUTUBE'
                        ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                        : formData.type === 'SPOTIFY'
                        ? 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT'
                        : 'https://...'
                    }
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Contextual Type Fields */}
              {formData.type === 'PRODUCT' && (
                <div className="p-4 bg-gray-800/50 border border-gray-700/60 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <span>🛍️</span> Product Configuration
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Price ($ USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="e.g. 29.00"
                        value={formData.productPrice}
                        onChange={(e) => setFormData({ ...formData, productPrice: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Thumbnail Image URL</label>
                      <input
                        type="url"
                        placeholder="https://.../cover.png"
                        value={formData.productImage}
                        onChange={(e) => setFormData({ ...formData, productImage: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.type === 'GATED' && (
                <div className="p-4 bg-gray-800/50 border border-gray-700/60 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <span>🔒</span> Gated Unlock Method
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Gate Rule</label>
                      <select
                        value={formData.gateType}
                        onChange={(e) => setFormData({ ...formData, gateType: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                      >
                        <option value="PASSWORD">Password Protection</option>
                        <option value="EMAIL">Email Subscriber Required</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">
                        {formData.gateType === 'PASSWORD' ? 'Passcode / Secret' : 'Optional Fee ($)'}
                      </label>
                      <input
                        type="text"
                        placeholder={formData.gateType === 'PASSWORD' ? 'e.g. SECRET123' : 'Free or 5.00'}
                        value={formData.gateAmount}
                        onChange={(e) => setFormData({ ...formData, gateAmount: e.target.value })}
                        className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Collapsible Smart Options */}
              <div className="border border-gray-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowSmartOptions(!showSmartOptions)}
                  className="w-full p-3.5 bg-gray-800/60 hover:bg-gray-800 flex items-center justify-between text-xs font-semibold text-gray-300 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>⚡</span> Smart Scheduling & Device Targeting
                  </span>
                  <span>{showSmartOptions ? '▲' : '▼'}</span>
                </button>

                {showSmartOptions && (
                  <div className="p-4 bg-gray-900/60 border-t border-gray-800 space-y-4">
                    {/* Device Targeting */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Device Targeting</label>
                      <div className="flex gap-2">
                        {[
                          { id: 'ALL', label: 'All Devices' },
                          { id: 'MOBILE', label: 'Mobile Only 📱' },
                          { id: 'DESKTOP', label: 'Desktop Only 💻' },
                        ].map((dev) => (
                          <button
                            key={dev.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, targetDevice: dev.id })}
                            className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${
                              formData.targetDevice === dev.id
                                ? 'bg-indigo-600 text-white border-indigo-500'
                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
                            }`}
                          >
                            {dev.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Scheduling Dates */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Publish Start (optional)</label>
                        <input
                          type="datetime-local"
                          value={formData.scheduledAt}
                          onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Expiration End (optional)</label>
                        <input
                          type="datetime-local"
                          value={formData.expiresAt}
                          onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                          className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowStudioModal(false)}
                  className="text-gray-400 hover:text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-900/30"
                >
                  {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Smart Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────── */}
      {/* QR CODE PREVIEW & DOWNLOAD MODAL                     */}
      {/* ─────────────────────────────────────────────────── */}
      {qrModal.open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 overflow-hidden shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white truncate max-w-[240px]">{qrModal.title}</h3>
              <button
                onClick={() => setQrModal({ ...qrModal, open: false })}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {qrModal.loading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="bg-white p-4 rounded-xl inline-block shadow-inner mx-auto">
                  <img src={qrModal.qrCode} alt="QR Code" className="w-56 h-56 object-contain" />
                </div>

                <p className="text-xs text-gray-400 break-all px-2">{qrModal.url}</p>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => handleDownloadQr(qrModal.qrCode, qrModal.title)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-1.5"
                  >
                    <span>💾</span> Download PNG
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(qrModal.url);
                      toast.success('Link copied to clipboard!');
                    }}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold py-2.5 px-3 rounded-xl border border-gray-700 transition-colors"
                  >
                    📋 Copy
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
