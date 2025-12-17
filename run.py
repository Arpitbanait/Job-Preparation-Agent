#!/usr/bin/env python
"""Simple test script to verify the application runs"""
import sys
import os

# Add project to path
sys.path.insert(0, os.path.dirname(__file__))

# Set environment variables
os.environ.setdefault('ANTHROPIC_API_KEY', 'sk-ant-test-key')
os.environ.setdefault('HUGGINGFACE_API_KEY', 'hf_test_token')

try:
    print("Testing imports...")
    from app.config import get_settings
    print("[OK] Config imported")
    
    settings = get_settings()
    print(f"[OK] Settings loaded: API={settings.API_TITLE}")
    
    from app.main import app
    print("[OK] FastAPI app loaded")
    
    print("\nAll imports successful!")
    print(f"Starting server on http://127.0.0.1:8000")
    print(f"API docs: http://127.0.0.1:8000/docs\n")
    
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
    
except Exception as e:
    print(f"[ERROR] Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
