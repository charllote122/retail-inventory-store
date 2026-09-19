"""
Product CRUD endpoints.

Merchant-scoped: every endpoint filters by the authenticated
merchant's ID. Merchant A can never see or modify Merchant B's products.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_merchant
from app.database import get_db
from app.models.merchant import Merchant
from app.models.product import Product
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
)

router = APIRouter(prefix="/api/products", tags=["products"])


def _get_owned_product(product_id: int, merchant_id: int, db: Session) -> Product:
    """
    Fetch a product by ID, scoped to the given merchant.
    Returns 404 if not found OR if it belongs to another merchant
    (we don't reveal which, to avoid information leakage).
    """
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.merchant_id == merchant_id)
        .first()
    )
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current: Merchant = Depends(get_current_merchant),
):
    """Create a product owned by the authenticated merchant."""
    product = Product(
        merchant_id=current.id,
        **payload.model_dump(),
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=list[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    current: Merchant = Depends(get_current_merchant),
    skip: int = 0,
    limit: int = 100,
    category: str | None = None,
    include_inactive: bool = False,
):
    """List the current merchant's products."""
    query = db.query(Product).filter(Product.merchant_id == current.id)

    if not include_inactive:
        query = query.filter(Product.is_active == True)

    if category:
        query = query.filter(Product.category == category)

    return query.offset(skip).limit(limit).all()


@router.get("/low-stock", response_model=list[ProductResponse])
def low_stock_products(
    db: Session = Depends(get_db),
    current: Merchant = Depends(get_current_merchant),
):
    """Return products below their low-stock threshold."""
    return (
        db.query(Product)
        .filter(
            Product.merchant_id == current.id,
            Product.is_active == True,
            Product.stock_quantity <= Product.low_stock_threshold,
        )
        .all()
    )


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current: Merchant = Depends(get_current_merchant),
):
    """Get a single product owned by the current merchant."""
    return _get_owned_product(product_id, current.id, db)


@router.patch("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current: Merchant = Depends(get_current_merchant),
):
    """Partial update — only fields provided are changed."""
    product = _get_owned_product(product_id, current.id, db)

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current: Merchant = Depends(get_current_merchant),
):
    """Delete a product owned by the current merchant."""
    product = _get_owned_product(product_id, current.id, db)
    db.delete(product)
    db.commit()
    return None
