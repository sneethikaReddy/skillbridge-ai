import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { ResumeRecord, ExtractedResumeData } from '../types';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  Save,
  Eye,
  FileCheck,
  Code,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Award,
  Sparkles,
  ArrowRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { ConfirmationModal } from '../components/ConfirmationModal';

export const ResumePage: React.FC = () => {
  const { addToast, setActiveTab } = useAuth();
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadTab, setUploadTab] = useState<'pdf' | 'text'>('pdf');

  // Text upload form state
  const [textTitle, setTextTitle] = useState('');
  const [textContent, setTextContent] = useState('');

  // Editing extracted data state
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<ExtractedResumeData | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // New skill chip input
  const [newLanguage, setNewLanguage] = useState('');
  const [newFramework, setNewFramework] = useState('');
  const [newDatabase, setNewDatabase] = useState('');
  const [newTool, setNewTool] = useState('');

  // Deletion modal
  const [deleteResumeId, setDeleteResumeId] = useState<string | null>(null);

  // AI Service notice state
  const [serviceNotice, setServiceNotice] = useState<string | null>(null);
  const [isQuotaError, setIsQuotaError] = useState<boolean>(false);
  const [lastAttemptType, setLastAttemptType] = useState<'pdf' | 'text' | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResumes = async () => {
    try {
      const data = await api.getResumes();
      const valid = Array.isArray(data?.resumes)
        ? data.resumes.filter((r): r is ResumeRecord => Boolean(r && r.id))
        : [];
      setResumes(valid);
      if (valid.length > 0 && !selectedResume) {
        setSelectedResume(valid[0]);
        if (valid[0].extractedData) {
          setEditedData(JSON.parse(JSON.stringify(valid[0].extractedData)));
        }
      }
    } catch (err: any) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  useEffect(() => {
    if (selectedResume?.extractedData) {
      setEditedData(JSON.parse(JSON.stringify(selectedResume.extractedData)));
      setIsEditing(false);
    } else if (!selectedResume) {
      setEditedData(null);
      setIsEditing(false);
    }
  }, [selectedResume]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uploading) return;
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      addToast('Only PDF files are supported. Please select a valid .pdf resume.', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addToast('File size exceeds the 10MB limit. Please upload a smaller PDF.', 'error');
      return;
    }

    setUploading(true);
    setServiceNotice(null);
    setIsQuotaError(false);
    setLastAttemptType('pdf');
    try {
      const res = await api.uploadResumePdf(file);
      addToast('PDF uploaded and skills extracted successfully with Gemini AI!', 'success');
      setResumes((prev) => [res.resume, ...prev]);
      setSelectedResume(res.resume);
      setEditedData(res.resume.extractedData);
      setServiceNotice(null);
    } catch (err: any) {
      const isQuota =
        err?.code === 'QUOTA_EXHAUSTED' ||
        Boolean(err?.dailyQuota) ||
        err?.status === 429 ||
        err.message?.includes('daily quota') ||
        err.message?.includes('quota limit reached');
      setIsQuotaError(isQuota);
      setServiceNotice(err.message || 'Failed to upload and parse PDF resume');
      addToast(err.message || 'Failed to upload and parse PDF resume', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleTextUpload = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (uploading) return;
    if (!textContent.trim() || textContent.trim().length < 40) {
      addToast('Please enter full resume text with sufficient details to extract (minimum 40 characters).', 'error');
      return;
    }

    setUploading(true);
    setServiceNotice(null);
    setIsQuotaError(false);
    setLastAttemptType('text');
    try {
      const res = await api.uploadResumeText(textTitle || 'Pasted Resume', textContent);
      addToast('Resume text analyzed and structured successfully!', 'success');
      setResumes((prev) => [res.resume, ...prev]);
      setSelectedResume(res.resume);
      setEditedData(res.resume.extractedData);
      setTextTitle('');
      setTextContent('');
      setServiceNotice(null);
    } catch (err: any) {
      const isQuota =
        err?.code === 'QUOTA_EXHAUSTED' ||
        Boolean(err?.dailyQuota) ||
        err?.status === 429 ||
        err.message?.includes('daily quota') ||
        err.message?.includes('quota limit reached');
      setIsQuotaError(isQuota);
      setServiceNotice(err.message || 'Failed to analyze resume text');
      addToast(err.message || 'Failed to analyze resume text', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!selectedResume || !editedData) return;
    setSavingEdit(true);
    try {
      const res = await api.updateResume(selectedResume.id, {
        extractedData: editedData,
      });
      setSelectedResume(res.resume);
      setResumes((prev) => prev.map((r) => (r.id === res.resume.id ? res.resume : r)));
      setIsEditing(false);
      addToast('Resume details updated and saved successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save edits', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!deleteResumeId) return;
    try {
      await api.deleteResume(deleteResumeId);
      addToast('Resume deleted successfully', 'info');
      const updated = resumes.filter((r) => r.id !== deleteResumeId);
      setResumes(updated);
      if (selectedResume?.id === deleteResumeId) {
        setSelectedResume(updated[0] || null);
      }
    } catch (err: any) {
      addToast(err.message || 'Failed to delete resume', 'error');
    } finally {
      setDeleteResumeId(null);
    }
  };

  const addSkillChip = (category: 'languages' | 'frameworks' | 'databases' | 'tools', value: string) => {
    if (!value.trim() || !editedData) return;
    const cleanVal = value.trim();
    const currentList = editedData.technicalSkills?.[category] || [];
    if (!currentList.includes(cleanVal)) {
      setEditedData({
        ...editedData,
        technicalSkills: {
          languages: editedData.technicalSkills?.languages || [],
          frameworks: editedData.technicalSkills?.frameworks || [],
          databases: editedData.technicalSkills?.databases || [],
          tools: editedData.technicalSkills?.tools || [],
          other: editedData.technicalSkills?.other || [],
          [category]: [...currentList, cleanVal],
        },
      });
    }
  };

  const removeSkillChip = (category: 'languages' | 'frameworks' | 'databases' | 'tools', value: string) => {
    if (!editedData) return;
    const currentList = editedData.technicalSkills?.[category] || [];
    setEditedData({
      ...editedData,
      technicalSkills: {
        languages: editedData.technicalSkills?.languages || [],
        frameworks: editedData.technicalSkills?.frameworks || [],
        databases: editedData.technicalSkills?.databases || [],
        tools: editedData.technicalSkills?.tools || [],
        other: editedData.technicalSkills?.other || [],
        [category]: currentList.filter((s) => s !== value),
      },
    });
  };

  const fillSampleResumeText = () => {
    setTextTitle('Alex Chen - CS Junior Resume');
    setTextContent(`Alex Chen
alex.chen@stanford.edu | (555) 234-5678 | Stanford, CA | github.com/alexchen-dev

EDUCATION
Stanford University
B.S. in Computer Science (Expected June 2026) | GPA: 3.82
Coursework: Algorithms, Operating Systems, Web Architecture, Relational Databases

TECHNICAL SKILLS
Languages: Python, TypeScript, JavaScript, SQL (PostgreSQL), C++
Frameworks: React, Node.js, Express, Tailwind CSS, Next.js
Databases & Tools: PostgreSQL, SQLite, MongoDB, Git, Postman, Jest, Linux

EXPERIENCE
ByteCrafters Labs - Software Engineering Intern (Summer 2025)
- Built interactive frontend user interfaces using React, TypeScript, and Tailwind CSS.
- Developed backend REST API endpoints with Node.js and Express, improving query speeds by 18%.
- Wrote automated unit and integration tests with Jest, achieving 84% test coverage.

PROJECTS
TaskFlow: Full-stack real-time project management tool built with React, TypeScript, Node.js, and WebSocket.
CampusEats: Multi-restaurant food ordering portal built with React, Node.js, and PostgreSQL.`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Resume Analyzer & Skill Extractor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload your PDF or paste text to extract technical skills, projects, and coursework for internship evaluation.
          </p>
        </div>

        {selectedResume && (
          <button
            onClick={() => setActiveTab('job-match', { resumeId: selectedResume.id })}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <span>Match With Internship</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* AI Service Availability & Quota Notice */}
      {serviceNotice && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-950 flex flex-col sm:flex-row items-start justify-between gap-4 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-amber-950">
                {isQuotaError ? 'Google AI Studio Gemini API Daily Quota Reached' : 'AI Service Notice'}
              </p>
              <p className="mt-1 text-amber-900 leading-relaxed">{serviceNotice}</p>
              {isQuotaError ? (
                <div className="mt-3 text-xs text-amber-950 bg-amber-100/80 p-3 rounded-xl space-y-1.5 border border-amber-200">
                  <p className="font-bold text-amber-900">How to resolve in Google AI Studio:</p>
                  <p>1. Open <span className="font-semibold">Google AI Studio</span> (aistudio.google.com) and check your project under <span className="font-semibold">Settings &gt; Plan & Billing</span>.</p>
                  <p>2. Link a billing account to switch to Pay-as-you-go (Tier 1) for unlimited daily requests, or generate a new Gemini API Key with active quota.</p>
                  <p>3. Update your <span className="font-mono bg-amber-200/60 px-1 py-0.5 rounded font-semibold">GEMINI_API_KEY</span> in the AI Studio Secrets panel.</p>
                  <p className="mt-1 text-amber-900 font-medium">Tip: You can continue exploring with the preloaded Demo Student account or manually edit existing extracted skills below!</p>
                </div>
              ) : (
                <p className="mt-1 text-xs text-amber-700">
                  You can retry now or edit existing extracted skills below without making a new AI request.
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {!isQuotaError && lastAttemptType && (
              <button
                type="button"
                onClick={lastAttemptType === 'pdf' ? () => fileInputRef.current?.click() : () => handleTextUpload()}
                disabled={uploading}
                className="text-xs font-bold px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={() => setServiceNotice(null)}
              className="text-amber-800 hover:text-amber-950 text-xs font-bold px-2.5 py-1.5 hover:bg-amber-100 rounded-lg transition shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Upload Box Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (!uploading) setUploadTab('pdf');
              }}
              disabled={uploading}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                uploadTab === 'pdf' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              } disabled:opacity-50`}
            >
              Upload PDF File
            </button>
            <button
              onClick={() => {
                if (!uploading) setUploadTab('text');
              }}
              disabled={uploading}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                uploadTab === 'text' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              } disabled:opacity-50`}
            >
              Paste Resume Text
            </button>
          </div>

          {uploadTab === 'text' && (
            <button
              type="button"
              disabled={uploading}
              onClick={fillSampleResumeText}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fill Sample Text</span>
            </button>
          )}
        </div>

        {uploadTab === 'pdf' ? (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="application/pdf"
              className="hidden"
              disabled={uploading}
            />
            <div
              onClick={() => {
                if (!uploading) fileInputRef.current?.click();
              }}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition ${
                uploading
                  ? 'border-indigo-400 bg-indigo-50/50 cursor-wait pointer-events-none'
                  : 'border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/20'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                {uploading ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>

              <h3 className="text-base font-bold text-slate-800">
                {uploading ? 'Analyzing…' : 'Click to select or drop your PDF resume'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                {uploading
                  ? 'Extracting technical skills, projects, and education with Gemini AI. Please wait…'
                  : 'Supports standard text and scanned PDF documents up to 10MB.'}
              </p>
              <span className="inline-block mt-3 px-3 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 rounded-full">
                Fast & Private Processing
              </span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleTextUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Resume Title / Identifier
              </label>
              <input
                type="text"
                value={textTitle}
                disabled={uploading}
                onChange={(e) => setTextTitle(e.target.value)}
                placeholder="e.g. Maya_Patel_FullStack_2026"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Resume Content (paste text directly)
              </label>
              <textarea
                rows={8}
                value={textContent}
                disabled={uploading}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste the plain text of your resume here including contact details, education, technical skills, projects, and work experience..."
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white leading-relaxed disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={uploading || textContent.trim().length < 40}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extract Skills with Gemini</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Resumes Selector and Viewer */}
      {resumes.filter((r): r is ResumeRecord => Boolean(r && r.id)).length > 0 && (
        <div className="space-y-6">
          {/* Resume Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {resumes
              .filter((r): r is ResumeRecord => Boolean(r && r.id))
              .map((resume) => (
                <div
                  key={resume.id}
                  onClick={() => setSelectedResume(resume)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer shrink-0 ${
                    selectedResume?.id === resume.id
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate max-w-[180px]">{resume.title || 'Untitled Resume'}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteResumeId(resume.id);
                    }}
                    className={`p-1 rounded hover:bg-black/10 transition ${
                      selectedResume?.id === resume.id ? 'text-white' : 'text-slate-400 hover:text-rose-600'
                    }`}
                    title="Delete resume"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
          </div>

          {/* Active Resume Extracted Information Display */}
          {selectedResume && editedData && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              {/* Header Bar */}
              <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">{selectedResume.title}</h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Uploaded on {new Date(selectedResume.uploadedAt).toLocaleDateString()} • {editedData.fullName || 'Candidate'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditedData(JSON.parse(JSON.stringify(selectedResume.extractedData)));
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdits}
                        disabled={savingEdit}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Review & Edit Skills</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Extraction Warnings or Notes */}
              {editedData.extractionNotes && editedData.extractionNotes.length > 0 && (
                <div className="p-4 bg-amber-50/70 border-b border-amber-100 text-xs text-amber-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Extraction Notice: </span>
                    {editedData.extractionNotes.join('; ')}
                  </div>
                </div>
              )}

              {/* Information Cards Grid */}
              <div className="p-5 sm:p-6 space-y-6">
                {/* Contact and Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Candidate Details
                    </p>
                    <div className="space-y-1.5 text-xs">
                      <p>
                        <span className="font-semibold text-slate-700">Name:</span>{' '}
                        {editedData.fullName || 'Not specified'}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Email:</span>{' '}
                        {editedData.email || 'Not specified'}
                      </p>
                      <p>
                        <span className="font-semibold text-slate-700">Location:</span>{' '}
                        {editedData.location || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Professional Summary
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      "{editedData.summary || 'No explicit summary found in resume.'}"
                    </p>
                  </div>
                </div>

                {/* Technical Skills Categorized */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Code className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Extracted Technical Skills</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Programming Languages */}
                    <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">Languages</span>
                        <span className="text-[10px] text-slate-400">
                          {(editedData.technicalSkills?.languages || []).length} detected
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(editedData.technicalSkills?.languages || []).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100"
                          >
                            <span>{skill}</span>
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => removeSkillChip('languages', skill)}
                                className="text-indigo-400 hover:text-indigo-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="mt-2 flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Add language..."
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addSkillChip('languages', newLanguage);
                                setNewLanguage('');
                              }
                            }}
                            className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              addSkillChip('languages', newLanguage);
                              setNewLanguage('');
                            }}
                            className="px-2 py-1 bg-indigo-600 text-white rounded text-xs"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Frameworks & Libraries */}
                    <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">Frameworks & Libraries</span>
                        <span className="text-[10px] text-slate-400">
                          {(editedData.technicalSkills?.frameworks || []).length} detected
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(editedData.technicalSkills?.frameworks || []).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100"
                          >
                            <span>{skill}</span>
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => removeSkillChip('frameworks', skill)}
                                className="text-purple-400 hover:text-purple-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="mt-2 flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Add framework..."
                            value={newFramework}
                            onChange={(e) => setNewFramework(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addSkillChip('frameworks', newFramework);
                                setNewFramework('');
                              }
                            }}
                            className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              addSkillChip('frameworks', newFramework);
                              setNewFramework('');
                            }}
                            className="px-2 py-1 bg-purple-600 text-white rounded text-xs"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Databases */}
                    <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">Databases & Storage</span>
                        <span className="text-[10px] text-slate-400">
                          {(editedData.technicalSkills?.databases || []).length} detected
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(editedData.technicalSkills?.databases || []).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
                          >
                            <span>{skill}</span>
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => removeSkillChip('databases', skill)}
                                className="text-blue-400 hover:text-blue-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="mt-2 flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Add database..."
                            value={newDatabase}
                            onChange={(e) => setNewDatabase(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addSkillChip('databases', newDatabase);
                                setNewDatabase('');
                              }
                            }}
                            className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              addSkillChip('databases', newDatabase);
                              setNewDatabase('');
                            }}
                            className="px-2 py-1 bg-blue-600 text-white rounded text-xs"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Developer Tools */}
                    <div className="p-4 rounded-xl border border-slate-200/80 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700">Developer Tools & DevOps</span>
                        <span className="text-[10px] text-slate-400">
                          {(editedData.technicalSkills?.tools || []).length} detected
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(editedData.technicalSkills?.tools || []).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100"
                          >
                            <span>{skill}</span>
                            {isEditing && (
                              <button
                                type="button"
                                onClick={() => removeSkillChip('tools', skill)}
                                className="text-emerald-400 hover:text-emerald-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      {isEditing && (
                        <div className="mt-2 flex gap-1.5">
                          <input
                            type="text"
                            placeholder="Add tool..."
                            value={newTool}
                            onChange={(e) => setNewTool(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addSkillChip('tools', newTool);
                                setNewTool('');
                              }
                            }}
                            className="text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              addSkillChip('tools', newTool);
                              setNewTool('');
                            }}
                            className="px-2 py-1 bg-emerald-600 text-white rounded text-xs"
                          >
                            Add
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Education */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Education</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(editedData.education || []).length > 0 ? (
                      (editedData.education || []).map((edu, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white">
                          <p className="text-xs font-bold text-slate-900">{edu.institution}</p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {edu.degree} in {edu.field}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Graduation: {edu.graduationDate} {edu.gpa ? `• GPA: ${edu.gpa}` : ''}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No formal education entries extracted.</p>
                    )}
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FolderGit2 className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">Demonstrated Projects</h3>
                  </div>
                  <div className="space-y-3">
                    {(editedData.projects || []).length > 0 ? (
                      (editedData.projects || []).map((proj, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{proj.name}</span>
                            <div className="flex gap-1">
                              {proj.techStack?.map((t) => (
                                <span
                                  key={t}
                                  className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                          {proj.description && (
                            <p className="text-xs text-slate-600 mt-1.5">{proj.description}</p>
                          )}
                          {proj.highlights && proj.highlights.length > 0 && (
                            <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-slate-500">
                              {proj.highlights.map((h, i) => (
                                <li key={i}>{h}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">No specific projects detected.</p>
                    )}
                  </div>
                </div>

                {/* Work Experience */}
                {(editedData.experience || []).length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <h3 className="text-sm font-bold text-slate-900">Experience</h3>
                    </div>
                    <div className="space-y-3">
                      {(editedData.experience || []).map((exp, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">
                              {exp.role} @ {exp.company}
                            </span>
                            <span className="text-[11px] text-slate-400">{exp.duration}</span>
                          </div>
                          {exp.bullets && exp.bullets.length > 0 && (
                            <ul className="mt-2 space-y-1 list-disc list-inside text-xs text-slate-600">
                              {exp.bullets.map((b, i) => (
                                <li key={i}>{b}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal for deleting resume */}
      <ConfirmationModal
        isOpen={!!deleteResumeId}
        title="Delete Resume"
        message="Are you sure you want to delete this resume? Saved job evaluations linked to this resume will remain in history."
        confirmLabel="Delete Resume"
        onConfirm={handleDeleteResume}
        onCancel={() => setDeleteResumeId(null)}
      />
    </div>
  );
};
