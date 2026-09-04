# KK Sports Portal Design System

## 1. Brand Translation

Use the KK Sports storefront as a brand source, not as an application template.

Carry into the portal:

- black, white, and warm gold;
- confident, compact typography;
- clear product imagery;
- direct category and product language;
- the established KK Sports logo;
- the brand's sports and fitness breadth.

Do not carry into the portal:

- ecommerce announcement bars;
- promotional carousels;
- oversized marketing banners inside authenticated pages;
- dense category navigation;
- sale labels used as decoration;
- lifestyle photography behind functional data.

## 2. Color Tokens

The supplied palette must be normalized because `--black` is declared three times. Preserve all supplied values under meaningful names.

```css
:root {
  --kk-canvas: 0 0% 97%;             /* #F8F8F8 */
  --kk-surface: 0 0% 100%;           /* #FFFFFF */
  --kk-ink: 240 22% 7%;              /* #0E0E16 */
  --kk-black: 30 50% 1%;             /* #030201 */
  --kk-gold: 42 79% 47%;              /* #D8A018 */
  --kk-gold-hover: 42 86% 40%;
  --kk-gold-soft: 42 75% 94%;
  --kk-teal: 179 32% 57%;             /* #70B4B3 */
  --kk-teal-deep: 171 34% 15%;        /* #1A3531 */
  --kk-slate: 232 17% 39%;            /* #525874 */
  --kk-blue: 224 61% 30%;             /* #1E377B */
  --kk-border: 220 13% 88%;
  --kk-muted: 220 9% 46%;
}
```

Recommended application mapping:

| Role | Token | Use |
| --- | --- | --- |
| Canvas | `--kk-canvas` | Main page background |
| Surface | `--kk-surface` | Panels, tables, dialogs, inputs |
| Primary text | `--kk-ink` | Headings, values, body text |
| Navigation | `--kk-black` | Sidebar and branded system pages |
| Primary action | `--kk-gold` | Main buttons, active nav marker, focus accent |
| Supporting accent | `--kk-teal` | Charts and neutral-positive data visualization |
| Brand dark support | `--kk-teal-deep` | Login image overlay, selected chart series |
| Informational | `--kk-blue` | Links and informational states only |

Semantic tokens must remain separate from brand tokens:

- success: `#15803D` on `#F0FDF4`;
- warning: `#B45309` on `#FFFBEB`;
- danger: `#B91C1C` on `#FEF2F2`;
- info: `#1D4ED8` on `#EFF6FF`.

Never use gold for warning status. A gold button means a KK Sports action; amber means attention is required.

## 3. Typography

Keep Inter as the application typeface. It is already loaded, renders numbers well, and avoids adding a second dependency. The storefront's confidence should be expressed through weight and hierarchy, not a display font.

Use this scale:

| Style | Desktop | Mobile | Weight | Line height |
| --- | --- | --- | --- | --- |
| Page title | 24px | 22px | 650/700 | 30px |
| Section title | 16px | 16px | 600 | 24px |
| Card/row title | 14px | 14px | 600 | 20px |
| Body | 14px | 14px | 400 | 21px |
| Secondary | 12px | 12px | 400/500 | 18px |
| Label | 12px | 12px | 600 | 16px |
| Micro label | 10px | 10px | 600 | 14px |
| KPI value | 28px | 24px | 700 | 32px |

Rules:

- Use `letter-spacing: 0` for body, headings, buttons, and navigation.
- Micro labels and table headers may use `0.04em`, never wide tracking.
- Use tabular numbers for prices, IDs, dates, totals, and chart axes.
- Avoid 30px+ headings inside the authenticated portal.
- Use `PKR 12,500`, consistently, rather than mixing `Rs.`, `PKR`, and currency placement.

## 4. Spacing, Radius, and Elevation

Base spacing unit: 4px.

- Page gutters: 20px tablet, 24px desktop, 16px mobile.
- Main content maximum: 1480px.
- Page section gap: 24px desktop, 20px mobile.
- Panel padding: 20px desktop, 16px mobile.
- Form row gap: 16px.
- Dense table row: 52-60px.
- Standard control height: 40px; compact control: 36px; mobile control: at least 44px.

Radius:

- controls: 6px;
- panels and cards: 8px;
- dialogs: 8px;
- badges: full pill only for statuses and short taxonomy labels;
- do not use 12-16px rounding throughout the interface.

Elevation:

- default panels use a border and no shadow;
- sticky or floating surfaces use one subtle shadow;
- hover states should change border/background before adding elevation;
- no glowing, colored, or layered shadows.

## 5. Application Shell

### Sidebar

- Desktop width: 232px, fixed within the viewport.
- Background: `--kk-black`.
- Use `kk_logo.png` inside a compact white logo stage on the dark sidebar because the wordmark contains black artwork. Display the source at approximately 44px high, preserve its aspect ratio, and pair it with live text rather than relying on tiny raster lettering.
- Brand copy: `KK Sports` with secondary label `Operations Portal`.
- Active item: dark raised row, 3px gold left indicator, white icon/text.
- Inactive items: muted white; hover to white on a subtle surface.
- Group label: `Workspace`.
- User profile belongs at the bottom above sign out; do not duplicate a large profile card near the logo.
- Maintain role-based navigation exactly as it works now.

### Header

- Height: 64px desktop, 56px mobile.
- White surface with a bottom border; no blur required.
- Left: mobile menu or compact breadcrumb.
- Right: page-level optional quick action, network/access status, and account menu.
- Remove the repeated `InventoryOS` eyebrow.
- Do not repeat the page title here when the page already has a full heading.

### Main Content

- Canvas: flat `--kk-canvas`; remove the blue radial background.
- Use `max-width: 1480px` and compact top padding.
- At 1440px desktop, the shell should show useful content without browser zoom changes.

## 6. Core Components

### Page Header

One unframed row containing:

- title and one-line description;
- optional count or small status summary;
- secondary actions;
- one gold primary action.

Remove decorative icon boxes from standard page headers. Icons may remain in navigation and actions.

### Buttons

- Primary: gold background, black text, 40px height, semibold.
- Secondary: white background, neutral border, ink text.
- Ghost: transparent; used for row and toolbar actions.
- Destructive: red, shown only at the point of confirmation.
- Icon-only: 36-40px square with tooltip and accessible label.
- Avoid giving Edit, View, and Delete three different decorative colors.
- Use one primary button per local action group.

### Inputs

- 40px high, 6px radius, neutral border, white surface.
- Labels sit above controls and remain visible; placeholders are examples, not labels.
- Gold focus ring with sufficient contrast.
- Validation appears under the field and does not move unrelated sections.
- Required fields use text or an asterisk, not color alone.

### Toolbars

- Use one compact surface for search, filters, sort, result count, and view mode.
- Search should take the remaining width.
- Filters use labeled selects on desktop and a filter sheet on small mobile screens.
- Active filters use removable chips only when filters are active.
- Refresh/export are icon buttons with tooltips where the label is obvious from context.

### Data Tables and Lists

Desktop default for products, quotations, users, logs, and stock exceptions:

- clear header row;
- 52-60px records;
- 40-48px thumbnails where relevant;
- primary text and secondary metadata in one cell;
- status near the relevant field;
- actions in a final column using a menu or a primary direct action plus menu;
- sticky table header for long lists;
- full-row hover and keyboard focus;
- pagination or progressive loading when data volume grows.

Mobile default:

- compact record cards with the same content order as the table;
- actions in a bottom row or overflow menu;
- no horizontal page overflow;
- no desktop table squeezed into the viewport.

### Status Badges

Use the same status component everywhere:

- 24px height maximum;
- optional 6px status dot;
- sentence case;
- no shadow;
- semantic background, border, and text;
- never use a brand color to imply status.

### Panels

Panels group related work, not every paragraph. A panel has an optional compact header, body, and footer. Avoid nested panels and cards inside cards.

### Dialogs and Drawers

- Product details: 880px dialog desktop, full-height drawer mobile.
- Quotation details: large 1040px dialog or dedicated route; sticky action header.
- Destructive confirmation: 440px alert dialog.
- Modal title bar contains title and close only. Put primary actions in a footer or a stable action row.
- Never put six equal-weight buttons in a dialog title.

### Loading, Empty, and Error States

- Skeletons must match the final geometry.
- Empty states use a 32px line icon, concise title, one sentence, and at most one action.
- Do not use large circular icon blobs.
- Errors stay inside the affected surface and include a retry action when possible.

## 7. Dashboard Visualization

- Use gold for the primary commercial series and teal for the secondary series.
- Revenue and order count should not share an unlabeled axis when their scales differ. Use a toggle, separate axes, or separate compact charts.
- KPI cards use one neutral style; semantic status is shown through a small icon/badge, not four unrelated accent strips.
- Tooltips use exact values and `PKR` formatting.
- Charts require visible labels, keyboard-readable summaries, and empty-state copy.

## 8. Imagery and Asset Direction

### Existing Brand Assets

- `public/kk_logo.png`: transparent primary logo. On dark surfaces, place it on a compact white stage so the black wordmark remains legible.
- `public/kk_logo_white_bg.png`: use only when a white raster background is appropriate. Do not place this version in a dark sidebar.

Before implementation, create optimized derivatives rather than loading the source at full resolution:

- `kk-logo-sidebar.webp`: transparent, about 320px wide, 2x display size;
- `kk-logo-print.png`: white-background or transparent high-resolution print version;
- `kk-logo-favicon.png`: simplified mark if the existing file remains legible at 32px.

### Login Image

Use one authentic, full-bleed athletic photograph with a clear subject and enough negative space for a short brand statement. Preferred subjects, in order:

1. cricket training or equipment in use;
2. gym/fitness training;
3. racket sport action;
4. a mixed equipment wall or store environment.

Do not use the swimming hero from the current storefront screenshot simply because it is prominent; it is seasonal and can date the operations portal. Do not hotlink Shopify CDN images in production. Obtain approval, download a KK-owned source asset, optimize it locally, and record the origin.

The live site currently exposes suitable owned imagery including gym, swimming, boxing, fitness, men's and women's sportswear, and product photography. A known gym candidate is the store asset named `low-angle-view-unrecognizable-muscular-build-man-preparing-lifting-barbell-health-club_637285-2497.avif`. Use it only after ownership and crop approval.

If no owned image is suitable, generate a new image with this art direction:

> Editorial sports retail operations photograph, Pakistani sports store environment, cricket bats, balls, fitness equipment and rackets arranged in a premium dark retail space, one staff member checking stock on a tablet, realistic commercial photography, black and warm gold accents, natural directional light, clean negative space on the left, no visible third-party logos, no text, no watermark, 16:10 landscape.

### Product Images

- Use `object-fit: contain` on a neutral image stage for catalog products unless the source is clearly lifestyle photography.
- Show a 48px thumbnail in desktop rows and 96-120px image in mobile cards.
- Reserve large galleries for the product detail dialog.
- Missing images use a neutral package placeholder plus `No image`, not decorative illustrations.

## 9. Content Language

Replace product-generic language with KK Sports language:

- `InventoryOS` -> `KK Sports Operations`;
- `Commerce operations` -> `Inventory & Quotations`;
- `Workspace` -> `Operations portal` where context is needed;
- `Product catalog` remains valid;
- `Stock exceptions` remains valid and is preferable to `Out of stock` as the page title;
- `Sales Rider` remains the human-readable role;
- `Product Manager` remains the human-readable role.

Sign-in copy:

- heading: `Sign in to KK Sports`;
- supporting line: `Access inventory, quotations, and team operations.`;
- security note: `Authorized KK Sports personnel only.`

Remove demo-account cards from production. If development autofill is required, gate it behind a development-only flag and place it in a compact `Development access` disclosure.

## 10. Responsive and Anti-Zoom Rules

Breakpoints:

- compact mobile: 320-479px;
- mobile: 480-767px;
- tablet: 768-1023px;
- desktop: 1024-1439px;
- wide desktop: 1440px and above.

Rules that specifically prevent the zoomed-in feeling:

- Sidebar 232px, not wider than 252px.
- Desktop page title no larger than 24px.
- Body and controls remain 14px; do not scale fonts with viewport width.
- Main content uses 24px gutters, not 40px on ordinary desktop.
- Product media never defaults to 192px high in a desktop operations list.
- Use four KPI columns only when each remains at least 220px wide.
- Use 2-column form layouts where fields are related; keep long text fields full width.
- Limit primary form width to 1040px and avoid full-viewport stretched fields.
- Keep iOS form control text at 16px on small screens to prevent browser input zoom.
- Test 100%, 125%, and 200% browser zoom without clipped actions or overlapping text.

## 11. Accessibility

- Meet WCAG 2.2 AA contrast for text and controls.
- Keep visible focus on all interactive elements.
- Every icon-only button needs an accessible name and tooltip.
- Status must not rely on color alone.
- Dialogs need correct title/description relationships and reliable focus return.
- Table actions and sortable headers must be keyboard accessible.
- Respect reduced motion; transitions should be 120-180ms and functional.
- Product images need useful alt text; decorative login imagery uses empty alt text.
- Maintain 44px mobile touch targets.
- Public quotation and printed/PDF quotation must remain readable in grayscale.
