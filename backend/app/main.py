"""FastAPI entry point."""

from fastapi import FastAPI

from app.core.config import settings
from app.database import Base, engine

# Import models so SQLAlchemy knows about them before create_all
from app import models  # noqa: F401

# Create tables on startup (dev-only; use Alembic in production)
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.1.0",
)


@app.get("/", tags=["health"])
def root():
    return {
        "app": settings.app_name,
        "status": "ok",
        "docs": "/docs",
    }


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}
