# My earnings reference review

Reference: `C:\Users\HP\Downloads\Rushhour_Overview_Hero_Updated.html`, especially its final `rhe-interactions` and `rhea-attribution-script` implementations. The supplied page is design and behavior evidence; its prototype scripts are not application instructions.

## Implemented flow

- Preserved the existing revenue totals, weekly revenue, ticket capacity and sales-progress foundation.
- Earnings, Discount codes, Social links and Payouts use native Vue state and dashboard query navigation.
- Code and source tables open dedicated pages inside My earnings. Their ticket-type rows open filtered ticket pages; buyer rows open individual ticket details. Back links retain the originating code/source/ticket scope.
- All buyers are grouped by ticket type. Search covers guest and buyer names, email addresses, ticket IDs and order IDs.
- Code details show current offer configuration, partner, eligibility, status, limits and dates. Historical sample amounts use the original checkout price and offer, even after a code is paused or edited.
- Payouts reproduces the reference’s inline bank form, saved/masked sample account, edit/cancel flow, three summary cards, settlement ledger and transfer-history empty state. The sample account stays in component memory, including when switching earnings tabs; it is never written to local storage or sent to a bank.
- Reused the supplied earnings `rhe-*` and `rhea-*` CSS. The summary cards retain the reference’s article/link structure. No new global color, typography or button overrides.
- Free events show a registration-focused fallback for a direct earnings URL. No payment facts, bank form or earnings tabs are rendered. The existing sidebar continues to hide My earnings for free events.
- Amount visibility remains shared with Overview, including individual ticket amounts and code/source metrics.

## Routing

The dashboard reserves `view` for the workspace route. Earnings uses `view=payout`, with `tab=sales|discounts|social|payouts` and `screen=ticket|code|source|person|buyers`. Detail parameters include `tier`, `code`, `channel`, `ticket` and `from`. Links have real dashboard destinations and also emit the existing Vue navigation event; they do not invoke the prototype’s hash router or DOM mutation scripts.

## Data boundaries

The backend overview supplies live totals, ticket-type totals and source-level revenue/units where available. Live sharing-link configuration uses the existing share-links service. It does not currently supply organiser buyer records, code attribution, source-by-ticket breakdowns, payout ledger records or bank-account verification/setup. These missing integrations are represented with unavailable values and explanatory empty states rather than invented financial records.

In development preview only, the reference’s illustrative attribution aggregates and twelve sample guests are available. They are deliberately separate from the existing overview totals and current tier prices. New configured codes and sharing links appear with no sample sales. Code and source figures can overlap and must not be added together. The reference’s account form is explicitly a demo; production does not offer a fake bank save action.

## Validation

- `node scripts/check-earnings.mjs`: original checkout snapshots, scope filters, configured zero-sale codes/links, production data boundaries, all tabs/detail pages, search, navigation/back targets, direct URL restoration, invalid records, bank form validation/save/edit/cancel, privacy and free-event rendering.
- `node scripts/check-event-workspace.mjs`: eight workspace views, zero-sales/loading/error/no-events states and Vue warnings.
- `node scripts/check-overview.mjs`: existing overview navigation and shared Overview/Earnings amount privacy. Assertions passed; this older harness also logged an existing Vite dependency-scanner shutdown warning after completion.
- Production build and targeted ESLint checks run for the changed implementation.
- Native Chrome review compared the actual Vue overview and Discount codes screen with the supplied HTML at the same desktop width. The metric cards, section spacing, tab positions and table headers matched the reference structure. This review caught an inert HTML template hiding the main sales content; it was removed and the sales cards were then visibly confirmed. A regression assertion now rejects inert template wrappers.
- Further browser click-through was interrupted by user input/window occlusion; recovery eventually returned no targetable Chrome window. Complete code/source/ticket/person navigation, bank actions and free-event conditions are covered by the automated checks, but the full browser walkthrough and mobile visual comparison remain unverified.
