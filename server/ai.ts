import { GoogleGenAI } from '@google/genai';
import {
  ExtractedResumeData,
  JobMatchAnalysis,
  RoadmapTask,
  CareerRecommendation,
  FinalPortfolioProject,
  PrioritizedSkill,
} from './types';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not configured. Please set GEMINI_API_KEY to enable AI features.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function cleanJsonString(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}

/**
 * Execute Gemini model call with timeout and bounded exponential backoff retry for 429 and 503 errors.
 * Retries at most twice after initial request (max 3 attempts). Permanent errors (400, 401, 403, 404) are never retried.
 */
async function callGeminiWithRetry<T>(
  operationName: string,
  fn: () => Promise<T>,
  retries = 2,
  baseDelayMs = 1500,
  timeoutMs = 60000
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Race against timeout promise
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: ${operationName} exceeded ${timeoutMs}ms limit.`)), timeoutMs)
        ),
      ]);
      return result;
    } catch (err: any) {
      lastError = err;
      const errMsg = String(err?.message || err);

      // Check if it's daily quota exhaustion (e.g. Free Tier limit: 20 req/day)
      const isDailyQuota =
        errMsg.includes('per day limit exceeded') ||
        errMsg.includes('daily limit') ||
        errMsg.includes('GenerateRequestsPerDay') ||
        errMsg.includes('You exceeded your current quota');

      if (isDailyQuota) {
        console.error(`[Gemini AI] ${operationName}: Daily API quota exhausted on Google AI Studio Free Tier. Aborting retries immediately.`);
        throw new Error(
          'Google AI Studio Gemini API daily quota limit reached (Free Tier limit: 20 requests/day). Please upgrade your Cloud project in Google AI Studio or provide a billing-enabled key, or wait for the daily quota to reset.'
        );
      }

      // Never retry client/auth permanent errors
      const isPermanent =
        errMsg.includes('400') ||
        errMsg.includes('401') ||
        errMsg.includes('403') ||
        errMsg.includes('404') ||
        errMsg.includes('API_KEY_INVALID') ||
        errMsg.includes('PERMISSION_DENIED') ||
        errMsg.includes('INVALID_ARGUMENT');

      if (isPermanent) {
        console.error(`[Gemini AI] ${operationName} permanent client error (${errMsg}). Aborting retries.`);
        break;
      }

      const isTemporary =
        errMsg.includes('503') ||
        errMsg.includes('UNAVAILABLE') ||
        errMsg.includes('overloaded') ||
        errMsg.includes('fetch failed') ||
        errMsg.includes('ECONNRESET') ||
        (errMsg.includes('429') && !isDailyQuota);

      if (isTemporary && attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 400);
        console.warn(
          `[Gemini AI] ${operationName}: Temporary service issue (
          
        ${errMsg}). Retrying attempt ${
            attempt + 1
          }/${retries} in ${delay}ms...`
        );
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      break;
    }
  }

  const msg = String(lastError?.message || lastError);
  if (msg.includes('per day limit exceeded') || msg.includes('daily quota') || msg.includes('daily limit')) {
    throw new Error(
      'Google AI Studio Gemini API daily quota limit reached (Free Tier limit: 20 requests/day). Please upgrade your Cloud project in Google AI Studio or provide a billing-enabled key, or wait for the daily quota to reset.'
    );
  }
  if (msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('overloaded')) {
    throw new Error(
      'The Gemini AI service is temporarily experiencing high traffic (503 Service Unavailable). Please retry in a few moments.'
    );
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    throw new Error(
      'AI rate limit reached. Please wait a brief moment and try again.'
    );
  }
  if (msg.includes('Timeout')) {
    throw new Error('AI request timed out. Please try again with shorter text.');
  }
  throw lastError;
}

(resumeText: string): Promise<ExtractedResumeData> {
  const ai = getAiClient();

  const prompt = `You are an expert technical resume parser for university students and internship candidates.
Carefully parse the following raw resume text into a structured JSON object.
STRICT RULES:
1. ONLY extract information that is explicitly stated in the text.
2. NEVER hallucinate, guess, or invent skills, degrees, contact details, or experience not found in the resume.
3. If information is missing or unclear, leave fields empty or note in extractionNotes.
4. Categorize technical skills accurately into: languages, frameworks, databases, tools, other.

Raw Resume Text:
"""
${resumeText.slice(0, 15000)}
"""

Return ONLY a valid JSON object with this exact structure:
{
  "fullName": "Student Name or string",
  "email": "Email address or string",
  "phone": "Phone or string",
  "location": "City, State or string",
  "summary": "Professional summary or objective if present, otherwise short descriptive summary",
  "technicalSkills": {
    "languages": ["e.g. Python", "JavaScript"],
    "frameworks": ["e.g. React", "Express"],
    "databases": ["e.g. PostgreSQL", "MongoDB"],
    "tools": ["e.g. Git", "Docker"],
    "other": ["e.g. REST APIs", "GraphQL"]
  },
  "softSkills": ["e.g. Communication", "Problem Solving"],
  "education": [
    {
      "institution": "University / College name",
      "degree": "Degree (e.g. B.S., B.Tech)",
      "field": "Major / Field of study",
      "graduationDate": "Expected or actual graduation date",
      "gpa": "GPA if mentioned"
    }
  ],
  "experience": [
    {
      "company": "Company or Organization",
      "role": "Role / Position",
      "duration": "Dates / Duration",
      "location": "Location if present",
      "bullets": ["Action bullet 1", "Action bullet 2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "techStack": ["Tech 1", "Tech 2"],
      "description": "Brief description",
      "highlights": ["Key feature or accomplishment"],
      "link": "URL if present"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "year": "Year"
    }
  ],
  "rawTextPreview": "First 150 characters of resume",
  "extractionNotes": ["Any observations about missing sections, e.g. 'No GPA listed' or 'No prior work experience listed'"]
}`;

  
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 2500,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI returned an empty response during resume parsing.');
    }

    const parsed = JSON.parse(cleanJsonString(text)) as ExtractedResumeData;
    if (!parsed.technicalSkills) {
      parsed.technicalSkills = { languages: [], frameworks: [], databases: [], tools: [], other: [] };
    }
    if (!parsed.education) parsed.education = [];
    if (!parsed.experience) parsed.experience = [];
    if (!parsed.projects) parsed.projects = [];
    if (!parsed.certifications) parsed.certifications = [];
    if (!parsed.softSkills) parsed.softSkills = [];
    parsed.rawTextPreview = resumeText.slice(0, 200).replace(/\s+/g, ' ');

    return parsed;
  });
}
export async function parseResumePdfWithAI

(pdfBuffer: Buffer): Promise<ExtractedResumeData> {
  const ai = getAiClient();

  const prompt = `You are an expert technical resume parser for university students and internship candidates.
The attached document is a PDF resume (which may be scanned or image-based).
Carefully read and parse the resume document into a structured JSON object.
STRICT RULES:
1. ONLY extract information that is explicitly stated in the document.
2. NEVER hallucinate, guess, or invent skills, degrees, contact details, or experience not found in the resume.
3. If information is missing or unclear, leave fields empty or note in extractionNotes.
4. Categorize technical skills accurately into: languages, frameworks, databases, tools, other.

Return ONLY a valid JSON object with this exact structure:
{
  "return callGeminiWithRetry('Resume Parser', async () => {fullName": "Student Name or string",
  "email": "Email address or string",
  "phone": "Phone or string",
  "location": "City, State or string",
  "summary": "Professional summary or objective if present, otherwise short descriptive summary",
  "technicalSkills": {
    "languages": ["e.g. Python", "JavaScript"],
    "frameworks": ["e.g. React", "Express"],
    "databases": ["e.g. PostgreSQL", "MongoDB"],
    "tools": ["e.g. Git", "Docker"],
    "other": ["e.g. REST APIs", "GraphQL"]
  },
  "softSkills": ["e.g. Communication", "Problem Solving"],
  "education": [
    {
      "institution": "University / College name",
      "degree": "Degree (e.g. B.S., B.Tech)",
      "field": "Major / Field of study",
      "graduationDate": "Expected or actual graduation date",
      "gpa": "GPA if mentioned"
    }
  ],
  "experience": [
    {
      "company": "Company or Organization",
      "role": "Role / Position",
      "duration": "Dates / Duration",
      "location": "Location if present",
      "bullets": ["Action bullet 1", "Action bullet 2"]
    }
  ],
  "projects": [
    {
      "name": "Project Name",
      "techStack": ["Tech 1", "Tech 2"],
      "description": "Brief description",
      "highlights": ["Key feature or accomplishment"],
      "link": "URL if present"
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuer": "Issuing organization",
      "year": "Year"
    }
  ],
  "rawTextPreview": "First 150 characters of resume document",
  "extractionNotes": ["Scanned PDF processed via multimodal document vision"]
}`;

  return callGeminiWithRetry('Scanned PDF Resume Parser', async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdfBuffer.toString('base64'),
          },
        },
        {
          text: prompt,
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 2500,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI returned an empty response during PDF document parsing.');
    }

    const parsed = JSON.parse(cleanJsonString(text)) as ExtractedResumeData;
    if (!parsed.technicalSkills) {
      parsed.technicalSkills = { languages: [], frameworks: [], databases: [], tools: [], other: [] };
    }
    if (!parsed.education) parsed.education = [];
    if (!parsed.experience) parsed.experience = [];
    if (!parsed.projects) parsed.projects = [];
    if (!parsed.certifications) parsed.certifications = [];
    if (!parsed.softSkills) parsed.softSkills = [];
    if (!parsed.rawTextPreview) {
      parsed.rawTextPreview = `${parsed.fullName || 'Student'} Resume Document`;
    }

    return parsed;
  });
}

export async function analyzeJobMatchWithAI(
  resume: ExtractedResumeData,
  resumeRawText: string,
  jobDescription: string,
  internshipTitle: string,
  companyName: string,
  domain: string,
  requiredSkillsSpecified?: string[],
  preferredSkillsSpecified?: string[]
): Promise<Omit<JobMatchAnalysis, 'id' | 'userId' | 'resumeId' | 'resumeTitle' | 'createdAt' | 'updatedAt'>> {
  const ai = getAiClient();

  const prompt = `You are a senior technical hiring manager and internship qualification analyst.
Perform a rigorous, fair, and transparent skill-gap analysis comparing the student's resume against the target internship job description.

Target Internship: ${internshipTitle}
Company: ${companyName || 'Not specified'}
Domain: ${domain}

User-specified Required Skills: ${requiredSkillsSpecified?.join(', ') || 'None provided explicitly; infer from job description'}
User-specified Preferred Skills: ${preferredSkillsSpecified?.join(', ') || 'None provided explicitly; infer from job description'}

Job Description:
"""
${jobDescription.slice(0, 10000)}
"""

Student's Resume Information:
- Full Name: ${resume.fullName}
- Education: ${JSON.stringify(resume.education)}
- Technical Skills: ${JSON.stringify(resume.technicalSkills)}
- Experience: ${JSON.stringify(resume.experience)}
- Projects: ${JSON.stringify(resume.projects)}
- Certifications: ${JSON.stringify(resume.certifications)}

Raw Resume Excerpt:
"""
${resumeRawText.slice(0, 6000)}
"""

SCORING METHODOLOGY (Calculate mathematical score out of 100):
1. Core Required Skills (50% weight): Percentage of essential skills and concepts required for the internship that the student demonstrably possesses.
2. Experience & Demonstrated Projects (30% weight): Evidence from hands-on projects, coursework, or internships that prove the student applied these skills.
3. Preferred Qualifications & Role Alignment (20% weight): Nice-to-have tools, domain interest, graduation timeline, and foundational depth.
Sum: overallMatchScore = coreSkillsScore * 0.50 + experienceAndProjectsScore * 0.30 + preferredAndEducationScore * 0.20 (rounded to integer 0-100).
Explain the calculation clearly. State that the score indicates readiness against written qualifications, not an interview guarantee.

OUTPUT REQUIREMENTS:
Output ONLY a valid JSON object matching this schema:
{
  "internshipTitle": "${internshipTitle}",
  "companyName": "${companyName}",
  "domain": "${domain}",
  "jobDescriptionText": "${jobDescription.slice(0, 1000).replace(/"/g, "'")}",
  "requiredSkillsSpecified": ["List of core skills required by the role"],
  "preferredSkillsSpecified": ["List of nice-to-have skills for the role"],
  "overallMatchScore": 75,
  "scoreBreakdown": {
    "coreSkillsScore": 85,
    "experienceAndProjectsScore": 70,
    "preferredAndEducationScore": 60,
    "explanation": "Detailed explanation of how the score was calculated using the 50/30/20 criteria"
  },
  "matchingSkills": [
    {
      "skill": "Skill name",
      "evidenceInResume": "Exact quote or reference from resume showing where this was demonstrated",
      "importance": "high"
    }
  ],
  "partiallyMatchingSkills": [
    {
      "skill": "Target skill (e.g. AWS Production Deployment)",
      "studentHas": "What the student has (e.g. Basic S3 / EC2)",
      "gapDescription": "What is missing to reach the required internship proficiency"
    }
  ],
  "missingRequiredSkills": [
    {
      "skill": "Required skill that is completely absent",
      "reasonNeeded": "Why this role specifically requires it",
      "difficultyToLearn": "Beginner | Intermediate | Advanced"
    }
  ],
  "missingPreferredSkills": [
    {
      "skill": "Preferred / Bonus skill absent",
      "advantage": "How learning this gives the student a competitive edge"
    }
  ],
  "strengths": [
    "Key competitive advantage 1",
    "Key competitive advantage 2"
  ],
  "weaknesses": [
    "Noticeable blind spot 1",
    "Noticeable blind spot 2"
  ],
  "resumeImprovements": [
    "Actionable bullet rewrites or additions the student can make to their resume to better reflect requirements"
  ],
  "actionableSteps": [
    "Immediate high-priority steps to become internship-ready"
  ]
}`;

  return callGeminiWithRetry('Job Match Evaluation', async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.15,
        maxOutputTokens: 3500,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI returned an empty response during job match analysis.');
    }

    const parsed = JSON.parse(cleanJsonString(text));

    // Deterministic mathematical calculation of overall score from weighted components
    const core = typeof parsed.scoreBreakdown?.coreSkillsScore === 'number'
      ? Math.min(100, Math.max(0, Math.round(parsed.scoreBreakdown.coreSkillsScore)))
      : 75;
    const exp = typeof parsed.scoreBreakdown?.experienceAndProjectsScore === 'number'
      ? Math.min(100, Math.max(0, Math.round(parsed.scoreBreakdown.experienceAndProjectsScore)))
      : 70;
    const pref = typeof parsed.scoreBreakdown?.preferredAndEducationScore === 'number'
      ? Math.min(100, Math.max(0, Math.round(parsed.scoreBreakdown.preferredAndEducationScore)))
      : 60;

    // 50% Core Skills, 30% Projects & Experience, 20% Preferred & Alignment
    const deterministicOverallScore = Math.min(100, Math.max(0, Math.round(core * 0.50 + exp * 0.30 + pref * 0.20)));

    const scoreExplanation = parsed.scoreBreakdown?.explanation ||
      `Deterministic weighted match score: ${core}% Core Skills (50% weight) + ${exp}% Projects & Experience (30% weight) + ${pref}% Preferred Skills (20% weight) = ${deterministicOverallScore}%.`;

    return {
      internshipTitle,
      companyName,
      domain,
      jobDescriptionText: jobDescription,
      requiredSkillsSpecified: parsed.requiredSkillsSpecified || [],
      preferredSkillsSpecified: parsed.preferredSkillsSpecified || [],
      overallMatchScore: deterministicOverallScore,
      scoreBreakdown: {
        coreSkillsScore: core,
        experienceAndProjectsScore: exp,
        preferredAndEducationScore: pref,
        explanation: scoreExplanation,
      },
      matchingSkills: parsed.matchingSkills || [],
      partiallyMatchingSkills: parsed.partiallyMatchingSkills || [],
      missingRequiredSkills: parsed.missingRequiredSkills || [],
      missingPreferredSkills: parsed.missingPreferredSkills || [],
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      resumeImprovements: parsed.resumeImprovements || [],
      actionableSteps: parsed.actionableSteps || [],
    };
  });
}

/**
 * Recommend suitable career roles for the student directly from their analyzed resume.
 */
export async function recommendCareersFromResume(
  resume: ExtractedResumeData,
  studentProfile?: any
): Promise<CareerRecommendation[]> {
  const ai = getAiClient();

  const prompt = `You are a high-level university engineering career counselor.
Analyze this college student's resume data (confirmed skills, projects, education, experience, and soft skills).
Recommend 3 to 5 distinct, high-opportunity career / internship roles that best match their current technical profile.

STUDENT RESUME SUMMARY:
- Name: ${resume.fullName}
- Summary: ${resume.summary || 'Student in computing disciplines'}
- Education: ${JSON.stringify(resume.education)}
- Technical Skills:
  * Languages: ${resume.technicalSkills?.languages?.join(', ') || 'None listed'}
  * Frameworks: ${resume.technicalSkills?.frameworks?.join(', ') || 'None listed'}
  * Databases: ${resume.technicalSkills?.databases?.join(', ') || 'None listed'}
  * Tools: ${resume.technicalSkills?.tools?.join(', ') || 'None listed'}
  * Other: ${resume.technicalSkills?.other?.join(', ') || 'None listed'}
- Projects: ${JSON.stringify(resume.projects?.map((p) => ({ name: p.name, tech: p.techStack, desc: p.description })) || [])}
- Work Experience: ${JSON.stringify(resume.experience?.map((e) => ({ company: e.company, role: e.role })) || [])}
- Goals / Preferences: ${studentProfile?.learningGoals || studentProfile?.preferredDomains?.join(', ') || 'Summer internship readiness'}

CRITICAL RULES:
1. Suggest realistically achievable tech internship roles (e.g., "Full-Stack Software Engineer Intern", "Backend & Distributed Systems Intern", "Frontend / UI Engineer Intern", "Cloud & DevOps Intern", "Data Science & ML Intern").
2. Match score must be between 65 and 95 based on actual skills present.
3. Highlight genuine skills the student has that justify the recommendation.
4. Highlight the top 3-4 missing skills they should acquire to stand out in interviews.

Output ONLY a valid JSON array of objects matching this schema:
[
  {
    "role": "Full-Stack Software Engineer Intern",
    "matchScore": 88,
    "matchReason": "Strong foundation in React, TypeScript and Node.js with demonstrated full-stack projects.",
    "existingStrengths": ["React", "TypeScript", "REST APIs", "Git"],
    "skillsToAcquire": ["PostgreSQL indexing", "Docker containerization", "Testing with Jest/Vitest", "CI/CD pipelines"],
    "sampleCompanies": ["Stripe", "Datadog", "Figma", "Airbnb"],
    "recommendedPhasesSummary": "4-week sprint: Database modeling, Docker containers, automated test suites, and microservices."
  }
]`;

  return callGeminiWithRetry('Career Recommendations', async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 2000,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI returned an empty response for career recommendations.');
    }

    const parsed = JSON.parse(cleanJsonString(text));
    if (!Array.isArray(parsed)) {
      throw new Error('Expected JSON array of career recommendations.');
    }

    return parsed.map((item: any) => ({
      role: item.role || 'Software Engineering Intern',
      matchScore: typeof item.matchScore === 'number' ? Math.min(100, Math.max(50, Math.round(item.matchScore))) : 80,
      matchReason: item.matchReason || 'Matches your technical skillset and project background.',
      existingStrengths: Array.isArray(item.existingStrengths) ? item.existingStrengths : [],
      skillsToAcquire: Array.isArray(item.skillsToAcquire) ? item.skillsToAcquire : [],
      sampleCompanies: Array.isArray(item.sampleCompanies) ? item.sampleCompanies : ['Top Tech Employers'],
      recommendedPhasesSummary: item.recommendedPhasesSummary || 'Focused plan covering core systems and interview projects.',
    }));
  });
}

/**
 * Option A: Generate learning roadmap for a target job role & description.
 */
export async function generateTargetJobRoadmapWithAI(
  resume: ExtractedResumeData,
  targetRole: string,
  companyName: string,
  jobDescription: string,
  studentProfile?: any
): Promise<{
  title: string;
  summary: string;
  targetCompletionWeeks: number;
  currentStrengths: string[];
  prioritizedSkills: PrioritizedSkill[];
  phases: RoadmapPhase[];
  finalPortfolioProject: FinalPortfolioProject;
  tasks: RoadmapTask[];
}> {
  const ai = getAiClient();

  const prompt = `You are a world-class technical mentor and curriculum architect.
Design a complete, rigorous, personalized learning roadmap for a college student applying for:
Target Role: "${targetRole}"
Target Company: "${companyName || 'Top Tech Firm'}"

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 8000)}
"""

STUDENT RESUME PROFILE:
- Full Name: ${resume.fullName}
- Technical Skills: ${JSON.stringify(resume.technicalSkills)}
- Experience: ${JSON.stringify(resume.experience?.map((e) => ({ role: e.role, company: e.company })) || [])}
- Projects: ${JSON.stringify(resume.projects?.map((p) => ({ name: p.name, tech: p.techStack, desc: p.description })) || [])}
- Education: ${JSON.stringify(resume.education)}

MANDATORY INCLUSIONS:
1. "currentStrengths": 3-6 specific strengths identified from the resume that directly help them succeed in this role.
2. "prioritizedSkills": 4-8 prioritized skills to improve or learn, ordered by priority (High, Medium, Low) with rationale.
3. "phases": 3 to 4 learning phases in prerequisite order (e.g. Phase 1: Core Prereqs & Foundations, Phase 2: Architecture & Implementation, Phase 3: Production & Performance).
4. "tasks": 5 to 8 specific, high-impact learning tasks mapped to weeks/phases with:
   - Specific learning objectives
   - Practical coding exercises and mini-projects
   - REAL, REPUTABLE, and ACCESSIBLE free resources (e.g. MDN Web Docs, official documentation, freeCodeCamp, Harvard CS50, official GitHub guides, open-source primers). Never invent fake domains.
   - Clear completion criteria (how the student verifies the task is completed).
   - Prerequisites for each task.
5. "finalPortfolioProject": A standout capstone portfolio project the student can showcase on GitHub and resume to prove readiness for "${targetRole}".

Output ONLY a valid JSON object matching this schema:
{
  "title": "${targetRole} Internship Readiness Roadmap",
  "summary": "2-3 sentences summarizing the strategic focus of this learning plan",
  "targetCompletionWeeks": 4,
  "currentStrengths": ["Strength 1 from resume", "Strength 2 from resume"],
  "prioritizedSkills": [
    {
      "skill": "Skill name",
      "priority": "High | Medium | Low",
      "reason": "Why this skill is crucial for this role",
      "category": "Languages | Frameworks | Databases | Cloud | System Design"
    }
  ],
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Phase Title (e.g. Core Prerequisites & Data Modeling)",
      "description": "Overview of objectives in this phase",
      "durationWeeks": 1,
      "prerequisites": ["Basic Programming"]
    }
  ],
  "finalPortfolioProject": {
    "title": "Project Title",
    "description": "Comprehensive project description to showcase on portfolio",
    "techStack": ["React", "PostgreSQL", "Docker"],
    "deliverables": ["GitHub repository with automated tests", "Live deployed demo", "System design diagram"],
    "completionCriteria": "Working end-to-end implementation with unit tests and clear README."
  },
  "tasks": [
    {
      "id": "task-1",
      "weekNumber": 1,
      "phaseTitle": "Phase 1: Core Prerequisites",
      "skill": "Specific skill",
      "title": "Action-oriented task headline",
      "importanceReason": "Why this is required for ${targetRole}",
      "learningObjective": "Measurable objective",
      "priority": "High | Medium | Low",
      "estimatedDuration": "5 hours",
      "completionCriteria": "Specific criterion to mark as finished",
      "recommendedResource": {
        "name": "Resource Name",
        "url": "https://developer.mozilla.org",
        "type": "Documentation | Course | Tutorial | Interactive | Project Guide",
        "isFree": true
      },
      "practiceProject": {
        "title": "Mini-project title",
        "description": "What to build",
        "deliverable": "Tangible deliverable"
      },
      "prerequisites": ["Prereq 1"],
      "status": "not_started"
    }
  ]
}`;

  return callGeminiWithRetry('Target Job Roadmap Generation', async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 4000,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI returned an empty response during roadmap generation.');
    }

    const parsed = JSON.parse(cleanJsonString(text));
    return sanitizeRoadmapPayload(parsed, targetRole);
  });
}

/**
 * Option B: Generate learning roadmap for an AI-recommended career role directly from resume.
 */
export async function generateCareerRoadmapWithAI(
  resume: ExtractedResumeData,
  selectedRole: string,
  roleContext?: any,
  studentProfile?: any
): Promise<{
  title: string;
  summary: string;
  targetCompletionWeeks: number;
  currentStrengths: string[];
  prioritizedSkills: PrioritizedSkill[];
  phases: RoadmapPhase[];
  finalPortfolioProject: FinalPortfolioProject;
  tasks: RoadmapTask[];
}> {
  const ai = getAiClient();

  const prompt = `You are an elite software engineering mentor and curriculum designer.
A college student is preparing for the career role: "${selectedRole}".
Based strictly on their current confirmed resume background, construct a personalized, step-by-step learning roadmap to make them top-tier internship-ready for this role.

STUDENT RESUME SUMMARY:
- Full Name: ${resume.fullName}
- Technical Skills:
  * Languages: ${resume.technicalSkills?.languages?.join(', ') || 'None'}
  * Frameworks: ${resume.technicalSkills?.frameworks?.join(', ') || 'None'}
  * Databases: ${resume.technicalSkills?.databases?.join(', ') || 'None'}
  * Tools: ${resume.technicalSkills?.tools?.join(', ') || 'None'}
- Projects: ${JSON.stringify(resume.projects?.map((p) => ({ name: p.name, tech: p.techStack, desc: p.description })) || [])}
- Experience: ${JSON.stringify(resume.experience?.map((e) => ({ role: e.role, company: e.company })) || [])}
- Education: ${JSON.stringify(resume.education)}
- Additional Context: ${roleContext?.matchReason || studentProfile?.learningGoals || 'Full internship readiness'}

MANDATORY INCLUSIONS:
1. "currentStrengths": 3-6 specific strengths identified from their resume.
2. "prioritizedSkills": 4-8 prioritized skills to learn/improve, ordered from highest priority.
3. "phases": 3 to 4 learning phases in prerequisite order (Phase 1 -> Phase 2 -> Phase 3).
4. "tasks": 5 to 8 specific learning tasks with clear objectives, practical coding exercises, real free resources, estimated duration, and completion criteria.
5. "finalPortfolioProject": A comprehensive portfolio project the student can build and showcase to land an internship in "${selectedRole}".

Output ONLY a valid JSON object matching this schema:
{
  "title": "${selectedRole} Career Acceleration Roadmap",
  "summary": "2-3 sentences summarizing the strategic focus of this learning plan",
  "targetCompletionWeeks": 4,
  "currentStrengths": ["Strength 1 from resume", "Strength 2 from resume"],
  "prioritizedSkills": [
    {
      "skill": "Skill name",
      "priority": "High | Medium | Low",
      "reason": "Why this skill is crucial for ${selectedRole}",
      "category": "Languages | Frameworks | Databases | Cloud | System Design"
    }
  ],
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Phase Title",
      "description": "Overview of objectives in this phase",
      "durationWeeks": 1,
      "prerequisites": ["Basic Programming"]
    }
  ],
  "finalPortfolioProject": {
    "title": "Project Title",
    "description": "Comprehensive capstone project description",
    "techStack": ["React", "Go", "PostgreSQL"],
    "deliverables": ["GitHub repository", "Live demo URL", "Architecture write-up"],
    "completionCriteria": "Working project with automated tests and documentation."
  },
  "tasks": [
    {
      "id": "task-1",
      "weekNumber": 1,
      "phaseTitle": "Phase 1: Foundations",
      "skill": "Specific skill",
      "title": "Action-oriented task headline",
      "importanceReason": "Why this is essential for ${selectedRole}",
      "learningObjective": "Measurable objective",
      "priority": "High | Medium | Low",
      "estimatedDuration": "5 hours",
      "completionCriteria": "Specific criterion to mark as finished",
      "recommendedResource": {
        "name": "Resource Name",
        "url": "https://developer.mozilla.org",
        "type": "Documentation | Course | Tutorial | Interactive | Project Guide",
        "isFree": true
      },
      "practiceProject": {
        "title": "Mini-project title",
        "description": "What to build",
        "deliverable": "Tangible deliverable"
      },
      "prerequisites": ["Prereq 1"],
      "status": "not_started"
    }
  ]
}`;

  return callGeminiWithRetry('Career Roadmap Generation', async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 4000,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI returned an empty response during career roadmap generation.');
    }

    const parsed = JSON.parse(cleanJsonString(text));
    return sanitizeRoadmapPayload(parsed, selectedRole);
  });
}

/**
 * Generate roadmap from an existing Job Match Analysis.
 */
export async function generateRoadmapWithAI(
  analysis: JobMatchAnalysis,
  studentProfile?: any
): Promise<{
  title: string;
  summary: string;
  targetCompletionWeeks: number;
  currentStrengths: string[];
  prioritizedSkills: PrioritizedSkill[];
  phases: RoadmapPhase[];
  finalPortfolioProject: FinalPortfolioProject;
  tasks: RoadmapTask[];
}> {
  const ai = getAiClient();

  const prompt = `You are a personalized tech career mentor and technical curriculum designer.
A college student needs an actionable, structured learning roadmap to bridge their identified skill gaps for the target internship: "${analysis.internshipTitle}" at "${analysis.companyName || 'Target Company'}".

IDENTIFIED SKILL GAPS:
- Missing Required Skills: ${JSON.stringify(analysis.missingRequiredSkills)}
- Missing Preferred Skills: ${JSON.stringify(analysis.missingPreferredSkills)}
- Partially Matching Skills: ${JSON.stringify(analysis.partiallyMatchingSkills)}
- Target Role Domain: ${analysis.domain}

STUDENT PROFILE CONTEXT:
- Existing Strong Skills: ${analysis.matchingSkills.map((m) => m.skill).join(', ')}
- Resume Strengths: ${JSON.stringify(analysis.strengths)}
- Goal: ${studentProfile?.learningGoals || 'Become internship ready for Summer/Fall cycles'}

RULES FOR THE ROADMAP:
1. Provide 3 to 4 ordered prerequisite phases.
2. Prioritize missing required skills first before nice-to-haves.
3. Every task must be specific, actionable, and include concrete completion criteria.
4. For recommendedResource, provide REAL, REPUTABLE, and ACCESSIBLE free resources (e.g. MDN Web Docs, official docs, freeCodeCamp, Harvard CS50, official GitHub guides, open-source primers). Never invent URLs.
5. Include a practical coding exercise/mini-project for each task.
6. Include a standout final portfolio capstone project that proves readiness to recruiters.

Output ONLY a valid JSON object matching this schema:
{
  "title": "${analysis.internshipTitle} Preparation Roadmap",
  "summary": "2-3 sentences summarizing the strategic focus of this learning plan",
  "targetCompletionWeeks": 4,
  "currentStrengths": ["Strength 1 from resume", "Strength 2 from resume"],
  "prioritizedSkills": [
    {
      "skill": "Skill name",
      "priority": "High | Medium | Low",
      "reason": "Why needed",
      "category": "Frameworks"
    }
  ],
  "phases": [
    {
      "phaseNumber": 1,
      "title": "Phase 1: Foundations & Prerequisites",
      "description": "Core concepts and setup",
      "durationWeeks": 1,
      "prerequisites": []
    }
  ],
  "finalPortfolioProject": {
    "title": "Capstone Project Title",
    "description": "Comprehensive portfolio project",
    "techStack": ["React", "Node.js"],
    "deliverables": ["GitHub repository", "Live deployed link"],
    "completionCriteria": "Working project with tests"
  },
  "tasks": [
    {
      "id": "task-1",
      "weekNumber": 1,
      "phaseTitle": "Phase 1",
      "skill": "Specific skill name",
      "title": "Action-oriented task headline",
      "importanceReason": "Why this skill is mandatory for this specific internship",
      "learningObjective": "Concrete measurable objective",
      "priority": "High | Medium | Low",
      "estimatedDuration": "5 hours",
      "completionCriteria": "Checklist or criteria to verify completion",
      "recommendedResource": {
        "name": "Resource name",
        "url": "https://developer.mozilla.org",
        "type": "Documentation | Course | Tutorial | Interactive | Project Guide",
        "isFree": true
      },
      "practiceProject": {
        "title": "Mini-project title",
        "description": "What to build",
        "deliverable": "Tangible deliverable"
      },
      "prerequisites": ["Skill 1"],
      "status": "not_started"
    }
  ]
}`;

  return callGeminiWithRetry('Job Analysis Roadmap Generation', async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
        maxOutputTokens: 4000,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI returned an empty response during roadmap generation.');
    }

    const parsed = JSON.parse(cleanJsonString(text));
    return sanitizeRoadmapPayload(parsed, analysis.internshipTitle);
  });
}

function sanitizeRoadmapPayload(parsed: any, defaultRole: string) {
  const currentStrengths: string[] = Array.isArray(parsed.currentStrengths)
    ? parsed.currentStrengths
    : ['Solid foundation in computer science core principles and applied project experience.'];

  const prioritizedSkills: PrioritizedSkill[] = Array.isArray(parsed.prioritizedSkills)
    ? parsed.prioritizedSkills.map((ps: any) => ({
        skill: ps.skill || 'Core Competency',
        priority: ['High', 'Medium', 'Low'].includes(ps.priority) ? ps.priority : 'High',
        reason: ps.reason || 'Essential qualification for internship readiness.',
        category: ps.category || 'General',
      }))
    : [];

  const phases: RoadmapPhase[] = Array.isArray(parsed.phases) && parsed.phases.length > 0
    ? parsed.phases.map((p: any, idx: number) => ({
        phaseNumber: typeof p.phaseNumber === 'number' ? p.phaseNumber : idx + 1,
        title: p.title || `Phase ${idx + 1}: Core Competencies`,
        description: p.description || 'Focus on closing high-priority skill gaps.',
        durationWeeks: typeof p.durationWeeks === 'number' ? p.durationWeeks : 1,
        prerequisites: Array.isArray(p.prerequisites) ? p.prerequisites : [],
      }))
    : [
        {
          phaseNumber: 1,
          title: 'Phase 1: Core Prerequisites & System Architecture',
          description: 'Establish foundational knowledge and tools.',
          durationWeeks: 1,
          prerequisites: [],
        },
        {
          phaseNumber: 2,
          title: 'Phase 2: Applied Implementation & API Design',
          description: 'Build functional components and integrate services.',
          durationWeeks: 2,
          prerequisites: ['Phase 1'],
        },
        {
          phaseNumber: 3,
          title: 'Phase 3: Production Readiness & Portfolio Capstone',
          description: 'Testing, containerization, and final portfolio demonstration.',
          durationWeeks: 1,
          prerequisites: ['Phase 2'],
        },
      ];

  const finalPortfolioProject: FinalPortfolioProject = {
    title: parsed.finalPortfolioProject?.title || `${defaultRole} Capstone Implementation`,
    description:
      parsed.finalPortfolioProject?.description ||
      'A production-grade, end-to-end full stack project demonstrating the skills required by top employers.',
    techStack: Array.isArray(parsed.finalPortfolioProject?.techStack)
      ? parsed.finalPortfolioProject.techStack
      : ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
    deliverables: Array.isArray(parsed.finalPortfolioProject?.deliverables)
      ? parsed.finalPortfolioProject.deliverables
      : [
          'Public GitHub repository with comprehensive README',
          'Live deployed demo URL',
          'Automated unit and integration test suite',
        ],
    completionCriteria:
      parsed.finalPortfolioProject?.completionCriteria ||
      'All tests passing, live deployment reachable, clean architecture and clear setup guide.',
  };

  const tasks: RoadmapTask[] = (parsed.tasks || []).map((t: any, idx: number) => {
    const weekNum = typeof t.weekNumber === 'number' ? t.weekNumber : Math.floor(idx / 2) + 1;
    const phaseMatch = phases.find((p) => p.phaseNumber === weekNum) || phases[0];

    return {
      id: t.id || `task-${Date.now()}-${idx}`,
      weekNumber: weekNum,
      phaseTitle: t.phaseTitle || phaseMatch?.title || `Phase ${weekNum}`,
      skill: t.skill || 'Core Skill',
      title: t.title || 'Master Core Competency',
      importanceReason: t.importanceReason || 'Essential for the target internship requirements.',
      learningObjective: t.learningObjective || 'Complete guided hands-on practice.',
      priority: ['High', 'Medium', 'Low'].includes(t.priority) ? t.priority : 'High',
      estimatedDuration: t.estimatedDuration || '4-6 hours',
      completionCriteria:
        t.completionCriteria || 'Successfully build and verify hands-on coding deliverable.',
      recommendedResource: {
        name: t.recommendedResource?.name || 'Official Documentation & Guides',
        url: t.recommendedResource?.url || 'https://developer.mozilla.org',
        type: t.recommendedResource?.type || 'Documentation',
        isFree: t.recommendedResource?.isFree !== false,
      },
      practiceProject: {
        title: t.practiceProject?.title || 'Hands-On Mini Project',
        description: t.practiceProject?.description || 'Build and test an applied implementation.',
        deliverable: t.practiceProject?.deliverable || 'Working code with documentation.',
      },
      prerequisites: Array.isArray(t.prerequisites) ? t.prerequisites : [],
      status: 'not_started',
      targetDate: undefined,
      studentNotes: '',
    };
  });

  return {
    title: parsed.title || `${defaultRole} Preparation Roadmap`,
    summary:
      parsed.summary ||
      'Targeted learning plan designed to close key skill gaps for your target internship role.',
    targetCompletionWeeks: parsed.targetCompletionWeeks || 4,
    currentStrengths,
    prioritizedSkills,
    phases,
    finalPortfolioProject,
    tasks,
  };
}
