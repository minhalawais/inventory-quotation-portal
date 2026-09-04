# Implementation Plan and Acceptance Criteria

## Scope Boundary

This redesign is a UI refactor. It must not silently change authorization, API contracts, database schema, quotation calculations, status side effects, or upload behavior. Any behavior correction discovered during implementation should be tracked separately.

## Component Strategy

Create or normalize these shared components before changing individual pages:

| Shared component | Replaces or consolidates |
| --- | --- |
| `KKSportsLogo` | Generic `BrandMark`, direct logo usage |
| `AppShell` | Current sidebar/header composition |
| `PageHeader` | Current `PageHeading` plus duplicate header titles |
| `Toolbar` | Product, stock, quotation, user, and log filter surfaces |
| `DataTable` / `ResponsiveRecordList` | Page-specific desktop cards and lists |
| `StatusBadge` | Repeated inline status maps and pill classes |
| `Metric` / `MetricGrid` | Dashboard and stock stat cards |
| `Panel` | `card-modern`, `surface-panel`, raw bordered cards |
| `FormSection` | Repeated form Card sections and custom headings |
| `FormActions` | Repeated Cancel/Submit layouts |
| `EmptyState` | Page-specific dashed empty cards |
| `ErrorState` | Page-specific fetch failure UI |
| `RecordActions` | Repeated View/Edit/Delete/share button groups |
| `ProductThumb` | Repeated image path fallback and image stage styling |
| `QuotationDocument` | Public view, preview, view modal, print/PDF hierarchy |
| `SystemStatePage` | Inactive, restricted, and route loading states |

Use existing Radix/shadcn primitives and Lucide icons. Do not introduce a second component library.

## CSS and Token Work

1. Normalize the supplied palette into uniquely named KK tokens.
2. Remap shadcn variables in `app/globals.css` to KK surfaces and brand colors.
3. Remove the blue background graphic, negative letter spacing, and generic InventoryOS helper classes.
4. Establish one radius, shadow, focus, table, form, and status system.
5. Replace inline `style` shadows and one-off colors with tokens or component variants.
6. Keep semantic colors separate from the KK gold brand accent.

Do not import `colorize.design-kksports.com.pk-palette.css` directly until its duplicate variable names are fixed or mapped. The raw file's final `--black` declaration currently overrides the first two.

## Recommended Delivery Phases

### Phase 1: Foundation

- Brand assets and optimized logo derivatives.
- Global tokens, typography, spacing, focus, and elevation.
- Button, input, badge, panel, table, dialog, empty, error, and loading primitives.
- Story/demo route or isolated states for visual QA.

Exit condition: shared components render consistently at mobile and desktop widths with keyboard focus and semantic states.

### Phase 2: Shell and Authentication

- Sidebar, header, account menu, mobile navigation.
- Sign-in page and approved sports image.
- Inactive, restricted, and loading routes.
- Replace all InventoryOS naming.

Exit condition: every role sees the same branded shell and correct navigation; authentication flows behave exactly as before.

### Phase 3: High-Frequency Operations

- Products list and filters.
- Product add/edit and detail dialog.
- Stock exceptions bulk workflow.

Exit condition: product and stock tasks are denser on desktop, touch-safe on mobile, and all current actions/uploads work.

### Phase 4: Quotations

- Quotation list and actions.
- Quote builder.
- Authenticated detail/preview.
- Public quotation and PDF/print styling.

Exit condition: document presentation is consistent across screen, public link, print, and PDF; create/share/download/status behavior remains intact.

### Phase 5: Administration and Dashboard

- Dashboard metrics/charts/recents.
- User list and editors, including IP access.
- Activity log table and export controls.

Exit condition: manager workflows use the same table, toolbar, status, and form patterns as catalog and quotations.

### Phase 6: Hardening

- Cross-role regression testing.
- Responsive and zoom testing.
- Accessibility audit.
- Visual regression screenshots.
- Performance and image optimization.
- Remove obsolete classes and dead UI variants after route migration.

## Asset Workflow

1. Inventory candidate KK-owned images from the website or original media library.
2. Record source URL, owner/approval, intended use, crop, and license status.
3. Prefer original assets from KK Sports over scraped responsive derivatives.
4. Optimize locally to AVIF/WebP with a JPEG fallback only where required.
5. Provide 1x and 2x responsive sizes; do not ship a full storefront hero for a 400px panel.
6. Use generated imagery only if no owned image meets the login brief.
7. Store generated prompt, date, model, and approval note beside the asset manifest.
8. Never hotlink external storefront/CDN images in the production portal.

Suggested asset manifest fields:

```text
file, source, owner, approval, route, crop, dimensions, format, alt, notes
```

## Functional Regression Matrix

Test each role independently.

| Workflow | Manager | Rider | Product Manager |
| --- | --- | --- | --- |
| Dashboard | Full | Redirected/hidden | Redirected/hidden |
| View products | Yes | Yes | Yes |
| Add/edit products | Yes | No | Yes |
| Delete products | Yes | No | Existing behavior only |
| Edit stock exceptions | Existing manager behavior | Read-only | Preserve existing behavior |
| View/create quotations | Yes | Yes, own scope | Hidden |
| Update/share/download quotations | Preserve existing behavior | Preserve existing behavior | Hidden |
| Manage users and logs | Yes | Hidden | Hidden |
| Public quotation | Public | Public | Public |

This table documents current intent; implementation must verify actual route/API behavior before changing UI visibility.

## Responsive QA Matrix

Required viewport checks:

- 320 x 568;
- 375 x 812;
- 430 x 932;
- 768 x 1024;
- 1024 x 768;
- 1280 x 800;
- 1440 x 900;
- 1920 x 1080.

At each width verify:

- no horizontal page scroll;
- no clipped logo, title, totals, buttons, filters, or menus;
- mobile navigation opens, closes, traps focus where appropriate, and restores focus;
- sticky headers and action bars do not cover content;
- long names, emails, product IDs, and PKR values truncate or wrap intentionally;
- dialogs fit within the viewport and keep their close/action controls visible;
- data remains understandable when a desktop table becomes mobile cards;
- virtual keyboard does not hide critical form actions.

Zoom checks:

- 100% and 125% for normal desktop density;
- 200% for reflow and accessibility;
- Windows display scaling at 125% where available.

## Accessibility Acceptance

- WCAG 2.2 AA contrast.
- Complete keyboard operation for navigation, filters, menus, dialogs, tables, upload controls, and quote item editing.
- Visible focus ring on every interactive control.
- Logical heading hierarchy with one page `h1`.
- Valid labels, descriptions, errors, and required-state announcements.
- Screen-reader text for icon-only controls.
- Status text in addition to color.
- Reduced-motion support.
- 44px touch targets on mobile.
- Public quotation and PDF remain readable at 200% and in grayscale.

## Visual Acceptance

- KK Sports logo appears correctly on sign-in, sidebar, system pages, public quotation, and PDF where supported.
- No user-facing `InventoryOS` text remains.
- Gold is the only routine brand action accent.
- Blue/indigo is not used decoratively across the shell.
- Standard panels use 8px radius or less.
- No card is nested inside another decorative card.
- Page sections are not styled as floating cards.
- Desktop product and stock records no longer default to 192px-high image cards.
- Every page uses the same page header, toolbar, status, empty, loading, and action patterns.
- No oversized page titles or excessive outer gutters make the portal feel zoomed in.
- No decorative gradients, colored orbs, bokeh, or abstract SVG illustrations are introduced.

## Functional Acceptance

- Role-based navigation and action visibility are unchanged.
- All current API requests use the same payloads and endpoints.
- Product create/edit/delete/view and image upload work.
- Product ID uniqueness feedback works.
- Stock changes can be reset and saved in bulk.
- Quotations can be created, viewed, status-updated, copied, shared, downloaded, and publicly opened.
- User creation/edit/deletion, status, role, contact, password, and IP controls work.
- Logs can be searched, filtered, refreshed, and exported.
- Authentication, inactive-account, and IP-restriction flows work.

## Performance Acceptance

- Optimize all new imagery and provide responsive sizes.
- Avoid layout shift from logos, thumbnails, charts, and loading states by setting stable dimensions.
- Do not load the login hero on authenticated routes.
- Lazy-load large galleries and non-critical dialogs.
- Keep initial authenticated shell responsive while data panels load independently.
- Verify production build, route rendering, and browser console cleanliness.

## Implementation Notes for Existing Files

High-impact files likely to change first:

- `app/globals.css` for tokens and shared primitives;
- `app/layout.tsx` for metadata/brand naming;
- `components/brand-mark.tsx` for the KK logo component;
- `components/layout/app-layout.tsx`, `header.tsx`, `sidebar.tsx`, and `page-heading.tsx` for the shell;
- `app/auth/signin/page.tsx` for the new login composition;
- all feature list/form/detail components after shared primitives are ready;
- public quotation and PDF routes/components for document alignment.

Keep page-specific classes small. If two feature surfaces need the same treatment, promote it into a shared component or variant before continuing.

## Final Design Review Checklist

The design review should use real or production-like records, not only empty states. Capture each required viewport for:

- sign-in;
- dashboard populated and empty;
- products populated, filtered, and empty;
- product create/edit and detail;
- stock exceptions with and without unsaved changes;
- quotations populated, empty, create, detail, public, and PDF;
- users populated and edit;
- logs populated and filtered empty;
- inactive and restricted states;
- mobile navigation and at least one long-content dialog.

Approval requires simultaneous sign-off on brand fidelity, operational density, cross-page consistency, responsive behavior, accessibility, and functional regression. A visually polished page is not complete if it introduces a one-off pattern or weakens an existing workflow.
