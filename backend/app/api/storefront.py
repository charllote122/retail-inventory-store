"""
Public storefront endpoints.

No authentication required — customers browse by store_slug,
exactly like visiting shopify.com/{store-name}.

Only ACTIVE merchants and ACTIVE products are exposed.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.merchant import Merchant
from app.models.product import Product
from app.schemas.merchant import MerchantPublicResponse
from app.schemas.product import ProductPublicResponse

router = APIRouter(prefix="/api/store", tags=["storefront"])


def _get_active_merchant(slug: str, db: Session) -> Merchant:
    """Fetch an active merchant by slug or 404."""
    merchant = (
        db.query(Merchant)
        .filter(Merchant.store_slug == slug, Merchant.is_active == True)
        .first()
    )
    if merchant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Store not found",
        )
    return merchant


@router.get("", response_model=list[MerchantPublicResponse])
def list_all_stores(db: Session = Depends(get_db)):
    """List all active stores (public store directory)."""
    return (
        db.query(Merchant)
        .filter(Merchant.is_active == True)
        .order_by(Merchant.store_name)
        .all()
    )


@router.get("/{slug}", response_model=MerchantPublicResponse)
def get_store(slug: str, db: Session = Depends(get_db)):
    """Get public info about a store by its slug."""
    return _get_active_merchant(slug, db)


@router.get("/{slug}/products", response_model=list[ProductPublicResponse])
def list_store_products(
    slug: str,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: str | None = None,
):
    """Browse a store's active products (public)."""
    merchant = _get_active_merchant(slug, db)

    query = (
        db.query(Product)
        .filter(Product.merchant_id == merchant.id)
        .filter(Product.is_active == True)
    )

    if category:
        query = query.filter(Product.category == category)

    return query.offset(skip).limit(limit).all()


@router.get("/{slug}/products/{product_id}", response_model=ProductPublicResponse)
def get_store_product(
    slug: str,
    product_id: int,
    db: Session = Depends(get_db),
):
    """Get a single product from a store (public)."""
    merchant = _get_active_merchant(slug, db)

    product = (
        db.query(Product)
        .filter(
            Product.id == product_id,
            Product.merchant_id == merchant.id,
            Product.is_active == True,
        )
        .first()
    )
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found",
        )
    return product
