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

export default function PublicProfileClient({ profile }) {
  const [copiedUrl, setCopiedUrl] = useState(false);

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
  const githubData = profile.integrations.find((i) => i.service === 'GITHUB')?.syncData;
  const leetcodeData = profile.integrations.find((i) => i.service === 'LEETCODE')?.syncData;
  const codechefData = profile.integrations.find((i) => i.service === 'CODECHEF')?.syncData;

  return (
    <div
      className="min-h-screen"
      style={{
        background: profile.backgroundUrl
          ? `url(${profile.backgroundUrl}) center/cover fixed`
          : 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      }}
    >
      <div className="min-h-screen flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-lg">

          {/* ─── PROFILE HEADER ─── */}
          <div className="text-center mb-8">
            {/* Avatar */}
            {profile.avatarUrl ? (
              <div className="w-24 h-24 rounded-full mx-auto mb-4 overflow-hidden border-2 shadow-lg"
                   style={{ borderColor: profile.primaryColor }}>
                <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white shadow-lg"
                style={{ backgroundColor: profile.primaryColor }}
              >
                {profile.displayName[0]?.toUpperCase()}
              </div>
            )}

            <h1 className="text-2xl font-bold text-white mb-1">{profile.displayName}</h1>
            <p className="text-gray-400 text-sm mb-1">@{profile.username}</p>
            {profile.bio && (
              <p className="text-gray-300 text-sm max-w-sm mx-auto leading-relaxed mt-2">{profile.bio}</p>
            )}

            {/* Share button */}
            <button
              onClick={handleCopyUrl}
              className="mt-3 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              {copiedUrl ? '✓ Link copied!' : '⬡ linkport.io/' + profile.username}
            </button>
          </div>

          {/* ─── DEV SCORECARD (if integrations connected) ─── */}
          {(githubData || leetcodeData || codechefData) && (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 mb-5">
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-4 text-center">
                🏆 Developer Stats
              </div>
              <div className="grid grid-cols-3 gap-4">
                {githubData && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">⭐ {githubData.totalStars || 0}</div>
                    <div className="text-xs text-gray-400 mt-1">GitHub Stars</div>
                    <div className="text-xs text-gray-500">{githubData.publicRepos} repos</div>
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

          {/* ─── LINKS ─── */}
          <div className="space-y-3">
            {profile.links.map((link) => (
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
                <span>{link.title}</span>
              </a>
            ))}

            {profile.links.length === 0 && (
              <div className="text-center text-gray-500 text-sm py-8">
                No links added yet.
              </div>
            )}
          </div>

          {/* ─── EMAIL CAPTURE ─── */}
          <div className="mt-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center">
            <h3 className="text-white font-semibold mb-2">Subscribe to my newsletter</h3>
            <p className="text-gray-400 text-xs mb-4">Get the latest updates delivered to your inbox.</p>
            <form onSubmit={async (e) => {
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
            }} className="flex flex-col gap-3">
              <input type="text" name="name" placeholder="Your name (optional)" className="bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 w-full" />
              <input type="email" name="email" required placeholder="Your email address" className="bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 w-full" />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl px-4 py-3 text-sm transition-colors w-full">
                Subscribe
              </button>
            </form>
          </div>

          {/* ─── INTEGRATION BADGES ─── */}
          {profile.integrations.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {profile.integrations.map((integration) => (
                <div
                  key={integration.service}
                  className="flex items-center gap-1.5 text-xs text-white px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: SERVICE_COLORS[integration.service] + '33', border: `1px solid ${SERVICE_COLORS[integration.service]}55` }}
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
                className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                <span className="text-indigo-500">⬡</span> Made with LinkPort
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
