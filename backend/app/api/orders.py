"""
Order endpoints.

Customers place orders and view their own history.
Merchants view orders on their own products.

Stock is decremented when an order is created.
"""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_customer, get_current_merchant
from app.database import get_db
from app.models.customer import Customer
from app.models.merchant import Merchant
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.schemas.order import (
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate,
)

router = APIRouter(prefix="/api/orders", tags=["orders"])


# ============================================================
# CUSTOMER ENDPOINTS
# ============================================================


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    """
    Place an order. Groups items by merchant — one order per merchant.

    For simplicity, this MVP supports one merchant per order.
    """
    if not payload.items:
        raise HTTPException(400, "Order must contain at least one item")

    # Fetch all products in one query
    product_ids = [i.product_id for i in payload.items]
    products = {
        p.id: p for p in db.query(Product).filter(Product.id.in_(product_ids)).all()
    }

    # Validate: every product exists, is active, has stock
    merchant_ids = set()
    total = Decimal("0.00")
    order_items = []

    for item in payload.items:
        product = products.get(item.product_id)
        if product is None:
            raise HTTPException(404, f"Product {item.product_id} not found")
        if not product.is_active:
            raise HTTPException(400, f"Product {item.product_id} is inactive")
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                400,
                f"Insufficient stock for '{product.name}' "
                f"(requested {item.quantity}, available {product.stock_quantity})",
            )

        merchant_ids.add(product.merchant_id)

        line_total = Decimal(product.price_usd) * item.quantity
        total += line_total

        order_items.append(
            OrderItem(
                product_id=product.id,
                quantity=item.quantity,
                price_at_purchase_usd=product.price_usd,
            )
        )

        # Decrement stock
        product.stock_quantity -= item.quantity

    if len(merchant_ids) > 1:
        raise HTTPException(
            400,
            "All items must belong to the same merchant (MVP limitation)",
        )

    merchant_id = merchant_ids.pop()

    order = Order(
        customer_id=customer.id,
        merchant_id=merchant_id,
        total_usd=total,
        status="pending",
        shipping_address=payload.shipping_address,
        items=order_items,
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=list[OrderResponse])
def list_my_orders(
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    """Customer's own order history."""
    return (
        db.query(Order)
        .filter(Order.customer_id == customer.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_my_order(
    order_id: int,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.customer_id == customer.id)
        .first()
    )
    if order is None:
        raise HTTPException(404, "Order not found")
    return order


# ============================================================
# MERCHANT ENDPOINTS
# ============================================================

merchant_router = APIRouter(prefix="/api/merchant/orders", tags=["merchant-orders"])


@merchant_router.get("", response_model=list[OrderResponse])
def list_incoming_orders(
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant),
):
    """Merchant sees orders placed on their products."""
    return (
        db.query(Order)
        .filter(Order.merchant_id == merchant.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@merchant_router.patch("/{order_id}", response_model=OrderResponse)
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    merchant: Merchant = Depends(get_current_merchant),
):
    """Merchant updates order status (shipped, delivered, etc.)."""
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.merchant_id == merchant.id)
        .first()
    )
    if order is None:
        raise HTTPException(404, "Order not found")

    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order
