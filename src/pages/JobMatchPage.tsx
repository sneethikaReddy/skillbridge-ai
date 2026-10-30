import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ResumeRecord, JobMatchAnalysis } from '../types';
import {
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Building2,
  Check,
  ChevronRight,
  RefreshCw,
  BookOpen,
  Info,
  Layers,
  Award,
  Compass,
} from 'lucide-react';

export const JobMatchPage: React.FC = () => {
  const { addToast, setActiveTab, tabMeta } = useAuth();
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [internshipTitle, setInternshipTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [domain, setDomain] = useState('Full-Stack Software Engineering');
  const [jobDescription, setJobDescription] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<JobMatchAnalysis | null>(null);
  const [matchNotice, setMatchNotice] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState(false);

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const data = await api.getResumes();
        const validResumes = Array.isArray(data?.resumes)
          ? data.resumes.filter((r): r is ResumeRecord => Boolean(r && r.id))
          : [];
        setResumes(validResumes);
        if (validResumes.length > 0) {
          if (tabMeta?.resumeId) {
            setSelectedResumeId(tabMeta.resumeId);
          } else {
            setSelectedResumeId(validResumes[0].id);
          }
        }

        if (tabMeta?.analysisId) {
          const { analysis } = await api.getAnalysis(tabMeta.analysisId);
          setCurrentAnalysis(analysis);
          setInternshipTitle(analysis.internshipTitle);
          setCompanyName(analysis.companyName || '');
          setJobDescription(analysis.jobDescriptionText);
        }
      } catch (err: any) {
        console.error('Failed to load initial match data:', err);
      }
    };
    loadInitial();
  }, [tabMeta]);

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (analyzing) return;
    if (!selectedResumeId) {
      addToast('Please select or upload a resume first.', 'error');
      return;
    }
    if (!internshipTitle.trim()) {
      addToast('Please enter the internship title.', 'error');
      return;
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 50) {
      addToast('Please provide a complete job description with responsibilities and requirements (min 50 characters).', 'error');
      return;
    }

    setAnalyzing(true);
    setCurrentAnalysis(null);
    setMatchNotice(null);
    setIsQuotaError(false);
    try {
      const reqSkills = requiredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const prefSkills = preferredSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await api.createAnalysis({
        resumeId: selectedResumeId,
        internshipTitle,
        companyName,
        domain,
        jobDescriptionText: jobDescription,
        requiredSkillsSpecified: reqSkills,
        preferredSkillsSpecified: prefSkills,
      });

      setCurrentAnalysis(res.analysis);
      addToast('Internship qualification analysis completed successfully!', 'success');
      window.scrollTo({ top: 600, behavior: 'smooth' });
    } catch (err: any) {
      const isQuota =
        err?.code === 'QUOTA_EXHAUSTED' ||
        Boolean(err?.dailyQuota) ||
        err?.status === 429 ||
        err.message?.includes('daily quota') ||
        err.message?.includes('quota limit reached');
      setIsQuotaError(isQuota);
      setMatchNotice(err.message || 'Failed to analyze job match.');
      addToast(err.message || 'Failed to analyze job match.', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!currentAnalysis) return;
    setGeneratingRoadmap(true);
    try {
      const res = await api.generateRoadmap(currentAnalysis.id, true);
      addToast('Personalized learning roadmap created!', 'success');
      setActiveTab('roadmap', { roadmapId: res.roadmap.id });
    } catch (err: any) {
      addToast(err.message || 'Failed to generate roadmap.', 'error');
    } finally {
      setGeneratingRoadmap(false);
    }
  };

  // Quick Preset options
  const applyPreset = (preset: 'stripe' | 'notion' | 'frontend') => {
    if (preset === 'stripe') {
      setInternshipTitle('Full-Stack Software Engineering Intern');
      setCompanyName('Stripe');
      setDomain('Distributed Systems & Full-Stack');
      setRequiredSkills('TypeScript, React, Node.js, PostgreSQL, SQL, Data Structures & Algorithms, Git');
      setPreferredSkills('Redis, Docker, CI/CD, GraphQL, Systems Architecture');
      setJobDescription(`About Stripe:
Stripe builds economic infrastructure for the internet. Software engineering interns collaborate with senior engineers to design, build, and ship features across payments, billing, and fraud prevention.

Responsibilities:
- Build high-scale web applications in React, TypeScript, and Node.js.
- Implement reliable backend services and database schemas with PostgreSQL.
- Write thorough unit and integration test suites.
- Participate in design reviews, incident post-mortems, and deployment automation.

Requirements:
- Enrolled in B.S. or M.S. in Computer Science or related STEM degree.
- Hands-on web development experience in TypeScript, React, and Node.js or Python.
- Strong grounding in algorithms, data structures, and relational databases (SQL).
- Experience with Git version control and collaborative GitHub workflows.

Preferred:
- Familiarity with Redis in-memory caching and message queues.
- Exposure to containerization (Docker) and CI/CD pipelines.
- Knowledge of idempotent API design and distributed system principles.`);
    } else if (preset === 'notion') {
      setInternshipTitle('Product Engineering Intern');
      setCompanyName('Notion');
      setDomain('Product Engineering & Web Applications');
      setRequiredSkills('TypeScript, React, State Management, HTML/CSS, REST APIs');
      setPreferredSkills('Canvas, Performance Optimization, WebSockets, Next.js');
      setJobDescription(`Notion is crafting the connected workspace. We are looking for product engineering interns who care deeply about craft, design, and reliable software.

Responsibilities:
- Build intuitive document editing and collaborative features using React and TypeScript.
- Optimize frontend rendering performance and handle complex client-side state.
- Partner with designers to create tactile, responsive web experiences.

Requirements:
- Strong command of TypeScript and modern React patterns (Hooks, Context).
- Deep empathy for user experience and interface polish.
- Solid understanding of web performance, DOM rendering, and browser internals.

Preferred:
- Experience building rich text editors or real-time collaborative applications.
- Experience with WebSockets and offline-first storage.`);
    } else if (preset === 'frontend') {
      setInternshipTitle('Frontend Engineering Intern');
      setCompanyName('Datadog');
      setDomain('Frontend Web Applications');
      setRequiredSkills('JavaScript, TypeScript, React, CSS/Tailwind, Responsive Design, Testing');
      setPreferredSkills('Data Visualization (D3.js), Webpack/Vite, Accessibility');
      setJobDescription(`Datadog is the monitoring and security platform for cloud applications.

Responsibilities:
- Develop interactive data dashboards and telemetry graphs in React and TypeScript.
- Ensure high accessibility (a11y) standards across our web interfaces.
- Work with UX designers to translate wireframes into production components.

Requirements:
- Pursuing a degree in Computer Science, Software Engineering, or equivalent.
- Proficiency in modern JavaScript/TypeScript and React.
- Understanding of CSS architecture, responsive layout, and web accessibility.

Preferred:
- Familiarity with SVG, canvas, or D3 charting.
- Experience with component testing using Vitest or Jest.`);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Internship Job Description Matcher
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Compare your actual resume against any internship posting to calculate an objective match score and uncover skill gaps.
          </p>
        </div>
      </div>

      {/* AI Service & Quota Notice */}
      {matchNotice && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 flex flex-col sm:flex-row items-start justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-amber-950">
                {isQuotaError ? 'Google AI Studio Gemini API Daily Quota Reached' : 'AI Service Notice'}
              </p>
              <p className="mt-1 text-amber-900 leading-relaxed">{matchNotice}</p>
              {isQuotaError ? (
                <div className="mt-3 text-xs text-amber-950 bg-amber-100/80 p-3 rounded-xl space-y-1.5 border border-amber-200">
                  <p className="font-bold text-amber-900">How to resolve in Google AI Studio:</p>
                  <p>1. Open <span className="font-semibold">Google AI Studio</span> (aistudio.google.com) and check your project under <span className="font-semibold">Settings &gt; Plan & Billing</span>.</p>
                  <p>2. Link a billing account to switch to Pay-as-you-go (Tier 1) for unlimited daily requests, or generate a new Gemini API Key with active quota.</p>
                  <p>3. Update your <span className="font-mono bg-amber-200/60 px-1 py-0.5 rounded font-semibold">GEMINI_API_KEY</span> in the AI Studio Secrets panel.</p>
                  <p className="mt-1 text-amber-900 font-medium">Tip: If you re-evaluate a role with an existing analysis, SkillBridge AI serves it from local deduplication cache without consuming API quota!</p>
                </div>
              ) : (
                <p className="mt-1 text-xs text-amber-700">
                  You can retry now or choose a different role or sample preset to test.
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {!isQuotaError && (
              <button
                type="button"
                onClick={() => handleAnalyze()}
                disabled={analyzing}
                className="text-xs font-bold px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={() => setMatchNotice(null)}
              className="text-amber-800 hover:text-amber-950 text-xs font-bold px-2.5 py-1.5 hover:bg-amber-100 rounded-lg transition shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Input Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        {/* Quick Sample Presets */}
        <div className="flex items-center justify-between flex-wrap gap-2 pb-4 mb-5 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Quick Test Roles:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => applyPreset('stripe')}
              className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
            >
              Stripe (Full-Stack)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('notion')}
              className="px-2.5 py-1 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition cursor-pointer"
            >
              Notion (Product Eng)
            </button>
            <button
              type="button"
              onClick={() => applyPreset('frontend')}
              className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition cursor-pointer"
            >
              Datadog (Frontend)
            </button>
          </div>
        </div>

        <form onSubmit={handleAnalyze} className="space-y-5">
          {/* Resume Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              1. Select Resume to Evaluate
            </label>
            {resumes.length > 0 ? (
              <select
                value={selectedResumeId}
                onChange={(e) => setSelectedResumeId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                {resumes.filter((r): r is ResumeRecord => Boolean(r && r.id)).map((r) => {
                  const langsCount = (r.extractedData?.technicalSkills?.languages || []).length;
                  const projectsCount = (r.extractedData?.projects || []).length;
                  const candidateName = r.extractedData?.fullName || 'Student';
                  return (
                    <option key={r.id} value={r.id}>
                      {r.title || 'Untitled Resume'} ({candidateName} - {langsCount} langs, {projectsCount} projects)
                    </option>
                  );
                })}
              </select>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                <span>No resumes uploaded yet. Please upload a resume first.</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('resume')}
                  className="px-3 py-1 bg-amber-600 text-white font-semibold rounded-lg"
                >
                  Go to Resume Analyzer
                </button>
              </div>
            )}
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                2. Internship Role Title *
              </label>
              <input
                type="text"
                required
                value={internshipTitle}
                onChange={(e) => setInternshipTitle(e.target.value)}
                placeholder="e.g. Software Engineering Intern"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Company Name (Optional)
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe, Notion, Meta"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Internship Domain
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="Full-Stack Software Engineering">Full-Stack Software Engineering</option>
                <option value="Frontend Web Development">Frontend Web Development</option>
                <option value="Backend Infrastructure">Backend Infrastructure</option>
                <option value="Data Science & Analytics">Data Science & Analytics</option>
                <option value="Machine Learning / AI">Machine Learning / AI</option>
                <option value="Cloud / DevOps Engineering">Cloud / DevOps Engineering</option>
                <option value="Mobile App Development">Mobile App Development</option>
              </select>
            </div>
          </div>

          {/* Job Description Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              3. Full Internship Job Description *
            </label>
            <textarea
              required
              rows={8}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job posting from LinkedIn, company website, or Handshake (responsibilities, required qualifications, preferred tools)..."
              className="w-full px-3.5 py-2.5 text-sm font-sans bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white leading-relaxed"
            />
          </div>

          {/* Optional specific skill focus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Specific Required Skills (Optional, comma-separated)
              </label>
              <input
                type="text"
                value={requiredSkills}
                onChange={(e) => setRequiredSkills(e.target.value)}
                placeholder="e.g. React, TypeScript, SQL, Node.js"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Specific Preferred Skills (Optional, comma-separated)
              </label>
              <input
                type="text"
                value={preferredSkills}
                onChange={(e) => setPreferredSkills(e.target.value)}
                placeholder="e.g. Redis, Docker, GraphQL, AWS"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={analyzing || resumes.length === 0}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing…</span>
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  <span>Evaluate Skill Match & Gaps</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Analysis Results Display */}
      {currentAnalysis && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Score Summary Banner */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-md">
                    {currentAnalysis.companyName || 'Role'} Match Report
                  </span>
                  <span className="text-xs text-slate-400">
                    Evaluated with {currentAnalysis.resumeTitle}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                  {currentAnalysis.internshipTitle}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Track: {currentAnalysis.domain}
                </p>
              </div>

              {/* Match Score & Roadmap CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 justify-between sm:justify-start">
                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                      Match Readiness
                    </span>
                    <span className="text-[11px] text-slate-400">50/30/20 Weighted Score</span>
                  </div>
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm ${
                      currentAnalysis.overallMatchScore >= 75
                        ? 'bg-emerald-600 text-white'
                        : currentAnalysis.overallMatchScore >= 50
                        ? 'bg-amber-500 text-white'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {currentAnalysis.overallMatchScore}%
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateRoadmap}
                  disabled={generatingRoadmap}
                  className="px-5 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-2xl text-xs sm:text-sm transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {generatingRoadmap ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Designing Roadmap...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4" />
                      <span>Generate Learning Roadmap</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Score Derivation Breakdown */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Mathematical Derivation & Breakdown
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>1. Core Required Skills</span>
                    <span className="font-bold text-indigo-600">
                      {currentAnalysis.scoreBreakdown.coreSkillsScore}% (50% wt)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${currentAnalysis.scoreBreakdown.coreSkillsScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>2. Projects & Experience</span>
                    <span className="font-bold text-indigo-600">
                      {currentAnalysis.scoreBreakdown.experienceAndProjectsScore}% (30% wt)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${currentAnalysis.scoreBreakdown.experienceAndProjectsScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>3. Preferred & Education</span>
                    <span className="font-bold text-indigo-600">
                      {currentAnalysis.scoreBreakdown.preferredAndEducationScore}% (20% wt)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full"
                      style={{ width: `${currentAnalysis.scoreBreakdown.preferredAndEducationScore}%` }}
                    />
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                {currentAnalysis.scoreBreakdown.explanation}
              </p>

              <div className="mt-2 text-[11px] text-slate-400 italic">
                * Note: Score reflects alignment against the written job description criteria and does not predict official hiring outcomes.
              </div>
            </div>

            {/* Direct Call to action to generate roadmap */}
            <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-4 rounded-xl border border-indigo-100">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Turn Identified Skill Gaps into a Personalized Learning Roadmap
                </p>
                <p className="text-[11px] text-slate-600">
                  Generate a structured weekly study plan with free verified resources and mini-projects.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateRoadmap}
                disabled={generatingRoadmap}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {generatingRoadmap ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating Plan...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Learning Roadmap</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Side by side: Matching Skills vs Missing Skills */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Matching Skills */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Demonstrated Matching Skills ({currentAnalysis.matchingSkills.length})
                </h3>
              </div>

              <div className="space-y-3">
                {currentAnalysis.matchingSkills.map((match, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-100/80"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900">{match.skill}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {match.importance} priority
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800/90 mt-1.5 leading-relaxed font-sans">
                      <span className="font-semibold text-emerald-950">Evidence: </span>
                      {match.evidenceInResume}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Missing Required Skills */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Missing Required Skills ({currentAnalysis.missingRequiredSkills.length})
                </h3>
              </div>

              <div className="space-y-3">
                {currentAnalysis.missingRequiredSkills.length > 0 ? (
                  currentAnalysis.missingRequiredSkills.map((gap, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-rose-50/40 border border-rose-100/80"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-rose-900">{gap.skill}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                          {gap.difficultyToLearn}
                        </span>
                      </div>
                      <p className="text-xs text-rose-800/90 mt-1.5 leading-relaxed">
                        <span className="font-semibold text-rose-950">Why needed: </span>
                        {gap.reasonNeeded}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic p-3">
                    No major required skills missing! You meet all listed prerequisites.
                  </p>
                )}

                {/* Partially Matching */}
                {currentAnalysis.partiallyMatchingSkills.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-xs font-bold text-amber-900 mb-2">Partially Matching Skills</p>
                    {currentAnalysis.partiallyMatchingSkills.map((part, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-amber-50/40 border border-amber-100/80 mb-2"
                      >
                        <p className="text-xs font-bold text-amber-900">{part.skill}</p>
                        <p className="text-[11px] text-amber-800 mt-1">
                          <span className="font-semibold">Current level:</span> {part.studentHas} •{' '}
                          <span className="font-semibold">Gap:</span> {part.gapDescription}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Missing Preferred Skills */}
          {currentAnalysis.missingPreferredSkills.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Missing Preferred & Bonus Qualifications
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentAnalysis.missingPreferredSkills.map((pref, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-bold text-slate-800">{pref.skill}</p>
                    <p className="text-xs text-slate-600 mt-1">{pref.advantage}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-3">
                Key Strengths for this Role
              </h3>
              <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside">
                {currentAnalysis.strengths.map((str, i) => (
                  <li key={i} className="leading-relaxed">
                    {str}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-3">
                Identified Blind Spots & Weaknesses
              </h3>
              <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside">
                {currentAnalysis.weaknesses.map((wk, i) => (
                  <li key={i} className="leading-relaxed">
                    {wk}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Resume Improvements */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3">
              Actionable Resume Tailoring Suggestions
            </h3>
            <div className="space-y-2">
              {currentAnalysis.resumeImprovements.map((imp, i) => (
                <div key={i} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-700 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{imp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Roadmap Action Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-800/60 border border-indigo-700/60 text-indigo-200 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
                <span>Next Step: Skill Bridging</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Turn your {currentAnalysis.missingRequiredSkills.length} missing skill{currentAnalysis.missingRequiredSkills.length === 1 ? '' : 's'} into an actionable plan
              </h3>
              <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
                Generate a personalized, step-by-step learning roadmap tailored to {currentAnalysis.internshipTitle}. Includes verified free resources, practical coding deliverables, and a capstone portfolio project.
              </p>
            </div>
            <button
              type="button"
              onClick={handleGenerateRoadmap}
              disabled={generatingRoadmap}
              className="px-6 py-4 bg-white hover:bg-slate-100 text-indigo-900 font-bold rounded-xl text-sm transition shadow-lg shrink-0 flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {generatingRoadmap ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Synthesizing Roadmap...</span>
                </>
              ) : (
                <>
                  <Compass className="w-4 h-4 text-indigo-600" />
                  <span>Generate Learning Roadmap</span>
                  <ArrowRight className="w-4 h-4 text-indigo-500" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
