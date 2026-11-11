import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.seed import seed_database, sync_demo_accounts
from app.api.api import api_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("employee_delegation_system")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist
    try:
        logger.info("[Startup] Creating database tables if not existing...")
        Base.metadata.create_all(bind=engine)
        logger.info("[Startup] Database tables verified.")
        
        # Seed initial data and sync demo credentials
        db = SessionLocal()
        try:
            seed_database(db)
            sync_demo_accounts(db)
        finally:
            db.close()
    except Exception as e:
        logger.error("[Startup] Database initialization error: %s", e)

    yield

    # Shutdown
    logger.info("[Shutdown] Application terminating.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Enterprise Employee Task Delegation and Management System API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Middleware
origins = [str(origin) for origin in settings.BACKEND_CORS_ORIGINS]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", tags=["Root"])
def root():
    """Root endpoint providing service metadata, documentation links, and health status."""
    return {
        "app_name": settings.APP_NAME,
        "status": "running",
        "api_version": "v1",
        "docs_url": "/docs",
        "health_check": "/api/health",
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "api_version": "v1",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

