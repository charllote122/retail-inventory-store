"""Product model — belongs to a merchant (multi-tenant)."""

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    Numeric,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    # --- THE MULTI-TENANT KEY ---
    merchant_id = Column(
        Integer,
        ForeignKey("merchants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)

    price_usd = Column(Numeric(10, 2), nullable=False)
    cost_usd = Column(Numeric(10, 2), nullable=True)

    stock_quantity = Column(Integer, default=0, nullable=False)
    low_stock_threshold = Column(Integer, default=10, nullable=False)

    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    # Relationship back to merchant
    merchant = relationship("Merchant", back_populates="products")
    def __repr__(self) -> str:
        return (
            f"<Product id={self.id} name={self.name[:30]} merchant={self.merchant_id}>"
        )
