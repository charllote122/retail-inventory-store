"""
Populate the database with real fashion products from Hugging Face.
Uses the HIGH-RESOLUTION dataset (900x1200) so images can be zoomed.

Disables Hugging Face's Xet backend to avoid the 401 error on large
multi-chunk downloads.

Run with:
    export HF_HUB_DISABLE_XET=1
    export HF_TOKEN=hf_...
    python scripts/populate_from_hf.py
"""

import os
import sys
from pathlib import Path

# Disable Xet BEFORE importing huggingface_hub
os.environ["HF_HUB_DISABLE_XET"] = "1"

# Ensure backend/ is on sys.path so `from app...` works
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import random
from datasets import load_dataset

from app.database import SessionLocal
from app.models.order import Order, OrderItem
from app.models.product import Product

NUM_PRODUCTS = 150
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

CATEGORY_MAP = {
    "Apparel": "Clothing",
    "Footwear": "Clothing",
    "Accessories": "Accessories",
    "Personal Care": "Beauty",
    "Free Items": "Accessories",
    "Sporting Goods": "Sports",
    "Home": "Home & Kitchen",
}


def main():
    print("📥 Loading HIGH-RESOLUTION dataset (900x1200)...")
    print("   First run downloads ~6.5 GB. Be patient.")
    print()

    dataset = load_dataset(
        "benitomartin/fashion-product-images-small-900x1200",
        split="train",
    )
    print(f"✅ Loaded {len(dataset)} rows")

    random.seed(42)
    indices = list(range(len(dataset)))
    random.shuffle(indices)

    db = SessionLocal()
    try:
        # Reset the product ID sequence so new products start from 1
        from sqlalchemy import text

        db.execute(text("ALTER SEQUENCE products_id_seq RESTART WITH 1"))
        db.commit()

        # Delete in FK-safe order: order_items → orders → products
        oi_deleted = db.query(OrderItem).delete()
        o_deleted = db.query(Order).delete()
        p_deleted = db.query(Product).delete()
        db.commit()
        print(
            f"🗑️  Deleted {oi_deleted} order items, {o_deleted} orders, {p_deleted} products"
        )

        created = 0
        for idx in indices:
            if created >= NUM_PRODUCTS:
                break

            row = dataset[idx]

            name = (row.get("productDisplayName") or "").strip()
            if not name:
                continue

            master_category = row.get("masterCategory") or ""
            category = CATEGORY_MAP.get(master_category, "Accessories")

            filename = f"product_{created + 1}.jpg"
            filepath = UPLOAD_DIR / filename
            try:
                row["image"].convert("RGB").save(filepath, "JPEG", quality=90)
            except Exception as e:
                print(f"   Skipping {name}: {e}")
                continue

            if category == "Clothing":
                price = round(random.uniform(19.99, 199.99), 2)
            elif category == "Sports":
                price = round(random.uniform(29.99, 249.99), 2)
            else:
                price = round(random.uniform(9.99, 79.99), 2)

            product = Product(
                merchant_id=1,
                name=name[:255],
                description=f"{row.get('baseColour', '').title()} {row.get('articleType', '')}".strip(),
                category=category,
                price_usd=price,
                cost_usd=round(price * 0.6, 2),
                stock_quantity=random.randint(20, 200),
                low_stock_threshold=10,
                image_url=f"/uploads/{filename}",
                is_active=True,
            )
            db.add(product)
            created += 1

            if created % 25 == 0:
                print(f"   Created {created}/{NUM_PRODUCTS}")

        db.commit()
        print(f"\n✅ Done! Created {created} products with high-res images")

    finally:
        db.close()


if __name__ == "__main__":
    main()
