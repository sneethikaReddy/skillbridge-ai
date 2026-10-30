import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  LearningRoadmap,
  RoadmapTask,
  ResumeRecord,
  CareerRecommendation,
  JobMatchAnalysis,
} from '../types';
import {
  Compass,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  FolderGit2,
  BookOpen,
  Filter,
  Check,
  Calendar,
  AlertCircle,
  FileEdit,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Layers,
  Award,
  ChevronDown,
  X,
  Target,
  FileText,
} from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const RoadmapPage: React.FC = () => {
  const { addToast, setActiveTab, tabMeta } = useAuth();

  const [roadmaps, setRoadmaps] = useState<LearningRoadmap[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<LearningRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'week' | 'priority' | 'all'>('week');
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_started' | 'in_progress' | 'completed'>('all');

  // Generator modal / creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTab, setCreateTab] = useState<'target-job' | 'ai-careers' | 'from-match'>('target-job');

  // Option A state
  const [targetRole, setTargetRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  // Option B state
  const [loadingCareers, setLoadingCareers] = useState(false);
  const [careerRecommendations, setCareerRecommendations] = useState<CareerRecommendation[]>([]);
  const [selectedCareer, setSelectedCareer] = useState<CareerRecommendation | null>(null);

  // Common generation status
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Saved analyses (for Option C)
  const [savedAnalyses, setSavedAnalyses] = useState<JobMatchAnalysis[]>([]);
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>('');

  // User resumes
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);

  // Add task modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSkill, setNewTaskSkill] = useState('');
  const [newTaskWeek, setNewTaskWeek] = useState(1);
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTaskDuration, setNewTaskDuration] = useState('4 hours');
  const [newTaskObjective, setNewTaskObjective] = useState('');
  const [newTaskCriteria, setNewTaskCriteria] = useState('');

  // Regenerate modal
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [preserveCompleted, setPreserveCompleted] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  // Delete modal
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [deleteRoadmapModalOpen, setDeleteRoadmapModalOpen] = useState(false);

  // Notes state
  const [expandedNotesId, setExpandedNotesId] = useState<string | null>(null);
  const [currentNote, setCurrentNote] = useState<string>('');

  // Rename roadmap
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameTitle, setRenameTitle] = useState('');

  // Initial Data Fetch
  const fetchData = async () => {
    try {
      const [roadmapsRes, resumesRes, analysesRes] = await Promise.all([
        api.getRoadmaps(),
        api.getResumes(),
        api.getAnalyses(),
      ]);

      const validRoadmaps = Array.isArray(roadmapsRes?.roadmaps)
        ? roadmapsRes.roadmaps.filter((r): r is LearningRoadmap => Boolean(r && r.id))
        : [];
      const validResumes = Array.isArray(resumesRes?.resumes)
        ? resumesRes.resumes.filter((r): r is ResumeRecord => Boolean(r && r.id))
        : [];
      const validAnalyses = Array.isArray(analysesRes?.analyses)
        ? analysesRes.analyses.filter((a): a is JobMatchAnalysis => Boolean(a && a.id))
        : [];

      setRoadmaps(validRoadmaps);
      setResumes(validResumes);
      setSavedAnalyses(validAnalyses);

      if (validResumes.length > 0) {
        setSelectedResumeId(validResumes[0].id);
      }

      if (validAnalyses.length > 0) {
        setSelectedAnalysisId(validAnalyses[0].id);
      }

      if (validRoadmaps.length > 0) {
        if (tabMeta?.roadmapId) {
          const match = validRoadmaps.find((r) => r.id === tabMeta.roadmapId);
          setSelectedRoadmap(match || validRoadmaps[0]);
        } else {
          setSelectedRoadmap(validRoadmaps[0]);
        }
      } else {
        // If no roadmaps exist, open the creation view directly
        setShowCreateModal(true);
      }
    } catch (err: any) {
      console.error('Failed to load roadmap data:', err);
      addToast(err.message || 'Failed to load roadmaps.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tabMeta]);

  // Sync rename title when selected roadmap changes
  useEffect(() => {
    if (selectedRoadmap) {
      setRenameTitle(selectedRoadmap.title);
    }
  }, [selectedRoadmap]);

  // Status Change
  const handleStatusChange = async (taskId: string, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    if (!selectedRoadmap) return;
    try {
      const res = await api.updateRoadmapTask(selectedRoadmap.id, taskId, { status: newStatus });
      setSelectedRoadmap(res.roadmap);
      setRoadmaps((prev) => prev.map((r) => (r.id === res.roadmap.id ? res.roadmap : r)));
      addToast(`Task marked as ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update task status', 'error');
    }
  };

  // Save Notes
  const handleSaveNotes = async (taskId: string) => {
    if (!selectedRoadmap) return;
    try {
      const res = await api.updateRoadmapTask(selectedRoadmap.id, taskId, { studentNotes: currentNote });
      setSelectedRoadmap(res.roadmap);
      setRoadmaps((prev) => prev.map((r) => (r.id === res.roadmap.id ? res.roadmap : r)));
      setExpandedNotesId(null);
      addToast('Study notes saved.', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to save notes', 'error');
    }
  };

  // Add Custom Task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoadmap || !newTaskTitle.trim() || !newTaskSkill.trim()) return;

    try {
      const res = await api.addRoadmapTask(selectedRoadmap.id, {
        title: newTaskTitle.trim(),
        skill: newTaskSkill.trim(),
        weekNumber: Number(newTaskWeek) || 1,
        priority: newTaskPriority,
        estimatedDuration: newTaskDuration,
        learningObjective: newTaskObjective || 'Complete guided hands-on learning',
        completionCriteria: newTaskCriteria || 'Verify working implementation and test code',
      });
      setSelectedRoadmap(res.roadmap);
      setRoadmaps((prev) => prev.map((r) => (r.id === res.roadmap.id ? res.roadmap : r)));
      setShowAddModal(false);
      setNewTaskTitle('');
      setNewTaskSkill('');
      setNewTaskObjective('');
      setNewTaskCriteria('');
      addToast('Custom task added to roadmap!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to add task', 'error');
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!selectedRoadmap || !deleteTaskId) return;
    try {
      const res = await api.deleteRoadmapTask(selectedRoadmap.id, deleteTaskId);
      setSelectedRoadmap(res.roadmap);
      setRoadmaps((prev) => prev.map((r) => (r.id === res.roadmap.id ? res.roadmap : r)));
      addToast('Task removed from roadmap', 'info');
    } catch (err: any) {
      addToast(err.message || 'Failed to remove task', 'error');
    } finally {
      setDeleteTaskId(null);
    }
  };

  // Delete Whole Roadmap
  const handleDeleteRoadmap = async () => {
    if (!selectedRoadmap) return;
    try {
      await api.deleteRoadmap(selectedRoadmap.id);
      const remaining = roadmaps.filter((r) => r.id !== selectedRoadmap.id);
      setRoadmaps(remaining);
      setSelectedRoadmap(remaining.length > 0 ? remaining[0] : null);
      addToast('Roadmap deleted', 'info');
      if (remaining.length === 0) {
        setShowCreateModal(true);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to delete roadmap', 'error');
    } finally {
      setDeleteRoadmapModalOpen(false);
    }
  };

  // Rename Roadmap
  const handleSaveRename = async () => {
    if (!selectedRoadmap || !renameTitle.trim()) return;
    try {
      const res = await api.updateRoadmapTitle(selectedRoadmap.id, renameTitle.trim());
      setSelectedRoadmap(res.roadmap);
      setRoadmaps((prev) => prev.map((r) => (r.id === res.roadmap.id ? res.roadmap : r)));
      setIsRenaming(false);
      addToast('Roadmap renamed successfully', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to rename roadmap', 'error');
    }
  };

  // Regenerate Current Roadmap
  const handleRegenerate = async () => {
    if (!selectedRoadmap) return;
    setRegenerating(true);
    try {
      const res = await api.generateRoadmap(
        {
          analysisId: selectedRoadmap.analysisId,
          targetRole: selectedRoadmap.internshipTitle,
          companyName: selectedRoadmap.companyName,
          preserveCompleted,
        },
        preserveCompleted
      );
      setSelectedRoadmap(res.roadmap);
      setRoadmaps((prev) => prev.map((r) => (r.id === res.roadmap.id ? res.roadmap : r)));
      setShowRegenerateModal(false);
      addToast('Roadmap regenerated with fresh AI curriculum!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to regenerate roadmap', 'error');
    } finally {
      setRegenerating(false);
    }
  };

  // Fetch AI Career Recommendations (Option B)
  const handleFetchCareerRecommendations = async () => {
    if (resumes.length === 0) {
      addToast('Please upload or enter a resume first to get career recommendations.', 'error');
      return;
    }
    setLoadingCareers(true);
    setGenerationError(null);
    try {
      const res = await api.recommendCareers(selectedResumeId || resumes[0]?.id);
      setCareerRecommendations(res.recommendations);
      if (res.recommendations.length > 0) {
        setSelectedCareer(res.recommendations[0]);
      }
      addToast('Career recommendations generated from your resume!', 'success');
    } catch (err: any) {
      setGenerationError(err.message || 'Failed to fetch career recommendations.');
      addToast(err.message || 'Failed to fetch career recommendations', 'error');
    } finally {
      setLoadingCareers(false);
    }
  };

  // Execute Generation (Option A, Option B, or Option C)
  const handleCreateRoadmapSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (generating) return;
    setGenerationError(null);

    if (resumes.length === 0) {
      addToast('Please upload or enter your resume first.', 'error');
      setActiveTab('resume');
      return;
    }

    setGenerating(true);

    try {
      let res: { roadmap: LearningRoadmap };

      if (createTab === 'target-job') {
        if (!targetRole.trim()) {
          setGenerationError('Please specify the target job role.');
          setGenerating(false);
          return;
        }
        if (!jobDescription.trim() || jobDescription.trim().length < 20) {
          setGenerationError('Please provide a job description so the AI can evaluate required skill gaps.');
          setGenerating(false);
          return;
        }

        res = await api.generateRoadmap({
          targetRole: targetRole.trim(),
          companyName: companyName.trim(),
          jobDescriptionText: jobDescription.trim(),
          resumeId: selectedResumeId || resumes[0].id,
          preserveCompleted: true,
        });
      } else if (createTab === 'ai-careers') {
        if (!selectedCareer) {
          setGenerationError('Please select one of the AI-recommended careers first.');
          setGenerating(false);
          return;
        }

        res = await api.generateRoadmap({
          selectedRole: selectedCareer.role,
          roleContext: selectedCareer,
          resumeId: selectedResumeId || resumes[0].id,
          preserveCompleted: true,
        });
      } else {
        // From Saved Match
        if (!selectedAnalysisId) {
          setGenerationError('Please select an internship match analysis.');
          setGenerating(false);
          return;
        }

        res = await api.generateRoadmap({
          analysisId: selectedAnalysisId,
          preserveCompleted: true,
        });
      }

      setRoadmaps((prev) => [res.roadmap, ...prev.filter((r) => r.id !== res.roadmap.id)]);
      setSelectedRoadmap(res.roadmap);
      setShowCreateModal(false);
      addToast('Personalized learning roadmap created successfully!', 'success');
    } catch (err: any) {
      console.error('Failed to create roadmap:', err);
      setGenerationError(err.message || 'Failed to generate roadmap. Please try again.');
      addToast(err.message || 'Failed to generate roadmap.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Quick Preset Sample for Option A
  const handleLoadSampleJobDesc = () => {
    setTargetRole('Full-Stack Software Engineering Intern');
    setCompanyName('Stripe');
    setJobDescription(`Stripe Software Engineering Intern (Summer 2026)
We are looking for passionate students to join our core infrastructure and payments engineering teams.

Key Qualifications & Responsibilities:
- Build reliable, scalable distributed web services in TypeScript, Node.js, and React.
- Design database schemas and optimized queries in PostgreSQL and Redis.
- Write unit, integration, and end-to-end tests to maintain 99.999% uptime.
- Work closely with senior engineers on system design, code reviews, and containerized deployments using Docker and GitHub Actions.
- Solid grounding in computer science fundamentals: algorithms, data structures, and REST API design.`);
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/3"></div>
        <div className="h-40 bg-slate-100 rounded-2xl"></div>
        <div className="h-96 bg-slate-100 rounded-2xl"></div>
      </div>
    );
  }

  // Filter tasks
  // Filter tasks safely
  const filteredTasks = selectedRoadmap?.tasks
    ? selectedRoadmap.tasks.filter((t) => {
        if (!t || !t.id) return false;
        if (statusFilter !== 'all' && t.status !== statusFilter) return false;
        return true;
      })
    : [];

  // Metrics
  const totalTasks = selectedRoadmap?.tasks?.length || 0;
  const completedTasks = (selectedRoadmap?.tasks || []).filter((t) => t && t.status === 'completed').length;
  const inProgressTasks = (selectedRoadmap?.tasks || []).filter((t) => t && t.status === 'in_progress').length;
  const notStartedTasks = (selectedRoadmap?.tasks || []).filter((t) => t && t.status === 'not_started').length;
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Weeks & Priorities
  const weeks = selectedRoadmap?.tasks
    ? Array.from(new Set(selectedRoadmap.tasks.filter((t) => t && typeof t.weekNumber === 'number').map((t) => t.weekNumber))).sort((a, b) => a - b)
    : [];
  const priorities: Array<'High' | 'Medium' | 'Low'> = ['High', 'Medium', 'Low'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shadow-xs">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                AI Learning Roadmap
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Actionable step-by-step curriculum to bridge skill gaps and become internship-ready.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {roadmaps.length > 1 && (
            <div className="relative">
              <select
                value={selectedRoadmap?.id || ''}
                onChange={(e) => {
                  const match = roadmaps.find((r) => r.id === e.target.value);
                  if (match) setSelectedRoadmap(match);
                }}
                className="pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer appearance-none"
              >
                {roadmaps.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setGenerationError(null);
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Roadmap</span>
          </button>
        </div>
      </div>

      {/* Main Roadmap Display or Empty Placeholder */}
      {selectedRoadmap ? (
        <div className="space-y-6">
          {/* Active Roadmap Banner & Overview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-md">
                    {selectedRoadmap.companyName ? `${selectedRoadmap.companyName} Preparation` : 'Career Track'}
                  </span>
                  <span className="text-xs text-slate-400">
                    Est. Duration: {selectedRoadmap.targetCompletionWeeks || 4} Weeks
                  </span>
                </div>

                {isRenaming ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={renameTitle}
                      onChange={(e) => setRenameTitle(e.target.value)}
                      className="px-3 py-1.5 border border-indigo-300 rounded-lg text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSaveRename}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsRenaming(false)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {selectedRoadmap.title}
                    </h2>
                    <button
                      onClick={() => setIsRenaming(true)}
                      className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                      title="Rename roadmap"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
                  {selectedRoadmap.summary}
                </p>
              </div>

              {/* Progress Summary Box */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 min-w-[280px] shrink-0 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Overall Curriculum Progress</span>
                  <span className="font-extrabold text-indigo-600 text-sm">{completionPct}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${completionPct}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>
                    <strong className="text-slate-900 font-bold">{completedTasks}</strong> Completed
                  </span>
                  <span>
                    <strong className="text-amber-700 font-bold">{inProgressTasks}</strong> In Progress
                  </span>
                  <span>
                    <strong className="text-slate-600 font-bold">{notStartedTasks}</strong> Not Started
                  </span>
                </div>
              </div>
            </div>

            {/* Strategic Overview: Strengths & Prioritized Skills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-b border-slate-100">
              {/* Strengths identified from resume */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Current Strengths Identified from Resume
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedRoadmap.currentStrengths && selectedRoadmap.currentStrengths.length > 0 ? (
                    selectedRoadmap.currentStrengths.map((str, i) => (
                      <span
                        key={i}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-200/80 rounded-xl text-xs font-medium leading-relaxed"
                      >
                        ✓ {str}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Foundation in computing and core technical fundamentals.
                    </span>
                  )}
                </div>
              </div>

              {/* Prioritized skills to improve or learn */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Prioritized Skills to Acquire
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedRoadmap.prioritizedSkills && selectedRoadmap.prioritizedSkills.length > 0 ? (
                    selectedRoadmap.prioritizedSkills.map((ps, i) => (
                      <div
                        key={i}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 ${
                          ps.priority === 'High'
                            ? 'bg-rose-50 text-rose-900 border-rose-200/80'
                            : ps.priority === 'Medium'
                            ? 'bg-amber-50 text-amber-900 border-amber-200/80'
                            : 'bg-slate-50 text-slate-800 border-slate-200'
                        }`}
                        title={ps.reason}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            ps.priority === 'High'
                              ? 'bg-rose-500'
                              : ps.priority === 'Medium'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                        ></span>
                        <span className="font-bold">{ps.skill}</span>
                        <span className="text-[10px] opacity-75">({ps.priority})</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">
                      Core prerequisites and systems knowledge.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Learning Phases in Prerequisite Order */}
            {selectedRoadmap.phases && selectedRoadmap.phases.length > 0 && (
              <div className="mt-6 pt-2">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Learning Phases in Prerequisite Order
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedRoadmap.phases.map((phase) => (
                    <div
                      key={phase.phaseNumber}
                      className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-1.5 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-extrabold text-[10px]">
                          Phase {phase.phaseNumber}
                        </span>
                        {phase.durationWeeks && (
                          <span className="text-[11px] text-slate-400 font-normal">
                            ~{phase.durationWeeks} week{phase.durationWeeks === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-800 pt-0.5">{phase.title}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{phase.description}</p>
                      {phase.prerequisites && phase.prerequisites.length > 0 && (
                        <p className="text-[10px] text-slate-400 pt-1">
                          Prereq: {phase.prerequisites.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Tasks Controls & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            {/* View Mode Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start">
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'week' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By Phase / Week
              </button>
              <button
                type="button"
                onClick={() => setViewMode('priority')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'priority'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                By Priority
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'all' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Tasks ({totalTasks})
              </button>
            </div>

            {/* Filter by Status & Custom Task Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="not_started">Not Started ({notStartedTasks})</option>
                  <option value="in_progress">In Progress ({inProgressTasks})</option>
                  <option value="completed">Completed ({completedTasks})</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Task</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRegenerateModal(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>

              <button
                type="button"
                onClick={() => setDeleteRoadmapModalOpen(true)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                title="Delete roadmap"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Task Cards List */}
          {filteredTasks.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No tasks match your current filter.</p>
              <button
                onClick={() => setStatusFilter('all')}
                className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
              >
                Reset status filter
              </button>
            </div>
          ) : viewMode === 'week' ? (
            <div className="space-y-8">
              {weeks.map((weekNum) => {
                const weekTasks = filteredTasks.filter((t) => t.weekNumber === weekNum);
                if (weekTasks.length === 0) return null;
                const phaseTitle = weekTasks[0]?.phaseTitle || `Phase ${weekNum}`;

                return (
                  <div key={weekNum} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
                        {weekNum}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                          Week {weekNum}: {phaseTitle}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {weekTasks.filter((t) => t.status === 'completed').length} of {weekTasks.length} tasks completed
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      {weekTasks.map((task) => renderTaskCard(task))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'priority' ? (
            <div className="space-y-8">
              {priorities.map((p) => {
                const pTasks = filteredTasks.filter((t) => t.priority === p);
                if (pTasks.length === 0) return null;

                return (
                  <div key={p} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${
                          p === 'High' ? 'bg-rose-500' : p === 'Medium' ? 'bg-amber-500' : 'bg-slate-400'
                        }`}
                      ></span>
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        {p} Priority Tasks ({pTasks.length})
                      </h3>
                    </div>

                    <div className="space-y-3.5">
                      {pTasks.map((task) => renderTaskCard(task))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredTasks.map((task) => renderTaskCard(task))}
            </div>
          )}

          {/* Final Portfolio Capstone Project Section */}
          {selectedRoadmap.finalPortfolioProject && (
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-2xl text-white p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-800/80 text-indigo-200 text-xs font-semibold">
                    <FolderGit2 className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Capstone Showcase Project</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {selectedRoadmap.finalPortfolioProject.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-200/90 max-w-2xl leading-relaxed">
                    {selectedRoadmap.finalPortfolioProject.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 self-start">
                  {selectedRoadmap.finalPortfolioProject.techStack?.map((tech, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-white/10 text-white rounded-lg text-xs font-medium border border-white/15"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Deliverables & Completion Criteria */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-indigo-800/60">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Portfolio Deliverables to Showcase
                  </h4>
                  <ul className="space-y-1.5 text-xs text-indigo-100">
                    {selectedRoadmap.finalPortfolioProject.deliverables?.map((deliv, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{deliv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Completion Criteria
                  </h4>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-indigo-100 leading-relaxed">
                    {selectedRoadmap.finalPortfolioProject.completionCriteria}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State when no roadmaps exist at all */
        <div className="p-10 max-w-2xl mx-auto text-center space-y-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
            <Compass className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Learning Roadmap Created Yet</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Create your personalized roadmap to bridge skill gaps. Choose to target a specific internship role or explore AI-recommended careers directly from your resume.
          </p>
          <div className="pt-3 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setGenerationError(null);
                setShowCreateModal(true);
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition shadow-sm cursor-pointer"
            >
              Launch Roadmap Generator
            </button>
          </div>
        </div>
      )}

      {/* ==================== CREATE ROADMAP MODAL ==================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 border border-slate-100 relative my-8">
            <button
              type="button"
              onClick={() => {
                if (!generating) setShowCreateModal(false);
              }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">
                SkillBridge AI Curriculum Builder
              </span>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Create Personalized Learning Roadmap
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select how you want to design your roadmap. Both options operate independently of the Internship Matcher.
            </p>

            {/* Resume Selection Banner */}
            <div className="mt-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Source Resume for Skills</p>
                  <p className="text-[11px] text-slate-500">
                    {resumes.length > 0
                      ? 'AI will tailor missing skills against this verified profile'
                      : 'No resume detected yet'}
                  </p>
                </div>
              </div>

              {resumes.length > 0 ? (
                <select
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  {resumes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.extractedData.fullName || 'Student'})
                    </option>
                  ))}
                </select>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setActiveTab('resume');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Upload Resume First
                </button>
              )}
            </div>

            {/* Creation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 mt-6 pb-2">
              <button
                type="button"
                onClick={() => {
                  setCreateTab('target-job');
                  setGenerationError(null);
                }}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
                  createTab === 'target-job'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Target className="w-4 h-4" />
                <span>Option A: For My Target Job</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateTab('ai-careers');
                  setGenerationError(null);
                  if (careerRecommendations.length === 0) {
                    handleFetchCareerRecommendations();
                  }
                }}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition cursor-pointer flex items-center gap-2 ${
                  createTab === 'ai-careers'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Option B: AI-Recommended Career</span>
              </button>

              {savedAnalyses.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setCreateTab('from-match');
                    setGenerationError(null);
                  }}
                  className={`px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl transition cursor-pointer hidden md:flex items-center gap-1.5 ${
                    createTab === 'from-match'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Saved Match ({savedAnalyses.length})</span>
                </button>
              )}
            </div>

            {/* Error Message if Any */}
            {generationError && (
              <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{generationError}</span>
              </div>
            )}

            {/* ================= TAB CONTENT ================= */}

            {/* OPTION A: Target Job Role & Description */}
            {createTab === 'target-job' && (
              <form onSubmit={handleCreateRoadmapSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Target Role / Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                      placeholder="e.g. Full-Stack Software Engineering Intern"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Company Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Stripe, Google, Figma"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Internship Job Description <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleLoadSampleJobDesc}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      Load Sample Stripe Job
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    required
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the target job description or requirements here. The AI will extract prerequisite skills and map them against your resume..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={generating}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Synthesizing Target Job Roadmap...</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-4 h-4" />
                        <span>Generate Roadmap for Target Job</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* OPTION B: AI-Recommended Career Roadmap */}
            {createTab === 'ai-careers' && (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600">
                    Recommended roles based on your confirmed technical skills, education, and projects:
                  </p>
                  <button
                    type="button"
                    onClick={handleFetchCareerRecommendations}
                    disabled={loadingCareers || generating}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingCareers ? 'animate-spin' : ''}`} />
                    <span>Refresh Recommendations</span>
                  </button>
                </div>

                {loadingCareers ? (
                  <div className="py-12 text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-700">
                      Analyzing resume and finding high-opportunity internship roles...
                    </p>
                  </div>
                ) : careerRecommendations.length > 0 ? (
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {careerRecommendations.map((career, idx) => {
                      const isSelected = selectedCareer?.role === career.role;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedCareer(career)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                              : 'border-slate-200 hover:border-indigo-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900">{career.role}</h4>
                                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-emerald-100 text-emerald-800">
                                  {career.matchScore}% Match
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {career.matchReason}
                              </p>
                            </div>

                            <input
                              type="radio"
                              name="selectedCareerRadio"
                              checked={isSelected}
                              onChange={() => setSelectedCareer(career)}
                              className="mt-1 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>

                          {/* Strengths & Missing Skills chips */}
                          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            <div>
                              <span className="text-emerald-700 font-bold block mb-1">
                                Existing Strengths:
                              </span>
                              <span className="text-slate-600">
                                {career.existingStrengths?.join(', ') || 'Core languages and tools'}
                              </span>
                            </div>
                            <div>
                              <span className="text-rose-700 font-bold block mb-1">
                                Top Skills to Bridge:
                              </span>
                              <span className="text-slate-600">
                                {career.skillsToAcquire?.join(', ') || 'Specialized frameworks'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <Sparkles className="w-6 h-6 text-indigo-500 mx-auto" />
                    <p className="text-xs sm:text-sm text-slate-600">
                      Click below to let Gemini analyze your resume and suggest tailored career paths.
                    </p>
                    <button
                      type="button"
                      onClick={handleFetchCareerRecommendations}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
                    >
                      Get Career Recommendations
                    </button>
                  </div>
                )}

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={generating}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateRoadmapSubmit()}
                    disabled={generating || !selectedCareer}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generating Career Roadmap...</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-4 h-4" />
                        <span>Generate Roadmap for {selectedCareer ? selectedCareer.role : 'Role'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* OPTION C: From Saved Internship Match */}
            {createTab === 'from-match' && savedAnalyses.length > 0 && (
              <div className="mt-5 space-y-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Existing Analysis
                </label>
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                  {savedAnalyses.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAnalysisId(a.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        selectedAnalysisId === a.id
                          ? 'border-indigo-600 bg-indigo-50/50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{a.internshipTitle}</p>
                          <p className="text-[11px] text-slate-500">
                            {a.companyName || 'Target Role'} • {a.overallMatchScore}% Match
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {a.missingRequiredSkills?.length || 0} gaps
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    disabled={generating}
                    className="px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateRoadmapSubmit()}
                    disabled={generating || !selectedAnalysisId}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {generating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Generating Roadmap...</span>
                      </>
                    ) : (
                      <>
                        <Compass className="w-4 h-4" />
                        <span>Generate from Selected Match</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== ADD CUSTOM TASK MODAL ==================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-100 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Add Custom Study Task</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add your own milestone or exercise to this roadmap.
            </p>

            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Master PostgreSQL Indexes and Query Plans"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Skill
                  </label>
                  <input
                    type="text"
                    required
                    value={newTaskSkill}
                    onChange={(e) => setNewTaskSkill(e.target.value)}
                    placeholder="e.g. PostgreSQL"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Week / Phase
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={newTaskWeek}
                    onChange={(e) => setNewTaskWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(e.target.value)}
                    placeholder="e.g. 4 hours"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Learning Objective
                </label>
                <textarea
                  rows={2}
                  value={newTaskObjective}
                  onChange={(e) => setNewTaskObjective(e.target.value)}
                  placeholder="What will you be able to build or explain after completing this?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Completion Criteria
                </label>
                <input
                  type="text"
                  value={newTaskCriteria}
                  onChange={(e) => setNewTaskCriteria(e.target.value)}
                  placeholder="e.g. Build API with 3 endpoints and benchmark with EXPLAIN ANALYZE"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== REGENERATE MODAL ==================== */}
      {showRegenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Regenerate Learning Plan</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Gemini AI will re-synthesize tasks based on current skill gaps.
            </p>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={preserveCompleted}
                onChange={(e) => setPreserveCompleted(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-medium text-slate-700">
                Preserve previously completed tasks ({completedTasks})
              </span>
            </label>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRegenerateModal(false)}
                disabled={regenerating}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {regenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <span>Confirm & Regenerate</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Task Deletion Modal */}
      <ConfirmationModal
        isOpen={!!deleteTaskId}
        title="Remove Task from Roadmap?"
        message="Are you sure you want to remove this learning task? This will update your progress metrics."
        confirmLabel="Remove Task"
        isDestructive={true}
        onConfirm={handleDeleteTask}
        onCancel={() => setDeleteTaskId(null)}
      />

      {/* Confirm Whole Roadmap Deletion Modal */}
      <ConfirmationModal
        isOpen={deleteRoadmapModalOpen}
        title="Delete Entire Roadmap?"
        message="Are you sure you want to delete this learning roadmap? You can generate a new one at any time."
        confirmLabel="Delete Roadmap"
        isDestructive={true}
        onConfirm={handleDeleteRoadmap}
        onCancel={() => setDeleteRoadmapModalOpen(false)}
      />
    </div>
  );

  // Helper function to render individual task cards
  function renderTaskCard(task: RoadmapTask) {
    const isCompleted = task.status === 'completed';
    const isInProgress = task.status === 'in_progress';
    const isEditingNotes = expandedNotesId === task.id;

    return (
      <div
        key={task.id}
        className={`p-5 rounded-2xl border transition-all ${
          isCompleted
            ? 'bg-slate-50/70 border-slate-200'
            : isInProgress
            ? 'bg-indigo-50/20 border-indigo-200 shadow-xs'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {/* Status Checkbox / Toggle */}
            <button
              type="button"
              onClick={() =>
                handleStatusChange(
                  task.id,
                  isCompleted ? 'not_started' : isInProgress ? 'completed' : 'in_progress'
                )
              }
              className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition cursor-pointer shrink-0 ${
                isCompleted
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : isInProgress
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'border-slate-300 hover:border-indigo-600 bg-white text-transparent'
              }`}
              title="Click to toggle status (Not Started -> In Progress -> Completed)"
            >
              {isCompleted ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : isInProgress ? (
                <span className="w-2 h-2 rounded-full bg-white"></span>
              ) : null}
            </button>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`text-sm font-bold ${
                    isCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                  }`}
                >
                  {task.title}
                </span>

                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-700 rounded-md">
                  {task.skill}
                </span>

                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                    task.priority === 'High'
                      ? 'bg-rose-100 text-rose-800'
                      : task.priority === 'Medium'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {task.priority} Priority
                </span>

                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {task.estimatedDuration}
                </span>
              </div>

              {/* Importance reason */}
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">Why it matters: </span>
                {task.importanceReason}
              </p>

              {/* Concrete learning objective */}
              <p className="text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">Learning Objective: </span>
                {task.learningObjective}
              </p>

              {/* Completion Criteria */}
              {task.completionCriteria && (
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 text-[11px] text-slate-700 flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 mt-0.5 shrink-0" />
                  <span>
                    <strong className="text-slate-900">Completion Criteria: </strong>
                    {task.completionCriteria}
                  </span>
                </div>
              )}

              {/* Verified Learning Resource Link */}
              {task.recommendedResource && (
                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  <span className="text-[11px] text-slate-400">Resource:</span>
                  <a
                    href={task.recommendedResource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition"
                  >
                    <BookOpen className="w-3 h-3" />
                    <span>{task.recommendedResource.name}</span>
                    <ExternalLink className="w-3 h-3 text-indigo-400" />
                  </a>
                  {task.recommendedResource.isFree && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Free
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    ({task.recommendedResource.type})
                  </span>
                </div>
              )}

              {/* Practice Project / Coding Exercise */}
              {task.practiceProject && (
                <div className="mt-2 p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <FolderGit2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Coding Exercise: {task.practiceProject.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {task.practiceProject.description}
                  </p>
                  <p className="text-[11px] text-indigo-900 font-medium">
                    <span className="font-bold">Deliverable: </span>
                    {task.practiceProject.deliverable}
                  </p>
                </div>
              )}

              {/* Prerequisites */}
              {task.prerequisites && task.prerequisites.length > 0 && (
                <p className="text-[10px] text-slate-400 pt-0.5">
                  Prerequisites: {task.prerequisites.join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0">
            {/* Status Badges Selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleStatusChange(task.id, 'not_started')}
                className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                  task.status === 'not_started'
                    ? 'bg-white text-slate-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Not Started
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange(task.id, 'in_progress')}
                className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                  task.status === 'in_progress'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                In Progress
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange(task.id, 'completed')}
                className={`px-2 py-1 rounded-md font-semibold transition cursor-pointer ${
                  task.status === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Done
              </button>
            </div>

            {/* Notes Toggle Button */}
            <button
              type="button"
              onClick={() => {
                if (isEditingNotes) {
                  setExpandedNotesId(null);
                } else {
                  setExpandedNotesId(task.id);
                  setCurrentNote(task.studentNotes || '');
                }
              }}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
              title="Add or edit study notes"
            >
              <FileEdit className="w-4 h-4" />
            </button>

            {/* Delete Task Button */}
            <button
              type="button"
              onClick={() => setDeleteTaskId(task.id)}
              className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Collapsible Student Study Notes Editor */}
        {isEditingNotes && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-200/80 animate-in fade-in space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">
                Study Notes & Code Links:
              </label>
              <span className="text-[10px] text-slate-400">Markdown / plain text supported</span>
            </div>
            <textarea
              rows={3}
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="Record your takeaways, GitHub pull request links, or questions to review..."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setExpandedNotesId(null)}
                className="px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveNotes(task.id)}
                className="px-3.5 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                Save Notes
              </button>
            </div>
          </div>
        )}

        {/* Existing notes preview if not editing */}
        {!isEditingNotes && task.studentNotes && (
          <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-600 flex items-start gap-1.5">
            <span className="text-indigo-600 font-bold shrink-0">Note:</span>
            <span className="italic">{task.studentNotes}</span>
          </div>
        )}
      </div>
    );
  }
};
