'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function CoverLetterEditorPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    loadLetter();
  }, [id]);

  const loadLetter = async () => {
    try {
      const res = await api.get(`/cover-letter/${id}`);
      setLetter(res.data);
    } catch {
      toast.error('Cover letter not found');
      router.push('/dashboard/ai-studio');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/cover-letter/${id}`, {
        title: letter.title,
        content: letter.content,
        companyName: letter.companyName,
        roleName: letter.roleName,
        tone: letter.tone
      });
      toast.success('Saved!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!letter.companyName || !letter.roleName) {
      toast.error('Please enter Company Name and Role before generating');
      return;
    }
    setAiGenerating(true);
    try {
      // First save current state so backend uses latest company/role
      await api.patch(`/cover-letter/${id}`, {
        companyName: letter.companyName,
        roleName: letter.roleName,
        jobDescription: letter.jobDescription,
        tone: letter.tone
      });
      
      const res = await api.post(`/cover-letter/${id}/ai-generate`);
      toast.success('Generated successfully!');
      setLetter({ ...letter, content: res.data.content });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-500">Loading editor...</div>;
  if (!letter) return null;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Topbar */}
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-900 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/ai-studio" className="text-gray-400 hover:text-white transition-colors">
            ← Back
          </Link>
          <input
            value={letter.title}
            onChange={(e) => setLetter({ ...letter, title: e.target.value })}
            className="bg-transparent border-none text-white font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-2"
          />
        </div>
        <div className="flex gap-3">
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
        
        {/* Editor Sidebar - Settings */}
        <div className="w-[400px] bg-gray-900 border-r border-gray-800 p-6 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Target Job Details</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Company Name *</label>
                <input
                  value={letter.companyName || ''}
                  onChange={(e) => setLetter({...letter, companyName: e.target.value})}
                  placeholder="e.g. Google"
                  className="w-full bg-gray-950 border border-gray-800 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Role Name *</label>
                <input
                  value={letter.roleName || ''}
                  onChange={(e) => setLetter({...letter, roleName: e.target.value})}
                  placeholder="e.g. Frontend Engineer"
                  className="w-full bg-gray-950 border border-gray-800 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Job Description</label>
                <textarea
                  value={letter.jobDescription || ''}
                  onChange={(e) => setLetter({...letter, jobDescription: e.target.value})}
                  placeholder="Paste the job description here so AI can match it..."
                  className="w-full bg-gray-950 border border-gray-800 text-sm text-white rounded-lg p-3 min-h-[120px] focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Tone</label>
                <select
                  value={letter.tone || 'PROFESSIONAL'}
                  onChange={(e) => setLetter({...letter, tone: e.target.value})}
                  className="w-full bg-gray-950 border border-gray-800 text-sm text-white rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 appearance-none"
                >
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="FORMAL">Formal</option>
                  <option value="FRIENDLY">Friendly</option>
                  <option value="TECHNICAL">Technical / Direct</option>
                  <option value="ENTHUSIASTIC">Enthusiastic</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-800">
            <button
              onClick={handleAiGenerate}
              disabled={aiGenerating}
              className="w-full text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-3 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
            >
              {aiGenerating ? 'Writing...' : '✨ Generate Full Letter with AI'}
            </button>
          </div>
        </div>

        {/* Live Preview / Editor */}
        <div className="flex-1 bg-gray-950 p-8 flex justify-center">
          <div className="w-[800px] bg-white text-black p-12 shadow-2xl shrink-0 flex flex-col h-full rounded">
            <textarea
              value={letter.content || ''}
              onChange={(e) => setLetter({...letter, content: e.target.value})}
              placeholder="Your cover letter content will appear here..."
              className="w-full flex-1 bg-transparent border-none focus:outline-none resize-none text-[15px] leading-relaxed text-gray-800 font-serif"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
