"""Shared FastAPI dependencies (auth, DB session, etc.)."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.merchant import Merchant
from app.models.customer import Customer

bearer_scheme = HTTPBearer()


def _decode_or_401(
    credentials: HTTPAuthorizationCredentials,
    expected_role: str,
) -> dict:
    """Decode JWT and assert the expected role."""
    payload = decode_access_token(credentials.credentials)

    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("role") != expected_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Token is not valid for {expected_role} role",
        )

    return payload


def get_current_merchant(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Merchant:
    """Fetch the authenticated merchant from the JWT."""
    payload = _decode_or_401(credentials, expected_role="merchant")

    merchant = db.query(Merchant).filter(Merchant.id == int(payload["sub"])).first()

    if merchant is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Merchant not found",
        )

    if not merchant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Merchant account is inactive",
        )

    return merchant


def get_current_customer(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Customer:
    """Fetch the authenticated customer from the JWT."""
    payload = _decode_or_401(credentials, expected_role="customer")

    customer = db.query(Customer).filter(Customer.id == int(payload["sub"])).first()

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Customer not found",
        )

    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer account is inactive",
        )

    return customer
