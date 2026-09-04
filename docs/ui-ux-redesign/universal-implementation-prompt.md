# Universal Prompt for Implementing Any UI Redesign Phase

Copy the prompt below and replace the bracketed phase values. It is intentionally strict so each phase remains consistent with the rest of the portal.

```text
You are implementing Phase [PHASE NUMBER: PHASE NAME] of the KK Sports inventory and quotation portal UI/UX redesign.

Repository context
- This is a Next.js 14 App Router application using React 18, TypeScript, Tailwind CSS, Radix/shadcn primitives, Lucide icons, NextAuth credentials, MongoDB, Vercel Blob, Recharts, jsPDF, and jsPDF AutoTable.
- The application is an internal management portal for KK Sports: https://kksports.com.pk/
- Preserve all existing functionality, routes, role permissions, API contracts, database behavior, status side effects, uploads, logging, quotation calculations, public access behavior, and redirects unless this phase explicitly authorizes a behavior change.
- Work with existing user changes. Do not revert or overwrite unrelated files.

Phase objective
[PASTE THE GOAL, WORK ITEMS, PRIMARY FILES, ROLE CHECKS, AND EXIT CRITERIA FROM docs/ui-ux-redesign/phase-by-phase-plan.md]

Mandatory references: read these before editing
- docs/ui-ux-redesign/README.md
- docs/ui-ux-redesign/design-system.md
- docs/ui-ux-redesign/page-specifications.md
- docs/ui-ux-redesign/implementation-plan.md
- docs/ui-ux-redesign/phase-by-phase-plan.md
- colorize.design-kksports.com.pk-palette.css
- public/kk_logo.png
- public/kk_logo_white_bg.png
- app/globals.css
- app/layout.tsx
- app/page.tsx
- middleware.ts
- lib/auth.ts
- lib/mongodb.ts
- lib/ip-utils.ts
- lib/logger.ts
- lib/phone-utils.ts
- types/next-auth.d.ts
- package.json
- next.config.mjs
- tsconfig.json

Mandatory shell and shared UI references
- components/brand-mark.tsx
- components/providers.tsx
- components/layout/app-layout.tsx
- components/layout/header.tsx
- components/layout/sidebar.tsx
- components/layout/page-heading.tsx
- components/ip-status-indicator.tsx
- components/status-provider.tsx
- hooks/use-heartbeat.ts
- hooks/use-user-status.ts
- components/ui/button.tsx
- components/ui/input.tsx
- components/ui/select.tsx
- components/ui/dialog.tsx
- components/ui/drawer.tsx
- components/ui/dropdown-menu.tsx
- components/ui/table.tsx
- components/ui/badge.tsx
- components/ui/tooltip.tsx
- components/ui/skeleton.tsx
- components/ui/alert.tsx
- components/ui/toast.tsx
- components/ui/sonner.tsx

Feature references for this phase
[PASTE EVERY PAGE, COMPONENT, HOOK, LIBRARY, AND API FILE LISTED UNDER PRIMARY FILES FOR THE SELECTED PHASE]

Brand and visual rules
- Replace the generic InventoryOS identity with KK Sports Operations. Do not leave user-facing InventoryOS text in migrated surfaces.
- Use public/kk_logo.png and public/kk_logo_white_bg.png according to the logo contrast rules in design-system.md. Do not redraw the KK logo.
- Normalize the supplied palette because colorize.design-kksports.com.pk-palette.css declares --black multiple times. Use uniquely named KK tokens.
- Core palette: #F8F8F8 canvas, #FFFFFF surface, #0E0E16 ink, #030201 navigation black, #D8A018 KK gold, #70B4B3 teal, #1A3531 deep teal, #525874 slate, and #1E377B informational blue.
- Gold is the routine primary-action and brand accent. Gold is not a warning color.
- Keep green for success/in stock, amber for warning/pending, red for destructive/out of stock, and blue for information only.
- Use Inter. Do not add another font unless explicitly approved.
- Use letter-spacing: 0 for normal text. Tiny table headers/labels may use no more than 0.04em.
- Page titles are 22-24px, section titles 16px, body 14px, secondary text 12px, and standard controls 40px desktop/at least 44px mobile.
- Use 6px control radius and no more than 8px for panels/dialogs unless an existing primitive technically requires otherwise.
- Prefer borders over shadows. Do not add gradients, colored orbs, bokeh, decorative SVG illustrations, nested cards, floating page-section cards, or oversized hero typography inside the portal.
- Use compact desktop tables/rows for operational data and responsive cards/drawers on mobile.
- Use Lucide icons for controls. Icon-only controls require an accessible name and tooltip.
- Keep one page title, one clear primary action per action group, stable dimensions, and no UI overlap.
- Use PKR formatting consistently.

Image rules
- Use authentic KK-owned imagery or a locally stored approved/generated image. Never hotlink storefront/CDN imagery in production.
- Optimize images and set stable width/height or aspect-ratio constraints.
- Product thumbnails use object-contain on a neutral stage unless the source is lifestyle photography.
- The login image is loaded only on the sign-in route.
- Preserve current product image fallback compatibility for imagePaths and legacy imagePath.

Roles and access that must not regress
- Manager: dashboard, products, stock exceptions, quotations, users, and activity logs.
- Rider: products, stock exceptions, and rider-scoped quotations; no dashboard/users/logs.
- Product manager: products and stock exceptions; no dashboard/quotations/users/logs.
- Public viewer: valid public quotation only; no authenticated shell or internal metadata.
- Verify both hidden navigation/actions and server/API authorization. Never treat hidden UI as authorization.
- Read the Known Role-Contract Mismatches section in docs/ui-ux-redesign/phase-by-phase-plan.md. Product delete, stock bulk update, purchase-rate visibility, and quotation status/send currently have UI/API inconsistencies. Do not silently redefine them during visual work; preserve current runtime behavior or implement an explicitly approved contract as a separately reported change with tests.

Implementation method
1. Inspect the current Git status and relevant files before editing.
2. Read the selected phase completely and summarize the concrete changes you will make.
3. Identify existing shared patterns and reuse them. Add an abstraction only when it removes meaningful duplication or is required by the redesign documents.
4. Implement the phase end to end. Do not stop after styling the first page.
5. Preserve current event handlers, requests, payloads, state transitions, status effects, routing, role checks, logging, and error behavior.
6. Build complete loaded, loading, empty, no-results, error, disabled, validation, success, destructive-confirmation, and long-content states for the affected surfaces.
7. Keep responsive layouts explicit. Desktop data surfaces become mobile cards/drawers; do not rely on accidental wrapping.
8. Do not modify unrelated business/security issues during this UI phase. Report them separately if discovered.
9. Do not remove old components/classes until every consumer has migrated and searches show they are unused.

Required verification
- Run targeted lint/type checks available in the repository, then run npm run build.
- Note that next.config.mjs currently ignores TypeScript and ESLint failures during production builds; therefore run direct checks where scripts/tooling allow instead of treating a successful build as sufficient.
- Start the development server after implementation and provide its local URL.
- Test affected workflows as manager, rider, and product manager wherever the phase can affect them.
- Test unauthenticated/public behavior for sign-in, restricted states, or public quotations when relevant.
- Capture and inspect screenshots at 320x568, 375x812, 430x932, 768x1024, 1024x768, 1280x800, 1440x900, and 1920x1080 for affected pages.
- Check 100%, 125%, and 200% browser zoom and Windows 125% display scaling where available.
- Verify no horizontal overflow, clipping, overlap, hidden actions, layout shift, or unreadable long text.
- Verify keyboard navigation, focus visibility, dialog focus return, tooltips, labels, semantic status text, reduced motion, and WCAG 2.2 AA contrast.
- Check the browser console and network requests for new errors.
- Compare final screenshots with the selected phase requirements, not only with the old UI.

Route coverage rule
- Use the Complete Page Inventory in docs/ui-ux-redesign/phase-by-phase-plan.md.
- Explicitly list every route touched, every role tested, and every route deferred to a later phase.
- Do not overlook app/api/users/edit/[id]/page.tsx. It is an unintended duplicate UI route; only remove or relocate it in Phase 8 after confirming no dependency.

Completion report
At the end, provide:
- the outcome and major visual/structural changes;
- all files added or changed;
- all routes completed;
- role-by-role workflows verified;
- responsive/accessibility checks performed;
- commands/tests/build results;
- screenshots or local URL used for review;
- remaining issues and the next phase dependency.

Do not claim the phase is complete if any listed page, role, state, or exit criterion is unverified. Do not begin the next phase automatically.
```

## Recommended Invocation Header

Place this above the universal prompt for a specific run:

```text
Implement only Phase [NUMBER: NAME] from docs/ui-ux-redesign/phase-by-phase-plan.md. Complete every work item and exit criterion in that phase, but do not begin the next phase. Use production-quality code and preserve all current behavior.
```

## Example Phase Substitution

For the product catalog phase, replace the phase objective and feature references with the complete Phase 3 sections. Do not shorten the role checks or omit the related product APIs merely because the requested work is described as visual; the UI depends on their exact response shape and authorization behavior.
