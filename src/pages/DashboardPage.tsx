import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { DashboardStats, RoadmapTask } from '../types';
import {
  FileText,
  Target,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  Plus,
  Compass,
  Sparkles,
  Calendar,
  ExternalLink,
  Clock,
  ChevronRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, setActiveTab, addToast } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [seeding, setSeeding] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    try {
      const data = await api.getDashboard();
      setStats(data.stats);
    } catch (err: any) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const res = await api.seedDemoData();
      setStats(res.stats);
      addToast('Realistic sample resume, Stripe evaluation, and 4-week roadmap loaded!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to seed sample data', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleTaskToggle = async (roadmapId: string, task: RoadmapTask) => {
    const nextStatus = task.status === 'completed' ? 'not_started' : 'completed';
    try {
      await api.updateRoadmapTask(roadmapId, task.id, { status: nextStatus });
      fetchDashboardData();
      addToast(`Task marked as ${nextStatus === 'completed' ? 'completed' : 'not started'}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update task', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl"></div>
      </div>
    );
  }

  const isEmpty =
    !stats || (stats.resumesCount === 0 && stats.analysesCount === 0 && stats.totalTasksCount === 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Student'}! 👋
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {user?.profile?.college
              ? `${user.profile.college} • ${user.profile.degree || 'Student'}`
              : 'Track your skill gaps, internship match readiness, and personalized roadmaps.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {isEmpty && (
            <button
              onClick={handleSeedDemo}
              disabled={seeding}
              className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" />
              <span>{seeding ? 'Loading Sample...' : 'Load Sample Data'}</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('resume')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Resume</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Resumes</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats?.resumesCount || 0}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Parsed & verified</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Matches</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats?.analysesCount || 0}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Jobs evaluated</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Gaps Found</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">{stats?.skillGapsCount || 0}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Identified missing skills</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Tasks Done</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {stats?.tasksCompletedCount || 0}
              <span className="text-sm font-normal text-slate-400"> / {stats?.totalTasksCount || 0}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Roadmap milestones</p>
          </div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Overall Progress</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-indigo-600">
              {stats?.overallProgressPercentage || 0}%
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats?.overallProgressPercentage || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Next Actions Alert Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-50 via-white to-purple-50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              {isEmpty
                ? 'Step 1: Upload your resume or try the sample data'
                : stats?.analysesCount === 0
                ? 'Step 2: Match your resume against your target internship'
                : !stats?.activeRoadmap
                ? 'Step 3: Generate your personalized weekly learning roadmap'
                : 'Active Goal: Complete your upcoming roadmap tasks'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              {isEmpty
                ? 'SkillBridge AI extracts your actual programming languages, projects, and skills to compare against requirements.'
                : stats?.analysesCount === 0
                ? 'Enter an internship description from LinkedIn or Stripe to discover missing required skills.'
                : !stats?.activeRoadmap
                ? 'Transform your gap analysis into a 4-week step-by-step roadmap with free documentation & mini-projects.'
                : 'Focus on high-priority tasks first to maximize your internship readiness.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (isEmpty) setActiveTab('resume');
            else if (stats?.analysesCount === 0) setActiveTab('job-match');
            else if (!stats?.activeRoadmap) setActiveTab('job-match');
            else setActiveTab('roadmap');
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
        >
          <span>
            {isEmpty
              ? 'Get Started'
              : stats?.analysesCount === 0
              ? 'Compare Internship'
              : !stats?.activeRoadmap
              ? 'View Analyses'
              : 'Open Roadmap'}
          </span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Two Column Section: Active Roadmap & Recent Analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Roadmap (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Current Learning Roadmap</h3>
                <p className="text-xs text-slate-500">
                  {stats?.activeRoadmap
                    ? `${stats.activeRoadmap.internshipTitle} (${stats.activeRoadmap.companyName || 'Role'})`
                    : 'No active roadmap generated yet'}
                </p>
              </div>
            </div>

            {stats?.activeRoadmap && (
              <button
                onClick={() => setActiveTab('roadmap', { roadmapId: stats.activeRoadmap!.id })}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Roadmap</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="mt-4 flex-1">
            {stats?.activeRoadmap ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100 flex items-center justify-between">
                  <span className="font-medium text-slate-700">{stats.activeRoadmap.summary}</span>
                  <span className="shrink-0 px-2 py-0.5 text-[11px] font-semibold bg-indigo-100 text-indigo-700 rounded-md">
                    {stats.activeRoadmap.targetCompletionWeeks} Weeks
                  </span>
                </div>

                <div className="space-y-2 mt-3">
                  {stats.activeRoadmap.tasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className={`p-3.5 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                        task.status === 'completed'
                          ? 'bg-slate-50/60 border-slate-200 opacity-75'
                          : 'bg-white border-slate-200/90 hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleTaskToggle(stats.activeRoadmap!.id, task)}
                          className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer ${
                            task.status === 'completed'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-slate-300 hover:border-indigo-500 bg-white'
                          }`}
                        >
                          {task.status === 'completed' && <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-bold ${
                                task.status === 'completed'
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-800'
                              }`}
                            >
                              {task.title}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                                task.priority === 'High'
                                  ? 'bg-rose-50 text-rose-700'
                                  : task.priority === 'Medium'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {task.learningObjective}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-semibold text-slate-400 block">
                          Week {task.weekNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">{task.estimatedDuration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <Compass className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Learning Roadmap Yet</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Once you match your resume with an internship description, SkillBridge AI will construct your personalized curriculum.
                </p>
                <button
                  onClick={() => setActiveTab('job-match')}
                  className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
                >
                  Create Match Analysis
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Job Match Analyses (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">Recent Job Matches</h3>
            </div>
            {stats && stats.recentAnalyses.length > 0 && (
              <button
                onClick={() => setActiveTab('history')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                All
              </button>
            )}
          </div>

          <div className="mt-4 flex-1">
            {stats && stats.recentAnalyses.length > 0 ? (
              <div className="space-y-3">
                {stats.recentAnalyses.map((analysis) => {
                  const scoreColor =
                    analysis.overallMatchScore >= 75
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : analysis.overallMatchScore >= 50
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200';

                  return (
                    <div
                      key={analysis.id}
                      onClick={() => setActiveTab('job-match', { analysisId: analysis.id })}
                      className="p-3.5 rounded-xl border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/20 transition cursor-pointer flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {analysis.internshipTitle}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {analysis.companyName || 'Target Company'} • {analysis.domain}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                          <span>{analysis.matchingSkills.length} matches</span>
                          <span>•</span>
                          <span className="text-rose-600 font-medium">
                            {analysis.missingRequiredSkills.length} gaps
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-black rounded-lg border ${scoreColor}`}
                        >
                          {analysis.overallMatchScore}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <Target className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">No Job Evaluations</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Evaluate an internship posting to see how your current qualifications stack up.
                </p>
                <button
                  onClick={() => setActiveTab('job-match')}
                  className="mt-4 px-3.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  Start First Match
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
