#!/usr/bin/env python3
"""Generate styled product photos for BOSY Bubbles using Gemini AI.
Reference style: bubbles-lemongrass (ice cubes, fresh ingredients, white bg, "NEW" badge).
"""

import base64
import json
import sys
import os
import requests

API_KEY = "AIzaSyCLvKjU-M5MUkWPzx6V5y92smOenQR8jks"
MODEL = "gemini-2.5-flash-image"  # supports image generation with references
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={API_KEY}"

IMAGES_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "products", "bubbles-single")

def load_image_b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode()

def generate_styled_photo(reference_b64, can_b64, product_name, fruit_desc, output_path):
    """Send reference + can to Gemini, ask for styled product photo."""

    prompt = f"""You are a professional product photographer. I'm giving you two images:

1. REFERENCE IMAGE: A styled product photo of a BOSY Bubbles green tea can (1080x1080 square). Notice: clean white background, can centered taking up about 60% of frame height, ice cubes at bottom-right, fresh ingredients arranged around the base. Professional e-commerce style. Square 1:1 aspect ratio.

2. PRODUCT CAN: The actual {product_name} can that needs a new styled photo.

YOUR TASK: Create a NEW product photo that matches the reference EXACTLY in composition:
- SQUARE 1:1 format (same as reference)
- Clean pure white background
- The {product_name} can centered, taking up similar proportion of frame as reference (~60% height)
- Ice cubes at the base
- Fresh {fruit_desc} arranged artfully around the bottom — make sure ALL fruits are FULLY visible within the frame, nothing cut off at edges
- A black rounded "NEW" badge/label in the top-left corner
- Professional product photography lighting with soft shadows
- The can must preserve its EXACT design, colors, text and branding from image 2
- Same scale and framing as the reference — the can should be the SAME size relative to frame

CRITICAL: Square 1:1 aspect ratio. All elements fully within frame. Nothing cropped at edges."""

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": reference_b64
                    }
                },
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": can_b64
                    }
                }
            ]
        }],
        "generationConfig": {
            "responseModalities": ["TEXT", "IMAGE"],
            "temperature": 0.4,
        }
    }

    print(f"  Generating {product_name}...")
    resp = requests.post(URL, json=payload, headers={"Content-Type": "application/json"}, timeout=120)

    if resp.status_code != 200:
        print(f"  ERROR {resp.status_code}: {resp.text[:500]}")
        return False

    data = resp.json()

    # Extract image from response
    candidates = data.get("candidates", [])
    if not candidates:
        print(f"  ERROR: No candidates returned")
        print(f"  Response: {json.dumps(data, indent=2)[:1000]}")
        return False

    parts = candidates[0].get("content", {}).get("parts", [])

    for part in parts:
        if "inlineData" in part:
            img_data = base64.b64decode(part["inlineData"]["data"])
            with open(output_path, "wb") as f:
                f.write(img_data)
            size_kb = len(img_data) / 1024
            print(f"  Saved: {output_path} ({size_kb:.0f} KB)")
            return True
        elif "text" in part:
            print(f"  Model text: {part['text'][:200]}")

    print(f"  ERROR: No image in response")
    return False


def main():
    print("Loading reference image (green/lemongrass)...")
    ref_path = os.path.join(IMAGES_DIR, "bubbles-lemongrass-ginger-green-tea-single.jpg")
    ref_b64 = load_image_b64(ref_path)

    products = [
        {
            "name": "Dragon Fruit",
            "file": "dragon-fruit-single.jpg",
            "output": "dragon-fruit-single-styled.jpg",
            "fruits": "dragon fruit (pitaya) slices showing the white flesh with black seeds, and some small pink dragon fruit pieces"
        },
        {
            "name": "Lychee & Blueberry",
            "file": "lychee-blueberry-single.jpg",
            "output": "lychee-blueberry-single-styled.jpg",
            "fruits": "fresh lychee fruits (some peeled showing translucent white flesh) and scattered blueberries"
        }
    ]

    for p in products:
        can_path = os.path.join(IMAGES_DIR, p["file"])
        out_path = os.path.join(IMAGES_DIR, p["output"])

        print(f"\nProcessing: {p['name']}")
        can_b64 = load_image_b64(can_path)

        success = generate_styled_photo(ref_b64, can_b64, p["name"], p["fruits"], out_path)
        if not success:
            print(f"  FAILED for {p['name']}")

    print("\nDone!")


if __name__ == "__main__":
    main()
