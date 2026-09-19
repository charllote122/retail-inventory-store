"""
Merchant-facing prediction endpoints.

Serves the trained ML demand forecasts + SHAP-style explainability.
"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_merchant
from app.models.merchant import Merchant
from app.services import ml_service

router = APIRouter(prefix="/api/merchant/predictions", tags=["predictions"])


@router.get("/{product_id}")
def predict_product(
    product_id: int,
    current: Merchant = Depends(get_current_merchant),
):
    """
    Predict 7-day demand for one product owned by the current merchant.
    """
    if not ml_service.has_history(current.id, product_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No historical sales data for this product. "
                "The ML model needs at least 30 days of sales history."
            ),
        )

    try:
        return ml_service.predict_next_week(current.id, product_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
def predict_all_products(current: Merchant = Depends(get_current_merchant)):
    """
    Predict 7-day demand for every product the merchant sells.
    Skips products without sufficient history.
    """
    from app.database import SessionLocal
    from app.models.product import Product

    db = SessionLocal()
    try:
        product_ids = [
            p.id
            for p in db.query(Product).filter(Product.merchant_id == current.id).all()
        ]
    finally:
        db.close()

    results = []
    skipped = []

    for pid in product_ids:
        if not ml_service.has_history(current.id, pid):
            skipped.append(pid)
            continue
        try:
            results.append(ml_service.predict_next_week(current.id, pid))
        except Exception as e:
            skipped.append(pid)

    results.sort(key=lambda r: r["predicted_units_next_week"], reverse=True)

    return {
        "merchant_id": current.id,
        "total_products": len(product_ids),
        "predicted": len(results),
        "skipped_no_history": skipped,
        "forecasts": results,
    }
