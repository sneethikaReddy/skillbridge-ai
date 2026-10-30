import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';
import { db } from './server/db';
import { extractTextFromPdf } from './server/pdf';
import {
  parseResumeWithAI,
  parseResumePdfWithAI,
  analyzeJobMatchWithAI,
  generateRoadmapWithAI,
  recommendCareersFromResume,
  generateTargetJobRoadmapWithAI,
  generateCareerRoadmapWithAI,
} from './server/ai';
import { User, ResumeRecord, JobMatchAnalysis, LearningRoadmap, RoadmapTask } from './server/types';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS middleware for iframe preview support
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// Extend Express Request for authenticated user
export interface AuthenticatedRequest extends Request {
  user?: User;
}

// Authentication helper & middleware
function createToken(userId: string): string {
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
}

function decodeToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId] = decoded.split(':');
    return userId || null;
  } catch {
    return null;
  }
}

const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const userId = decodeToken(token);
  if (!userId) {
    res.status(401).json({ error: 'Invalid or expired session token.' });
    return;
  }

  const user = db.findUserById(userId);
  if (!user) {
    res.status(401).json({ error: 'User account not found.' });
    return;
  }

  req.user = user;
  next();
};

// ==================== HEALTH & DIAGNOSTICS ====================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// ==================== AUTHENTICATION ROUTES ====================
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  const existing = db.findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const newUser: User = {
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: password, // In production MVP, simplified safe storage
    createdAt: new Date().toISOString(),
    profile: {
      currentSkills: [],
      areasOfInterest: [],
      preferredDomains: [],
      learningGoals: '',
    },
  };

  db.createUser(newUser);
  const token = createToken(newUser.id);
  const { passwordHash: _, ...safeUser } = newUser;
  return res.status(201).json({ token, user: safeUser });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.findUserByEmail(email);
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = createToken(user.id);
  const { passwordHash: _, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({ error: 'Email and new password are required.' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
  }

  const success = db.updateUserPassword(email.trim().toLowerCase(), newPassword);
  if (!success) {
    return res.status(404).json({ error: 'No account associated with this email address was found.' });
  }

  return res.json({ message: 'Password has been successfully reset. You can now sign in with your new password.' });
});

// Demo login - instant 1-click access with populated data
app.post('/api/auth/demo', (req, res) => {
  const demoEmail = 'alex.chen@stanford.edu';
  let user = db.findUserByEmail(demoEmail);

  if (!user) {
    user = {
      id: 'demo-student-alex',
      name: 'Alex Chen',
      email: demoEmail,
      passwordHash: 'demo1234',
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      profile: {
        college: 'Stanford University',
        degree: 'Bachelor of Science',
        branch: 'Computer Science',
        graduationYear: '2026',
        currentSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Python', 'Git'],
        areasOfInterest: ['Full-Stack Systems', 'Cloud Infrastructure', 'Fintech APIs'],
        preferredDomains: ['Full-Stack Software Engineering', 'Backend Infrastructure'],
        learningGoals: 'Secure a Summer 2026 Software Engineering Internship at a premier tech firm.',
      },
    };
    db.createUser(user);
    db.seedDemoData(user.id);
  }

  const token = createToken(user.id);
  const { passwordHash: _, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const { passwordHash: _, ...safeUser } = req.user!;
  res.json({ user: safeUser });
});

app.put('/api/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  const { name, profile } = req.body;
  const updatedUser = db.updateUserProfile(req.user!.id, profile || {}, name);
  if (!updatedUser) {
    return res.status(404).json({ error: 'User not found' });
  }
  const { passwordHash: _, ...safeUser } = updatedUser;
  res.json({ user: safeUser });
});

// Helper for graceful, informative AI error responses
function handleAiRouteError(res: express.Response, err: any, actionDescription: string) {
  console.error(`${actionDescription} error:`, err);
  const msg = String(err?.message || err || 'An unexpected error occurred.');
  if (
    msg.includes('daily quota') ||
    msg.includes('per day limit') ||
    msg.includes('daily limit') ||
    msg.includes('Free Tier limit: 20') ||
    msg.includes('Quota exceeded for metric') ||
    msg.includes('GenerateRequestsPerDay')
  ) {
    return res.status(429).json({
      error: 'Google AI Studio Gemini API daily quota limit reached (Free Tier limit: 20 requests/day). Please upgrade your Cloud project in Google AI Studio or provide a billing-enabled key, or wait for the daily quota to reset.',
      code: 'QUOTA_EXHAUSTED',
      retryable: false,
      dailyQuota: true,
    });
  }
  if (
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('high traffic') ||
    msg.includes('high demand') ||
    msg.includes('temporarily experiencing')
  ) {
    return res.status(503).json({
      error: 'The Gemini AI service is temporarily experiencing high traffic (503 Service Unavailable). Please retry in a few moments.',
      code: 'SERVICE_UNAVAILABLE',
      retryable: true,
    });
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('rate limit')) {
    return res.status(429).json({
      error: 'AI request rate limit reached. Please wait a brief moment and try again.',
      code: 'RATE_LIMITED',
      retryable: true,
    });
  }
  if (msg.includes('Timeout') || msg.includes('timed out')) {
    return res.status(504).json({
      error: 'AI request timed out. Please try again with shorter text.',
      code: 'TIMEOUT',
      retryable: true,
    });
  }
  return res.status(500).json({
    error: msg || `Failed to ${actionDescription.toLowerCase()}.`,
    code: 'INTERNAL_ERROR',
  });
}

// ==================== RESUME ROUTES ====================
app.get('/api/resumes', requireAuth, (req: AuthenticatedRequest, res) => {
  const resumes = db.getResumes(req.user!.id);
  res.json({ resumes });
});

app.get('/api/resumes/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const resume = db.getResumeById(req.params.id, req.user!.id);
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }
  res.json({ resume });
});

// PDF upload endpoint (supports both text PDFs and scanned/image PDFs)
app.post('/api/resumes/upload', requireAuth, upload.single('resumeFile'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a PDF resume.' });
    }

    const isPdf =
      req.file.mimetype === 'application/pdf' ||
      req.file.originalname.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return res.status(400).json({ error: 'Invalid file format. Only PDF files (.pdf) are supported.' });
    }

    // Attempt text extraction using pdf-parse
    const { text, numPages, isScannedOrEmpty, notes } = await extractTextFromPdf(req.file.buffer);

    let extractedData: any;
    let finalRawText = text;

    if (isScannedOrEmpty) {
      // Scanned or image-only PDF: process using Gemini multimodal document vision
      try {
        extractedData = await parseResumePdfWithAI(req.file.buffer);
        if (notes) {
          extractedData.extractionNotes = [...(extractedData.extractionNotes || []), notes, 'Processed via multimodal document vision'];
        }
        finalRawText = extractedData.rawTextPreview || 'Scanned PDF document parsed via vision';
      } catch (pdfVisionErr: any) {
        const vMsg = String(pdfVisionErr?.message || pdfVisionErr);
        if (vMsg.includes('daily quota') || vMsg.includes('per day limit') || vMsg.includes('429')) {
          throw pdfVisionErr;
        }
        return res.status(422).json({
          error: notes || 'The uploaded PDF appears to be a scanned image or empty. Please use the Manual Text Entry option.',
          isScanned: true,
        });
      }
    } else {
      // Standard text-based PDF: parse extracted text with Gemini AI
      extractedData = await parseResumeWithAI(text);
      if (notes) {
        extractedData.extractionNotes = [...(extractedData.extractionNotes || []), notes];
      }
    }

    const resumeRecord: ResumeRecord = {
      id: `resume-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user!.id,
      title: req.file.originalname,
      fileName: req.file.originalname,
      fileSizeBytes: req.file.size,
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extractedData,
      rawText: finalRawText,
    };

    db.saveResume(resumeRecord);
    res.status(201).json({ resume: resumeRecord });
  } catch (err: any) {
    handleAiRouteError(res, err, 'Resume upload and extraction');
  }
});

// Manual text entry endpoint
app.post('/api/resumes/text', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { title, text } = req.body;
    if (!text || text.trim().length < 40) {
      return res.status(400).json({ error: 'Resume text is too short. Please provide comprehensive resume content.' });
    }

    const extractedData = await parseResumeWithAI(text);

    const resumeRecord: ResumeRecord = {
      id: `resume-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user!.id,
      title: (title || `${extractedData.fullName || 'Student'} Resume`).trim(),
      uploadedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      extractedData,
      rawText: text,
    };

    db.saveResume(resumeRecord);
    res.status(201).json({ resume: resumeRecord });
  } catch (err: any) {
    handleAiRouteError(res, err, 'Resume text parsing');
  }
});

// Update extracted resume details (student review / corrections)
app.put('/api/resumes/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const { title, extractedData } = req.body;
  const resume = db.getResumeById(req.params.id, req.user!.id);
  if (!resume) {
    return res.status(404).json({ error: 'Resume not found' });
  }

  if (title) resume.title = title.trim();
  if (extractedData) {
    resume.extractedData = extractedData;
  }
  resume.updatedAt = new Date().toISOString();

  db.saveResume(resume);
  res.json({ resume });
});

app.delete('/api/resumes/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const success = db.deleteResume(req.params.id, req.user!.id);
  if (!success) {
    return res.status(404).json({ error: 'Resume not found or could not be deleted.' });
  }
  res.json({ message: 'Resume deleted successfully.' });
});

// ==================== JOB MATCH ANALYSES ====================
app.get('/api/analyses', requireAuth, (req: AuthenticatedRequest, res) => {
  const analyses = db.getAnalyses(req.user!.id);
  res.json({ analyses });
});

app.get('/api/analyses/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const analysis = db.getAnalysisById(req.params.id, req.user!.id);
  if (!analysis) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  res.json({ analysis });
});

app.post('/api/analyses', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      resumeId,
      internshipTitle,
      companyName,
      domain,
      jobDescriptionText,
      requiredSkillsSpecified,
      preferredSkillsSpecified,
    } = req.body;

    if (!resumeId) {
      return res.status(400).json({ error: 'Please select a resume to evaluate.' });
    }
    if (!internshipTitle || internshipTitle.trim().length === 0) {
      return res.status(400).json({ error: 'Internship title is required.' });
    }
    if (!jobDescriptionText || jobDescriptionText.trim().length < 50) {
      return res.status(400).json({ error: 'Job description is too short to evaluate. Please provide a detailed description.' });
    }

    const resume = db.getResumeById(resumeId, req.user!.id);
    if (!resume) {
      return res.status(404).json({ error: 'Selected resume not found for your account.' });
    }

    // Reuse previously generated analysis if input is identical and forceRegenerate is not requested
    if (!req.body.forceRegenerate) {
      const existing = db.findExistingAnalysis(req.user!.id, resumeId, internshipTitle, jobDescriptionText);
      if (existing) {
        return res.status(200).json({ analysis: existing, cached: true });
      }
    }

    const analysisResult = await analyzeJobMatchWithAI(
      resume.extractedData,
      resume.rawText,
      jobDescriptionText.trim(),
      internshipTitle.trim(),
      (companyName || '').trim(),
      domain || 'Software Engineering',
      requiredSkillsSpecified || [],
      preferredSkillsSpecified || []
    );

    const fullAnalysis: JobMatchAnalysis = {
      id: `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user!.id,
      resumeId: resume.id,
      resumeTitle: resume.title,
      ...analysisResult,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.saveAnalysis(fullAnalysis);
    res.status(201).json({ analysis: fullAnalysis });
  } catch (err: any) {
    handleAiRouteError(res, err, 'Job match analysis');
  }
});

app.put('/api/analyses/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const { internshipTitle, companyName } = req.body;
  if (!internshipTitle) {
    return res.status(400).json({ error: 'Internship title is required.' });
  }
  const updated = db.updateAnalysisTitle(req.params.id, req.user!.id, internshipTitle, companyName);
  if (!updated) {
    return res.status(404).json({ error: 'Analysis not found' });
  }
  res.json({ analysis: updated });
});

app.delete('/api/analyses/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const success = db.deleteAnalysis(req.params.id, req.user!.id);
  if (!success) {
    return res.status(404).json({ error: 'Analysis not found or could not be deleted.' });
  }
  res.json({ message: 'Analysis deleted successfully.' });
});

// ==================== LEARNING ROADMAP ROUTES ====================
app.get('/api/roadmaps', requireAuth, (req: AuthenticatedRequest, res) => {
  const roadmaps = db.getRoadmaps(req.user!.id);
  res.json({ roadmaps });
});

app.get('/api/roadmaps/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const roadmap = db.getRoadmapById(req.params.id, req.user!.id);
  if (!roadmap) {
    return res.status(404).json({ error: 'Roadmap not found' });
  }
  res.json({ roadmap });
});

// Career recommendation route
app.post('/api/roadmaps/recommend-careers', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { resumeId } = req.body;
    let resume: ResumeRecord | null = null;
    if (resumeId) {
      resume = db.getResumeById(resumeId, req.user!.id);
    } else {
      const resumes = db.getResumes(req.user!.id);
      resume = resumes.length > 0 ? resumes[0] : null;
    }

    if (!resume) {
      return res.status(400).json({
        error: 'No resume found for your account. Please upload or paste your resume first to get career recommendations.',
      });
    }

    const recommendations = await recommendCareersFromResume(resume.extractedData, req.user!.profile);
    res.json({
      recommendations,
      resumeId: resume.id,
      resumeTitle: resume.title,
    });
  } catch (err: any) {
    handleAiRouteError(res, err, 'Career recommendation');
  }
});

app.post('/api/roadmaps/generate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const {
      analysisId,
      targetRole,
      companyName,
      jobDescriptionText,
      selectedRole,
      roleContext,
      resumeId,
      preserveCompleted,
    } = req.body;

    let targetResume: ResumeRecord | null = null;
    if (resumeId) {
      targetResume = db.getResumeById(resumeId, req.user!.id);
    } else {
      const userResumes = db.getResumes(req.user!.id);
      targetResume = userResumes.length > 0 ? userResumes[0] : null;
    }

    let generated: {
      title: string;
      summary: string;
      targetCompletionWeeks: number;
      currentStrengths: string[];
      prioritizedSkills: any[];
      phases: any[];
      finalPortfolioProject: any;
      tasks: RoadmapTask[];
    };

    let resolvedRole = targetRole || selectedRole || 'Software Engineering Intern';
    let resolvedCompany = companyName || '';
    let resolvedAnalysisId = analysisId || undefined;

    // Route 1: From Existing Job Match Analysis
    if (analysisId) {
      const analysis = db.getAnalysisById(analysisId, req.user!.id);
      if (!analysis) {
        return res.status(404).json({ error: 'Job match analysis not found.' });
      }
      resolvedRole = analysis.internshipTitle;
      resolvedCompany = analysis.companyName || '';
      generated = await generateRoadmapWithAI(analysis, req.user!.profile);
    }
    // Route 2: Option A - Target Job Role & Job Description (Independent of Internship Matcher)
    else if (targetRole && jobDescriptionText) {
      if (!targetResume) {
        return res.status(400).json({
          error: 'Please upload or paste your resume first so the AI can map your current skills.',
        });
      }
      if (jobDescriptionText.trim().length < 20) {
        return res.status(400).json({
          error: 'Job description is too short. Please provide a more detailed description to extract skill gaps.',
        });
      }
      resolvedRole = targetRole.trim();
      resolvedCompany = (companyName || '').trim();
      generated = await generateTargetJobRoadmapWithAI(
        targetResume.extractedData,
        resolvedRole,
        resolvedCompany,
        jobDescriptionText.trim(),
        req.user!.profile
      );
    }
    // Route 3: Option B - AI-Recommended Career Roadmap (Direct from Resume)
    else if (selectedRole) {
      if (!targetResume) {
        return res.status(400).json({
          error: 'Please upload or paste your resume first so the AI can analyze your technical background.',
        });
      }
      resolvedRole = selectedRole.trim();
      resolvedCompany = (companyName || '').trim();
      generated = await generateCareerRoadmapWithAI(
        targetResume.extractedData,
        resolvedRole,
        roleContext,
        req.user!.profile
      );
    } else {
      return res.status(400).json({
        error:
          'Invalid request. Please provide either a target job role and description (Option A), an AI career role (Option B), or a job analysis ID.',
      });
    }

    // Preserve completed tasks if regenerating existing roadmap
    let existingRoadmap = resolvedAnalysisId
      ? db.getRoadmapByAnalysisId(resolvedAnalysisId, req.user!.id)
      : null;

    if (!existingRoadmap) {
      const allRoadmaps = db.getRoadmaps(req.user!.id);
      existingRoadmap = allRoadmaps.find(
        (r) => r.internshipTitle.toLowerCase() === resolvedRole.toLowerCase()
      ) || null;
    }

    const completedTasksFromExisting =
      existingRoadmap && preserveCompleted
        ? existingRoadmap.tasks.filter((t) => t.status === 'completed')
        : [];

    let finalTasks = generated.tasks;
    if (completedTasksFromExisting.length > 0) {
      finalTasks = [...completedTasksFromExisting, ...finalTasks];
    }

    const newRoadmap: LearningRoadmap = {
      id: existingRoadmap?.id || `roadmap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: req.user!.id,
      analysisId: resolvedAnalysisId,
      internshipTitle: resolvedRole,
      companyName: resolvedCompany,
      title: generated.title,
      createdAt: existingRoadmap?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      targetCompletionWeeks: generated.targetCompletionWeeks,
      summary: generated.summary,
      currentStrengths: generated.currentStrengths,
      prioritizedSkills: generated.prioritizedSkills,
      phases: generated.phases,
      finalPortfolioProject: generated.finalPortfolioProject,
      tasks: finalTasks,
    };

    db.saveRoadmap(newRoadmap);
    res.status(201).json({ roadmap: newRoadmap });
  } catch (err: any) {
    handleAiRouteError(res, err, 'Roadmap generation');
  }
});

app.put('/api/roadmaps/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required.' });
  }
  const updated = db.updateRoadmapTitle(req.params.id, req.user!.id, title);
  if (!updated) {
    return res.status(404).json({ error: 'Roadmap not found.' });
  }
  res.json({ roadmap: updated });
});

// Update specific task in roadmap
app.put('/api/roadmaps/:id/tasks/:taskId', requireAuth, (req: AuthenticatedRequest, res) => {
  const { status, studentNotes, targetDate, priority, estimatedDuration } = req.body;
  const updatedRoadmap = db.updateRoadmapTask(req.params.id, req.params.taskId, req.user!.id, {
    status,
    studentNotes,
    targetDate,
    priority,
    estimatedDuration,
  });

  if (!updatedRoadmap) {
    return res.status(404).json({ error: 'Roadmap or task not found.' });
  }
  res.json({ roadmap: updatedRoadmap });
});

// Add custom personal task to roadmap
app.post('/api/roadmaps/:id/tasks', requireAuth, (req: AuthenticatedRequest, res) => {
  const { weekNumber, skill, title, learningObjective, priority, estimatedDuration, recommendedResource, practiceProject } = req.body;
  if (!title || !skill) {
    return res.status(400).json({ error: 'Task title and skill are required.' });
  }

  const newTask: RoadmapTask = {
    id: `custom-task-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    weekNumber: Number(weekNumber) || 1,
    skill: skill.trim(),
    title: title.trim(),
    importanceReason: 'Custom student milestone',
    learningObjective: learningObjective || 'Master concept through hands-on practice',
    priority: priority || 'Medium',
    estimatedDuration: estimatedDuration || '4 hours',
    recommendedResource: recommendedResource || {
      name: 'Custom Study Resource',
      url: 'https://developer.mozilla.org',
      type: 'Documentation',
      isFree: true,
    },
    practiceProject: practiceProject || {
      title: 'Practice Milestone',
      description: 'Hands-on exercise',
      deliverable: 'Tested code project',
    },
    prerequisites: [],
    status: 'not_started',
  };

  const updatedRoadmap = db.addRoadmapTask(req.params.id, req.user!.id, newTask);
  if (!updatedRoadmap) {
    return res.status(404).json({ error: 'Roadmap not found.' });
  }
  res.status(201).json({ roadmap: updatedRoadmap, task: newTask });
});

app.delete('/api/roadmaps/:id/tasks/:taskId', requireAuth, (req: AuthenticatedRequest, res) => {
  const updatedRoadmap = db.deleteRoadmapTask(req.params.id, req.params.taskId, req.user!.id);
  if (!updatedRoadmap) {
    return res.status(404).json({ error: 'Roadmap or task not found.' });
  }
  res.json({ roadmap: updatedRoadmap });
});

app.delete('/api/roadmaps/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const success = db.deleteRoadmap(req.params.id, req.user!.id);
  if (!success) {
    return res.status(404).json({ error: 'Roadmap not found or could not be deleted.' });
  }
  res.json({ message: 'Roadmap deleted successfully.' });
});

// ==================== DASHBOARD STATS ====================
app.get('/api/dashboard', requireAuth, (req: AuthenticatedRequest, res) => {
  const stats = db.getDashboardStats(req.user!.id);
  res.json({ stats });
});

// ==================== SEED DEMO DATA ROUTE ====================
app.post('/api/demo/seed', requireAuth, (req: AuthenticatedRequest, res) => {
  db.seedDemoData(req.user!.id);
  const stats = db.getDashboardStats(req.user!.id);
  res.json({ message: 'Demo data loaded successfully.', stats });
});

// ==================== VITE & STATIC FILES ====================
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Explicitly handle HTML serving with transformIndexHtml so @react-refresh and Vite preambles are injected
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`SkillBridge AI server running on http://0.0.0.0:${PORT} [${isProduction ? 'production' : 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
