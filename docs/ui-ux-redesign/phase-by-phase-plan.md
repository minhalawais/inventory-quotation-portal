# Phase-by-Phase UI Implementation Plan

## How to Use This Plan

Implement one phase at a time. Do not begin a later feature phase until its shared dependencies and exit checks are complete. Each phase ends with a build, targeted workflow checks, responsive screenshots, and a role audit.

This plan covers all visible routes, system states, shared components, and the three authenticated roles:

- `manager`;
- `rider`;
- `product_manager`.

Public quotation viewers are also treated as a separate unauthenticated audience.

## Complete Page Inventory

| Route | Audience | Planned phase |
| --- | --- | --- |
| `/` | All; redirects by session/role | Phase 2 |
| `/auth/signin` | Unauthenticated users | Phase 2 |
| `/auth/inactive` | Inactive authenticated accounts | Phase 2 |
| `/restricted` | Authenticated users with disallowed IP | Phase 2 |
| `/restricted/loading` | Restricted-route loading state | Phase 2 |
| `/dashboard` | Manager | Phase 7 |
| `/products` | Manager, rider, product manager | Phase 3 |
| `/products/add` | Manager, product manager | Phase 4 |
| `/products/edit/[id]` | Manager, product manager | Phase 4 |
| `/out-of-stock` | Manager, rider, product manager; editing follows current permissions | Phase 4 |
| `/quotations` | Manager, rider | Phase 5 |
| `/quotations/create` | Manager, rider | Phase 5 |
| `/quotations/[id]` | Public viewer; also opened from authenticated flows | Phase 6 |
| `/users` | Manager | Phase 7 |
| `/users/add` | Manager | Phase 7 |
| `/users/edit/[id]` | Manager | Phase 7 |
| `/logs` | Manager | Phase 7 |
| `/api/users/edit/[id]` | Unintended duplicate UI route | Phase 8 cleanup after verification |

## Known Role-Contract Mismatches to Audit

These are existing implementation inconsistencies, not redesign permissions. Record them in Phase 0 and do not silently choose a new behavior during visual work:

- Product Delete is shown to manager and product manager in `components/products/product-list.tsx`, while `DELETE app/api/products/[id]/route.ts` is manager-only.
- The stock bulk-update API accepts manager and product manager, while the current Save button in `components/out-of-stock/out-of-stock-manager.tsx` is enabled only for manager.
- The product list API returns product documents to every authenticated role, while the single-product API removes `purchaseRate` for non-managers and product forms currently expose purchase-rate UI to manager and product manager.
- Quotation status/send endpoints require authentication but do not consistently enforce rider ownership or a narrower role contract, while portal navigation exposes quotations only to manager and rider.

For each mismatch, preserve current runtime behavior during the redesign or obtain an explicit product/security decision and implement it as a separately identified change with API and UI tests. Never infer authorization from navigation visibility.

## Phase 0: Baseline and Design Lock

### Goal

Create a reliable functional and visual baseline before changing shared styling.

### Work

1. Record the current Git status and preserve unrelated user changes.
2. Run the production build and record existing warnings.
3. Start the app against safe development data.
4. Capture current screenshots at 375x812, 768x1024, 1440x900, and 1920x1080.
5. Capture at least one populated and one empty/error state where available.
6. Verify the current route and permission behavior for manager, rider, and product manager.
7. Record each known role-contract mismatch and the approved behavior, if a decision is available.
8. Record functional behavior for product CRUD, stock changes, quotation actions, user administration, IP restriction, logs, and public quotation access.
9. Create an asset manifest for `public/kk_logo.png`, `public/kk_logo_white_bg.png`, the approved login image, and any generated/optimized derivatives.
10. Decide whether the login image is KK-owned storefront media or newly generated. Do not hotlink the storefront CDN.

### Primary references

- `docs/ui-ux-redesign/README.md`
- `docs/ui-ux-redesign/design-system.md`
- `docs/ui-ux-redesign/page-specifications.md`
- `docs/ui-ux-redesign/implementation-plan.md`
- `colorize.design-kksports.com.pk-palette.css`
- `public/kk_logo.png`
- `public/kk_logo_white_bg.png`
- `package.json`
- `middleware.ts`
- `lib/auth.ts`
- `types/next-auth.d.ts`

### Role checks

- Manager starts at `/dashboard`.
- Rider starts at `/products` and cannot see manager-only navigation.
- Product manager starts at `/products` and cannot see quotations/users/logs.
- Unauthenticated users go to `/auth/signin` except the public quotation route.
- Inactive and IP-restricted sessions reach their current system states.

### Exit criteria

- Baseline build status and screenshots are recorded.
- Existing permissions and behavior are documented.
- Login image and logo treatment are approved.
- No production code has changed except optional non-runtime QA support.

## Phase 1: Design Tokens and Shared Primitives

### Goal

Build the common visual language before redesigning pages.

### Work

1. Normalize the supplied palette into uniquely named variables in `app/globals.css`; never consume the repeated raw `--black` names directly.
2. Remap shadcn theme variables to KK canvas, surfaces, ink, border, gold primary, teal support, and semantic status colors.
3. Remove the blue radial page background and negative global letter spacing.
4. Establish the 4px spacing scale, 6px controls, 8px panels/dialogs, border-first elevation, and 40px desktop controls.
5. Update shared primitives for buttons, inputs, labels, selects, textareas, checkboxes, switches, badges, tables, dialogs, drawers, tooltips, skeletons, alerts, toast, and focus states.
6. Create or normalize `StatusBadge`, `Panel`, `PageHeader`, `Toolbar`, `EmptyState`, `ErrorState`, `FormSection`, `FormActions`, `Metric`, `ProductThumb`, and `RecordActions`.
7. Use Lucide icons already installed. Do not introduce a second design library.
8. Ensure reduced motion, keyboard focus, contrast, and 44px mobile touch targets.

### Primary files

- `app/globals.css`
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/label.tsx`
- `components/ui/select.tsx`
- `components/ui/textarea.tsx`
- `components/ui/checkbox.tsx`
- `components/ui/switch.tsx`
- `components/ui/badge.tsx`
- `components/ui/table.tsx`
- `components/ui/dialog.tsx`
- `components/ui/drawer.tsx`
- `components/ui/dropdown-menu.tsx`
- `components/ui/tooltip.tsx`
- `components/ui/skeleton.tsx`
- `components/ui/alert.tsx`
- `components/ui/toast.tsx`
- `components/ui/sonner.tsx`
- `components/layout/page-heading.tsx`
- new shared components under `components/ui` or `components/shared`

### Regression scope

All roles and all pages are affected indirectly by primitive changes. Spot-check every route before phase completion even though route layouts have not yet been redesigned.

### Exit criteria

- Shared states exist for default, hover, active, focus, disabled, loading, success, warning, and destructive behavior.
- No primitive clips at 320px or 200% zoom.
- Gold is used for routine primary actions; semantic colors retain their meanings.
- Existing pages still function while awaiting migration.
- Production build passes.

## Phase 2: Brand, Application Shell, Authentication, and System States

### Goal

Make every entry point unmistakably KK Sports and establish one responsive navigation shell.

### Work

1. Replace InventoryOS metadata, app names, icons, and visible labels with KK Sports Operations language.
2. Replace the generic cube mark with a reusable KK Sports logo component based on `public/kk_logo.png`.
3. Implement the 232px charcoal desktop sidebar, gold active indicator, compact navigation, bottom account area, and role-filtered links.
4. Implement the 64px desktop/56px mobile header with breadcrumb/context, optional quick action, access status, and account menu.
5. Keep one page title by removing title duplication between header and page content.
6. Rebuild mobile navigation with focus management, route-close behavior, overlay, and safe-area handling.
7. Redesign `/auth/signin` with the approved full-bleed sports image, KK logo, white form area, gold action, stable errors, and password visibility control.
8. Hide development demo-account autofill in production. If retained, gate it behind a development-only condition.
9. Redesign `/auth/inactive`, `/restricted`, and `/restricted/loading` with the shared system-state template.
10. Verify `/` still redirects manager to dashboard and rider/product manager to products.
11. Preserve middleware, session, heartbeat, online status, sign out, and IP restriction behavior.

### Primary files

- `app/layout.tsx`
- `app/page.tsx`
- `app/auth/signin/page.tsx`
- `app/auth/inactive/page.tsx`
- `app/restricted/page.tsx`
- `app/restricted/loading.tsx`
- `components/restricted-client.tsx`
- `components/brand-mark.tsx`
- `components/layout/app-layout.tsx`
- `components/layout/header.tsx`
- `components/layout/sidebar.tsx`
- `components/ip-status-indicator.tsx`
- `components/status-provider.tsx`
- `hooks/use-heartbeat.ts`
- `hooks/use-user-status.ts`
- `middleware.ts`
- `lib/auth.ts`
- `lib/ip-utils.ts`
- `public/kk_logo.png`
- `public/kk_logo_white_bg.png`
- approved local login image and asset manifest

### Role and route checks

- Manager sidebar: Dashboard, Products, Stock exceptions, Quotations, Users, Activity Logs.
- Rider sidebar: Products, Stock exceptions, Quotations.
- Product manager sidebar: Products, Stock exceptions.
- Quick actions never expose a forbidden destination.
- Sign out works from desktop and mobile.
- Inactive accounts and disallowed IPs retain the existing enforcement flow.

### Exit criteria

- No user-facing InventoryOS branding remains.
- All roles see the correct navigation and landing route.
- Sign-in works in loading, error, success, and invalid credential states.
- Shell has no horizontal overflow or title duplication.
- Screenshots pass at all required viewport widths and 125%/200% zoom.
- Production build passes.

## Phase 3: Product Catalog and Product Detail

### Goal

Turn the product catalog into a dense operational view while retaining rich imagery and every existing action.

### Work

1. Redesign `/products` with the universal page header and toolbar.
2. Preserve search, group filter, subgroup filter, reset, and result derivation.
3. Use a compact desktop catalog table/list with product thumbnail, identity, classification, price, stock, image count, and actions.
4. Use compact product cards on mobile; do not squeeze the desktop table.
5. Preserve role-based Add, Edit, and Delete visibility exactly.
6. Preserve product view logging and API calls.
7. Move destructive Delete into an overflow action and keep the confirmation dialog explicit.
8. Redesign the product detail dialog as an 880px desktop dialog and mobile drawer.
9. Normalize image fallback, image gallery, alt text, contained product image stage, status, prices, and metadata.
10. Build matching loading, empty, no-results, error, and long-name states.

### Primary files

- `app/products/page.tsx`
- `components/products/product-list.tsx`
- `components/products/product-filters.tsx`
- `components/products/product-view-modal.tsx`
- `components/ui/image-slider.tsx`
- `components/ui/image-slider-compact.tsx`
- shared `Toolbar`, `StatusBadge`, `ProductThumb`, `ResponsiveRecordList`, and `RecordActions`
- `lib/logger.ts`
- `app/api/products/route.ts`
- `app/api/products/[id]/route.ts`

### Role checks

- Manager: view, add, edit, delete, see appropriate price data.
- Rider: view/search/filter/detail only; no mutation actions.
- Product manager: view, add, edit, and only the delete behavior already permitted by current UI/API.
- Do not expose purchase rate to a role that cannot currently access it.

### Exit criteria

- Desktop shows materially more records above the fold than the current card grid.
- Mobile retains image, identity, price, status, and actions without overflow.
- Filtering and empty/no-result states are correct.
- View, edit, delete, image navigation, logging, and routing work.
- Production build passes.

## Phase 4: Product Editors and Stock Exceptions

### Goal

Unify product create/edit forms and make stock exception handling an efficient bulk workflow.

### Work

1. Create one visual product editor pattern shared by add and edit without merging business logic prematurely.
2. Organize fields into Classification, Product identity, Availability, Pricing, and Images.
3. Use a desktop main form plus sticky summary; use one-column mobile layout.
4. Preserve product ID lookup, uniqueness feedback, legacy image compatibility, maximum image count, upload, removal, and role-dependent fields.
5. Add stable inline validation and one action footer with Cancel and Create/Save.
6. Redesign `/out-of-stock` as a compact table on desktop and cards on mobile.
7. Preserve search, refresh, status editing, changed-item tracking, reset, save, logging, and toasts.
8. Use a sticky unsaved-changes bar with count, Reset, and Save changes.
9. Make read-only behavior understandable for roles that cannot save; do not merely gray out controls without context.
10. Verify no unsaved state is lost through accidental visual interaction changes.

### Primary files

- `app/products/add/page.tsx`
- `app/products/edit/[id]/page.tsx`
- `app/out-of-stock/page.tsx`
- `components/products/product-form.tsx`
- `components/products/edit-product-form.tsx`
- `components/ui/multiple-image-upload.tsx`
- `components/out-of-stock/out-of-stock-manager.tsx`
- `app/api/products/check-id/route.ts`
- `app/api/products/last-id/route.ts`
- `app/api/products/bulk-update/route.ts`
- `app/api/products/out-of-stock/route.ts`
- `app/api/upload/route.ts`

### Role checks

- Manager: full product create/edit and current stock save permissions.
- Rider: cannot enter product create/edit; stock page follows current read-only behavior.
- Product manager: product create/edit fields and stock behavior remain exactly as currently authorized.
- Validate server-side authorization, not only hidden buttons.

### Exit criteria

- Add and edit forms share structure, density, validation, and action placement.
- Upload and image ordering/removal work on desktop and mobile.
- Stock changes can be made, identified, reset, saved, and logged.
- Navigation away with unsaved changes follows current behavior unless separately approved.
- Production build passes.

## Phase 5: Quotation List and Quote Builder

### Goal

Make quotations easy to scan, create, and act on without presenting every command at equal weight.

### Work

1. Redesign `/quotations` with a desktop table and mobile quotation records.
2. Preserve manager/rider API scoping and all fetched data.
3. Keep existing search/filter behavior; do not add non-functional controls.
4. Use columns for ID/date, customer/phone, rider where available, item count, total, status, and actions.
5. Keep View visible and move Preview, Download PDF, WhatsApp, Copy link, Send, and secondary actions into a structured menu/action group.
6. Preserve the current status-update and sent-state side effects.
7. Redesign `/quotations/create` as a two-column quote builder with sticky summary on desktop and sticky total/action on mobile.
8. Preserve customer fields, Pakistani phone formatting, product search, product image, quantity, price, line totals, removal, total calculation, and submit payload.
9. Make product search keyboard accessible and usable in a mobile sheet/dialog.
10. Add matching loading, no-result, empty, submission, and error states.

### Primary files

- `app/quotations/page.tsx`
- `app/quotations/create/page.tsx`
- `components/quotations/quotation-list.tsx`
- `components/quotations/quotation-form.tsx`
- `components/quotations/quotation-preview.tsx`
- `components/ui/command.tsx`
- `lib/phone-utils.ts`
- `lib/logger.ts`
- `app/api/quotations/route.ts`
- `app/api/quotations/[id]/status/route.ts`
- `app/api/quotations/[id]/send/route.ts`

### Role checks

- Manager: sees all quotations and all currently available actions.
- Rider: sees only quotations returned for that rider and retains create/view/share/status behavior currently available.
- Product manager: quotation navigation and pages remain unavailable.
- Public users receive no access to authenticated list/create pages.

### Exit criteria

- Quote list is dense and scannable on desktop and coherent on mobile.
- All existing list commands still work and remain discoverable.
- Quote calculations and payloads are unchanged.
- Product search, item edits, phone input, and submission work with keyboard and touch.
- Production build passes.

## Phase 6: Quotation Document, Public View, PDF, and Sharing

### Goal

Create one KK Sports quotation document language across authenticated preview, modal, public link, print, PDF, and sharing entry points.

### Work

1. Extract or align a common `QuotationDocument` presentation model.
2. Redesign the authenticated quotation detail modal with a stable header/action row and readable item document.
3. Redesign quotation preview to match the same hierarchy.
4. Redesign public `/quotations/[id]` without the authenticated app shell.
5. Add KK logo, quotation number/date/status, customer details, sales representative, items, totals, and approved company contact details.
6. Preserve public not-found behavior and ensure internal-only fields never appear.
7. Restyle authenticated and public PDF output to match the screen document where technically practical.
8. Preserve download, copy link, WhatsApp link/message, status update, send timestamp, and public URL behavior.
9. Verify long product names, multiple pages, missing images, remote images, and large totals.
10. Verify print and PDF in grayscale and at 200% zoom.

### Primary files

- `app/quotations/[id]/page.tsx`
- `components/quotations/public-quotation-view.tsx`
- `components/quotations/quotation-view-modal.tsx`
- `components/quotations/quotation-preview.tsx`
- `app/api/quotations/[id]/pdf/route.ts`
- `app/api/public/quotations/[id]/pdf/route.ts`
- `app/api/quotations/[id]/send/route.ts`
- `app/api/quotations/[id]/status/route.ts`
- `lib/phone-utils.ts`
- `public/kk_logo.png`
- `public/kk_logo_white_bg.png`

### Audience checks

- Manager: authenticated actions and internal context remain available.
- Rider: existing authenticated quotation actions remain available for permitted records.
- Product manager: no new quotation access.
- Public viewer: sees only the public quotation document and public actions; no sidebar, session account, purchase rate, or internal metadata.

### Exit criteria

- Screen, public, print, and PDF documents visibly belong to the same system.
- All share/download/status flows work.
- Public access remains intentionally available only for valid public quotation IDs.
- Multi-page PDFs do not clip rows, totals, logo, or footer.
- Production build passes.

## Phase 7: Dashboard, Users, IP Access, and Activity Logs

### Goal

Complete manager administration and analytics using the shared KK Sports patterns.

### Dashboard work

1. Redesign `/dashboard` with compact neutral KPIs, gold/teal charts, stock exceptions, and recent quotations.
2. Preserve manager authorization and existing dashboard APIs.
3. Fix visual chart semantics without changing metric calculations.
4. Align skeleton, empty, and loaded panel geometry.

### User work

1. Redesign `/users` as a desktop table and mobile user records.
2. Preserve online/last-seen status, role, contact, account status, IP summary, edit, and delete behavior.
3. Redesign `/users/add` and `/users/edit/[id]` with shared sections and action footer.
4. Redesign `ip-address-manager.tsx` as a validated tag editor with explicit `Allow any IP` treatment for `*`.
5. Preserve password behavior and role/status values.

### Log work

1. Redesign `/logs` as a dense audit table and mobile chronology.
2. Preserve search, action filter, status filter, refresh, and export.
3. Keep IDs/IPs technical and details readable/expandable.

### Primary files

- `app/dashboard/page.tsx`
- `components/dashboard/dashboard-stats.tsx`
- `components/dashboard/sales-chart.tsx`
- `components/dashboard/recent-quotations.tsx`
- `components/dashboard/out-of-stock-summary.tsx`
- `components/dashboard/low-stock-alert.tsx`
- `app/users/page.tsx`
- `app/users/add/page.tsx`
- `app/users/edit/[id]/page.tsx`
- `components/users/user-list.tsx`
- `components/users/user-form.tsx`
- `components/users/edit-user-form.tsx`
- `components/users/ip-address-manager.tsx`
- `app/logs/page.tsx`
- `components/logs/activity-logs.tsx`
- `app/api/dashboard/stats/route.ts`
- `app/api/dashboard/sales/route.ts`
- `app/api/users/route.ts`
- `app/api/users/[id]/route.ts`
- `app/api/users/status/route.ts`
- `app/api/logs/route.ts`
- `app/api/heartbeat/route.ts`
- `app/api/check-ip/route.ts`

### Role checks

- Manager: full dashboard, users, editors, IP controls, and logs.
- Rider: no dashboard/users/logs navigation or direct page access.
- Product manager: no dashboard/users/logs navigation or direct page access.
- Existing redirects and server/API authorization remain enforced.

### Exit criteria

- Dashboard has consistent metrics and chart color semantics.
- User CRUD, password, role, status, contact, online status, and IP access work.
- Logs search/filter/refresh/export work.
- Unauthorized roles cannot access manager pages through navigation or direct URLs.
- Production build passes.

## Phase 8: Route Cleanup, Consolidation, and Hardening

### Goal

Remove obsolete visual paths, resolve route anomalies, and prove the redesign works as one production system.

### Work

1. Audit `app/api/users/edit/[id]/page.tsx`. It duplicates the real user editor under an API path and currently creates an unintended page route. Confirm no links or integrations depend on it, then remove or relocate it in a separately reviewable change.
2. Remove obsolete InventoryOS assets/classes only after confirming no runtime references remain.
3. Consolidate repeated status maps, inline shadows, one-off colors, cards, form sections, and action groups.
4. Search for stale brand strings, blue/indigo decorative classes, excessive radii, negative tracking, and legacy quotation colors.
5. Run the complete role and route matrix.
6. Run keyboard, screen-reader smoke, contrast, reduced-motion, responsive, 125%/200% zoom, and Windows 125% display-scaling checks.
7. Test slow-loading, empty, no-results, error, long-content, and destructive-confirmation states.
8. Verify image optimization, stable dimensions, no layout shifts, and no login image on authenticated routes.
9. Run production build and address newly introduced warnings/errors.
10. Capture final screenshots matching the Phase 0 baseline for visual comparison.

### Required searches

- `InventoryOS`
- `brand-icon.svg`
- `blue-` and `indigo-` in feature components
- `rounded-xl`, `rounded-2xl`, and inline `boxShadow`
- `tracking-[-` and global negative letter spacing
- `text-secondary`, legacy quotation banners, and duplicated status maps
- direct `<img>` usage that should use the shared product/logo treatment

### Complete route regression

Verify every route in the page inventory table with its intended audience. Also verify 404/not-found behavior for invalid product, user, and quotation IDs where supported.

### Exit criteria

- Every page is covered and every role has passed its complete workflow matrix.
- The unintended API page route is resolved or explicitly retained with documented reasoning.
- No stale InventoryOS identity remains.
- No horizontal overflow, overlap, clipped text, or inaccessible action remains at required widths/zoom.
- Final production build passes.
- Final screenshots demonstrate one consistent KK Sports portal.

## Master Role Regression Checklist

### Manager

- Sign in and land on dashboard.
- View dashboard KPIs, chart, stock summary, and recent quotations.
- Search/filter/view/add/edit/delete products and upload images.
- Review and save stock exception changes.
- Search/view/create/update/share/copy/download quotations.
- Open public quotation and PDF.
- Search/view/add/edit/delete users.
- Edit role, status, contact, password, and allowed IPs.
- View online status and heartbeat behavior.
- Search/filter/refresh/export activity logs.
- Sign out.

### Rider

- Sign in and land on products.
- View/search/filter products and product details without mutation controls.
- Open stock exceptions with current read-only/edit behavior preserved.
- View only the rider-scoped quotations returned by the API.
- Create, view, update, copy, share, and download quotations according to current permissions.
- Never see dashboard, users, or logs navigation.
- Sign out.

### Product Manager

- Sign in and land on products.
- View/search/filter/add/edit products and upload images.
- See only the delete and stock controls currently authorized by UI and API.
- Open stock exceptions with current behavior preserved.
- Never see dashboard, quotations, users, or logs navigation.
- Sign out.

### Public Viewer

- Open a valid public quotation without signing in.
- View responsive quotation content and permitted public download action.
- Never see authenticated navigation or internal data.
- Receive not-found behavior for an invalid quotation ID.
