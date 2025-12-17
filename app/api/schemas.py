from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

# Resume Schemas
class ResumeInput(BaseModel):
    content: str = Field(..., description="Resume text content")
    file_type: str = Field(default="txt", description="File type: txt, pdf")

class ResumeParsed(BaseModel):
    skills: List[str] = []
    experience_years: float = 0.0
    education: List[str] = []
    keywords: List[str] = []
    summary: Optional[str] = ""


class ATSScore(BaseModel):
    overall_score: float
    skills_match: float
    experience_match: float
    education_match: float
    keywords_match: float

    # 🔥 JD-based extras (optional if JD provided)
    job_match_score: Optional[float] = 0.0
    matched_keywords: List[str] = []
    missing_keywords: List[str] = []

    improvements: List[str] = []


class ResumeAnalysisResponse(BaseModel):
    file_name: str
    parsed_resume: ResumeParsed
    ats_score: ATSScore
    rewritten_summary: Optional[str] = None
    rewritten_bullets: Optional[List[str]] = None
   

# Job Schemas
class JobPosting(BaseModel):
    title: str
    company: str
    location: str
    salary_range: Optional[str]
    description: str
    requirements: List[str]
    benefits: Optional[List[str]]
    source: str
    url: Optional[str]

class JobSearchInput(BaseModel):
    query: str = Field(..., description="Job title or keywords")
    location: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    job_type: Optional[str] = None

class JobSearchResponse(BaseModel):
    jobs: List[JobPosting]
    total_found: int
    query: str

# Interview Schemas
class DifficultyLevel(str, Enum):
    beginner = "beginner"
    intermediate = "intermediate"
    advanced = "advanced"

class InterviewQAInput(BaseModel):
    job_title: str
    job_description: Optional[str] = None
    difficulty: DifficultyLevel = DifficultyLevel.intermediate
    num_questions: int = 10

class InterviewQuestion(BaseModel):
    question: str
    topic: str
    difficulty: DifficultyLevel
    expected_answer_points: List[str]
    follow_ups: List[str]

class InterviewQAResponse(BaseModel):
    job_title: str
    questions: List[InterviewQuestion]
    preparation_tips: List[str]
# Agent Workflow Schemas
class WorkflowInput(BaseModel):
    task_type: str
    data: Dict[str, Any]

class WorkflowOutput(BaseModel):
    status: str
    result: Dict[str, Any]
    error: Optional[str] = None
