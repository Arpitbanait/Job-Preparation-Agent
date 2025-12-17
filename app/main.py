from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from app.config import get_settings
from app.api.routes import router
from app.background.background_jobs import start_scheduler
import asyncio


# Logging Setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)
settings = get_settings()

# LIFESPAN = modern replacement for @app.on_event
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("⏳ Starting Job Search AI Application")

    # 🔥 Start background scheduler safely
    # start_scheduler()
    # print("📡 Auto Job Alerts Running...")
    await asyncio.sleep(0.1)
    yield

    logger.info("🛑 Shutting down Job Search AI Application")

# App Instance (using lifespan handler)
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    lifespan=lifespan
)

# CORS Support
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(router)

@app.get("/")
async def root():
    return {
        "message": "Job Search AI System",
        "version": settings.API_VERSION,
        "docs": "/docs",
        "openapi": "/openapi.json"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
