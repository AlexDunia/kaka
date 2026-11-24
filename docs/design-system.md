# Shared application design system

`src/design-system/tokens.json` owns the application foundation. Generate its CSS aliases with `node scripts/build-design-tokens.mjs`. The global `design-system.css` applies those tokens to public pages, public event profiles, authentication forms, creation screens, and organiser workspaces, overriding the incompatible typography in the imported reference cascades.

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

Spacing was deliberately increased: headings and paragraphs have 24px below them; major sections use 72px on desktop and 56px on mobile; card padding is 40/28px and card gaps are 32/24px. Page rails are 88% with a 1440px cap, and 80% on mobile. These relationships are named tokens so future adjustments update the application together. Diagram artwork and compact metadata retain their own appropriate supporting roles.

`usesPublicShell()` routes landing, discovery, About us, event profiles, authentication, contact, blog, and other public pages through the same `PublicSite` component. The shared header starts at the brand and includes links and account controls. The audience ticker belongs only to Home. On event profiles, the v31 interaction hides the brand header when the first About paragraph reaches the header and tabs; event tabs then pin to the top. Scrolling back restores the brand header. Organiser tools and ticket selection retain their task-specific shells.

The public loader follows the destination page rather than the login state: a stored session no longer suppresses branding on a public page. Fresh loads and forward public navigation show the writing animation; browser Back, same-page changes, and protected tools skip it. Reduced-motion preferences skip animation delays.

The event profile hero uses a light surface, the public H1, date and venue metadata, and an unshaded cover. A failed or absent cover shows an explicit unavailable state, with the image state resetting when the URL changes. The Home ticker measures and clips its repeated groups within its own component. Related-event cards change only their shadow on hover; no pink overlay, border, or movement is introduced. Keyboard focus remains visible.

Verify with `node --test scripts/check-public-site.mjs scripts/check-event-profile.mjs`, `node scripts/check-design-system.mjs`, and `npm run build`. Browser verification remains unavailable because the browser access host cannot connect.
