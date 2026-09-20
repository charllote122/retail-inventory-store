"""FastAPI entry point."""

import logging
import time
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import settings
from app.core.limiter import limiter
from app.database import Base, engine
from app import models  # noqa: F401
from app.api import auth, customers, products, storefront
from app.api import orders as orders_module
from app.api import predictions
from app.api import stripe_api

logger = logging.getLogger("retail_inventory.audit")
logger.setLevel(logging.INFO)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
    logger.addHandler(handler)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.1.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, lambda request, exc: JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"}))
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(storefront.router)
app.include_router(orders_module.router)
app.include_router(orders_module.merchant_router)
app.include_router(predictions.router)
app.include_router(stripe_api.router)


@app.middleware("http")
async def audit_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)
    logger.info(
        "audit_request method=%s path=%s status=%s ip=%s duration_ms=%s",
        request.method,
        request.url.path,
        response.status_code,
        request.client.host if request.client else "unknown",
        duration_ms,
    )
    return response


@app.get("/", tags=["health"])
def root():
    return {"app": settings.app_name, "status": "ok", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}
