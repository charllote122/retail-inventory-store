"""Customer auth endpoints: register, login, me."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_customer
from app.core.security import create_access_token, hash_password, verify_password
from app.database import get_db
from app.models.customer import Customer
from app.schemas.customer import (
    CustomerRegister,
    CustomerLogin,
    CustomerResponse,
)
from app.schemas.merchant import Token

router = APIRouter(prefix="/api/customers", tags=["customers"])


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register_customer(payload: CustomerRegister, db: Session = Depends(get_db)):
    if db.query(Customer).filter(Customer.email == payload.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    customer = Customer(
        email=payload.email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        country=payload.country,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    token = create_access_token(subject=customer.id, role="customer")
    return Token(access_token=token)


@router.post("/login", response_model=Token)
def login_customer(payload: CustomerLogin, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.email == payload.email).first()

    if not customer or not verify_password(payload.password, customer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not customer.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Customer account is inactive",
        )

    token = create_access_token(subject=customer.id, role="customer")
    return Token(access_token=token)


@router.get("/me", response_model=CustomerResponse)
def get_me(current: Customer = Depends(get_current_customer)):
    return current
