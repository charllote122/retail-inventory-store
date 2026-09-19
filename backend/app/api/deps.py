"""Shared FastAPI dependencies (auth, DB session, etc.)."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.database import get_db
from app.models.merchant import Merchant

bearer_scheme = HTTPBearer()


def get_current_merchant(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Merchant:
    """
    Decode the JWT, fetch the merchant, and return it.
    Raises 401 if the token is missing, invalid, or the merchant
    doesn't exist.
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
