import json, re, logging
from anthropic import Anthropic
from app.config import get_settings

logger = logging.getLogger("interview_qa")
settings = get_settings()
client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

MODEL = "claude-3-haiku-20240307"  # Stable model

class InterviewQAGenerator:

    async def generate(self, job_title, job_description, difficulty, num_questions):

        prompt = f"""
You MUST respond ONLY in pure JSON. No explanation. No markdown.

STRICT OUTPUT FORMAT ⬇

{{
  "job_title": "{job_title}",
  "questions": [
    {{
      "topic": "short topic",
      "question": "detailed interview question",
      "difficulty": "{difficulty}",
      "expected_answer_points": ["point1","point2","point3"],
      "follow_ups":["follow1","follow2"]
    }}
  ],
  "preparation_tips":[ "tip1","tip2","tip3" ]
}}

Generate {num_questions} questions based on the job description:
{job_description}
"""

        try:
            res = client.messages.create(
                model=MODEL,
                max_tokens=3000,
                temperature=0.4,
                messages=[{"role": "user", "content": prompt}]
            )

            raw = res.content[0].text.strip()

            # Remove markdown fences if included
            raw = raw.replace("```json", "").replace("```", "").strip()

            # 🔥 Auto-Fix for DifficultyLevel.* output
            raw = re.sub(r'"difficulty"\s*:\s*"DifficultyLevel\.(.*?)"', r'"difficulty":"\1"', raw)

            # 🔥 Auto insert topic if missing
            raw = re.sub(r'"question"\s*:', '"topic":"General","question":', raw)

            data = json.loads(raw)  # final parse

            return data
        
        except Exception as e:
            logger.error(e)
            return {
                "job_title": job_title,
                "questions": [],
                "preparation_tips": ["⚠ Failed generating interview QA"],
                "error": str(e)
            }
