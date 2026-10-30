import fs from 'fs';
import path from 'path';
import {
  User,
  ResumeRecord,
  JobMatchAnalysis,
  LearningRoadmap,
  RoadmapTask,
  StudentProfile,
} from './types';

interface DatabaseSchema {
  users: User[];
  resumes: ResumeRecord[];
  analyses: JobMatchAnalysis[];
  roadmaps: LearningRoadmap[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class DatabaseService {
  private data: DatabaseSchema = {
    users: [],
    resumes: [],
    analyses: [],
    roadmaps: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(content);
      } else {
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database:', err);
      this.data = { users: [], resumes: [], analyses: [], roadmaps: [] };
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  // User operations
  findUserByEmail(email: string): User | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  updateUserProfile(userId: string, profile: Partial<StudentProfile>, name?: string): User | null {
    const user = this.findUserById(userId);
    if (!user) return null;
    if (name) user.name = name;
    user.profile = { ...user.profile, ...profile };
    this.save();
    return user;
  }

  updateUserPassword(email: string, newPassword: string): boolean {
    const user = this.findUserByEmail(email);
    if (!user) return false;
    user.passwordHash = newPassword;
    this.save();
    return true;
  }

  // Resume operations
  getResumes(userId: string): ResumeRecord[] {
    return this.data.resumes.filter((r) => r.userId === userId).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  getResumeById(id: string, userId: string): ResumeRecord | null {
    const resume = this.data.resumes.find((r) => r.id === id);
    if (!resume || resume.userId !== userId) return null;
    return resume;
  }

  saveResume(resume: ResumeRecord): ResumeRecord {
    const index = this.data.resumes.findIndex((r) => r.id === resume.id);
    if (index >= 0) {
      this.data.resumes[index] = resume;
    } else {
      this.data.resumes.unshift(resume);
    }
    this.save();
    return resume;
  }

  deleteResume(id: string, userId: string): boolean {
    const initialLen = this.data.resumes.length;
    this.data.resumes = this.data.resumes.filter((r) => !(r.id === id && r.userId === userId));
    const deleted = this.data.resumes.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // Analysis operations
  getAnalyses(userId: string): JobMatchAnalysis[] {
    return this.data.analyses
      .filter((a) => a.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAnalysisById(id: string, userId: string): JobMatchAnalysis | null {
    const analysis = this.data.analyses.find((a) => a.id === id);
    if (!analysis || analysis.userId !== userId) return null;
    return analysis;
  }

  findExistingAnalysis(userId: string, resumeId: string, internshipTitle: string, jobDescExcerpt: string): JobMatchAnalysis | null {
    const normTitle = internshipTitle.trim().toLowerCase();
    const normExcerpt = jobDescExcerpt.trim().slice(0, 300).toLowerCase();
    const existing = this.data.analyses.find((a) => {
      if (a.userId !== userId || a.resumeId !== resumeId) return false;
      const matchTitle = (a.internshipTitle || '').trim().toLowerCase() === normTitle;
      const matchExcerpt = (a.jobDescriptionText || '').trim().slice(0, 300).toLowerCase() === normExcerpt;
      return matchTitle && matchExcerpt;
    });
    return existing || null;
  }

  saveAnalysis(analysis: JobMatchAnalysis): JobMatchAnalysis {
    const index = this.data.analyses.findIndex((a) => a.id === analysis.id);
    if (index >= 0) {
      this.data.analyses[index] = analysis;
    } else {
      this.data.analyses.unshift(analysis);
    }
    this.save();
    return analysis;
  }

  updateAnalysisTitle(id: string, userId: string, internshipTitle: string, companyName?: string): JobMatchAnalysis | null {
    const analysis = this.getAnalysisById(id, userId);
    if (!analysis) return null;
    analysis.internshipTitle = internshipTitle;
    if (companyName !== undefined) analysis.companyName = companyName;
    analysis.updatedAt = new Date().toISOString();
    this.save();
    return analysis;
  }

  deleteAnalysis(id: string, userId: string): boolean {
    const initialLen = this.data.analyses.length;
    this.data.analyses = this.data.analyses.filter((a) => !(a.id === id && a.userId === userId));
    const deleted = this.data.analyses.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // Roadmap operations
  getRoadmaps(userId: string): LearningRoadmap[] {
    return this.data.roadmaps
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getRoadmapById(id: string, userId: string): LearningRoadmap | null {
    const roadmap = this.data.roadmaps.find((r) => r.id === id);
    if (!roadmap || roadmap.userId !== userId) return null;
    return roadmap;
  }

  getRoadmapByAnalysisId(analysisId: string, userId: string): LearningRoadmap | null {
    const roadmap = this.data.roadmaps.find((r) => r.analysisId === analysisId && r.userId === userId);
    return roadmap || null;
  }

  saveRoadmap(roadmap: LearningRoadmap): LearningRoadmap {
    const index = this.data.roadmaps.findIndex((r) => r.id === roadmap.id);
    if (index >= 0) {
      this.data.roadmaps[index] = roadmap;
    } else {
      this.data.roadmaps.unshift(roadmap);
    }
    this.save();
    return roadmap;
  }

  updateRoadmapTitle(id: string, userId: string, title: string): LearningRoadmap | null {
    const roadmap = this.getRoadmapById(id, userId);
    if (!roadmap) return null;
    roadmap.title = title;
    roadmap.updatedAt = new Date().toISOString();
    this.save();
    return roadmap;
  }

  updateRoadmapTask(
    roadmapId: string,
    taskId: string,
    userId: string,
    updates: Partial<RoadmapTask>
  ): LearningRoadmap | null {
    const roadmap = this.getRoadmapById(roadmapId, userId);
    if (!roadmap) return null;
    const taskIndex = roadmap.tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) return null;

    const task = roadmap.tasks[taskIndex];
    if (updates.status && updates.status === 'completed' && task.status !== 'completed') {
      updates.completedAt = new Date().toISOString();
    } else if (updates.status && updates.status !== 'completed') {
      updates.completedAt = undefined;
    }

    roadmap.tasks[taskIndex] = { ...task, ...updates };
    roadmap.updatedAt = new Date().toISOString();
    this.save();
    return roadmap;
  }

  addRoadmapTask(roadmapId: string, userId: string, task: RoadmapTask): LearningRoadmap | null {
    const roadmap = this.getRoadmapById(roadmapId, userId);
    if (!roadmap) return null;
    roadmap.tasks.push(task);
    roadmap.updatedAt = new Date().toISOString();
    this.save();
    return roadmap;
  }

  deleteRoadmapTask(roadmapId: string, taskId: string, userId: string): LearningRoadmap | null {
    const roadmap = this.getRoadmapById(roadmapId, userId);
    if (!roadmap) return null;
    roadmap.tasks = roadmap.tasks.filter((t) => t.id !== taskId);
    roadmap.updatedAt = new Date().toISOString();
    this.save();
    return roadmap;
  }

  deleteRoadmap(id: string, userId: string): boolean {
    const initialLen = this.data.roadmaps.length;
    this.data.roadmaps = this.data.roadmaps.filter((r) => !(r.id === id && r.userId === userId));
    const deleted = this.data.roadmaps.length < initialLen;
    if (deleted) this.save();
    return deleted;
  }

  // Dashboard Aggregates
  getDashboardStats(userId: string) {
    const resumes = this.getResumes(userId);
    const analyses = this.getAnalyses(userId);
    const roadmaps = this.getRoadmaps(userId);

    let totalGapsIdentified = 0;
    analyses.forEach((a) => {
      totalGapsIdentified += (a.missingRequiredSkills?.length || 0) + (a.missingPreferredSkills?.length || 0);
    });

    let totalTasks = 0;
    let completedTasks = 0;
    roadmaps.forEach((r) => {
      r.tasks.forEach((t) => {
        totalTasks += 1;
        if (t.status === 'completed') completedTasks += 1;
      });
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      resumesCount: resumes.length,
      analysesCount: analyses.length,
      skillGapsCount: totalGapsIdentified,
      tasksCompletedCount: completedTasks,
      totalTasksCount: totalTasks,
      overallProgressPercentage: completionRate,
      recentAnalyses: analyses.slice(0, 4),
      recentRoadmaps: roadmaps.slice(0, 3),
      activeRoadmap: roadmaps[0] || null,
    };
  }

  // Seed sample demo scenario
  seedDemoData(userId: string) {
    // Check if user already has data to prevent duplicate spamming
    const existingResumes = this.getResumes(userId);
    if (existingResumes.length > 0) return;

    const resumeId = 'demo-resume-1';
    const analysisId = 'demo-analysis-1';
    const roadmapId = 'demo-roadmap-1';

    const demoResume: ResumeRecord = {
      id: resumeId,
      userId,
      title: 'Alex_Chen_Software_Intern_Resume.pdf',
      fileName: 'Alex_Chen_Software_Intern_Resume.pdf',
      fileSizeBytes: 142000,
      uploadedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      rawText: `Alex Chen
San Jose, CA | alex.chen@stanford.edu | (555) 234-5678 | linkedin.com/in/alexchen-dev | github.com/alexchen-dev

EDUCATION
Stanford University - Stanford, CA
B.S. in Computer Science (Concentration in Systems & AI) | Expected June 2026 | GPA: 3.82
Relevant Coursework: Data Structures & Algorithms, Operating Systems, Web Applications, Database Systems, Computer Networks.

TECHNICAL SKILLS
Languages: Python, TypeScript, JavaScript, SQL (PostgreSQL), HTML5/CSS3, C++
Frameworks & Libraries: React, Node.js, Express, Tailwind CSS, Next.js, Redux Toolkit
Databases & Cloud: PostgreSQL, SQLite, MongoDB, AWS (S3, EC2 basic), Firebase
Developer Tools: Git, GitHub, VS Code, Postman, Jest, Linux / Bash

EXPERIENCE
Software Engineering Intern | ByteCrafters Labs (Summer 2025)
- Designed and built responsive frontend web components for a collaborative workspace tool using React, TypeScript, and Tailwind CSS, increasing student user engagement by 28%.
- Integrated RESTful APIs with Node.js and Express backend, optimizing database query response times by 18% through PostgreSQL indexing.
- Implemented unit and integration test suites with Jest, achieving 84% code coverage across client services.

PROJECTS
TaskFlow - Real-Time Collaborative Kanban Board
- Developed a full-stack project management app using React, TypeScript, Express, and WebSocket for real-time task updates across teams.
- Implemented JWT authentication, role-based access control, and persistent PostgreSQL storage with Prisma ORM.

CampusEats - University Food Delivery Aggregator
- Created a student food delivery portal with React, Node.js, and Google Maps API for route tracking.
- Designed schema with 6 relational tables and wrote optimized SQL queries for order handling.

CERTIFICATIONS & AWARDS
- Meta Certified Front-End Developer (2024)
- Dean's Honor Roll (2023 - 2025)`,
      extractedData: {
        fullName: 'Alex Chen',
        email: 'alex.chen@stanford.edu',
        phone: '(555) 234-5678',
        location: 'San Jose, CA',
        summary:
          'Passionate CS Junior with strong fundamentals in full-stack web development, TypeScript, React, and relational databases. Seeking software engineering internship roles.',
        technicalSkills: {
          languages: ['Python', 'TypeScript', 'JavaScript', 'SQL', 'C++', 'HTML5/CSS3'],
          frameworks: ['React', 'Node.js', 'Express', 'Tailwind CSS', 'Next.js', 'Redux Toolkit'],
          databases: ['PostgreSQL', 'SQLite', 'MongoDB', 'Firebase'],
          tools: ['Git', 'GitHub', 'VS Code', 'Postman', 'Jest', 'Linux / Bash', 'AWS (S3, EC2 basic)'],
          other: ['RESTful APIs', 'WebSocket', 'JWT Authentication', 'Responsive Web Design'],
        },
        softSkills: ['Problem Solving', 'Team Collaboration', 'Agile Mindset', 'Communication'],
        education: [
          {
            institution: 'Stanford University',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            graduationDate: 'June 2026',
            gpa: '3.82 / 4.0',
          },
        ],
        experience: [
          {
            company: 'ByteCrafters Labs',
            role: 'Software Engineering Intern',
            duration: 'June 2025 - August 2025',
            location: 'San Jose, CA',
            bullets: [
              'Designed and built responsive frontend web components using React, TypeScript, and Tailwind CSS, improving student engagement by 28%.',
              'Integrated RESTful APIs with Node.js and Express backend, optimizing query latency by 18% with PostgreSQL indexing.',
              'Created automated unit and integration tests with Jest with 84% coverage.',
            ],
          },
        ],
        projects: [
          {
            name: 'TaskFlow - Real-Time Collaborative Kanban Board',
            techStack: ['React', 'TypeScript', 'Express', 'WebSocket', 'PostgreSQL', 'Prisma'],
            description: 'Full-stack collaborative project management platform with real-time sync.',
            highlights: ['Multiplayer live card dragging via WebSocket', 'Role-based access control and JWT auth'],
            link: 'https://github.com/alexchen-dev/taskflow',
          },
          {
            name: 'CampusEats - Food Delivery Portal',
            techStack: ['React', 'Node.js', 'PostgreSQL', 'Google Maps API'],
            description: 'Order routing and menu browsing portal for local campus eateries.',
            highlights: ['Normalized relational schema with 6 tables', 'Real-time order tracking map'],
          },
        ],
        certifications: [
          { name: 'Meta Certified Front-End Developer', issuer: 'Meta / Coursera', year: '2024' },
        ],
        rawTextPreview: 'Alex Chen | Stanford CS Junior | Full-Stack Developer (React, TypeScript, Node.js, SQL)',
      },
    };

    const demoAnalysis: JobMatchAnalysis = {
      id: analysisId,
      userId,
      resumeId,
      resumeTitle: demoResume.title,
      internshipTitle: 'Full-Stack Software Engineering Intern (Summer 2026)',
      companyName: 'Stripe',
      domain: 'Full-Stack Development & Distributed Systems',
      jobDescriptionText: `About Stripe:
Stripe is a financial infrastructure platform for the internet. Millions of companies use Stripe's software and APIs to accept payments, send payouts, and manage their businesses online.

The Role:
As a Software Engineering Intern on the Core Infrastructure & Product Teams, you will build user-facing financial dashboards and resilient backend services that process millions of transactions daily.

Key Responsibilities:
- Build delightful, accessible, and fast web applications in React, TypeScript, and Node.js.
- Develop and maintain scalable backend microservices, caching layers, and database schemas.
- Collaborate with engineers, designers, and product managers to ship production-ready features.
- Write robust unit, integration, and end-to-end tests to guarantee high financial reliability.

Requirements:
- Currently enrolled in a Bachelor's or Master's program in Computer Science or related engineering field, graduating between Dec 2026 and June 2027.
- Solid understanding of computer science fundamentals: algorithms, data structures, and object-oriented or functional programming.
- Hands-on experience building web apps with TypeScript, JavaScript, React, and Node.js or Python.
- Working knowledge of relational databases and SQL (PostgreSQL or MySQL).
- Familiarity with Git version control and modern software development workflows.

Preferred Qualifications:
- Experience with Redis or in-memory caching mechanisms.
- Experience with Docker containerization and CI/CD pipelines (GitHub Actions).
- Exposure to distributed systems, message queues (Kafka/RabbitMQ), or high-throughput payment architectures.
- Experience with API design, GraphQL, or OpenAPI specs.`,
      requiredSkillsSpecified: [
        'TypeScript',
        'React',
        'Node.js',
        'PostgreSQL',
        'SQL',
        'Data Structures & Algorithms',
        'Git',
        'REST APIs',
      ],
      preferredSkillsSpecified: [
        'Redis',
        'Docker',
        'CI/CD Pipelines (GitHub Actions)',
        'GraphQL',
        'Distributed Systems Basics',
      ],
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      overallMatchScore: 78,
      scoreBreakdown: {
        coreSkillsScore: 92,
        experienceAndProjectsScore: 82,
        preferredAndEducationScore: 60,
        explanation:
          'Score derived using weighted criteria: Core Required Skills (50% weight -> 46 pts), Demonstrated Projects & Real Experience (30% weight -> 24.6 pts), Preferred Systems/DevOps Skills & Education (20% weight -> 12 pts). Strong foundation in React/TS/Node/SQL, but lacking Redis caching and containerization experience.',
      },
      matchingSkills: [
        {
          skill: 'TypeScript & JavaScript',
          evidenceInResume: 'Used in ByteCrafters internship and TaskFlow Kanban board project with high proficiency.',
          importance: 'high',
        },
        {
          skill: 'React & Modern Frontend',
          evidenceInResume: 'Primary frontend framework across past internship and 2 major projects; holds Meta Front-End certificate.',
          importance: 'high',
        },
        {
          skill: 'Node.js & Express REST APIs',
          evidenceInResume: 'Built RESTful services at ByteCrafters Labs and implemented backend endpoints in TaskFlow.',
          importance: 'high',
        },
        {
          skill: 'PostgreSQL & SQL Schema Design',
          evidenceInResume: 'Engineered relational schema with Prisma in TaskFlow; query indexing performance optimization experience.',
          importance: 'high',
        },
        {
          skill: 'Data Structures & Algorithms',
          evidenceInResume: 'Stanford CS coursework completed with 3.82 GPA.',
          importance: 'high',
        },
        {
          skill: 'Git & Automated Testing (Jest)',
          evidenceInResume: 'Active GitHub portfolio, 84% Jest test coverage achieved in internship.',
          importance: 'medium',
        },
      ],
      partiallyMatchingSkills: [
        {
          skill: 'Cloud & Infrastructure (AWS vs Production Systems)',
          studentHas: 'Basic AWS S3/EC2 setup',
          gapDescription: 'Role demands understanding of scalable microservices, resilient APIs, and production deployment patterns.',
        },
        {
          skill: 'API Architecture (GraphQL vs REST)',
          studentHas: 'Strong REST API experience',
          gapDescription: 'Familiarity with GraphQL queries, mutations, or schema stitching is preferred at Stripe.',
        },
      ],
      missingRequiredSkills: [
        {
          skill: 'Production System Design Fundamentals',
          reasonNeeded: 'Stripe interviews heavily evaluate how candidates design fault-tolerant systems and handle concurrency/rate-limiting.',
          difficultyToLearn: 'Intermediate',
        },
      ],
      missingPreferredSkills: [
        {
          skill: 'Redis & In-Memory Caching',
          advantage: 'Critical for high-throughput payment processing architectures and session rate-limiting.',
        },
        {
          skill: 'Docker & Containerization',
          advantage: 'Industry-standard local development and cloud container orchestration tooling.',
        },
        {
          skill: 'CI/CD Pipelines (GitHub Actions)',
          advantage: 'Demonstrates end-to-end engineering discipline from pull request to automated test verification.',
        },
      ],
      strengths: [
        'Exceptional alignment on core web stack (React, TypeScript, Node.js, PostgreSQL).',
        'Clear evidence of real-world impact (28% engagement increase, 18% query optimization).',
        'Strong academic computer science background and Meta front-end certification.',
      ],
      weaknesses: [
        'Absence of containerization (Docker) in projects makes onboarding to complex enterprise codebases slower.',
        'No demonstrated experience with Redis caching or rate-limiting concepts, which Stripe prioritizes.',
        'Resume lacks exposure to CI/CD pipeline automation.',
      ],
      resumeImprovements: [
        'Add a bullet in the TaskFlow project demonstrating Docker containerization or CI/CD workflow.',
        'Quantify concurrency or data scale in the CampusEats project (e.g., number of concurrent queries or API latency SLA).',
        'Highlight distributed systems or concurrency concepts learned in Stanford coursework.',
      ],
      actionableSteps: [
        'Complete a 1-week Redis module: implement an in-memory cache and rate-limiter on top of the TaskFlow Express API.',
        'Containerize the full-stack TaskFlow app using Docker and docker-compose.',
        'Add a GitHub Actions workflow that automatically runs ESLint, TypeScript compilation, and Jest tests on each push.',
        'Review system design patterns: idempotency keys, payment webhooks, and asynchronous message queues.',
      ],
    };

    const demoRoadmap: LearningRoadmap = {
      id: roadmapId,
      userId,
      analysisId,
      internshipTitle: demoAnalysis.internshipTitle,
      companyName: demoAnalysis.companyName,
      title: 'Stripe SWE Intern Readiness Roadmap (4 Weeks)',
      targetCompletionWeeks: 4,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      summary:
        'Bridge the gap from standard full-stack web developer to distributed systems & fintech intern by mastering Redis caching, Docker containerization, CI/CD with GitHub Actions, and Stripe-style API idempotency.',
      currentStrengths: [
        'Exceptional alignment on React, TypeScript, Node.js, and PostgreSQL',
        'Demonstrated real-world impact with measurable performance optimizations',
        'Strong academic computer science background and Meta front-end certification',
      ],
      prioritizedSkills: [
        {
          skill: 'Redis & In-Memory Caching',
          priority: 'High',
          reason: 'Critical for high-throughput payment architectures and distributed rate limiting',
          category: 'Databases & In-Memory',
        },
        {
          skill: 'Docker & Containerization',
          priority: 'High',
          reason: 'Industry-standard container orchestration and reproducible dev environments',
          category: 'DevOps & Tooling',
        },
        {
          skill: 'Financial API Idempotency',
          priority: 'High',
          reason: 'Mandatory pattern for reliable financial transactions and webhook processing',
          category: 'Architecture',
        },
        {
          skill: 'CI/CD Pipelines (GitHub Actions)',
          priority: 'Medium',
          reason: 'Automates linting, test coverage, and automated delivery gates',
          category: 'DevOps & Tooling',
        },
      ],
      phases: [
        {
          phaseNumber: 1,
          title: 'Phase 1: In-Memory Caching & Containerization',
          description: 'Master Redis data structures, rate limiting, and multi-stage Docker builds.',
          durationWeeks: 1,
          prerequisites: ['Node.js', 'Express', 'Basic Linux'],
        },
        {
          phaseNumber: 2,
          title: 'Phase 2: CI/CD Quality Automation & Testing',
          description: 'Configure automated GitHub Actions for pull-request verification.',
          durationWeeks: 1,
          prerequisites: ['Git', 'Jest'],
        },
        {
          phaseNumber: 3,
          title: 'Phase 3: Robust Fintech Patterns & Distributed Scaling',
          description: 'Build idempotent API endpoints with transaction rollbacks and system design specs.',
          durationWeeks: 2,
          prerequisites: ['Phase 1', 'PostgreSQL transactions'],
        },
      ],
      finalPortfolioProject: {
        title: 'Production-Ready Payment Gateway Simulation with Redis & Docker',
        description:
          'A distributed, containerized payment gateway microservice featuring token-bucket rate limiting, idempotent charge processing, PostgreSQL transactional ledger, and automated GitHub Actions CI/CD.',
        techStack: ['TypeScript', 'Node.js', 'PostgreSQL', 'Redis', 'Docker', 'Jest'],
        deliverables: [
          'Public GitHub repository with 90%+ test coverage',
          'Single-command docker-compose.yml configuration',
          'Interactive Swagger / OpenAPI documentation',
          'Architecture specification explaining idempotency guarantees',
        ],
        completionCriteria:
          'Passes concurrent charge retry tests with 0 duplicate ledger entries and demonstrates sub-10ms cache response times.',
      },
      tasks: [
        {
          id: 'task-1',
          weekNumber: 1,
          skill: 'Redis & API Caching',
          title: 'Implement Redis Caching & Rate Limiting in Express',
          importanceReason:
            'Stripe processes millions of API calls per second and relies heavily on Redis for distributed locks, caching, and token bucket rate limiters.',
          learningObjective:
            'Understand Redis data structures (Strings, Hashes, Sorted Sets) and wire a cache-aside pattern into an Express endpoint.',
          priority: 'High',
          estimatedDuration: '6 hours',
          recommendedResource: {
            name: 'Redis University - RU101: Introduction to Redis Data Structures',
            url: 'https://university.redis.com/courses/ru101/',
            type: 'Course',
            isFree: true,
          },
          practiceProject: {
            title: 'Express Redis Rate-Limiter Middleware',
            description: 'Build an IP-based sliding-window rate limiter middleware using Redis in Node.js.',
            deliverable: 'A working middleware function with unit tests validating max 60 req/min.',
          },
          prerequisites: ['Node.js', 'Express', 'Asynchronous JS'],
          status: 'completed',
          targetDate: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
          completedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
          studentNotes: 'Completed RU101 module. Built the sliding window rate limiter in my test repository and verified with Postman collection!',
        },
        {
          id: 'task-2',
          weekNumber: 1,
          skill: 'Docker Containerization',
          title: 'Containerize Full-Stack App with Multi-Stage Dockerfile',
          importanceReason:
            'Ensures reproducible development environments and matches Stripe production deployment workflows.',
          learningObjective:
            'Write clean Dockerfiles for React (Vite) and Node.js backend, and orchestrate with docker-compose.',
          priority: 'High',
          estimatedDuration: '5 hours',
          recommendedResource: {
            name: 'Docker Official Getting Started Guide & Node.js Best Practices',
            url: 'https://docs.docker.com/get-started/',
            type: 'Documentation',
            isFree: true,
          },
          practiceProject: {
            title: 'Docker Compose for TaskFlow',
            description: 'Containerize frontend, backend, PostgreSQL, and Redis in a single docker-compose.yml file.',
            deliverable: 'Running single command `docker compose up` that spins up the full working application.',
          },
          prerequisites: ['Linux basics', 'Environment variables'],
          status: 'in_progress',
          targetDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
          studentNotes: 'Wrote the Node backend Dockerfile using Alpine image. Next: configure docker-compose network for Postgres and Redis.',
        },
        {
          id: 'task-3',
          weekNumber: 2,
          skill: 'CI/CD Automation',
          title: 'Automate Testing & Linting with GitHub Actions',
          importanceReason:
            'Top tier engineering teams never merge unverified code. Demonstrating GitHub Actions shows professional maturity.',
          learningObjective:
            'Create a workflow file in .github/workflows that runs on pull requests, executing linting, TypeScript compile, and Jest tests.',
          priority: 'Medium',
          estimatedDuration: '4 hours',
          recommendedResource: {
            name: 'GitHub Skills: Automate DevOps with GitHub Actions',
            url: 'https://skills.github.com/',
            type: 'Interactive',
            isFree: true,
          },
          practiceProject: {
            title: 'Automated PR Quality Gate',
            description: 'Set up branch protection and automated verification for your TaskFlow repository.',
            deliverable: 'A green check badge on your public GitHub repository demonstrating passing CI.',
          },
          prerequisites: ['Git', 'Jest', 'npm scripts'],
          status: 'not_started',
          targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        },
        {
          id: 'task-4',
          weekNumber: 3,
          skill: 'Financial API Design & Idempotency',
          title: 'Master API Idempotency & Webhook Resilience',
          importanceReason:
            'Stripe is famous for its Idempotency-Key header standard. Knowing how to prevent duplicate payment charges is an instant interview winner.',
          learningObjective:
            'Learn how idempotency keys work with database transactions to prevent double charges during network retries.',
          priority: 'High',
          estimatedDuration: '8 hours',
          recommendedResource: {
            name: 'Stripe Engineering Blog: Designing Robust and Idempotent APIs',
            url: 'https://stripe.com/blog/idempotency',
            type: 'Documentation',
            isFree: true,
          },
          practiceProject: {
            title: 'Idempotent Payment Simulation Endpoint',
            description: 'Create a `/api/charges` endpoint that accepts an `Idempotency-Key` header, caching request IDs in Redis with Postgres rollback.',
            deliverable: 'Demonstrated curl test showing duplicate requests return the same response without duplicate DB records.',
          },
          prerequisites: ['PostgreSQL transactions', 'Redis', 'Express'],
          status: 'not_started',
          targetDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        },
        {
          id: 'task-5',
          weekNumber: 4,
          skill: 'System Design for Interns',
          title: 'Core System Design & Scale Fundamentals',
          importanceReason:
            'Prepares for technical round discussions on database sharding, connection pooling, and message queuing.',
          learningObjective:
            'Understand vertical vs horizontal scaling, CDN caching, database read replicas, and asynchronous workers.',
          priority: 'Medium',
          estimatedDuration: '6 hours',
          recommendedResource: {
            name: 'System Design Primer by Donne Martin',
            url: 'https://github.com/donnemartin/system-design-primer',
            type: 'Project Guide',
            isFree: true,
          },
          practiceProject: {
            title: 'Architecture Diagram for Scaled TaskFlow',
            description: 'Diagram the scaled architecture of TaskFlow handling 50k active users with load balancers, read replicas, and Redis.',
            deliverable: 'Visual architecture spec sheet to include in GitHub portfolio.',
          },
          prerequisites: ['Database Systems', 'HTTP protocols'],
          status: 'not_started',
          targetDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
        },
      ],
    };

    this.saveResume(demoResume);
    this.saveAnalysis(demoAnalysis);
    this.saveRoadmap(demoRoadmap);
  }
}

export const db = new DatabaseService();
