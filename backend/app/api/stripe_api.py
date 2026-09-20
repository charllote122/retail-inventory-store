"""
Stripe endpoints: create checkout session + handle webhooks.

Customer pays for an order → Stripe Checkout → webhook marks order "paid".
"""

import json

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session

from app.api.deps import get_current_customer
from app.core.config import settings
from app.core.stripe import get_stripe
from app.database import get_db, SessionLocal
from app.models.customer import Customer
from app.models.order import Order
from app.models.product import Product

router = APIRouter(prefix="/api/stripe", tags=["stripe"])


@router.post("/create-checkout-session/{order_id}")
def create_checkout_session(
    order_id: int,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    """Create a Stripe Checkout Session for the given order."""
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.customer_id == customer.id)
        .first()
    )
    if order is None:
        raise HTTPException(404, "Order not found")
    if order.status != "pending":
        raise HTTPException(400, f"Order status is '{order.status}', not payable")

    line_items = []
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        product_name = product.name if product else f"Product #{item.product_id}"

        line_items.append(
            {
                "price_data": {
                    "currency": "usd",
                    "unit_amount": int(float(item.price_at_purchase_usd) * 100),
                    "product_data": {"name": product_name},
                },
                "quantity": item.quantity,
            }
        )

    stripe = get_stripe()

    try:
        session = stripe.checkout.Session.create(
            line_items=line_items,
            mode="payment",
            success_url="http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",
            cancel_url="http://localhost:5173/cancel",
            metadata={
                "order_id": str(order.id),
                "customer_id": str(customer.id),
            },
        )
    except Exception as e:
        raise HTTPException(500, f"Stripe error: {str(e)}")

    order.stripe_checkout_session_id = session.id
    db.commit()

    return {
        "checkout_url": session.url,
        "session_id": session.id,
    }


@router.get("/session-status/{session_id}")
def get_session_status(session_id: str):
    """
    Poll Stripe for session status (used by frontend success page).
    Uses .to_dict() (SDK v15 API) to convert StripeObject → plain dict.
    """
    stripe = get_stripe()
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(404, f"Session not found: {str(e)}")

    # Stripe SDK v15: use .to_dict() to get a plain dict
    session_dict = session.to_dict()

    metadata = session_dict.get("metadata") or {}

    return {
        "session_id": session_dict.get("id"),
        "status": session_dict.get("status"),
        "payment_status": session_dict.get("payment_status"),
        "order_id": metadata.get("order_id"),
    }


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
):
    """
    Stripe webhook.

    1. Verify signature (proves payload came from Stripe).
    2. Parse payload JSON directly (avoids StripeObject quirks in SDK v15).
    3. Update order status if pending.
    """
    payload = await request.body()
    endpoint_secret = settings.stripe_webhook_secret

    stripe = get_stripe()

    # 1. Signature verification — ensures payload is authentic
    try:
        stripe.Webhook.construct_event(payload, stripe_signature, endpoint_secret)
    except ValueError:
        raise HTTPException(400, "Invalid payload")
    except Exception as e:
        raise HTTPException(400, f"Invalid signature: {str(e)}")

    # 2. Parse payload as plain JSON
    try:
        event = json.loads(payload.decode("utf-8"))
    except Exception as e:
        raise HTTPException(400, f"JSON parse error: {str(e)}")

    event_type = event.get("type")
    print(f"📩 Webhook received: {event_type}")

    if event_type == "checkout.session.completed":
        session = event.get("data", {}).get("object", {}) or {}
        metadata = session.get("metadata", {}) or {}
        order_id = metadata.get("order_id")

        print(f"📩 Order ID from metadata: {order_id}")

        if order_id:
            db = SessionLocal()
            try:
                order = db.query(Order).filter(Order.id == int(order_id)).first()
                if order and order.status == "pending":
                    order.status = "paid"
                    order.stripe_payment_intent_id = session.get("payment_intent")
                    db.commit()
                    print(f"✅ Order #{order.id} marked as PAID")
                else:
                    print(f"⚠️  Order #{order_id} not found or already paid")
            finally:
                db.close()
        else:
            print("⚠️  No order_id in metadata")

    return {"received": True}
