# Admin blueprint

A **menu of possibilities**, not a template. A full admin is built from the modules this product actually needs, arranged the way this product's operators work, and rendered in this product's own design. Two different websites must end up with visibly different admins. If swapping the models between two products would leave the admin unchanged, it was templated, and it is wrong.

## 0. Make it this product's admin

Do this before choosing any module. Write a short **admin brief** (optional note, `.readyvibe/admin-brief.md`, or in your reply):

1. **Product type and operators.** A marketplace, a newsletter, a course platform, a portfolio with a CMS, a booking site, a SaaS, a store, and a community each have different operators doing different work. Who operates this one (the owner alone, a support team, moderators, a content editor), and what are their five most frequent tasks?
2. **Vocabulary.** Use the product's own words from its models and copy: *Listings, Hosts, Bookings* rather than *Items, Users, Orders*; *Members* or *Students* or *Subscribers* rather than *Users*. Labels, empty states, and confirmations speak in the product's voice.
3. **Information architecture.** Order and group navigation by what operators do most, not alphabetically or by a default list. A newsletter's admin opens on subscribers and issues; a marketplace's on listings awaiting review and open disputes; a portfolio's on the pages and messages. Merge or split modules to match how the domain thinks (a booking and its payment can be one screen; a rarely used settings area can be a single page).
4. **Landing view.** The first screen is the operators' daily "what needs me?" for *this* product, built from real queries. It is not a stack of generic stat cards.
5. **Navigation pattern and density from the app itself.** Follow the site's own navigation idiom (sidebar, top bar, tabs, command palette) and its personality: airy and editorial vs. compact and tool-like, rounded vs. sharp, playful vs. formal, dark vs. light. Table density, spacing, iconography, and type scale come from the existing pages.
6. **Depth.** Give the operations that matter most real workflows (an approval flow, a review queue with keyboard shortcuts, a bulk-edit), and keep rarely used areas simple. Build for the product's real volume: an inbox of a few messages a day wants a simple list; ten thousand listings want filters and saved views.
7. **Different information, different components.** A calendar for bookings, a kanban for an approval pipeline, a media grid for a gallery, a table for records: choose the view that fits each entity's shape, from the project's own components.

The sections below are the parts you may draw on after this brief exists.

## 1. App shell (shape it to the product)

- Layout in the project's own shell and navigation idiom: sidebar, top navigation, or tabs, grouped by the product's own concepts, current-page indication, user menu with sign-out, link back to the public site.
- Responsive: sidebar collapses to a drawer on small screens; tables scroll inside a container instead of overflowing the page.
- Same theme handling as the app (dark mode, RTL, locale) if the app has it; nothing the app lacks.
- Page title pattern, breadcrumbs for nested views, consistent page header (title, primary action).
- `noindex`, not in the sitemap, not linked from public navigation, not listed in `robots.txt` as a hint.
- Error boundary, 404 inside the shell, 403 page for signed-in non-admins.

## 2. Landing page (built from the brief)

Only real numbers from real queries: counts of the entities the app has, recent items (latest signups, latest submissions, latest orders), and an "attention" list (unhandled submissions, pending privacy requests, open reports, failed payments). Every card links to its filtered list. If a figure has no query behind it, leave it out. A chart appears only when a real time series exists and the owner wants it; label its source and range.

## 3. Possible modules (include only what this app has; rename, merge, split, and reorder freely)

| Module | Derive from | Screens and actions |
|---|---|---|
| **Users** | user/profile table, auth provider | list with search, filter (role, status, signup date), sort, pagination; detail with related records; edit profile fields; change role; suspend/reactivate; resend verification; delete or anonymize through the app's real deletion path (`data-rights`) |
| **Roles and access** | role column, claims, permissions table | list admins and roles, grant and revoke with confirmation, prevent removing the last admin, show who changed what |
| **Content** (posts, pages, products, listings, media) | each content entity | list, create, edit with validation, publish/unpublish, delete with confirmation, slug and metadata fields, media picker only if media storage exists |
| **Orders and payments** | order tables, payment provider | list and detail from synced tables or the provider's server API; status; link to the provider dashboard for refunds and disputes; in-app refund only through the provider's server API with confirmation and audit |
| **Subscriptions** | subscription tables, provider | plan, status, renewal date, cancel-at-period-end; link out for anything the app does not already do server-side |
| **Support inbox** | contact/feedback/waitlist submissions | list with status (new, handled), read, mark handled, reply link, export if needed |
| **Privacy requests** | data-rights flow or request table | queue of access/deletion/export requests with received date and status; run the app's verified deletion/export; record outcome (`data-rights`) |
| **Moderation** | reports table, user content | report queue, view reported item in context, remove, warn or suspend user, decision log (`user-content-safety`) |
| **Email and marketing** | subscribers, suppression list | subscribers with status, suppression list, manual suppress and reinstate, unsubscribe source (`email-compliance`) |
| **Settings and flags** | config table or feature-flag store the app already has | edit only real settings; no invented preferences |
| **Audit log** | audit table (`admin-audit-log`) | read-only searchable log: actor, action, target, time; no secrets |
| **Application-specific** | anything the domain needs | approve a listing, issue a credential, moderate a review, manage a booking: whatever this product's operators do |

## 4. Standard patterns

- **Data table:** server-side pagination, search, filters and sort over real columns; column visibility; empty, loading, and error states; row actions in a menu; bulk actions only where safe (never bulk delete without a count and confirmation); export only what the task needs. Reuse the project's table component or table library (for example TanStack Table) if present.
- **Detail and edit:** read view first; edit form with visible labels, required and format validation on the client and on the server, inline errors associated with fields, disabled-while-saving, success message; unsaved-changes warning.
- **Destructive actions:** confirmation dialog naming the target and consequence; irreversible actions say so; audit entry written server-side.
- **Forms and inputs:** the project's form components; correct input types; no placeholder-only labels.
- **Accessibility:** semantic tables and headings, keyboard operation including dialogs and menus, visible focus, announced errors (`wcag-readiness`).
- **Sensitive data:** show the minimum; mask by default where useful (email domain, last digits) with an explicit reveal that is logged; never render secrets, tokens, password hashes, or full payment data.

## 5. Access control (never optional)

Authentication and authorization are enforced **on the server** for every admin page load, API route, and server action. Client-side guards, hidden links, and middleware alone are not sufficient (`admin-authorization`).

- **Next.js:** check the session and role inside each server action and route handler, and again in the page's server component; do not rely on `middleware` alone; never pass the service credentials to the client.
- **Supabase:** admin reads and writes use row-level security policies keyed to a role the user cannot edit themselves; anything that needs elevated rights runs in server code with the service role key, which must never reach the browser or a `NEXT_PUBLIC_*` variable.
- **Firebase:** roles as custom claims set by trusted server code (Admin SDK), verified server-side; Firestore rules match.
- **Auth libraries (NextAuth, Clerk, Auth0, Lucia):** put the role in the session from a trusted source, and re-check it server-side per request.
- **First admin:** bootstrap once through an allow-listed email in server environment configuration or a seed command that prompts for a password. Never ship default credentials or a "first user becomes admin" rule that can be raced in production.
- **Schema changes** (adding a role column or table) are migrations: propose them, apply locally, and get the owner's confirmation before anything else.

## 6. Using what the project already has

- If the project already uses an admin framework (react-admin, Refine, AdminJS, Payload, Strapi), extend it rather than building a parallel admin.
- If it uses a component kit (shadcn/ui, MUI, Chakra, Mantine, Ant Design, Tailwind with its own components), build every screen from that kit and its tokens.
- If it has no reusable components, mirror the dominant styling of its existing pages (fonts, colors, radii, spacing, button and form styles).

## 7. Verification checklist

1. As an admin test user, complete each module's main task end to end on local or staging data.
2. As anonymous and as a normal user, request every admin route and API directly: denial, and no data in the response.
3. Every destructive action wrote an audit entry without secrets, and deletions really remove or anonymize.
4. Every number on screen traces to a query; empty states appear with no data.
5. Compare with an existing app page at laptop and tablet widths: same fonts, colors, components, spacing.
6. Keyboard-only pass through one list, one edit form, and one dialog; check focus visibility and error announcement.
7. **Distinctiveness test:** would this admin be interchangeable with the admin of a different product? Navigation order, labels, landing view, and views per entity should all be recognizably this product's.
8. Anything you could not run is reported UNVERIFIED with what would settle it.
