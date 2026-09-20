"""
Download product images from Hugging Face and save them to backend/uploads/.
Then updates each product in the DB with its new image URL.
"""

import os
from pathlib import Path
from datasets import load_dataset

# Where to save
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# How many images to download (matches your 150 products)
NUM_IMAGES = 150

print("📥 Loading dataset from Hugging Face...")
# This is a small dataset; it downloads on first run (~500 MB)
dataset = load_dataset("ashraq/fashion-product-images-small", split="train")

print(f"✅ Dataset loaded: {len(dataset)} rows")

# Take the first NUM_IMAGES
subset = dataset.select(range(min(NUM_IMAGES, len(dataset))))

print(f"💾 Saving {len(subset)} images...")

saved = []
for idx, row in enumerate(subset):
    image = row["image"]
    # Save with predictable naming: product_1.jpg, product_2.jpg, ...
    filename = f"product_{idx + 1}.jpg"
    filepath = UPLOAD_DIR / filename

    # Convert to RGB and save as JPEG
    image.convert("RGB").save(filepath, "JPEG", quality=85)
    saved.append(f"/uploads/{filename}")

    if (idx + 1) % 25 == 0:
        print(f"   Saved {idx + 1}/{len(subset)}")

print(f"\n✅ Done! Saved {len(saved)} images to {UPLOAD_DIR}")

# Save the URL list for the next script
with open("uploads/_urls.txt", "w") as f:
    for url in saved:
        f.write(url + "\n")

print(f"📄 URL list saved to uploads/_urls.txt")
