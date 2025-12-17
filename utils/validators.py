from typing import Optional
from pydantic import BaseModel, ValidationError
import logging

logger = logging.getLogger(__name__)

class InputValidator:
    """Validate user inputs"""
    
    @staticmethod
    def validate_resume(content: str) -> bool:
        """Validate resume content"""
        if not content or len(content.strip()) < 50:
            return False
        return True
    
    @staticmethod
    def validate_job_search_query(query: str) -> bool:
        """Validate job search query"""
        if not query or len(query.strip()) < 2:
            return False
        return True
    
    @staticmethod
    def validate_job_title(title: str) -> bool:
        """Validate job title"""
        if not title or len(title.strip()) < 2:
            return False
        return True
    
    @staticmethod
    def sanitize_input(text: str) -> str:
        """Sanitize user input"""
        # Remove potentially harmful characters
        text = text.replace("<script>", "").replace("</script>", "")
        text = text.strip()
        return text
