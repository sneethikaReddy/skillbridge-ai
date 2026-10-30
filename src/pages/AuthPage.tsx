import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  UserCheck,
  Lock,
  Mail,
  User as UserIcon,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Compass,
} from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'login' }) => {
  const { login, register, resetPassword, demoLogin, addToast, setActiveTab } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setErrorMsg('Please enter your full name.');
          setSubmitting(false);
          return;
        }
        await register(name.trim(), email.trim(), password);
      } else if (mode === 'reset') {
        if (!password || password.length < 6) {
          setErrorMsg('Please enter a new password of at least 6 characters.');
          setSubmitting(false);
          return;
        }
        await resetPassword(email.trim(), password);
        setMode('login');
      } else {
        await login(email.trim(), password);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
      addToast(err.message || 'Authentication failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await demoLogin();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load demo profile.');
      addToast(err.message || 'Failed to load demo profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-slate-50">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        {/* Left Informational Showcase Column */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between">
          <div>
            <div
              onClick={() => setActiveTab('landing')}
              className="flex items-center gap-2.5 cursor-pointer group mb-8"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
                SB
              </div>
              <span className="font-extrabold text-white text-xl tracking-tight">
                SkillBridge <span className="text-indigo-400">AI</span>
              </span>
            </div>

            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-indigo-800/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold inline-block">
                Smart Internship Readiness
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                {mode === 'login' ? 'Welcome back to your workspace.' : 'Turn qualification gaps into job offers.'}
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
                SkillBridge AI evaluates your real resume against internship requirements, reveals missing skills, and crafts structured learning roadmaps.
              </p>
            </div>

            {/* Benefits List */}
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-2.5 text-xs text-indigo-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Resume skill extraction without hallucination</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-indigo-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Transparent 50/30/20 weighted qualification scoring</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-indigo-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Target-job or AI-recommended roadmaps</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-indigo-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified free learning resources & portfolio capstones</span>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-indigo-800/60 mt-8">
            <p className="text-[11px] text-indigo-300">
              Trusted by college students across computer science and engineering tracks.
            </p>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="p-8 sm:p-10 flex flex-col justify-center">
          {/* Top Segmented Tab Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                mode === 'register'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Create Account</span>
            </button>
          </div>

          <div className="mb-5">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {mode === 'login' ? 'Sign In to SkillBridge AI' : 'Create Your Student Account'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'login'
                ? 'Enter your credentials to access your roadmaps and analyses'
                : 'Get started for free — plan your dream tech internship'}
            </p>
          </div>

          {/* Quick Demo Student Button */}
          <div className="mb-6 p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-indigo-950">Quick Explorer Demo</p>
                <p className="text-[11px] text-indigo-700">Preloaded with Alex Chen (Stanford CS Junior)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemo}
              disabled={submitting}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <span>Explore Demo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="relative my-4 flex items-center">
            <div className="flex-1 border-t border-slate-200"></div>
            <span className="px-3 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Or with your email
            </span>
            <div className="flex-1 border-t border-slate-200"></div>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Maya Patel"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {mode === 'reset' ? 'New Password' : 'Password'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('reset');
                      setErrorMsg(null);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'reset' ? 'Minimum 6 characters' : '••••••••'}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Processing...
                </span>
              ) : mode === 'register' ? (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Create Account & Start Planning</span>
                </>
              ) : mode === 'reset' ? (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Reset Password</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Sign In to Workspace</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            {mode === 'reset' ? (
              <p>
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer underline"
                >
                  Back to Sign In
                </button>
              </p>
            ) : mode === 'register' ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                New to SkillBridge AI?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer underline"
                >
                  Create an Account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
