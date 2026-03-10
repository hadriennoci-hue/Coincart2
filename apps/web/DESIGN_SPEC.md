# Coincart Design Specification

## Brand
Electronics marketplace (Laptops, Predator/ACER, E-Bikes, Headphones).
Pay with crypto — EU only, DHL shipping.

---

## Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#0F172A` | Page background |
| `--surface` | `#1E293B` | Cards, surfaces |
| `--surface-2` | `#263348` | Hover surface |
| `--border` | `#374151` | All borders |
| `--border-2` | `#4B5563` | Active/focus borders |
| `--text` | `#FFFFFF` | Primary text |
| `--muted` | `#9CA3AF` | Secondary text |
| `--muted-2` | `#6B7280` | Placeholder text |
| `--primary` | `#0F766E` | Teal — brand primary |
| `--primary-hover` | `#0e8a80` | Teal hover |
| `--accent` | `#22C55E` | Green — CTAs |
| `--accent-hover` | `#16A34A` | Green hover |
| `--error` | `#EF4444` | Error states |
| `--warning` | `#F59E0B` | Warning badges |

---

## Typography

Font: **Inter** (Google Fonts, weights 400/500/600/700/800)

| Role | Size | Weight |
|------|------|--------|
| Hero title | 48px | 800 |
| Page title | 36px | 700 |
| Section title | 28px | 700 |
| Card title | 18px | 600 |
| Body | 14px | 400 |
| Caption | 12px | 400–500 |

---

## Spacing & Radius

- Container max-width: **1200px**
- Narrow max-width: **800px**
- Section padding (y): **64px top / 64px bottom** (`--section-py: 64px`)
- Card padding: **24px**
- Card radius: **12px**
- Button radius: **8–10px**
- Input radius: **8px**
- Gap (grid): **20px**

---

## Components

### Navbar (`SiteHeader`)
- Full-width, sticky top, `background: var(--surface)`, `border-bottom: 1px solid var(--border)`
- Height: 64px
- Left: Logo (teal icon + "Coincart" text)
- Center: Search bar (flex 1, max 560px)
- Right: Cart badge + Account link

### Footer
- Full-width, `background: var(--surface)`, `border-top: 1px solid var(--border)`
- Three columns: Brand, Navigation links, Legal
- Bottom bar: copyright + BTCPay notice

### ProductCard
- Surface card, `border: 1px solid var(--border)`
- Product image (16:10 ratio)
- Badge (category/featured)
- Product name (18px 600)
- Short specs (14px muted)
- Price (18px 700 white) + "Add to Cart" (green button)

### Buttons
- `.btn-primary` — green (`var(--accent)`), used for primary CTAs
- `.btn-teal` — teal (`var(--primary)`), used for secondary actions
- `.btn-ghost` — transparent with border, used for tertiary actions
- `.btn-danger` — red, used for destructive actions

### Inputs / Form
- Background: `var(--surface)`, border: `var(--border)`, radius 8px
- Height: 44px
- Focus: border `var(--primary)`
- Label: 12px muted, 500 weight

### Badges
- `.badge-teal` — teal background
- `.badge-green` — green background
- `.badge-gray` — gray border
- `.badge-warning` — amber

---

## Page Layouts

### Home
- Hero: full-width gradient banner with featured product
- Trust bar: 4 stat cards
- Categories: 4+ category cards with icon
- Promo banner: full-width teal gradient
- Filters: collapsible form
- Product grid: 4 columns

### Product Detail
- Two columns: image (left 55%) / info panel (right 45%)
- Specs table below
- Add to cart button (green, full-width)

### Cart
- Two columns: items list (left, 60%) / order summary (right, 40%)

### Checkout
- Two columns: form (left, 60%) / summary (right, 40%)
- Guest checkout only
- BTCPay redirect

### Order Confirmation
- Single column centered
- Status badge
- Items list + totals
- BTCPay checkout button

### Contact
- Two columns: info cards (left, 35%) / form (right, 65%)

### Legal Pages (FAQ, Privacy, Terms, Shipping)
- Narrow content (max 800px), centered
- Hero section
- Sectioned cards

---

## Design Tokens CSS Variables (globals.css)

```css
:root {
  --bg: #0F172A;
  --surface: #1E293B;
  --surface-2: #263348;
  --border: #374151;
  --border-2: #4B5563;
  --text: #FFFFFF;
  --muted: #9CA3AF;
  --muted-2: #6B7280;
  --primary: #0F766E;
  --primary-hover: #0e8a80;
  --accent: #22C55E;
  --accent-hover: #16A34A;
  --error: #EF4444;
  --warning: #F59E0B;
  --font: var(--font-inter), 'Segoe UI', system-ui, sans-serif;
}
```
