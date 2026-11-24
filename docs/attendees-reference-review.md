# Attendees: reference comparison and implementation

Reviewed on 23 November 2026 against `C:\Users\HP\Downloads\Rushhour_Overview_Hero_Updated.html`, including its later CSS, the main prototype script, buyer-photo/email-copy script and guest-navigation tooltip script. The supplied files are product references; their storage-reset and standalone routing instructions were not run as application setup.

## Differences repaired

| Reference behavior | Previous Vue behavior | Current implementation |
| --- | --- | --- |
| Paid/free preview changes the whole attendee context | Only two metric labels changed | Registration wording throughout the list and details; source/filter reset; discounts and earnings hidden; tracked social registrations still available; event pricing unchanged. |
| All purchases, Discount codes and Social links are selectable | Generic delegated handlers and partial state | Native Vue tab handlers, selected state, keyboard arrows/Home/End and URL source state. |
| Specific code/channel links filter purchases | Code/channel query parameters were ignored | `source`, `code`, `channel`, `tier` and weekly query filters are respected. |
| Summary figures describe the filtered purchases | Cards showed all orders and guests | Purchase count, unique guest/ticket count and arrived count update with the shown list. |
| Search includes guests inside a grouped purchase | Simplified row presentation | Buyer, order, guest, ticket code and ticket type search; a matching guest note identifies the person inside a purchase. |
| Arrived means entered at least once | Purchase rows counted only people currently inside | A guest who has left remains included in arrived totals and arrival filters. |
| Open purchase navigates to a full page | Purchase opened a modal | Event-scoped `?view=purchase&order=…` page, with reloadable links and Attendees selected in the sidebar. |
| Receipt and guest details appear together | Receipt was another popup | Inline reference receipt, buyer snapshot, ticket names, payment summary, first guest and other guest sections. |
| Guest corrections preserve the purchase buyer | Editing was attached to the modal | Dedicated edit dialog changes only guest name/email; receipt buyer, ticket type and code remain unchanged. |
| Each guest has arrival information and history | Check-in controls replaced the reference flow | Arrival state, latest entry/exit, arrival preference dialog and a separate visit-history page. |
| Scrolling exposes guest navigation | Absent | Reference sticky guest strip, current guest tracking, jump controls and name/status tooltips. |
| Receipt supports photo/copy/print actions | Incomplete or absent | Local buyer photo with type/size validation and square resize; email/code/order copy; reference print sheet. |

## Routes and data

- List: `/dashboard/events/:eventId?view=attendees`.
- Sources: `&source=discount&code=SUNSET10` or `&source=social&channel=whatsapp`; code/channel selection is optional.
- Purchase/registration: `?view=purchase&order=RHO-26001`.
- Guest within the purchase: `&guest=RH-4102`.
- Visit history: `?view=checkin&history=RH-4101`; Back to tickets returns to the purchase and guest.

Attendees and Door check-in share the same in-memory guest and movement records. Preview edits, alert preferences, photos and mode are event-scoped in browser storage. Switching the preview mode does not change the event's actual pricing.

The sample data follows the HTML: 9 purchases contain 12 tickets; 5 discounted purchases contain 8 tickets; 7 socially attributed purchases contain 10 tickets. These are illustrative records, separate from Overview's aggregate sales. Receipt prices follow the HTML's purchase snapshots (Early bird ₦8,000, General admission ₦10,000, VIP ₦22,000), rather than rewriting a receipt from current overview tier prices.

Live guest mutations, ticket delivery and arrival email delivery still need backend endpoints. The interface reports that limitation instead of simulating a sent email or a saved live update. See [the existing-data inventory](event-workspace-data-and-redesign.md) for backend boundaries.

## CSS repairs

The original reference classes are retained for the list, receipt, guest cards, dialogs, history and guest navigation. Twenty-three imported root-state selectors had incorrectly required a nested `data-rh-*` element. They now match the workspace root, restoring state-specific layout and visibility. Attendees uses the final reference canvas. Native dialogs receive an explicit auto margin so the public site's margin reset does not move them to a corner.

The payout reminder follows the reference's page visibility and disappears in free-event preview without leaving an empty header offset.

## Verification

`node scripts/check-attendees.mjs` verifies grouped search and summaries, ticket/arrival/source filters, code/channel/weekly links, entry/exit history, purchase routing/rendering, receipt totals, guest corrections, immutable buyer identity, saved arrival preferences, free/paid switching, registration receipts, navigation payloads and Vue warnings. The existing Overview and workspace checks cover regressions in other views. Targeted ESLint and the production build are also run.

Chrome verification confirmed the rebuilt list, Discount codes and Social links tabs, their 5/8 and 7/10 totals, and Free event switching back to 9 registrations with updated labels and hidden discount/earnings controls. The supplied HTML and Vue list were inspected at desktop width; the responsive list was also observed in the restored narrow window.

Purchase-page visual comparison, native edit/alert focus, upload, clipboard and print dialogs remain unverified in Chrome: the window became minimized and recovery reported active user input. The purchase/history/action checks above exercise Vue state and rendering, and do not substitute for those browser checks. Exact pixel parity is not claimed.
