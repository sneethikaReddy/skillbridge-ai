import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Target,
  Compass,
  CheckSquare,
  Clock,
  UserCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, user } = useAuth();

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resume', label: 'Resume Analyzer', icon: FileText, badge: 'PDF' },
    { id: 'job-match', label: 'Internship Matcher', icon: Target },
    { id: 'roadmap', label: 'Learning Roadmap', icon: Compass },
    { id: 'progress', label: 'Progress Tracker', icon: CheckSquare },
    { id: 'history', label: 'Saved & History', icon: Clock },
    { id: 'profile', label: 'Student Profile', icon: UserCheck },
  ];

  const handleSelect = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl md:shadow-none' : '-translate-x-full'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Quick Flow Indicator */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Active Workflow
            </p>
            <div className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Upload → Match → Learn</span>
            </div>
          </div>

          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition group cursor-pointer ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-100/70 text-indigo-700 rounded">
                        {item.badge}
                      </span>
                    )}
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 bg-gradient-to-br from-indigo-50/70 to-purple-50/70 rounded-xl border border-indigo-100/60">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <p className="text-xs font-bold text-slate-900">AI Powered</p>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              SkillBridge compares real qualifications against live job requirements.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
