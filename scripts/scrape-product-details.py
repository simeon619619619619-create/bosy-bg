#!/usr/bin/env python3
"""
Scrape detailed product information from ALL products on bosy.bg.
Uses urllib + regex. Rate limited to 1 req/sec.

Page structure (Elementor):
- Desktop product info (title, subtitle, badges, short desc) — first ~45% of HTML
- Mobile duplicate of the above — ~45-65%
- Why section, Ingredients, Nutrition, Related products — ~65-87% (NOT duplicated)
- Footer — ~87%+

We use deduplicated text-widgets for title/subtitle/badges/short_desc,
and search the FULL page for why/ingredients/nutrition/related sections.
"""

import urllib.request
import urllib.parse
import re
import json
import time
import html as html_mod
import xml.etree.ElementTree as ET
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'bg,en;q=0.9',
}

OUTPUT_PATH = '/Users/Sim/Desktop/проекти/bosy-clone/scripts/product-details.json'


def fetch_url(url):
    req = urllib.request.Request(url, headers=HEADERS)
    resp = urllib.request.urlopen(req, context=ctx)
    return resp.read().decode('utf-8', errors='replace')


def get_product_urls():
    xml_content = fetch_url('https://bosy.bg/product-sitemap.xml')
    root = ET.fromstring(xml_content)
    ns = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    products = []
    for url_elem in root.findall('ns:url', ns):
        loc = url_elem.find('ns:loc', ns).text
        if '/product/' in loc:
            slug = urllib.parse.unquote(loc.rstrip('/').split('/')[-1])
            products.append((slug, loc))
    return products


def strip_tags(s):
    if not s:
        return ''
    s = re.sub(r'<br\s*/?>', ' ', s)
    s = re.sub(r'<[^>]+>', '', s)
    s = html_mod.unescape(s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def get_text_widgets_unique(page_html):
    """Extract unique elementor text-editor widgets as (data-id, raw_html) pairs.
    The page has desktop+mobile duplicates with DIFFERENT data-ids but same content.
    We deduplicate by text content (keep first occurrence)."""
    pattern = r'<div[^>]*elementor-widget-text-editor[^>]*data-id="([^"]+)"[^>]*>\s*<div[^>]*elementor-widget-container[^>]*>(.*?)</div>\s*</div>'
    all_matches = re.findall(pattern, page_html, re.DOTALL)

    seen_texts = set()
    unique = []
    for wid, content in all_matches:
        text = strip_tags(content).strip()
        # Normalize for dedup: lowercase, remove extra spaces
        norm = re.sub(r'\s+', '', text.lower())
        if norm and norm not in seen_texts:
            seen_texts.add(norm)
            unique.append((wid, text, content))
        elif not norm:
            # Empty widget, skip
            pass
    return unique


def parse_product_page(page_html, slug):
    result = {
        'subtitle': '',
        'badges': [],
        'short_description': '',
        'why_title': '',
        'why_items': [],
        'ingredients': '',
        'nutrition_image': '',
        'shelf_life': '',
        'related_slugs': [],
    }

    widgets = get_text_widgets_unique(page_html)

    # OG title
    og_match = re.search(r'<meta property="og:title" content="([^"]+)"', page_html)
    og_title = html_mod.unescape(og_match.group(1)).replace(' - Bosy Healthy', '').strip() if og_match else ''

    # Find the product name widget
    name_idx = -1
    for i, (wid, text, raw) in enumerate(widgets):
        if og_title and og_title.lower().replace(' ', '') in text.lower().replace(' ', ''):
            name_idx = i
            break
    if name_idx < 0:
        name_idx = 0

    # === SUBTITLE ===
    if name_idx + 1 < len(widgets):
        candidate = widgets[name_idx + 1][1]
        if candidate and not candidate.startswith('€') and not candidate.startswith('Безплатна') and len(candidate) < 200:
            result['subtitle'] = candidate

    # === BADGES ===
    badge_start = name_idx + 2
    badges = []
    short_desc_idx = -1

    for i in range(badge_start, len(widgets)):
        text = widgets[i][1]
        if not text:
            continue
        if len(text) > 50:
            short_desc_idx = i
            break
        if len(text) < 50 and not text.startswith('€'):
            badges.append(text)

    result['badges'] = badges

    # === SHORT DESCRIPTION ===
    if short_desc_idx >= 0:
        result['short_description'] = widgets[short_desc_idx][1]

    # === WHY SECTION (search full page) ===
    # Find "Защо" heading
    why_heading_match = re.search(r'<(?:b|strong)>(Защо[^<]*)</(?:b|strong)>', page_html, re.IGNORECASE)
    if why_heading_match:
        result['why_title'] = strip_tags(why_heading_match.group(1))

    # Extract checkmark items: ✓ followed by <b>Title</b> and description
    first_checkmark = page_html.find('✓')
    if first_checkmark >= 0:
        # Find end of checkmark section
        section_end = len(page_html)
        for marker in ['Състав', 'КОМБИНИРАЙ', 'Комбинирай с']:
            pos = page_html.find(marker, first_checkmark)
            if 0 < pos < section_end:
                section_end = pos

        checkmark_html = page_html[first_checkmark:section_end]
        parts = re.split(r'✓\s*', checkmark_html)

        for part in parts:
            part = part.strip()
            if not part or len(strip_tags(part)) < 10:
                continue
            # Extract <b>Title</b></p><p>Description
            bold_match = re.search(
                r'<(?:b|strong)>\s*(.*?)\s*</(?:b|strong)>\s*</p>\s*<p[^>]*>\s*(?:<span[^>]*>)?\s*(.*?)(?:</span>)?\s*</p>',
                part, re.DOTALL
            )
            if bold_match:
                title = strip_tags(bold_match.group(1)).strip()
                desc = strip_tags(bold_match.group(2)).strip()
                if title:
                    result['why_items'].append({'title': title, 'description': desc})
            else:
                # Try simpler bold match: <b>Title</b>DescriptionText
                # Skip empty bold tags by finding the LAST non-empty <b>...</b>
                bold_matches = re.findall(r'<(?:b|strong)>([^<]+)</(?:b|strong)>', part)
                non_empty_bold = [b.strip() for b in bold_matches if b.strip()]
                if non_empty_bold:
                    title = non_empty_bold[0]
                    # Description is everything after the title's closing tag
                    title_end = part.find(title) + len(title)
                    desc = strip_tags(part[title_end:]).strip()
                    # Clean price/currency text that may leak in
                    desc = re.split(r'€\d', desc)[0].strip()
                    if title and len(title) > 3:
                        result['why_items'].append({'title': title, 'description': desc})
                else:
                    full = strip_tags(part).strip()
                    if full and len(full) > 10:
                        sentences = re.split(r'(?<=[\.\!]) (?=[А-ЯA-Z])', full, maxsplit=1)
                        result['why_items'].append({
                            'title': sentences[0],
                            'description': sentences[1] if len(sentences) > 1 else ''
                        })

    # Alternative: "Описание" section with bold items (balls products)
    if not result['why_items']:
        for i, (wid, text, raw) in enumerate(widgets):
            if text.strip() == 'Описание' and i + 1 < len(widgets):
                desc_raw = widgets[i + 1][2]
                bold_items = re.findall(
                    r'<(?:b|strong)>([^<]+)</(?:b|strong)>\s*</p>\s*<p[^>]*>(.*?)(?=<(?:b|strong)>|</div>)',
                    desc_raw, re.DOTALL
                )
                if bold_items:
                    result['why_title'] = 'Описание'
                    for title_raw, desc_raw_item in bold_items:
                        title = strip_tags(title_raw).strip()
                        desc = strip_tags(desc_raw_item).strip()
                        if title:
                            result['why_items'].append({'title': title, 'description': desc})
                break

    # === INGREDIENTS (search full page) ===
    # Pattern 1: "Състав" as a separate heading widget, content in next widget
    for i, (wid, text, raw) in enumerate(widgets):
        if text.strip() == 'Състав' and i + 1 < len(widgets):
            ing_text = widgets[i + 1][1]
            result['ingredients'] = re.split(
                r'(?:\*\s*Да се съхранява|\*Да се съхранява|Може да съдържа|Алергени)',
                ing_text
            )[0].strip()
            break

    # Pattern 2: "Състав" as bold text in raw HTML followed by content in next widget
    if not result['ingredients']:
        m = re.search(
            r'<b>Състав</b>\s*</p>\s*</div>\s*</div>\s*'
            r'<div[^>]*elementor-widget-text-editor[^>]*>\s*'
            r'<div[^>]*elementor-widget-container[^>]*>(.*?)</div>\s*</div>',
            page_html, re.DOTALL
        )
        if m:
            ing_text = strip_tags(m.group(1))
            result['ingredients'] = re.split(
                r'(?:\*\s*Да се|\*Да се|Може да съдържа|Алергени)',
                ing_text
            )[0].strip()

    # Pattern 3: inline "Състав" followed by text in same widget
    if not result['ingredients']:
        for wid, text, raw in widgets:
            if 'Състав' in text and len(text) > 20:
                after = re.sub(r'^.*?Състав\s*:?\s*', '', text).strip()
                cleaned = re.split(r'(?:\*\s*Да се|Може да съдържа|Алергени)', after)[0].strip()
                if cleaned and len(cleaned) > 15:
                    result['ingredients'] = cleaned
                    break

    # === NUTRITION IMAGE (search full page) ===
    all_imgs = re.findall(r'<img[^>]*src="([^"]+)"[^>]*>', page_html)
    seen_urls = set()
    for img_url in all_imgs:
        if img_url in seen_urls:
            continue
        seen_urls.add(img_url)
        lower = img_url.lower()
        if any(kw in lower for kw in ['nutri', 'info-710', 'info-1024', 'facts', 'nutrients-table']):
            if not any(skip in lower for skip in ['icon', 'logo', 'badge', '-512.', 'sugar-free', 'gluten-free']):
                result['nutrition_image'] = img_url
                break

    # === SHELF LIFE ===
    # JS uses unicode escapes like \u0411 - need to decode them
    exp_match = re.search(r'expirationDates\s*=\s*\[(.*?)\]', page_html, re.DOTALL)
    if exp_match:
        raw_dates = re.findall(r'"((?:[^"\\]|\\.)*)"', exp_match.group(1))
        dates = []
        for d in raw_dates:
            try:
                dates.append(d.encode('utf-8').decode('unicode_escape'))
            except Exception:
                dates.append(d)
        # Try to find dates relevant to this product
        slug_lower = slug.lower().replace('-', ' ')
        slug_words = [w for w in slug_lower.split() if len(w) > 2]
        relevant = [d for d in dates if any(w in d.lower() for w in slug_words)]
        result['shelf_life'] = '; '.join(relevant) if relevant else '; '.join(dates)

    if not result['shelf_life']:
        m = re.search(
            r'Срок на годност[^<]*(?:<[^>]*>)*\s*(?:до:?)?\s*(?:<[^>]*>)*\s*(\d{2}[./]\d{2}[./]\d{4})',
            page_html, re.DOTALL
        )
        if m:
            result['shelf_life'] = m.group(1)

    # === RELATED PRODUCTS (search full page) ===
    combine_positions = [m.start() for m in re.finditer(r'Комбинирай с', page_html, re.IGNORECASE)]
    if combine_positions:
        start = combine_positions[0]
        # End: second "Комбинирай с" (mobile dupe) or footer
        if len(combine_positions) > 1:
            end = combine_positions[1]
        else:
            footer_pos = page_html.find('BosyKitchen.com', start)
            end = footer_pos if footer_pos > 0 else start + 15000

        section = page_html[start:end]
        links = re.findall(r'href="https?://bosy\.bg/product/([^/"]+)/?["\']', section)
        seen = set()
        related = []
        for link in links:
            decoded = urllib.parse.unquote(link)
            if decoded not in seen and decoded != slug:
                seen.add(decoded)
                related.append(decoded)
        result['related_slugs'] = related

    return result, og_title


def main():
    print("Fetching product sitemap...")
    products = get_product_urls()
    print(f"Found {len(products)} products\n")

    all_data = {}

    for i, (slug, url) in enumerate(products):
        print(f"[{i+1}/{len(products)}] {slug}")

        try:
            page_html = fetch_url(url)
            data, title = parse_product_page(page_html, slug)

            print(f"  Title: {title}")
            print(f"  Subtitle: {data['subtitle'][:80]}" if data['subtitle'] else "  Subtitle: -")
            print(f"  Badges({len(data['badges'])}): {data['badges']}" if data['badges'] else "  Badges: -")
            print(f"  Short desc: {len(data['short_description'])} chars")
            print(f"  Why: \"{data['why_title'][:50]}\" ({len(data['why_items'])} items)")
            for item in data['why_items'][:2]:
                print(f"    - {item['title'][:70]}")
            print(f"  Ingredients: {len(data['ingredients'])} chars")
            print(f"  Nutrition img: {'Yes' if data['nutrition_image'] else 'No'}")
            print(f"  Shelf life: {data['shelf_life'][:60]}" if data['shelf_life'] else "  Shelf life: -")
            print(f"  Related({len(data['related_slugs'])}): {data['related_slugs'][:4]}")
            print()

            all_data[slug] = data

        except Exception as e:
            print(f"  ERROR: {e}\n")
            import traceback
            traceback.print_exc()
            all_data[slug] = {'error': str(e)}

        if i < len(products) - 1:
            time.sleep(1)

    # Save
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"{'='*60}")
    print(f"Saved {len(all_data)} products to {OUTPUT_PATH}")

    ok = [d for d in all_data.values() if 'error' not in d]
    print(f"\nStats for {len(ok)} successful products:")
    print(f"  With subtitle: {sum(1 for d in ok if d.get('subtitle'))}")
    print(f"  With badges: {sum(1 for d in ok if d.get('badges'))}")
    print(f"  Total badges: {sum(len(d.get('badges', [])) for d in ok)}")
    print(f"  With short_description: {sum(1 for d in ok if d.get('short_description'))}")
    print(f"  With why_items: {sum(1 for d in ok if d.get('why_items'))}")
    print(f"  Total why_items: {sum(len(d.get('why_items', [])) for d in ok)}")
    print(f"  With ingredients: {sum(1 for d in ok if d.get('ingredients'))}")
    print(f"  With nutrition_image: {sum(1 for d in ok if d.get('nutrition_image'))}")
    print(f"  With shelf_life: {sum(1 for d in ok if d.get('shelf_life'))}")
    print(f"  With related_slugs: {sum(1 for d in ok if d.get('related_slugs'))}")


if __name__ == '__main__':
    main()
