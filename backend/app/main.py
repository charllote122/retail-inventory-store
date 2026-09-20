"""FastAPI entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database import Base, engine
from app import models  # noqa: F401
from app.api import auth, customers, products, storefront
from app.api import orders as orders_module
from app.api import predictions
from app.api import stripe_api

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.1.0",
)


# CORS — allow the React dev server to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Routers
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(products.router)
app.include_router(storefront.router)
app.include_router(orders_module.router)
app.include_router(orders_module.merchant_router)
app.include_router(predictions.router)
app.include_router(stripe_api.router)


@app.get("/", tags=["health"])
def root():
    return {"app": settings.app_name, "status": "ok", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}
