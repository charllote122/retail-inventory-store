"""Pydantic schemas for customer API."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class CustomerRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str | None = Field(default=None, max_length=150)
    country: str | None = Field(default=None, min_length=2, max_length=2)


class CustomerLogin(BaseModel):
    email: EmailStr
    password: str


class CustomerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str | None
    country: str | None
    is_active: bool
    created_at: datetime
