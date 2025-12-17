from typing import Optional
from app.api.schemas import ResumeParsed
import re
import logging

logger = logging.getLogger(__name__)

def parse_resume_text(content: str) -> ResumeParsed:
    """Parse resume text and extract key information"""
    try:
        skills = _extract_skills(content)
        experience_years = _calculate_experience_years(content)
        education = _extract_education(content)
        keywords = _extract_keywords(content)
        summary = _generate_summary(content)
        
        return ResumeParsed(
            skills=skills,
            experience_years=experience_years,
            education=education,
            keywords=keywords,
            summary=summary
        )
    except Exception as e:
        logger.error(f"Resume parsing error: {str(e)}")
        return ResumeParsed(
            skills=[],
            experience_years=0,
            education=[],
            keywords=[],
            summary=""
        )

def _extract_skills(content: str) -> list:
    """Extract skills from resume"""
    # Common technical skills
    tech_skills = [
        "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust",
        "react", "angular", "vue", "django", "flask", "fastapi", "express",
        "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "gitlab",
        "sql", "postgresql", "mongodb", "redis", "elasticsearch",
        "git", "rest api", "graphql", "microservices", "agile"
    ]
    
    content_lower = content.lower()
    found_skills = [skill for skill in tech_skills if skill in content_lower]
    
    return found_skills if found_skills else []

def _calculate_experience_years(content: str) -> float:
    """Calculate total years of experience"""
    # Look for patterns like "5+ years", "5 years", "2020-2023"
    patterns = [
        r"(\d+)\+?\s*years?",
        r"(\d{4})-(\d{4})"
    ]
    
    years = 0
    for pattern in patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            try:
                if isinstance(matches[0], tuple):
                    start, end = matches[0]
                    years += int(end) - int(start)
                else:
                    years += int(matches[0])
            except (ValueError, IndexError):
                pass
    
    return float(years)

def _extract_education(content: str) -> list:
    """Extract education details"""
    education = []
    degrees = ["bachelor", "master", "phd", "b.s", "b.a", "m.s", "m.a", "m.tech"]
    
    content_lower = content.lower()
    for degree in degrees:
        if degree in content_lower:
            education.append(degree.upper())
    
    return education

def _extract_keywords(content: str) -> list:
    """Extract important keywords"""
    # Extract capitalized phrases (likely company names, certifications)
    keywords = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', content)
    
    # Remove common words
    common_words = {"The", "And", "With", "From", "At", "In", "To", "For", "As"}
    keywords = [kw for kw in keywords if kw not in common_words]
    
    return list(set(keywords))[:10]  # Return top 10 unique keywords

def _generate_summary(content: str) -> str:
    """Generate brief resume summary"""
    # Return first meaningful paragraph
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    
    for i, line in enumerate(lines):
        if len(line) > 50 and not line.isupper():
            return line[:200]
    
    return content[:200] if content else ""
