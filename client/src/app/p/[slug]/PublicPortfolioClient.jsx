'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function PublicPortfolioClient({ portfolio: initialPortfolio, slug }) {
  const [portfolio, setPortfolio] = useState(initialPortfolio);
  const [loading, setLoading] = useState(!initialPortfolio);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!portfolio && slug) {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      fetch(`${apiBase}/portfolio-doc/public/${slug}`)
        .then((res) => {
          if (!res.ok) throw new Error('Not found');
          return res.json();
        })
        .then((data) => setPortfolio(data))
        .catch(() => setPortfolio(null))
        .finally(() => setLoading(false));
    }
  }, [portfolio, slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading portfolio showcase...</span>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center text-gray-400">
        <h1 className="text-2xl font-bold text-white mb-2">Portfolio Not Found</h1>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          This portfolio document does not exist or the creator may have made it private.
        </p>
        <Link
          href="/"
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Return to LinkHub
        </Link>
      </div>
    );
  }

  const content = portfolio.content || {};
  const author = portfolio.author || {};
  const authorProfile = author.profile || {};
  const accentColor = content.accentColor || '#6366f1';
  const theme = content.theme || 'dark-glass';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Portfolio URL copied to clipboard!');
    } catch {
      toast.error('Failed to copy URL');
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      toast.loading('Generating recruiter PDF...', { id: 'pdf-toast' });
      const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';
      const res = await fetch(`${apiBase}/portfolio-doc/${portfolio.id}/pdf`);
      if (!res.ok) throw new Error('PDF download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${portfolio.title || 'developer-portfolio'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded!', { id: 'pdf-toast' });
    } catch {
      toast.error('Could not download PDF directly', { id: 'pdf-toast' });
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div
      className={`min-h-screen ${
        theme === 'minimal-light'
          ? 'bg-slate-50 text-slate-900'
          : theme === 'cyberpunk'
          ? 'bg-slate-950 text-slate-100'
          : theme === 'slate'
          ? 'bg-slate-900 text-slate-100'
          : 'bg-gray-950 text-white'
      } flex flex-col justify-between`}
    >
      {/* Top Banner Navigation */}
      <nav className="border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-md px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
            LH
          </div>
          <span className="font-bold text-sm text-white tracking-tight">LinkHub</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleCopyLink}
            className="text-xs bg-gray-800/80 hover:bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg transition-colors border border-gray-700/60 font-medium flex items-center gap-1.5"
          >
            <span>🔗</span>
            <span>Share</span>
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg transition-colors font-semibold shadow-md shadow-indigo-950/40 flex items-center gap-1.5"
          >
            <span>📥</span>
            <span>{downloadingPdf ? 'Exporting...' : 'Download PDF'}</span>
          </button>
        </div>
      </nav>

      {/* Main Content Showcase */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        {/* Profile Hero Card */}
        <div className="bg-gray-900/60 border border-gray-800/80 rounded-2xl p-8 backdrop-blur-xl shadow-2xl mb-8 relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div
            className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
            style={{ backgroundColor: accentColor }}
          />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-5">
              {authorProfile.avatarUrl ? (
                <img
                  src={authorProfile.avatarUrl}
                  alt={content.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-lg shadow-black/40"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg shadow-black/40"
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, #3b82f6)`,
                  }}
                >
                  {(content.name || 'D').charAt(0)}
                </div>
              )}

              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                    {content.name || author.name}
                  </h1>
                  {content.status && (
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {content.status}
                    </span>
                  )}
                </div>
                <div
                  className="text-sm md:text-base font-semibold mt-1"
                  style={{ color: accentColor }}
                >
                  {content.headline || 'Software Engineer & Builder'}
                </div>
                <div className="text-xs text-gray-400 mt-1.5 flex items-center gap-2">
                  <span>📍 {content.location || 'Remote'}</span>
                  <span>•</span>
                  <span>{portfolio.type?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Hub Backlink */}
            {authorProfile.username && (
              <Link
                href={`/u/${authorProfile.username}`}
                className="text-xs bg-gray-800/90 hover:bg-gray-700 text-gray-300 border border-gray-700 px-3.5 py-2 rounded-xl transition-colors font-medium flex items-center gap-1.5 shadow-sm"
              >
                <span>🔗</span>
                <span>View Full LinkHub</span>
              </Link>
            )}
          </div>

          {/* Bio Story */}
          {content.bio && (
            <div className="mt-6 pt-6 border-t border-gray-800/70">
              <p className="text-sm text-gray-300 leading-relaxed font-normal">
                {content.bio}
              </p>
            </div>
          )}

          {/* Stats Counters */}
          {(content.stats || []).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-800/70">
              {content.stats.map((st, i) => (
                <div
                  key={i}
                  className="bg-gray-950/60 border border-gray-800/70 rounded-xl p-3.5 text-center"
                >
                  <div className="text-lg font-bold text-white">{st.value}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5 truncate">{st.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Technical Expertise / Skills */}
        {(content.skills || []).length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span>⚡</span>
              <span>Core Competencies & Stack</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.skills.map((cat, i) => (
                <div
                  key={i}
                  className="bg-gray-900/40 border border-gray-800/70 rounded-xl p-4"
                >
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                    {cat.category}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(cat.items || []).map((item, j) => (
                      <span
                        key={j}
                        className="text-xs px-2.5 py-1 rounded-lg font-medium bg-gray-800/80 text-gray-200 border border-gray-700/60"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Featured Projects */}
        {(content.projects || []).length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span>🚀</span>
              <span>Featured Projects & Systems</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {content.projects.map((proj, i) => (
                <div
                  key={i}
                  className="bg-gray-900/50 border border-gray-800/80 hover:border-gray-700 rounded-2xl p-5 flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-base text-white group-hover:text-indigo-400 transition-colors">
                        {proj.title}
                      </h3>
                      {proj.featured && (
                        <span className="text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full uppercase">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed mb-4">
                      {proj.description}
                    </p>
                  </div>

                  <div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {(proj.tags || []).map((t, ti) => (
                        <span
                          key={ti}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-purple-950/30 text-purple-300 border border-purple-900/40 font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-gray-800/60 text-xs">
                      {proj.demoUrl && (
                        <a
                          href={proj.demoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 hover:underline"
                        >
                          <span>Live Demo</span>
                          <span>↗</span>
                        </a>
                      )}
                      {proj.githubUrl && (
                        <a
                          href={proj.githubUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-gray-400 hover:text-white font-medium flex items-center gap-1"
                        >
                          <span>Code Repository</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Socials & Connect Bar */}
        {content.socials && Object.values(content.socials).some(Boolean) && (
          <div className="bg-gray-900/40 border border-gray-800/70 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-sm">Connect with {content.name || author.name}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Explore code repositories, professional networks, and contact info</p>
            </div>
            <div className="flex items-center gap-3">
              {content.socials.github && (
                <a
                  href={content.socials.github}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors border border-gray-700 font-medium"
                >
                  GitHub
                </a>
              )}
              {content.socials.linkedin && (
                <a
                  href={content.socials.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors border border-gray-700 font-medium"
                >
                  LinkedIn
                </a>
              )}
              {content.socials.twitter && (
                <a
                  href={content.socials.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors border border-gray-700 font-medium"
                >
                  Twitter / X
                </a>
              )}
              {content.socials.website && (
                <a
                  href={content.socials.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg transition-colors border border-gray-700 font-medium"
                >
                  Website
                </a>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer Branding Bar */}
      <footer className="border-t border-gray-800/80 bg-gray-950/80 px-6 py-6 text-center text-xs text-gray-500">
        <p className="flex items-center justify-center gap-1.5">
          <span>Created with</span>
          <Link href="/" className="font-bold text-gray-300 hover:text-white transition-colors">
            LinkHub
          </Link>
          <span>— The All-in-One Link-in-Bio & AI Career Platform</span>
        </p>
      </footer>
    </div>
  );
}
