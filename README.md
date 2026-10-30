# SkillBridge AI — Smart Internship & Skill Gap Planner

SkillBridge AI is a full-stack SaaS platform designed for university students to assess their internship readiness, identify skill gaps against real job descriptions, and follow personalized learning roadmaps with free curated resources.

---

## 🌟 Key Features

1. **Student Authentication & Isolated Profiles**
   - User registration, login, logout, and token authorization.
   - Profile management with university, degree, branch, graduation year, current skills, and target career domains.
   - 1-Click Interactive Demo Mode pre-populated with a Stanford CS Junior profile (Alex Chen), sample resume, Stripe internship evaluation, and active 4-week roadmap.

2. **Resume Analyzer & Actual PDF Text Extraction**
   - Supports searchable PDF upload (up to 10MB) using server-side `pdf-parse` as well as direct text paste.
   - Structured extraction with Gemini AI (`gemini-3.8-flash`) extracting languages, frameworks, databases, developer tools, projects, and work experience.
   - Interactive review and correction screen allowing students to add or remove skills and edit details before saving.
   - Graceful fallback and user notices for scanned or unreadable PDFs.

3. **Internship Job Description Matcher**
   - Compare any uploaded resume against target internship job postings.
   - Includes quick-test presets (Stripe Full-Stack Intern, Notion Product Engineer Intern, Datadog Frontend Intern).
   - Mathematical 50/30/20 Match Score:
     - 50% Core Required Skills
     - 30% Demonstrated Projects & Applied Experience
     - 20% Preferred Qualifications & Education Alignment
   - Transparent derivation breakdown, direct quotes citing resume evidence, missing required skills with learning difficulty, missing preferred skills, strengths, weaknesses, and bullet rewriting tips.

4. **AI-Personalized Learning Roadmap**
   - Actionable 3 to 6 week structured curriculum prioritized from foundational concepts to advanced topics.
   - Each milestone task includes:
     - Skill to learn and importance for the role
     - Concrete learning objective
     - Priority level (High, Medium, Low) and estimated hours
     - Verified reputable free resource link (MDN, official docs, CS50, freeCodeCamp)
     - Applied mini-project deliverable to add to GitHub
     - Completion status (Not Started, In Progress, Completed)
     - Student notes drawer for study links and reflections
   - Add custom personal tasks and regenerate roadmaps while optionally preserving completed tasks.

5. **Measurable Progress Tracker**
   - Live completion rate calculation from actual task statuses.
   - Weekly progress bars (Week 1 to Week 4).
   - Completed vs in-progress vs pending task counts.
   - Interactive checklist with instant status toggles.

6. **Saved Records & History**
   - Browse previous resume analyses, job match evaluations, and saved roadmaps.
   - Search/filter by title, company, or track.
   - Rename and delete records with confirmation modals.

7. **FastAPI Alternative Reference Backend**
   - Complete Python FastAPI implementation located in `/python_backend/main.py` using PyMuPDF (`fitz`) and Pydantic models.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Node.js, Express, tsx
- **Database**: Persistent ACID JSON file-store in `./data/db.json` with user isolation
- **PDF Extraction**: `pdf-parse`
- **AI Model**: Google Gemini API via `@google/genai` (`gemini-3.8-flash`) with server-side `aistudio-build` telemetry

---

## 🚀 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Ensure `.env` contains your Gemini API key:
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PORT=3000
```

### 3. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:3000` with both the Express API and Vite frontend running simultaneously.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🐍 Standalone Python FastAPI Backend (Optional)
If running the Python FastAPI alternative:
```bash
cd python_backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
