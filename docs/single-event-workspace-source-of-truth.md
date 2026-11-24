# Single-event workspace: source of truth

Reviewed: 19 November 2026. Based on the current working tree, including local changes.

This reference covers the organiser workspace after opening one event: Overview, Attendees, Promote, Discount codes, Message attendees, Door check-in, Earnings and Settings. It records the shared sidebar and header, screen contents, number cards, wording, controls, data and interactions.

Public browsing, checkout, account setup and event creation are outside this reference. The public page and event editor are included only as destinations from this workspace.

This is a code-based screen inventory, not a screenshot review or a production test. No events, messages, check-ins or payments were changed. Existing copy is quoted exactly for accuracy, including wording that differs from the project voice guide. No application code, copy or layout was changed.

## Navigation map

| Sidebar group | Destination | View key | Implementation |
| --- | --- | --- | --- |
| Main | Overview | overview | Event payload; fixtures in development |
| Main | Attendees | attendees | Static sample |
| Grow sales | Promote | share | API requests and browser copy/share |
| Grow sales | Discount codes | promo | Static sample |
| Grow sales | Message attendees | email | Static sample; subject accepts local typing |
| Event day | Door check-in | checkin | Static sample |
| Money | Earnings | payout | Static sample |
| Manage | Settings | settings | Static sample |

Entry: authenticated /dashboard/events/:eventId or /dashboard. Overview opens first. Sidebar choices change local view state; switching events returns to Overview. There is no Tickets sidebar item. Insights exists in code without a visible navigation entry.

## Reading the reference

The descriptions explain each screen, metric and action. The copy register then lists literal template text in screen order with source line links, dynamic expressions, input labels and interaction bindings. Text separated by emphasis markup appears in adjacent entries. Conditions and handlers are included as source excerpts to preserve their exact relationship to the copy.

API-connected means a frontend request exists; it does not establish production behavior. Static screens do not follow the selected event. Development preview also replaces normally connected overview and share-link reads.

## Dashboard loading, selection, cache and errors

Sources: src/pages/Dashboard.vue, src/stores/dashboard.js,
src/services/dashboardService.js.
Outside preview:
  GET /api/dashboard/events -> response.data.data array.
  GET /api/dashboard/events/{id}/overview -> response.data.data object.
Requests use the central credentialed Axios client.

Positive integer route eventId is preferred, otherwise first event ID. The route
is checked against the returned owned-event list; absent/unrecognized IDs are
replaced with the first owned event's dashboard URL. This is frontend selection,
not a substitute for backend ownership checks.

Switching event closes dropdown, resets view to Overview, changes route and
loads its overview. Events cache in Pinia after successful load unless forced.
Overview caches per event with a 30-second freshness TTL. TTL is checked when
fetchOverview runs; it is not an automatic refresh interval.

There is no dashboard polling, WebSocket or server-sent-event subscription.
Live data copy does not imply continuous updates. Full reload clears memory.
Active view is component state, not a URL tab/query; reload normally resets it.

Loading: DashboardContentSkeleton while events/overview load.
Failure: error card, error message and Try again action.
No events: No events yet, explanation and Create event button.
Overview must exist before any DashboardManageContent child view renders.
Source TODOs mention distinct no-events/no-sales/no-traffic/no-attribution states
still needing design after preview review.

## Sidebar: every destination and identity detail

Main: Overview (overview), Attendees (attendees).
Grow sales: Promote (share), Discount codes (promo), Message attendees (email).
Event day: Door check-in (checkin).
Money: Earnings (payout).
Manage: Settings (settings).

Sidebar includes branding, My Events back link, selected event cover and title.
Multiple events: Change event dropdown, other event thumbnail/title/phase;
live events have live dot. One event: phase instead of Change event.
Phase labels: Live now, Upcoming, Ended, Draft; fallback status/Event.
Footer: name, else first_name + last_name, else email, else Event organiser.
Initials use up to two name parts, fallback EO; role label Event organiser.

Insights component exists but no current sidebar item or action selects it.
There is no standalone Tickets sidebar tab. Ticket performance appears under
Overview/Promote; editing tickets happens through Edit event.

## Topbar: event details, account and navigation

Source: DashboardTopbar.vue.
  Event dashboard kicker; event title or Your event.
  Status Live / Upcoming / Ended / Draft / status / Event.
  Start date/time from starts_at, event.timezone (default Africa/Lagos).
  Venue, fallback Venue TBA.
  View public page; Edit event; account avatar/menu.

View public page routes to event.public_path; missing value silently does
nothing. Preview event has no public_path, so the visible action does nothing.
Edit event routes to /events/{id}/edit. Preview's synthetic ID 900001 still
reaches the real editing API, not a preview editor record.

AccountMenu shows display name, optional email and avatar or initials. Dashboard
menu offers Back to site and Log out. Outside-click/Escape closes it. Logout
attempts backend logout, clears local state and routes home; menu ignores the
store's serverLogoutSucceeded result.

## Overview: hero and headline metrics

DashboardEventHero.vue:
  Cover background and overlay; phase; title; start date/time; venue.
  Countdown from supplied days_to_go: Today, 1 day to go, N days to go.
  Live -> Happening now; ended -> Event ended; missing days hides countdown.
Countdown is supplied data, not a ticking calculation, and preview may be stale.

DashboardStatStrip.vue:
  Tickets sold: sales.units_sold; week comparison; count out of capacity_units;
    sold_percent and progress bar clamped 0-100%.
  Revenue: total_minor and this_week_minor in supplied currency.
  Spots left: available_units out of capacity_units; reserved_units note when
    nonzero, described as temporarily reserved in checkout.
  Page views: page_views and conversion_percent bought a ticket.

Trend wording: new -> New this week (No change if zero); flat -> Same as last
week; missing comparison -> No comparison yet; otherwise signed % vs last week.
Money divides minor units by 100; en-NG format, currency default NGN. Compact
amounts use K/M notation; standard dashboard amounts round display to no decimal
places. Percent shows integer or one decimal. Sold units, buyers and admitted
guests are different counts, especially for tables.

## Overview: ticket performance and event health

Source: DashboardOverviewView.vue.
How your tickets are doing lists each overview.ticket_types row:
  Name, sold units, available units, sold percent, progress bar.
  Noun table/tables if unit_type table; otherwise ticket/tickets.
  >=80% hot/red; 50-79.99% good/teal; below 50% blue.
  Empty message: no paid ticket tiers yet.
  Open sharing links button selects Promote.
Expected fields: id, name, unit_type, visible, effective_capacity_units,
sold_units, available_units, reserved_units, sold_percent, revenue_minor.
No inline price/quantity edit, barcode listing or stock mutation is provided.

Event health:
  Sales exist -> Your live sales picture; otherwise ready for first sale.
  Overall sold percent; available ticket units.
  Strongest tier: highest sold_percent with positive capacity, including hidden
    tiers; sold percentage and remaining units.
  Top source: first qualifying source returned, label and buyer count.
  Weakest tier: lowest sold_percent among visible positive-capacity tiers;
    displayed when different from strongest, with available count.
Weakest is not computed as largest remaining quantity. Top source is not sorted
by frontend; source ordering is assumed to be meaningful from backend.

What the numbers say / Useful things to know now:
  Source recommendation and buyer share, or start tracked links -> Promote.
  Watch weakest tier and remaining count -> Discount codes.
  admissions covered via admission_entries_covered -> Attendees.
  Explains table guests count for door capacity; one table remains one sold unit.
These actions select a view; they do not create discounts or alter stock.

## Overview: chart, buying patterns and channels

Sales trend shows Tickets bought per day, paid ticket units rather than guests
inside tables. 7d/30d/All pills select preloaded arrays; 30d default. No range
request occurs. SVG line/area scales daily units_sold with endpoint dot. No
interactive tooltip, date-axis labels or numeric y-axis labels. Summary below
uses this_week_units and this_week_minor regardless of selected range.

Mini metrics:
  Average spend per buyer: buyers.average_spend_minor.
  Best sales day this week: label + units_sold, else No sales yet.
  Best sales day overall: label + units_sold, else No sales yet.
  Peak buying time: supplied label or No sales yet.

Top buyer channels:
  Remove unattributed and zero-buyer rows, take first four.
  Show label, buyers, unique_visitors, buyer_share_percent, bar clamped 0-100%.
  Copy says buyer belongs to source of most recent paid purchase for this event.
  Empty state encourages tracked sharing links.
Traffic quality:
  unique_visitors, converted_visitors, conversion_percent.
  Copy claims hourly event/visitor deduplication; implementation belongs to
    backend and is not established by this display component.

## Insights: component without normal navigation

DashboardInsightsView.vue renders for internal key insights, but no inspected
visible action chooses it. Shows sold tickets/week trend, revenue/week amount,
spots left/capacity, page views/conversion, and 7d/30d/All daily SVG sales chart.
Uses the same overview object; no separate insights endpoint.

## Promote: every detail and action

Sources: DashboardShareView.vue, src/services/dashboardShareService.js.
Loads on mount/event ID change:
  GET /api/dashboard/events/{id}/share-links -> response.data.data.
Development preview substitutes fixture links.

Workspace totals: active links = length; tracked views = sum views; matched
buyers = sum buyers. These are row sums, not cross-link deduplication by Vue.
Each row: label, source guidance, views, buyers, conversion_percent, URL,
Copy and Share buttons. Expected id/label/source_code/views/buyers/conversion.

URL is built from router public event route, event ID and generated title slug,
resolved against browser origin. ?src=<code> is appended. Display strips scheme.
Does not use event.public_path or a stored URL from link record.
Guidance codes:
  wa chats/groups; ig Instagram posts/bio; direct flyers/bios/general;
  x X/Twitter; fb Facebook; in LinkedIn; email email campaigns;
  others Custom tracked link. Not all codes necessarily exist in returned data.

Copy: navigator.clipboard; failure displays URL for manual copying.
Share: navigator.share first with title/text/URL; fallback WhatsApp uses wa.me;
other codes fall back to copying. Native-share cancellation also reaches fallback.
Instagram source does not automatically publish an Instagram post.

Custom link:
  Create a link for another group reveals input maxlength 60.
  Example church group, school alumni. Trimmed blank does nothing.
  Creating flag prevents duplicate in-flight request.
  CSRF bootstrap then POST /api/dashboard/events/{id}/share-links {label}.
  Component assigns returned data as the complete links array.
  Success clears/hides form, feedback, 4.2-second parent toast, forced overview
    refresh. Cancel clears/hides form. Loading and backend error banner exist.

Preview bug: preview create pushes to fixture array but returns a SINGLE object;
component replaces links with it although length/reduce/v-for expect an array.
Creating in preview can break rendering/totals. Preview writes are module-memory
only, lost on reload. Confirm live endpoint returns the agreed array shape too.

Further sections: ticket performance (name, sold/left, percent, revenue), top
buyer channels (label, buyers, revenue, share/bar), base event link + Copy link.
Source bar caps at 100 but does not clamp negative percent in this component.
No rename/delete/disable link, referral payouts, QR generation, UTM editing or
ad publishing controls are implemented here.

## Discount codes: exact static contents

Source: DashboardPromoView.vue. No script or API in any environment.
  Metrics: Active codes 3; Total uses 87; Revenue from codes NGN 620K.
  LASVIP30: 30% off VIP; expires May 10; no use limit; 42 uses.
  FRIENDS: NGN 2,000 off any ticket; no expiry; max 50 uses; 29 uses.
  MEDIA50: free ticket /100% off; expires Apr 30; max 20 uses; 16 uses.
  EARLYBIRD expired: 20% off Early Bird; expired Apr 1; count dash.
  Create a new promo code is a styled div without handler.
No create form, input bindings, update/delete, redemption log, scope selector,
expiry calculation or validation. Dates lack year. No code is proven redeemable
by this template; current Checkout.vue has no promo-code input.

## Attendees: exact static contents

Source: DashboardAttendeesView.vue. No event props or API.
  Meet your attendees, event-day introduction.
  Total attendees 612; VIP guests 38; Need update 1.
  Recent buyers; helper directs organiser to Door Check-in when doors open.
Rows: initials | name | ticket/number | badge
  AO | Adaeze Okonkwo | VIP #8821 | Paid.
  BM | Biodun Martins | General #8822 | Paid.
  CA | Chioma Adekunle | Early Bird #8823 | Email missing.
  EI | Emeka Ifeanyi | VIP #8825 | Paid.
No live attendee query, phone/email display, answers, sort, filter, pagination,
export, resend, refund, detail modal or admission editor. Rows do not derive
from overview or actual paid order tickets.

## Door check-in: exact static contents and missing operation

Source: DashboardCheckinView.vue. No script/API/scanner.
  Welcome them in; introduction says scan QR or find by name.
  Checked in 312; Not yet arrived 300; Check-in rate 51%.
  Event QR code card is decorative qr-frame/qr-inner divs, not QR data.
  Helper suggests printing/displaying at entrance.
  Download QR and Print page are divs with no handlers.
  Search by name or ticket number... is a span, not an input.
Rows:
  Adaeze Okonkwo | VIP #8821 | In.
  Biodun Martins | General #8822 | In.
  Chioma Adekunle | Early Bird #8823 | Waiting.
  Dami Olawale | General #8824 | In.
  Emeka Ifeanyi | VIP #8825 | Waiting.
No camera permission, scanner/decoder, scan input, manual check-in, lookup API,
admission mutation, duplicate-scan response, invalid-ticket handling, event
mismatch check, offline queue, timestamp, staff identity, undo or table-entry
counter. Issued QR tokens cannot currently be admitted through this page.

## Message attendees: exact static contents

Source: DashboardEmailView.vue.
  Keep everyone in the loop; intro/warning mention all 612 attendees.
  Recipient tag All attendees (612), fixed.
  Subject input: Quick update about Comedy Meets Dance.
  Native subject can be typed into but has no model/save/send handling.
  Body is a fixed div, not textarea/contenteditable: greeting; doors 5:30 PM,
    30 minutes before show; come early; free parking via Adetokunbo Ademola
    Street gate; signoff Rush Hour Entertainment.
  Link/list toolbar, Save draft and Send to 612 people are unbound divs.
Past emails:
  You're in! Comedy Meets Dance: Confirmation, 612 sent, Apr 14;
    84% opened, 22% clicked.
  VIP spots almost gone: Manual, 540 sent, Apr 22;
    71% opened, 31% clicked.
No segmentation, contact query, editable rich body, test send, draft persistence,
attachment, queue API, delivery report, unsubscribe or analytics integration.

## Earnings: exact static contents

Source: DashboardPayoutView.vue. No financial API.
  Available to withdraw NGN 7,415,000.
  After 5% platform fee; NGN 390,263 deducted.
  Withdraw now: unbound div.
  Bank GTBank; masked number ending 7823; Rush Hour Entertainment Ltd.
Transactions:
  4 tickets sold - General, VIP | Apr 27 11:34 PM | +NGN 50,000.
  2 tickets sold - Early Bird | Apr 27 9:10 AM | +NGN 10,000.
  Platform fee | Apr 27 9:10 AM | -NGN 500.
  1 Gold Table sold | Apr 26 3:55 PM | +NGN 250,000.
These are not selected-event bank details or overview.revenue. Displayed 5% is
not proof of live fee policy. No withdrawal, bank-account edit/verification,
payout history API, settlement state, refund reconciliation or ledger request.

## Settings: exact static contents

Source: DashboardSettingsView.vue.
Visibility:
  Event is public on: anyone with link can find/buy.
  Show on Rush Hour discovery on: search/browse.
  Show exact attendee count off: example 612 people going.
Notifications:
  Email me every new ticket sale off.
  Daily summary email on.
  Notify when 90% sold out on.
Important actions:
  Pause ticket sales / Pause sales: copy says current tickets stay valid.
  Cancel this event / Cancel event: copy promises full refunds, irreversible.
  Delete this event / Delete event: copy says permanent event/data removal.
All toggles/actions are unbound divs. No save/fetch/mutation, confirmation,
refund processing or notification persistence. Refund copy is interface intent,
not an implemented backend guarantee.

## Active event editing versus old dashboard edit components

Topbar Edit event routes to src/pages/CreateEvent.vue at /events/:id/edit.
GET /api/create-event/{id} expects data.id/status/form.
PATCH /api/create-event/{id} saves full sanitized form after steps 1-3 validate.
Same Basics, Details, Tickets and Attendees wizard as creation:
  title, dates, recurrence, format, venue/link/category; images, description,
  organiser/site, details/tags; free/paid capacity and ticket prices/quantities/
  tables/caps/sales dates/visibility; attendee-field enablement.
Unchanged original start can bypass final lead-time validation, though picker
constraints still use current time. Save edit PATCHes instead of publish POST.
Status active is its published-edit marker; some shared create labels remain.
See onboarding-and-event-upload-reference.txt for full individual field rules.

DashboardEditContent.vue and DashboardEditBasicsStep/DetailsStep/TicketsStep/
AttendeesStep.vue exist but are not imported by active Dashboard or its view
dispatcher. Their sample controls are not another active editor.

## Exact development fixture values

Source: src/services/dashboardPreview.js.
  ID 900001; Lagos after sunset; published; upcoming.
  Start 2026-12-12T18:00:00+01:00; Africa/Lagos; days_to_go 33 fixed.
  Venue Eko Hotel & Suites, Victoria Island, Lagos; Unsplash cover.
  No public_path.
Sales: units_sold 412; capacity 700; available 288; reserved 0; sold 58.9%;
  this week 96; growth up 24.7%; admission_entries_covered 412.
Revenue: NGN; total_minor 441000000 = NGN 4,410,000;
  this_week_minor 102000000 = NGN 1,020,000.
Traffic: views 4821; unique visitors 2300; converted 240; conversion 10.4%.
Buyers: unique 240; average_spend_minor 1837500 = NGN 18,375.
Tiers:
  Early bird capacity 150, sold 110, left 40, revenue NGN 550,000, 73.3%.
  General admission capacity 500, sold 260, left 240, NGN 2,600,000, 52%.
  VIP capacity 50, sold 42, left 8, NGN 1,260,000, 84%.
  All unit_type ticket, visible true, reserved 0; sold% calculated from capacity.
Sources:
  WhatsApp wa: 120 buyers, 800 visitors, NGN 2,205,000, 50% buyer share.
  Instagram ig: 80 buyers, 900 visitors, NGN 1,470,000, 33.3%.
  Direct link direct: 40 buyers, 600 visitors, NGN 735,000, 16.7%.
  Link views copied from unique visitors; conversion buyers/views*100.
Trend: 30 generated October 1-30 2026 rows; daily units =
  5 + (zero-based index * 7 modulo 19). 7d last seven; 30d/all same 30.
Best day this week Friday 28; overall October 21 42; peak 7 to 11 PM.
These do not reconcile with static 612-attendee or NGN 7,415,000 payout samples.
Independent fixture sources explain the mismatch, not a real sales discrepancy.

## Overview payload contract

event: id,title,status,phase,starts_at,timezone,venue,cover_image,days_to_go.
  Event-list record also needs public_path for topbar navigation.
sales: units_sold,capacity_units,available_units,reserved_units,sold_percent,
  this_week_units,week_growth_state,week_growth_percent,admission_entries_covered.
revenue: currency,total_minor,this_week_minor.
traffic: page_views,unique_visitors,converted_visitors,conversion_percent.
buyers: unique_buyers,average_spend_minor.
ticket_types[]: id,name,unit_type,visible,effective_capacity_units,sold_units,
  available_units,reserved_units,sold_percent,revenue_minor.
sources[]: source_code,label,buyers,unique_visitors,revenue_minor,
  buyer_share_percent.
sales_trend: {7d:[{date,units_sold}],30d:[...],all:[...]} (keys are strings).
best_sales_day: {this_week:{label,units_sold} or null,
  overall:{label,units_sold} or null}.
peak_buying_time: {label} or null.
Several components directly read nested fields; an incomplete object may cause
rendering errors. Backend must define valid zero-data shapes and calculations.

## Interaction and state summary

| Control | Current result |
| --- | --- |
| My Events | Routes home to / |
| Event switcher | Opens other events; selection changes route and loads overview |
| Sidebar | Replaces main content; shared header remains |
| View public page | Routes to public_path if present; otherwise does nothing |
| Edit event | Opens /events/:id/edit in the shared wizard |
| 7d / 30d / All | Selects a preloaded chart series |
| Overview suggestions | Open the bound Promote, Discount codes or Attendees view |
| Copy / Copy link | Clipboard; fallback displays URL |
| Share | Native share; WhatsApp fallback for wa; otherwise copy |
| Custom sharing link | Trims label; ignores blank/pending submission; creates link and refreshes overview |
| Cancel custom link | Clears input and closes form |
| Create discount | No handler |
| Door search / Download QR / Print page | No handler or real input |
| Save draft / Send | No handler |
| Withdraw now | No handler |
| Settings switches / Pause / Cancel / Delete | No mutation, confirmation or refund flow |
| Loading | Skeleton; overview must exist before management views render |
| Dashboard error | Error card with Try again |
| No events | Empty state with Create event |
| Sharing success | Inline feedback; creation also shows a 4.2-second toast |

## Dynamic feedback

Server messages can replace fallback errors. Dashboard fallbacks: ?We could not load this event dashboard.?, ?We could not load your dashboard.? and ?We could not load your events.? Sharing fallbacks: ?We could not load your sharing links.? and ?We could not create that link.?

Sharing feedback: ?{label} link copied.?, ?{label} share opened.?, ?Opening WhatsApp.?, ?{label} link added.?, ?{label} is ready to use.? and ?Base event link copied.? Clipboard failure displays the full URL. Native share text is ?Grab your ticket for {event title}?; WhatsApp includes the URL.

Trend wording: ?New this week?, ?No change?, ?Same as last week?, ?No comparison yet?, or a signed percentage followed by ?vs last week?. Date fallback: ?Date TBA?. Venue fallback: ?Venue TBA?. Best-day fallback: ?No sales yet?. Currency, dates, plural units and source guidance are defined in src/utils/dashboardFormat.js.

## Exact screen copy and controls

Extracted from current Vue templates, in source order. Literal text includes all template branches, sample rows and number cards. Dynamic expressions describe runtime values rather than a fixed screenshot. Control excerpts include conditions, bindings and handlers; decorative SVG and styling are omitted. Each line links back to its source. This register includes the unlinked Insights component as an explicitly marked exception.

### Dashboard.vue

- [L200](../src/pages/Dashboard.vue#L200) **Control / attribute**: @toggle-dropdown="toggleDropdown"; @go-back="goBack"; @select-view="showManage"; @select-event="selectEvent"
- [L212](../src/pages/Dashboard.vue#L212) **Control / attribute**: @view-public="viewPublicEvent"; @edit-event="editEvent"
- [L219](../src/pages/Dashboard.vue#L219) **Control / attribute**: v-if="isDashboardLoading"
- [L224](../src/pages/Dashboard.vue#L224) **Control / attribute**: v-else-if="pageError"
- [L230](../src/pages/Dashboard.vue#L230) **Control / attribute**: title
- [L230](../src/pages/Dashboard.vue#L230) **Text**: We could not load this dashboard.
- [L240](../src/pages/Dashboard.vue#L240) **Dynamic**: {{ pageError }}
- [L242](../src/pages/Dashboard.vue#L242) **Control / attribute**: @click="loadDashboard"
- [L247](../src/pages/Dashboard.vue#L247) **Text**: Try again
- [L256](../src/pages/Dashboard.vue#L256) **Control / attribute**: v-else-if="!events.length"
- [L261](../src/pages/Dashboard.vue#L261) **Control / attribute**: title
- [L261](../src/pages/Dashboard.vue#L261) **Text**: No events yet
- [L270](../src/pages/Dashboard.vue#L270) **Text**: Create an event first. Its live sales data will appear here.
- [L273](../src/pages/Dashboard.vue#L273) **Control / attribute**: @click="router.push({ name: 'CreateEvent' })"
- [L278](../src/pages/Dashboard.vue#L278) **Text**: Create event
- [L284](../src/pages/Dashboard.vue#L284) **Control / attribute**: v-else; @select-view="showManage"; @link-created="showSuccessToast"; @refresh-overview="loadOverview(selectedEventId, { force: true })"
- [L297](../src/pages/Dashboard.vue#L297) **Control / attribute**: v-if="toast"
- [L307](../src/pages/Dashboard.vue#L307) **Text**: ✓
- [L311](../src/pages/Dashboard.vue#L311) **Text**: Done
- [L312](../src/pages/Dashboard.vue#L312) **Dynamic**: {{ toast.message }}

### DashboardSidebar.vue

- [L72](../src/components/dashboard/DashboardSidebar.vue#L72) **Control / attribute**: alt="Rush Hour"
- [L79](../src/components/dashboard/DashboardSidebar.vue#L79) **Control / attribute**: @click="$emit('go-back')"
- [L83](../src/components/dashboard/DashboardSidebar.vue#L83) **Text**: My Events
- [L90](../src/components/dashboard/DashboardSidebar.vue#L90) **Control / attribute**: v-if="currentEvent"
- [L94](../src/components/dashboard/DashboardSidebar.vue#L94) **Control / attribute**: @click="$emit('toggle-dropdown')"
- [L100](../src/components/dashboard/DashboardSidebar.vue#L100) **Control / attribute**: v-if="currentEvent.cover_image"; alt="currentEvent.title"
- [L109](../src/components/dashboard/DashboardSidebar.vue#L109) **Dynamic**: {{ currentEvent.title }}
- [L112](../src/components/dashboard/DashboardSidebar.vue#L112) **Dynamic**: {{ events.length > 1 ? 'Change event' : phaseLabel(currentEvent) }}
- [L116](../src/components/dashboard/DashboardSidebar.vue#L116) **Control / attribute**: v-if
- [L117](../src/components/dashboard/DashboardSidebar.vue#L117) **Text**: 1" class="switcher-arrow" :class="
- [L119](../src/components/dashboard/DashboardSidebar.vue#L119) **Text**: open: dropdownOpen }" >
- [L127](../src/components/dashboard/DashboardSidebar.vue#L127) **Control / attribute**: v-if
- [L128](../src/components/dashboard/DashboardSidebar.vue#L128) **Text**: 1" class="events-dropdown" :class="
- [L130](../src/components/dashboard/DashboardSidebar.vue#L130) **Text**: open: dropdownOpen }" >
- [L132](../src/components/dashboard/DashboardSidebar.vue#L132) **Text**: Your other events
- [L136](../src/components/dashboard/DashboardSidebar.vue#L136) **Control / attribute**: v-for="event in otherEvents"; @click="$emit('select-event', event.id)"
- [L144](../src/components/dashboard/DashboardSidebar.vue#L144) **Control / attribute**: v-if="event.cover_image"; alt="event.title"
- [L153](../src/components/dashboard/DashboardSidebar.vue#L153) **Dynamic**: {{ event.title }}
- [L156](../src/components/dashboard/DashboardSidebar.vue#L156) **Dynamic**: {{ phaseLabel(event) }}
- [L160](../src/components/dashboard/DashboardSidebar.vue#L160) **Control / attribute**: v-if="event.phase === 'live'"
- [L173](../src/components/dashboard/DashboardSidebar.vue#L173) **Text**: Main
- [L175](../src/components/dashboard/DashboardSidebar.vue#L175) **Control / attribute**: @click="$emit('select-view', 'overview')"
- [L187](../src/components/dashboard/DashboardSidebar.vue#L187) **Text**: Overview
- [L190](../src/components/dashboard/DashboardSidebar.vue#L190) **Control / attribute**: @click="$emit('select-view', 'attendees')"
- [L202](../src/components/dashboard/DashboardSidebar.vue#L202) **Text**: Attendees
- [L205](../src/components/dashboard/DashboardSidebar.vue#L205) **Text**: Grow sales
- [L207](../src/components/dashboard/DashboardSidebar.vue#L207) **Control / attribute**: @click="$emit('select-view', 'share')"
- [L217](../src/components/dashboard/DashboardSidebar.vue#L217) **Text**: Promote
- [L220](../src/components/dashboard/DashboardSidebar.vue#L220) **Control / attribute**: @click="$emit('select-view', 'promo')"
- [L231](../src/components/dashboard/DashboardSidebar.vue#L231) **Text**: Discount codes
- [L234](../src/components/dashboard/DashboardSidebar.vue#L234) **Control / attribute**: @click="$emit('select-view', 'email')"
- [L244](../src/components/dashboard/DashboardSidebar.vue#L244) **Text**: Message attendees
- [L247](../src/components/dashboard/DashboardSidebar.vue#L247) **Text**: Event day
- [L249](../src/components/dashboard/DashboardSidebar.vue#L249) **Control / attribute**: @click="$emit('select-view', 'checkin')"
- [L258](../src/components/dashboard/DashboardSidebar.vue#L258) **Text**: Door check-in
- [L261](../src/components/dashboard/DashboardSidebar.vue#L261) **Text**: Money
- [L263](../src/components/dashboard/DashboardSidebar.vue#L263) **Control / attribute**: @click="$emit('select-view', 'payout')"
- [L273](../src/components/dashboard/DashboardSidebar.vue#L273) **Text**: Earnings
- [L276](../src/components/dashboard/DashboardSidebar.vue#L276) **Text**: Manage
- [L278](../src/components/dashboard/DashboardSidebar.vue#L278) **Control / attribute**: @click="$emit('select-view', 'settings')"
- [L288](../src/components/dashboard/DashboardSidebar.vue#L288) **Text**: Settings
- [L296](../src/components/dashboard/DashboardSidebar.vue#L296) **Dynamic**: {{ initials }}
- [L300](../src/components/dashboard/DashboardSidebar.vue#L300) **Dynamic**: {{ displayName }}
- [L302](../src/components/dashboard/DashboardSidebar.vue#L302) **Text**: Event organiser

### DashboardTopbar.vue

- [L40](../src/components/dashboard/DashboardTopbar.vue#L40) **Control / attribute**: aria-label="Dashboard header"
- [L45](../src/components/dashboard/DashboardTopbar.vue#L45) **Control / attribute**: title
- [L46](../src/components/dashboard/DashboardTopbar.vue#L46) **Text**: Event dashboard
- [L50](../src/components/dashboard/DashboardTopbar.vue#L50) **Control / attribute**: title
- [L51](../src/components/dashboard/DashboardTopbar.vue#L51) **Control / attribute**: title
- [L52](../src/components/dashboard/DashboardTopbar.vue#L52) **Dynamic**: {{ event?.title \|\| 'Your event' }}
- [L55](../src/components/dashboard/DashboardTopbar.vue#L55) **Control / attribute**: v-if="event"
- [L60](../src/components/dashboard/DashboardTopbar.vue#L60) **Dynamic**: {{ statusLabel }}
- [L65](../src/components/dashboard/DashboardTopbar.vue#L65) **Dynamic**: {{ meta }}
- [L70](../src/components/dashboard/DashboardTopbar.vue#L70) **Control / attribute**: v-if="event"
- [L74](../src/components/dashboard/DashboardTopbar.vue#L74) **Control / attribute**: @click="$emit('view-public')"
- [L78](../src/components/dashboard/DashboardTopbar.vue#L78) **Text**: View public page
- [L82](../src/components/dashboard/DashboardTopbar.vue#L82) **Control / attribute**: @click="$emit('edit-event')"
- [L86](../src/components/dashboard/DashboardTopbar.vue#L86) **Text**: Edit event

### DashboardEventHero.vue

- [L36](../src/components/dashboard/DashboardEventHero.vue#L36) **Control / attribute**: v-if="event.cover_image"; alt="event.title"
- [L47](../src/components/dashboard/DashboardEventHero.vue#L47) **Dynamic**: {{ phaseLabel }}
- [L50](../src/components/dashboard/DashboardEventHero.vue#L50) **Control / attribute**: title
- [L51](../src/components/dashboard/DashboardEventHero.vue#L51) **Dynamic**: {{ event.title }}
- [L63](../src/components/dashboard/DashboardEventHero.vue#L63) **Dynamic**: {{ formatEventDate( event.starts_at, event.timezone, ) }}
- [L77](../src/components/dashboard/DashboardEventHero.vue#L77) **Dynamic**: {{ event.venue \|\| 'Venue TBA' }}
- [L80](../src/components/dashboard/DashboardEventHero.vue#L80) **Control / attribute**: v-if="countdownLabel"
- [L89](../src/components/dashboard/DashboardEventHero.vue#L89) **Dynamic**: {{ countdownLabel }}

### DashboardStatStrip.vue

- [L33](../src/components/dashboard/DashboardStatStrip.vue#L33) **Control / attribute**: aria-label="Event performance metrics"
- [L40](../src/components/dashboard/DashboardStatStrip.vue#L40) **Text**: Tickets sold
- [L44](../src/components/dashboard/DashboardStatStrip.vue#L44) **Control / attribute**: value
- [L45](../src/components/dashboard/DashboardStatStrip.vue#L45) **Dynamic**: {{ formatNumber(sales.units_sold) }}
- [L53](../src/components/dashboard/DashboardStatStrip.vue#L53) **Dynamic**: {{ formatTrend( sales.week_growth_state, sales.week_growth_percent, sales.this_week_units, ) }}
- [L77](../src/components/dashboard/DashboardStatStrip.vue#L77) **Dynamic**: {{ formatNumber(sales.units_sold) }}
- [L77](../src/components/dashboard/DashboardStatStrip.vue#L77) **Text**: of
- [L79](../src/components/dashboard/DashboardStatStrip.vue#L79) **Dynamic**: {{ formatNumber(sales.capacity_units) }}
- [L83](../src/components/dashboard/DashboardStatStrip.vue#L83) **Dynamic**: {{ formatPercent(sales.sold_percent) }}
- [L83](../src/components/dashboard/DashboardStatStrip.vue#L83) **Text**: sold
- [L100](../src/components/dashboard/DashboardStatStrip.vue#L100) **Text**: Revenue
- [L104](../src/components/dashboard/DashboardStatStrip.vue#L104) **Control / attribute**: value
- [L105](../src/components/dashboard/DashboardStatStrip.vue#L105) **Dynamic**: {{ formatMoneyMinor( revenue.total_minor, revenue.currency, { compact: true }, ) }}
- [L114](../src/components/dashboard/DashboardStatStrip.vue#L114) **Text**: +
- [L120](../src/components/dashboard/DashboardStatStrip.vue#L120) **Dynamic**: {{ formatMoneyMinor( revenue.this_week_minor, revenue.currency, { compact: true }, ) }}
- [L126](../src/components/dashboard/DashboardStatStrip.vue#L126) **Text**: this week
- [L146](../src/components/dashboard/DashboardStatStrip.vue#L146) **Text**: Spots left
- [L150](../src/components/dashboard/DashboardStatStrip.vue#L150) **Control / attribute**: value
- [L151](../src/components/dashboard/DashboardStatStrip.vue#L151) **Dynamic**: {{ formatNumber(sales.available_units) }}
- [L154](../src/components/dashboard/DashboardStatStrip.vue#L154) **Text**: of
- [L155](../src/components/dashboard/DashboardStatStrip.vue#L155) **Dynamic**: {{ formatNumber(sales.capacity_units) }}
- [L155](../src/components/dashboard/DashboardStatStrip.vue#L155) **Text**: total
- [L172](../src/components/dashboard/DashboardStatStrip.vue#L172) **Control / attribute**: v-if="sales.reserved_units"
- [L176](../src/components/dashboard/DashboardStatStrip.vue#L176) **Dynamic**: {{ formatNumber(sales.reserved_units) }}
- [L176](../src/components/dashboard/DashboardStatStrip.vue#L176) **Text**: temporarily reserved in checkout
- [L184](../src/components/dashboard/DashboardStatStrip.vue#L184) **Text**: Page views
- [L188](../src/components/dashboard/DashboardStatStrip.vue#L188) **Control / attribute**: value
- [L189](../src/components/dashboard/DashboardStatStrip.vue#L189) **Dynamic**: {{ formatNumber(traffic.page_views) }}
- [L193](../src/components/dashboard/DashboardStatStrip.vue#L193) **Dynamic**: {{ formatPercent(traffic.conversion_percent) }}
- [L193](../src/components/dashboard/DashboardStatStrip.vue#L193) **Text**: bought a ticket

### DashboardOverviewView.vue

- [L161](../src/components/dashboard/DashboardOverviewView.vue#L161) **Text**: How your tickets are doing
- [L162](../src/components/dashboard/DashboardOverviewView.vue#L162) **Text**: Every number here now comes from paid orders and live inventory.
- [L167](../src/components/dashboard/DashboardOverviewView.vue#L167) **Control / attribute**: @click="emit('select-view', 'share')"
- [L171](../src/components/dashboard/DashboardOverviewView.vue#L171) **Text**: Open sharing links
- [L176](../src/components/dashboard/DashboardOverviewView.vue#L176) **Control / attribute**: v-if="ticketTypes.length"
- [L180](../src/components/dashboard/DashboardOverviewView.vue#L180) **Control / attribute**: v-for="tier in ticketTypes"
- [L188](../src/components/dashboard/DashboardOverviewView.vue#L188) **Text**: = 80, good: tier.sold_percent >= 50 && tier.sold_percent
- [L203](../src/components/dashboard/DashboardOverviewView.vue#L203) **Dynamic**: {{ tier.name }}
- [L207](../src/components/dashboard/DashboardOverviewView.vue#L207) **Dynamic**: {{ tierCountCopy(tier) }}
- [L215](../src/components/dashboard/DashboardOverviewView.vue#L215) **Text**: = 80, 'fill-teal': tier.sold_percent >= 50 && tier.sold_percent
- [L228](../src/components/dashboard/DashboardOverviewView.vue#L228) **Dynamic**: {{ formatPercent(tier.sold_percent) }}
- [L233](../src/components/dashboard/DashboardOverviewView.vue#L233) **Control / attribute**: v-else
- [L236](../src/components/dashboard/DashboardOverviewView.vue#L236) **Text**: This event does not have paid ticket tiers yet.
- [L243](../src/components/dashboard/DashboardOverviewView.vue#L243) **Control / attribute**: alt; alt
- [L244](../src/components/dashboard/DashboardOverviewView.vue#L244) **Control / attribute**: alt
- [L246](../src/components/dashboard/DashboardOverviewView.vue#L246) **Control / attribute**: title; title
- [L246](../src/components/dashboard/DashboardOverviewView.vue#L246) **Text**: Event health
- [L250](../src/components/dashboard/DashboardOverviewView.vue#L250) **Dynamic**: {{ overview.sales.units_sold ? 'Your live sales picture' : 'Your event is ready for its first sale' }}
- [L259](../src/components/dashboard/DashboardOverviewView.vue#L259) **Control / attribute**: alt
- [L260](../src/components/dashboard/DashboardOverviewView.vue#L260) **Control / attribute**: alt
- [L261](../src/components/dashboard/DashboardOverviewView.vue#L261) **Text**: Overall
- [L263](../src/components/dashboard/DashboardOverviewView.vue#L263) **Dynamic**: {{ formatPercent(overview.sales.sold_percent) }}
- [L265](../src/components/dashboard/DashboardOverviewView.vue#L265) **Text**: of current ticket capacity is sold
- [L269](../src/components/dashboard/DashboardOverviewView.vue#L269) **Dynamic**: {{ formatNumber(overview.sales.available_units) }}
- [L271](../src/components/dashboard/DashboardOverviewView.vue#L271) **Text**: ticket units are still available right now.
- [L276](../src/components/dashboard/DashboardOverviewView.vue#L276) **Control / attribute**: alt
- [L277](../src/components/dashboard/DashboardOverviewView.vue#L277) **Control / attribute**: v-if="strongestTier"; alt
- [L284](../src/components/dashboard/DashboardOverviewView.vue#L284) **Dynamic**: {{ strongestTier.name }}
- [L284](../src/components/dashboard/DashboardOverviewView.vue#L284) **Text**: is your strongest ticket.
- [L287](../src/components/dashboard/DashboardOverviewView.vue#L287) **Dynamic**: {{ formatPercent(strongestTier.sold_percent) }}
- [L289](../src/components/dashboard/DashboardOverviewView.vue#L289) **Text**: sold, with
- [L291](../src/components/dashboard/DashboardOverviewView.vue#L291) **Dynamic**: {{ formatNumber(strongestTier.available_units) }}
- [L293](../src/components/dashboard/DashboardOverviewView.vue#L293) **Text**: left.
- [L299](../src/components/dashboard/DashboardOverviewView.vue#L299) **Control / attribute**: v-if="topSource"; alt
- [L306](../src/components/dashboard/DashboardOverviewView.vue#L306) **Dynamic**: {{ topSource.label }}
- [L306](../src/components/dashboard/DashboardOverviewView.vue#L306) **Text**: is bringing the most matched buyers.
- [L309](../src/components/dashboard/DashboardOverviewView.vue#L309) **Dynamic**: {{ formatNumber(topSource.buyers) }}
- [L311](../src/components/dashboard/DashboardOverviewView.vue#L311) **Text**: buyers are currently attributed there.
- [L317](../src/components/dashboard/DashboardOverviewView.vue#L317) **Control / attribute**: v-if="weakestTier && weakestTier.id !== strongestTier?.id"; alt
- [L324](../src/components/dashboard/DashboardOverviewView.vue#L324) **Dynamic**: {{ weakestTier.name }}
- [L324](../src/components/dashboard/DashboardOverviewView.vue#L324) **Text**: has the most room to grow.
- [L327](../src/components/dashboard/DashboardOverviewView.vue#L327) **Dynamic**: {{ formatNumber(weakestTier.available_units) }}
- [L330](../src/components/dashboard/DashboardOverviewView.vue#L330) **Dynamic**: {{ ticketLabel(weakestTier, weakestTier.available_units) }}
- [L330](../src/components/dashboard/DashboardOverviewView.vue#L330) **Text**: are still open.
- [L342](../src/components/dashboard/DashboardOverviewView.vue#L342) **Control / attribute**: title; title
- [L342](../src/components/dashboard/DashboardOverviewView.vue#L342) **Text**: What the numbers say
- [L345](../src/components/dashboard/DashboardOverviewView.vue#L345) **Text**: Useful things to know now
- [L347](../src/components/dashboard/DashboardOverviewView.vue#L347) **Text**: Live data
- [L351](../src/components/dashboard/DashboardOverviewView.vue#L351) **Control / attribute**: @click="emit('select-view', 'share')"
- [L356](../src/components/dashboard/DashboardOverviewView.vue#L356) **Text**: 01
- [L359](../src/components/dashboard/DashboardOverviewView.vue#L359) **Dynamic**: {{ topSource ? `Keep an eye on ${topSource.label}` : 'Start using tracked sharing links' }}
- [L366](../src/components/dashboard/DashboardOverviewView.vue#L366) **Dynamic**: {{ topSource ? `${formatPercent(topSource.buyer_share_percent)} of buyers are currently attributed there.` : 'Once people use your links, buyer channels will appear here automatically.' }}
- [L373](../src/components/dashboard/DashboardOverviewView.vue#L373) **Text**: Promote
- [L376](../src/components/dashboard/DashboardOverviewView.vue#L376) **Control / attribute**: v-if="weakestTier"; @click="emit('select-view', 'promo')"
- [L382](../src/components/dashboard/DashboardOverviewView.vue#L382) **Text**: 02
- [L384](../src/components/dashboard/DashboardOverviewView.vue#L384) **Text**: Watch
- [L385](../src/components/dashboard/DashboardOverviewView.vue#L385) **Dynamic**: {{ weakestTier.name }}
- [L388](../src/components/dashboard/DashboardOverviewView.vue#L388) **Dynamic**: {{ formatNumber(weakestTier.available_units) }}
- [L390](../src/components/dashboard/DashboardOverviewView.vue#L390) **Text**: remain available.
- [L394](../src/components/dashboard/DashboardOverviewView.vue#L394) **Text**: Discount
- [L397](../src/components/dashboard/DashboardOverviewView.vue#L397) **Control / attribute**: @click="emit('select-view', 'attendees')"
- [L402](../src/components/dashboard/DashboardOverviewView.vue#L402) **Text**: 03
- [L405](../src/components/dashboard/DashboardOverviewView.vue#L405) **Dynamic**: {{ formatNumber(overview.sales.admission_entries_covered) }}
- [L407](../src/components/dashboard/DashboardOverviewView.vue#L407) **Text**: admissions are covered by sold tickets
- [L410](../src/components/dashboard/DashboardOverviewView.vue#L410) **Text**: Table guests are counted here for door capacity, but a table still counts as one sold unit.
- [L414](../src/components/dashboard/DashboardOverviewView.vue#L414) **Text**: Attendees
- [L421](../src/components/dashboard/DashboardOverviewView.vue#L421) **Control / attribute**: title
- [L421](../src/components/dashboard/DashboardOverviewView.vue#L421) **Text**: Sales trend
- [L429](../src/components/dashboard/DashboardOverviewView.vue#L429) **Control / attribute**: title
- [L429](../src/components/dashboard/DashboardOverviewView.vue#L429) **Text**: Tickets bought per day
- [L432](../src/components/dashboard/DashboardOverviewView.vue#L432) **Text**: Paid ticket units, not guest seats inside a table
- [L438](../src/components/dashboard/DashboardOverviewView.vue#L438) **Control / attribute**: v-for="range in ranges"; @click="selectedRange = range.key"
- [L446](../src/components/dashboard/DashboardOverviewView.vue#L446) **Dynamic**: {{ range.label }}
- [L529](../src/components/dashboard/DashboardOverviewView.vue#L529) **Dynamic**: {{ formatNumber(overview.sales.this_week_units) }}
- [L531](../src/components/dashboard/DashboardOverviewView.vue#L531) **Text**: sold this week for
- [L533](../src/components/dashboard/DashboardOverviewView.vue#L533) **Dynamic**: {{ formatMoneyMinor( overview.revenue.this_week_minor, overview.revenue.currency, ) }}
- [L538](../src/components/dashboard/DashboardOverviewView.vue#L538) **Text**: .
- [L546](../src/components/dashboard/DashboardOverviewView.vue#L546) **Text**: Average spend per buyer
- [L549](../src/components/dashboard/DashboardOverviewView.vue#L549) **Control / attribute**: value
- [L550](../src/components/dashboard/DashboardOverviewView.vue#L550) **Dynamic**: {{ formatMoneyMinor( overview.buyers.average_spend_minor, overview.revenue.currency, ) }}
- [L560](../src/components/dashboard/DashboardOverviewView.vue#L560) **Text**: Best sales day this week
- [L563](../src/components/dashboard/DashboardOverviewView.vue#L563) **Control / attribute**: value
- [L564](../src/components/dashboard/DashboardOverviewView.vue#L564) **Dynamic**: {{ bestDayCopy( overview.best_sales_day.this_week, ) }}
- [L573](../src/components/dashboard/DashboardOverviewView.vue#L573) **Text**: Best sales day overall
- [L576](../src/components/dashboard/DashboardOverviewView.vue#L576) **Control / attribute**: value
- [L577](../src/components/dashboard/DashboardOverviewView.vue#L577) **Dynamic**: {{ bestDayCopy( overview.best_sales_day.overall, ) }}
- [L586](../src/components/dashboard/DashboardOverviewView.vue#L586) **Text**: Peak buying time
- [L589](../src/components/dashboard/DashboardOverviewView.vue#L589) **Control / attribute**: value
- [L590](../src/components/dashboard/DashboardOverviewView.vue#L590) **Dynamic**: {{ overview.peak_buying_time?.label \|\| 'No sales yet' }}
- [L601](../src/components/dashboard/DashboardOverviewView.vue#L601) **Text**: Top buyer channels
- [L602](../src/components/dashboard/DashboardOverviewView.vue#L602) **Text**: A buyer is assigned to the source on their most recent paid purchase for this event.
- [L607](../src/components/dashboard/DashboardOverviewView.vue#L607) **Control / attribute**: v-if="sources.length"
- [L611](../src/components/dashboard/DashboardOverviewView.vue#L611) **Control / attribute**: v-for="source in sources"
- [L618](../src/components/dashboard/DashboardOverviewView.vue#L618) **Dynamic**: {{ source.label }}
- [L622](../src/components/dashboard/DashboardOverviewView.vue#L622) **Dynamic**: {{ formatNumber(source.buyers) }}
- [L622](../src/components/dashboard/DashboardOverviewView.vue#L622) **Text**: buyers ·
- [L623](../src/components/dashboard/DashboardOverviewView.vue#L623) **Dynamic**: {{ formatNumber(source.unique_visitors) }}
- [L623](../src/components/dashboard/DashboardOverviewView.vue#L623) **Text**: visitors
- [L639](../src/components/dashboard/DashboardOverviewView.vue#L639) **Dynamic**: {{ formatPercent(source.buyer_share_percent) }}
- [L644](../src/components/dashboard/DashboardOverviewView.vue#L644) **Control / attribute**: v-else
- [L647](../src/components/dashboard/DashboardOverviewView.vue#L647) **Text**: No attributed buyers yet. Use your tracked event links and the first source will appear automatically.
- [L654](../src/components/dashboard/DashboardOverviewView.vue#L654) **Text**: Traffic quality
- [L655](../src/components/dashboard/DashboardOverviewView.vue#L655) **Text**: Page views are deduplicated per visitor and event each hour so refreshes do not inflate the number.
- [L668](../src/components/dashboard/DashboardOverviewView.vue#L668) **Text**: Unique visitors
- [L671](../src/components/dashboard/DashboardOverviewView.vue#L671) **Control / attribute**: value
- [L672](../src/components/dashboard/DashboardOverviewView.vue#L672) **Dynamic**: {{ formatNumber(overview.traffic.unique_visitors) }}
- [L677](../src/components/dashboard/DashboardOverviewView.vue#L677) **Text**: Visitors who became buyers
- [L680](../src/components/dashboard/DashboardOverviewView.vue#L680) **Control / attribute**: value
- [L681](../src/components/dashboard/DashboardOverviewView.vue#L681) **Dynamic**: {{ formatNumber(overview.traffic.converted_visitors) }}
- [L686](../src/components/dashboard/DashboardOverviewView.vue#L686) **Text**: Visitor-to-buyer conversion
- [L689](../src/components/dashboard/DashboardOverviewView.vue#L689) **Control / attribute**: value
- [L690](../src/components/dashboard/DashboardOverviewView.vue#L690) **Dynamic**: {{ formatPercent(overview.traffic.conversion_percent) }}

### DashboardAttendeesView.vue

- [L5](../src/components/dashboard/DashboardAttendeesView.vue#L5) **Text**: Attendees
- [L9](../src/components/dashboard/DashboardAttendeesView.vue#L9) **Text**: Meet your
- [L9](../src/components/dashboard/DashboardAttendeesView.vue#L9) **Text**: attendees.
- [L10](../src/components/dashboard/DashboardAttendeesView.vue#L10) **Text**: See who is coming and help everyone feel ready for event day.
- [L14](../src/components/dashboard/DashboardAttendeesView.vue#L14) **Text**: Total attendees
- [L14](../src/components/dashboard/DashboardAttendeesView.vue#L14) **Text**: 612
- [L15](../src/components/dashboard/DashboardAttendeesView.vue#L15) **Text**: VIP guests
- [L15](../src/components/dashboard/DashboardAttendeesView.vue#L15) **Text**: 38
- [L16](../src/components/dashboard/DashboardAttendeesView.vue#L16) **Text**: Need update
- [L16](../src/components/dashboard/DashboardAttendeesView.vue#L16) **Text**: 1
- [L21](../src/components/dashboard/DashboardAttendeesView.vue#L21) **Control / attribute**: title
- [L21](../src/components/dashboard/DashboardAttendeesView.vue#L21) **Text**: Recent buyers
- [L22](../src/components/dashboard/DashboardAttendeesView.vue#L22) **Text**: When doors open, head to Door Check-in to welcome everyone in.
- [L24](../src/components/dashboard/DashboardAttendeesView.vue#L24) **Text**: AO
- [L24](../src/components/dashboard/DashboardAttendeesView.vue#L24) **Text**: Adaeze Okonkwo
- [L24](../src/components/dashboard/DashboardAttendeesView.vue#L24) **Text**: VIP - #8821
- [L24](../src/components/dashboard/DashboardAttendeesView.vue#L24) **Text**: Paid
- [L25](../src/components/dashboard/DashboardAttendeesView.vue#L25) **Text**: BM
- [L25](../src/components/dashboard/DashboardAttendeesView.vue#L25) **Text**: Biodun Martins
- [L25](../src/components/dashboard/DashboardAttendeesView.vue#L25) **Text**: General - #8822
- [L25](../src/components/dashboard/DashboardAttendeesView.vue#L25) **Text**: Paid
- [L26](../src/components/dashboard/DashboardAttendeesView.vue#L26) **Text**: CA
- [L26](../src/components/dashboard/DashboardAttendeesView.vue#L26) **Text**: Chioma Adekunle
- [L26](../src/components/dashboard/DashboardAttendeesView.vue#L26) **Text**: Early Bird - #8823
- [L26](../src/components/dashboard/DashboardAttendeesView.vue#L26) **Text**: Email missing
- [L27](../src/components/dashboard/DashboardAttendeesView.vue#L27) **Text**: EI
- [L27](../src/components/dashboard/DashboardAttendeesView.vue#L27) **Text**: Emeka Ifeanyi
- [L27](../src/components/dashboard/DashboardAttendeesView.vue#L27) **Text**: VIP - #8825
- [L27](../src/components/dashboard/DashboardAttendeesView.vue#L27) **Text**: Paid

### DashboardShareView.vue

- [L228](../src/components/dashboard/DashboardShareView.vue#L228) **Text**: Share event
- [L232](../src/components/dashboard/DashboardShareView.vue#L232) **Text**: Share your
- [L234](../src/components/dashboard/DashboardShareView.vue#L234) **Text**: event.
- [L237](../src/components/dashboard/DashboardShareView.vue#L237) **Text**: Every link below has its own source code, so the dashboard can match visits and buyers without trusting a number from the browser.
- [L242](../src/components/dashboard/DashboardShareView.vue#L242) **Control / attribute**: v-if="error"
- [L247](../src/components/dashboard/DashboardShareView.vue#L247) **Dynamic**: {{ error }}
- [L254](../src/components/dashboard/DashboardShareView.vue#L254) **Control / attribute**: title; title
- [L254](../src/components/dashboard/DashboardShareView.vue#L254) **Text**: Links ready
- [L258](../src/components/dashboard/DashboardShareView.vue#L258) **Text**: Choose a link for every place you share
- [L262](../src/components/dashboard/DashboardShareView.vue#L262) **Text**: Visits are deduplicated per person and event each hour, and purchases are attributed server-side.
- [L270](../src/components/dashboard/DashboardShareView.vue#L270) **Dynamic**: {{ formatNumber(links.length) }}
- [L271](../src/components/dashboard/DashboardShareView.vue#L271) **Text**: active links
- [L275](../src/components/dashboard/DashboardShareView.vue#L275) **Dynamic**: {{ formatNumber(trackedViews) }}
- [L276](../src/components/dashboard/DashboardShareView.vue#L276) **Text**: tracked views
- [L280](../src/components/dashboard/DashboardShareView.vue#L280) **Dynamic**: {{ formatNumber(matchedBuyers) }}
- [L281](../src/components/dashboard/DashboardShareView.vue#L281) **Text**: matched buyers
- [L285](../src/components/dashboard/DashboardShareView.vue#L285) **Control / attribute**: v-if="loading"
- [L288](../src/components/dashboard/DashboardShareView.vue#L288) **Text**: Loading your links…
- [L292](../src/components/dashboard/DashboardShareView.vue#L292) **Control / attribute**: v-else; aria-label="Generated event links"
- [L297](../src/components/dashboard/DashboardShareView.vue#L297) **Control / attribute**: v-for="link in links"
- [L303](../src/components/dashboard/DashboardShareView.vue#L303) **Dynamic**: {{ link.label }}
- [L305](../src/components/dashboard/DashboardShareView.vue#L305) **Dynamic**: {{ sourceNote(link.source_code) }}
- [L305](../src/components/dashboard/DashboardShareView.vue#L305) **Text**: ·
- [L306](../src/components/dashboard/DashboardShareView.vue#L306) **Dynamic**: {{ formatNumber(link.views) }}
- [L306](../src/components/dashboard/DashboardShareView.vue#L306) **Text**: views ·
- [L307](../src/components/dashboard/DashboardShareView.vue#L307) **Dynamic**: {{ formatNumber(link.buyers) }}
- [L307](../src/components/dashboard/DashboardShareView.vue#L307) **Text**: buyers ·
- [L308](../src/components/dashboard/DashboardShareView.vue#L308) **Dynamic**: {{ formatPercent(link.conversion_percent) }}
- [L308](../src/components/dashboard/DashboardShareView.vue#L308) **Text**: conversion
- [L313](../src/components/dashboard/DashboardShareView.vue#L313) **Dynamic**: {{ displayUrl(link.source_code) }}
- [L317](../src/components/dashboard/DashboardShareView.vue#L317) **Control / attribute**: @click="copyLink(link)"
- [L320](../src/components/dashboard/DashboardShareView.vue#L320) **Text**: Copy
- [L324](../src/components/dashboard/DashboardShareView.vue#L324) **Control / attribute**: @click="shareLink(link)"
- [L327](../src/components/dashboard/DashboardShareView.vue#L327) **Text**: Share
- [L335](../src/components/dashboard/DashboardShareView.vue#L335) **Control / attribute**: v-if="!showCustomLink"; @click="showCustomLink = true"
- [L340](../src/components/dashboard/DashboardShareView.vue#L340) **Text**: Create a link for another group
- [L344](../src/components/dashboard/DashboardShareView.vue#L344) **Control / attribute**: v-else; @submit.prevent="addCustomLink"
- [L349](../src/components/dashboard/DashboardShareView.vue#L349) **Control / attribute**: v-model="customLabel"; placeholder="e.g. church group, school alumni"
- [L356](../src/components/dashboard/DashboardShareView.vue#L356) **Control / attribute**: :disabled="creating"
- [L360](../src/components/dashboard/DashboardShareView.vue#L360) **Dynamic**: {{ creating ? 'Creating…' : 'Create' }}
- [L363](../src/components/dashboard/DashboardShareView.vue#L363) **Control / attribute**: :disabled="creating"; @click=" showCustomLink = false; customLabel = ''; "
- [L370](../src/components/dashboard/DashboardShareView.vue#L370) **Text**: Cancel
- [L376](../src/components/dashboard/DashboardShareView.vue#L376) **Control / attribute**: v-if="linkFeedback"
- [L380](../src/components/dashboard/DashboardShareView.vue#L380) **Dynamic**: {{ linkFeedback }}
- [L389](../src/components/dashboard/DashboardShareView.vue#L389) **Text**: Ticket performance
- [L390](../src/components/dashboard/DashboardShareView.vue#L390) **Text**: Current paid sales for this event.
- [L396](../src/components/dashboard/DashboardShareView.vue#L396) **Control / attribute**: v-if="overview.ticket_types?.length"
- [L400](../src/components/dashboard/DashboardShareView.vue#L400) **Control / attribute**: v-for="tier in overview.ticket_types"
- [L406](../src/components/dashboard/DashboardShareView.vue#L406) **Dynamic**: {{ tier.name }}
- [L407](../src/components/dashboard/DashboardShareView.vue#L407) **Dynamic**: {{ tierCopy(tier) }}
- [L411](../src/components/dashboard/DashboardShareView.vue#L411) **Dynamic**: {{ formatPercent(tier.sold_percent) }}
- [L415](../src/components/dashboard/DashboardShareView.vue#L415) **Dynamic**: {{ formatMoneyMinor( tier.revenue_minor, overview.revenue.currency, ) }}
- [L425](../src/components/dashboard/DashboardShareView.vue#L425) **Control / attribute**: v-else
- [L428](../src/components/dashboard/DashboardShareView.vue#L428) **Text**: No paid ticket tiers to show yet.
- [L435](../src/components/dashboard/DashboardShareView.vue#L435) **Text**: Top buyer channels
- [L436](../src/components/dashboard/DashboardShareView.vue#L436) **Text**: Buyers are assigned once to their most recent purchase source, so the percentages stay understandable.
- [L441](../src/components/dashboard/DashboardShareView.vue#L441) **Control / attribute**: v-if="topSources.length"
- [L445](../src/components/dashboard/DashboardShareView.vue#L445) **Control / attribute**: v-for="source in topSources"
- [L452](../src/components/dashboard/DashboardShareView.vue#L452) **Dynamic**: {{ source.label }}
- [L456](../src/components/dashboard/DashboardShareView.vue#L456) **Dynamic**: {{ formatNumber(source.buyers) }}
- [L456](../src/components/dashboard/DashboardShareView.vue#L456) **Text**: buyers ·
- [L457](../src/components/dashboard/DashboardShareView.vue#L457) **Dynamic**: {{ formatMoneyMinor( source.revenue_minor, overview.revenue.currency, ) }}
- [L478](../src/components/dashboard/DashboardShareView.vue#L478) **Dynamic**: {{ formatPercent(source.buyer_share_percent) }}
- [L483](../src/components/dashboard/DashboardShareView.vue#L483) **Control / attribute**: v-else
- [L486](../src/components/dashboard/DashboardShareView.vue#L486) **Text**: Source performance will appear after people start using your tracked links.
- [L499](../src/components/dashboard/DashboardShareView.vue#L499) **Text**: Base event link
- [L505](../src/components/dashboard/DashboardShareView.vue#L505) **Dynamic**: {{ publicUrl }}
- [L508](../src/components/dashboard/DashboardShareView.vue#L508) **Control / attribute**: @click="copyBaseLink"
- [L512](../src/components/dashboard/DashboardShareView.vue#L512) **Text**: Copy link

### DashboardPromoView.vue

- [L5](../src/components/dashboard/DashboardPromoView.vue#L5) **Text**: Promo codes
- [L6](../src/components/dashboard/DashboardPromoView.vue#L6) **Text**: Give sales a
- [L6](../src/components/dashboard/DashboardPromoView.vue#L6) **Text**: little boost.
- [L7](../src/components/dashboard/DashboardPromoView.vue#L7) **Text**: Create a promo code that gives more people a reason to join you.
- [L10](../src/components/dashboard/DashboardPromoView.vue#L10) **Text**: Active codes
- [L10](../src/components/dashboard/DashboardPromoView.vue#L10) **Text**: 3
- [L11](../src/components/dashboard/DashboardPromoView.vue#L11) **Text**: Total uses
- [L11](../src/components/dashboard/DashboardPromoView.vue#L11) **Text**: 87
- [L12](../src/components/dashboard/DashboardPromoView.vue#L12) **Text**: Revenue from codes
- [L12](../src/components/dashboard/DashboardPromoView.vue#L12) **Text**: ₦620K
- [L15](../src/components/dashboard/DashboardPromoView.vue#L15) **Text**: Active codes
- [L16](../src/components/dashboard/DashboardPromoView.vue#L16) **Text**: LASVIP30
- [L16](../src/components/dashboard/DashboardPromoView.vue#L16) **Text**: 30% off VIP tickets
- [L16](../src/components/dashboard/DashboardPromoView.vue#L16) **Text**: Expires May 10 · No use limit
- [L16](../src/components/dashboard/DashboardPromoView.vue#L16) **Text**: 42
- [L16](../src/components/dashboard/DashboardPromoView.vue#L16) **Text**: times used
- [L17](../src/components/dashboard/DashboardPromoView.vue#L17) **Text**: FRIENDS
- [L17](../src/components/dashboard/DashboardPromoView.vue#L17) **Text**: ₦2,000 off any ticket
- [L17](../src/components/dashboard/DashboardPromoView.vue#L17) **Text**: No expiry · Max 50 uses
- [L17](../src/components/dashboard/DashboardPromoView.vue#L17) **Text**: 29
- [L17](../src/components/dashboard/DashboardPromoView.vue#L17) **Text**: times used
- [L18](../src/components/dashboard/DashboardPromoView.vue#L18) **Text**: MEDIA50
- [L18](../src/components/dashboard/DashboardPromoView.vue#L18) **Text**: Free ticket (100% off)
- [L18](../src/components/dashboard/DashboardPromoView.vue#L18) **Text**: Expires Apr 30 · Max 20 uses
- [L18](../src/components/dashboard/DashboardPromoView.vue#L18) **Text**: 16
- [L18](../src/components/dashboard/DashboardPromoView.vue#L18) **Text**: times used
- [L20](../src/components/dashboard/DashboardPromoView.vue#L20) **Text**: Expired
- [L21](../src/components/dashboard/DashboardPromoView.vue#L21) **Text**: EARLYBIRD
- [L21](../src/components/dashboard/DashboardPromoView.vue#L21) **Text**: 20% off Early Bird
- [L21](../src/components/dashboard/DashboardPromoView.vue#L21) **Text**: Expired Apr 1
- [L21](../src/components/dashboard/DashboardPromoView.vue#L21) **Text**: -
- [L24](../src/components/dashboard/DashboardPromoView.vue#L24) **Text**: Create a new promo code

### DashboardEmailView.vue

- [L5](../src/components/dashboard/DashboardEmailView.vue#L5) **Text**: Message attendees
- [L6](../src/components/dashboard/DashboardEmailView.vue#L6) **Text**: Keep everyone
- [L6](../src/components/dashboard/DashboardEmailView.vue#L6) **Text**: in the loop.
- [L7](../src/components/dashboard/DashboardEmailView.vue#L7) **Text**: Share an update with all 612 people coming to your event.
- [L9](../src/components/dashboard/DashboardEmailView.vue#L9) **Text**: This email will reach all 612 attendees. Give it one last look before sending.
- [L11](../src/components/dashboard/DashboardEmailView.vue#L11) **Text**: To
- [L11](../src/components/dashboard/DashboardEmailView.vue#L11) **Text**: All attendees (612)
- [L12](../src/components/dashboard/DashboardEmailView.vue#L12) **Text**: Subject
- [L12](../src/components/dashboard/DashboardEmailView.vue#L12) **Control / attribute**: placeholder="Write a subject line..."; value="Quick update about Comedy Meets Dance"
- [L13](../src/components/dashboard/DashboardEmailView.vue#L13) **Text**: Hey everyone!
- [L13](../src/components/dashboard/DashboardEmailView.vue#L13) **Text**: Just a quick note ahead of next week. Doors open at 5:30 PM, 30 minutes before the show starts. Come early to grab your spot.
- [L13](../src/components/dashboard/DashboardEmailView.vue#L13) **Text**: Free parking is available through the main gate on Adetokunbo Ademola Street.
- [L13](../src/components/dashboard/DashboardEmailView.vue#L13) **Text**: Can't wait to see you all there!
- [L13](../src/components/dashboard/DashboardEmailView.vue#L13) **Text**: - Rush Hour Entertainment
- [L16](../src/components/dashboard/DashboardEmailView.vue#L16) **Text**: Save draft
- [L16](../src/components/dashboard/DashboardEmailView.vue#L16) **Text**: Send to 612 people
- [L20](../src/components/dashboard/DashboardEmailView.vue#L20) **Control / attribute**: title
- [L20](../src/components/dashboard/DashboardEmailView.vue#L20) **Text**: Past emails
- [L21](../src/components/dashboard/DashboardEmailView.vue#L21) **Text**: You're in! Comedy Meets Dance
- [L21](../src/components/dashboard/DashboardEmailView.vue#L21) **Text**: Confirmation · 612 sent · Apr 14
- [L21](../src/components/dashboard/DashboardEmailView.vue#L21) **Text**: 84%
- [L21](../src/components/dashboard/DashboardEmailView.vue#L21) **Text**: Opened
- [L21](../src/components/dashboard/DashboardEmailView.vue#L21) **Text**: 22%
- [L21](../src/components/dashboard/DashboardEmailView.vue#L21) **Text**: Clicked
- [L22](../src/components/dashboard/DashboardEmailView.vue#L22) **Text**: VIP spots almost gone
- [L22](../src/components/dashboard/DashboardEmailView.vue#L22) **Text**: Manual · 540 sent · Apr 22
- [L22](../src/components/dashboard/DashboardEmailView.vue#L22) **Text**: 71%
- [L22](../src/components/dashboard/DashboardEmailView.vue#L22) **Text**: Opened
- [L22](../src/components/dashboard/DashboardEmailView.vue#L22) **Text**: 31%
- [L22](../src/components/dashboard/DashboardEmailView.vue#L22) **Text**: Clicked

### DashboardCheckinView.vue

- [L5](../src/components/dashboard/DashboardCheckinView.vue#L5) **Text**: Door check-in
- [L6](../src/components/dashboard/DashboardCheckinView.vue#L6) **Text**: Welcome them
- [L6](../src/components/dashboard/DashboardCheckinView.vue#L6) **Text**: in.
- [L7](../src/components/dashboard/DashboardCheckinView.vue#L7) **Text**: Scan ticket QR codes at the door, or find an attendee by name.
- [L10](../src/components/dashboard/DashboardCheckinView.vue#L10) **Text**: Checked in
- [L10](../src/components/dashboard/DashboardCheckinView.vue#L10) **Text**: 312
- [L11](../src/components/dashboard/DashboardCheckinView.vue#L11) **Text**: Not yet arrived
- [L11](../src/components/dashboard/DashboardCheckinView.vue#L11) **Text**: 300
- [L12](../src/components/dashboard/DashboardCheckinView.vue#L12) **Text**: Check-in rate
- [L12](../src/components/dashboard/DashboardCheckinView.vue#L12) **Text**: 51%
- [L15](../src/components/dashboard/DashboardCheckinView.vue#L15) **Text**: Event QR code
- [L18](../src/components/dashboard/DashboardCheckinView.vue#L18) **Text**: Print or display this at the entrance so attendees can check in with ease.
- [L20](../src/components/dashboard/DashboardCheckinView.vue#L20) **Text**: Download QR
- [L21](../src/components/dashboard/DashboardCheckinView.vue#L21) **Text**: Print page
- [L27](../src/components/dashboard/DashboardCheckinView.vue#L27) **Text**: Search by name or ticket number...
- [L28](../src/components/dashboard/DashboardCheckinView.vue#L28) **Text**: AO
- [L28](../src/components/dashboard/DashboardCheckinView.vue#L28) **Text**: Adaeze Okonkwo
- [L28](../src/components/dashboard/DashboardCheckinView.vue#L28) **Text**: VIP · #8821
- [L28](../src/components/dashboard/DashboardCheckinView.vue#L28) **Text**: In
- [L29](../src/components/dashboard/DashboardCheckinView.vue#L29) **Text**: BM
- [L29](../src/components/dashboard/DashboardCheckinView.vue#L29) **Text**: Biodun Martins
- [L29](../src/components/dashboard/DashboardCheckinView.vue#L29) **Text**: General · #8822
- [L29](../src/components/dashboard/DashboardCheckinView.vue#L29) **Text**: In
- [L30](../src/components/dashboard/DashboardCheckinView.vue#L30) **Text**: CA
- [L30](../src/components/dashboard/DashboardCheckinView.vue#L30) **Text**: Chioma Adekunle
- [L30](../src/components/dashboard/DashboardCheckinView.vue#L30) **Text**: Early Bird · #8823
- [L30](../src/components/dashboard/DashboardCheckinView.vue#L30) **Text**: Waiting
- [L31](../src/components/dashboard/DashboardCheckinView.vue#L31) **Text**: DO
- [L31](../src/components/dashboard/DashboardCheckinView.vue#L31) **Text**: Dami Olawale
- [L31](../src/components/dashboard/DashboardCheckinView.vue#L31) **Text**: General · #8824
- [L31](../src/components/dashboard/DashboardCheckinView.vue#L31) **Text**: In
- [L32](../src/components/dashboard/DashboardCheckinView.vue#L32) **Text**: EI
- [L32](../src/components/dashboard/DashboardCheckinView.vue#L32) **Text**: Emeka Ifeanyi
- [L32](../src/components/dashboard/DashboardCheckinView.vue#L32) **Text**: VIP · #8825
- [L32](../src/components/dashboard/DashboardCheckinView.vue#L32) **Text**: Waiting

### DashboardPayoutView.vue

- [L5](../src/components/dashboard/DashboardPayoutView.vue#L5) **Text**: Earnings
- [L6](../src/components/dashboard/DashboardPayoutView.vue#L6) **Text**: Your event is
- [L6](../src/components/dashboard/DashboardPayoutView.vue#L6) **Text**: earning.
- [L7](../src/components/dashboard/DashboardPayoutView.vue#L7) **Text**: See what your event has earned, the fees covered, and what is ready to withdraw.
- [L10](../src/components/dashboard/DashboardPayoutView.vue#L10) **Text**: Available to withdraw
- [L10](../src/components/dashboard/DashboardPayoutView.vue#L10) **Text**: ₦7,415,000
- [L10](../src/components/dashboard/DashboardPayoutView.vue#L10) **Text**: After 5% platform fee · ₦390,263 deducted
- [L11](../src/components/dashboard/DashboardPayoutView.vue#L11) **Text**: Withdraw now
- [L14](../src/components/dashboard/DashboardPayoutView.vue#L14) **Text**: Payout account
- [L16](../src/components/dashboard/DashboardPayoutView.vue#L16) **Text**: Bank
- [L16](../src/components/dashboard/DashboardPayoutView.vue#L16) **Text**: GTBank
- [L16](../src/components/dashboard/DashboardPayoutView.vue#L16) **Text**: Account number
- [L16](../src/components/dashboard/DashboardPayoutView.vue#L16) **Text**: ••••••7823
- [L17](../src/components/dashboard/DashboardPayoutView.vue#L17) **Text**: Account name
- [L17](../src/components/dashboard/DashboardPayoutView.vue#L17) **Text**: Rush Hour Entertainment Ltd
- [L22](../src/components/dashboard/DashboardPayoutView.vue#L22) **Control / attribute**: title
- [L22](../src/components/dashboard/DashboardPayoutView.vue#L22) **Text**: Transactions
- [L23](../src/components/dashboard/DashboardPayoutView.vue#L23) **Text**: 4 tickets sold - General, VIP
- [L23](../src/components/dashboard/DashboardPayoutView.vue#L23) **Text**: Apr 27 · 11:34 PM
- [L23](../src/components/dashboard/DashboardPayoutView.vue#L23) **Text**: +₦50,000
- [L24](../src/components/dashboard/DashboardPayoutView.vue#L24) **Text**: 2 tickets sold - Early Bird
- [L24](../src/components/dashboard/DashboardPayoutView.vue#L24) **Text**: Apr 27 · 9:10 AM
- [L24](../src/components/dashboard/DashboardPayoutView.vue#L24) **Text**: +₦10,000
- [L25](../src/components/dashboard/DashboardPayoutView.vue#L25) **Text**: Platform fee
- [L25](../src/components/dashboard/DashboardPayoutView.vue#L25) **Text**: Apr 27 · 9:10 AM
- [L25](../src/components/dashboard/DashboardPayoutView.vue#L25) **Text**: -₦500
- [L26](../src/components/dashboard/DashboardPayoutView.vue#L26) **Text**: 1 Gold Table sold
- [L26](../src/components/dashboard/DashboardPayoutView.vue#L26) **Text**: Apr 26 · 3:55 PM
- [L26](../src/components/dashboard/DashboardPayoutView.vue#L26) **Text**: +₦250,000

### DashboardSettingsView.vue

- [L5](../src/components/dashboard/DashboardSettingsView.vue#L5) **Text**: Event settings
- [L6](../src/components/dashboard/DashboardSettingsView.vue#L6) **Text**: Event
- [L6](../src/components/dashboard/DashboardSettingsView.vue#L6) **Text**: settings.
- [L7](../src/components/dashboard/DashboardSettingsView.vue#L7) **Text**: Choose how people find your event, which updates you receive, and how your event is managed.
- [L10](../src/components/dashboard/DashboardSettingsView.vue#L10) **Text**: Visibility
- [L11](../src/components/dashboard/DashboardSettingsView.vue#L11) **Text**: Event is public
- [L11](../src/components/dashboard/DashboardSettingsView.vue#L11) **Text**: Anyone with the link can find and buy tickets
- [L12](../src/components/dashboard/DashboardSettingsView.vue#L12) **Text**: Show on Rush Hour discovery
- [L12](../src/components/dashboard/DashboardSettingsView.vue#L12) **Text**: Your event appears in search and browse
- [L13](../src/components/dashboard/DashboardSettingsView.vue#L13) **Text**: Show exact attendee count
- [L13](../src/components/dashboard/DashboardSettingsView.vue#L13) **Text**: Public can see "612 people going"
- [L15](../src/components/dashboard/DashboardSettingsView.vue#L15) **Text**: Notifications
- [L16](../src/components/dashboard/DashboardSettingsView.vue#L16) **Text**: Email me every new ticket sale
- [L16](../src/components/dashboard/DashboardSettingsView.vue#L16) **Text**: Get an email each time someone buys
- [L17](../src/components/dashboard/DashboardSettingsView.vue#L17) **Text**: Daily summary email
- [L17](../src/components/dashboard/DashboardSettingsView.vue#L17) **Text**: One email a day with sales numbers
- [L18](../src/components/dashboard/DashboardSettingsView.vue#L18) **Text**: Notify when 90% sold out
- [L18](../src/components/dashboard/DashboardSettingsView.vue#L18) **Text**: We'll tell you when you're nearly full
- [L22](../src/components/dashboard/DashboardSettingsView.vue#L22) **Control / attribute**: title
- [L22](../src/components/dashboard/DashboardSettingsView.vue#L22) **Text**: Important actions
- [L22](../src/components/dashboard/DashboardSettingsView.vue#L22) **Text**: These changes affect your whole event, so take a moment before continuing.
- [L23](../src/components/dashboard/DashboardSettingsView.vue#L23) **Text**: Pause ticket sales
- [L23](../src/components/dashboard/DashboardSettingsView.vue#L23) **Text**: Stop new purchases. Current tickets stay valid.
- [L23](../src/components/dashboard/DashboardSettingsView.vue#L23) **Text**: Pause sales
- [L24](../src/components/dashboard/DashboardSettingsView.vue#L24) **Text**: Cancel this event
- [L24](../src/components/dashboard/DashboardSettingsView.vue#L24) **Text**: All buyers get a full refund. This cannot be undone.
- [L24](../src/components/dashboard/DashboardSettingsView.vue#L24) **Text**: Cancel event
- [L25](../src/components/dashboard/DashboardSettingsView.vue#L25) **Text**: Delete this event
- [L25](../src/components/dashboard/DashboardSettingsView.vue#L25) **Text**: Permanently removes the event and all data.
- [L25](../src/components/dashboard/DashboardSettingsView.vue#L25) **Text**: Delete event

### DashboardContentSkeleton.vue

- [L10](../src/components/dashboard/DashboardContentSkeleton.vue#L10) **Text**: Loading dashboard content
- [L12](../src/components/dashboard/DashboardContentSkeleton.vue#L12) **Control / attribute**: v-if="page === 'overview'"
- [L13](../src/components/dashboard/DashboardContentSkeleton.vue#L13) **Control / attribute**: title
- [L15](../src/components/dashboard/DashboardContentSkeleton.vue#L15) **Control / attribute**: v-for="i in 4"
- [L15](../src/components/dashboard/DashboardContentSkeleton.vue#L15) **Control / attribute**: value
- [L18](../src/components/dashboard/DashboardContentSkeleton.vue#L18) **Control / attribute**: title
- [L19](../src/components/dashboard/DashboardContentSkeleton.vue#L19) **Control / attribute**: title
- [L19](../src/components/dashboard/DashboardContentSkeleton.vue#L19) **Control / attribute**: v-for="i in 3"
- [L20](../src/components/dashboard/DashboardContentSkeleton.vue#L20) **Control / attribute**: v-for="i in 2"
- [L20](../src/components/dashboard/DashboardContentSkeleton.vue#L20) **Control / attribute**: title
- [L20](../src/components/dashboard/DashboardContentSkeleton.vue#L20) **Control / attribute**: v-for="j in 3"
- [L21](../src/components/dashboard/DashboardContentSkeleton.vue#L21) **Control / attribute**: title
- [L22](../src/components/dashboard/DashboardContentSkeleton.vue#L22) **Control / attribute**: v-for="i in 3"
- [L22](../src/components/dashboard/DashboardContentSkeleton.vue#L22) **Control / attribute**: value
- [L26](../src/components/dashboard/DashboardContentSkeleton.vue#L26) **Control / attribute**: v-else
- [L27](../src/components/dashboard/DashboardContentSkeleton.vue#L27) **Control / attribute**: title
- [L29](../src/components/dashboard/DashboardContentSkeleton.vue#L29) **Control / attribute**: v-if="page === 'attendees'"
- [L30](../src/components/dashboard/DashboardContentSkeleton.vue#L30) **Control / attribute**: v-for="i in 3"
- [L30](../src/components/dashboard/DashboardContentSkeleton.vue#L30) **Control / attribute**: value
- [L31](../src/components/dashboard/DashboardContentSkeleton.vue#L31) **Control / attribute**: title
- [L31](../src/components/dashboard/DashboardContentSkeleton.vue#L31) **Control / attribute**: v-for="i in 4"
- [L34](../src/components/dashboard/DashboardContentSkeleton.vue#L34) **Control / attribute**: v-else-if="page === 'checkin'"
- [L35](../src/components/dashboard/DashboardContentSkeleton.vue#L35) **Control / attribute**: v-for="i in 3"
- [L35](../src/components/dashboard/DashboardContentSkeleton.vue#L35) **Control / attribute**: value
- [L37](../src/components/dashboard/DashboardContentSkeleton.vue#L37) **Control / attribute**: v-for="i in 5"
- [L40](../src/components/dashboard/DashboardContentSkeleton.vue#L40) **Control / attribute**: v-else-if="page === 'email'"
- [L42](../src/components/dashboard/DashboardContentSkeleton.vue#L42) **Control / attribute**: v-for="i in 6"
- [L43](../src/components/dashboard/DashboardContentSkeleton.vue#L43) **Control / attribute**: title
- [L43](../src/components/dashboard/DashboardContentSkeleton.vue#L43) **Control / attribute**: v-for="i in 2"
- [L46](../src/components/dashboard/DashboardContentSkeleton.vue#L46) **Control / attribute**: v-else-if="page === 'promo'"
- [L47](../src/components/dashboard/DashboardContentSkeleton.vue#L47) **Control / attribute**: v-for="i in 3"
- [L47](../src/components/dashboard/DashboardContentSkeleton.vue#L47) **Control / attribute**: value
- [L48](../src/components/dashboard/DashboardContentSkeleton.vue#L48) **Control / attribute**: v-for="i in 3"
- [L51](../src/components/dashboard/DashboardContentSkeleton.vue#L51) **Control / attribute**: v-else-if="page === 'share'"
- [L53](../src/components/dashboard/DashboardContentSkeleton.vue#L53) **Control / attribute**: title
- [L53](../src/components/dashboard/DashboardContentSkeleton.vue#L53) **Control / attribute**: v-for="i in 3"
- [L53](../src/components/dashboard/DashboardContentSkeleton.vue#L53) **Control / attribute**: v-for="i in 3"
- [L54](../src/components/dashboard/DashboardContentSkeleton.vue#L54) **Control / attribute**: v-for="i in 2"
- [L54](../src/components/dashboard/DashboardContentSkeleton.vue#L54) **Control / attribute**: title
- [L54](../src/components/dashboard/DashboardContentSkeleton.vue#L54) **Control / attribute**: v-for="j in 3"
- [L55](../src/components/dashboard/DashboardContentSkeleton.vue#L55) **Control / attribute**: v-for="i in 6"
- [L56](../src/components/dashboard/DashboardContentSkeleton.vue#L56) **Control / attribute**: title
- [L59](../src/components/dashboard/DashboardContentSkeleton.vue#L59) **Control / attribute**: v-else-if="page === 'payout'"
- [L61](../src/components/dashboard/DashboardContentSkeleton.vue#L61) **Control / attribute**: v-for="i in 2"
- [L62](../src/components/dashboard/DashboardContentSkeleton.vue#L62) **Control / attribute**: title
- [L62](../src/components/dashboard/DashboardContentSkeleton.vue#L62) **Control / attribute**: v-for="i in 4"
- [L65](../src/components/dashboard/DashboardContentSkeleton.vue#L65) **Control / attribute**: v-else-if="page === 'settings'"
- [L66](../src/components/dashboard/DashboardContentSkeleton.vue#L66) **Control / attribute**: v-for="group in 2"
- [L66](../src/components/dashboard/DashboardContentSkeleton.vue#L66) **Control / attribute**: v-for="i in 3"
- [L67](../src/components/dashboard/DashboardContentSkeleton.vue#L67) **Control / attribute**: title
- [L67](../src/components/dashboard/DashboardContentSkeleton.vue#L67) **Control / attribute**: v-for="i in 3"
- [L70](../src/components/dashboard/DashboardContentSkeleton.vue#L70) **Control / attribute**: v-else-if="page === 'insights'"
- [L71](../src/components/dashboard/DashboardContentSkeleton.vue#L71) **Control / attribute**: v-for="i in 4"
- [L71](../src/components/dashboard/DashboardContentSkeleton.vue#L71) **Control / attribute**: value
- [L71](../src/components/dashboard/DashboardContentSkeleton.vue#L71) **Control / attribute**: title
- [L74](../src/components/dashboard/DashboardContentSkeleton.vue#L74) **Control / attribute**: v-else-if="page.startsWith('edit-')"
- [L76](../src/components/dashboard/DashboardContentSkeleton.vue#L76) **Control / attribute**: v-if="page === 'edit-1'"
- [L76](../src/components/dashboard/DashboardContentSkeleton.vue#L76) **Control / attribute**: v-for="group in 3"
- [L76](../src/components/dashboard/DashboardContentSkeleton.vue#L76) **Control / attribute**: v-for="i in 2"
- [L76](../src/components/dashboard/DashboardContentSkeleton.vue#L76) **Control / attribute**: v-if="group === 2"
- [L77](../src/components/dashboard/DashboardContentSkeleton.vue#L77) **Control / attribute**: v-else-if="page === 'edit-2'"
- [L77](../src/components/dashboard/DashboardContentSkeleton.vue#L77) **Control / attribute**: v-for="group in 3"
- [L78](../src/components/dashboard/DashboardContentSkeleton.vue#L78) **Control / attribute**: v-else-if="page === 'edit-3'"
- [L78](../src/components/dashboard/DashboardContentSkeleton.vue#L78) **Control / attribute**: v-for="i in 4"
- [L78](../src/components/dashboard/DashboardContentSkeleton.vue#L78) **Control / attribute**: v-for="i in 2"
- [L79](../src/components/dashboard/DashboardContentSkeleton.vue#L79) **Control / attribute**: v-else
- [L79](../src/components/dashboard/DashboardContentSkeleton.vue#L79) **Control / attribute**: v-for="i in 5"

### DashboardInsightsView.vue (unlinked view)

- [L74](../src/components/dashboard/DashboardInsightsView.vue#L74) **Text**: Insights
- [L78](../src/components/dashboard/DashboardInsightsView.vue#L78) **Text**: See your event
- [L80](../src/components/dashboard/DashboardInsightsView.vue#L80) **Text**: grow.
- [L83](../src/components/dashboard/DashboardInsightsView.vue#L83) **Text**: Fresh numbers from paid orders, inventory, and tracked event visits.
- [L90](../src/components/dashboard/DashboardInsightsView.vue#L90) **Text**: Tickets sold
- [L92](../src/components/dashboard/DashboardInsightsView.vue#L92) **Dynamic**: {{ formatNumber(overview.sales.units_sold) }}
- [L95](../src/components/dashboard/DashboardInsightsView.vue#L95) **Dynamic**: {{ formatTrend( overview.sales.week_growth_state, overview.sales.week_growth_percent, overview.sales.this_week_units, ) }}
- [L106](../src/components/dashboard/DashboardInsightsView.vue#L106) **Text**: Revenue
- [L111](../src/components/dashboard/DashboardInsightsView.vue#L111) **Dynamic**: {{ formatMoneyMinor( overview.revenue.total_minor, overview.revenue.currency, { compact: true }, ) }}
- [L120](../src/components/dashboard/DashboardInsightsView.vue#L120) **Dynamic**: {{ formatMoneyMinor( overview.revenue.this_week_minor, overview.revenue.currency, { compact: true }, ) }}
- [L126](../src/components/dashboard/DashboardInsightsView.vue#L126) **Text**: this week
- [L132](../src/components/dashboard/DashboardInsightsView.vue#L132) **Text**: Spots left
- [L134](../src/components/dashboard/DashboardInsightsView.vue#L134) **Dynamic**: {{ formatNumber(overview.sales.available_units) }}
- [L136](../src/components/dashboard/DashboardInsightsView.vue#L136) **Text**: out of
- [L138](../src/components/dashboard/DashboardInsightsView.vue#L138) **Dynamic**: {{ formatNumber(overview.sales.capacity_units) }}
- [L143](../src/components/dashboard/DashboardInsightsView.vue#L143) **Text**: Page views
- [L145](../src/components/dashboard/DashboardInsightsView.vue#L145) **Dynamic**: {{ formatNumber(overview.traffic.page_views) }}
- [L148](../src/components/dashboard/DashboardInsightsView.vue#L148) **Dynamic**: {{ formatPercent( overview.traffic.conversion_percent, ) }}
- [L152](../src/components/dashboard/DashboardInsightsView.vue#L152) **Text**: convert
- [L162](../src/components/dashboard/DashboardInsightsView.vue#L162) **Control / attribute**: title
- [L162](../src/components/dashboard/DashboardInsightsView.vue#L162) **Text**: Tickets bought per day
- [L165](../src/components/dashboard/DashboardInsightsView.vue#L165) **Text**: Paid ticket units
- [L171](../src/components/dashboard/DashboardInsightsView.vue#L171) **Control / attribute**: v-for="range in ['7d', '30d', 'all']"; @click="selectedRange = range"
- [L179](../src/components/dashboard/DashboardInsightsView.vue#L179) **Dynamic**: {{ range === 'all' ? 'All' : range }}

### AccountMenu.vue

- [L6](../src/components/AccountMenu.vue#L6) **Control / attribute**: :aria-label="`Open account menu for ${displayName}`"; @click.stop="open=!open"
- [L6](../src/components/AccountMenu.vue#L6) **Control / attribute**: v-if="avatarUrl"; alt="displayName"
- [L6](../src/components/AccountMenu.vue#L6) **Control / attribute**: v-else
- [L6](../src/components/AccountMenu.vue#L6) **Dynamic**: {{initials}}
- [L6](../src/components/AccountMenu.vue#L6) **Control / attribute**: v-if="open"
- [L6](../src/components/AccountMenu.vue#L6) **Dynamic**: {{displayName}}
- [L6](../src/components/AccountMenu.vue#L6) **Control / attribute**: v-if="email"
- [L6](../src/components/AccountMenu.vue#L6) **Dynamic**: {{email}}
- [L6](../src/components/AccountMenu.vue#L6) **Control / attribute**: @click="closeMenu"
- [L6](../src/components/AccountMenu.vue#L6) **Dynamic**: {{destination.label}}
- [L6](../src/components/AccountMenu.vue#L6) **Control / attribute**: :disabled="loggingOut"; @click="handleLogout"
- [L6](../src/components/AccountMenu.vue#L6) **Dynamic**: {{loggingOut?'Logging out...':'Log out'}}

## Maintaining this reference

Update this document when navigation, screen wording, number definitions, controls, API shapes or fixtures change. Recheck DashboardManageContent.vue for reachable views and Dashboard.vue for state and navigation. Mark a capability operational only after its action and data path are connected and verified.

The older root-level event-view-and-dashboard-complete-reference.txt covers a broader journey. This document is scoped to the organiser?s single-event workspace.
