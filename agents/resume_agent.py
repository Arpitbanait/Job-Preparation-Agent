import re, json, statistics
from typing import Dict, Optional
from rapidfuzz import fuzz
from langchain_anthropic import ChatAnthropic
from app.config import get_settings

settings = get_settings()

class ResumeAgent:

    def __init__(self):
        self.llm = ChatAnthropic(
            model=settings.MODEL_NAME,      # "claude-3-haiku-20240307"
            temperature=0.5
        )

    # ================= KEYWORD MATCH ================= #
    def extract_keywords(self, text):
        words = re.findall(r"[a-zA-Z]{3,}", text.lower())
        return list(set(words))

    def keyword_match(self, resume, jd):
        r, j = self.extract_keywords(resume), self.extract_keywords(jd)
        matched, missing, scores = [], [], []

        for w in j:
            score = fuzz.partial_ratio(w, resume)
            if score > 65:
                matched.append(w); scores.append(score)
            else:
                missing.append(w)

        return statistics.mean(scores) if scores else 12, matched, missing

    # ================= ATS SCORING ================= #
    def experience(self, text):
        yrs = re.findall(r"(\d+)\+?\s*year", text.lower())
        yrs = int(max(yrs)) if yrs else 0
        return 95 if yrs>=6 else 78 if yrs>=4 else 60 if yrs>=2 else 40

    def formatting(self, text):
        bullets = text.count("•") + text.count("- ")
        return 92 if bullets > 10 else 78 if bullets>4 else 55

    def impact_score(self, text):
        impact_words = ["improved","reduced","increased","saved",
                        "automated","optimized","generated","achieved"]
        hits = sum(w in text.lower() for w in impact_words)
        return min(70 + hits*4, 96)

    # ================= FINAL HYBRID SCORING ================= #
    async def analyze_resume(self, resume_text: str, jd: str):

        # ---- ATS Rules Engine ----
        kw_score, matched, missing = self.keyword_match(resume_text, jd)

        ats_score = (
            kw_score * 0.40 +
            self.experience(resume_text) * 0.20 +
            self.impact_score(resume_text) * 0.25 +
            self.formatting(resume_text) * 0.15
        )
        ats_score = round(ats_score, 2)

        # ---- LLM Deep Understanding ----
        llm_prompt = f"""
You are an ATS + Hiring Expert.

Evaluate resume and give 3 things only:

1. Fit Score (1-100): How suitable for this JD overall?
2. Strengths: 3–6 strong achievements / qualities
3. Missing Improvements: 3–6 weaknesses or missing skills

Resume:
{resume_text}

Job Description:
{jd}

Return JSON only like:
{{
 "fit_score": 0-100,
 "strengths": [...],
 "improvements":[...]
}}
"""

        try:
            result = await self.llm.ainvoke(llm_prompt)
            clean = result.content.replace("```","").replace("json","").strip()
            llm = json.loads(clean)

        except:
            llm = {"fit_score": 50,"strengths":[],"improvements":[]}

        final_score = round((ats_score*0.60) + (llm["fit_score"]*0.40), 2)

        return {
            "final_ATS_Score": final_score,
            "ATS_Engine_Score": ats_score,
            "LLM_Fit_Score": llm["fit_score"],
            "Matched Keywords": matched[:60],
            "Missing Keywords": missing[:60],
            "Strengths Identified": llm["strengths"],
            "Improvements Needed": llm["improvements"]
        }
