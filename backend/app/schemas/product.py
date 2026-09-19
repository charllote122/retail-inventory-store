"""Pydantic schemas for Product."""

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    category: str = Field(min_length=1, max_length=100)
    price_usd: Decimal = Field(gt=0)
    cost_usd: Decimal | None = Field(default=None, ge=0)
    stock_quantity: int = Field(ge=0, default=0)
    low_stock_threshold: int = Field(ge=0, default=10)
    image_url: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    price_usd: Decimal | None = Field(default=None, gt=0)
    cost_usd: Decimal | None = Field(default=None, ge=0)
    stock_quantity: int | None = Field(default=None, ge=0)
    low_stock_threshold: int | None = Field(default=None, ge=0)
    image_url: str | None = None
    is_active: bool | None = None


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    merchant_id: int
    name: str
    description: str | None
    category: str
    price_usd: Decimal
    cost_usd: Decimal | None
    stock_quantity: int
    low_stock_threshold: int
    image_url: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class ProductPublicResponse(BaseModel):
    """What customers see on the storefront (no cost_usd)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    description: str | None
    category: str
    price_usd: Decimal
    stock_quantity: int
    image_url: str | None
