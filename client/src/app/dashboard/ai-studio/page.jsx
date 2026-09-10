'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AiStudioPage() {
  const user = useUser();
  const isPro = true;

  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(null);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [newPortfolioTitle, setNewPortfolioTitle] = useState('My Dev Card');
  const [newPortfolioType, setNewPortfolioType] = useState('DEV_CARD');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resRes, covRes, portRes] = await Promise.all([
        api.get('/resume').catch(() => ({ data: [] })),
        api.get('/cover-letter').catch(() => ({ data: [] })),
        api.get('/portfolio-doc').catch(() => ({ data: [] })),
      ]);

      setResumes(resRes.data.map((d) => ({ ...d, type: 'RESUME' })));
      setCoverLetters(covRes.data.map((d) => ({ ...d, type: 'COVER_LETTER' })));
      setPortfolios(portRes.data.map((d) => ({ ...d, type: 'PORTFOLIO', docType: d.type })));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResume = async () => {
    setCreating('RESUME');
    try {
      await api.post('/resume', { title: 'New Auto-filled Resume', template: 'ATS_CLEAN' });
      toast.success('Resume created!');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create resume');
    } finally {
      setCreating(null);
    }
  };

  const handleCreateCoverLetter = async () => {
    setCreating('COVER_LETTER');
    try {
      await api.post('/cover-letter', { title: 'New Cover Letter' });
      toast.success('Cover Letter created!');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create cover letter');
    } finally {
      setCreating(null);
    }
  };

  const handleCreatePortfolio = async () => {
    setCreating('PORTFOLIO');
    try {
      await api.post('/portfolio-doc', {
        title: newPortfolioTitle.trim() || 'My Dev Card',
        type: newPortfolioType,
      });
      toast.success('Portfolio created successfully!');
      setShowPortfolioModal(false);
      setNewPortfolioTitle('My Dev Card');
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create portfolio');
    } finally {
      setCreating(null);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm(`Delete this document?`)) return;
    try {
      const endpoint = type === 'RESUME' ? '/resume' : type === 'COVER_LETTER' ? '/cover-letter' : '/portfolio-doc';
      await api.delete(`${endpoint}/${id}`);
      toast.success('Deleted successfully');
      loadData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleCopyShareLink = async (doc) => {
    try {
      let slug = doc.shareSlug;
      if (!slug) {
        const res = await api.post(`/portfolio-doc/${doc.id}/share`);
        slug = res.data.shareSlug;
        loadData();
      }
      const fullUrl = `${window.location.origin}/p/${slug}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Public link copied to clipboard!');
    } catch {
      toast.error('Failed to generate share link');
    }
  };

  const handleDownloadPdf = async (id, title) => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-toast' });
      const res = await api.get(`/portfolio-doc/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'portfolio'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded!', { id: 'pdf-toast' });
    } catch {
      toast.error('Failed to download PDF', { id: 'pdf-toast' });
    }
  };

  const DocumentCard = ({ doc }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-700/50 transition-all group flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">
                {doc.type === 'RESUME' ? '📄' : doc.type === 'COVER_LETTER' ? '✉️' : '📁'}
              </span>
              <h3 className="font-semibold text-white truncate max-w-[210px]">{doc.title}</h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
              {doc.viewCount !== undefined && doc.viewCount > 0 && (
                <span className="text-gray-400 bg-gray-800/80 px-1.5 py-0.5 rounded text-[10px]">
                  👁️ {doc.viewCount} views
                </span>
              )}
            </div>
          </div>
          {doc.type === 'RESUME' && doc.atsScore !== undefined && doc.atsScore > 0 && (
            <div className={`text-xs px-2 py-1 rounded-lg font-medium border ${
              doc.atsScore >= 80 ? 'bg-green-950/50 text-green-400 border-green-800' :
              doc.atsScore >= 60 ? 'bg-yellow-950/50 text-yellow-400 border-yellow-800' :
              'bg-red-950/50 text-red-400 border-red-800'
            }`}>
              ATS: {doc.atsScore}%
            </div>
          )}
          {doc.type === 'PORTFOLIO' && (
            <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full uppercase font-semibold">
              {doc.docType === 'DEV_CARD' ? 'Dev Card' : doc.docType === 'PROJECT_CASE_STUDY' ? 'Case Study' : 'Portfolio'}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-6 pt-3 border-t border-gray-800/60">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDelete(doc.type, doc.id)}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            title="Delete document"
          >
            🗑️
          </button>
          {doc.type === 'PORTFOLIO' && (
            <>
              <button
                onClick={() => handleCopyShareLink(doc)}
                className="text-xs text-gray-400 hover:text-indigo-400 transition-colors flex items-center gap-1"
                title="Copy public link"
              >
                🔗
              </button>
              <button
                onClick={() => handleDownloadPdf(doc.id, doc.title)}
                className="text-xs text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1"
                title="Download PDF"
              >
                📥
              </button>
            </>
          )}
        </div>
        <Link
          href={`/dashboard/ai-studio/${doc.type.toLowerCase().replace('_', '-')}/${doc.id}`}
          className="text-xs bg-gray-800 hover:bg-indigo-600 text-white px-3.5 py-1.5 rounded-lg transition-all font-medium border border-gray-700 hover:border-indigo-500 flex items-center gap-1"
        >
          Edit & Generate →
        </Link>
      </div>
    </div>
  );

  if (loading) {
    return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Loading AI Studio...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      <div className="h-16 border-b border-gray-800 flex items-center px-8 justify-between">
        <h1 className="text-lg font-semibold text-white flex items-center gap-2">
          <span>✨</span> AI Document & Portfolio Studio
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-purple-950 text-purple-300 border border-purple-800 px-3 py-1 rounded-full font-semibold">
            ⚡ Phase 8 Active
          </span>
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        {/* Header Hero CTA */}
        <div className="bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-gray-950 border border-indigo-800/40 rounded-2xl p-8 mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl shadow-indigo-950/20">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/40 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-3">
              <span>🚀</span> AI Resume & Portfolio Suite
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Build recruiter-ready portfolios & documents with AI</h2>
            <p className="text-gray-400 text-sm max-w-xl leading-relaxed">
              Auto-fill your developer card, portfolios, and resumes directly from GitHub & LeetCode integrations, generate targeted cover letters, and share with live links or export high-res PDFs.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3 w-full md:w-auto shrink-0">
            <button
              onClick={() => setShowPortfolioModal(true)}
              disabled={creating !== null}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium transition-all text-sm shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2"
            >
              <span>🪪</span> + New Portfolio / Dev Card
            </button>
            <button
              onClick={handleCreateResume}
              disabled={creating !== null}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium transition-all text-sm shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
            >
              {creating === 'RESUME' ? 'Creating...' : '+ New AI Resume'}
            </button>
            <button
              onClick={handleCreateCoverLetter}
              disabled={creating !== null}
              className="bg-gray-800/90 hover:bg-gray-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-medium transition-all text-sm border border-gray-700 flex items-center justify-center gap-2"
            >
              {creating === 'COVER_LETTER' ? 'Creating...' : '+ New Cover Letter'}
            </button>
          </div>
        </div>

        {/* Section 1: AI Portfolios & Dev Cards (Phase 8) */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>📁</span> Developer Portfolios & Cards
              </h3>
              <span className="text-xs bg-purple-950 text-purple-300 border border-purple-800 px-2.5 py-0.5 rounded-full font-semibold">
                Phase 8
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded-md">{portfolios.length} Docs</span>
              <button
                onClick={() => setShowPortfolioModal(true)}
                className="text-xs bg-purple-900/40 hover:bg-purple-900/70 text-purple-300 border border-purple-800 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5"
              >
                + New Document
              </button>
            </div>
          </div>

          {portfolios.length === 0 ? (
            <div className="bg-gray-900/80 border border-gray-800 border-dashed rounded-2xl p-10 text-center">
              <div className="flex justify-center gap-4 mb-4 text-3xl">
                <span>👨‍💻</span>
                <span>🏆</span>
                <span>📊</span>
              </div>
              <h4 className="text-white font-semibold mb-1">Create Your First AI Portfolio or Dev Card</h4>
              <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
                Automatically synthesize your GitHub repositories, star ratings, and LeetCode problem stats into a sleek, sharable web page and downloadable PDF card.
              </p>
              <button
                onClick={() => setShowPortfolioModal(true)}
                className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-lg shadow-purple-900/30"
              >
                ✨ Create Portfolio Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {portfolios.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Resumes */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>📄</span> My Resumes
            </h3>
            <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded-md">{resumes.length} Docs</span>
          </div>
          {resumes.length === 0 ? (
            <div className="bg-gray-900/60 border border-gray-800 border-dashed rounded-xl p-8 text-center">
              <span className="text-3xl mb-2 block">📄</span>
              <p className="text-gray-400 text-sm">No resumes created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {resumes.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Cover Letters */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <span>✉️</span> Cover Letters
            </h3>
            <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded-md">{coverLetters.length} Docs</span>
          </div>
          {coverLetters.length === 0 ? (
            <div className="bg-gray-900/60 border border-gray-800 border-dashed rounded-xl p-8 text-center">
              <span className="text-3xl mb-2 block">✉️</span>
              <p className="text-gray-400 text-sm">No cover letters created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {coverLetters.map((doc) => (
                <DocumentCard key={doc.id} doc={doc} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Creation Modal for Portfolios */}
      {showPortfolioModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span>📁</span> New Portfolio Document
              </h3>
              <button
                onClick={() => setShowPortfolioModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  value={newPortfolioTitle}
                  onChange={(e) => setNewPortfolioTitle(e.target.value)}
                  placeholder="e.g. Full-Stack Dev Card"
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Document Format
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      newPortfolioType === 'DEV_CARD'
                        ? 'bg-purple-950/40 border-purple-500 text-white'
                        : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="portfolioType"
                      value="DEV_CARD"
                      checked={newPortfolioType === 'DEV_CARD'}
                      onChange={() => setNewPortfolioType('DEV_CARD')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-sm flex items-center gap-1.5">
                        <span>🪪</span> 1-Page Developer Card
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Compact, punchy summary of your top skills, GitHub stats, and best repos for recruiters.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      newPortfolioType === 'PORTFOLIO_PAGE'
                        ? 'bg-purple-950/40 border-purple-500 text-white'
                        : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="portfolioType"
                      value="PORTFOLIO_PAGE"
                      checked={newPortfolioType === 'PORTFOLIO_PAGE'}
                      onChange={() => setNewPortfolioType('PORTFOLIO_PAGE')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-sm flex items-center gap-1.5">
                        <span>🌐</span> Full Interactive Portfolio
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Complete developer site with multi-section project showcase, categorized skills, and biography.
                      </div>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      newPortfolioType === 'PROJECT_CASE_STUDY'
                        ? 'bg-purple-950/40 border-purple-500 text-white'
                        : 'bg-gray-950 border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="portfolioType"
                      value="PROJECT_CASE_STUDY"
                      checked={newPortfolioType === 'PROJECT_CASE_STUDY'}
                      onChange={() => setNewPortfolioType('PROJECT_CASE_STUDY')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium text-sm flex items-center gap-1.5">
                        <span>📊</span> Project Case Study
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Deep-dive technical showcase focusing on architecture, engineering tradeoffs, and impact metrics.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowPortfolioModal(false)}
                className="text-xs text-gray-400 hover:text-white px-4 py-2 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreatePortfolio}
                disabled={creating === 'PORTFOLIO'}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-all shadow-lg shadow-purple-900/30"
              >
                {creating === 'PORTFOLIO' ? 'Creating...' : 'Create Portfolio'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
