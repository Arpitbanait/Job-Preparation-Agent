import re
import json
import statistics
from typing import Optional, Dict, List
from langchain_anthropic import ChatAnthropic
from rapidfuzz import fuzz
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


class ResumeAgent:
    """Advanced ATS-style resume analyzer with granular subscores."""

    def __init__(self):
        self.llm = ChatAnthropic(
            model=settings.MODEL_NAME,
            temperature=0.3
        )

    # ---------- Text utilities ----------
    def extract_keywords(self, text: str, min_len: int = 3) -> List[str]:
        return list(set(re.findall(rf"[a-zA-Z]{{{min_len},}}", text.lower())))

    def keyword_match(self, resume: str, jd: str):
        jd_keys = self.extract_keywords(jd, min_len=4)
        matched, missing, scores = [], [], []

        for key in jd_keys:
            score = fuzz.partial_ratio(key, resume)
            if score >= 65:
                matched.append(key)
                scores.append(score)
            else:
                missing.append(key)

        kw_score = statistics.mean(scores) if scores else 20
        return kw_score, matched[:80], missing[:80]

    def experience_score(self, resume: str) -> float:
        yrs = re.findall(r"(\d+)\+?\s*year", resume.lower())
        yrs_val = int(max(yrs)) if yrs else 0
        if yrs_val >= 8:
            return 95
        if yrs_val >= 5:
            return 88
        if yrs_val >= 3:
            return 78
        if yrs_val >= 1:
            return 65
        return 40

    def education_score(self, resume: str) -> float:
        edu_hits = ["bachelor", "master", "ph.d", "phd", "b.sc", "m.sc", "btech", "mtech", "mba"]
        hits = sum(1 for e in edu_hits if e in resume.lower())
        return 88 if hits >= 2 else 75 if hits == 1 else 55

    def certification_score(self, resume: str) -> float:
        cert_hits = ["aws", "azure", "gcp", "pmp", "scrum", "cfa", "cissp", "security+", "ocp", "ckad", "cka"]
        hits = sum(1 for c in cert_hits if c in resume.lower())
        return min(60 + hits * 8, 92)

    def projects_score(self, resume: str) -> float:
        projects = resume.lower().count("project")
        achievements = sum(resume.lower().count(w) for w in ["built", "designed", "deployed", "shipped", "launched"])
        return min(55 + (projects * 6) + (achievements * 3), 94)

    def impact_score(self, resume: str) -> float:
        impact_words = ["improved", "reduced", "increased", "saved", "automated", "optimized", "generated", "achieved"]
        hits = sum(w in resume.lower() for w in impact_words)
        return min(70 + hits * 4, 96)

    def formatting_score(self, resume: str) -> float:
        bullets = resume.count("•") + resume.count("- ")
        sections = sum(resume.lower().count(s) for s in ["experience", "education", "projects", "skills"])
        raw = 65 + min(bullets, 12) * 2 + min(sections, 6) * 3
        return min(raw, 95)

    # ---------- Combined ATS scoring ----------
    def score_resume(self, resume_text: str, job_desc: str) -> Dict:
        kw_score, matched, missing = self.keyword_match(resume_text, job_desc)

        scores = {
            "skill_match": kw_score,
            "experience_score": self.experience_score(resume_text),
            "education_score": self.education_score(resume_text),
            "certification_score": self.certification_score(resume_text),
            "projects_score": self.projects_score(resume_text),
            "impact_score": self.impact_score(resume_text),
            "formatting_score": self.formatting_score(resume_text),
            "keyword_coverage": kw_score,
        }

        final_ats = round(
            scores["skill_match"] * 0.30 +
            scores["experience_score"] * 0.20 +
            scores["education_score"] * 0.10 +
            scores["certification_score"] * 0.10 +
            scores["projects_score"] * 0.10 +
            scores["impact_score"] * 0.10 +
            scores["formatting_score"] * 0.10,
            2,
        )

        scores["final_ats_score"] = final_ats

        return {
            "scores": scores,
            "matched_keywords": matched,
            "missing_keywords": missing,
        }

    # ---------- LLM deep analysis ----------
    async def analyze_resume(self, resume_text: str, job_desc: Optional[str] = None):
        if not resume_text.strip():
            return {"status": "error", "message": "Resume content is blank."}

        jd = job_desc or "General Profile / Any Role"
        ats = self.score_resume(resume_text, jd)

        prompt = f"""
You are an ATS and senior recruiter. Compare the resume and JD and return JSON only.

Resume:
{resume_text[:5500]}

Job Description:
{jd}

Return JSON exactly:
{{
  "summary": "One-line ATS-friendly summary",
  "key_strengths": ["..."],
  "improvements_needed": ["..."],
  "keywords_to_add": ["..."],
  "final_hire_rating": 0-100
}}
"""

        try:
            result = await self.llm.ainvoke(prompt)
            clean = result.content.replace("```json", "").replace("```", "").strip()
            ai_json = json.loads(clean)
        except Exception as e:
            logger.error(f"AI resume analysis failed → {e}")
            ai_json = {
                "summary": "",
                "key_strengths": [],
                "improvements_needed": [],
                "keywords_to_add": [],
                "final_hire_rating": 50,
                "raw_error": str(e),
            }

        final_score = round((ats["scores"]["final_ats_score"] * 0.6) + (ai_json.get("final_hire_rating", 50) * 0.4), 2)

        return {
            "status": "success",
            "ats_report": ats,
            "ai_review": ai_json,
            "final_score": final_score,
        }
