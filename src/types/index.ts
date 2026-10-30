export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  profile: StudentProfile;
}

export interface StudentProfile {
  college?: string;
  degree?: string;
  branch?: string;
  graduationYear?: string;
  currentSkills: string[];
  areasOfInterest: string[];
  preferredDomains: string[];
  learningGoals: string;
}

export interface ExtractedResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  technicalSkills: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    other: string[];
  };
  softSkills: string[];
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
    gpa?: string;
  }>;
  experience: Array<{
    company: string;
    role: string;
    duration: string;
    location?: string;
    bullets: string[];
  }>;
  projects: Array<{
    name: string;
    techStack: string[];
    description: string;
    highlights: string[];
    link?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    year?: string;
  }>;
  rawTextPreview: string;
  extractionNotes?: string[];
}

export interface ResumeRecord {
  id: string;
  userId: string;
  title: string;
  fileName?: string;
  fileSizeBytes?: number;
  uploadedAt: string;
  updatedAt: string;
  extractedData: ExtractedResumeData;
  rawText: string;
}

export interface JobMatchAnalysis {
  id: string;
  userId: string;
  resumeId: string;
  resumeTitle: string;
  internshipTitle: string;
  companyName: string;
  domain: string;
  jobDescriptionText: string;
  requiredSkillsSpecified: string[];
  preferredSkillsSpecified: string[];
  createdAt: string;
  updatedAt: string;

  overallMatchScore: number;
  scoreBreakdown: {
    coreSkillsScore: number;
    experienceAndProjectsScore: number;
    preferredAndEducationScore: number;
    explanation: string;
  };
  matchingSkills: Array<{
    skill: string;
    evidenceInResume: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  partiallyMatchingSkills: Array<{
    skill: string;
    studentHas: string;
    gapDescription: string;
  }>;
  missingRequiredSkills: Array<{
    skill: string;
    reasonNeeded: string;
    difficultyToLearn: 'Beginner' | 'Intermediate' | 'Advanced';
  }>;
  missingPreferredSkills: Array<{
    skill: string;
    advantage: string;
  }>;
  strengths: string[];
  weaknesses: string[];
  resumeImprovements: string[];
  actionableSteps: string[];
}

export interface CareerRecommendation {
  role: string;
  matchScore: number;
  matchReason: string;
  existingStrengths: string[];
  skillsToAcquire: string[];
  sampleCompanies: string[];
  recommendedPhasesSummary: string;
}

export interface RoadmapPhase {
  phaseNumber: number;
  title: string;
  description: string;
  durationWeeks?: number;
  prerequisites?: string[];
}

export interface FinalPortfolioProject {
  title: string;
  description: string;
  techStack: string[];
  deliverables: string[];
  completionCriteria: string;
}

export interface PrioritizedSkill {
  skill: string;
  priority: 'High' | 'Medium' | 'Low';
  reason: string;
  category?: string;
}

export interface RoadmapTask {
  id: string;
  weekNumber: number;
  phaseTitle?: string;
  skill: string;
  title: string;
  importanceReason: string;
  learningObjective: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedDuration: string;
  completionCriteria?: string;
  recommendedResource: {
    name: string;
    url: string;
    type: 'Documentation' | 'Course' | 'Tutorial' | 'Interactive' | 'Project Guide';
    isFree: boolean;
  };
  practiceProject: {
    title: string;
    description: string;
    deliverable: string;
  };
  prerequisites: string[];
  status: 'not_started' | 'in_progress' | 'completed';
  targetDate?: string;
  studentNotes?: string;
  completedAt?: string;
}

export interface LearningRoadmap {
  id: string;
  userId: string;
  analysisId?: string;
  internshipTitle: string;
  companyName?: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  targetCompletionWeeks: number;
  summary: string;
  currentStrengths?: string[];
  prioritizedSkills?: PrioritizedSkill[];
  phases?: RoadmapPhase[];
  finalPortfolioProject?: FinalPortfolioProject;
  tasks: RoadmapTask[];
}

export interface DashboardStats {
  resumesCount: number;
  analysesCount: number;
  skillGapsCount: number;
  tasksCompletedCount: number;
  totalTasksCount: number;
  overallProgressPercentage: number;
  recentAnalyses: JobMatchAnalysis[];
  recentRoadmaps: LearningRoadmap[];
  activeRoadmap: LearningRoadmap | null;
}
