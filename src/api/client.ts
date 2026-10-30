import {
  User,
  StudentProfile,
  ResumeRecord,
  JobMatchAnalysis,
  LearningRoadmap,
  RoadmapTask,
  DashboardStats,
  CareerRecommendation,
} from '../types';

const TOKEN_KEY = 'skillbridge_auth_token';

let memoryToken: string | null = null;

export const authStorage = {
  getToken(): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem(TOKEN_KEY) || memoryToken;
      }
    } catch {
      // LocalStorage restricted or blocked by iframe sandbox
    }
    return memoryToken;
  },
  setToken(token: string) {
    memoryToken = token;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    } catch {}
  },
  clearToken() {
    memoryToken = null;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {}
  },
};

async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = authStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // 45-second timeout to prevent indefinite hanging in the UI
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data?.error || `Request failed with status ${response.status}`;
      const err = new Error(errorMsg) as any;
      err.status = response.status;
      err.code = data?.code;
      err.retryable = data?.retryable;
      err.dailyQuota = data?.dailyQuota;
      throw err;
    }

    return data as T;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Request timed out. The server took too long to respond. Please try again.') as any;
      timeoutErr.status = 504;
      timeoutErr.code = 'TIMEOUT';
      timeoutErr.retryable = true;
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  // Auth
  async register(name: string, email: string, password: string) {
    const data = await apiRequest<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    authStorage.setToken(data.token);
    return data;
  },

  async login(email: string, password: string) {
    const data = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    authStorage.setToken(data.token);
    return data;
  },

  async demoLogin() {
    const data = await apiRequest<{ token: string; user: User }>('/api/auth/demo', {
      method: 'POST',
    });
    authStorage.setToken(data.token);
    return data;
  },

  async getMe() {
    return apiRequest<{ user: User }>('/api/auth/me');
  },

  async resetPassword(email: string, newPassword: string) {
    return apiRequest<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  },

  async updateProfile(profile: Partial<StudentProfile>, name?: string) {
    return apiRequest<{ user: User }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ profile, name }),
    });
  },

  // Resumes
  async getResumes() {
    return apiRequest<{ resumes: ResumeRecord[] }>('/api/resumes');
  },

  async getResume(id: string) {
    return apiRequest<{ resume: ResumeRecord }>(`/api/resumes/${id}`);
  },

  async uploadResumePdf(file: File) {
    const formData = new FormData();
    formData.append('resumeFile', file);
    return apiRequest<{ resume: ResumeRecord }>('/api/resumes/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async uploadResumeText(title: string, text: string) {
    return apiRequest<{ resume: ResumeRecord }>('/api/resumes/text', {
      method: 'POST',
      body: JSON.stringify({ title, text }),
    });
  },

  async updateResume(id: string, updates: { title?: string; extractedData?: any }) {
    return apiRequest<{ resume: ResumeRecord }>(`/api/resumes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteResume(id: string) {
    return apiRequest<{ message: string }>(`/api/resumes/${id}`, {
      method: 'DELETE',
    });
  },

  // Job Match Analyses
  async getAnalyses() {
    return apiRequest<{ analyses: JobMatchAnalysis[] }>('/api/analyses');
  },

  async getAnalysis(id: string) {
    return apiRequest<{ analysis: JobMatchAnalysis }>(`/api/analyses/${id}`);
  },

  async createAnalysis(params: {
    resumeId: string;
    internshipTitle: string;
    companyName?: string;
    domain?: string;
    jobDescriptionText: string;
    requiredSkillsSpecified?: string[];
    preferredSkillsSpecified?: string[];
  }) {
    return apiRequest<{ analysis: JobMatchAnalysis }>('/api/analyses', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async updateAnalysis(id: string, internshipTitle: string, companyName?: string) {
    return apiRequest<{ analysis: JobMatchAnalysis }>(`/api/analyses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ internshipTitle, companyName }),
    });
  },

  async deleteAnalysis(id: string) {
    return apiRequest<{ message: string }>(`/api/analyses/${id}`, {
      method: 'DELETE',
    });
  },

  // Roadmaps
  async getRoadmaps() {
    return apiRequest<{ roadmaps: LearningRoadmap[] }>('/api/roadmaps');
  },

  async getRoadmap(id: string) {
    return apiRequest<{ roadmap: LearningRoadmap }>(`/api/roadmaps/${id}`);
  },

  async recommendCareers(resumeId?: string) {
    return apiRequest<{
      recommendations: CareerRecommendation[];
      resumeId: string;
      resumeTitle: string;
    }>('/api/roadmaps/recommend-careers', {
      method: 'POST',
      body: JSON.stringify({ resumeId }),
    });
  },

  async generateRoadmap(
    paramsOrAnalysisId:
      | string
      | {
          analysisId?: string;
          targetRole?: string;
          companyName?: string;
          jobDescriptionText?: string;
          selectedRole?: string;
          roleContext?: any;
          resumeId?: string;
          preserveCompleted?: boolean;
        },
    preserveCompleted: boolean = true
  ) {
    const payload =
      typeof paramsOrAnalysisId === 'string'
        ? { analysisId: paramsOrAnalysisId, preserveCompleted }
        : { preserveCompleted, ...paramsOrAnalysisId };

    return apiRequest<{ roadmap: LearningRoadmap }>('/api/roadmaps/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateRoadmapTitle(id: string, title: string) {
    return apiRequest<{ roadmap: LearningRoadmap }>(`/api/roadmaps/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ title }),
    });
  },

  async updateRoadmapTask(
    roadmapId: string,
    taskId: string,
    updates: Partial<RoadmapTask>
  ) {
    return apiRequest<{ roadmap: LearningRoadmap }>(
      `/api/roadmaps/${roadmapId}/tasks/${taskId}`,
      {
        method: 'PUT',
        body: JSON.stringify(updates),
      }
    );
  },

  async addRoadmapTask(roadmapId: string, task: Partial<RoadmapTask>) {
    return apiRequest<{ roadmap: LearningRoadmap; task: RoadmapTask }>(
      `/api/roadmaps/${roadmapId}/tasks`,
      {
        method: 'POST',
        body: JSON.stringify(task),
      }
    );
  },

  async deleteRoadmapTask(roadmapId: string, taskId: string) {
    return apiRequest<{ roadmap: LearningRoadmap }>(
      `/api/roadmaps/${roadmapId}/tasks/${taskId}`,
      {
        method: 'DELETE',
      }
    );
  },

  async deleteRoadmap(id: string) {
    return apiRequest<{ message: string }>(`/api/roadmaps/${id}`, {
      method: 'DELETE',
    });
  },

  // Dashboard & Demo
  async getDashboard() {
    return apiRequest<{ stats: DashboardStats }>('/api/dashboard');
  },

  async seedDemoData() {
    return apiRequest<{ message: string; stats: DashboardStats }>('/api/demo/seed', {
      method: 'POST',
    });
  },

  // Health
  async getHealth() {
    return apiRequest<{ status: string; geminiKeyConfigured: boolean }>('/api/health');
  },
};
