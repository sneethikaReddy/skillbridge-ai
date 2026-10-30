import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { LearningRoadmap, RoadmapTask } from '../types';
import {
  CheckSquare,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar,
  Compass,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const { addToast, setActiveTab } = useAuth();
  const [roadmaps, setRoadmaps] = useState<LearningRoadmap[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<LearningRoadmap | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = async () => {
    try {
      const data = await api.getRoadmaps();
      setRoadmaps(data.roadmaps);
      if (data.roadmaps.length > 0) {
        setActiveRoadmap(data.roadmaps[0]);
      }
    } catch (err: any) {
      console.error('Failed to load progress data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const handleStatusChange = async (taskId: string, newStatus: 'not_started' | 'in_progress' | 'completed') => {
    if (!activeRoadmap) return;
    try {
      const res = await api.updateRoadmapTask(activeRoadmap.id, taskId, { status: newStatus });
      setActiveRoadmap(res.roadmap);
      setRoadmaps((prev) => prev.map((r) => (r.id === res.roadmap.id ? res.roadmap : r)));
      addToast(`Task marked as ${newStatus.replace('_', ' ')}`, 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to update task', 'error');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!activeRoadmap) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-2">
          <CheckSquare className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">No Active Progress Tracker</h2>
        <p className="text-sm text-slate-500">
          You don't have an active learning roadmap yet. Once you generate a roadmap, all your weekly milestone checklists and completion rates appear here.
        </p>
        <button
          onClick={() => setActiveTab('job-match')}
          className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition shadow-sm cursor-pointer"
        >
          Create Internship Roadmap
        </button>
      </div>
    );
  }

  // Calculate actual progress stats
  const totalTasks = activeRoadmap.tasks.length;
  const completedTasks = activeRoadmap.tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = activeRoadmap.tasks.filter((t) => t.status === 'in_progress').length;
  const notStartedTasks = totalTasks - completedTasks - inProgressTasks;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Weeks breakdown
  const weeks = Array.from(new Set(activeRoadmap.tasks.map((t) => t.weekNumber))).sort((a, b) => a - b);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Progress Tracker & Milestone Checklist
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time status tracking for {activeRoadmap.title}
          </p>
        </div>

        {roadmaps.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Active Roadmap:</span>
            <select
              value={activeRoadmap.id}
              onChange={(e) => {
                const match = roadmaps.find((r) => r.id === e.target.value);
                if (match) setActiveRoadmap(match);
              }}
              className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-semibold text-slate-700"
            >
              {roadmaps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.internshipTitle} ({r.companyName || 'Role'})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Completion</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-indigo-600">{completionRate}%</span>
            <span className="text-xs text-slate-400">of curriculum</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-600">{completedTasks}</span>
            <span className="text-xs text-slate-400">milestones done</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Ready for resume bullet additions</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">In Progress</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-amber-500">{inProgressTasks}</span>
            <span className="text-xs text-slate-400">active tasks</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Hands-on mini-projects underway</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-700">{notStartedTasks}</span>
            <span className="text-xs text-slate-400">remaining</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Scheduled for upcoming weeks</span>
          </p>
        </div>
      </div>

      {/* Weekly Breakdown Visuals */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Weekly Milestone Completion Rates</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {weeks.map((week) => {
            const weekTasks = activeRoadmap.tasks.filter((t) => t.weekNumber === week);
            const weekCompleted = weekTasks.filter((t) => t.status === 'completed').length;
            const weekPct = weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0;

            return (
              <div key={week} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-800">Week {week}</span>
                  <span className="font-semibold text-indigo-600">{weekPct}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${weekPct}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {weekCompleted} of {weekTasks.length} tasks completed
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Interactive Tasks Checklist */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Interactive Tasks Checklist</h3>
          <span className="text-xs text-slate-400">Click checkboxes to update task status</span>
        </div>

        <div className="space-y-3">
          {activeRoadmap.tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                task.status === 'completed'
                  ? 'bg-slate-50/60 border-slate-200 opacity-80'
                  : task.status === 'in_progress'
                  ? 'bg-amber-50/30 border-amber-200'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() =>
                    handleStatusChange(
                      task.id,
                      task.status === 'completed'
                        ? 'not_started'
                        : task.status === 'in_progress'
                        ? 'completed'
                        : 'in_progress'
                    )
                  }
                  className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition cursor-pointer shrink-0 ${
                    task.status === 'completed'
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : task.status === 'in_progress'
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'border-slate-300 hover:border-indigo-600 bg-white'
                  }`}
                  title="Toggle status"
                >
                  {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {task.status === 'in_progress' && <span className="w-2 h-2 rounded-full bg-white"></span>}
                </button>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs font-bold ${
                        task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      Week {task.weekNumber}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        task.priority === 'High'
                          ? 'bg-rose-50 text-rose-700'
                          : task.priority === 'Medium'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {task.priority} Priority
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1">{task.learningObjective}</p>

                  {task.studentNotes && (
                    <p className="text-[11px] text-indigo-700 bg-indigo-50/60 px-2 py-0.5 rounded mt-1.5 inline-block">
                      Note: {task.studentNotes}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <select
                  value={task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                >
                  <option value="not_started">Not Started</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
