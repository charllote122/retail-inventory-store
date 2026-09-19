"""FastAPI entry point."""

from fastapi import FastAPI

from app.core.config import settings
from app.database import Base, engine
from app import models  # noqa: F401
from app.api import auth

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.1.0",
)


# Routers
app.include_router(auth.router)


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
