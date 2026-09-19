"""FastAPI entry point."""

from fastapi import FastAPI

from app.core.config import settings
from app.database import Base, engine
from app import models  # noqa: F401
from app.api import auth, customers, products, storefront
from app.api import orders as orders_module
from app.api import predictions

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.1.0",
)


# Routers
app.include_router(auth.router)  # /api/auth
app.include_router(customers.router)  # /api/customers
app.include_router(products.router)  # /api/products
app.include_router(storefront.router)  # /api/store
app.include_router(orders_module.router)  # /api/orders
app.include_router(orders_module.merchant_router)  # /api/merchant/orders
app.include_router(predictions.router)  # /api/merchant/predictions


@app.get("/", tags=["health"])
def root():
    return {"app": settings.app_name, "status": "ok", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "healthy"}
