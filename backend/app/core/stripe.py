"""Stripe client configuration."""

import stripe

from app.core.config import settings

stripe.api_key = settings.stripe_secret_key


def get_stripe():
    """Return the configured stripe module."""
    return stripe
