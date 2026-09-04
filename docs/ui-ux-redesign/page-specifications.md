# Page and Component Specifications

## Global Route Shell

Applies to all authenticated routes.

- Replace the generic InventoryOS brand with the KK Sports logo and `KK Sports Operations` naming.
- Use the shared 232px charcoal sidebar and 64px header from the design system.
- Keep role-based navigation and route behavior unchanged.
- Remove the blue radial page background.
- Remove repeated page titles from the global header.
- Use one page header pattern across every route.
- Account, role, online/network status, and sign out should use the same account-menu pattern.

## `/auth/signin`

Desktop layout:

- Full-height two-column composition, approximately 58% image and 42% form.
- Full-bleed sports image, KK logo, and one short brand statement on the image side. Text is not placed in a floating card.
- Form column remains white and vertically centered with a 420px content width.
- Heading: `Sign in to KK Sports`.
- Fields: email and password with consistent 44px controls.
- Gold `Sign in` button, full width.
- Error appears directly above the submit action; success uses the same stable message area.
- Password visibility remains an icon action with tooltip/accessibility label.
- Security copy is short and low prominence.

Mobile layout:

- Use a 168-200px image masthead with a safe crop and logo.
- Form follows on white; do not put the entire screen in a rounded card.
- Keep all controls visible without horizontal overflow at 320px.

Production change:

- Remove visible demo-account cards.
- Preserve autofill only behind a development environment condition if still required.

## `/dashboard`

The dashboard should answer four questions in order: what needs attention, what is happening, what changed recently, and where should the manager act.

Layout:

- Page heading with greeting, current date, and a small live-data indicator.
- First row: four compact KPIs with one neutral style. Values are prominent; labels and comparison/context are secondary.
- Second row: sales/revenue chart spanning 8 columns and stock exceptions spanning 4 columns.
- Third row: recent quotations spanning 8 columns and a compact operational summary or quick actions spanning 4 columns.
- At tablet width, use two KPI columns and stack chart panels.

Visual changes:

- Replace indigo and emerald chart styling with gold and teal.
- Remove four unrelated accent colors from KPI cards.
- Show out-of-stock as semantic red and active users as neutral/teal.
- Keep panel headers compact and aligned.
- Skeletons must use the final panel heights and geometry.

## `/products`

Desktop default should be a catalog table, not large merchandising cards.

Toolbar:

- Search by product name or ID.
- Group and subgroup filters.
- Result count.
- Optional compact list/grid segmented control; list is the default.
- `Stock exceptions` is secondary; `Add product` is the single primary action for authorized roles.

Desktop columns:

- 48px product image;
- product name plus group/subgroup;
- product ID;
- sale price;
- stock status;
- image count;
- actions.

Actions:

- Clicking the name/image opens details.
- Keep View available through the row and action menu.
- Edit is a direct action for authorized roles when space permits.
- Delete appears only inside an overflow menu and still requires confirmation.

Mobile:

- Compact card with 96px image, name, ID, price, status, and a single overflow menu.
- Do not show three full-width action buttons per card.

## `/products/add` and `/products/edit/[id]`

Use one shared product editor shell for create and edit.

Desktop:

- Main form 2fr and sticky summary 1fr, maximum width 1120px.
- Sections are un-nested and separated by headings/dividers: Classification, Product identity, Availability, Pricing, Images.
- Group/subgroup and product ID/name use two-column rows where appropriate.
- Sale price and purchase rate align in one row; preserve role visibility rules.
- Image uploader uses a consistent 4:3 thumbnail grid with clear primary image order.
- Sticky summary shows image, name, ID, classification, stock state, sale price, and purchase rate when authorized.
- Sticky footer/action row contains Cancel and one gold Create/Save button.

Mobile:

- Single column; summary becomes a collapsible review section before actions.
- Actions remain visible without overlapping the safe area.

Validation and uniqueness checks retain current behavior but use stable inline feedback.

## Product Detail Dialog

- 880px desktop dialog, full-height mobile drawer.
- Left: contained image gallery.
- Right: name, ID, category path, availability, prices, and metadata in a definition list.
- Footer: Edit for authorized users and Close. Delete remains outside the normal detail flow or in an overflow menu.
- Remove oversized headings, legacy secondary color, and decorative sections.

## `/out-of-stock`

This is a bulk operations page, so optimize for fast status changes.

Desktop:

- Compact summary strip: out-of-stock count, marked for restock, unsaved changes.
- Search and Refresh in the toolbar.
- Table columns: selection/state control, image and product, ID, group, price, current state, pending change.
- Replace per-card checkboxes with a clear `Mark in stock` switch or row checkbox depending on final bulk behavior.
- When changes exist, show a sticky bottom action bar with count, Reset, and gold `Save changes`.
- Keep manager-only editing behavior unchanged; read-only roles see disabled controls with an explanation.

Mobile:

- Compact cards with a clear status switch and pending-change label.
- Sticky bottom save bar must respect safe-area insets.

Do not use large product images or three large statistic cards on desktop.

## `/quotations`

Desktop default is a table with customer-centric scanning.

Toolbar:

- Search customer, phone, quotation ID, or product where supported by current data.
- Status filter.
- Date filter if implemented later; do not add non-functional controls in the visual pass.
- Result count.
- Gold `Create quotation` primary action.

Columns:

- quotation ID and date;
- customer name and phone;
- rider for managers, when available;
- item count;
- total;
- status;
- actions.

Actions:

- Primary row action: View.
- Overflow: Preview public link, Download PDF, Share via WhatsApp, Copy link, and permitted status actions.
- Keep all existing side effects, including sent-state updates, unless separately corrected as a product behavior change.
- Avoid six equal-weight buttons on a record card.

Mobile:

- Card ordered as customer, quotation/date, total/status, metadata, actions.
- Share may be a visible icon action; remaining commands go in overflow.

## `/quotations/create`

Desktop layout:

- Main quote builder 2fr and sticky quote summary 1fr.
- Customer details in a compact two-column section; address full width.
- Product search is the dominant control in the items section.
- Selected items use an editable table with thumbnail, product, quantity stepper/input, unit price, line total, and remove icon.
- Summary shows item count, subtotal/total, customer, and one gold `Create quotation` action.
- Keep PKR formatting consistent.

Mobile:

- Product search opens a full-width command sheet/dialog.
- Items use compact editable cards.
- Sticky bottom bar shows total and Create action.

The empty items state should be compact and live inside the items surface.

## Quotation Detail, Preview, and Public `/quotations/[id]`

Use one quotation document visual language across authenticated dialog, public page, downloaded PDF, and print.

Document header:

- KK Sports logo;
- `Quotation` title;
- quotation number, date, and status;
- customer and sales representative details;
- KK Sports contact block where appropriate.

Items:

- clean table with thumbnail optional on screen and omitted or compact in print;
- item, quantity, unit price, and amount;
- strong but restrained total row;
- no dark blue/legacy `secondary` banners.

Authenticated action bar:

- Back/close, status, Copy link, Download, and Share.
- One primary action, with remaining commands secondary or overflow.
- Sticky within long previews.

Public page:

- Separate from the authenticated shell.
- White document on a soft gray canvas with a narrow KK Sports brand bar.
- Responsive, printable, and readable without account context.
- Never expose purchase rate or internal-only metadata.

PDF:

- Match the document hierarchy, logo, typography, gold rules, totals, and footer.
- Keep white background and high contrast for office printing.

## `/users`

Desktop table columns:

- person/name and email;
- role;
- contact;
- account status;
- online/last seen;
- IP access summary;
- actions.

Behavior:

- Clicking a row opens a compact user detail drawer/dialog.
- Edit is direct; Delete/Deactivate is destructive and confirmed.
- IP allow-list details belong in the detail view, not a large nested modal inside each row.
- Use the shared status component for Active/Inactive and Online/Offline.

Mobile cards show name, email, role, status, last seen, and overflow actions.

## `/users/add` and `/users/edit/[id]`

- Shared user editor layout, maximum width 840px.
- Sections: Account profile, Role and status, Contact, Network access, Password.
- Put name/email and password/confirmation in paired rows on desktop.
- Role descriptions should explain capabilities in concise text.
- Use a tag editor for allowed IPs with examples and validation.
- `*` must be labeled clearly as `Allow any IP` and represented by an explicit toggle/confirmation, not an unexplained tag.
- Edit mode leaves password optional and visually secondary.
- Footer contains Cancel and one gold Create/Save button.

## `/logs`

This is the densest screen and should look like an audit console.

- One toolbar: search, action filter, status filter, Refresh, Export.
- Desktop table columns: timestamp, user/role, action, resource, details, IP, status.
- Details may truncate to one line with tooltip/expand affordance.
- Use monospace only for IP, record IDs, and technical values.
- Keep status semantic and low prominence.
- Mobile uses chronological records with timestamp first and expandable details.
- Empty state distinguishes no data from no filtered results.

## `/auth/inactive`, `/restricted`, and Loading States

Use one system-state template:

- charcoal full-screen background;
- KK Sports logo;
- one 400-480px white surface or clean unframed light content area;
- semantic icon and concise heading;
- account/context details only when useful;
- one clear next action;
- `KK Sports Operations` footer label.

Restricted and inactive states must not use the old InventoryOS brand. Loading states should use the shared KK Sports mark and a subtle progress indicator, not a blank route.

## Toasts, Confirmations, and Messages

- Standardize titles and sentence case.
- Success toast: what changed.
- Error toast: what failed and whether the user can retry.
- Confirmation: name the record and consequence.
- Avoid generic `Success` and `Error` headings when a specific message is available.
- Preserve existing system behavior while improving copy and visual consistency.
