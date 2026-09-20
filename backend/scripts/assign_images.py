"""
Assign saved images to products in PostgreSQL.
Matches product_id 1..N with product_1.jpg .. product_N.jpg
"""

from pathlib import Path
from app.database import SessionLocal
from app.models.product import Product

# Load the URL list
urls_file = Path("uploads/_urls.txt")
urls = urls_file.read_text().strip().split("\n")

print(f"📄 Loaded {len(urls)} image URLs")

db = SessionLocal()
try:
    products = db.query(Product).order_by(Product.id).all()
    print(f"📦 Found {len(products)} products in DB")

    updated = 0
    for product, url in zip(products, urls):
        product.image_url = url
        updated += 1

    db.commit()
    print(f"✅ Updated {updated} products with image URLs")
finally:
    db.close()
