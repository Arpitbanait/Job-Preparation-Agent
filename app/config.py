from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional

class Settings(BaseSettings):
    """Application settings from environment variables"""
    
    # API Settings
    API_TITLE: str = "Job Search AI System"
    API_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # LLM Settings
    ANTHROPIC_API_KEY: str
    MODEL_NAME: str = "claude-opus-4-1-20250805"
    TEMPERATURE: float = 0.7
    
    EMAIL_SENDER: str
    EMAIL_PASSWORD: str
    EMAIL_SMTP_SERVER: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587


    # Embeddings Settings
    HUGGINGFACE_API_KEY: str
    EMBEDDINGS_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # Job Scraping Settings
    LINKEDIN_ENABLED: bool = False
    INDEED_ENABLED: bool = True
    GLASSDOOR_ENABLED: bool = False
    MAX_JOBS_PER_SCRAPE: int = 50
    # Scraping API (SerpApi) - optional fallback for sites that block scraping
    SERPAPI_API_KEY: Optional[str] = None
    SCRAPING_PROVIDER: str = "auto"
    
    # Resume Settings
    RESUME_MIN_SCORE: float = 0.5
    RESUME_WEIGHTS: dict = {
        "skills_match": 0.4,
        "experience": 0.3,
        "education": 0.2,
        "keywords": 0.1
    }
    
    # Interview Settings
    INTERVIEW_DIFFICULTY_LEVEL: str = "intermediate"
    QUESTIONS_PER_ROLE: int = 10
    
    model_config = {
        "env_file": ".env",
        "extra": "allow"
       }

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
