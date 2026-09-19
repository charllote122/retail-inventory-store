"""
European/US Retail Data Generator
Simulates a Shopify-like multi-tenant platform with USD pricing,
realistic restocking lead times, and stockout events.
"""

import os
import random
from datetime import datetime, timedelta
from faker import Faker
import pandas as pd
import numpy as np

# Initialize Faker with a seed for reproducibility
fake = Faker()
Faker.seed(42)
np.random.seed(42)
random.seed(42)

# ---------- Configuration ----------
NUM_MERCHANTS = 5
NUM_CUSTOMERS = 200
NUM_PRODUCTS_PER_MERCHANT = 30
DAYS_OF_HISTORY = 730  # 2 years

# Restocking behavior
RESTOCK_THRESHOLD = 20
RESTOCK_AMOUNT = 100
LEAD_TIME_DAYS = 5

# Product categories with realistic USD price ranges
CATEGORIES = {
    "Electronics": (19.99, 899.99),
    "Clothing": (9.99, 149.99),
    "Home & Kitchen": (14.99, 299.99),
    "Beauty": (5.99, 79.99),
    "Sports": (12.99, 249.99),
    "Books": (4.99, 39.99),
    "Toys": (7.99, 99.99),
}

STORE_NAMES = [
    "NovaTech Store",
    "UrbanThreads",
    "HomeHaven",
    "PureGlow Beauty",
    "PeakPerformance Sports",
]


def generate_merchants():
    """Generate Shopify-like merchants (store owners)."""
    merchants = []
    for i in range(NUM_MERCHANTS):
        merchants.append(
            {
                "merchant_id": i + 1,
                "store_name": STORE_NAMES[i],
                "store_slug": STORE_NAMES[i].lower().replace(" ", "-"),
                "email": fake.company_email(),
                "created_at": fake.date_between(start_date="-3y", end_date="-2y"),
            }
        )
    return pd.DataFrame(merchants)


def generate_customers():
    """Generate global customers."""
    customers = []
    countries = ["US", "DE", "PL", "EE", "GB", "FR", "CA"]
    for i in range(NUM_CUSTOMERS):
        customers.append(
            {
                "customer_id": i + 1,
                "email": fake.email(),
                "country": random.choice(countries),
                "created_at": fake.date_between(start_date="-3y", end_date="today"),
            }
        )
    return pd.DataFrame(customers)


def generate_products(merchants_df):
    """Generate products belonging to specific merchants (multi-tenant)."""
    products = []
    product_id = 1
    for _, merchant in merchants_df.iterrows():
        for _ in range(NUM_PRODUCTS_PER_MERCHANT):
            category = random.choice(list(CATEGORIES.keys()))
            min_price, max_price = CATEGORIES[category]
            price = round(random.uniform(min_price, max_price), 2)
            products.append(
                {
                    "product_id": product_id,
                    "merchant_id": merchant["merchant_id"],
                    "name": f"{fake.word().title()} {fake.word().title()}",
                    "category": category,
                    "price_usd": price,
                    "cost_usd": round(price * 0.6, 2),
                    "initial_stock": random.randint(50, 200),
                }
            )
            product_id += 1
    return pd.DataFrame(products)


def simulate_sales(products_df, merchants_df):
    """
    Simulate realistic daily sales.

    FIX APPLIED: Reduced seasonality multipliers to realistic levels.
    Real-world holiday/weekend spikes are 15-25%, not 40-60%.
    This forces the model to learn from sales history (lags, rolling)
    rather than memorizing the calendar.
    """
    records = []
    start_date = datetime.now() - timedelta(days=DAYS_OF_HISTORY)

    stock_levels = {
        row["product_id"]: row["initial_stock"] for _, row in products_df.iterrows()
    }
    pending_orders = {pid: [] for pid in stock_levels.keys()}

    for day_offset in range(DAYS_OF_HISTORY):
        current_date = start_date + timedelta(days=day_offset)
        day_of_week = current_date.weekday()
        month = current_date.month

        # --- REALISTIC multipliers (was 1.4/1.6/1.2) ---
        weekend_multiplier = 1.15 if day_of_week >= 5 else 1.0
        holiday_multiplier = 1.25 if month in [11, 12] else 1.0
        summer_multiplier = 1.10 if month in [6, 7, 8] else 1.0

        for _, product in products_df.iterrows():
            pid = product["product_id"]

            # 1. Receive arriving stock
            arriving = [
                qty for (arr_day, qty) in pending_orders[pid] if arr_day <= day_offset
            ]
            for qty in arriving:
                stock_levels[pid] += qty
            pending_orders[pid] = [
                (d, qty) for (d, qty) in pending_orders[pid] if d > day_offset
            ]

            # 2. Place new restock order if low
            if stock_levels[pid] < RESTOCK_THRESHOLD:
                pending_orders[pid].append(
                    (day_offset + LEAD_TIME_DAYS, RESTOCK_AMOUNT)
                )

            # 3. Stockout
            if stock_levels[pid] <= 0:
                records.append(
                    {
                        "date": current_date.date(),
                        "product_id": pid,
                        "merchant_id": product["merchant_id"],
                        "quantity_sold": 0,
                        "revenue_usd": 0.0,
                        "promotion_applied": False,
                        "was_stockout": True,
                        "price_usd": product["price_usd"],
                    }
                )
                continue

            # 4. Demand
            base_demand = np.random.poisson(lam=5)
            demand = int(
                base_demand
                * weekend_multiplier
                * holiday_multiplier
                * summer_multiplier
            )

            promotion = random.random() < 0.10
            if promotion:
                demand = int(demand * 1.8)

            actual_sold = min(demand, stock_levels[pid])
            stock_levels[pid] -= actual_sold

            records.append(
                {
                    "date": current_date.date(),
                    "product_id": pid,
                    "merchant_id": product["merchant_id"],
                    "quantity_sold": actual_sold,
                    "revenue_usd": round(actual_sold * product["price_usd"], 2),
                    "promotion_applied": promotion,
                    "was_stockout": False,
                    "price_usd": product["price_usd"],
                }
            )

    return pd.DataFrame(records)


def main():
    print("🏪 Generating merchants...")
    merchants = generate_merchants()
    merchants.to_csv("data/raw/merchants.csv", index=False)

    print("👥 Generating customers...")
    customers = generate_customers()
    customers.to_csv("data/raw/customers.csv", index=False)

    print("📦 Generating products...")
    products = generate_products(merchants)
    products.to_csv("data/raw/products.csv", index=False)

    print("💰 Simulating sales (this may take 30-60 seconds)...")
    sales = simulate_sales(products, merchants)
    sales.to_csv("data/raw/sales_history.csv", index=False)

    stockout_count = int(sales["was_stockout"].sum())
    stockout_pct = (stockout_count / len(sales)) * 100

    print(f"\n✅ Done! Generated:")
    print(f"   - {len(merchants)} merchants")
    print(f"   - {len(customers)} customers")
    print(f"   - {len(products)} products")
    print(f"   - {len(sales):,} sales records")
    print(f"   - {stockout_count:,} stockout rows ({stockout_pct:.2f}%)")


if __name__ == "__main__":
    main()
