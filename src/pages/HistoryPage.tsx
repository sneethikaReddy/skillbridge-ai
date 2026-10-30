import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ResumeRecord, JobMatchAnalysis, LearningRoadmap } from '../types';
import {
  Clock,
  FileText,
  Target,
  Compass,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight,
  Search,
  Calendar,
  CheckCircle2,
  Save,
  X,
} from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const HistoryPage: React.FC = () => {
  const { addToast, setActiveTab } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'analyses' | 'roadmaps' | 'resumes'>('analyses');
  const [analyses, setAnalyses] = useState<JobMatchAnalysis[]>([]);
  const [roadmaps, setRoadmaps] = useState<LearningRoadmap[]>([]);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Rename states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCompany, setEditCompany] = useState('');

  // Delete modal states
  const [deleteItem, setDeleteItem] = useState<{
    id: string;
    type: 'analysis' | 'roadmap' | 'resume';
    title: string;
  } | null>(null);

  const fetchHistory = async () => {
    try {
      const [resumesRes, analysesRes, roadmapsRes] = await Promise.all([
        api.getResumes(),
        api.getAnalyses(),
        api.getRoadmaps(),
      ]);
      setResumes(resumesRes.resumes);
      setAnalyses(analysesRes.analyses);
      setRoadmaps(roadmapsRes.roadmaps);
    } catch (err: any) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleStartRename = (id: string, title: string, company?: string) => {
    setEditingId(id);
    setEditTitle(title);
    setEditCompany(company || '');
  };

  const handleSaveRename = async () => {
    if (!editingId || !editTitle.trim()) return;

    try {
      if (activeSubTab === 'analyses') {
        const res = await api.updateAnalysis(editingId, editTitle, editCompany);
        setAnalyses((prev) => prev.map((a) => (a.id === editingId ? res.analysis : a)));
        addToast('Analysis record renamed', 'success');
      } else if (activeSubTab === 'roadmaps') {
        const res = await api.updateRoadmapTitle(editingId, editTitle);
        setRoadmaps((prev) => prev.map((r) => (r.id === editingId ? res.roadmap : r)));
        addToast('Roadmap renamed', 'success');
      } else if (activeSubTab === 'resumes') {
        const res = await api.updateResume(editingId, { title: editTitle });
        setResumes((prev) => prev.map((r) => (r.id === editingId ? res.resume : r)));
        addToast('Resume title updated', 'success');
      }
      setEditingId(null);
    } catch (err: any) {
      addToast(err.message || 'Failed to rename record', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;

    try {
      if (deleteItem.type === 'analysis') {
        await api.deleteAnalysis(deleteItem.id);
        setAnalyses((prev) => prev.filter((a) => a.id !== deleteItem.id));
        addToast('Job match analysis removed from history', 'info');
      } else if (deleteItem.type === 'roadmap') {
        await api.deleteRoadmap(deleteItem.id);
        setRoadmaps((prev) => prev.filter((r) => r.id !== deleteItem.id));
        addToast('Learning roadmap deleted', 'info');
      } else if (deleteItem.type === 'resume') {
        await api.deleteResume(deleteItem.id);
        setResumes((prev) => prev.filter((r) => r.id !== deleteItem.id));
        addToast('Resume record deleted', 'info');
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to delete record', 'error');
    } finally {
      setDeleteItem(null);
    }
  };

  // Filtered lists
  const filteredAnalyses = (analyses || []).filter((a) => {
    if (!a || !a.id) return false;
    const q = searchQuery.toLowerCase();
    return (
      (a.internshipTitle || '').toLowerCase().includes(q) ||
      (a.companyName && a.companyName.toLowerCase().includes(q)) ||
      (a.domain || '').toLowerCase().includes(q)
    );
  });

  const filteredRoadmaps = (roadmaps || []).filter((r) => {
    if (!r || !r.id) return false;
    const q = searchQuery.toLowerCase();
    return (
      (r.title || '').toLowerCase().includes(q) ||
      (r.internshipTitle || '').toLowerCase().includes(q) ||
      (r.companyName && r.companyName.toLowerCase().includes(q))
    );
  });

  const filteredResumes = (resumes || []).filter((r) => {
    if (!r || !r.id) return false;
    const q = searchQuery.toLowerCase();
    return (
      (r.title || '').toLowerCase().includes(q) ||
      (r.extractedData?.fullName && r.extractedData.fullName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Saved Records & Analysis History
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Reopen, manage, rename, or continue working with your saved internship reports and learning roadmaps.
          </p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Subtabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('analyses')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'analyses'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Job Analyses ({analyses.length})
          </button>
          <button
            onClick={() => setActiveSubTab('roadmaps')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'roadmaps'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Roadmaps ({roadmaps.length})
          </button>
          <button
            onClick={() => setActiveSubTab('resumes')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeSubTab === 'resumes'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Resumes ({resumes.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tab 1: Job Match Analyses List */}
      {activeSubTab === 'analyses' && (
        <div className="space-y-3">
          {filteredAnalyses.length > 0 ? (
            filteredAnalyses.map((analysis) => {
              const isRenaming = editingId === analysis.id;
              const scoreBadge =
                analysis.overallMatchScore >= 75
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : analysis.overallMatchScore >= 50
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200';

              return (
                <div
                  key={analysis.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    {isRenaming ? (
                      <div className="flex flex-col sm:flex-row gap-2 max-w-lg mb-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Internship Title"
                          className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg flex-1"
                        />
                        <input
                          type="text"
                          value={editCompany}
                          onChange={(e) => setEditCompany(e.target.value)}
                          placeholder="Company"
                          className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg w-32"
                        />
                        <button
                          onClick={handleSaveRename}
                          className="px-2.5 py-1 bg-indigo-600 text-white text-xs rounded-lg"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {analysis.internshipTitle}
                        </h3>
                        {analysis.companyName && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded">
                            {analysis.companyName}
                          </span>
                        )}
                        <button
                          onClick={() =>
                            handleStartRename(analysis.id, analysis.internshipTitle, analysis.companyName)
                          }
                          className="text-slate-400 hover:text-slate-600 p-1"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span>Track: {analysis.domain}</span>
                      <span>•</span>
                      <span>Resume: {analysis.resumeTitle}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(analysis.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2 text-xs">
                      <span className="text-emerald-700 font-semibold">
                        {analysis.matchingSkills.length} matches
                      </span>
                      <span>•</span>
                      <span className="text-rose-600 font-semibold">
                        {analysis.missingRequiredSkills.length} required gaps
                      </span>
                    </div>
                  </div>

                  {/* Actions & Score */}
                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-black border ${scoreBadge}`}>
                      {analysis.overallMatchScore}% Match
                    </span>

                    <button
                      onClick={() => setActiveTab('job-match', { analysisId: analysis.id })}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Report</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        setDeleteItem({
                          id: analysis.id,
                          type: 'analysis',
                          title: analysis.internshipTitle,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 text-slate-500">
              <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Job Analyses Found</p>
              <p className="text-xs text-slate-400 mt-1">
                Evaluate an internship role to save your first skill-gap analysis.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Roadmaps List */}
      {activeSubTab === 'roadmaps' && (
        <div className="space-y-3">
          {filteredRoadmaps.length > 0 ? (
            filteredRoadmaps.map((roadmap) => {
              const isRenaming = editingId === roadmap.id;
              const total = roadmap.tasks.length;
              const done = roadmap.tasks.filter((t) => t.status === 'completed').length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;

              return (
                <div
                  key={roadmap.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    {isRenaming ? (
                      <div className="flex gap-2 max-w-md mb-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg flex-1"
                        />
                        <button
                          onClick={handleSaveRename}
                          className="px-2.5 py-1 bg-indigo-600 text-white text-xs rounded-lg"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 truncate">{roadmap.title}</h3>
                        <button
                          onClick={() => handleStartRename(roadmap.id, roadmap.title)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{roadmap.summary}</p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{roadmap.targetCompletionWeeks} Weeks</span>
                      <span>•</span>
                      <span>
                        {done} of {total} milestones completed ({pct}%)
                      </span>
                      <span>•</span>
                      <span>Updated {new Date(roadmap.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => setActiveTab('roadmap', { roadmapId: roadmap.id })}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Continue Plan</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() =>
                        setDeleteItem({
                          id: roadmap.id,
                          type: 'roadmap',
                          title: roadmap.title,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete roadmap"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 text-slate-500">
              <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Roadmaps Saved</p>
              <p className="text-xs text-slate-400 mt-1">Generate a roadmap to track your skills.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Resumes List */}
      {activeSubTab === 'resumes' && (
        <div className="space-y-3">
          {filteredResumes.length > 0 ? (
            filteredResumes.map((resume) => {
              const isRenaming = editingId === resume.id;

              return (
                <div
                  key={resume.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    {isRenaming ? (
                      <div className="flex gap-2 max-w-md mb-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg flex-1"
                        />
                        <button
                          onClick={handleSaveRename}
                          className="px-2.5 py-1 bg-indigo-600 text-white text-xs rounded-lg"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-sm font-bold text-slate-900 truncate">{resume.title}</h3>
                        <button
                          onClick={() => handleStartRename(resume.id, resume.title)}
                          className="text-slate-400 hover:text-slate-600 p-1"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                      <span>Candidate: {resume.extractedData.fullName || 'Student'}</span>
                      <span>•</span>
                      <span>{resume.extractedData.technicalSkills.languages.length} Languages</span>
                      <span>•</span>
                      <span>{resume.extractedData.projects.length} Projects</span>
                      <span>•</span>
                      <span>Uploaded {new Date(resume.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <button
                      onClick={() => setActiveTab('resume')}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition"
                    >
                      View & Edit
                    </button>

                    <button
                      onClick={() =>
                        setDeleteItem({
                          id: resume.id,
                          type: 'resume',
                          title: resume.title,
                        })
                      }
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Delete resume"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 text-slate-500">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No Resumes Uploaded</p>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteItem}
        title={`Delete ${deleteItem?.type || 'Record'}`}
        message={`Are you sure you want to permanently delete "${deleteItem?.title}"? This action cannot be undone.`}
        confirmLabel="Confirm Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
};
