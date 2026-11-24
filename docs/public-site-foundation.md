# Public site foundation

The public landing page uses the supplied `Rushhour_Tickets_v13_Restored_Home_Seamless_Ticker.html` as its visual reference. Colours, fonts, and semantic tokens come from the supplied `Rushhour-Design-System` folder. Embedded scripts were inspected as reference behaviour; they are not executed or embedded in the Vue application.

- `/` renders the v13 landing, original product illustrations, animated audience strip, event moments, and the supplied Cloudinary hero image.
- `/find-events` renders discovery. `/search` and the existing category URLs use the same Vue page. Query, city, category, and page live in the URL.
- `/about` and `/about-us` share a small About us page because the reference does not contain one.
- Event cards open the existing `/events/:id-:slug` route. Its organiser content remains intact; the latest design-system update replaces the hero presentation and shares the public header.
- Public routes, including event profiles and authentication pages, now share `.public-site`. The global typography and spacing authority is documented in `docs/design-system.md`; it also applies to authenticated workspaces.
- The audience ticker renders only on Home. The shared header starts with Rush Hour Ticket. Event profiles follow the supplied v31 interaction: at the first About paragraph, the brand header slides away and the event tabs pin to the top; scrolling back restores it. Full-screen ticket selection keeps its own header.
- Selected v7 details: the public header uses its translucent white background and 16px backdrop blur; Home reveals a compact greeting beneath navigation after the hero, on mobile and desktop. The greeting links to Find events and its occasional hand wave respects reduced motion. Home navigation is marked in brand pink. Catalog cards retain the v7 cover/date layout with 16px horizontal text padding; API content and the public heading scale remain intact.

## Loading

Fresh loads and forward public navigation show the singular `rushhourticket` writing animation, followed by a brief skeleton and reveal. The loader follows the public destination, so a session no longer suppresses it. Browser Back, same-page filters/anchors, and protected tools skip the brand loader. Reduced motion removes animation delays. Account discovery runs after mounting, avoiding an empty screen before the loader.

## Database catalog

`publicCatalog.js` requests `/api/categories` and `/api/events`, respecting `VITE_API_URL` when configured. It never uses the static event catalog or sample fallback data. Category identifiers stay intact; short display labels do not rename database values.

The current Laravel endpoint supports `category_id`, pagination, and sorting, but no text search or city filter. For text/city searches the client fetches all matching API pages, filters the complete collection, and then paginates it. For a much larger catalog, add server-side text and city filters and replace this adapter. Failed requests show a retry action; empty results remain empty.

## Verification

Run `npm run build` and `node --test scripts/check-public-site.mjs scripts/check-event-profile.mjs`. Checks cover Vue template compilation, public-shell rendering, loader navigation, complete-result filtering, database category identifiers, cancellation, and the existing event profile behaviour. Live read-only API checks confirmed the backend serves categories and events.

Browser access was denied during implementation, so visual comparison, responsive layout inspection, and real-browser interaction checks remain outstanding. The preview server is available at `http://localhost:5174`.

## Direct reference cross-check

The follow-up source audit corrected the logo colour, ticker duration, page-specific footer links, mobile category layout, missing discovery greeting, and carousel restart behaviour. Shared CSS and each page’s original overrides now remain separate, so discovery overrides cannot affect the landing. Extra catalog states live in `public-catalog.css`.

`node scripts/check-reference-replica.mjs` compares the supplied HTML against the complete generated reference stylesheet, five category SVGs, ten original artwork files, two product SVGs, feature rows, and event moment cards. `node scripts/sync-public-reference.mjs` regenerates the stylesheet from the supplied HTML. Both accept an alternative source filename as their first argument.

The requested singular brand name, Cloudinary hero, database events/categories, and working application routes remain intentional differences. The latest request additionally supersedes reference typography and spacing with the shared design system and uses one public header everywhere. The original sample-event disclaimer is omitted because discovery shows database content. Browser access was unavailable for the follow-up audit, so the reference check verifies retained source artwork and declarations rather than pixel-level rendering.
