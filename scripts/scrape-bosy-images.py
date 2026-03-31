#!/usr/bin/env python3
"""
Scrape all product images from bosy.bg and save them locally.
Usage: python3 scripts/scrape-bosy-images.py
"""

import os
import re
import json
import time
import sys
import urllib.parse
from pathlib import Path
from typing import Optional, List, Dict

import requests
from bs4 import BeautifulSoup

# ── Config ────────────────────────────────────────────────────────────
BASE_URL = "https://bosy.bg"
SITEMAP_URL = f"{BASE_URL}/product-sitemap.xml"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "public" / "products"
MAPPING_FILE = OUTPUT_DIR / "products-images.json"
RATE_LIMIT = 1.0  # seconds between requests
MAX_RETRIES = 3
RETRY_BACKOFF = 2  # exponential backoff multiplier
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}

# ── Helpers ───────────────────────────────────────────────────────────
session = requests.Session()
session.headers.update(HEADERS)


def fetch(url: str, stream: bool = False) -> Optional[requests.Response]:
    """Fetch a URL with retries and rate limiting."""
    for attempt in range(MAX_RETRIES):
        try:
            resp = session.get(url, stream=stream, timeout=30)
            if resp.status_code in (429, 500, 502, 503, 504):
                wait = RETRY_BACKOFF ** (attempt + 1)
                print(f"  ⏳ {resp.status_code} for {url}, retrying in {wait}s...")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            time.sleep(RATE_LIMIT)
            return resp
        except requests.RequestException as e:
            wait = RETRY_BACKOFF ** (attempt + 1)
            print(f"  ⚠ Error fetching {url}: {e}, retrying in {wait}s...")
            time.sleep(wait)
    print(f"  ✗ Failed to fetch {url} after {MAX_RETRIES} retries")
    return None


def get_extension(url: str, content_type: str = "") -> str:
    """Determine file extension from URL or content-type."""
    # Try from URL path first
    path = urllib.parse.urlparse(url).path
    # Remove size suffix like -300x300, -1024x1024, -600x600
    ext = os.path.splitext(path)[1].lower()
    if ext in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"):
        return ext
    # Fallback to content-type
    ct_map = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/svg+xml": ".svg",
    }
    for ct, extension in ct_map.items():
        if ct in content_type:
            return extension
    return ".jpg"  # default


def strip_size_suffix(url: str) -> str:
    """Remove WP size suffixes like -300x300, -1024x1024 from URL to get original."""
    return re.sub(r'-\d+x\d+(\.\w+)$', r'\1', url)


def get_slug(url: str) -> str:
    """Extract slug from product URL."""
    parsed = urllib.parse.urlparse(url)
    path = parsed.path.rstrip("/")
    slug = path.split("/")[-1]
    # Decode percent-encoded slugs
    slug = urllib.parse.unquote(slug)
    return slug


def download_image(url: str, save_path: Path) -> bool:
    """Download an image to disk."""
    if save_path.exists():
        print(f"    ✓ Already exists: {save_path.name}")
        return True

    resp = fetch(url, stream=True)
    if not resp:
        return False

    save_path.parent.mkdir(parents=True, exist_ok=True)
    with open(save_path, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
    size_kb = save_path.stat().st_size / 1024
    print(f"    ✓ Downloaded: {save_path.name} ({size_kb:.1f} KB)")
    return True


# ── Step 1: Get product URLs from sitemap ─────────────────────────────
def get_product_urls() -> List[str]:
    """Fetch product URLs from sitemap."""
    print("Fetching product sitemap...")
    resp = fetch(SITEMAP_URL)
    if not resp:
        print("Failed to fetch sitemap!")
        sys.exit(1)

    soup = BeautifulSoup(resp.text, "html.parser")
    urls = []
    for loc in soup.find_all("loc"):
        url = loc.text.strip()
        # Only include /product/ URLs
        if "/product/" in url:
            urls.append(url)
    print(f"Found {len(urls)} product URLs in sitemap\n")
    return urls


# ── Step 2: Extract images from product page ─────────────────────────
def extract_product_images(url: str, html: str) -> dict:
    """
    Extract featured image and gallery images from a product page.
    Returns: {"featured": url_or_None, "gallery": [urls]}
    """
    soup = BeautifulSoup(html, "html.parser")
    result = {"featured": None, "gallery": []}
    seen_urls = set()

    # Strategy 1: Elementor gallery items (href contains full-size image)
    gallery_links = soup.select('a.e-gallery-item[href*="/wp-content/uploads/"]')
    gallery_urls = []
    for a in gallery_links:
        href = a.get("href", "")
        if href and href not in seen_urls:
            seen_urls.add(href)
            gallery_urls.append(href)

    # Strategy 2: WooCommerce product gallery (data-large_image or href)
    wc_gallery = soup.select('.woocommerce-product-gallery__image a[href*="/wp-content/uploads/"]')
    for a in wc_gallery:
        href = a.get("href", "")
        if href and href not in seen_urls:
            seen_urls.add(href)
            gallery_urls.append(href)

    # Strategy 3: Find the main/featured product image
    # Look for large product images in img tags (1024x1024 or full size)
    # Usually it's the first big product image on the page
    featured_candidates = []

    # Look for images that are likely the main product image
    # These are typically large (1024x1024 or no size suffix) and in the main content area
    all_imgs = soup.find_all("img", src=re.compile(r'/wp-content/uploads/'))
    for img in all_imgs:
        src = img.get("src", "")
        # Skip tiny images (300x300, 150x150, etc.) and non-product images
        if re.search(r'-(?:300|150|100|18|80|12)x(?:300|150|100|18|80|12)\.\w+$', src):
            continue
        # Skip SVG icons
        if src.endswith('.svg'):
            continue
        # Skip logo, payment, favicon, etc
        if any(x in src.lower() for x in ['logo', 'payment', 'favicon', 'confetti', 'register-bg', 'cover',
                                             'sugar-free', 'high-protein', 'no-palm', 'gluten-free', 'vegan',
                                             'home-boxes', 'elementor/thumbs', 'accent-']):
            continue
        # Get full-size URL
        full_url = strip_size_suffix(src)
        if full_url not in seen_urls:
            featured_candidates.append(full_url)

    # Also check srcset for full-size images
    for img in all_imgs:
        srcset = img.get("srcset", "")
        if srcset:
            # Get the largest image from srcset
            parts = srcset.split(",")
            for part in parts:
                part = part.strip()
                match = re.match(r'(\S+)\s+(\d+)w', part)
                if match:
                    img_url = match.group(1)
                    full_url = strip_size_suffix(img_url)
                    if full_url not in seen_urls and '/wp-content/uploads/' in full_url:
                        if not any(x in full_url.lower() for x in ['logo', 'payment', 'favicon', 'confetti', 'register-bg', 'cover',
                                                                     'sugar-free', 'high-protein', 'no-palm', 'gluten-free', 'vegan',
                                                                     'home-boxes', 'elementor/thumbs', 'accent-']):
                            if full_url not in featured_candidates:
                                featured_candidates.append(full_url)

    # The featured image is typically the first large product-related image
    # that's NOT in the gallery
    gallery_originals = {strip_size_suffix(u) for u in gallery_urls}

    # First try: find a featured image that's different from gallery images
    for candidate in featured_candidates:
        orig = strip_size_suffix(candidate)
        if orig not in gallery_originals:
            result["featured"] = orig
            break

    # If no distinct featured image found, use the first candidate
    if not result["featured"] and featured_candidates:
        result["featured"] = strip_size_suffix(featured_candidates[0])

    # If still no featured, try the first gallery image as featured
    if not result["featured"] and gallery_urls:
        result["featured"] = gallery_urls[0]
        gallery_urls = gallery_urls[1:]  # Remove from gallery since it's now featured

    # Clean gallery: remove the featured image from gallery if present
    featured_orig = strip_size_suffix(result["featured"]) if result["featured"] else None
    result["gallery"] = [
        u for u in gallery_urls
        if strip_size_suffix(u) != featured_orig
    ]

    return result


# ── Main ──────────────────────────────────────────────────────────────
def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    product_urls = get_product_urls()

    mapping = {}
    stats = {
        "total_products": 0,
        "total_images": 0,
        "no_images": [],
        "broken_urls": [],
        "duplicate_slugs": [],
    }
    seen_slugs = {}

    for i, url in enumerate(product_urls, 1):
        slug = get_slug(url)
        print(f"[{i}/{len(product_urls)}] {slug}")

        # Check for duplicate slugs
        if slug in seen_slugs:
            stats["duplicate_slugs"].append({"slug": slug, "urls": [seen_slugs[slug], url]})
            print(f"  ⚠ Duplicate slug! Already seen at {seen_slugs[slug]}")
            continue
        seen_slugs[slug] = url
        stats["total_products"] += 1

        # Fetch product page
        resp = fetch(url)
        if not resp:
            stats["broken_urls"].append(url)
            print(f"  ✗ Failed to fetch page")
            continue

        # Extract images
        images = extract_product_images(url, resp.text)
        product_dir = OUTPUT_DIR / slug
        product_dir.mkdir(parents=True, exist_ok=True)

        product_mapping = {"featured": None, "gallery": []}

        # Download featured image
        if images["featured"]:
            ext = get_extension(images["featured"])
            save_name = f"featured{ext}"
            save_path = product_dir / save_name
            if download_image(images["featured"], save_path):
                product_mapping["featured"] = f"/products/{slug}/{save_name}"
                stats["total_images"] += 1

        # Download gallery images
        for idx, gallery_url in enumerate(images["gallery"], 1):
            ext = get_extension(gallery_url)
            save_name = f"{idx}{ext}"
            save_path = product_dir / save_name
            if download_image(gallery_url, save_path):
                product_mapping["gallery"].append(f"/products/{slug}/{save_name}")
                stats["total_images"] += 1

        if not product_mapping["featured"] and not product_mapping["gallery"]:
            stats["no_images"].append(slug)
            print(f"  ⚠ No images found!")

        mapping[slug] = product_mapping
        print()

    # Save mapping file
    with open(MAPPING_FILE, "w", encoding="utf-8") as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    print(f"\nMapping saved to {MAPPING_FILE}")

    # ── Report ──────────────────────────────────────
    print("\n" + "=" * 60)
    print("SCRAPING REPORT")
    print("=" * 60)
    print(f"Total products found:     {stats['total_products']}")
    print(f"Total images downloaded:  {stats['total_images']}")
    print(f"Products with no images:  {len(stats['no_images'])}")
    if stats['no_images']:
        for s in stats['no_images']:
            print(f"  - {s}")
    print(f"Broken URLs:              {len(stats['broken_urls'])}")
    if stats['broken_urls']:
        for u in stats['broken_urls']:
            print(f"  - {u}")
    print(f"Duplicate slugs:          {len(stats['duplicate_slugs'])}")
    if stats['duplicate_slugs']:
        for d in stats['duplicate_slugs']:
            print(f"  - {d['slug']}: {d['urls']}")
    print("=" * 60)


if __name__ == "__main__":
    main()
