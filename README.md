
# Job Search AI System

A comprehensive AI-powered job search platform with LangGraph agents, resume analysis, job scraping, and interview preparation.

## Features

- **Resume Analysis & ATS Scoring**: Analyze resumes for ATS compatibility and get improvement suggestions
- **LangGraph Agent Orchestration**: Multi-agent workflow for coordinated task execution
- **Job Search**: Search and scrape jobs from multiple sources (Indeed, LinkedIn, Glassdoor)
- **Interview Preparation**: AI-generated interview questions and answers for any role
- **Semantic Matching**: Match resumes to job postings using embeddings

## Architecture

\`\`\`
FastAPI (REST API)
  ├── LangGraph Supervisor (Agent Orchestration)
  │   ├── Resume Agent
  │   ├── Job Search Agent
  │   └── Interview Agent
  └── Modules
      ├── Resume ATS Scoring
      ├── Job Scraper
      ├── Interview Q&A Generator
      └── Embeddings Manager
\`\`\`

## Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd job-search-ai
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Setup environment:
```bash
cp .env.example .env
# Edit .env with your API keys
```

## Running the Application

### Development Server
```bash
python -m uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### API Documentation
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Resume Analysis
```bash
POST /api/v1/analyze-resume
Content-Type: application/json

{
  "content": "Resume text here...",
  "file_type": "txt"
}
```

### Job Search
```bash
POST /api/v1/search-jobs
Content-Type: application/json

{
  "query": "Python Developer",
  "location": "San Francisco, CA",
  "salary_min": 100000,
  "salary_max": 200000
}
```

### Interview Q&A Generation
```bash
POST /api/v1/generate-interview-qa
Content-Type: application/json

{
  "job_title": "Senior Software Engineer",
  "job_description": "5+ years experience with...",
  "difficulty": "intermediate",
  "num_questions": 10
}
```

### Workflow Execution
```bash
POST /api/v1/workflow
Content-Type: application/json

{
  "task_type": "resume",
  "data": {
    "content": "Resume text..."
  }
}
```

## Configuration

Edit `.env` file to configure:

- **ANTHROPIC_API_KEY**: Your Anthropic Claude API key
- **HUGGINGFACE_API_KEY**: Your Hugging Face API token (for embeddings)
- **MODEL_NAME**: Claude model (claude-opus-4-1-20250805, claude-3-sonnet-20240229)
- **EMBEDDINGS_MODEL**: Hugging Face embedding model (default: sentence-transformers/all-MiniLM-L6-v2)
- **INDEED_ENABLED**: Enable Indeed job scraping
- **MAX_JOBS_PER_SCRAPE**: Maximum jobs to scrape per request
- **RESUME_MIN_SCORE**: Minimum ATS score threshold

## Project Structure

```bash
job-search-ai/
├── app/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   └── api/
│       ├── routes.py        # API endpoints
│       └── schemas.py       # Pydantic models
├── agents/
│   ├── supervisor_agent.py  # LangGraph coordinator
│   ├── resume_agent.py      # Resume analysis agent
│   ├── job_search_agent.py  # Job search agent
│   └── interview_agent.py   # Interview prep agent
├── modules/
│   ├── resume_ats.py        # ATS scoring engine
│   ├── job_scraper.py       # Job scraping
│   ├── interview_qa.py      # Interview QA generation
│   └── embeddings.py        # Vector embeddings
├── utils/
│   ├── parsers.py           # Text/PDF parsing
│   └── validators.py        # Input validation
└── requirements.txt
```

## Usage Examples

### Python Client
```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/api/v1/analyze-resume",
        json={
            "content": "Your resume text...",
            "file_type": "txt"
        }
    )
    print(response.json())
```

### Workflow Execution
```python
async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/api/v1/workflow",
        json={
            "task_type": "resume",
            "data": {
                "content": "Resume text..."
            }
        }
    )
    workflow_id = response.json()["result"]["workflow_id"]
    print(f"Workflow ID: {workflow_id}")
```

## Advanced Features

### ATS Scoring Weights
Customize resume scoring in config.py:
```python
RESUME_WEIGHTS = {
    "skills_match": 0.4,      # 40% weight
    "experience": 0.3,         # 30% weight
    "education": 0.2,          # 20% weight
    "keywords": 0.1            # 10% weight
}
```

### Interview Difficulty Levels
- **beginner**: Basic questions for entry-level
- **intermediate**: Scenario-based questions (default)
- **advanced**: System design and architecture questions

### Job Scraper Sources
Currently supports:
- Indeed (enabled by default)
- LinkedIn (requires credentials)
- Glassdoor (requires credentials)

## Performance Optimization

- Resume analysis: ~1-2 seconds
- Job search: ~5-10 seconds (depending on source)
- Interview QA generation: ~10-15 seconds
- All operations support async/await for concurrent requests

## Roadmap

- [ ] Database persistence with PostgreSQL
- [ ] LinkedIn and Glassdoor API integration
- [ ] PDF resume parsing with better accuracy
- [ ] Email integration for job alerts
- [ ] Real-time job monitoring
- [ ] Multi-language support
- [ ] Web UI dashboard
- [ ] Mobile app

## Troubleshooting

**Issue**: "ANTHROPIC_API_KEY not found"
- Solution: Add your API key to `.env` file

**Issue**: Job scraper returns empty results
- Solution: Ensure job source is enabled in `.env`

**Issue**: Resume scoring is low
- Solution: Add more technical skills and keywords to your resume

## Contributing

Contributions welcome! Please follow:
1. Create feature branch
2. Add tests for new functionality
3. Submit pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourrepo/issues
- Email: support@jobsearchai.com

## Acknowledgments

Built with:
- LangChain & LangGraph for AI orchestration
- FastAPI for REST API
- Anthropic Claude for language understanding
- Hugging Face for semantic embeddings
- BeautifulSoup for web scraping

## SerpApi (optional fallback)

If some job sites block direct scraping (Indeed, LinkedIn, Glassdoor), you can use SerpApi as a reliable fallback. To enable:

1. Get a SerpApi key at https://serpapi.com/
2. Add it to your `.env` file:

```bash
echo SERPAPI_API_KEY=your_serpapi_key >> .env
```

3. Re-install dependencies (if you haven't already):

```bash
pip install -r requirements.txt
```

The application will automatically use SerpApi when the built-in scrapers return no results and `SERPAPI_API_KEY` is set.

# Job-Preparation-Agent

