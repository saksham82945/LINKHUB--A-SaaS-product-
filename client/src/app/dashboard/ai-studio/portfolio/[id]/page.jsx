'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function PortfolioEditorPage({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [doc, setDoc] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [previewMode, setPreviewMode] = useState('desktop'); // desktop | mobile

  // Local helper for adding skills
  const [newSkillText, setNewSkillText] = useState('');
  const [selectedCategoryIdx, setSelectedCategoryIdx] = useState(0);

  useEffect(() => {
    loadDoc();
  }, [id]);

  const loadDoc = async () => {
    try {
      const res = await api.get(`/portfolio-doc/${id}`);
      setDoc(res.data);
      let parsed = res.data.content;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          parsed = {};
        }
      }
      setContent(parsed || {});
    } catch {
      toast.error('Portfolio document not found');
      router.push('/dashboard/ai-studio');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/portfolio-doc/${id}`, {
        title: doc.title,
        type: doc.type,
        content: content,
      });
      toast.success('Saved changes!');
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAiAutoFill = async () => {
    setAiLoading(true);
    try {
      toast.loading('AI synthesizing from your GitHub & profile...', { id: 'ai-gen' });
      const res = await api.post(`/portfolio-doc/${id}/ai-generate`);
      setDoc(res.data);
      let parsed = res.data.content;
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {}
      }
      setContent(parsed);
      toast.success('Generated portfolio with AI!', { id: 'ai-gen' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'AI generation failed', { id: 'ai-gen' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      let slug = doc.shareSlug;
      if (!slug) {
        const res = await api.post(`/portfolio-doc/${id}/share`);
        slug = res.data.shareSlug;
        setDoc((prev) => ({ ...prev, shareSlug: slug }));
      }
      const fullUrl = `${window.location.origin}/p/${slug}`;
      await navigator.clipboard.writeText(fullUrl);
      toast.success('Public portfolio link copied!');
    } catch {
      toast.error('Failed to generate public share link');
    }
  };

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    try {
      toast.loading('Rendering high-fidelity PDF...', { id: 'pdf-toast' });
      const res = await api.get(`/portfolio-doc/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title || 'portfolio'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('PDF downloaded!', { id: 'pdf-toast' });
    } catch {
      toast.error('Failed to download PDF', { id: 'pdf-toast' });
    } finally {
      setExportingPdf(false);
    }
  };

  // Content mutation helpers
  const updateField = (key, val) => {
    setContent((prev) => ({ ...prev, [key]: val }));
  };

  const addSkillToCategory = (catIndex) => {
    if (!newSkillText.trim()) return;
    setContent((prev) => {
      const skills = [...(prev.skills || [])];
      if (!skills[catIndex]) return prev;
      const items = [...(skills[catIndex].items || [])];
      if (!items.includes(newSkillText.trim())) {
        items.push(newSkillText.trim());
      }
      skills[catIndex] = { ...skills[catIndex], items };
      return { ...prev, skills };
    });
    setNewSkillText('');
  };

  const removeSkillFromCategory = (catIndex, skillItem) => {
    setContent((prev) => {
      const skills = [...(prev.skills || [])];
      if (!skills[catIndex]) return prev;
      skills[catIndex] = {
        ...skills[catIndex],
        items: (skills[catIndex].items || []).filter((s) => s !== skillItem),
      };
      return { ...prev, skills };
    });
  };

  const addCategory = () => {
    const name = prompt('Enter category name (e.g., Mobile, Machine Learning):');
    if (!name) return;
    setContent((prev) => ({
      ...prev,
      skills: [...(prev.skills || []), { category: name.trim(), items: [] }],
    }));
  };

  const addProject = () => {
    const newProj = {
      title: 'New Project',
      description: 'Describe the core challenge solved, metrics achieved, and architecture.',
      tags: ['React', 'TypeScript', 'Node.js'],
      demoUrl: '',
      githubUrl: '',
      featured: true,
    };
    setContent((prev) => ({
      ...prev,
      projects: [newProj, ...(prev.projects || [])],
    }));
    setActiveTab('projects');
  };

  const updateProject = (idx, field, val) => {
    setContent((prev) => {
      const projects = [...(prev.projects || [])];
      projects[idx] = { ...projects[idx], [field]: val };
      return { ...prev, projects };
    });
  };

  const removeProject = (idx) => {
    if (!confirm('Remove this project from your portfolio?')) return;
    setContent((prev) => ({
      ...prev,
      projects: (prev.projects || []).filter((_, i) => i !== idx),
    }));
  };

  const addStat = () => {
    setContent((prev) => ({
      ...prev,
      stats: [...(prev.stats || []), { label: 'New Metric', value: '10+' }],
    }));
  };

  const updateStat = (idx, field, val) => {
    setContent((prev) => {
      const stats = [...(prev.stats || [])];
      stats[idx] = { ...stats[idx], [field]: val };
      return { ...prev, stats };
    });
  };

  const removeStat = (idx) => {
    setContent((prev) => ({
      ...prev,
      stats: (prev.stats || []).filter((_, i) => i !== idx),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-gray-400">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Portfolio Studio...</span>
        </div>
      </div>
    );
  }

  if (!doc || !content) return null;

  const accentColor = content.accentColor || '#6366f1';
  const theme = content.theme || 'dark-glass';

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Topbar */}
      <header className="h-16 border-b border-gray-800 bg-gray-900/90 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/ai-studio"
            className="text-xs text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium"
          >
            ← Studio
          </Link>
          <div className="flex items-center gap-2">
            <input
              value={doc.title}
              onChange={(e) => setDoc({ ...doc, title: e.target.value })}
              className="bg-transparent border border-transparent hover:border-gray-700 focus:border-purple-500 rounded-lg px-2.5 py-1 text-white font-semibold text-sm focus:outline-none transition-colors"
              title="Click to edit document title"
            />
            <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-full font-semibold uppercase">
              {doc.type === 'DEV_CARD' ? 'Dev Card' : doc.type === 'PROJECT_CASE_STUDY' ? 'Case Study' : 'Portfolio'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleAiAutoFill}
            disabled={aiLoading || saving}
            className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg transition-all font-medium flex items-center gap-1.5 shadow-md shadow-purple-950/40"
          >
            {aiLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>AI Auto-Fill</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5"
            title="Generate or copy shareable link"
          >
            <span>🔗</span>
            <span>Share Link</span>
          </button>

          {doc.shareSlug && (
            <Link
              href={`/p/${doc.shareSlug}`}
              target="_blank"
              className="text-xs text-indigo-400 hover:text-indigo-300 px-2 py-1 transition-colors flex items-center gap-1 font-medium"
            >
              <span>↗</span> View Public
            </Link>
          )}

          <button
            onClick={handleDownloadPdf}
            disabled={exportingPdf}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5"
            title="Download PDF"
          >
            <span>📥</span>
            <span>{exportingPdf ? 'Exporting...' : 'PDF'}</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg transition-colors font-semibold shadow-md shadow-indigo-950/30"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Main Workspace: Split View */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Editor Tabs & Form Controls */}
        <div className="w-full lg:w-1/2 border-r border-gray-800 flex flex-col bg-gray-950 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {/* Editor Tab Navigation */}
          <div className="flex items-center gap-1 px-4 pt-3 border-b border-gray-800/80 bg-gray-900/50 sticky top-0 z-10 backdrop-blur-md overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`text-xs px-3.5 py-2 rounded-t-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'bg-gray-950 text-white border-t-2 border-purple-500 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              👤 Profile & Bio
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`text-xs px-3.5 py-2 rounded-t-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'skills'
                  ? 'bg-gray-950 text-white border-t-2 border-purple-500 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              ⚡ Skills & Stack
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`text-xs px-3.5 py-2 rounded-t-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'projects'
                  ? 'bg-gray-950 text-white border-t-2 border-purple-500 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              🚀 Projects ({(content.projects || []).length})
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`text-xs px-3.5 py-2 rounded-t-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'stats'
                  ? 'bg-gray-950 text-white border-t-2 border-purple-500 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              📈 Stats & Socials
            </button>
            <button
              onClick={() => setActiveTab('theme')}
              className={`text-xs px-3.5 py-2 rounded-t-lg font-medium transition-all whitespace-nowrap ${
                activeTab === 'theme'
                  ? 'bg-gray-950 text-white border-t-2 border-purple-500 font-semibold'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              🎨 Style & Themes
            </button>
          </div>

          {/* Tab 1: Profile & Bio */}
          {activeTab === 'profile' && (
            <div className="p-6 space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={content.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Headline / Professional Role
                </label>
                <input
                  type="text"
                  value={content.headline || ''}
                  onChange={(e) => updateField('headline', e.target.value)}
                  placeholder="e.g. Senior Full-Stack Engineer & Open Source Creator"
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Location
                  </label>
                  <input
                    type="text"
                    value={content.location || ''}
                    onChange={(e) => updateField('location', e.target.value)}
                    placeholder="e.g. San Francisco / Remote"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Availability / Status
                  </label>
                  <input
                    type="text"
                    value={content.status || ''}
                    onChange={(e) => updateField('status', e.target.value)}
                    placeholder="e.g. Open to high-impact roles"
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Elevator Pitch / Developer Story
                  </label>
                  <span className="text-[10px] text-gray-500">Recruiter pitch & personal bio</span>
                </div>
                <textarea
                  rows={4}
                  value={content.bio || ''}
                  onChange={(e) => updateField('bio', e.target.value)}
                  placeholder="2-3 compelling sentences describing your experience, favorite technologies, and architectural focus..."
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Skills & Stack */}
          {activeTab === 'skills' && (
            <div className="p-6 space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Skill Matrices & Categories</h4>
                  <p className="text-xs text-gray-400">Organize technologies into neat categorized pills</p>
                </div>
                <button
                  onClick={addCategory}
                  className="text-xs bg-gray-800 hover:bg-gray-700 text-purple-300 border border-purple-900/50 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  + Add Category
                </button>
              </div>

              {/* Add Skill Quick Form */}
              <div className="bg-gray-900/70 border border-gray-800 rounded-xl p-3.5 flex gap-2">
                <select
                  value={selectedCategoryIdx}
                  onChange={(e) => setSelectedCategoryIdx(Number(e.target.value))}
                  className="bg-gray-950 border border-gray-800 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none"
                >
                  {(content.skills || []).map((cat, i) => (
                    <option key={i} value={i}>
                      {cat.category || `Category ${i + 1}`}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newSkillText}
                  onChange={(e) => setNewSkillText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkillToCategory(selectedCategoryIdx);
                    }
                  }}
                  placeholder="Type skill & press Enter (e.g. Next.js)..."
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                />
                <button
                  onClick={() => addSkillToCategory(selectedCategoryIdx)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="space-y-4">
                {(content.skills || []).map((cat, catIdx) => (
                  <div key={catIdx} className="bg-gray-900/40 border border-gray-800/80 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <input
                        value={cat.category || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setContent((prev) => {
                            const skills = [...prev.skills];
                            skills[catIdx] = { ...skills[catIdx], category: val };
                            return { ...prev, skills };
                          });
                        }}
                        className="bg-transparent text-xs font-bold text-gray-300 uppercase tracking-wider focus:outline-none focus:border-b border-purple-500"
                      />
                      <button
                        onClick={() => {
                          setContent((prev) => ({
                            ...prev,
                            skills: prev.skills.filter((_, i) => i !== catIdx),
                          }));
                        }}
                        className="text-[10px] text-gray-500 hover:text-red-400"
                      >
                        Remove Category
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(cat.items || []).map((item, itemIdx) => (
                        <span
                          key={itemIdx}
                          className="inline-flex items-center gap-1.5 bg-gray-800 text-gray-200 border border-gray-700/70 text-xs px-2.5 py-1 rounded-lg"
                        >
                          <span>{item}</span>
                          <button
                            onClick={() => removeSkillFromCategory(catIdx, item)}
                            className="text-gray-400 hover:text-red-400 font-bold text-[11px]"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Projects */}
          {activeTab === 'projects' && (
            <div className="p-6 space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">Highlighted Projects</h4>
                  <p className="text-xs text-gray-400">Showcase your best applications, repos, and systems</p>
                </div>
                <button
                  onClick={addProject}
                  className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-3.5 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1"
                >
                  + Add Project
                </button>
              </div>

              <div className="space-y-4">
                {(content.projects || []).map((proj, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={proj.title || ''}
                        onChange={(e) => updateProject(idx, 'title', e.target.value)}
                        placeholder="Project Title"
                        className="bg-transparent font-bold text-white text-sm focus:outline-none focus:border-b border-purple-500 w-2/3"
                      />
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 text-[11px] text-gray-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={proj.featured || false}
                            onChange={(e) => updateProject(idx, 'featured', e.target.checked)}
                          />
                          <span>Featured</span>
                        </label>
                        <button
                          onClick={() => removeProject(idx)}
                          className="text-xs text-gray-500 hover:text-red-400 transition-colors ml-2"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={proj.description || ''}
                      onChange={(e) => updateProject(idx, 'description', e.target.value)}
                      placeholder="Project impact, architecture, and problem solved..."
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-purple-500"
                    />

                    <div>
                      <label className="block text-[11px] text-gray-500 mb-1">
                        Tech Stack Tags (comma separated)
                      </label>
                      <input
                        type="text"
                        value={(proj.tags || []).join(', ')}
                        onChange={(e) => {
                          const splitTags = e.target.value
                            .split(',')
                            .map((t) => t.trim())
                            .filter(Boolean);
                          updateProject(idx, 'tags', splitTags);
                        }}
                        placeholder="Next.js, TypeScript, PostgreSQL, Redis"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={proj.demoUrl || ''}
                        onChange={(e) => updateProject(idx, 'demoUrl', e.target.value)}
                        placeholder="Live Demo URL"
                        className="bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-purple-500"
                      />
                      <input
                        type="text"
                        value={proj.githubUrl || ''}
                        onChange={(e) => updateProject(idx, 'githubUrl', e.target.value)}
                        placeholder="GitHub Repo URL"
                        className="bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Stats & Socials */}
          {activeTab === 'stats' && (
            <div className="p-6 space-y-6 animate-in fade-in duration-150">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-white">Metric & Achievement Counters</h4>
                  <button
                    onClick={addStat}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                  >
                    + Add Stat
                  </button>
                </div>
                <div className="space-y-2">
                  {(content.stats || []).map((st, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={st.value || ''}
                        onChange={(e) => updateStat(i, 'value', e.target.value)}
                        placeholder="e.g. 25+"
                        className="w-24 bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold text-center focus:outline-none focus:border-purple-500"
                      />
                      <input
                        type="text"
                        value={st.label || ''}
                        onChange={(e) => updateStat(i, 'label', e.target.value)}
                        placeholder="Metric label (e.g. GitHub Repos)"
                        className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => removeStat(i)}
                        className="text-xs text-gray-500 hover:text-red-400 px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800">
                <h4 className="text-sm font-semibold text-white mb-3">Developer Socials & Links</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">GitHub Profile</label>
                    <input
                      type="text"
                      value={content.socials?.github || ''}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          socials: { ...(prev.socials || {}), github: e.target.value },
                        }))
                      }
                      placeholder="https://github.com/username"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">LinkedIn Profile</label>
                    <input
                      type="text"
                      value={content.socials?.linkedin || ''}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          socials: { ...(prev.socials || {}), linkedin: e.target.value },
                        }))
                      }
                      placeholder="https://linkedin.com/in/username"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Twitter / X</label>
                    <input
                      type="text"
                      value={content.socials?.twitter || ''}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          socials: { ...(prev.socials || {}), twitter: e.target.value },
                        }))
                      }
                      placeholder="https://x.com/username"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Personal Website</label>
                    <input
                      type="text"
                      value={content.socials?.website || ''}
                      onChange={(e) =>
                        setContent((prev) => ({
                          ...prev,
                          socials: { ...(prev.socials || {}), website: e.target.value },
                        }))
                      }
                      placeholder="https://mywebsite.com"
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Style & Themes */}
          {activeTab === 'theme' && (
            <div className="p-6 space-y-6 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Theme Preset
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'dark-glass', name: 'Dark Glassmorphism', desc: 'Sleek frosted glass & neon' },
                    { id: 'cyberpunk', name: 'Cyberpunk Neon', desc: 'High-contrast cyan & emerald' },
                    { id: 'slate', name: 'Slate Executive', desc: 'Clean corporate tech layout' },
                    { id: 'minimal-light', name: 'Minimalist Clean', desc: 'Bright, modern typography' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => updateField('theme', t.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        theme === t.id
                          ? 'border-purple-500 bg-purple-950/30 text-white'
                          : 'border-gray-800 bg-gray-900/60 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div className="font-semibold text-xs text-white">{t.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  {['#6366f1', '#06b6d4', '#10b981', '#a855f7', '#f43f5e', '#eab308'].map((c) => (
                    <button
                      key={c}
                      onClick={() => updateField('accentColor', c)}
                      className={`w-7 h-7 rounded-full transition-transform ${
                        accentColor === c ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => updateField('accentColor', e.target.value)}
                    className="w-7 h-7 rounded-full bg-transparent cursor-pointer border-0"
                    title="Custom color picker"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Interactive Preview */}
        <div className="w-full lg:w-1/2 bg-gray-900/40 p-6 flex flex-col items-center justify-start overflow-y-auto max-h-[calc(100vh-4rem)]">
          {/* Viewport bar */}
          <div className="w-full max-w-xl flex items-center justify-between mb-4 pb-2 border-b border-gray-800/80">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Live Recruiter Preview
              </span>
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </div>
            <div className="flex items-center bg-gray-950 border border-gray-800 rounded-lg p-0.5">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                  previewMode === 'desktop' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                💻 Desktop
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`text-[11px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                  previewMode === 'mobile' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                📱 Mobile
              </button>
            </div>
          </div>

          {/* Render Preview Container */}
          <div
            className={`w-full transition-all duration-300 ${
              previewMode === 'mobile' ? 'max-w-sm shadow-2xl' : 'max-w-xl'
            }`}
          >
            <div
              className={`rounded-2xl border p-6 transition-all ${
                theme === 'minimal-light'
                  ? 'bg-slate-50 text-slate-900 border-slate-200'
                  : theme === 'cyberpunk'
                  ? 'bg-slate-950 text-slate-100 border-cyan-900/50 shadow-cyan-950/20'
                  : theme === 'slate'
                  ? 'bg-slate-900 text-slate-100 border-slate-800'
                  : 'bg-gray-950/90 text-white border-gray-800 backdrop-blur-xl shadow-2xl'
              }`}
            >
              {/* Header Hero */}
              <div className="flex items-start justify-between border-b pb-5 mb-5 border-gray-800/80">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    {content.name || 'Your Name'}
                  </h2>
                  <div
                    className="text-xs font-semibold mt-1"
                    style={{ color: accentColor }}
                  >
                    {content.headline || 'Software Engineer & Builder'}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-2">
                    <span>📍 {content.location || 'Remote'}</span>
                  </div>
                </div>

                {content.status && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {content.status}
                  </span>
                )}
              </div>

              {/* Bio Pitch */}
              {content.bio && (
                <div className="mb-6">
                  <p className="text-xs text-gray-300 leading-relaxed font-normal">
                    {content.bio}
                  </p>
                </div>
              )}

              {/* Stats Grid */}
              {(content.stats || []).length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {content.stats.map((st, i) => (
                    <div
                      key={i}
                      className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-2.5 text-center"
                    >
                      <div className="text-sm font-bold text-white">{st.value}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5 truncate">{st.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Skills Section */}
              {(content.skills || []).length > 0 && (
                <div className="mb-6 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 border-l-2 pl-2" style={{ borderColor: accentColor }}>
                    Technical Expertise
                  </div>
                  {content.skills.map((cat, i) => (
                    <div key={i} className="space-y-1">
                      <div className="text-[10px] text-gray-400 font-medium">{cat.category}</div>
                      <div className="flex flex-wrap gap-1">
                        {(cat.items || []).map((item, j) => (
                          <span
                            key={j}
                            className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-gray-900 text-gray-200 border border-gray-800"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Projects Section */}
              {(content.projects || []).length > 0 && (
                <div className="mb-6 space-y-3">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 border-l-2 pl-2" style={{ borderColor: accentColor }}>
                    Featured Projects
                  </div>
                  <div className="space-y-2.5">
                    {content.projects.map((p, i) => (
                      <div
                        key={i}
                        className="bg-gray-900/70 border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-white">{p.title}</span>
                          <div className="flex items-center gap-2">
                            {p.demoUrl && (
                              <a
                                href={p.demoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-indigo-400 hover:underline"
                              >
                                Live Demo ↗
                              </a>
                            )}
                            {p.githubUrl && (
                              <a
                                href={p.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-gray-400 hover:text-white"
                              >
                                Code
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-snug mb-2">{p.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {(p.tags || []).map((t, ti) => (
                            <span
                              key={ti}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-850"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Socials & Footer */}
              <div className="pt-4 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-gray-500">
                <div className="flex items-center gap-3">
                  {content.socials?.github && (
                    <a
                      href={content.socials.github}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      GitHub
                    </a>
                  )}
                  {content.socials?.linkedin && (
                    <a
                      href={content.socials.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      LinkedIn
                    </a>
                  )}
                  {content.socials?.website && (
                    <a
                      href={content.socials.website}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-white transition-colors"
                    >
                      Website
                    </a>
                  )}
                </div>
                <span className="text-[10px] opacity-60">Powered by LinkHub</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
