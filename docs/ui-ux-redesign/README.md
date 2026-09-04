# KK Sports Portal UI/UX Redesign

## Purpose

This package defines the production UI redesign for the KK Sports inventory and quotation portal. It is a design and implementation specification, not a request to change business logic.

The redesign must preserve:

- every existing role, permission, route, API call, form field, status, and action;
- product image upload and viewing;
- quotation creation, status updates, PDF download, public preview, link copy, and WhatsApp sharing;
- stock exception editing and bulk save;
- user, IP allow-list, and activity-log management;
- desktop and mobile workflows.

The redesign changes the visual system, information density, hierarchy, responsive layout, and brand language.

## Source Review

The direction is based on:

- the live [KK Sports storefront](https://kksports.com.pk/);
- the supplied storefront screenshot;
- `public/kk_logo.png` and `public/kk_logo_white_bg.png`;
- `colorize.design-kksports.com.pk-palette.css`;
- the current application shell, pages, forms, lists, cards, dialogs, loading states, and empty states.

The storefront uses a strong black-and-white base, warm gold brand accents, high-contrast athletic photography, compact uppercase labels, product-focused grids, and direct retail language. Its public content identifies KK Sports as a Pakistani sports and fitness importer, exporter, wholesaler, distributor, and retailer operating since 1972, with products spanning cricket, fitness, footwear, apparel, racket sports, indoor games, skating, swimming, padel, and basketball.

The portal should inherit that identity without imitating the storefront page composition. This is an operational product used repeatedly by staff, so it must be calmer, denser, and more predictable than an ecommerce homepage.

## Design Diagnosis

The current UI has solid functional coverage, but it reads as a collection of independently styled templates rather than one product.

Primary issues:

- The brand is still `InventoryOS`, with a generic cube mark and blue/indigo identity.
- Blue, indigo, violet, emerald, sky, amber, and red are used decoratively, making the palette feel improvised.
- Cards, icon boxes, pills, shadows, and rounded corners appear almost everywhere, reducing hierarchy.
- The desktop product and stock views use large image cards, resulting in low information density and a zoomed-in feeling.
- Header titles and in-page headings often repeat the same context.
- Forms use different section structures and visual treatments.
- Product, quotation, user, and log records use different row/card patterns and action placement.
- Quotation preview surfaces use legacy colors and typography that do not match the main portal.
- Empty, loading, restricted, and inactive states do not share one branded pattern.
- Many styles are embedded directly in components, which encourages drift.
- The supplied palette file declares `--black` three times. In CSS, the final value wins, so the palette cannot be consumed as-is.

## Target Experience

The portal should feel like a modern sports retail operations console:

- professional rather than playful;
- compact rather than cramped;
- branded rather than promotional;
- image-aware rather than image-dominated;
- consistent rather than page-specific;
- quick to scan and efficient for repeated work.

The visual signature is charcoal navigation, white working surfaces, warm gold actions and highlights, restrained teal support accents, crisp product photography, and disciplined typography.

## Non-Negotiable Principles

1. Gold is the brand accent, not a background theme. Use it for primary actions, selected navigation, focus, and a few high-value indicators.
2. Semantic colors keep their meaning. Green is success/in stock, amber is warning/pending, red is destructive/out of stock, and blue is informational only.
3. Desktop work surfaces prioritize tables, compact rows, and split panels. Mobile can use cards when rows no longer scan well.
4. A page has one title. The global header provides location and account controls; the page heading provides title, description, and primary actions.
5. Images identify products and brand moments. They must not consume most of an operational viewport.
6. Repeated records use the same density, status, metadata, and action conventions.
7. Content uses sentence case. Uppercase is reserved for tiny labels, table headers, IDs, and brand moments.
8. Functionality and access boundaries must remain unchanged.

## Documentation Map

- [Design system](./design-system.md): tokens, layout, typography, components, responsive rules, imagery, accessibility, and content.
- [Page specifications](./page-specifications.md): route-by-route redesign requirements.
- [Implementation plan](./implementation-plan.md): component mapping, phases, acceptance criteria, and QA.
- [Phase-by-phase execution plan](./phase-by-phase-plan.md): exhaustive route, role, file, dependency, and verification coverage.
- [Universal implementation prompt](./universal-implementation-prompt.md): reusable prompt for implementing any single phase safely and consistently.

## Definition of Success

The redesign is complete when a user can move between dashboard, products, stock exceptions, quotations, users, and logs without encountering a new visual grammar; all role-specific actions remain available; desktop pages show materially more useful information above the fold; mobile pages remain touch-safe and do not horizontally overflow; and the product unmistakably belongs to KK Sports.
