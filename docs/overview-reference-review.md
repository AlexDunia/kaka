# Overview reference and interaction review

Reviewed on 23 November 2026. This pass covers Overview and the shared controls needed to use it. Other workspace tabs still need their own detailed comparison.

## References and scope

- Visual and interaction reference: `C:\Users\HP\Downloads\Rushhour_Overview_Hero_Updated.html`, including its later CSS overrides and JavaScript handlers.
- Foundations: `C:\Users\HP\Downloads\Rush trial\Rushhour-Design-System\index.html`, `rushhour-system.css` and `rushhour-tokens.json`.
- Supporting reference files: `rushhour-brand.css`, `rushhour-motion.css` and `rushhour-motion.js`.
- Existing collection and API inventory: [Event workspace data and redesign](event-workspace-data-and-redesign.md).

These files are product references. Their reset scripts, storage clearing and standalone routing are not application instructions. Vue owns component state and routing; API requests control real loading states.

## Overview controls

| Control                     | Implemented behavior                                                                                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| View event                  | Opens the organiser event preview; ticket quantities respect available stock and update the subtotal. Hidden ticket types are omitted. Development selections do not issue tickets or take payment. |
| Edit event                  | Opens Settings → Event details for the selected event.                                                                                                                                              |
| Tickets sold                | Opens Attendees.                                                                                                                                                                                    |
| Ticket revenue              | Opens My earnings.                                                                                                                                                                                  |
| Tickets sold this week      | Opens Attendees with `period=week`; the sample purchase list applies the filter and offers Show all purchases.                                                                                      |
| Event page views            | Opens Promote.                                                                                                                                                                                      |
| Hide / Show amounts         | Masks money and remembers the setting for the browser session, including navigation into Earnings and back. Ticket quantities remain readable.                                                      |
| Sales reporting period      | Switches between the API's 7-day, 30-day and all-time series; the chart and expandable data table update together.                                                                                  |
| View sales data             | Native expandable table of the selected series.                                                                                                                                                     |
| View ticket holders         | Opens Attendees.                                                                                                                                                                                    |
| Notifications               | Opens a native modal drawer with a close button, Escape handling, backdrop dismissal, scrollable task/update lists and navigation into the relevant tab.                                            |
| Mark all as read            | Updates unread indicators and saves the read IDs for this event in session storage.                                                                                                                 |
| Payout reminder             | Opens Settings → Payments. Dismissal lasts for the session and is scoped to the event. It appears only when setup explicitly reports a missing account.                                             |
| Sidebar / mobile navigation | Keeps the selected event and opens the selected workspace view; mobile navigation closes after selection.                                                                                           |

The weekly sample list is a small illustration, not a list of all 412 sample tickets. Live organiser purchase filtering still needs the attendee endpoint recorded in the data inventory.

## Data and stage behavior

The countdown uses calendar dates in the event timezone. It no longer trusts the stale sample `days_to_go` value. Draft, on-sale, approaching, event-day and completed states set the reference's stage attribute, so its stage-dependent section visibility and Selling fast labels apply.

Buyer referral rows are ordered by positive attributed buyer counts; zero-buyer and unattributed sources do not become a “leads referrals” insight. Percent bars stay within 0–100%. Invalid, negative and infinite chart values cannot create invalid SVG coordinates. Empty series retain a useful empty state.

Notification completion comes from supplied setup flags or the existing event cover. Clicking a task does not falsely mark it complete. Missing production setup flags do not produce invented account/security status.

## Design foundations and repaired imports

Overview adopts the supplied DM Sans / Outfit typography, 400/500/600 weights, 22px page headings, 18px section headings, 24px headline metrics, 20px secondary metrics, 6px controls, 8px cards and the supplied brand/text/border tokens. The latest reference hero remains full width with an 85% content rail and its compact countdown. Controls use sentence case and visible keyboard focus.

Public-site button and form defaults are reset within the workspace before the reference styles apply. This removes inherited uppercase labels, pill-shaped buttons, wide input defaults and unrelated link colors. Brand wordmark rules come from the supplied brand stylesheet.

The earlier import had replaced `body` inside 24 class/ID selectors, including `.np-body` and `.rh29-event-card-body`. Those selectors are restored. The notification drawer's content scrolls independently within the available height.

## Verification and limits

- `node scripts/check-overview.mjs`: countdown and all five stages, chart edge cases and ranges, referral ranking, navigation payloads and URLs, weekly guest filtering, Settings/Earnings deep links, shared privacy, notification actions and session state, and preview quantity limits/subtotal.
- `node scripts/check-event-workspace.mjs`: eight workspace views, Vue warnings, loading/error/empty states, grouped guest search, attribution filters, entry/exit behavior and discount statuses.
- Targeted ESLint checks for the changed Vue/JavaScript files and production `npm run build`.

The interaction checks exercise Vue state and handlers through server rendering; they are not browser end-to-end tests. Native Chrome automation repeatedly lost access to a minimized window or reported active user input. Desktop/mobile visual comparison, actual dialog focus behavior and real pointer/keyboard operation therefore remain unverified. This pass does not claim pixel-perfect parity.

The existing backend still lacks the organiser attendee, notification/setup, messaging, discount management, check-in and payout endpoints listed in the data inventory. Development examples remain separate from live operations. No message, check-in or payment was sent by these checks.
