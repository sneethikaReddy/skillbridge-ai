import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer } from './components/Toast';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResumePage } from './pages/ResumePage';
import { JobMatchPage } from './pages/JobMatchPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { ProgressPage } from './pages/ProgressPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';

import { AuthPage } from './pages/AuthPage';

function AppContent() {
  const { user, loading, activeTab, setActiveTab } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleOpenAuth = (mode: 'login' | 'register' = 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl mb-3 shadow-md animate-bounce">
          SB
        </div>
        <p className="text-sm font-semibold text-slate-700">Loading SkillBridge AI...</p>
      </div>
    );
  }

  // Dedicated Login / Register view when unauthenticated
  if (!user && (activeTab === 'login' || activeTab === 'register')) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased">
        <Navbar
          onOpenAuth={handleOpenAuth}
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        <main className="flex-1">
          <AuthPage initialMode={activeTab === 'register' ? 'register' : 'login'} />
        </main>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultMode={authModalMode}
        />
        <ToastContainer />
      </div>
    );
  }

  // Show public landing page if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased">
        <Navbar
          onOpenAuth={handleOpenAuth}
          onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        <main className="flex-1">
          <LandingPage onOpenAuth={handleOpenAuth} />
        </main>
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultMode={authModalMode}
        />
        <ToastContainer />
      </div>
    );
  }

  // Authenticated workspace shell
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 antialiased">
      <Navbar
        onOpenAuth={handleOpenAuth}
        onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        <Sidebar
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />

        <main className="flex-1 min-w-0 pb-16 overflow-x-hidden">
          {activeTab === 'dashboard' && <DashboardPage />}
          {activeTab === 'resume' && <ResumePage />}
          {activeTab === 'job-match' && <JobMatchPage />}
          {activeTab === 'roadmap' && <RoadmapPage />}
          {activeTab === 'progress' && <ProgressPage />}
          {activeTab === 'history' && <HistoryPage />}
          {activeTab === 'profile' && <ProfilePage />}
          {activeTab === 'landing' && user && <DashboardPage />}
        </main>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authModalMode}
      />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
