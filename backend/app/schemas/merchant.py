"""Pydantic schemas for merchant API requests and responses."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class MerchantRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    store_name: str = Field(min_length=2, max_length=100)
    store_slug: str = Field(min_length=2, max_length=100)


class MerchantLogin(BaseModel):
    email: EmailStr
    password: str


class MerchantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    store_name: str
    store_slug: str
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
