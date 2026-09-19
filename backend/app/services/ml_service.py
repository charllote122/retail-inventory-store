"""
ML service — serves demand predictions.

Loads the pre-trained XGBoost model + category encoder from the
ml/ folder and exposes functions the API can call.

Model artifacts live in ml/models/. The feature engineering logic
mirrors ml/src/predict.py so training and inference stay consistent.
"""

import os
import sys
from datetime import timedelta
from typing import Optional

import joblib
import numpy as np
import pandas as pd

# Resolve the project root so we can find ml/
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PROJECT_ROOT = os.path.abspath(os.path.join(BACKEND_DIR, ".."))
ML_DIR = os.path.join(PROJECT_ROOT, "ml")

MODEL_PATH = os.path.join(ML_DIR, "models", "demand_model.pkl")
FEATURES_PATH = os.path.join(ML_DIR, "data", "processed", "features.csv")

FEATURE_COLS = [
    "product_id",
    "merchant_id",
    "price_usd",
    "category_encoded",
    "day_of_week",
    "month",
    "day_of_year",
    "week_of_year",
    "is_weekend",
    "is_holiday_season",
    "is_summer",
    "lag_1",
    "lag_2",
    "lag_3",
    "lag_7",
    "lag_14",
    "lag_30",
    "rolling_mean_7",
    "rolling_std_7",
    "rolling_mean_14",
    "rolling_std_14",
    "rolling_mean_30",
    "rolling_std_30",
]

FORECAST_DAYS = 7


_model = None
_features_df: Optional[pd.DataFrame] = None


def _load_artifacts():
    """Lazy-load model and features once, cache in module globals."""
    global _model, _features_df

    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. Run ml/src/train.py first."
            )
        _model = joblib.load(MODEL_PATH)

    if _features_df is None:
        if not os.path.exists(FEATURES_PATH):
            raise FileNotFoundError(
                f"Features not found at {FEATURES_PATH}. Run ml/src/preprocess.py first."
            )
        _features_df = pd.read_csv(FEATURES_PATH, parse_dates=["date"])

    return _model, _features_df


def _build_features_for_day(
    product_id,
    merchant_id,
    price_usd,
    category_encoded,
    target_date,
    recent_sales,
) -> dict:
    def lag(n):
        return recent_sales[-n] if len(recent_sales) >= n else np.nan

    def rolling_mean(w):
        return float(np.mean(recent_sales[-w:])) if recent_sales else np.nan

    def rolling_std(w):
        return float(np.std(recent_sales[-w:])) if len(recent_sales) >= 2 else 0.0

    return {
        "product_id": product_id,
        "merchant_id": merchant_id,
        "price_usd": price_usd,
        "category_encoded": category_encoded,
        "day_of_week": target_date.dayofweek,
        "month": target_date.month,
        "day_of_year": target_date.dayofyear,
        "week_of_year": int(target_date.isocalendar().week),
        "is_weekend": int(target_date.dayofweek >= 5),
        "is_holiday_season": int(target_date.month in [11, 12]),
        "is_summer": int(target_date.month in [6, 7, 8]),
        "lag_1": lag(1),
        "lag_2": lag(2),
        "lag_3": lag(3),
        "lag_7": lag(7),
        "lag_14": lag(14),
        "lag_30": lag(30),
        "rolling_mean_7": rolling_mean(7),
        "rolling_std_7": rolling_std(7),
        "rolling_mean_14": rolling_mean(14),
        "rolling_std_14": rolling_std(14),
        "rolling_mean_30": rolling_mean(30),
        "rolling_std_30": rolling_std(30),
    }


def predict_next_week(merchant_id: int, product_id: int) -> dict:
    """Forecast demand for the next 7 days for a product."""
    model, features_df = _load_artifacts()

    prod_df = features_df[
        (features_df["product_id"] == product_id)
        & (features_df["merchant_id"] == merchant_id)
    ].sort_values("date")

    if prod_df.empty:
        raise ValueError(
            f"No historical sales for product {product_id} of merchant {merchant_id}"
        )

    last_row = prod_df.iloc[-1]
    price_usd = float(last_row["price_usd"])
    category_encoded = int(last_row["category_encoded"])
    last_date = last_row["date"]

    recent_sales = prod_df["quantity_sold"].tolist()
    simulated = recent_sales.copy()

    daily = []
    for offset in range(1, FORECAST_DAYS + 1):
        target = last_date + timedelta(days=offset)
        feat = _build_features_for_day(
            product_id,
            merchant_id,
            price_usd,
            category_encoded,
            target,
            simulated,
        )
        X = pd.DataFrame([feat])[FEATURE_COLS]
        pred = max(0.0, float(model.predict(X)[0]))
        daily.append(
            {
                "date": target.date().isoformat(),
                "predicted_units": round(pred, 2),
            }
        )
        simulated.append(pred)

    total = sum(d["predicted_units"] for d in daily)
    return {
        "product_id": product_id,
        "merchant_id": merchant_id,
        "predicted_units_next_week": round(total, 1),
        "daily_forecast": daily,
    }


def has_history(merchant_id: int, product_id: int) -> bool:
    """Check if the model has training data for this product."""
    _, features_df = _load_artifacts()
    return not features_df[
        (features_df["product_id"] == product_id)
        & (features_df["merchant_id"] == merchant_id)
    ].empty
