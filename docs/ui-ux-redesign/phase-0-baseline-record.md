# Phase 0 Baseline Record

Date: 2026-09-02

Scope: baseline and implementation support for Phase 0, Phase 1, and Phase 2 only. Product catalog, stock workflows, quotations, PDFs, users, logs, and dashboard feature-page redesigns remain assigned to later phases in `docs/ui-ux-redesign/phase-by-phase-plan.md`.

## Git State

The worktree was already dirty before implementation. Unrelated untracked project files were preserved, including `.vscode/`, `_legacy_src_isp/`, `demo/`, existing public web assets, and archive/class files.

Files intentionally changed for Phase 0-2:

- `app/globals.css`
- `app/layout.tsx`
- `app/auth/signin/page.tsx`
- `app/auth/inactive/page.tsx`
- `app/restricted/page.tsx`
- `app/restricted/loading.tsx`
- `components/brand-mark.tsx`
- `components/ip-status-indicator.tsx`
- `components/layout/app-layout.tsx`
- `components/layout/header.tsx`
- `components/layout/page-heading.tsx`
- `components/layout/sidebar.tsx`
- `components/providers.tsx`
- `components/restricted-client.tsx`
- `components/system-state-page.tsx`
- `components/shared/*`
- `components/ui/*` shared primitives updated by Phase 1
- `public/kk-operations-login-source.png`
- `public/kk-operations-login.jpg`
- `scripts/capture-ui-baseline.js`
- `scripts/optimize-login-image.js`
- `tailwind.config.js`

## Baseline Build

Baseline production build before runtime UI changes:

- Command: `npm run build`
- Result: passed.
- Existing behavior: Next build skips type validation and linting in this project.
- Existing route anomaly: `app/api/users/edit/[id]/page.tsx` is emitted as page route `/api/users/edit/[id]`; cleanup is assigned to Phase 8.

Post Phase 0-2 production build:

- Command: `npm run build`
- Result: passed.
- Warning: Browserslist `caniuse-lite` is outdated.
- Type/lint note: `npm run lint` opens the interactive Next ESLint setup prompt because lint is not configured. `npx tsc --noEmit` is blocked by syntax errors in the unrelated untracked `_legacy_src_isp/` tree.

## Baseline Screenshots

Baseline sign-in screenshots were captured before production code changes:

- `tmp/ui-baseline/signin-mobile.png` at 375x812
- `tmp/ui-baseline/signin-tablet.png` at 768x1024
- `tmp/ui-baseline/signin-desktop.png` at 1440x900
- `tmp/ui-baseline/signin-wide.png` at 1920x1080

Authenticated screenshots were not captured during Phase 0 because the local demo login did not complete in the automated browser run. The route and role behavior below is therefore recorded from source and the successful build.

## Role And Permission Baseline

Current landing behavior:

- Manager sessions route from `/` to `/dashboard`.
- Rider sessions route from `/` to `/products`.
- Product manager sessions route from `/` to `/products`.
- Unauthenticated users are redirected to `/auth/signin`.
- Public quotation pages under `/quotations/[id]` remain outside the authenticated app shell.

Current navigation exposure:

- Manager: Dashboard, Products, Stock exceptions, Quotations, Users, Activity logs.
- Rider: Products, Stock exceptions, Quotations.
- Product manager: Products, Stock exceptions.

Known role-contract mismatches retained for later phases:

- Product delete is visible to manager and product manager in `components/products/product-list.tsx`, while `DELETE app/api/products/[id]/route.ts` is manager-only.
- Stock bulk update accepts manager and product manager in `app/api/products/bulk-update/route.ts`, while the current save button in `components/out-of-stock/out-of-stock-manager.tsx` is enabled only for manager.
- Product list data is available to all authenticated roles, while single-product responses remove `purchaseRate` for non-managers and the product forms expose purchase rate to manager and product manager.
- Quotation status/send endpoints require authentication but do not enforce a narrower ownership contract consistently; navigation currently exposes quotations only to manager and rider.

## Functional Behavior To Preserve

The Phase 0-2 implementation preserves the current server/API contracts and defers feature-page visual rewrites to later phases:

- Product CRUD, image upload, product detail logging, and role-gated mutation UI are unchanged.
- Stock exception search, changed-item tracking, reset, save, logging, and role-specific save behavior are unchanged.
- Quotation list, builder, preview, status, send, copy, WhatsApp, PDF, and public link behavior are unchanged.
- User administration, role/status/contact/password/IP fields, online status, and heartbeat are unchanged.
- Activity log search/filter/refresh/export behavior is unchanged.
- Public quotation access remains intentionally public for valid quotation IDs.
