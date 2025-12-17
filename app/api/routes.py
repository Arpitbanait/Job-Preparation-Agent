from fastapi import APIRouter, HTTPException, UploadFile, File, Body, Form
from typing import Optional, List, Literal
import os, json, logging, smtplib, ssl, re, textwrap
from pydantic import BaseModel, EmailStr

# AI / Resume Modules
from modules.resume_text_extractor import extract_text_from_pdf
from modules.resume_ats import ResumeAgent
from modules.job_scraper import JobScraper
from modules.interview_qa import InterviewQAGenerator
from modules.cover_letter import extract_resume_text, create_cover_letter, extract_candidate_info
from modules.gmail_sender import send_gmail, send_gmail_with_attachment
from agents.supervisor_agent import JobSearchSupervisor
from agents.job_search_agent import JobSearchAgent
from agents.application_workflow import create_application_graph, ApplicationState
from langgraph.checkpoint.memory import MemorySaver

# Schemas
from app.api.schemas import (
    ResumeAnalysisResponse, JobPosting, JobSearchInput, JobSearchResponse,
    InterviewQAInput, InterviewQAResponse, WorkflowOutput
)

# Anthropic Client (NEW)
from anthropic import AsyncAnthropic
from app.config import get_settings


settings = get_settings()
anthropic_client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["job-search-ai"])

memory = MemorySaver()
supervisor = None  
resume_ats = ResumeAgent()
job_scraper = JobScraper()
job_agent = JobSearchAgent()
interview_qa = InterviewQAGenerator()


def get_supervisor():
    global supervisor
    if supervisor is None:
        supervisor = JobSearchSupervisor()
    return supervisor


# ─────────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────────
@router.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.API_VERSION}



# ─────────────────────────────────────────────
# 📄 Resume ATS Analyzer
# ─────────────────────────────────────────────
@router.post("/analyze-resume")
async def analyze_resume(file: UploadFile = File(...), job_description: str = Form("")):
    try:
        file_path = f"temp/{file.filename}"
        with open(file_path, "wb") as f:
            f.write(await file.read())

        resume_text = extract_text_from_pdf(file_path)
        result = await resume_ats.analyze_resume(resume_text, job_description)

        return result
    except Exception as e:
        return {"error": str(e)}, 400



# ─────────────────────────────────────────────
# 🔍 Job Search + Ranking
# ─────────────────────────────────────────────
@router.post("/search-jobs", response_model=JobSearchResponse)
async def search_jobs(search_input: JobSearchInput, resume_skills: Optional[List[str]] = None):
    try:
        scraped = await job_scraper.search(
            query=search_input.query,
            location=search_input.location,
            salary_min=search_input.salary_min,
            salary_max=search_input.salary_max,
            job_type=search_input.job_type
        )

        jobs = scraped or []
        job_dicts = [j.dict() for j in jobs]

        ranked = await job_agent.filter_and_rank(job_dicts, resume_skills) if resume_skills else job_dicts
        ranked_models = [JobPosting(**j) for j in ranked]

        return JobSearchResponse(jobs=ranked_models, total_found=len(ranked_models), query=search_input.query)

    except Exception as e:
        logger.error(f"Job search error: {e}")
        raise HTTPException(status_code=400, detail=str(e))



# ─────────────────────────────────────────────
# 🎤 Interview QA Generator
# ─────────────────────────────────────────────
@router.post("/generate-interview-qa", response_model=InterviewQAResponse)
async def generate_interview_qa(interview_input: InterviewQAInput):
    try:
        return await interview_qa.generate(
            interview_input.job_title,
            interview_input.job_description,
            interview_input.difficulty,
            interview_input.num_questions
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



# ─────────────────────────────────────────────
# ✍️ Cover Letter Generator
# ─────────────────────────────────────────────
@router.post("/generate-cover-letter")
async def generate_cover_letter(resume_pdf: UploadFile = File(...), job_description: str = Form(...),
                                role: str = Form(...), company: str = Form(...)):
    try:
        path = "uploaded_resume.pdf"
        with open(path,"wb") as f: f.write(await resume_pdf.read())

        resume_text = extract_resume_text(path)
        return {"cover_letter": await create_cover_letter(resume_text, job_description, role, company)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



# ─────────────────────────────────────────────
# 📩 OAuth Email Sending
# ─────────────────────────────────────────────
@router.post("/send-mail-oauth")
async def send_mail(
    to: str = Form(...),
    subject: str = Form(...),
    body: str = Form(""),
    resume_pdf: UploadFile | None = File(None),
    role: str = Form(""),
    company: str = Form(""),
    auto_links: bool = Form(True),
    short: bool = Form(False),
):
    """Send an email via Gmail OAuth.

    - If resume is provided, it will be attached.
    - If auto_links is True and resume provided, LinkedIn/GitHub/Portfolio links (if found) are added.
    - If short is True and resume provided, a concise body is generated automatically.
    """

    attachment_path = None
    candidate = None
    if resume_pdf is not None:
        attachment_path = f"temp/{resume_pdf.filename}"
        with open(attachment_path, "wb") as f:
            f.write(await resume_pdf.read())

        # Extract links/name from resume
        resume_text = extract_resume_text(attachment_path)
        candidate = extract_candidate_info(resume_text)

    # If resume is attached and short not explicitly set, default to short
    if attachment_path and candidate and short is False:
        short = True

    # Build ultra-short, line-based body when short is requested
    if short and candidate:
        name = candidate.get("name") or "Candidate"
        li = candidate.get("linkedin")
        gh = candidate.get("github")
        pf = candidate.get("portfolio")

        lines = []
        greeting = (f"Hello {company} Hiring Team" if company else "Hello")
        titleLine = (f"Role: {role}" if role else "Role: N/A")
        lines.append(greeting)
        lines.append(titleLine)
        lines.append("Resume: Attached")

        link_lines = []
        if li: link_lines.append(f"LinkedIn: {li}")
        if gh: link_lines.append(f"GitHub: {gh}")
        if pf: link_lines.append(f"Portfolio: {pf}")
        lines.extend(link_lines)

        lines.append(f"Thanks,\n{name}")
        body = "\n".join([l for l in lines if l])
    else:
        # Append links to existing body if requested
        if auto_links and candidate:
            li = candidate.get("linkedin")
            gh = candidate.get("github")
            pf = candidate.get("portfolio")
            extra = []
            if li: extra.append(f"LinkedIn: {li}")
            if gh: extra.append(f"GitHub: {gh}")
            if pf: extra.append(f"Portfolio: {pf}")
            if extra:
                body = body.rstrip() + "\n\n" + "\n".join(extra)

    # Send with or without attachment
    if attachment_path:
        result = send_gmail_with_attachment(to, subject, body, attachment_path, resume_pdf.filename)
    else:
        result = send_gmail(to, subject, body)

    return {"status": "sent", "to": to, "id": result.get("id")}



# ─────────────────────────────────────────────
# ⚙ Workflow Execution
# ─────────────────────────────────────────────
@router.post("/workflow/job-apply/start")
async def workflow_start(resume: UploadFile = File(...), job_desc: str = Form(...), hr_email: str = Form(...),
                         subject: str = Form(...), role: str = Form("Data Analyst"), company: str = Form("TCS")):

    workflow = create_application_graph()

    file = "resume.pdf"
    with open(file,"wb") as f: f.write(await resume.read())
    resume_bytes = open(file,"rb").read()

    initial = ApplicationState(resume_text=None, cover_letter=None, job_description=job_desc,
                               approved=False, email_sent=False)

    config = { "resume_file":resume_bytes, "job_desc":job_desc, "role":role,
               "company":company, "hr_email":hr_email, "subject":subject, "approved":True }

    result = await workflow.ainvoke(input=initial, config=config)

    return {"status":"Workflow executed", "result":result}


# ─────────────────────────────────────────────
# 👨‍💼 AI Recruiter Chat — FIXED AND CLEAN ✔
# ─────────────────────────────────────────────

class RecruiterChatRequest(BaseModel):
    message:str
    history:List[dict]
    role:str
    company:str
    resumeSummary:str
    jobDescription:str


class InterviewAnalysisRequest(BaseModel):
    conversation: str
    role: str
    company: str


@router.post("/recruiter/chat")
async def recruiter_chat(req: RecruiterChatRequest):

    prompt = f"""
You are an HR recruiter interviewing for **{req.role}** at **{req.company}**.

Resume Summary:
{req.resumeSummary}

Job Description:
{req.jobDescription}

Conversation History:
{req.history}

Candidate message:
{req.message}

### RULES FOR RESPONSE ###
- Ask ONE short question at a time (10–18 words max)
- No long paragraphs, no explanations unless requested
- If user's answer is weak → give short improvement Suggestion (max 2 lines)
- Tone: real recruiter, crisp, interview-style
- End every response with a next question prompt to continue
- Keep conversation natural, interactive

Your next response must be:
1) 1 line feedback (only if needed)
2) Next interview question (short, direct)
"""

    # ⬅️ Using the SAME model that is already working in interview QA
    response = await anthropic_client.messages.create(
        model=settings.MODEL_NAME,    # << SAME MODEL AS YOUR OTHER ROUTES
        max_tokens=350,
        messages=[{"role": "user", "content": prompt}],
    )

    return {
        "answer": response.content[0].text.strip()
    }


@router.post("/interview/analyze")
async def analyze_interview(req: InterviewAnalysisRequest):
    """Analyze completed interview and return performance score + feedback."""
    conversation = req.conversation
    role = req.role
    company = req.company

    if not conversation:
        raise HTTPException(status_code=400, detail="No conversation data")

    prompt = f"""
You are an expert interview analyst. Analyze this recruiter-candidate conversation for a **{role}** role at **{company}**.

Conversation:
{conversation}

Return JSON ONLY (no markdown):
{{
  "performance_score": 0-100,
  "strengths": ["...", "...", "..."],
  "improvements": ["...", "...", "..."],
  "overall_feedback": "2-3 sentence professional summary"
}}
"""

    try:
        response = await anthropic_client.messages.create(
            model=settings.MODEL_NAME,
            max_tokens=600,
            temperature=0,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = response.content[0].text.strip()
        # Remove markdown code blocks if present
        if raw.startswith("```"):
            raw = raw.strip("`").replace("json", "").replace("```", "").strip()

        result = json.loads(raw)
        
        # Validate and sanitize the response
        if "performance_score" not in result:
            result["performance_score"] = 75
        if "strengths" not in result:
            result["strengths"] = ["Good communication"]
        if "improvements" not in result:
            result["improvements"] = ["Practice more"]
        if "overall_feedback" not in result:
            result["overall_feedback"] = "Good interview performance."
        
        return result
    except json.JSONDecodeError as e:
        logger.error(f"Interview analysis JSON parse error: {e}, raw: {raw if 'raw' in locals() else 'N/A'}")
        return {
            "performance_score": 75,
            "strengths": ["Good communication", "Relevant experience"],
            "improvements": ["More specific examples", "Technical depth"],
            "overall_feedback": "Solid interview. Keep practicing for stronger technical responses.",
        }
    except Exception as e:
        logger.error(f"Interview analysis error: {e}", exc_info=True)
        return {
            "performance_score": 75,
            "strengths": ["Good communication", "Relevant experience"],
            "improvements": ["More specific examples", "Technical depth"],
            "overall_feedback": "Solid interview. Keep practicing for stronger technical responses.",
        }


@router.post("/resume/analyze/pro")
async def analyze_resume_pro(file: UploadFile = File(...), job_description: str = Form(...)):
    """Hybrid ATS analysis: deterministic subscores + LLM suggestions.

    Returns the exact shape the frontend expects, but with locally computed, stable scores
    so the values are consistent and not random (overall_score won't be 4.5 anymore).
    """
    # 1) Extract text
    file_path = f"temp/{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())
    resume_text = extract_text_from_pdf(file_path)

    # 2) Deterministic ATS scoring (skills, experience, education, certs, projects, impact, formatting)
    ats = resume_ats.score_resume(resume_text, job_description)

    # Build baseline response (all numeric fields 0-100)
    base = {
        "overall_score": ats["scores"]["final_ats_score"],
        "skills_match": {
            "present": ats["matched_keywords"],
            "missing": ats["missing_keywords"],
            "percentage": round(ats["scores"]["skill_match"], 2),
        },
        # expose granular subscores for UI (all 0-100)
        "subscores": {
            "skill_match": round(ats["scores"].get("skill_match", 0), 2),
            "experience_score": round(ats["scores"].get("experience_score", 0), 2),
            "education_score": round(ats["scores"].get("education_score", 0), 2),
            "certification_score": round(ats["scores"].get("certification_score", 0), 2),
            "projects_score": round(ats["scores"].get("projects_score", 0), 2),
            "impact_score": round(ats["scores"].get("impact_score", 0), 2),
            "formatting_score": round(ats["scores"].get("formatting_score", 0), 2),
            "keyword_coverage": round(ats["scores"].get("keyword_coverage", 0), 2),
            "final_ats_score": round(ats["scores"].get("final_ats_score", 0), 2),
        },
        "experience_alignment": {
            "score": round(ats["scores"].get("experience_score", 0), 2),
            "summary": "",
        },
        "impact_keywords": {
            "present": [w for w in ats["matched_keywords"] if w in ["improved","reduced","increased","saved","automated","optimized","generated","achieved"]],
            "missing": [w for w in ats["missing_keywords"] if w in ["improved","reduced","increased","saved","automated","optimized","generated","achieved"]],
        },
        "ats_formatting_score": round(ats["scores"].get("formatting_score", 0), 2),
        "recommendations": [],
        "top_improvements": [],
        "matched_keywords": ats["matched_keywords"],
        "missing_keywords": ats["missing_keywords"],
        "heatmap": {
            "skills": round(ats["scores"].get("skill_match", 0), 2),
            "experience": round(ats["scores"].get("experience_score", 0), 2),
            "format": round(ats["scores"].get("formatting_score", 0), 2),
            "keywords": round(ats["scores"].get("keyword_coverage", 0), 2),
            "achievements": round(ats["scores"].get("impact_score", 0), 2),
        },
    }

    # 3) LLM: only for recommendations + experience summary (numbers are already set)
    prompt = f"""
You are an ATS coach. Given the resume and JD, return JSON ONLY (no markdown).
Focus on short, actionable advice.

Resume:
{resume_text[:5000]}

Job Description:
{job_description}

Return exactly:
{{
  "experience_summary": "1–2 sentence summary of fit",
  "recommendations": ["...", "..."],
  "top_improvements": ["...", "..."]
}}
"""

    try:
        res = await anthropic_client.messages.create(
            model=settings.MODEL_NAME,
            max_tokens=800,
            temperature=0,
            messages=[{"role": "user", "content": prompt}],
        )

        raw = res.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.strip("`").replace("json", "").replace("```", "").strip()

        ai = json.loads(raw)
        base["experience_alignment"]["summary"] = ai.get("experience_summary", "")
        base["recommendations"] = ai.get("recommendations", [])
        base["top_improvements"] = ai.get("top_improvements", [])
    except Exception as e:
        logger.error(f"Resume analyze pro LLM parse error: {e}")
        if not base["recommendations"]:
            base["recommendations"] = ["Could not parse AI suggestions. Try again."]
        if not base["top_improvements"]:
            base["top_improvements"] = ["Add quantifiable achievements and tailor skills to the JD."]
        if not base["experience_alignment"]["summary"]:
            base["experience_alignment"]["summary"] = "Summary unavailable due to parsing error."

    return base
