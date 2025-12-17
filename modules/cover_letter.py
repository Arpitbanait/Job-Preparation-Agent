import pdfplumber
import json, re, logging
from fastapi import UploadFile, File, Form, HTTPException
from fastapi import APIRouter
from langchain_anthropic import ChatAnthropic
from app.config import get_settings
import re

router = APIRouter()
logger = logging.getLogger(__name__)
settings = get_settings()



def extract_candidate_info(resume_text: str):
    lines = resume_text.strip().split("\n")

    # ===== NAME Extraction =====
    name = lines[0].strip() if 2 <= len(lines[0].split()) <= 4 else "Candidate"

    # ===== Phone Extraction =====
    phone_match = re.search(r'(\+?\d[\d\- ]{8,15})', resume_text)
    phone = phone_match.group(1) if phone_match else None

    # ===== Email Extraction =====
    email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text)
    email = email_match.group(0) if email_match else None

    # ===== LinkedIn & GitHub Extraction =====
    linkedin = re.search(r'https?://(www\.)?linkedin\.com/[^\s]+', resume_text)
    github   = re.search(r'https?://(www\.)?github\.com/[^\s]+', resume_text)

    # ===== Portfolio/Website Extraction (any other URL) =====
    urls = re.findall(r'https?://[^\s)]+', resume_text)
    portfolio = None
    for u in urls:
        if "linkedin.com" in u or "github.com" in u:
            continue
        # Prefer URLs that look like personal sites or portfolio keywords
        if any(k in u.lower() for k in ["portfolio", "about", "me", "resume", "projects"]):
            portfolio = u
            break
        # fallback to first non-linkedin/github url
        if not portfolio:
            portfolio = u

    return {
        "name": name,
        "phone": phone,
        "email": email,
        "linkedin": linkedin.group(0) if linkedin else None,
        "github": github.group(0) if github else None,
        "portfolio": portfolio
    }



def extract_resume_text(path: str) -> str:
    try:
        text = ""
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                content = page.extract_text() or ""
                text += content + "\n"
        return text.strip()
    except Exception as e:
        logger.error(f"PDF read error -> {e}")
        return ""


# ==============================================
# LLM EMAIL GENERATOR
# ==============================================
async def create_cover_letter(resume_text: str, job_description: str, role: str, company: str) -> dict:

    llm = ChatAnthropic(model=settings.MODEL_NAME, temperature=0.4)

    prompt = f"""
Return ONLY JSON. No markdown.

Format:
{{
 "subject":"string",
 "body":"string with \\n only"
}}

Generate email for applicant:
Role="{role}"
Company="{company}"
Resume="{resume_text[:400]}"
JobDescription="{job_description}"
"""

    response = await llm.ainvoke(prompt)
    raw = response.content if hasattr(response, "content") else str(response)

    # Clean invalid control chars
    cleaned = re.sub(r"[^\x20-\x7E\n]", "", raw).strip()

    try:
        return json.loads(cleaned)   # now returns dict (correct)
    except Exception:
        logger.error("❌ Model returned invalid JSON, fallback used")
        return {"subject":"Application", "body":cleaned}
