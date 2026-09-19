"""
Preprocessing pipeline for retail demand forecasting.

Category encoding is done here so downstream scripts (train, predict,
explain) can read `category_encoded` directly from features.csv.
The fitted encoder is saved to models/ for future use.
"""

import os
import joblib
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder

RAW_DIR = "data/raw"
PROCESSED_DIR = "data/processed"
MODELS_DIR = "models"


def load_raw_data() -> tuple[pd.DataFrame, pd.DataFrame]:
    sales = pd.read_csv(f"{RAW_DIR}/sales_history.csv", parse_dates=["date"])
    products = pd.read_csv(f"{RAW_DIR}/products.csv")
    return sales, products


def merge_products(sales: pd.DataFrame, products: pd.DataFrame) -> pd.DataFrame:
    df = sales.merge(
        products[["product_id", "category", "price_usd"]],
        on="product_id",
        how="left",
        suffixes=("", "_product"),
    )
    return df


def handle_stockouts(df: pd.DataFrame) -> pd.DataFrame:
    """Add corrected target + censored flag without destroying quantity_sold."""
    df["is_censored"] = df["was_stockout"].astype(int)
    df["demand_corrected"] = df["quantity_sold"].where(
        df["was_stockout"] == False, other=np.nan
    )
    return df


def add_category_encoding(df: pd.DataFrame) -> pd.DataFrame:
    """Fit a LabelEncoder on category and persist it."""
    encoder = LabelEncoder()
    df["category_encoded"] = encoder.fit_transform(df["category"])
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(encoder, f"{MODELS_DIR}/category_encoder.pkl")
    print(f"   Encoded categories: {list(encoder.classes_)}")
    return df


def add_calendar_features(df: pd.DataFrame) -> pd.DataFrame:
    df["day_of_week"] = df["date"].dt.dayofweek
    df["month"] = df["date"].dt.month
    df["day_of_year"] = df["date"].dt.dayofyear
    df["week_of_year"] = df["date"].dt.isocalendar().week.astype(int)
    df["is_weekend"] = (df["day_of_week"] >= 5).astype(int)
    df["is_holiday_season"] = df["month"].isin([11, 12]).astype(int)
    df["is_summer"] = df["month"].isin([6, 7, 8]).astype(int)
    return df


def add_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(["product_id", "date"])
    for lag in [1, 2, 3, 7, 14, 30]:
        df[f"lag_{lag}"] = df.groupby("product_id")["quantity_sold"].shift(lag)
    return df


def add_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    for window in [7, 14, 30]:
        df[f"rolling_mean_{window}"] = df.groupby("product_id")[
            "quantity_sold"
        ].transform(lambda x: x.rolling(window, min_periods=1).mean())
        df[f"rolling_std_{window}"] = df.groupby("product_id")[
            "quantity_sold"
        ].transform(lambda x: x.rolling(window, min_periods=1).std())
    return df


def add_promotion_feature(df: pd.DataFrame) -> pd.DataFrame:
    df["promotion_applied"] = df["promotion_applied"].astype(int)
    return df


def drop_na_rows(df: pd.DataFrame) -> pd.DataFrame:
    required = ["lag_30", "rolling_mean_30"]
    before = len(df)
    df = df.dropna(subset=required)
    print(f"   Dropped {before - len(df):,} rows (insufficient history)")
    return df


def save_processed(df: pd.DataFrame) -> str:
    os.makedirs(PROCESSED_DIR, exist_ok=True)
    out_path = f"{PROCESSED_DIR}/features.csv"
    df.to_csv(out_path, index=False)
    return out_path


def main():
    print("📥 Loading raw data...")
    sales, products = load_raw_data()
    print(f"   Sales rows: {len(sales):,}")
    print(f"   Products:   {len(products):,}")

    print("🔗 Merging product metadata...")
    df = merge_products(sales, products)

    print("🚫 Handling stockouts (censored demand)...")
    df = handle_stockouts(df)

    print("🔤 Encoding product categories...")
    df = add_category_encoding(df)

    print("📅 Adding calendar features...")
    df = add_calendar_features(df)

    print("⏮️  Adding lag features (1, 2, 3, 7, 14, 30 days)...")
    df = add_lag_features(df)

    print("📊 Adding rolling features (7, 14, 30 days)...")
    df = add_rolling_features(df)

    print("🏷️  Adding promotion flag...")
    df = add_promotion_feature(df)

    print("🧹 Dropping rows with missing history...")
    df = drop_na_rows(df)

    print("💾 Saving processed features...")
    path = save_processed(df)

    censored = int(df["is_censored"].sum())
    censored_pct = (censored / len(df)) * 100 if len(df) else 0.0

    print(f"\n✅ Done! Saved to: {path}")
    print(f"   Final rows:    {len(df):,}")
    print(f"   Final columns: {len(df.columns)}")
    print(f"   Censored rows: {censored:,} ({censored_pct:.2f}%)")


if __name__ == "__main__":
    main()
