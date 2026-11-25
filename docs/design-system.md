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

Public pages override H1/H2/H3 to 40/30/24px, and 34/28/22px on mobile. These values are scoped to `.public-site`, so organiser tools keep the base scale above. H4 and paragraph sizes stay the same. Both the registry and generated CSS declare the public sizes, and the consuming rules include explicit fallbacks to avoid accidentally reverting to browser-default heading sizes.

Shared heading-to-paragraph spacing is controlled by `rhythm.heading-gap`: headings have 16px below them across the application. Direct heading/paragraph pairs, including reference pages, use this token with no additional paragraph top margin. Paragraphs retain 24px below them; major sections use 72px on desktop and 56px on mobile; card padding is 40/28px and card gaps are 32/24px. Page rails are 88% with a 1440px cap, and 80% on mobile. These relationships are named tokens so future adjustments update the application together. Diagram artwork and compact metadata retain their own appropriate supporting roles.

`usesPublicShell()` routes landing, discovery, About us, event profiles, authentication, contact, blog, and other public pages through the same `PublicSite` component. The shared header starts at the brand and includes links and account controls. The audience ticker belongs only to Home. On event profiles, the v31 interaction hides the brand header when the event navigation anchor reaches the header; event tabs then pin to the top. Scrolling back restores the brand header. Organiser tools and ticket selection retain their task-specific shells.

The public loader follows the destination page rather than the login state: a stored session no longer suppresses branding on a public page. Fresh loads and forward public navigation show the writing animation; browser Back, same-page changes, and protected tools skip it. Reduced-motion preferences skip animation delays.

The event profile hero uses a light surface, the public H1, date and venue metadata, and an unshaded cover. A failed or absent cover shows an explicit unavailable state, with the image state resetting when the URL changes. The Home ticker measures and clips its repeated groups within its own component. Related-event cards change only their shadow on hover; no pink overlay, border, or movement is introduced. Keyboard focus remains visible.

Verify with `node --test scripts/check-public-site.mjs scripts/check-event-profile.mjs`, `node scripts/check-design-system.mjs`, and `npm run build`. Browser verification remains unavailable because the browser access host cannot connect.

## Public event-profile exception

The public event detail/About experience, including unauthenticated visitors, owns its typography and scroll interaction. `Rushhour_Ticket_v31_Event_Profile.html` is authoritative for these details; shared application heading, paragraph, and control font rules must not override descendants of `.event-profile`. The same viewer page stays consistent when an organiser is signed in. Organiser workspaces and other pages continue to use the shared system.

Use the existing v31 cascade in `src/styles/event-profile-reference.css`: DM Sans body text and tabs, Outfit headings, reference font sizes, weights, line heights and letter spacing. Keep event data, flyer sizing, layout, and business behaviour intact. `design-system.css` scopes compatibility fixes for the public shell without replacing the reference typography.

Each tab is its own relative positioning container. Only the active tab has a short pink underline beneath its label; no pink line spans the header. Inactive tabs use the reference muted grey, with full opacity and no blur. The opaque section bar replaces the brand header when the always-present event navigation anchor reaches the public header, using one animation-frame scroll handler and the reference transition. Scrolling back restores the brand header; reduced motion disables transitions. Do not add backdrop blur or independent competing scroll handlers.

Mobile event profiles use `event-profile-mobile.css`: a full-width cover at 78svh (78vh fallback), centred crop, square edges and circular back/share/save controls. The site masthead is omitted on this screen; the event section navigation sticks at the top with account controls. Event content rails are 85% on desktop and 80% on mobile. The mobile layout applies through 768px and to coarse-pointer touch screens through 1000px, including phone landscape. Cover actions have 44px touch targets; purchase buttons wrap and grow, with safe-area padding. Desktop hero presentation is retained.
