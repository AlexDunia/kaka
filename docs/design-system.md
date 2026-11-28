# Shared application design system

`src/design-system/tokens.json` owns the application foundation. Generate its CSS aliases with `node scripts/build-design-tokens.mjs`. The global `design-system.css` applies those tokens to public pages, public event profiles, authentication forms, creation screens, and organiser workspaces, overriding imported reference typography except for the public event-profile exception below.

The supplied `Rushhour-Design-System/index.html` documents a 32/24/20/16px heading scale, while its companion CSS/JSON still contains 22/18/17/16px. The shared application uses the documented HTML scale, as requested:

| Role | Size / line height | Font / weight |
| --- | --- | --- |
| H1 | 32 / 40px; 28 / 35px mobile | Outfit / 600 |
| H2 | 24 / 30px | Outfit / 600 |
| H3 | 20 / 25px | Outfit / 600 |
| H4 | 16 / 20px | Outfit / 600 |
| Paragraph | 14 / 22.4px | DM Sans / 400 |
| Supporting text | 12 / 18px | DM Sans / 400 |

Public pages override H1/H2/H3 to 40/30/24px, and 24/20/15px on mobile. These values are scoped to `.public-site`, so organiser tools keep the base scale above. Public H4 is 15px on mobile; paragraph sizes stay the same. Both the registry and generated CSS declare the public sizes, and the consuming rules include explicit fallbacks to avoid accidentally reverting to browser-default heading sizes.

Shared heading-to-paragraph spacing is controlled by `rhythm.heading-gap`: headings have 16px below them across the application. Direct heading/paragraph pairs, including reference pages, use this token with no additional paragraph top margin. Paragraphs retain 24px below them; major sections use 72px on desktop and 56px on mobile; card padding is 40/28px and card gaps are 32/24px. Page rails are 88% with a 1440px cap, and 80% on mobile. These relationships are named tokens so future adjustments update the application together. Diagram artwork and compact metadata retain their own appropriate supporting roles.

`usesPublicShell()` routes landing, discovery, About us, event profiles, authentication, contact, blog, and other public pages through the same `PublicSite` component. The shared header starts at the brand and includes links and account controls. The audience ticker belongs only to Home. On event profiles, the v31 interaction hides the brand header when the event navigation anchor reaches the header; event tabs then pin to the top. Scrolling back restores the brand header. Organiser tools and ticket selection retain their task-specific shells.

The public loader follows the destination page rather than the login state: a stored session no longer suppresses branding on a public page. Fresh loads and forward public navigation show the writing animation; browser Back, same-page changes, and protected tools skip it. Reduced-motion preferences skip animation delays.

The event profile hero uses a light surface, the public H1, date and venue metadata, and an unshaded cover. A failed or absent cover shows an explicit unavailable state, with the image state resetting when the URL changes. The Home ticker measures and clips its repeated groups within its own component. Related-event cards change only their shadow on hover; no pink overlay, border, or movement is introduced. Keyboard focus remains visible.

Verify with `node --test scripts/check-public-site.mjs scripts/check-event-profile.mjs`, `node scripts/check-design-system.mjs`, and `npm run build`. Browser verification remains unavailable because the browser access host cannot connect.

## Public mobile heading scale

At widths up to 768px, and on coarse-pointer touch screens up to 1000px, public H1/H2/H3/H4 use 24/20/15/15px. The named `public-h1-mobile` through `public-h4-mobile` tokens own this scale. It applies to all public-page shells, including event profiles, browsing, authentication, ticket selection, and checkout, whether or not a visitor is signed in. It does not apply to organiser dashboards or event creation.

Keep the homepage hero unchanged: its H1 retains the existing 34px shared size through `public-home-hero-h1-mobile`. Exclude all headings inside `.public-site--home .hero` from the mobile heading overrides. Change only font size; retain fonts, weights, line heights, spacing, colours, and behavior. New public mobile headings must use this shared scale rather than larger page-specific sizes.

## Public event-profile exception

The public event detail/About experience, including unauthenticated visitors, owns its typography and scroll interaction. `Rushhour_Ticket_v31_Event_Profile.html` is authoritative for these details; shared application paragraph and control font rules must not override descendants of `.event-profile`. Desktop headings retain the reference typography; mobile headings follow the public mobile scale above. The same viewer page stays consistent when an organiser is signed in. Organiser workspaces and other pages continue to use the shared system.

Use the existing v31 cascade in `src/styles/event-profile-reference.css`: DM Sans body text and tabs, Outfit headings, reference desktop font sizes, weights, line heights and letter spacing; apply the shared public heading sizes on mobile. Keep event data, flyer sizing, layout, and business behaviour intact. `design-system.css` scopes compatibility fixes for the public shell without replacing the reference typography.

Each tab is its own relative positioning container. Only the active tab has a short pink underline beneath its label; no pink line spans the header. Inactive tabs use the reference muted grey, with full opacity and no blur. The opaque section bar replaces the brand header when the always-present event navigation anchor reaches the public header, using one animation-frame scroll handler and the reference transition. Scrolling back restores the brand header; reduced motion disables transitions. Do not add backdrop blur or independent competing scroll handlers.

Mobile event profiles use `event-profile-mobile.css`: a full-width cover at 78svh (78vh fallback), centred crop, square edges and circular back/share/save controls. The site masthead is omitted on this screen; the event section navigation sticks at the top with account controls. Event content rails are 85% on desktop and 80% on mobile. The mobile layout applies through 768px and to coarse-pointer touch screens through 1000px, including phone landscape. Cover actions have 44px touch targets; purchase buttons wrap and grow, with safe-area padding. Desktop hero presentation is retained.

## Popup motion

All pop-ups use `src/styles/popup-motion.css`, imported once in `src/main.js`.
The shared motion tokens in `src/design-system/tokens.json` set a 280ms entrance,
180ms exit, 12px lift, and 0.965 initial scale. The entrance eases gently into place;
the exit is quicker. Do not add separate per-component animation timings.

Native `<dialog>` elements and native popovers inherit this automatically, including
teleported search, sharing, notifications, discounts, support, bank, and schedule dialogs.
CSS starting styles and discrete display/overlay transitions keep the closing surface
visible through its exit without delaying application state or changing focus handling.
Browsers without discrete-transition support retain their native closing behaviour.

For a conditional Vue menu or overlay, wrap the conditional root in
`<Transition name="rh-popup">`. Keep the existing close handlers and keyboard controls.
Mark full-screen dimming layers with `data-popup-overlay` and their direct content panel
with `data-popup-panel`; only the panel lifts and scales, while the backdrop fades in place.
Do not animate the page underneath. Keep existing layout, colours, and typography.

`prefers-reduced-motion: reduce` removes popup movement and transition delays across
native dialogs, Vue overlays, menus, and toasts. Confirmation and pending states stay visible.

## Event cards

Use `src/styles/event-cards.css` for event listings, related events, and event previews.
The `event-card` tokens set a 320px maximum width, 1.9 cover aspect ratio, 4px corners,
and a 700 price weight. Keep prices, including Free, bold and easy to find.
Use three columns on desktop, two on tablets, and one on small phones. Cards shrink
within the shared page rails and keep the same maximum width in every context.
Do not add page-specific card dimensions or rounding. Keep titles and metadata at
the existing compact type sizes, with a consistent inset and spacing.

### Mobile discovery cards

At 760px and below, the Find events grid uses two equal columns across the 80% page
rail. Cards fill their column, with 12px between columns and 32px between rows.
Mobile event names use 16px text at regular (400) weight and 1.25 line height; desktop names use 18px. Prices use the brand pink and retain their bold weight.
Show four events first, then reveal four more with Show more; keep server pagination.
Desktop discovery cards fill four equal columns, with 24px between columns and 48px
between rows. The discovery grid has 16px top and bottom padding at all sizes.
Related category choices share one expandable tile;
each choice keeps its original database category filter.

Mobile discovery cards use a soft all-around shadow plus a lower shadow without a border, with 8px top and side,
and 12px bottom content padding. Mobile covers use a 2:1 ratio. Date badges use
16px days and 9px months; category and event details use quiet 11px text. Keep the
price bold and pink. A brief 0.99 scale gives touch feedback, disabled for reduced motion. On mobile, categories scroll three at a time with 80px artwork; the event filter
uses a labeled 44px category select with 12px text, without horizontal scrolling. The mobile public header uses 44px search, cart, and menu controls; search
is icon-only, the cart uses the same 3D cart as desktop, and account access sits inside the menu.
Header rails are 90% on mobile to fit the controls; event content stays at 80%.

Search controls use outline close, dropdown chevron, and forward arrow icons; retain
3D search artwork. Explore events uses the public H3 size (24px desktop, 15px mobile)
at medium weight, with a 24px gap before filters; omit the event count.
Category chips use small text, medium weight, control corners, and token spacing.

Mobile cards have a 4px surface inset around the cover and a two-layer shadow
(0 0 8px at 8%, 0 4px 12px at 7%) so all four edges remain visible. Below 375px,
use one fluid column with 24px row gaps; from 375px through 760px, retain two columns.
Keep the 80% content rail, readable text, natural wrapping, and identical card styling
in both layouts. Cover sizing includes a fallback for browsers without aspect-ratio.

On mobile (up to 760px), category tiles form one horizontally scrollable row showing
three tiles, with previous/next controls on the right of the heading. Controls disable
at the corresponding end and respect reduced motion. Desktop category tiles keep their original
wrapped grid layout. The mobile event dropdown says All event categories; its accessible
label is Filter events by category, without a separate visible label.

## Organiser tabs and mobile headings

All organiser tablists use pink selected text and a 1px pink underline. Tabs have no
horizontal padding, so the underline matches the icon and label; use 16px icons and
an 8px icon gap. Keep 44px minimum tap height and keyboard behavior.
Mobile organiser H1/H2/H3 reuse the public mobile 24/20/15px scale. Intro paragraphs
use small (12px) text; summary values and labels retain their existing sizing.
Hide/show amount controls use outline eye and eye-off symbols with their existing labels.

Organiser tab rows use 24px between tabs and 32px below the row before content,
on both desktop and mobile. Keep the underline aligned to the label and icon.

Desktop discovery cards have a soft all-around resting shadow, a 4px surface inset,
and 16px bottom content padding. Hover and keyboard focus deepen the shadow without
moving the card or changing its border. Use 56px between desktop rows and 24px above
and below the grid. Reduced motion removes the shadow transition.

Public header cart and menu controls use the saved 3D artwork on every screen; menu
open and close states remain distinct app symbols. Search-popup close, dropdown and
forward controls remain outline icons. Mobile popup inputs keep a 44px tap height,
regular text, compact token spacing, and an in-field search placeholder.
No-event results show a 64px 3D search icon with a gentle 8px float and 5-degree sway;
reduced motion stops it. The popup city field accepts any city supported by the
existing exact-city API filter, offers the existing four city suggestions, and leaves
location optional. It does not infer a current location or claim live place suggestions.

Mobile header artwork uses 18px search and 21px cart/menu icons, retaining 44px tap
areas and 8px between controls (4px below 360px).
