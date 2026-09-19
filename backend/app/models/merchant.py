"""Merchant (store owner) model — the multi-tenant root of the platform."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class Merchant(Base):
    __tablename__ = "merchants"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    store_name = Column(String(100), nullable=False)
    store_slug = Column(String(100), unique=True, nullable=False, index=True)

    is_active = Column(Boolean, default=True, nullable=False)

    stripe_account_id = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationship will be added later when we create the Product model
    # products = relationship("Product", back_populates="merchant")

    def __repr__(self) -> str:
        return f"<Merchant id={self.id} store={self.store_slug}>"
