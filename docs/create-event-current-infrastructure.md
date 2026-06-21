# Create Event Current Infrastructure

Last reviewed: 2026-06-21

This document describes the Create Event frontend as it exists now. It is intended to be useful when a separate backend project is connected later. It documents current behavior and payloads; it does not imply that backend publishing is already wired.

## Implementation Status

Create Event is a four-step Vue wizard:

1. Basics
2. Details
3. Tickets
4. Attendees

The frontend currently:

- Owns the complete event form state.
- Enforces start/end, recurrence, ticket-sale, and step validation.
- Builds a sanitized, backend-ready payload.
- Saves a browser-local draft to `localStorage`.
- Shows a local publish success screen.

The frontend does **not** currently:createEventService.js:121
POST http://localhost:5173/api/create-event 404 (Not Found)
(anonymous) @ createEventService.js:121
persistDraft @ CreateEvent.vue:549
publishEvent @ CreateEvent.vue:937

- Create or update an event through an API.
- Upload media to a backend.
- Save account-scoped drafts.
- Materialize recurring occurrences on a backend.

`Publish Event` is still a local UI transition. A real backend must validate the payload again and return the canonical event ID, slug, status, and URLs.

## Files Changed For The Current Create Event Work

These files contain the recent date/time and recurrence implementation:

- `src/pages/CreateEvent.vue`
  - Main wizard state and UI.
  - One-time and recurring event controls.
  - Inline validation and schedule preview.
  - One-time multi-day duration confirmation.
- `src/services/createEventService.js`
  - Payload sanitization and normalization.
  - Browser-local draft serialization.
- `src/components/DateTimePicker.vue`
  - Minimum/maximum datetime enforcement inside the existing picker.
  - Invalid selection feedback and disabled Apply action.
- `src/components/DateTimePickerInput.vue`
  - Passes minimum/maximum datetime constraints to the picker.
- `src/utils/eventDateTime.js`
  - Event-timezone date calculations.
  - Thirty-minute lead-time validation.
  - Local datetime serialization helpers.
- `src/utils/recurrenceSchedule.js`
  - Daily, weekly, and monthly occurrence generation.
  - Monthly pattern derivation and short-month clamping.
  - Recurrence overlap detection.

Related files that were inspected but are not wired into Create Event publishing:

- `src/router/index.js`
- `src/stores/events.js`
- `src/services/eventService.js`
- `src/api/axios.js`
- `src/App.vue`

## Route And App Shell

Route:

```txt
/create-event
```

Router name:

```txt
CreateEvent
```

The route currently has title and description metadata but does not declare `requiresAuth: true`. The global router guard only blocks routes whose metadata requires authentication.

Backend requirement:

- Event creation, draft editing, publishing, media management, and ticket management must require an authenticated organizer regardless of frontend route guards.
- The backend must enforce ownership and organization permissions.

`src/App.vue` treats Create Event as a page-level experience and uses the `create-event` skeleton variant while the route loads.

## Current Runtime Flow

1. The user opens `/create-event`.
2. Step 1 starts with a one-time event scheduled tomorrow from 6:00 PM to 10:00 PM.
3. The user moves through Basics, Details, Tickets, and Attendees.
4. `goNext()` runs `validateStep(currentStep)` before advancing.
5. `Save draft` calls `saveCreateEventDraft(form)` without requiring the event to be publishable.
6. The draft payload is stored under `kaka-create-event-draft` in `localStorage`.
7. `Publish Event` validates Steps 1, 2, and 3 again.
8. If validation passes, the same payload is saved locally and the local success screen is shown.
9. No create-event API request is made.

Draft restoration is not automatic. Opening Create Event starts with the normal defaults rather than silently loading an old browser draft.

## Current Form State

The canonical event schedule state is no longer duplicated between `repeat*` and `recurring` fields.

```js
{
  title: '',
  startsAt: Date,
  endsAt: Date,

  eventType: 'one_time', // one_time | recurring

  recurrence: {
    frequency: null, // daily | weekly | monthly
    weeklyDays: [], // JavaScript weekday numbers: 0 = Sunday ... 6 = Saturday

    monthlyMode: 'day_of_month', // day_of_month | nth_weekday
    dayOfMonth: null,
    nthWeekday: {
      ordinal: null, // 1 ... 5
      weekday: null, // 0 ... 6
    },

    seriesEndType: 'on_date', // on_date | after_occurrences
    seriesEndDate: '', // YYYY-MM-DD when seriesEndType is on_date
    occurrenceCount: null,
  },

  format: 'in-person', // in-person | online | hybrid
  venue: '',
  venueTimezone: '',
  meetingLink: '',
  category: '',

  coverImage: '',
  coverGradient: String,
  secondaryImages: [],
  urlImages: [],
  description: '',
  organiser: '',
  organiserWebsite: '',
  tags: '',
  extraDetails: [],

  ticketMode: 'free', // free | paid
  freeCapacity: '',
  tickets: [],
  attendeeFields: [],
}
```

### Important Schedule Concepts

A recurring event has three independent concepts:

1. First occurrence
   - `startsAt`
   - `endsAt`
2. Recurrence pattern
   - `recurrence.frequency`
   - weekly or monthly pattern fields
3. Series end rule
   - `seriesEndType`
   - `seriesEndDate` or `occurrenceCount`

There is only one start/end datetime pair. Recurring events do not have a second competing date/time form and do not support per-day time overrides.

Switching between one-time and recurring preserves `startsAt` and `endsAt`.

## Date, Time, And Timezone Rules

Primary utilities live in `src/utils/eventDateTime.js`.

### Event Timezone

Timezone resolution is:

1. Selected venue timezone from `form.venueTimezone`.
2. `VITE_APP_TIMEZONE` when configured.
3. Browser-resolved timezone.
4. `UTC` as the final fallback.

The hardcoded Nigerian venue suggestions currently use:

```txt
Africa/Lagos
```

A free-typed venue falls back to the app/default timezone because no timezone lookup service is connected yet.

### First Start Rule

The event start must be at least 30 minutes ahead of the current time in the event timezone.

The frontend:

- Disables dates before the venue's current date.
- Prevents applying a datetime before the minimum start datetime.
- Shows inline picker feedback for an invalid selection.
- Recalculates the current time every minute.
- Revalidates during navigation and publish.

Backend requirement:

- Recalculate this rule using backend time and the submitted event timezone.
- Do not trust the frontend clock or frontend validation.

### End Rule

`endsAt` must be strictly after `startsAt`.

If changing the start makes the selected end invalid, the frontend clears the end and shows an inline error.

## One-Time Events

One-time UI:

```txt
EVENT TYPE
[ One-time ] [ Recurring ]

WHEN
Starts
Ends
```

For one-time events only, if the end is on a later calendar date, a compact confirmation appears:

```txt
This is a multi-day event
Duration: 2 days, 4 hours
```

The duration is calculated from the actual datetime difference and can contain days, hours, and minutes. It is confirmation, not an error. It does not appear for recurring events or same-day one-time events.

## Recurring Events

Recurring UI order:

```txt
EVENT TYPE
WHEN
REPEATS
SERIES ENDS
SCHEDULE PREVIEW
```

When recurring is selected, the date labels become:

- First occurrence starts
- First occurrence ends

The selected first occurrence also defines the time and duration used by every generated occurrence.

Custom individual dates and different times per weekday are intentionally out of scope.

### Daily

State:

```js
recurrence.frequency = 'daily'
```

Rules:

- The first occurrence date is the series start.
- The same start time and duration repeat every day.
- No date grid or individual-date selection is shown.
- A daily occurrence duration of 24 hours or more is rejected as overlapping.

### Weekly

State example:

```js
{
  frequency: 'weekly',
  weeklyDays: [0, 3, 6]
}
```

Weekday values follow JavaScript `Date#getDay()`:

| Value | Day       |
| ----- | --------- |
| 0     | Sunday    |
| 1     | Monday    |
| 2     | Tuesday   |
| 3     | Wednesday |
| 4     | Thursday  |
| 5     | Friday    |
| 6     | Saturday  |

Rules:

- Selecting weekly automatically includes the first occurrence's weekday.
- The organizer can add or remove other weekday chips.
- The first occurrence weekday remains selected so the submitted first occurrence agrees with the recurrence rule.
- Generated dates start on or after `startsAt`.
- All selected weekdays share the first occurrence's start time and duration.

### Monthly

Monthly modes:

```js
monthlyMode: 'day_of_month'
```

or:

```js
monthlyMode: 'nth_weekday'
```

`day_of_month`:

- Derives `dayOfMonth` from the first occurrence.
- Example: 21 June becomes the 21st of every month.
- For the 29th, 30th, or 31st, shorter months use their final calendar day.

`nth_weekday`:

- Derives the ordinal and weekday from the first occurrence.
- Example: 21 June 2026 becomes the third Sunday.
- A fifth-weekday rule skips a month that does not contain that fifth weekday.

Only one monthly pattern is supported. The previous 1-31 multi-select grid has been removed.

### Series End

Every recurring event requires one of:

```js
{
  seriesEndType: 'on_date',
  seriesEndDate: '2026-08-30'
}
```

or:

```js
{
  seriesEndType: 'after_occurrences',
  occurrenceCount: 12
}
```

Rules:

- The end date must be after the first occurrence's calendar date.
- Occurrence count must be a positive whole number.
- There is no `Never` option.

### Schedule Preview

The frontend shows:

- A plain-English recurrence description.
- The shared start/end time.
- First occurrence date.
- Series ending description.
- Up to five generated occurrence dates.

The preview is generated from the same recurrence utility used for overlap validation. Preview dates are not submitted as authoritative occurrence records.

## Occurrence Generation

Generation lives in `src/utils/recurrenceSchedule.js`.

### `deriveMonthlyPattern(start)`

Returns:

```js
{
  dayOfMonth,
  ordinal,
  weekday,
}
```

### `generateOccurrences(start, recurrence, limit)`

Generates frontend preview dates:

- Daily: adds calendar days.
- Weekly: scans forward and keeps selected weekday numbers.
- Monthly day-of-month: clamps to the last day of short months.
- Monthly nth-weekday: calculates the requested ordinal weekday.
- Stops at the series end date or occurrence count.

### `scheduleHasOverlap(start, end, recurrence)`

- Calculates the first occurrence duration.
- Generates upcoming starts for the recurrence pattern.
- Rejects an occurrence whose end would run into the following occurrence.
- Explicitly rejects daily durations of 24 hours or more.

Backend requirement:

- Reimplement recurrence generation with a timezone-aware date library.
- Treat frontend preview dates as informational only.
- Validate daylight-saving transitions for timezones that observe DST.
- Materialize occurrences server-side for search, tickets, reminders, check-in, reporting, cancellations, and rescheduling.

## Current Validation Matrix

### Step 1: Basics

- Title required after trimming.
- Start required.
- End required.
- Start at least 30 minutes in the future in event timezone.
- End strictly after start.
- Venue required for in-person and hybrid.
- Meeting link required for online and hybrid.
- Category required.
- Recurring frequency required for recurring events.
- Weekly schedule requires at least one weekday.
- Series ending required.
- Series end date after first occurrence date.
- Occurrence count is a positive integer.
- Recurrence must not overlap.

### Step 2: Details

- Cover image required for publish/navigation.

### Step 3: Tickets

For paid events:

- At least one ticket category required.
- Ticket name required.
- Price cannot be negative.
- Sales close must be after sales open when both exist.
- Sales close cannot be after the event start.

### Step 4: Attendees

- No additional step-specific validation currently exists.
- Required default attendee fields remain enabled in the UI.

### Draft Versus Publish

Draft:

- Can be incomplete.
- Is saved locally without full validation.

Publish:

- Runs current frontend validation again.
- Still requires authoritative backend validation once connected.

## Tickets

Ticket state:

```js
{
  id: Number, // temporary client key
  name: String,
  unitType: 'individual' | 'table',
  color: String,
  price: Number,
  units: Number,
  peoplePerUnit: Number,
  maxPerPerson: Number,
  visible: Boolean,
  perks: String,
  salesStart: Date | String,
  salesEnd: Date | String,
}
```

Current ambiguities remain:

- Blank ticket quantity becomes `0`; the backend must not guess whether that means unlimited or unavailable.
- Blank max-per-person becomes `1`.
- `perks` remains in state/payload even though the current UI does not collect it.
- Price is a frontend number; a backend should normalize money into minor units and store currency.

Recommended backend semantics:

- `quantity_total: null` for unlimited or a positive integer for limited inventory.
- `max_per_buyer: null` for no explicit cap.
- `price_minor` integer plus `currency: 'NGN'`.
- Server-side inventory reservations to prevent overselling.

## Details, Media, And Attendee Fields

### Media

Current local uploads become Data URLs. External URLs are stored directly. No media API is called.

Payload includes:

- `coverImage`
- `secondaryImages`

Payload does not include:

- `coverGradient`
- `urlImages`

Backend recommendation:

- Upload media separately.
- Submit media IDs rather than base64 Data URLs.
- Store cover/gallery order and source metadata in an `event_media` domain.

### Extra Details

Payload items contain:

```js
{
  type,
  label,
  value,
}
```

Icons are frontend-only.

### Attendee Fields

Payload items contain:

```js
{
  id,
  label,
  enabled,
  required,
}
```

Name and email are always required in the current UI. The backend should version or snapshot the registration schema so historical answers remain understandable after edits.

## Current Payload Contract

`buildCreateEventPayload(form)` returns:

```js
{
  title: String,

  startsAt: Date | String | null,
  endsAt: Date | String | null,
  startsAtLocal: 'YYYY-MM-DDTHH:mm:ss' | null,
  endsAtLocal: 'YYYY-MM-DDTHH:mm:ss' | null,
  timeZone: String,

  eventType: 'one_time' | 'recurring',
  recurrence: null | {
    frequency: 'daily' | 'weekly' | 'monthly',
    weeklyDays: Array<Number>,
    monthlyMode: 'day_of_month' | 'nth_weekday',
    dayOfMonth: Number | null,
    nthWeekday: {
      ordinal: Number | null,
      weekday: Number | null,
    },
    seriesEndType: 'on_date' | 'after_occurrences',
    seriesEndDate: String | null,
    occurrenceCount: Number | null,
  },

  format: 'in-person' | 'online' | 'hybrid',
  venue: String,
  meetingLink: String,
  category: String,
  description: String,
  organiser: String,
  organiserWebsite: String,
  tags: String,

  coverImage: String | null,
  secondaryImages: Array<String>,

  ticketMode: 'free' | 'paid',
  freeCapacity: Number | null,
  tickets: Array<{
    id: Number,
    name: String,
    unitType: 'individual' | 'table',
    color: String,
    price: Number,
    units: Number,
    peoplePerUnit: Number,
    maxPerPerson: Number,
    visible: Boolean,
    perks: String,
    salesStart: Date | String | null,
    salesEnd: Date | String | null,
    salesStartLocal: 'YYYY-MM-DDTHH:mm:ss' | null,
    salesEndLocal: 'YYYY-MM-DDTHH:mm:ss' | null,
  }>,

  attendeeFields: Array<{
    id: String,
    label: String,
    enabled: Boolean,
    required: Boolean,
  }>,

  extraDetails: Array<{
    type: String,
    label: String,
    value: String,
  }>,
}
```

### Datetime Serialization

`startsAt` and `endsAt` may be JavaScript `Date` objects before JSON serialization. JSON serialization converts them to ISO timestamps.

The payload also includes:

- `startsAtLocal`
- `endsAtLocal`
- `timeZone`

These preserve the organizer-facing wall-clock values and timezone explicitly. The backend should parse local datetime plus timezone into canonical UTC timestamps instead of assuming the browser's offset is authoritative.

### One-Time Payload

For one-time events:

```js
{
  eventType: 'one_time',
  recurrence: null,
}
```

### Recurring Payload Example

```json
{
  "eventType": "recurring",
  "startsAtLocal": "2026-06-21T12:00:00",
  "endsAtLocal": "2026-06-21T22:00:00",
  "timeZone": "Africa/Lagos",
  "recurrence": {
    "frequency": "weekly",
    "weeklyDays": [0, 3, 6],
    "monthlyMode": "day_of_month",
    "dayOfMonth": 21,
    "nthWeekday": {
      "ordinal": 3,
      "weekday": 0
    },
    "seriesEndType": "on_date",
    "seriesEndDate": "2026-08-30",
    "occurrenceCount": null
  }
}
```

Fields irrelevant to the selected recurrence frequency may still be present. The backend should validate the selected frequency and ignore or normalize irrelevant pattern fields.

## Sanitization

`createEventService.js` strips script blocks and angle brackets from submitted string fields.

This is applied to event text, ticket names/perks, location/link text, tags, and extra details.

It is not a security boundary. The backend must still:

- Validate types and enum values.
- Enforce lengths.
- Validate URLs.
- Escape output based on rendering context.
- Reject malformed recurrence data.
- Authorize ownership.
- Protect against stored XSS.

## Current Backend Integration Gaps

1. Create Event publish is local-only.
2. Drafts are browser-local and not user-scoped.
3. Media upload is local-only.
4. Categories and venue suggestions are hardcoded.
5. `src/stores/events.js` has a create action, but Create Event does not call it.
6. `src/services/eventService.js` uses `http://127.0.0.1:8000/api/events` for its Axios base and then posts create requests to `/events.php`, producing an inconsistent legacy write path.
7. `src/api/axios.js` separately uses `baseURL: '/api'` with credentials, but Create Event does not currently use it.
8. Public route access and backend authorization are not aligned.
9. Existing API documentation must be reconciled with this richer payload before integration.

Do not connect Create Event to the legacy PHP-style path. The backend project is separate and should expose its own agreed API contract.

## Backend Contract Requirements

A separate backend should treat the frontend payload as input, not trusted state.

### Draft Endpoint

Suggested shape:

```txt
POST /api/event-drafts
PATCH /api/event-drafts/{draft}
GET /api/event-drafts/{draft}
DELETE /api/event-drafts/{draft}
```

Draft rules:

- Authenticated organizer required.
- Incomplete fields allowed.
- Basic types/enums still validated.
- Draft belongs to a user or organization.

### Publish Endpoint

Suggested options:

```txt
POST /api/event-drafts/{draft}/publish
```

or:

```txt
POST /api/events
```

Publish must transactionally validate and create:

1. Event core record.
2. Event location/private meeting data.
3. Media associations.
4. Recurrence rule.
5. Initial materialized occurrences.
6. Ticket types and inventory.
7. Attendee form schema.
8. Extra details and tags.
9. Published status and audit information.

Suggested response:

```json
{
  "data": {
    "id": 123,
    "slug": "lagos-tech-summit-2026",
    "status": "published",
    "public_url": "/events/123-lagos-tech-summit-2026",
    "dashboard_url": "/dashboard/events/123"
  },
  "message": "Event published successfully"
}
```

## Recommended Backend Domains

Suggested domains/tables:

- `events`
- `event_locations`
- `event_recurrence_rules`
- `event_occurrences`
- `event_media`
- `categories`
- `tags` and `event_tag`
- `ticket_types`
- `ticket_inventory_holds`
- `orders`
- `order_items`
- `attendee_form_fields`
- `attendees`
- `attendee_answers`
- `event_extra_details`
- audit log

### Recurrence Storage

Recommended rule fields:

- `event_id`
- `frequency`
- `timezone`
- `weekly_days_json`
- `monthly_mode`
- `day_of_month`
- `ordinal`
- `weekday`
- `series_end_type`
- `series_end_date`
- `occurrence_count`

Recommended occurrence fields:

- `event_id`
- `starts_at_utc`
- `ends_at_utc`
- `local_date`
- `timezone`
- `status`
- optional capacity override

## Mapping Payload To Backend Domains

| Payload field                              | Suggested backend destination                      |
| ------------------------------------------ | -------------------------------------------------- |
| `title`                                    | `events.title`                                     |
| `eventType`                                | `events.event_type` or presence of recurrence rule |
| `startsAtLocal`, `endsAtLocal`, `timeZone` | `events` first occurrence and timezone             |
| `recurrence`                               | recurrence rule and generated occurrences          |
| `format`                                   | `events.format`                                    |
| `venue`                                    | `event_locations`                                  |
| `meetingLink`                              | private `event_locations` data                     |
| `category`                                 | resolve to `category_id`                           |
| `description`                              | `events.description`                               |
| `organiser`, `organiserWebsite`            | event organizer display fields                     |
| `tags`                                     | normalized tags relation                           |
| `coverImage`, `secondaryImages`            | `event_media` after upload migration               |
| `ticketMode`, `freeCapacity`               | event capacity/ticketing configuration             |
| `tickets`                                  | `ticket_types` and inventory                       |
| `attendeeFields`                           | `attendee_form_fields`                             |
| `extraDetails`                             | `event_extra_details`                              |

## Backend Validation To Mirror

The backend must independently enforce:

- Authenticated organizer and ownership.
- Required title and safe length.
- Valid event timezone.
- Start at least 30 minutes in the future for publish.
- End after start.
- Valid event type and recurrence enums.
- Required recurrence series end.
- Weekly weekdays within 0-6.
- Valid monthly pattern.
- Positive whole occurrence count.
- No recurrence overlap.
- Format-specific location/meeting link rules.
- Existing category.
- Required publish media.
- Paid ticket validity and inventory semantics.
- Ticket sales chronology and relation to event start.
- Required attendee identity fields.

A draft may contain an expired or incomplete start, but it must not be publishable until corrected.

## Remaining Product Decisions

- Explicit timezone selection for unknown/free-typed venues.
- Backend category IDs versus current category names.
- Media upload and external image policy.
- Meaning of blank ticket quantity.
- Nullable versus default max-per-buyer.
- Whether a fifth-weekday monthly recurrence should skip missing months or fall back to the final matching weekday.
- Occurrence generation horizon and regeneration strategy.
- Editing a whole recurring series versus one occurrence.
- Postponed/cancelled/completed occurrence states.
- Public versus organizer event resource shapes.

## Keeping This Document Current

Update this document whenever:

1. Form state changes.
2. Payload fields or enum values change.
3. Validation rules change.
4. Recurrence generation changes.
5. Create Event starts calling a real backend.
6. Draft storage moves off `localStorage`.
7. Media becomes server-backed.
8. Ticket quantity/cap semantics are resolved.

The source of truth remains the current frontend implementation, especially:

- `src/pages/CreateEvent.vue`
- `src/services/createEventService.js`
- `src/utils/eventDateTime.js`
- `src/utils/recurrenceSchedule.js`
