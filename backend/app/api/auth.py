"""Merchant authentication endpoints: register, login, me."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_merchant
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.merchant import Merchant
from app.schemas.merchant import (
    MerchantRegister,
    MerchantLogin,
    MerchantResponse,
    Token,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_merchant(payload: MerchantRegister, db: Session = Depends(get_db)):
    """Register a new merchant and return an access token."""
    if db.query(Merchant).filter(Merchant.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    if db.query(Merchant).filter(Merchant.store_slug == payload.store_slug).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Store slug already taken",
        )

    merchant = Merchant(
        email=payload.email,
        password_hash=hash_password(payload.password),
        store_name=payload.store_name,
        store_slug=payload.store_slug,
    )
    db.add(merchant)
    db.commit()
    db.refresh(merchant)

    token = create_access_token(subject=merchant.id, role="merchant")
    return Token(access_token=token)


@router.post("/login", response_model=Token)
def login_merchant(payload: MerchantLogin, db: Session = Depends(get_db)):
    """Authenticate a merchant and return a JWT."""
    merchant = db.query(Merchant).filter(Merchant.email == payload.email).first()

    if not merchant or not verify_password(payload.password, merchant.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not merchant.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Merchant account is inactive",
        )

    token = create_access_token(subject=merchant.id, role="merchant")
    return Token(access_token=token)


@router.get("/me", response_model=MerchantResponse)
def get_me(current: Merchant = Depends(get_current_merchant)):
    """Return the currently authenticated merchant."""
    return current
