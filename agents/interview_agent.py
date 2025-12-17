from typing import List, Optional
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import PromptTemplate
from app.config import get_settings
import json
import logging

logger = logging.getLogger(__name__)
settings = get_settings()

class InterviewAgent:
    """Agent for interview preparation and question generation"""
    
    def __init__(self):
        self.llm = ChatAnthropic(
            model=settings.MODEL_NAME,
            temperature=0.5
        )
    
    async def generate_questions(self, 
                                 job_title: str, 
                                 job_description: Optional[str] = None,
                                 num_questions: int = 5) -> dict:
        
        prompt = f"""
You are an interview question generator AI.

Generate *exactly {num_questions} structured interview questions* for a "{job_title}" role.

Job Description:
{job_description or "No description provided"}

Return the output ONLY in pure JSON format:

[
  {{
    "question": "string",
    "key_points": ["point1", "point2"],
    "importance": "short explanation"
  }}
]
"""

        try:
            response = await self.llm.ainvoke(prompt)
            raw_output = response.content.strip()

            # Convert model output to JSON
            questions = json.loads(raw_output)

            return {
                "job_title": job_title,
                "questions": questions,
                "total_questions": len(questions),
                "status": "success"
            }

        except Exception as e:
            logger.error(f"Interview generation error: {e}")
            return {
                "job_title": job_title,
                "questions": [],
                "status": "error",
                "error": str(e)
            }