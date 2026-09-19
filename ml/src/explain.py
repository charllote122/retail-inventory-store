"""
SHAP-based explainability for demand predictions.
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import joblib
import pandas as pd
import numpy as np
import shap

PROCESSED_DIR = "data/processed"
MODELS_DIR = "models"
FEATURES_FILE = f"{PROCESSED_DIR}/features.csv"
MODEL_FILE = f"{MODELS_DIR}/demand_model.pkl"

FEATURE_LABELS = {
    "product_id": "Product ID",
    "merchant_id": "Merchant ID",
    "price_usd": "Product price",
    "category_encoded": "Product category",
    "day_of_week": "Day of week",
    "month": "Month",
    "day_of_year": "Day of year",
    "week_of_year": "Week of year",
    "is_weekend": "Weekend",
    "is_holiday_season": "Holiday season",
    "is_summer": "Summer season",
    "lag_1": "Yesterday's sales",
    "lag_2": "Sales 2 days ago",
    "lag_3": "Sales 3 days ago",
    "lag_7": "Sales 7 days ago",
    "lag_14": "Sales 14 days ago",
    "lag_30": "Sales 30 days ago",
    "rolling_mean_7": "7-day sales trend",
    "rolling_std_7": "7-day volatility",
    "rolling_mean_14": "14-day sales trend",
    "rolling_std_14": "14-day volatility",
    "rolling_mean_30": "30-day sales trend",
    "rolling_std_30": "30-day volatility",
}


_model = None
_explainer = None
_features_df = None


def _load_artifacts():
    global _model, _explainer, _features_df

    if _model is None:
        if not os.path.exists(MODEL_FILE):
            raise FileNotFoundError(
                f"Model not found at {MODEL_FILE}. Run `python src/train.py` first."
            )
        _model = joblib.load(MODEL_FILE)
        _explainer = shap.TreeExplainer(_model)
        _features_df = pd.read_csv(FEATURES_FILE, parse_dates=["date"])

    return _model, _explainer, _features_df


def explain_prediction(feature_row: pd.DataFrame, top_n: int = 5) -> dict:
    model, explainer, _ = _load_artifacts()

    shap_values = explainer.shap_values(feature_row)

    if isinstance(shap_values, list):
        shap_values = shap_values[0]
    if hasattr(shap_values, "ndim") and shap_values.ndim == 2:
        shap_values = shap_values[0]

    predicted_value = float(model.predict(feature_row)[0])

    pairs = list(zip(feature_row.columns.tolist(), np.array(shap_values).tolist()))
    pairs.sort(key=lambda x: abs(x[1]), reverse=True)

    top_drivers = []
    for feature, value in pairs[:top_n]:
        top_drivers.append(
            {
                "feature": feature,
                "label": FEATURE_LABELS.get(feature, feature),
                "shap_value": round(float(value), 3),
                "direction": "up" if value > 0 else "down",
            }
        )

    base_value = explainer.expected_value
    if isinstance(base_value, (list, np.ndarray)):
        base_value = float(np.array(base_value).flatten()[0])

    return {
        "base_value": round(float(base_value), 3),
        "predicted_value": round(predicted_value, 3),
        "top_drivers": top_drivers,
    }


def explain_last_prediction(merchant_id: int, product_id: int, top_n: int = 5) -> dict:
    _, _, features_df = _load_artifacts()

    prod_df = features_df[
        (features_df["product_id"] == product_id)
        & (features_df["merchant_id"] == merchant_id)
    ].sort_values("date")

    if prod_df.empty:
        raise ValueError(
            f"No history for product_id={product_id}, merchant_id={merchant_id}"
        )

    from src.train import FEATURE_COLS

    last_row = prod_df[FEATURE_COLS].iloc[[-1]].reset_index(drop=True)

    explanation = explain_prediction(last_row, top_n=top_n)
    explanation["product_id"] = product_id
    explanation["merchant_id"] = merchant_id
    return explanation


if __name__ == "__main__":
    print("🔍 Generating SHAP explanation for a sample prediction...\n")

    merchant_id = 1
    product_id = 1

    result = explain_last_prediction(merchant_id, product_id, top_n=5)

    print(f"📦 Product {result['product_id']} (Merchant {result['merchant_id']})")
    print(f"   Base value (avg across all rows): {result['base_value']}")
    print(f"   Predicted value:                  {result['predicted_value']}")
    print(f"\n   Top drivers for this prediction:")

    for driver in result["top_drivers"]:
        sign = "+" if driver["shap_value"] >= 0 else ""
        arrow = "⬆️" if driver["direction"] == "up" else "⬇️"
        print(
            f"      {arrow} {driver['label']:30s} "
            f"{sign}{driver['shap_value']:>7.3f}"
        )

    print("\n✅ Done!")
