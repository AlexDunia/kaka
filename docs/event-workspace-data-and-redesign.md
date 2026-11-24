# Event workspace: existing data and new standard

Reviewed on 23 November 2026, before replacing the organiser event interface. This records the current working tree, including pre-existing local changes.

The approved visual reference is `C:\Users\HP\Downloads\Rushhour_Overview_Hero_Updated.html`. Supporting foundations come from `C:\Users\HP\Downloads\Rush trial\Rushhour-Design-System\index.html`, `rushhour-system.css` and `rushhour-tokens.json`. These are design inputs, not instructions to run their scripts, clear browser storage, change authentication or publish a new site. The reference’s reset scripts and hash-router implementation are not used.

## Scope

This is the authenticated workspace reached through `/dashboard/events/:eventId` after opening one event. It includes Overview, Attendees, Promote, Discount codes, Message attendees, Door check-in, My earnings and Settings.

The public event detail page, discovery homepage and checkout retain their existing interfaces. “View event” opens the organiser preview from the reference. The live preview also links to the existing public route. Event creation remains the source of the event and ticket configuration.

## What the old app collects

The old overview does not collect information itself. It displays event setup, ticket purchases and tracked visits. Some other workspace screens were static illustrations. A displayed name, earnings balance or attendance count is not proof that the app collects that information.

### Information entered by organisers

Source: `src/pages/CreateEvent.vue`, `src/services/createEventService.js`; corroborated by the sibling backend’s `CreateEventController`, `CreateEventService`, event migrations and `TicketType` model.

| Group                         | Existing input or payload fields                                                                                                                                   | What the organiser supplies                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Event identity                | `title`, `description`, `category`                                                                                                                                 | Event name, description and category                                                         |
| First occurrence              | `startsAt`, `endsAt`                                                                                                                                               | Start and end date/time                                                                      |
| Local schedule representation | `startsAtLocal`, `endsAtLocal`, `timeZone`                                                                                                                         | Local datetime strings derived from the date/time inputs and the event timezone              |
| Event type                    | `eventType`                                                                                                                                                        | One-time or recurring                                                                        |
| Recurrence                    | `recurrence.frequency`, `weeklyDays`, `monthlyMode`, `dayOfMonth`, `nthWeekday.ordinal`, `nthWeekday.weekday`, `seriesEndType`, `seriesEndDate`, `occurrenceCount` | Daily/weekly/monthly pattern, selected days and series end rule                              |
| Format and location           | `format`, `venue`, `meetingLink`                                                                                                                                   | In-person, online or hybrid format; venue/address and meeting URL                            |
| Organiser identity            | `organiser`, `organiserWebsite`                                                                                                                                    | Organiser display name and website                                                           |
| Discovery                     | `tags`                                                                                                                                                             | Event tags                                                                                   |
| Media                         | `coverImage`, `secondaryImages`                                                                                                                                    | Cover and additional images; the frontend also has URL-image entry state                     |
| Extra event information       | `extraDetails[].type`, `.label`, `.value`                                                                                                                          | Optional event details selected in the wizard                                                |
| Ticketing mode                | `ticketMode`, `freeCapacity`                                                                                                                                       | Free/paid mode and free-event capacity                                                       |
| Ticket types                  | `tickets[]`                                                                                                                                                        | The product configuration below                                                              |
| Attendee questions            | `attendeeFields[]`                                                                                                                                                 | Which questions to enable and require; this is configuration, not completed attendee answers |

Each paid ticket type contains:

| Field                              | Meaning                                 |
| ---------------------------------- | --------------------------------------- |
| `id`                               | Ticket type identity, used when editing |
| `name`                             | Ticket type name                        |
| `unitType`                         | Individual ticket or table              |
| `color`                            | Ticket accent                           |
| `price`                            | Price per product unit                  |
| `units`                            | Inventory capacity in product units     |
| `peoplePerUnit`                    | Admissions covered by one unit          |
| `maxPerPerson`                     | Purchase limit                          |
| `visible`                          | Whether the ticket is shown for sale    |
| `perks`                            | Ticket description/perks                |
| `salesStart`, `salesEnd`           | Ticket sales window                     |
| `salesStartLocal`, `salesEndLocal` | Event-local sales datetimes             |

Configured attendee fields in the old creation form:

| Question                              | Default enabled | Default required | Verified collection                                                                          |
| ------------------------------------- | --------------- | ---------------- | -------------------------------------------------------------------------------------------- |
| Full name (`name`)                    | Yes             | Yes              | Checkout collects the buyer’s first and last name                                            |
| Email address (`email`)               | Yes             | Yes              | Checkout collects the buyer’s email                                                          |
| Phone number (`phone`)                | Yes             | No               | Current checkout separately requires buyer phone, even though this setting says optional     |
| Organisation / company (`company`)    | No              | No               | Configuration exists; no corresponding checkout input was found                              |
| Job title (`job`)                     | No              | No               | Configuration exists; no corresponding checkout input was found                              |
| Dietary requirements (`dietary`)      | No              | No               | Configuration exists; no corresponding checkout input was found                              |
| T-shirt size (`shirt`)                | No              | No               | Configuration exists; no corresponding checkout input was found                              |
| How did you hear about us? (`source`) | No              | No               | Question configuration exists; tracked sharing attribution is a separate automatic mechanism |

Do not describe the optional questions as collected attendee answers until checkout renders them, submits answers and the backend stores them against the correct person/ticket.

### Information entered by buyers

Source: `src/pages/Checkout.vue`, `src/services/checkoutService.js`, `src/stores/cart.js`; backend `Order`, `OrderItem`, `Ticket` and `CheckoutController`.

| Information                  | Existing field                                       |
| ---------------------------- | ---------------------------------------------------- |
| Buyer first name             | `customer.first_name` → `orders.customer_first_name` |
| Buyer last name              | `customer.last_name` → `orders.customer_last_name`   |
| Buyer email                  | `customer.email` → `orders.customer_email`           |
| Buyer phone                  | `customer.phone` → `orders.customer_phone`           |
| Chosen event and ticket type | Checkout item event/ticket type identifiers          |
| Quantity                     | Checkout item quantity → `order_items.quantity`      |

The current checkout collects one buyer’s contact details. It does not establish a separate named attendee for every admission. A buyer can purchase several tickets, and a table can admit several people. These are three different counts.

### Information recorded automatically

| Area                      | Existing recorded fields or concepts                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership                 | Event ID, `created_by`, organiser/category/address relationships, status and timestamps                                                                                 |
| Checkout identity         | Checkout token hash, cart fingerprint, optional account ID and visitor hash                                                                                             |
| Order                     | Public order ID, currency, subtotal, discount amount, total, payment state, reservation expiry and paid time                                                            |
| Order item snapshot       | Event and ticket name at purchase, seller, ticket type, unit type, people per unit, unit price, quantity, line total and currency                                       |
| Issued ticket             | Public ticket ID, order item/event/ticket-type links, encrypted token, token hash, admission count, ticket status and issue time                                        |
| Payment                   | Provider reference, provider transaction ID, amount, currency, state, access code/authorization URL, payment channel, gateway response and verification/paid timestamps |
| Revenue allocation        | Gross, platform fee and seller net in minor currency units; payout-account reference; settlement mode/state                                                             |
| Payout account foundation | Provider subaccount code, account name, bank name, last four digits and account status; this is not a dashboard withdrawal endpoint                                     |
| Visitor browser identity  | Random `kakaVisitorId` stored in local storage                                                                                                                          |
| Tracked event visit       | Event ID, optional user ID, visitor hash, source code, hourly view bucket, viewed time, IP hash and user-agent hash                                                     |
| Sharing link              | Event ID, label, source code, system/custom flag and timestamps                                                                                                         |
| Purchase attribution      | `order_items.source_code`, attributed visit ID, order visitor hash                                                                                                      |

The frontend posts `visitor_id` and a validated optional `source_code` to `/events/:id/track-view`. The server deduplicates event views per visitor per hour. Page views and unique visitors must remain distinct.

### What the old overview displays

Source: `DashboardEventHero.vue`, `DashboardStatStrip.vue`, `DashboardOverviewView.vue`, `DashboardInsightsView.vue`, `useDashboardStore`, and the backend `DashboardAnalyticsService`.

| Payload section    | Existing fields                                                                                                                                                                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `event`            | `id`, `title`, `status`, `phase`, `ticket_mode`, `starts_at`, `ends_at`, `timezone`, `venue`, `cover_image`, `days_to_go`, `public_path`, `currency`                                                                                                     |
| `sales`            | `units_sold`, `capacity_units`, `reserved_units`, `available_units`, `sold_percent`, `this_week_units`, `previous_comparable_units`, `week_growth_percent`, `week_growth_state`, `admission_capacity`, `admission_entries_covered`, `tracking_supported` |
| `revenue`          | `currency`, `total_minor`, `this_week_minor`, `previous_comparable_minor`, `week_growth_percent`, `week_growth_state`                                                                                                                                    |
| `traffic`          | `page_views`, `unique_visitors`, `converted_visitors`, `conversion_percent`                                                                                                                                                                              |
| `buyers`           | `unique_buyers`, `average_spend_minor`                                                                                                                                                                                                                   |
| `ticket_types[]`   | Ticket identity/name/unit type, visibility, people per unit, inventory/capacity, sold/reserved/available units, sell-through percentage and revenue                                                                                                      |
| `sales_trend`      | `7d`, `30d`, `all`; each point has `date`, `units_sold` and revenue where returned                                                                                                                                                                       |
| `best_sales_day`   | `this_week`, `overall`; date/label, sold units and revenue where returned                                                                                                                                                                                |
| `peak_buying_time` | Busiest purchase-window label and aggregate detail where returned                                                                                                                                                                                        |
| `sources[]`        | Source code/label, views, unique visitors, buyers, buyer share, conversion, units sold and attributed revenue                                                                                                                                            |
| `generated_at`     | Snapshot generation time                                                                                                                                                                                                                                 |

These are computed results, not additional form fields. Old components also derive strongest/weakest ticket types, leading source and suggested actions from these aggregates.

## Existing screens versus actual collection

| Old screen            | Status before redesign                                                                                                                              |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview and insights | API-backed aggregates; development currently substitutes the existing `dashboardPreview.js` fixture                                                 |
| Promote               | API-backed link listing/creation and browser copy/share; development substitutes sharing fixtures                                                   |
| Attendees             | Hardcoded sample people/statuses, without an organiser guest-list API                                                                               |
| Discount codes        | Hardcoded sample offers; no discount administration route in the inspected backend                                                                  |
| Message attendees     | Static composer; subject could be typed, with no delivery workflow                                                                                  |
| Door check-in         | Static guest/check-in illustration; no entrance or movement API                                                                                     |
| Earnings              | Static balance, payout account and transactions; the commerce models exist, but these displayed figures were not supplied by an earnings/payout API |
| Settings              | Static illustration; a separate live create/edit event API already exists                                                                           |

The older `docs/create-event-current-infrastructure.md` describes an earlier local-only creation flow. Current `createEventService.js` and the sibling Laravel controllers contain create, update and publish requests; use those sources when assessing the current implementation.

## New visual standard

The supplied overview HTML is now the organiser workspace’s visual baseline. Reuse its sidebar grouping, compact header, full-width photographic event hero, countdown, typography, spacing, borders, controls, cards, tables, tabs and responsive cascade. The design system supplies the shared foundations; the explicitly updated hero reference controls the final overview appearance.

| Screen            | New standard                                                                                                                       |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Overview          | Event hero; Sales at a glance; Sales performance with line chart and ticket types; Reach & audience; Good to know; What stands out |
| Attendees         | Purchase-level guest list, buyer identity, grouped tickets, arrival summaries, search and filters, purchase/guest details          |
| Promote           | Promotion/Discounts tabs, social links, copy/download actions and source performance                                               |
| Discount codes    | Offer form, eligibility, usage limits, dates, status, search, filters, copy and export                                             |
| Message attendees | Audience, subject, body, adjacent preview and saved drafts                                                                         |
| Door check-in     | Activation, guest activity, entries/exits, entrances and ticket-code entry                                                         |
| My earnings       | Ticket revenue and ticket-type breakdown, social attribution, discount attribution and payout availability                         |
| Settings          | Event details, ticket types, checkout preferences, access preferences and payout destination                                       |

## Foundations and repeated information

1. **Event identity:** keep one event ID, owner, status, schedule, timezone and canonical public URL. Sidebar, hero, messages, receipts and settings should read that source.
2. **Ticket products:** reuse ticket-type IDs, unit type, price, availability and people-per-unit settings. Do not create separate stock totals in Overview, Earnings and Settings.
3. **Order versus person versus admission:** an order groups purchased units; a buyer pays; a guest attends; an admission is entry entitlement. Preserve the relationships when adding attendee records.
4. **Payment truth:** derive sold units and revenue from paid orders. Active unpaid reservations affect availability, not paid earnings. A table is one sold unit even when it covers several admissions.
5. **Money:** API fields ending `_minor` are minor units. Divide by 100 for display; preserve currency. Gross revenue is not an available withdrawal balance.
6. **Attribution:** source and discount are independent dimensions of a purchase. Their subtotals can overlap; never add them to calculate total revenue.
7. **Attendance:** maintain append-only entry/exit activity and derive “inside now,” “arrived at least once” and “not arrived” separately. Repeat entry is not another ticket sale.
8. **Event-local reporting:** use the event timezone for event schedules and reporting periods. Copy changes must follow `docs/VOICE_AND_TONE.md`.

## Backend work exposed by the new reference

| Capability                  | Required foundation before live use                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Organiser purchase list     | Owner-authorised, event-scoped order/items/tickets endpoint, search, filtering and pagination                                                                |
| Guest records               | Named guest per ticket/admission; buyer identity stays separate; custom-field answer storage                                                                 |
| Guest edits and history     | Validated update endpoint and audit history                                                                                                                  |
| Discount codes              | Event-scoped code uniqueness, amount/percentage rules, eligible ticket types, dates/timezone, limits, enable/disable state and atomic redemption at checkout |
| Messaging                   | Draft storage, recipient selection, preview, delivery service, consent/preferences and delivery results                                                      |
| Check-in                    | Activation, entrance/staff permissions, verified ticket-token lookup, duplicate-entry handling and durable movement log                                      |
| Earnings details            | Authorised ledger-backed fees, refunds, allocations and settlement/payout state                                                                              |
| Bank setup                  | Verified provider integration; do not store full bank details in browser preview storage                                                                     |
| Checkout/access preferences | Validated server storage and enforcement in the public buyer flow                                                                                            |
| Free events                 | Durable free registration records and attendance totals; current analytics explicitly reports paid tracking as unsupported for free events                   |

## Implementation boundaries

The redesign lives in `src/components/event-workspace/` and is mounted by `src/pages/Dashboard.vue`. The supplied CSS cascade is isolated beneath `.event-workspace`; extracted reference images are local assets. The original standalone scripts are not executed, and no iframe is used.

Overview and sharing retain their existing API contracts. Settings can use the existing event editor. Sample guest/discount/check-in state is a development preview and must not be represented as production collection. Browser drafts are event-scoped and do not send messages. Financial actions need real backend responses rather than simulated successful transfers.

This document is the inventory and migration reference. It does not claim the missing backend capabilities are implemented or that every overlay has achieved pixel-level parity.

The subsequent [Attendees reference review](attendees-reference-review.md) records the paid/free preview, source filters, dedicated purchase/registration page, guest actions and shared visit records now implemented from the supplied HTML.

## Validation and remaining review

`node scripts/check-event-workspace.mjs` verifies that all eight event views render without Vue warnings, including zero-sales, loading, error and no-event states. It also checks grouped guest search, purchase-source filters, entry/exit transitions and the five discount statuses. `npm run build` checks the production bundle.

The browser access host was unavailable during this implementation, and native-window interaction did not provide a reliable preview session. Desktop/mobile screenshot comparison, camera scanning, receipt printing and entrance QR sharing remain unverified in the browser. Camera scanning includes ticket-code fallback, sample purchases have printable receipts, and entrances have preview QR links. Staff permissions and the story guide remain simplified. The focused [Overview reference review](overview-reference-review.md) records the repaired controls, notification drawer, design foundations and additional state/handler checks. A fully verified direct replica should not be claimed until browser flows and screenshots have been reviewed.
