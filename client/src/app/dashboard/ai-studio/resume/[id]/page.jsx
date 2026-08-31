'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ResumeEditorPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [jobDesc, setJobDesc] = useState('');
  const [showAts, setShowAts] = useState(false);

  useEffect(() => {
    loadResume();
  }, [id]);

  const loadResume = async () => {
    try {
      const res = await api.get(`/resume/${id}`);
      setResume(res.data);
    } catch {
      toast.error('Resume not found');
      router.push('/dashboard/ai-studio');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/resume/${id}`, { content: resume.content, title: resume.title });
      toast.success('Saved!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAutoFill = async () => {
    setAiLoading(true);
    try {
      await api.post(`/resume/${id}/ai-fill`);
      toast.success('Auto-filled from integrations!');
      await loadResume();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Auto-fill failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAtsCheck = async () => {
    if (!jobDesc) {
      toast.error('Please enter a job description first');
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post(`/resume/${id}/ats-check`, { jobDescription: jobDesc });
      toast.success('ATS check complete!');
      setResume({ ...resume, atsScore: res.data.score });
      setShowAts(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'ATS check failed');
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Loading editor...</div>;
  if (!resume) return null;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Topbar */}
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ai-studio" className="text-gray-400 hover:text-white transition-colors">
            ← Back
          </Link>
          <input
            value={resume.title}
            onChange={(e) => setResume({ ...resume, title: e.target.value })}
            className="bg-transparent border-none text-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleAutoFill}
            disabled={aiLoading || saving}
            className="text-sm bg-purple-900/50 hover:bg-purple-900/80 text-purple-300 border border-purple-800 px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
          >
            🤖 Auto-fill Profile Data
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Editor Sidebar */}
        <div className="w-[450px] bg-gray-900 border-r border-gray-800 overflow-y-auto p-6 flex flex-col gap-6">
          
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center justify-between">
              ATS Optimizer
              {resume.atsScore !== null && (
                <span className={`text-xs px-2 py-1 rounded ${resume.atsScore >= 80 ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'}`}>
                  Score: {resume.atsScore}%
                </span>
              )}
            </h3>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste Job Description here to get ATS score and keyword suggestions..."
              className="w-full bg-gray-950 border border-gray-700 rounded-lg p-3 text-xs text-gray-300 h-24 focus:outline-none focus:border-indigo-500 mb-3"
            />
            <button
              onClick={handleAtsCheck}
              disabled={aiLoading}
              className="w-full text-xs bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {aiLoading ? 'Analyzing...' : 'Check ATS Score'}
            </button>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Contact Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                <input
                  value={resume.content.contactInfo.name}
                  onChange={(e) => setResume({...resume, content: {...resume.content, contactInfo: {...resume.content.contactInfo, name: e.target.value}}})}
                  className="w-full bg-gray-950 border border-gray-800 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email</label>
                <input
                  value={resume.content.contactInfo.email}
                  onChange={(e) => setResume({...resume, content: {...resume.content, contactInfo: {...resume.content.contactInfo, email: e.target.value}}})}
                  className="w-full bg-gray-950 border border-gray-800 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">LinkedIn (Optional)</label>
                  <input
                    value={resume.content.contactInfo.linkedin || ''}
                    onChange={(e) => setResume({...resume, content: {...resume.content, contactInfo: {...resume.content.contactInfo, linkedin: e.target.value}}})}
                    className="w-full bg-gray-950 border border-gray-800 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">GitHub (Optional)</label>
                  <input
                    value={resume.content.contactInfo.github || ''}
                    onChange={(e) => setResume({...resume, content: {...resume.content, contactInfo: {...resume.content.contactInfo, github: e.target.value}}})}
                    className="w-full bg-gray-950 border border-gray-800 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Professional Summary</h3>
            <textarea
              value={resume.content.summary || ''}
              onChange={(e) => setResume({...resume, content: {...resume.content, summary: e.target.value}})}
              className="w-full bg-gray-950 border border-gray-800 text-sm text-white rounded-lg p-3 min-h-[100px] focus:outline-none focus:border-indigo-500"
              placeholder="Brief summary of your expertise..."
            />
          </div>
          
          <div className="text-xs text-gray-500 text-center py-4">
            (Projects and Experience JSON editor coming in Phase 12)
          </div>

        </div>

        {/* Live Preview (A4 Paper) */}
        <div className="flex-1 bg-gray-950 p-8 overflow-y-auto flex justify-center">
          <div className="w-[800px] min-h-[1131px] bg-white text-black p-12 shadow-2xl shrink-0">
            {/* Simple basic template render for preview */}
            <div className="text-center mb-6 border-b pb-4">
              <h1 className="text-3xl font-serif font-bold uppercase tracking-wider mb-1">
                {resume.content.contactInfo.name || 'Your Name'}
              </h1>
              <div className="text-sm text-gray-600 flex justify-center gap-4">
                {resume.content.contactInfo.email && <span>{resume.content.contactInfo.email}</span>}
                {resume.content.contactInfo.linkedin && <span>• {resume.content.contactInfo.linkedin}</span>}
                {resume.content.contactInfo.github && <span>• {resume.content.contactInfo.github}</span>}
              </div>
            </div>

            {resume.content.summary && (
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-2 pb-1">Summary</h2>
                <p className="text-sm leading-relaxed text-gray-800">{resume.content.summary}</p>
              </div>
            )}

            {resume.content.projects?.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-2 pb-1">Selected Projects</h2>
                <div className="space-y-3">
                  {resume.content.projects.map((proj, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="font-bold text-sm">{proj.name}</span>
                        {proj.url && <span className="text-xs text-gray-500">{proj.url}</span>}
                      </div>
                      <p className="text-sm text-gray-800">{proj.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {resume.content.competitive && (resume.content.competitive.leetcode || resume.content.competitive.codechef) && (
              <div className="mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 mb-2 pb-1">Competitive Programming</h2>
                <ul className="list-disc pl-5 text-sm space-y-1 text-gray-800">
                  {resume.content.competitive.leetcode && <li><span className="font-medium">LeetCode:</span> {resume.content.competitive.leetcode}</li>}
                  {resume.content.competitive.codechef && <li><span className="font-medium">CodeChef:</span> {resume.content.competitive.codechef}</li>}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
