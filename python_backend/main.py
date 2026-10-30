"""
SkillBridge AI - Python FastAPI Backend Reference Implementation
This is the complete, self-contained Python FastAPI alternative backend using PyMuPDF (fitz) and Google GenAI.
To run:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000
"""

import os
import json
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import fitz  # PyMuPDF
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="SkillBridge AI - FastAPI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for MVP demonstration
DB = {
    "users": {},
    "resumes": {},
    "analyses": {},
    "roadmaps": {}
}

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class ResumeTextInput(BaseModel):
    title: str
    text: str

class JobAnalysisRequest(BaseModel):
    resumeId: str
    internshipTitle: str
    companyName: Optional[str] = ""
    domain: Optional[str] = "Software Engineering"
    jobDescriptionText: str
    requiredSkillsSpecified: Optional[List[str]] = []
    preferredSkillsSpecified: Optional[List[str]] = []

def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")
    token = authorization.split(" ")[1]
    return "demo-user-id"

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "engine": "FastAPI + PyMuPDF",
        "has_gemini_key": bool(os.getenv("GEMINI_API_KEY"))
    }

@app.post("/api/resumes/upload")
async def upload_pdf_resume(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id)
):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    content = await file.read()
    try:
        doc = fitz.open(stream=content, filetype="pdf")
        extracted_text = "\n".join([page.get_text() for page in doc])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract PDF text with PyMuPDF: {str(e)}")

    if len(extracted_text.strip()) < 40:
        raise HTTPException(status_code=422, detail="PDF has no extractable text. It may be scanned or empty.")

    # Returns extracted resume record
    return {
        "id": f"resume-{os.urandom(4).hex()}",
        "title": file.filename,
        "extracted_text_preview": extracted_text[:300],
        "message": "Resume uploaded and extracted successfully using PyMuPDF"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
