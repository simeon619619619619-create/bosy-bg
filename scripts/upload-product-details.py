#!/usr/bin/env python3
"""
Upload product details from product-details.json to Supabase.
- Updates `description` with short_description
- Updates `variants` with a JSON object of rich details
- Downloads nutrition images to public/products/<slug>/nutrition.<ext>
"""

import json
import os
import urllib.request
import urllib.error
import ssl

SUPABASE_URL = "https://fmczgjtpkviolvzicefr.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtY3pnanRwa3Zpb2x2emljZWZyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDMwMjAzMiwiZXhwIjoyMDg5ODc4MDMyfQ.Ct9tMXcjAwP6BRLfGFbz_xKLVAPjZdX7pqZ14cCI_hE"

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_PRODUCTS = os.path.join(PROJECT_ROOT, "public", "products")

# Allow self-signed certs (macOS sometimes has issues)
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


def supabase_patch(slug: str, payload: dict) -> bool:
    """PATCH a product row by slug."""
    url = f"{SUPABASE_URL}/rest/v1/products?slug=eq.{urllib.parse.quote(slug)}"
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, method="PATCH")
    req.add_header("apikey", SUPABASE_KEY)
    req.add_header("Authorization", f"Bearer {SUPABASE_KEY}")
    req.add_header("Content-Type", "application/json")
    req.add_header("Prefer", "return=minimal")
    try:
        resp = urllib.request.urlopen(req, context=ctx)
        return resp.status in (200, 204)
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.read().decode()}")
        return False


def download_image(image_url: str, slug: str) -> str:
    """Download nutrition image, return local path relative to public/."""
    if not image_url or "turkey-wafer-nutrition-facts" in image_url:
        # Skip the generic placeholder image
        return ""

    ext = ".png" if image_url.endswith(".png") else ".jpg"
    dest_dir = os.path.join(PUBLIC_PRODUCTS, slug)
    os.makedirs(dest_dir, exist_ok=True)
    dest_path = os.path.join(dest_dir, f"nutrition{ext}")

    if os.path.exists(dest_path):
        rel = f"/products/{slug}/nutrition{ext}"
        print(f"  Already exists: {rel}")
        return rel

    try:
        req = urllib.request.Request(image_url)
        req.add_header("User-Agent", "Mozilla/5.0")
        resp = urllib.request.urlopen(req, context=ctx, timeout=30)
        with open(dest_path, "wb") as f:
            f.write(resp.read())
        rel = f"/products/{slug}/nutrition{ext}"
        print(f"  Downloaded: {rel}")
        return rel
    except Exception as e:
        print(f"  Failed to download {image_url}: {e}")
        return ""


def main():
    import urllib.parse

    json_path = os.path.join(PROJECT_ROOT, "scripts", "product-details.json")
    with open(json_path, "r", encoding="utf-8") as f:
        products = json.load(f)

    total = len(products)
    success = 0
    failed = 0

    for i, (slug, details) in enumerate(products.items(), 1):
        print(f"[{i}/{total}] {slug}")

        # Download nutrition image
        nutrition_local = download_image(details.get("nutrition_image", ""), slug)

        # Build variants object
        variants = {
            "subtitle": details.get("subtitle", ""),
            "badges": details.get("badges", []),
            "why_title": details.get("why_title", ""),
            "why_items": details.get("why_items", []),
            "ingredients": details.get("ingredients", ""),
            "nutrition_image": nutrition_local,
            "shelf_life": details.get("shelf_life", ""),
            "related_slugs": details.get("related_slugs", []),
        }

        # Build update payload
        payload = {"variants": variants}
        short_desc = details.get("short_description", "")
        if short_desc:
            payload["description"] = short_desc

        ok = supabase_patch(slug, payload)
        if ok:
            success += 1
            print(f"  Updated OK")
        else:
            failed += 1
            print(f"  FAILED")

    print(f"\nDone: {success} updated, {failed} failed out of {total}")


if __name__ == "__main__":
    main()
