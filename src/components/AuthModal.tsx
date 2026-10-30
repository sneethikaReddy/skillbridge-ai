import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, ArrowRight, UserCheck, Lock, Mail, User as UserIcon } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'register' }) => {
  const { login, register, resetPassword, demoLogin, addToast } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'reset'>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'register') {
        if (!name.trim()) {
          addToast('Please enter your full name', 'error');
          setSubmitting(false);
          return;
        }
        await register(name, email, password);
        onClose();
      } else if (mode === 'reset') {
        if (!password || password.length < 6) {
          addToast('Please enter a new password of at least 6 characters', 'error');
          setSubmitting(false);
          return;
        }
        await resetPassword(email, password);
        setMode('login');
      } else {
        await login(email, password);
        onClose();
      }
    } catch (err: any) {
      addToast(err.message || 'Authentication failed. Please check your credentials.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = async () => {
    setSubmitting(true);
    try {
      await demoLogin();
      onClose();
    } catch (err: any) {
      addToast(err.message || 'Failed to load demo profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
            SB
          </div>
          <span className="font-bold text-slate-900 text-lg">SkillBridge AI</span>
        </div>

        {/* Top Segmented Tab Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer text-center ${
              mode === 'login'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer text-center ${
              mode === 'register'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {mode === 'register'
            ? 'Create Student Account'
            : mode === 'reset'
            ? 'Reset Your Password'
            : 'Welcome Back'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {mode === 'register'
            ? 'Plan your dream tech internship with AI gap analysis'
            : mode === 'reset'
            ? 'Enter your email and choose a new password'
            : 'Access your saved roadmaps, resume evaluations & progress'}
        </p>

        {/* Demo Student Fast Action */}
        <div className="mt-5 p-3.5 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <div>
                <p className="text-xs font-semibold text-indigo-950">Quick Explorer Demo</p>
                <p className="text-[11px] text-indigo-700">Preloaded with Alex Chen (Stanford CS Junior)</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDemo}
              disabled={submitting}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <span>Explore Demo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="my-5 flex items-center">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-3 text-xs uppercase tracking-wider text-slate-400 font-medium">Or continue with</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {mode === 'reset' ? 'New Password' : 'Password'}
              </label>
              {mode === 'login' && (
                <button
                  type="button"
                  onClick={() => setMode('reset')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
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
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
                <span>Create Account</span>
              </>
            ) : mode === 'reset' ? (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>Reset Password</span>
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-slate-500">
          {mode === 'reset' ? (
            <p>
              Remember your password?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer underline"
              >
                Back to Sign In
              </button>
            </p>
          ) : mode === 'register' ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer underline"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              New to SkillBridge AI?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer underline"
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
