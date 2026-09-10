'use client';

import { useState } from 'react';
import Link from 'next/link';

const SERVICE_ICONS = {
  GITHUB: '🐙',
  LINKEDIN: '💼',
  TWITTER: '🐦',
  LEETCODE: '💡',
  CODECHEF: '👨‍🍳',
  NAUKRI: '🏢',
};

const SERVICE_COLORS = {
  GITHUB: '#24292e',
  LINKEDIN: '#0077b5',
  TWITTER: '#1da1f2',
  LEETCODE: '#ffa116',
  CODECHEF: '#5b4638',
  NAUKRI: '#ff7555',
};

// YouTube embed helper
function getYouTubeEmbedUrl(url) {
  if (!url) return null;
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
  const match = url.match(regExp);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

// Spotify embed helper
function getSpotifyEmbedUrl(url) {
  if (!url) return null;
  if (url.includes('open.spotify.com')) {
    if (url.includes('/embed/')) return url;
    return url.replace('open.spotify.com/', 'open.spotify.com/embed/');
  }
  return null;
}

export default function PublicProfileClient({ profile }) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [unlockedGates, setUnlockedGates] = useState({});
  const [gateInputs, setGateInputs] = useState({});
  const [gateErrors, setGateErrors] = useState({});

  // QR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);

  // Tip jar selected amounts per link
  const [selectedTips, setSelectedTips] = useState({});

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleLinkClick = async (linkId) => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/links/click/${linkId}`, {
        method: 'POST',
      });
    } catch {
      // silent fail
    }
  };

  const handleOpenQr = async () => {
    setShowQrModal(true);
    if (!qrData) {
      setQrLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/profile/${profile.username}/qr`);
        const data = await res.json();
        setQrData(data);
      } catch {
        // fail silently
      } finally {
        setQrLoading(false);
      }
    }
  };

  const handleUnlockGate = (linkId, requiredValue) => {
    const input = gateInputs[linkId] || '';
    if (!input.trim()) {
      setGateErrors((prev) => ({ ...prev, [linkId]: 'Please enter the required code or email' }));
      return;
    }
    // If a required passcode was specified in gateAmount or default
    if (requiredValue && input.trim().toLowerCase() !== String(requiredValue).trim().toLowerCase()) {
      setGateErrors((prev) => ({ ...prev, [linkId]: 'Incorrect passcode. Try again.' }));
      return;
    }
    // Unlocked!
    setUnlockedGates((prev) => ({ ...prev, [linkId]: true }));
    setGateErrors((prev) => ({ ...prev, [linkId]: null }));
    handleLinkClick(linkId);
  };

  // Button styles
  const getBtnClass = () => {
    const base = 'w-full py-3.5 px-6 font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3';
    switch (profile.buttonStyle) {
      case 'sharp': return `${base} rounded-none`;
      case 'pill': return `${base} rounded-full`;
      default: return `${base} rounded-xl`;
    }
  };

  // Dev stats from integrations
  const githubData = profile.integrations?.find((i) => i.service === 'GITHUB')?.syncData;
  const leetcodeData = profile.integrations?.find((i) => i.service === 'LEETCODE')?.syncData;
  const codechefData = profile.integrations?.find((i) => i.service === 'CODECHEF')?.syncData;

  const links = profile.links || [];

  return (
    <div
      className="min-h-screen font-sans"
      style={{
        background: profile.backgroundUrl
          ? `url(${profile.backgroundUrl}) center/cover fixed`
          : 'linear-gradient(135deg, #0b0b14 0%, #121226 50%, #0d1527 100%)',
      }}
    >
      <div className="min-h-screen flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-lg">

          {/* ─── PROFILE HEADER ─── */}
          <div className="text-center mb-8 relative">
            {/* Avatar */}
            {profile.avatarUrl ? (
              <div
                className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-2 shadow-xl shadow-black/40 ring-4 ring-white/5"
                style={{ borderColor: profile.primaryColor }}
              >
                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white shadow-xl shadow-black/40 ring-4 ring-white/5"
                style={{ backgroundColor: profile.primaryColor }}
              >
                {profile.displayName?.[0]?.toUpperCase() || 'U'}
              </div>
            )}

            <h1 className="text-2xl font-extrabold text-white mb-1 tracking-tight">{profile.displayName}</h1>
            <p className="text-gray-400 text-sm font-medium mb-2">@{profile.username}</p>
            {profile.bio && (
              <p className="text-gray-300 text-sm max-w-sm mx-auto leading-relaxed mt-2 px-2">
                {profile.bio}
              </p>
            )}

            {/* Actions: Share link + QR Code */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={handleCopyUrl}
                className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-3.5 py-1.5 rounded-full transition-colors font-medium flex items-center gap-1.5 backdrop-blur-sm"
              >
                <span>{copiedUrl ? '✓ Copied!' : '🔗 Copy Profile Link'}</span>
              </button>

              <button
                onClick={handleOpenQr}
                className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 px-3.5 py-1.5 rounded-full transition-colors font-medium flex items-center gap-1.5 backdrop-blur-sm"
              >
                <span>📱 Scan QR</span>
              </button>
            </div>
          </div>

          {/* ─── DEV SCORECARD (if integrations connected) ─── */}
          {(githubData || leetcodeData || codechefData) && (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 mb-6 shadow-xl">
              <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4 text-center">
                🏆 Developer Stats
              </div>
              <div className="grid grid-cols-3 gap-4">
                {githubData && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">⭐ {githubData.totalStars || 0}</div>
                    <div className="text-xs text-gray-400 mt-1">GitHub Stars</div>
                    <div className="text-xs text-gray-500">{githubData.publicRepos || 0} repos</div>
                  </div>
                )}
                {leetcodeData && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">💡 {leetcodeData.totalSolved || 0}</div>
                    <div className="text-xs text-gray-400 mt-1">LeetCode Solved</div>
                    {leetcodeData.rating > 0 && (
                      <div className="text-xs text-gray-500">Rating: {leetcodeData.rating}</div>
                    )}
                  </div>
                )}
                {codechefData && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">👨‍🍳 {codechefData.stars || '—'}</div>
                    <div className="text-xs text-gray-400 mt-1">CodeChef Stars</div>
                    <div className="text-xs text-gray-500">Rating: {codechefData.currentRating || '—'}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── SMART LINKS & MEDIA BLOCKS ─── */}
          <div className="space-y-4">
            {links.map((link) => {
              // 1. YOUTUBE EMBED
              if (link.type === 'YOUTUBE') {
                const embedUrl = getYouTubeEmbedUrl(link.url);
                return (
                  <div
                    key={link.id}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden p-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                        <span>▶️</span> {link.title}
                      </span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleLinkClick(link.id)}
                        className="text-[11px] text-gray-400 hover:text-white transition-colors"
                      >
                        Open on YouTube ↗
                      </a>
                    </div>
                    {embedUrl ? (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-inner">
                        <iframe
                          src={embedUrl}
                          title={link.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="w-full h-full border-0"
                        />
                      </div>
                    ) : (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleLinkClick(link.id)}
                        className={getBtnClass()}
                      >
                        Watch Video
                      </a>
                    )}
                  </div>
                );
              }

              // 2. SPOTIFY EMBED
              if (link.type === 'SPOTIFY') {
                const embedUrl = getSpotifyEmbedUrl(link.url);
                return (
                  <div
                    key={link.id}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden p-3.5 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-2.5 px-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                        <span>🎵</span> {link.title}
                      </span>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleLinkClick(link.id)}
                        className="text-[11px] text-gray-400 hover:text-white transition-colors"
                      >
                        Spotify ↗
                      </a>
                    </div>
                    {embedUrl ? (
                      <div className="w-full rounded-xl overflow-hidden shadow-inner">
                        <iframe
                          src={embedUrl}
                          width="100%"
                          height="152"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                          className="border-0 rounded-xl"
                        />
                      </div>
                    ) : (
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleLinkClick(link.id)}
                        className={getBtnClass()}
                      >
                        Listen on Spotify
                      </a>
                    )}
                  </div>
                );
              }

              // 3. PRODUCT CARD
              if (link.type === 'PRODUCT') {
                return (
                  <div
                    key={link.id}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-xl flex items-center gap-4 hover:border-white/20 transition-all group"
                  >
                    {link.productImage ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-900 shrink-0 border border-white/10">
                        <img src={link.productImage} alt={link.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-indigo-950/60 border border-indigo-700/40 flex items-center justify-center text-2xl shrink-0">
                        🛍️
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white text-sm truncate">{link.title}</h3>
                      </div>
                      {link.productPrice !== undefined && (
                        <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
                          ${Number(link.productPrice).toFixed(2)}
                        </div>
                      )}
                    </div>

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleLinkClick(link.id)}
                      className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950/40 flex items-center gap-1"
                    >
                      <span>Buy</span>
                      <span>↗</span>
                    </a>
                  </div>
                );
              }

              // 4. TIP JAR / SUPPORT ME
              if (link.type === 'TIPJAR') {
                const selected = selectedTips[link.id] || 5;
                const tipAmounts = [5, 10, 25];

                return (
                  <div
                    key={link.id}
                    className="bg-gradient-to-br from-amber-950/20 via-white/5 to-white/5 backdrop-blur-md border border-amber-600/30 rounded-2xl p-5 shadow-xl text-center"
                  >
                    <div className="text-2xl mb-1">☕</div>
                    <h3 className="font-bold text-white text-sm mb-1">{link.title}</h3>
                    <p className="text-gray-400 text-xs mb-3">Support my creative work and software projects</p>

                    <div className="flex justify-center gap-2 mb-4">
                      {tipAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSelectedTips({ ...selectedTips, [link.id]: amt })}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            selected === amt
                              ? 'bg-amber-500 text-gray-950 border-amber-400 shadow-md shadow-amber-950/40'
                              : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          ${amt}
                        </button>
                      ))}
                    </div>

                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleLinkClick(link.id)}
                      className="inline-flex items-center justify-center gap-2 w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-amber-950/40"
                    >
                      <span>Support with ${selected}</span>
                      <span>→</span>
                    </a>
                  </div>
                );
              }

              // 5. GATED SECRET CONTENT
              if (link.type === 'GATED') {
                const isUnlocked = unlockedGates[link.id];

                return (
                  <div
                    key={link.id}
                    className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{isUnlocked ? '🔓' : '🔒'}</span>
                        <h3 className="font-bold text-white text-sm">{link.title}</h3>
                      </div>
                      <span className="text-[11px] bg-amber-950 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded-md font-semibold">
                        {isUnlocked ? 'Unlocked' : 'Protected'}
                      </span>
                    </div>

                    {isUnlocked ? (
                      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                        <span className="text-xs text-emerald-400 font-medium truncate max-w-[240px]">
                          ✓ Content Unlocked
                        </span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1 shadow-lg shadow-emerald-950/30"
                        >
                          <span>Open Secret Link</span>
                          <span>↗</span>
                        </a>
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2.5">
                        <p className="text-xs text-gray-400">
                          {link.gateType === 'EMAIL'
                            ? 'Enter your subscriber email to unlock this exclusive content.'
                            : 'Enter the passcode to unlock this protected resource.'}
                        </p>
                        <div className="flex gap-2">
                          <input
                            type={link.gateType === 'EMAIL' ? 'email' : 'text'}
                            placeholder={link.gateType === 'EMAIL' ? 'your@email.com' : 'Enter passcode...'}
                            value={gateInputs[link.id] || ''}
                            onChange={(e) =>
                              setGateInputs({ ...gateInputs, [link.id]: e.target.value })
                            }
                            className="flex-1 bg-black/40 border border-white/15 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleUnlockGate(link.id, link.gateAmount)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-950/40"
                          >
                            Unlock
                          </button>
                        </div>
                        {gateErrors[link.id] && (
                          <p className="text-[11px] text-red-400 font-medium">{gateErrors[link.id]}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              // 6. STANDARD LINK
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleLinkClick(link.id)}
                  className={getBtnClass()}
                  style={{
                    backgroundColor: profile.primaryColor + '22',
                    color: 'white',
                    border: `1px solid ${profile.primaryColor}44`,
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = profile.primaryColor + '44';
                    e.currentTarget.style.borderColor = profile.primaryColor + '88';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = profile.primaryColor + '22';
                    e.currentTarget.style.borderColor = profile.primaryColor + '44';
                  }}
                >
                  {link.iconUrl && (
                    <img src={link.iconUrl} alt="" className="w-5 h-5 rounded" />
                  )}
                  <span className="truncate">{link.title}</span>
                </a>
              );
            })}

            {links.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-12 bg-white/5 border border-white/5 rounded-2xl">
                No links added yet.
              </div>
            )}
          </div>

          {/* ─── EMAIL CAPTURE ─── */}
          <div className="mt-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center shadow-xl">
            <h3 className="text-white font-bold text-sm mb-1">Subscribe to my newsletter</h3>
            <p className="text-gray-400 text-xs mb-4">Get the latest updates delivered directly to your inbox.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const email = formData.get('email');
                const name = formData.get('name');
                try {
                  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/email-list/subscribe`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: profile.username, email, name }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || 'Failed to subscribe');
                  alert('Successfully subscribed!');
                  e.target.reset();
                } catch (err) {
                  alert('Error: ' + err.message);
                }
              }}
              className="flex flex-col gap-2.5"
            >
              <input
                type="text"
                name="name"
                placeholder="Your name (optional)"
                className="bg-black/30 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-full"
              />
              <input
                type="email"
                name="email"
                required
                placeholder="Your email address"
                className="bg-black/30 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 w-full"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl px-4 py-2.5 text-xs transition-colors w-full shadow-lg shadow-indigo-950/40"
              >
                Subscribe
              </button>
            </form>
          </div>

          {/* ─── INTEGRATION BADGES ─── */}
          {profile.integrations?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {profile.integrations.map((integration) => (
                <div
                  key={integration.service}
                  className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-full backdrop-blur-sm"
                  style={{
                    backgroundColor: SERVICE_COLORS[integration.service] + '33',
                    border: `1px solid ${SERVICE_COLORS[integration.service]}55`,
                  }}
                >
                  <span>{SERVICE_ICONS[integration.service]}</span>
                  <span>{integration.username}</span>
                </div>
              ))}
            </div>
          )}

          {/* ─── BRANDING ─── */}
          {profile.showBranding && (
            <div className="text-center mt-10">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
              >
                <span className="text-indigo-400">⬡</span> Made with LinkPort
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ─── QR CODE POPUP MODAL ─── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 overflow-hidden shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Scan to Open Profile</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {qrLoading ? (
              <div className="py-12 flex justify-center">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : qrData?.qrCode ? (
              <>
                <div className="bg-white p-4 rounded-xl inline-block shadow-inner mx-auto">
                  <img src={qrData.qrCode} alt="Profile QR Code" className="w-52 h-52 object-contain" />
                </div>
                <p className="text-xs text-gray-400 font-medium">@{profile.username} on LinkPort</p>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Profile link copied!');
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-950/40"
                >
                  Copy Profile Link
                </button>
              </>
            ) : (
              <div className="py-8 text-xs text-gray-400">Failed to load QR code.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
