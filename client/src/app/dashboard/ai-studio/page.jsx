'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AiStudioPage() {
  const user = useUser();
  // All features enabled — premium gating hidden
  const isPro = true; // was: ['PRO', 'AGENCY', 'ENTERPRISE'].includes(user?.plan ?? '');

  const [resumes, setResumes] = useState([]);
  const [coverLetters, setCoverLetters] = useState([]);
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(null);

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
      setPortfolios(portRes.data.map((d) => ({ ...d, type: 'PORTFOLIO' })));
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

  const handleDelete = async (type, id) => {
    if (!confirm(`Delete this ${type.replace('_', ' ').toLowerCase()}?`)) return;
    try {
      const endpoint = type === 'RESUME' ? '/resume' : type === 'COVER_LETTER' ? '/cover-letter' : '/portfolio-doc';
      await api.delete(`${endpoint}/${id}`);
      toast.success('Deleted successfully');
      loadData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const DocumentCard = ({ doc }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-indigo-700/50 transition-colors group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">
              {doc.type === 'RESUME' ? '📄' : doc.type === 'COVER_LETTER' ? '✉️' : '📁'}
            </span>
            <h3 className="font-semibold text-white truncate max-w-[200px]">{doc.title}</h3>
          </div>
          <div className="text-xs text-gray-500">
            Updated {new Date(doc.updatedAt).toLocaleDateString()}
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
      </div>

      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => handleDelete(doc.type, doc.id)}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            🗑️ Delete
          </button>
        </div>
        <Link
          href={`/dashboard/ai-studio/${doc.type.toLowerCase().replace('_', '-')}/${doc.id}`}
          className="text-xs bg-gray-800 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg transition-colors font-medium border border-gray-700 hover:border-indigo-500"
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
    <div className="min-h-screen bg-gray-950 pb-20">
      <div className="h-16 border-b border-gray-800 flex items-center px-8 justify-between">
        <h1 className="text-lg font-semibold text-white">AI Document Studio</h1>
        {/* FREE PLAN LIMIT BADGE — temporarily hidden
        {!isPro && (
          <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-700 px-3 py-1.5 rounded-full font-medium">
            ⭐ Free Plan: 1 Resume & 1 Cover Letter limit
          </span>
        )}
        */}
      </div>

      <div className="p-8 max-w-6xl">
        {/* Header CTA */}
        <div className="bg-gradient-to-br from-indigo-950/50 to-purple-950/30 border border-indigo-800/50 rounded-2xl p-8 mb-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Create professional documents with AI</h2>
            <p className="text-gray-400 text-sm max-w-lg">
              Auto-fill your resume from GitHub & LeetCode, generate tailored cover letters for specific job descriptions, and export beautiful PDFs.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={handleCreateResume}
              disabled={creating !== null}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm shadow-lg shadow-indigo-900/20"
            >
              {creating === 'RESUME' ? 'Creating...' : '+ New AI Resume'}
            </button>
            <button
              onClick={handleCreateCoverLetter}
              disabled={creating !== null}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm border border-gray-700"
            >
              {creating === 'COVER_LETTER' ? 'Creating...' : '+ New Cover Letter'}
            </button>
          </div>
        </div>

        {/* Resumes */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">My Resumes</h3>
            <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded-md">{resumes.length} Docs</span>
          </div>
          {resumes.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-8 text-center">
              <span className="text-3xl mb-2 block">📄</span>
              <p className="text-gray-400 text-sm">No resumes created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resumes.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
            </div>
          )}
        </div>

        {/* Cover Letters */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Cover Letters</h3>
            <span className="text-xs text-gray-500 bg-gray-900 px-2 py-1 rounded-md">{coverLetters.length} Docs</span>
          </div>
          {coverLetters.length === 0 ? (
            <div className="bg-gray-900 border border-gray-800 border-dashed rounded-xl p-8 text-center">
              <span className="text-3xl mb-2 block">✉️</span>
              <p className="text-gray-400 text-sm">No cover letters created yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coverLetters.map(doc => <DocumentCard key={doc.id} doc={doc} />)}
            </div>
          )}
        </div>

        {/* Portfolios (Phase 8) */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white">Portfolio PDFs</h3>
              <span className="text-[10px] bg-purple-900/50 text-purple-400 border border-purple-800 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">Coming Soon</span>
            </div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <div className="flex justify-center gap-4 mb-4 opacity-50">
              <span className="text-4xl">👨‍💻</span>
              <span className="text-4xl">🏆</span>
              <span className="text-4xl">📊</span>
            </div>
            <h4 className="text-white font-medium mb-1">Developer Cards & Case Studies</h4>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Generate 1-page visually stunning PDF cards combining your GitHub, LeetCode, and personal bio to share with recruiters instantly.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
