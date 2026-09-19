"""
Demand prediction service.
Uses `category_encoded` directly from features.csv — no encoder needed.
"""

import os
import joblib
import pandas as pd
import numpy as np
from datetime import timedelta

PROCESSED_DIR = "data/processed"
MODELS_DIR = "models"
FEATURES_FILE = f"{PROCESSED_DIR}/features.csv"
MODEL_FILE = f"{MODELS_DIR}/demand_model.pkl"

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
_features_df = None


def _load_artifacts():
    global _model, _features_df

    if _model is None:
        if not os.path.exists(MODEL_FILE):
            raise FileNotFoundError(
                f"Model not found at {MODEL_FILE}. Run `python src/train.py` first."
            )
        _model = joblib.load(MODEL_FILE)
        _features_df = pd.read_csv(FEATURES_FILE, parse_dates=["date"])

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

    def rolling_mean(window):
        return float(np.mean(recent_sales[-window:])) if recent_sales else np.nan

    def rolling_std(window):
        return float(np.std(recent_sales[-window:])) if len(recent_sales) >= 2 else 0.0

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
    model, features_df = _load_artifacts()

    prod_df = features_df[
        (features_df["product_id"] == product_id)
        & (features_df["merchant_id"] == merchant_id)
    ].sort_values("date")

    if prod_df.empty:
        raise ValueError(
            f"No history for product_id={product_id}, merchant_id={merchant_id}"
        )

    last_row = prod_df.iloc[-1]
    price_usd = float(last_row["price_usd"])
    category_encoded = int(last_row["category_encoded"])
    last_date = last_row["date"]

    recent_sales = prod_df["quantity_sold"].tolist()

    daily_predictions = []
    simulated_sales = recent_sales.copy()

    for day_offset in range(1, FORECAST_DAYS + 1):
        target_date = last_date + timedelta(days=day_offset)

        feature_row = _build_features_for_day(
            product_id=product_id,
            merchant_id=merchant_id,
            price_usd=price_usd,
            category_encoded=category_encoded,
            target_date=target_date,
            recent_sales=simulated_sales,
        )

        X = pd.DataFrame([feature_row])[FEATURE_COLS]
        pred = max(0.0, float(model.predict(X)[0]))

        daily_predictions.append(
            {
                "date": target_date.date().isoformat(),
                "predicted_units": round(pred, 2),
            }
        )
        simulated_sales.append(pred)

    total = sum(d["predicted_units"] for d in daily_predictions)

    return {
        "product_id": product_id,
        "merchant_id": merchant_id,
        "predicted_units_next_week": round(total, 1),
        "daily_forecast": daily_predictions,
    }


def predict_all_products_for_merchant(merchant_id: int) -> list[dict]:
    _, features_df = _load_artifacts()

    product_ids = (
        features_df[features_df["merchant_id"] == merchant_id]["product_id"]
        .unique()
        .tolist()
    )

    results = []
    for pid in product_ids:
        try:
            results.append(predict_next_week(merchant_id, int(pid)))
        except Exception as e:
            results.append(
                {
                    "product_id": int(pid),
                    "merchant_id": merchant_id,
                    "error": str(e),
                }
            )
    return results


if __name__ == "__main__":
    print("🔮 Loading model and generating forecasts...\n")

    merchant_id = 1
    product_id = 1

    result = predict_next_week(merchant_id, product_id)

    print(f"📦 Product {result['product_id']} (Merchant {result['merchant_id']})")
    print(f"   Predicted units next week: {result['predicted_units_next_week']}")
    print(f"\n   Daily breakdown:")
    for day in result["daily_forecast"]:
        print(f"      {day['date']}: {day['predicted_units']} units")

    print("\n" + "=" * 50)
    print("📊 All products for merchant 1 (first 5):\n")

    all_preds = predict_all_products_for_merchant(merchant_id)
    for p in all_preds[:5]:
        if "error" in p:
            print(f"   Product {p['product_id']}: ❌ {p['error']}")
        else:
            print(
                f"   Product {p['product_id']:3d}: "
                f"{p['predicted_units_next_week']:6.1f} units next week"
            )

    print("\n✅ Done!")
