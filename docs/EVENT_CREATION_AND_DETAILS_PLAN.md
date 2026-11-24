# Event creation, editing, and the full event page

Reviewed: 24 November 2026.

This document compares the current frontend with the event information Rush Hour could support. It proposes how to keep creation short while allowing organisers to build a complete event page later. It is a product and frontend review, not an implementation or a backend contract audit.

**The recommendation:** create an event with the essentials, save it as a draft, and use Edit Event to complete its page and operations. Publishing is a separate readiness check. A field can be unnecessary for saving a draft but essential before attendees can register or buy.

## 1. Two inventories: what we collect and what the event page supports

### A. What Create Event collects today

The current wizard has four steps: **Basics -> Details -> Tickets -> Attendees**. These fields are also available through the existing Edit Event route.

| Area | Current fields | Current frontend behaviour |
| --- | --- | --- |
| Identity | Event title, category | Required to continue through Basics; title is limited to 100 characters. |
| Timing | Start, end, event timezone | Required; end must be later than start. Defaults suggest tomorrow's dates and Africa/Lagos; organisers should confirm them. |
| Schedule type | One-time or recurring | One-time is the default. Recurring reveals additional controls. |
| Recurrence | Daily, weekly, monthly; selected weekdays; monthly day number or numbered weekday; end date or occurrence count | First occurrence supplies the starting pattern and duration. The UI previews up to five dates and checks for overlaps. |
| Attendance format | In-person, online, hybrid | In-person is the default. This is separate from free/paid and one-time/recurring. |
| Physical location | Venue/address text, city, timezone | Venue is required for in-person and hybrid. City is included in the payload but is not required by the inspected frontend step validator. Venue suggestions can set timezone. |
| Online access | Meeting link | Required by the frontend for online and hybrid; HTTP or HTTPS link validation. |
| Main image | Cover image | Required to continue through Details and in the frontend publish checks. |
| More images | Additional images from uploads or URLs | Optional; gallery controls allow up to 20 additional images. |
| Event explanation | Description | Optional today; maximum 20,000 characters plus a byte-size check. |
| Organiser | Display name or organisation, website | Optional today. These are display fields, not proof of account ownership. |
| Discovery | Comma-separated tags | Optional. |
| Optional information | Parking, dress code, what to bring, agenda, speakers, food and drinks, getting there, FAQs | Optional text blocks selected by the organiser. Agenda, speakers, and FAQs are not full structured editors. |
| Admission model | Free or paid | Free is the default. No separate press, invitation-only, donation, or mixed free/paid mode is exposed here. |
| Free registration | Maximum spots | Optional capacity. Blank is sent as null; the backend's exact capacity semantics must remain authoritative. |
| Paid tickets | Name, individual/table unit, colour, price, units, people per unit, purchase limit, visibility, perks, sales start/end | Multiple products; up to 100 in the current UI. Paid prices must be above zero. A product with zero units has no stock. |
| Attendee form | Name, email, phone, company, job title, dietary needs, T-shirt size, referral source | Organiser selects enabled fields. Name and email stay required. Phone starts enabled but optional; the other additional fields start disabled. |

Attendee form configuration does not mean the organiser types attendee records during event creation. It decides what buyers or registrants will be asked later.

Paid ticket validation also checks numeric bounds, sales dates, and capacity against sold/reserved units. People per table becomes restricted when commitments exist. These frontend checks assist the organiser; Laravel must enforce the rules.

Saving a draft is already separate from publishing. The current Save Draft path persists through the create-event service; continuing through the wizard and publishing apply stronger frontend validation. Do not describe every field in this table as necessary just to save a draft.

### B. What a complete event details page can contain

"Supported for display" below means the frontend adapter and page can consume it. It does not prove that a live backend response supplies it, or that there is an organiser editor that can save it.

| Public information | What exists in the frontend | Where it should be authored |
| --- | --- | --- |
| Title, category, start/end, timezone | Collected and displayed | Create essentials; editable later. |
| Cover and event description | Collected and displayed | Cover and a short useful description before publication; longer description in Edit. |
| Short summary/tagline | Adapter accepts summary fields; no dedicated create input | Edit -> Event page. |
| Hero caption title and supporting caption | Adapter accepts these; display has fallback copy | Edit -> Event page, optional. |
| Tags | Collected and displayed | Optional at creation; editable later. |
| Venue and structured address | Create has venue/city; adapter can also consume structured street, state, country, venue name | Create the essential location; Edit can complete directions and address. A structured address editor is a gap. |
| Online joining instructions | Create collects meeting link; public page says the organiser shares joining details | Edit -> Attendance and access. Verify protected delivery to entitled attendees before claiming online access is complete. |
| Organiser name and website | Collected and displayed | Prefill from an authorised organiser profile where available, then confirm. |
| Organiser photograph and biography | Adapter accepts these; no dedicated create inputs | Reusable organiser profile plus event-specific overrides if needed. |
| Featured guests, artists, speakers, cast | Page supports name, role, biography, image, and related guest events; create only offers a Speakers text block | Edit -> People. Use one people model with appropriate roles rather than separate forms for every event category. |
| Crew and production credits | Page can display crew credits; not collected by Create | Edit -> People and credits, optional. |
| Agenda/schedule | Structured display supports time, title, description, label; create offers an Agenda text block | Edit -> Programme. Keep simple text compatibility while planning a structured editor. |
| Gallery/moments | Additional create images feed the gallery; adapter also supports captions and stored moments | Edit -> Media for a fuller gallery and captions. |
| Questions and answers | Display supports structured question/answer entries; create offers a text block | Edit -> FAQs. |
| Practical information | Extra text blocks already feed the public page | Optional during creation, completed in Edit. |
| Experience highlights | Adapter accepts event options/highlights; no dedicated field in the inspected create payload | Edit -> Event page; confirm a supported write contract before implementing. |
| Related events | Page consumes related events and loads recommendations | Derived from existing events; optional curated selection later, not manually re-entered event records. |
| Price, availability, sold-out/sales-ended status | Derived from ticket products, inventory, dates, and backend state | Ticket settings and server-calculated state. Never manually enter "sold out" as marketing data. |
| Lifecycle and cancellation state | Public adapter consumes lifecycle state; workspace has lifecycle controls | Event management. Keep separate from descriptive content. |
| Saves, follows, sharing | Visitor interactions, not event content fields | Outside Create. Some follow behaviour is local or unavailable; a visible control is not proof of a persistent feature. |

The rich sample event pages can contain data not present on a newly created real event. Their completeness is a design reference, not evidence that every field has an end-to-end authoring path.

## 2. Event types work together across separate choices

Do not make "free", "online", "press", and "recurring" competing event types. They answer different questions.

| Choice | Question | Current options | Additional decisions |
| --- | --- | --- | --- |
| Category | What is happening? | Categories such as conference, music, dining, workshop, party | A press conference can be a category/use case; confirm whether a dedicated category exists in live data. |
| Format | How do people attend? | In-person, online, hybrid | Hybrid needs clear attendance entitlements. |
| Admission | How do people get access? | Free or paid | Mixed tickets, invitations, application/approval and donations are separate future decisions. |
| Schedule | When does it happen? | One-time or recurring | Several sessions within one event are not automatically recurring occurrences. |
| Audience/access | Who may see it or attend? | Not a complete create-wizard choice | Public, unlisted, private, invite-only and press accreditation need explicit product rules and verified backend support. |

Examples: a free online weekly workshop; a paid in-person concert on one date; a hybrid paid conference with separate remote and venue tickets; an invitation-only in-person press briefing. Each combines independent choices.

"Press" is treated here as a press/media event or accreditation use case. It is not assumed to be an existing admission mode. If another meaning was intended, that branch needs revisiting.

### How the interactions should differ

| Combination | What the organiser needs | Attendee journey | Current gap or caution |
| --- | --- | --- | --- |
| Free + in-person | Time, venue, capacity where limited | Register -> confirmation/admission -> check-in | Free registration path exists; verify capacity and ticket issuance with backend integration. |
| Paid + in-person | Above plus a sellable ticket product | Choose ticket -> pay -> confirmed ticket -> check-in | Preserve product inventory and historical purchases. |
| Free + online | Timezone and joining/access arrangements | Register -> receive entitled joining details | A public event page should not expose a private meeting credential. Protected access delivery needs verification. |
| Paid + online | Paid product plus controlled online entitlement | Pay -> verified confirmation -> online access | Payment confirmation must come from Laravel. |
| Free + hybrid | Venue and online arrangements | Choose attendance mode -> register -> receive matching instructions | Current create payload has one meeting link and venue, but no explicit per-registration attendance-mode field. |
| Paid + hybrid | Separate access entitlements and capacities | Choose venue or online ticket -> pay -> matching access | Ticket product fields lack an explicit venue/online entitlement. Ticket names alone should not enforce access rules. |
| Press/media event | Event essentials; accreditation requirements only where needed | Register or apply -> approval if required -> credentials | No dedicated press/accreditation flow is established by the inspected create form. Do not add employment or media-document questions to every event. |
| Recurring + any format/admission | Series pattern plus occurrence booking rules | Choose date -> register/pay for that date or an explicitly defined series pass | A recurrence preview does not establish occurrence inventory, booking, or check-in support. |

A free event may still need reservations and capacity control. A paid event may eventually offer complimentary access, but current free/paid switching is not a complete mixed-ticket feature.

## 3. Where creation should stop

Ask a question during creation when its answer changes the event's basic identity, schedule, attendance route, or booking entitlement. Defer supporting detail when it can be added without misleading an attendee or changing an existing purchase.

### Recommended short creation flow

Keep the existing visual design and reuse the existing editor. These are proposed responsibilities, not an instruction to redesign screens now.

1. **Basics:** name, category, format, start/end, timezone. Reveal recurrence only when selected. Show physical location only for in-person/hybrid, and online arrangements only for online/hybrid.
2. **Event page:** one cover and a short description. Confirm organiser identity from available account/profile data. Keep additional information collapsed or available after saving.
3. **Admission:** free capacity or one straightforward paid ticket with name, price, available units and entitlement. Reveal tables, additional tiers and sales windows only when needed. Confirm default name/email collection without requiring a separate configuration task.
4. **Review:** save draft or publish when ready. Offer "Add more details" through the existing Edit Event destination.

The current four-step structure can remain while reducing mandatory work: the Attendees step can present safe defaults, with optional configuration available later. Removing or merging steps is a separate design decision.

### Draft, publish, and operational readiness

| Stage | Recommended threshold |
| --- | --- |
| Save a new draft | A useful identifying title; allow unfinished content and retain the organiser's choices. This is a proposal for minimum product requirements, not a new API guarantee. |
| Publish a public listing | Title, category, confirmed dates/timezone, cover, useful description, organiser identity, accurate attendance/location information, and honest availability/access state. |
| Open free registration | Publication requirements plus an actual supported registration path and a deliberate capacity policy. |
| Open paid sales | Publication requirements plus an available ticket, clear entitlement and price, and payment/payout readiness enforced by the backend. |
| Admit or deliver online access | Valid entitlement, correct date/occurrence and mode, and secure check-in/joining arrangements. |

Today description and organiser name are optional in the create UI. Requiring a useful description and organiser identity for publication is a recommendation, not a claim about current rules. Payment/payout readiness also needs backend confirmation.

If a venue or meeting link is not ready, let the organiser save a draft. Allowing a published "to be confirmed" listing or "joining details later" requires explicit rules about registration, promised delivery, and attendee communication. Do not silently remove today's checks.

## 4. What belongs in Edit Event

Edit already exists at `/events/:id/edit` and reuses `CreateEvent.vue`. It loads server data, saves changes with a record version, and handles conflicting updates. The public page has an owner edit action. This is a foundation to extend, not a missing editor to rebuild.

Suggested editing responsibilities:

| Area | Contents |
| --- | --- |
| Essentials | Title, category, description, dates, timezone, venue, online arrangements. |
| People | Organiser profile, guest/speaker/artist/cast cards, biographies, images, crew credits. |
| Programme | Agenda items, times, descriptions and speaker associations where supported. |
| Media and discovery | Cover, gallery, captions, summary, tags, highlights. |
| Attendee guidance | FAQs, parking, transport, accessibility information, food, dress, what to bring. Accessibility is a proposed addition, not a current create detail option. |
| Tickets and registration | Products, future prices, capacity, sales windows, purchase limits, permitted attendee questions. |
| Access and policies | Visibility, invitations/accreditation, online access, clear refund/transfer policy, when supported. |
| Series management | Dates, exceptions, occurrence-specific changes, and a clear edit scope. |

The inspected workspace settings also save a subset of basics and ticket settings through versioned requests. It does not establish a complete structured public-profile editor. Avoid creating multiple conflicting copies of the same field across the wizard, workspace and public profile.

### Protect existing commitments when editing

- Never alter the price, people-per-unit entitlement or admission scope of a historical purchase by editing its product.
- Do not reduce inventory below sold tickets and active reservations.
- Do not treat changing free to paid, or venue to online, as a cosmetic edit after registration starts.
- Explain the impact of changing a date, venue, online access, cancellation or access policy; plan attendee updates and any necessary remedy.
- Preserve existing attendee responses when changing future registration questions.
- Keep ownership, permissions, inventory, version conflicts and financial rules authoritative in Laravel.
- Treat the organiser's public display name separately from the account that owns the event.

## 5. Recurring events need a complete booking model

### What exists today

The create form collects a repeat pattern and finite end condition. Weekly patterns include the first occurrence weekday. Monthly patterns support a calendar day or a numbered weekday. A calendar day beyond the end of a month is clamped to that month's last day in the preview utility; an absent numbered weekday is skipped. These choices should be made understandable before publication.

The preview utility uses bounded loops and generates sample dates. It is not evidence of backend occurrence creation. Its date calculations use JavaScript local Date operations, so cross-device timezone and daylight-saving behaviour needs dedicated verification against the server schedule.

The public profile adapter explicitly disables free registration when `event_type` is `recurring`. Paid booking also respects `booking_supported === false`, but the inspected ticket selection and checkout files do not establish a date/occurrence selection contract. This review therefore does not mark recurring commerce as complete.

### Recommended organiser journey

1. Select recurring and enter the first occurrence's start/end in the event timezone.
2. Choose daily, weekly with weekdays, or monthly with a clear day rule.
3. Choose an end date or occurrence count; review the next dates and total scope.
4. Define whether each booking covers one date or the whole series. Recommend starting with one-date bookings; series passes are a separate feature.
5. Confirm capacity and ticket availability per occurrence. Decide whether venue, meeting link, lineup and prices are inherited defaults or date-specific overrides.
6. Create a server-owned series and identifiable occurrences before opening bookings.
7. In Edit, choose "This date" or "This and future dates" where supported. Never silently rewrite completed dates or sold entitlements.

### Recommended attendee journey

Open the series page -> choose an available date -> choose the attendance mode/ticket -> register or pay -> receive a confirmation naming that occurrence -> attend that date.

The order, ticket and admission record must identify the chosen occurrence and entitlement. A generic event ID plus a recurring label is insufficient to decide which date the attendee may enter.

### Decisions to settle before implementation

| Decision | Recommended starting position |
| --- | --- |
| Inventory | Independent per occurrence; server enforces reservations and sales. |
| Series pass | Defer until its dates, capacity consumption and scan rules are explicitly defined. |
| Exceptions | Skip, cancel or reschedule one occurrence without deleting historical bookings. |
| Edit scope | Explicit per-date or future-date changes; explain affected bookings. |
| Timezone | Preserve event-local start times and timezone; validate daylight-saving gaps/ambiguities on the backend. |
| Monthly edge cases | Confirm and document clamp-versus-skip behaviour; match preview and server output. |
| Refund/cancellation | Scope remedies and communication to affected occurrences/bookings. |
| Hybrid series | Entitlement identifies both occurrence and attendance mode. |

A conference with several agenda sessions can be one event with one admission. A workshop repeated on separate bookable Saturdays is a recurring series. A festival across several days needs an explicit whole-event versus day-pass model; do not assume recurrence solves it.

## 6. Information that should be reused or derived

Avoid asking organisers to type information Rush Hour already owns:

- Reuse authorised organiser identity, profile image, biography and website when available.
- Derive the event URL and slug from the saved event record.
- Derive displayed prices, inventory, sale status and lifecycle labels from backend records.
- Reuse existing people profiles when that feature is supported; do not require duplicate biographies for every event.
- Keep buyers, orders, payment references, ticket codes and check-in history out of event-creation forms.
- Keep actual attendee lists and private attendee data separate from public guest/cast profiles. "People attending" must not imply publishing registrant identities without an explicit privacy policy and consent model.

## 7. Gaps and decisions in priority order

1. **Define creation versus publication requirements.** Keep drafts easy and publication trustworthy.
2. **Complete authoring for the existing event page.** Structured people, organiser profile, programme, FAQs, captions and crew do not all have matching create/edit inputs.
3. **Define online and hybrid entitlement delivery.** Storing a meeting link is only one part of the attendee journey.
4. **Define recurring booking before selling it as complete.** Date selection, occurrence IDs, capacity, orders and scan scope must agree.
5. **Decide whether press accreditation, invitations and mixed admission are in scope.** They should not complicate ordinary creation by default.
6. **Keep all editors on one server-owned event record.** Reuse versioned writes and preserve sold products and historical purchases.

These are planning findings. No application behaviour, styling, schema or API contract was changed for this document.

## 8. Source references and review limits

Inspected frontend sources:

- [Create and Edit Event](../src/pages/CreateEvent.vue): fields, defaults, conditional controls, validation, drafts, publication and conflict handling.
- [Create-event service](../src/services/createEventService.js): exact create/edit payload and versioned mutation paths.
- [Editor hydration](../src/utils/eventEditor.js): saved dates and ticket data restoration.
- [Router](../src/router/index.js): existing create/edit destinations and protected routes.
- [Public event page](../src/pages/EventDetails.vue): visible event content, owner edit action and booking entry points.
- [Public profile adapter](../src/utils/eventProfile.js): display fields, legacy text fallbacks and booking gates.
- [Recurrence utility](../src/utils/recurrenceSchedule.js): preview rules and overlap checks.
- [Workspace settings](../src/components/event-workspace/WorkspaceViews.vue): partial editing of basics/tickets.
- [Ticket selection](../src/pages/EventTickets.vue), [checkout](../src/pages/Checkout.vue) and [checkout service](../src/services/checkoutService.js): inspected for explicit occurrence and hybrid selection support.
- [Sample event catalogue](../src/services/staticEventCatalog.js): explains why demonstration profiles may be richer than real create output.

This is a source-based frontend review. Backend validation, schema, live API responses, registration, payments, private joining details and recurring admission were not tested. Existing routes and payload fields are described, not newly promised. Proposed fields require coordinated backend contracts before implementation.

Verification for this task: checked the document against the inspected sources and ran `git diff --check`. Application tests and build are not required for this documentation-only addition. Ready for product discussion; this document does not certify the proposed flows for end-to-end testing.
