import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, StudentProfile } from '../types';
import { api, authStorage } from '../api/client';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<string>;
  demoLogin: () => Promise<void>;
  logout: () => void;
  updateProfile: (profile: Partial<StudentProfile>, name?: string) => Promise<void>;
  toasts: ToastMessage[];
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string, meta?: any) => void;
  tabMeta: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeTab, setActiveTabState] = useState<string>('landing');
  const [tabMeta, setTabMeta] = useState<any>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const setActiveTab = (tab: string, meta?: any) => {
    setActiveTabState(tab);
    setTabMeta(meta || null);
    try {
      if (typeof window !== 'undefined' && window.scrollTo) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {}
  };

  useEffect(() => {
    let isMounted = true;
    const checkAuth = async () => {
      try {
        const token = authStorage.getToken();
        if (!token) {
          if (isMounted) setLoading(false);
          return;
        }
        const { user } = await api.getMe();
        if (isMounted) {
          setUser(user);
          setActiveTabState('dashboard');
        }
      } catch (err) {
        console.warn('Session expired or invalid, default to landing:', err);
        authStorage.clearToken();
        if (isMounted) {
          setUser(null);
          setActiveTabState('landing');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    setActiveTab('dashboard');
    addToast(`Welcome back, ${res.user.name}!`, 'success');
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await api.register(name, email, password);
    setUser(res.user);
    setActiveTab('dashboard');
    addToast('Account created successfully! Welcome to SkillBridge AI.', 'success');
  };

  const resetPassword = async (email: string, newPassword: string) => {
    const res = await api.resetPassword(email, newPassword);
    addToast(res.message || 'Password reset successfully. Please sign in.', 'success');
    return res.message;
  };

  const demoLogin = async () => {
    const res = await api.demoLogin();
    setUser(res.user);
    setActiveTab('dashboard');
    addToast('Demo student profile loaded with Stripe internship comparison and roadmap.', 'success');
  };

  const logout = () => {
    authStorage.clearToken();
    setUser(null);
    setActiveTab('landing');
    addToast('You have been logged out safely.', 'info');
  };

  const updateProfile = async (profile: Partial<StudentProfile>, name?: string) => {
    const res = await api.updateProfile(profile, name);
    setUser(res.user);
    addToast('Profile updated successfully!', 'success');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        resetPassword,
        demoLogin,
        logout,
        updateProfile,
        toasts,
        addToast,
        removeToast,
        activeTab,
        setActiveTab,
        tabMeta,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
