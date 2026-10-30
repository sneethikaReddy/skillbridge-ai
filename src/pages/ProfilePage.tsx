import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentProfile } from '../types';
import {
  UserCheck,
  GraduationCap,
  Sparkles,
  Save,
  CheckCircle2,
  BookOpen,
  Target,
  Plus,
  X,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile, addToast } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [college, setCollege] = useState(user?.profile?.college || '');
  const [degree, setDegree] = useState(user?.profile?.degree || '');
  const [branch, setBranch] = useState(user?.profile?.branch || '');
  const [graduationYear, setGraduationYear] = useState(user?.profile?.graduationYear || '');
  const [learningGoals, setLearningGoals] = useState(user?.profile?.learningGoals || '');

  const [currentSkills, setCurrentSkills] = useState<string[]>(user?.profile?.currentSkills || []);
  const [areasOfInterest, setAreasOfInterest] = useState<string[]>(user?.profile?.areasOfInterest || []);
  const [preferredDomains, setPreferredDomains] = useState<string[]>(user?.profile?.preferredDomains || []);

  const [newSkill, setNewSkill] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setCollege(user.profile.college || '');
      setDegree(user.profile.degree || '');
      setBranch(user.profile.branch || '');
      setGraduationYear(user.profile.graduationYear || '');
      setLearningGoals(user.profile.learningGoals || '');
      setCurrentSkills(user.profile.currentSkills || []);
      setAreasOfInterest(user.profile.areasOfInterest || []);
      setPreferredDomains(user.profile.preferredDomains || []);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedProfile: StudentProfile = {
        college,
        degree,
        branch,
        graduationYear,
        learningGoals,
        currentSkills,
        areasOfInterest,
        preferredDomains,
      };

      await updateProfile(updatedProfile, name);
    } catch (err: any) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addTag = (list: string[], setList: (l: string[]) => void, value: string, clearInput: () => void) => {
    if (!value.trim()) return;
    const clean = value.trim();
    if (!list.includes(clean)) {
      setList([...list, clean]);
    }
    clearInput();
  };

  const removeTag = (list: string[], setList: (l: string[]) => void, item: string) => {
    setList(list.filter((x) => x !== item));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-8">
      {/* Top Banner */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Student Profile & Career Goals
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Customize your academic details and career targets to personalize AI recommendations.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Personal & Academic Information</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">College / University</label>
              <input
                type="text"
                placeholder="e.g. Stanford University"
                value={college}
                onChange={(e) => setCollege(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Degree</label>
              <input
                type="text"
                placeholder="e.g. Bachelor of Science"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Branch / Specialization</label>
              <input
                type="text"
                placeholder="e.g. Computer Science, Systems & AI"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Graduation Year</label>
              <input
                type="text"
                placeholder="e.g. 2026 or 2027"
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Career & Skills Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Target className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Career Focus & Areas of Interest</h2>
          </div>

          {/* Current Skills Tags */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Current Core Skills
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {currentSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(currentSkills, setCurrentSkills, skill)}
                    className="text-indigo-400 hover:text-indigo-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="Add skill (e.g. Python, React)..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(currentSkills, setCurrentSkills, newSkill, () => setNewSkill(''));
                  }
                }}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg flex-1"
              />
              <button
                type="button"
                onClick={() => addTag(currentSkills, setCurrentSkills, newSkill, () => setNewSkill(''))}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Preferred Internship Domains */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Internship Domains
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {preferredDomains.map((domain) => (
                <span
                  key={domain}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100"
                >
                  <span>{domain}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(preferredDomains, setPreferredDomains, domain)}
                    className="text-purple-400 hover:text-purple-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 max-w-sm">
              <input
                type="text"
                placeholder="e.g. Full-Stack, AI/ML, Cloud Infrastructure..."
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag(preferredDomains, setPreferredDomains, newDomain, () => setNewDomain(''));
                  }
                }}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg flex-1"
              />
              <button
                type="button"
                onClick={() => addTag(preferredDomains, setPreferredDomains, newDomain, () => setNewDomain(''))}
                className="px-3 py-1.5 bg-purple-700 text-white rounded-lg text-xs font-semibold"
              >
                Add
              </button>
            </div>
          </div>

          {/* Learning Goals */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Primary Learning & Internship Goal
            </label>
            <textarea
              rows={3}
              value={learningGoals}
              onChange={(e) => setLearningGoals(e.target.value)}
              placeholder="e.g. Secure a Summer 2026 SWE internship at a tier-1 technology company by mastering system design and distributed databases..."
              className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
