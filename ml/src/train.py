"""
Train XGBoost model to forecast daily product demand.

NOTE: `promotion_applied` is deliberately NOT in FEATURE_COLS (data leakage).
Category encoding is done in preprocess.py, so we just read it from CSV.
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

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

TARGET_COL = "demand_corrected"


def load_features() -> pd.DataFrame:
    return pd.read_csv(FEATURES_FILE, parse_dates=["date"])


def prepare_training_data(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    df = df.sort_values("date").reset_index(drop=True)
    before = len(df)
    df = df.dropna(subset=[TARGET_COL])
    print(f"   Dropped {before - len(df):,} stockout rows (target unknown)")
    X = df[FEATURE_COLS]
    y = df[TARGET_COL]
    return X, y


def train_model(X_train, y_train) -> XGBRegressor:
    model = XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        n_jobs=-1,
        objective="reg:squarederror",
    )
    model.fit(X_train, y_train)
    return model


def evaluate_model(model, X_test, y_test) -> dict:
    preds = model.predict(X_test)
    return {
        "MAE": mean_absolute_error(y_test, preds),
        "RMSE": np.sqrt(mean_squared_error(y_test, preds)),
        "R2": r2_score(y_test, preds),
    }


def main():
    print("📥 Loading features...")
    df = load_features()
    print(f"   Rows: {len(df):,}")

    print("🎯 Preparing training data...")
    X, y = prepare_training_data(df)
    print(f"   X shape: {X.shape}")
    print(f"   y shape: {y.shape}")

    split_idx = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    print(f"   Train: {len(X_train):,} | Test: {len(X_test):,}")

    print("\n🏋️  Training XGBoost...")
    model = train_model(X_train, y_train)

    print("\n📊 Evaluating on test set...")
    metrics = evaluate_model(model, X_test, y_test)
    for name, value in metrics.items():
        print(f"   {name}: {value:.4f}")

    print("\n🔍 Top 10 feature importances:")
    importances = sorted(
        zip(FEATURE_COLS, model.feature_importances_),
        key=lambda x: x[1],
        reverse=True,
    )
    for name, imp in importances[:10]:
        print(f"   {name:25s} {imp:.4f}")

    print("\n💾 Saving model...")
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(model, MODEL_FILE)
    print(f"   → {MODEL_FILE}")

    print("\n✅ Training complete!")


if __name__ == "__main__":
    main()
