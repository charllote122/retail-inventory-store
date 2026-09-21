"""Application configuration loaded from .env."""

import json
from typing import Any

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Database
    database_url: str = Field(..., min_length=10)

    # JWT
    secret_key: str = Field(..., min_length=32)
    algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(480, gt=0)

    # App
    app_name: str = "Retail SaaS"
    debug: bool = True
    frontend_url: str = "http://localhost:5173"
    allowed_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: Any) -> list[str]:
        """
        Accept both:
        - JSON array: '["http://a.com","http://b.com"]'
        - Comma-separated: "http://a.com,http://b.com"
        """
        if value is None or value == "":
            return []

        if isinstance(value, list):
            return [str(o).strip() for o in value if str(o).strip()]

        if isinstance(value, str):
            value = value.strip()

            if value.startswith("[") and value.endswith("]"):
                try:
                    parsed = json.loads(value)
                    if isinstance(parsed, list):
                        return [str(o).strip() for o in parsed if str(o).strip()]
                except json.JSONDecodeError:
                    pass

            return [o.strip() for o in value.split(",") if o.strip()]

        raise TypeError(
            "allowed_origins must be a comma-separated string or JSON array"
        )

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        if not value.startswith(("postgresql://", "postgresql+psycopg2://")):
            raise ValueError("DATABASE_URL must be a PostgreSQL connection string")
        return value

    @field_validator("stripe_secret_key")
    @classmethod
    def validate_stripe_secret_key(cls, value: str) -> str:
        if value and not value.startswith("sk_"):
            raise ValueError("STRIPE_SECRET_KEY must start with 'sk_'")
        return value

    @field_validator("stripe_webhook_secret")
    @classmethod
    def validate_stripe_webhook_secret(cls, value: str) -> str:
        if value and not value.startswith("whsec_"):
            raise ValueError("STRIPE_WEBHOOK_SECRET must start with 'whsec_'")
        return value


settings = Settings()
