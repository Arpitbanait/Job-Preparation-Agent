from typing import List, Optional
from langchain_anthropic import ChatAnthropic
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

class JobSearchAgent:
    """Agent for job search optimization and filtering"""
    
    def __init__(self):
        self.llm = ChatAnthropic(  
            api_key=settings.ANTHROPIC_API_KEY,
            model=settings.MODEL_NAME,
            temperature=0.2
        )
    
    async def filter_and_rank(self, jobs: List[dict], resume_skills: List[str]) -> List[dict]:
        """Filter and rank jobs based on resume match"""
        try:
            ranked_jobs = []
            
            for job in jobs:
                match_score = self._calculate_match_score(job, resume_skills)
                ranked_jobs.append({
                    **job,
                    "match_score": match_score
                })
            
            # Sort by match score
            ranked_jobs.sort(key=lambda x: x["match_score"], reverse=True)
            
            return ranked_jobs
        except Exception as e:
            logger.error(f"Job filtering error: {str(e)}")
            return jobs
    
    def _calculate_match_score(self, job: dict, resume_skills: List[str]) -> float:
        """Calculate job match score"""
        score = 0.0
        max_score = 100.0
        
        # Check skill matches
        job_description = (job.get("description", "") + " " + 
                          " ".join(job.get("requirements", []))).lower()
        
        matching_skills = sum(1 for skill in resume_skills 
                             if skill.lower() in job_description)
        
        skill_score = (matching_skills / len(resume_skills)) * 40 if resume_skills else 0
        score += skill_score
        
        # Add base score for relevant job titles
        if any(word in job.get("title", "").lower() 
               for word in ["senior", "lead", "principal"]):
            score += 20
        
        return min(score, max_score)
