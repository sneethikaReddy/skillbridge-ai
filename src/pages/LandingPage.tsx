import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  FileCheck2,
  Target,
  Compass,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  GraduationCap,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const { demoLogin, addToast } = useAuth();

  const handleDemoClick = async () => {
    try {
      await demoLogin();
    } catch (err: any) {
      addToast('Failed to initialize demo: ' + err.message, 'error');
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-24 sm:pb-28 overflow-hidden bg-radial from-indigo-50/70 via-white to-white">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#6366f1] to-[#a855f7] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold mb-6 shadow-xs animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Internship & Skill Gap Planner for College Students</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] max-w-4xl mx-auto">
            Bridge the Gap Between Your Studies and Your{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Dream Tech Internship
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Stop guessing why recruiters reject your applications. Upload your resume, paste any job description, and get
            a transparent mathematical match score, identified skill gaps, and a personalized weekly learning roadmap.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
            <button
              onClick={() => onOpenAuth('register')}
              className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={handleDemoClick}
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl border border-slate-200 transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Explore Sample Demo</span>
            </button>
          </div>

          {/* Quick Metrics preview */}
          <div className="mt-14 pt-10 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">50/30/20</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Weighted Gap Scoring</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-indigo-600">PDF & Text</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Actual Text Extraction</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-slate-900">100% Free</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Verified Curated Resources</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">Persisted</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Weekly Progress Tracker</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Student Workflow */}
      <section className="py-16 sm:py-20 bg-slate-50/60 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">How It Works</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Your Complete Path from Student to Internship-Ready
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Follow a transparent, step-by-step workflow designed to pinpoint your exact technical deficiencies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900">Upload Your Resume</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Upload your PDF or paste raw text. Real text parsing and Gemini AI extract technical skills, languages, projects, and education.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-base mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900">Paste Job Description</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Enter the target internship description from LinkedIn, Handshake, or company careers pages.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900">Analyze Skill Gaps</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Receive an objective mathematical match percentage, matching skills, partially matching areas, and missing required skills.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base mb-4">
                4
              </div>
              <h3 className="text-base font-bold text-slate-900">Execute Roadmap</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Follow an actionable weekly plan with free verified resources, mini-projects, progress checkboxes, and notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">Platform Features</span>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">Engineered Specifically for College Students</h2>
            <p className="text-sm text-slate-500 mt-2">
              Every feature provides measurable value without fake scores or fabricated AI responses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl border border-slate-200/80 hover:border-indigo-200 hover:shadow-md transition bg-gradient-to-b from-slate-50/50 to-white">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Actual PDF Extraction & Review</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Reads real PDF buffers using server-side parsing. Extracts categorized languages, frameworks, databases, and project bullets. Students can review and correct any item.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 hover:border-purple-200 hover:shadow-md transition bg-gradient-to-b from-slate-50/50 to-white">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Mathematical Match Scoring</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Calculates transparent scores based on documented 50/30/20 criteria (Core skills, applied projects, preferred qualifications). Cites direct resume evidence for every matching skill.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200/80 hover:border-emerald-200 hover:shadow-md transition bg-gradient-to-b from-slate-50/50 to-white">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Personalized Learning Roadmap</h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Prioritizes foundational gaps into weekly plans. Each task includes why it matters for the role, free verified documentation links, practice mini-projects, and progress tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to action section */}
      <section className="py-16 bg-slate-900 text-white mt-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Ready to Become Internship-Ready?</h2>
          <p className="mt-3 text-sm text-slate-400 max-w-xl mx-auto">
            Analyze your resume against real software engineering, data, and cloud internships in seconds.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => onOpenAuth('register')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition cursor-pointer shadow-md"
            >
              Create Free Account
            </button>
            <button
              onClick={handleDemoClick}
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
            >
              Try Instant Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">SkillBridge AI</span>
            <span>•</span>
            <span>Smart Internship & Skill Gap Planner</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Built for University Students</span>
            <span className="hover:text-slate-800 cursor-pointer" onClick={() => onOpenAuth('login')}>
              Sign In
            </span>
            <span className="hover:text-slate-800 cursor-pointer" onClick={() => onOpenAuth('register')}>
              Register
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
