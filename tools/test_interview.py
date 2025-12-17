import asyncio
from modules.interview_qa import InterviewQAGenerator
import json

async def test():
    gen = InterviewQAGenerator()
    res = await gen.generate('Backend Developer','Build REST APIs','intermediate',2)
    print(json.dumps({'job_title': res.job_title, 'questions': [q.model_dump() for q in res.questions], 'tips': res.preparation_tips}, indent=2))

if __name__ == '__main__':
    asyncio.run(test())
