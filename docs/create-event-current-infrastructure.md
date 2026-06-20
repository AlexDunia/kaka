# Create Event Current Infrastructure

Last reviewed: 2026-06-20

This document explains the current Create Event experience in painful, backend-useful detail. It is written from the code that exists right now, not from the ideal future version. When the frontend logic changes, update this document so the backend contract and data model stay honest.

Primary source files:

- `src/pages/CreateEvent.vue`
- `src/services/createEventService.js`
- `src/router/index.js`
- `src/stores/events.js`
- `src/services/eventService.js`
- `src/App.vue`

## Big Picture

The Create Event page is a four-step Vue wizard for building an event:

1. Basics
2. Details
3. Tickets
4. Attendees

The current page is mostly frontend-owned. It collects form data, validates enough to move between steps, builds a sanitized payload, saves the draft to `localStorage`, and shows a success screen when the user clicks publish. It does not currently send the final event to the backend.

That last point matters a lot: the user-facing flow says "Publish Event", but the current implementation does not call `eventStore.createEvent`, `eventService.createEvent`, or any API endpoint. Backend work should treat the current payload builder as the nearest available contract, then connect publish/draft/media flows deliberately.

## Current Route And Shell Behavior

Route:

```txt
/create-event
```

Router name:

```txt
CreateEvent
```

Defined in `src/router/index.js`.

Route metadata:

```js
{
  title: 'Create Event',
  description: 'Create and publish your own event to sell tickets.'
}
```

Authentication:

- The route currently does not declare `requiresAuth: true`.
- The router guard only blocks routes with `meta.requiresAuth`.
- That means a logged-out user can currently open the create event page.

App shell behavior:

- `src/App.vue` identifies the route by name with `isCreateEventRoute`.
- The app skeleton can use a special `create-event` skeleton variant while the route loads.
- Create Event is treated like a major page-level experience, not a small embedded form.

Backend implication:

- In a production backend, event creation should almost certainly require an authenticated organizer account.
- The frontend route metadata and backend authorization should eventually agree.
- Do not rely on frontend route guards for security. The backend must own organizer permissions.

## Current File Responsibilities

### `src/pages/CreateEvent.vue`

This is the main wizard. It owns:

- The full reactive form state.
- Step navigation.
- Step validation.
- Ticket category creation/removal.
- Recurrence schedule UI logic.
- Cover/gallery image selection.
- Live preview state.
- Draft save button behavior.
- Publish success screen.
- Theme toggle fallback behavior.
- Most of the form UI markup and scoped CSS.

It currently imports:

- Vue utilities: `computed`, `inject`, `onMounted`, `reactive`, `ref`, `watch`.
- Vue Router: `useRouter`.
- Heroicons for UI decoration.
- `DateTimePicker` and `DateTimePickerInput`.
- `EventCard` for the live preview.
- `getRushHourLogo`.
- `playThemeToggleClick`.
- `DEFAULT_CREATE_EVENT_TIPS`, `buildCreateEventPayload`, and `saveCreateEventDraft` from `createEventService`.

### `src/services/createEventService.js`

This file currently provides:

- `DEFAULT_CREATE_EVENT_TIPS`
- `buildCreateEventPayload(form)`
- `saveCreateEventDraft(form)`

It does not call the backend. It sanitizes and normalizes the Create Event form into a payload object.

### `src/stores/events.js`

This Pinia store has a `createEvent(eventData)` action, but the current Create Event wizard does not use it.

The store action:

- Sets loading/error state.
- Calls `eventService.createEvent`.
- Expects the response to contain a valid event with `id`.
- Prepends the created event to the local event list.
- Marks the event list for refresh.

### `src/services/eventService.js`

This file contains older/broader event API methods:

- Read all events.
- Read event by ID.
- Read events by category.
- Read featured events.
- Search events.
- Create/update/delete events.
- Fetch categories/subcategories.

Important mismatch:

- Reads point mostly at `http://127.0.0.1:8000/api/events`.
- `createEvent` posts to `api.post('/events.php', sanitizedData)`.
- Since `api` already has `baseURL` set to `http://127.0.0.1:8000/api/events`, this produces a confusing path for writes.
- This is not used by the current Create Event page, but it matters when wiring real publish.

### `src/api/axios.js`

This is a separate Axios instance:

```js
baseURL: '/api'
withCredentials: true
```

This looks more aligned with Laravel Sanctum cookie auth, but it is not currently used by `CreateEvent.vue`.

## Runtime Flow

The current Create Event runtime flow is:

1. User visits `/create-event`.
2. Vue renders the page with step 1 active.
3. `onMounted` initializes theme fallback, syncs recurrence date/time state from the primary start/end dates, and starts rotating tips every 7 seconds.
4. User fills fields in the wizard.
5. Clicking "Continue" calls `goNext`.
6. `goNext` calls `validateStep(currentStep)`.
7. If validation passes, `maxStepReached` increases and the next step becomes active.
8. User can go back to previous completed steps.
9. User can toggle the live preview on/off.
10. User can click "Save draft", which stores a sanitized payload in `localStorage`.
11. On the final step, clicking "Publish Event" calls `publishEvent`.
12. `publishEvent` validates step 4, calls `buildCreateEventPayload(form)`, calls `saveDraft()`, sets `published` to true, scrolls to top, and shows the local success screen.

Current publish is not a backend publish. It is a local UI transition.

## Wizard State

The form lives in a single `reactive` object named `form`.

Current default form state:

```js
{
  title: '',
  startsAt: tomorrowAt(18),
  endsAt: tomorrowAt(22),
  recurrenceType: 'once',
  repeatFrequency: '',
  repeatInterval: 1,
  repeatUnit: '',
  repeatDays: [],
  repeatStartDate: '',
  repeatStartTime: '',
  repeatEndTime: '',
  repeatDayOverrides: {},
  repeatStopMode: '',
  repeatEndDate: '',
  recurring: {
    frequency: null,
    selectedDays: [],
    useDefaultTimes: true,
    perDayTimes: {},
  },
  format: 'in-person',
  venue: '',
  meetingLink: '',
  category: '',
  coverImage: '',
  coverGradient: coverTemplates[0],
  secondaryImages: [],
  urlImages: [],
  description: '',
  organiser: '',
  organiserWebsite: '',
  tags: '',
  extraDetails: [],
  ticketMode: 'free',
  freeCapacity: '',
  tickets: [],
  attendeeFields: attendeeFieldDefaults.map((field) => ({ ...field })),
}
```

Backend interpretation:

- `title`: public event title.
- `startsAt`: primary start datetime.
- `endsAt`: primary end datetime.
- `recurrenceType`: one-time or recurring flag.
- `repeat*`: flattened recurrence fields used by the UI and payload.
- `recurring`: nested recurrence config, partially duplicating `repeat*`.
- `format`: physical/online/hybrid attendance mode.
- `venue`: text location for in-person or hybrid events.
- `meetingLink`: private online link for online or hybrid events.
- `category`: display category name, not a category ID.
- `coverImage`: current cover image source. This can be a Data URL or external URL.
- `coverGradient`: selected visual gradient template, but it is not currently included in the payload.
- `secondaryImages`: gallery image sources.
- `urlImages`: tracks external URL-added images, but it is not currently included in the payload.
- `description`: public event description.
- `organiser`: organizer display name.
- `organiserWebsite`: organizer website URL.
- `tags`: comma-separated string, not a normalized array.
- `extraDetails`: optional typed content blocks.
- `ticketMode`: `free` or `paid`.
- `freeCapacity`: optional capacity for free events.
- `tickets`: ticket categories for paid events.
- `attendeeFields`: registration fields the organizer wants to collect.

## Non-Form UI State

Create Event also uses local UI refs:

- `currentStep`: active wizard step, starts at 1.
- `maxStepReached`: highest step the user is allowed to revisit.
- `previewOn`: whether live preview is visible. Persisted to `localStorage` under `kaka-create-preview`.
- `draftSaved`: controls the "Draft saved" badge.
- `activeUploadTab`: either `files` or `url`.
- `showTemplates`: whether cover templates are visible.
- `showCategoryMenu`: whether category dropdown is open.
- `showVenueResults`: whether venue suggestions are open.
- `dragActive`: drag/drop visual state for uploads.
- `urlImageValue`: current image URL input value.
- `tipIndex`: rotating tip index.
- `toast`: temporary toast text.
- `published`: switches from wizard to success screen.
- `errors`: reactive object keyed by field names.
- `ticketId`: local incrementing ticket ID counter.
- `activeRepeatTimePicker`: controls the recurrence time modal.
- `showRepeatChangeActions`: toggles recurrence edit choices.
- `showRepeatDayOverrides`: toggles per-day recurrence overrides.

Backend implication:

- Most of these are purely frontend state and should not be persisted.
- `previewOn`, theme preference, open menus, toasts, and `maxStepReached` are not event data.
- `ticketId` is only a temporary client key. The backend should create durable IDs.

## Static Configuration Data

### Steps

```js
['Basics', 'Details', 'Tickets', 'Attendees']
```

These names drive the progress navigation.

### Categories

Current category labels are hardcoded in the frontend:

- Conference & Summit
- Music & Concert
- Food & Dining
- Art & Culture
- Business & Networking
- Sports & Fitness
- Workshop & Training
- Party & Social
- Startup & Tech
- Faith & Community
- Theatre & Performing Arts
- Education & Learning

Backend implication:

- Categories should probably be backend records with stable IDs/slugs.
- The frontend currently sends only the category name.
- If category names change, old event data can become inconsistent unless the backend stores a category ID.

### Venue Suggestions

Current venue suggestions are hardcoded:

- Eko Hotel & Suites
- The Civic Centre
- Landmark Event Centre
- Terra Kulture
- Transcorp Hilton Abuja

Backend implication:

- This is only a local autocomplete seed.
- The backend currently receives only `venue` text.
- A scalable backend might eventually have `venues` as a separate table, but the current contract does not require it.

### Extra Detail Options

Current extra detail types:

- `parking`
- `dress`
- `bring`
- `agenda`
- `speakers`
- `food`
- `transport`
- `faq`

Each option has a label, icon, and placeholder. The payload includes only `type`, `label`, and sanitized `value`. It does not include the icon.

Backend implication:

- Store extra details as ordered key/value content blocks.
- Do not depend on the icon from the frontend.
- `faq` currently behaves like a single free-text block, not a structured list of questions and answers.

### Ticket Templates

Current paid ticket templates:

```js
[
  { name: 'Early Bird', unitType: 'individual', color: '#1a7a4a', price: 5000 },
  { name: 'General Admission', unitType: 'individual', color: '#1a5fa6', price: 10000 },
  { name: 'VIP', unitType: 'individual', color: '#ec4899', price: 30000 },
  { name: 'Gold Table', unitType: 'table', color: '#ec4899', price: 250000 },
  { name: 'Silver Table', unitType: 'table', color: '#7a8fa6', price: 150000 },
  { name: 'Student', unitType: 'individual', color: '#302b63', price: 3000 },
]
```

Backend implication:

- These are convenience templates only.
- The backend should store the actual submitted ticket categories, not infer anything from template names.

### Attendee Field Defaults

Current default attendee fields:

- `name`: enabled, required.
- `email`: enabled, required.
- `phone`: enabled, optional.
- `company`: disabled, optional.
- `job`: disabled, optional.
- `dietary`: disabled, optional.
- `shirt`: disabled, optional.
- `source`: disabled, optional.

Backend implication:

- Treat this as an event-specific registration schema.
- Required base identity fields are `name` and `email`.
- Optional fields are controlled per event.
- For scalability, version the registration schema so historical registrations remain understandable after the organizer edits the form.

## Step 1: Basics

Step 1 collects the event's identity, schedule, attendance format, location/link, and category.

### Event Name

Field:

```txt
form.title
```

UI:

- Label: Event name
- Max length: 100
- Placeholder: `e.g. Lagos Tech Summit 2026`

Validation:

- Required.
- Must not be blank after trim.

Payload:

- Sent as `title`.
- Sanitized by stripping script tags and angle brackets.

Backend should enforce:

- Required string.
- Max length.
- Safe display escaping.
- Slug generation should happen on the backend, not by trusting the UI.

### Primary Date/Time

Fields:

```txt
form.startsAt
form.endsAt
```

Defaults:

- `startsAt`: tomorrow at 6:00 PM local time.
- `endsAt`: tomorrow at 10:00 PM local time.

UI components:

- `DateTimePickerInput` for start.
- `DateTimePickerInput` for end.

Validation:

- Start date/time is required.
- End date/time is required.
- Start cannot be earlier than today's date at midnight.
- End must be after start.

Payload:

- Sent as `startsAt`.
- Sent as `endsAt`.

Backend should enforce:

- Required datetimes.
- End after start.
- Timezone strategy.
- Whether past events can be created by admins/importers.

Important timezone note:

- The frontend uses JavaScript `Date` objects and local timezone behavior.
- The backend should define whether stored datetimes are UTC, local event timezone, or both.
- A scalable model should store:
  - `timezone`
  - `starts_at_utc`
  - `ends_at_utc`
  - optionally original local display values

The current frontend does not collect an explicit timezone.

### One-Time Or Recurring

Field:

```txt
form.recurrenceType
```

Values:

- `once`
- `recur`

If `once`, the recurrence UI is hidden and recurrence readiness is not required.

If `recur`, a three-part recurrence flow appears:

1. Choose rhythm.
2. Choose days if needed.
3. Review or override date/time.

Backend implication:

- Treat recurrence as a separate scheduling concern, not as simple event columns only.
- A recurring event should probably have a parent event series plus generated occurrences.

## Recurrence Model In Detail

The current frontend stores recurrence in two overlapping shapes:

### Nested Shape

```js
recurring: {
  frequency: null,
  selectedDays: [],
  useDefaultTimes: true,
  perDayTimes: {},
}
```

### Flat Shape

```js
repeatFrequency: ''
repeatInterval: 1
repeatUnit: ''
repeatDays: []
repeatStartDate: ''
repeatStartTime: ''
repeatEndTime: ''
repeatDayOverrides: {}
repeatStopMode: ''
repeatEndDate: ''
```

Payload includes both:

- `recurring`
- `recurrence`

This duplication is useful during frontend transition, but the backend should choose one canonical schema.

Important serialization detail:

- `recurrence.frequency` is built as `form.repeatUnit || form.repeatFrequency || null`.
- After the user selects a rhythm, `repeatUnit` is populated, so the submitted value is currently `days`, `weeks`, or `months`.
- The UI rhythm value (`every_day`, `every_week`, or `every_month`) remains available as `recurring.frequency` and in the frontend-only `repeatFrequency` state, but `repeatFrequency` is not submitted as a separate payload field.

### Recurrence Rhythm Options

Current UI options:

```js
[
  { value: 'every_day', unit: 'days', label: 'Every day' },
  { value: 'every_week', unit: 'weeks', label: 'Every week' },
  { value: 'every_month', unit: 'months', label: 'Every month' },
]
```

When the user selects a rhythm:

- `form.recurring.frequency` becomes the option value.
- selected days are reset.
- per-day times are reset.
- `form.repeatUnit` becomes `days`, `weeks`, or `months`.
- `form.repeatFrequency` becomes `every_day`, `every_week`, or `every_month`.
- `form.repeatInterval` becomes `1`.
- `form.repeatDays` becomes an empty array.
- `form.repeatDayOverrides` becomes an empty object.
- the schedule is synced from `startsAt` and `endsAt`.

### Day Selection Rules

Daily:

- `every_day` does not require day selection.

Weekly:

- `every_week` requires one or more selected weekdays.
- Weekday IDs are strings: `Mon`, `Tue`, `Wed`, `Thu`, `Fri`, `Sat`, `Sun`.

Monthly:

- `every_month` requires one or more selected day numbers.
- Monthly day options are generated from the month of `repeatStartDate` or `startsAt`.
- Past dates in the current month are disabled.
- Selected day IDs are numbers.

Backend implication:

- Weekly and monthly selected day values have different types in the current UI.
- Normalize on the backend.
- For example:
  - `day_of_week` as 1-7 for weekly.
  - `day_of_month` as 1-31 for monthly.

### Recurrence Time Rules

The primary start and end time are derived from `startsAt` and `endsAt`.

Fields:

- `repeatStartDate`
- `repeatStartTime`
- `repeatEndTime`

If end time is earlier than or equal to start time on the same day, `syncRecurringPrimaryDates` pushes the end date to the next day.

Per-day override shape:

```js
{
  [day]: {
    startTime: '09:00',
    endTime: '17:00'
  }
}
```

Nested per-day shape:

```js
recurring.perDayTimes = {
  [day]: {
    startTime: '09:00',
    endTime: '17:00'
  }
}
```

Backend implication:

- This supports "same event series, different times on selected days."
- A scalable recurrence backend should store recurrence rules separately from generated occurrences.
- Generated occurrences should be materialized for search, ticket sales windows, reporting, and attendee communication.

### Recurrence Completion

The frontend considers recurrence ready when:

- Rhythm is selected.
- Day selection is complete if the rhythm requires it.
- Primary date/time fields exist.
- End date/time is after start date/time.
- Repeat end date is not earlier than repeat start date when both are present.

Note:

- `repeatStopMode` and `repeatEndDate` are in state and payload.
- The currently visible template does not show a full stop-mode control in the sections reviewed.

Backend implication:

- Require a clear recurrence end rule before allowing infinite series in production.
- Good options:
  - End by date.
  - End after N occurrences.
  - No end, but only generate occurrences within a rolling horizon.

## Step 1 Attendance Format

Field:

```txt
form.format
```

Values:

- `in-person`
- `online`
- `hybrid`

UI label:

- Where is it happening?

Rules:

- If format is not `online`, `venue` is shown and required.
- If format is not `in-person`, `meetingLink` is shown and required.

Payload:

- `format`
- `venue`
- `meetingLink`

Backend should enforce:

- `venue` required for `in-person` and `hybrid`.
- `meetingLink` required for `online` and `hybrid`.
- Meeting links should not be shown publicly before purchase/registration unless policy allows it.

Scalable modeling:

- Store location details separately from event core.
- For online/hybrid events, store private meeting data in a restricted table or encrypted field.
- Public API responses should exclude `meetingLink` unless the current user is authorized.

## Step 1 Category

Field:

```txt
form.category
```

Validation:

- Required.

Payload:

- `category` as text.

Backend should prefer:

- `category_id`
- `category_slug`
- display name from categories table

Current frontend will need mapping if the backend moves to IDs.

## Step 2: Details

Step 2 collects media, description, organizer info, extra details, and tags.

### Event Images

Fields:

```txt
form.coverImage
form.secondaryImages
form.urlImages
form.coverGradient
```

Validation:

- `coverImage` is required to continue.

Upload behavior:

- The upload tab accepts image files.
- The URL tab accepts direct image URLs.
- Drag/drop is supported.
- File input accepts `image/*`.
- File uploads are capped at 6 total cover/gallery images.
- URL-added images are not currently capped, so the URL tab can exceed the six-image limit shown by the UI.
- First image becomes the cover image if no cover exists.
- Additional images go into `secondaryImages`.
- If a cover is removed, the first secondary image becomes the new cover.
- A secondary image can be promoted to cover; the old cover moves into secondary images.

File handling today:

- Uploaded local files are converted to Data URLs with `FileReader.readAsDataURL`.
- The Data URL is stored directly in frontend state.
- No upload API is called.

URL handling today:

- URL must end in jpg, jpeg, png, webp, or gif, optionally followed by a query string.
- URL is stored directly.
- URL-added images are also pushed into `urlImages`.

Payload:

- `coverImage`
- `secondaryImages`

Not included in payload:

- `urlImages`
- `coverGradient`

Backend implication:

- The current payload can contain very large base64 Data URLs.
- A scalable backend should not store base64 image blobs inside the event row.
- Use a media upload flow:
  - Upload file to storage.
  - Return media ID and URL.
  - Submit event payload referencing media IDs.
- External image URLs need validation, fetching/proxying policy, or clear trust boundaries.

Recommended scalable media model:

- `event_media`
  - `id`
  - `event_id`
  - `media_type`
  - `storage_disk`
  - `path`
  - `url`
  - `source_type` (`upload`, `external_url`, `generated_template`)
  - `is_cover`
  - `sort_order`
  - `alt_text`
  - `created_at`
  - `updated_at`

### Cover Templates

The UI has gradient templates and `applyCoverTemplate(gradient)` sets `form.coverGradient`.

Current limitation:

- `coverGradient` is not sent in `buildCreateEventPayload`.
- The selected gradient does not satisfy `coverImage` validation.

Backend implication:

- If gradient templates are meant to be real covers, add a real field to the payload or generate an image asset.
- If they are purely visual decoration in the editor, do not persist them.

### Description

Field:

```txt
form.description
```

UI:

- Optional.
- Textarea.

Payload:

- `description`, sanitized.

Backend should:

- Enforce max length.
- Decide whether rich text is allowed.
- Sanitize on write or render safely on read.

### Organizer

Fields:

```txt
form.organiser
form.organiserWebsite
```

Both are optional.

Payload:

- `organiser`
- `organiserWebsite`

Backend implication:

- In a scalable backend, the authenticated user or organization should own the event.
- `organiser` can remain a display override.
- `organiserWebsite` should be URL-validated.

### Extra Details

Field:

```txt
form.extraDetails
```

Shape:

```js
[
  {
    type: 'parking',
    label: 'Parking',
    icon: MapPinIcon,
    value: ''
  }
]
```

Payload shape:

```js
[
  {
    type: 'parking',
    label: 'Parking',
    value: 'Free parking on-site from 5pm.'
  }
]
```

Current behavior:

- Organizer clicks chips to add detail blocks.
- Duplicate detail types are prevented.
- Detail blocks can be removed.
- Values are optional in the UI.

Backend implication:

- Store these as ordered event content blocks.
- Keep `type` stable.
- Treat `label` as display text, but do not rely on it for logic.

### Tags

Field:

```txt
form.tags
```

Current format:

- A single comma-separated string.

Payload:

- `tags` as sanitized string.

Backend implication:

- Normalize into a tags table or store an array.
- If keeping a string temporarily, parse consistently on backend.

## Step 3: Tickets

Step 3 determines whether the event is free or paid and defines ticket inventory.

### Ticket Mode

Field:

```txt
form.ticketMode
```

Values:

- `free`
- `paid`

Default:

- `free`

When selected:

- `selectTicketMode(mode)` updates `form.ticketMode`.
- Ticket errors are cleared.

Backend implication:

- Store event ticketing mode explicitly.
- Ticketing mode determines which capacity/inventory rules apply.

### Free Admission

Field:

```txt
form.freeCapacity
```

UI:

- Label: Max spots
- Optional.
- Type number.
- Min 1.

Payload:

- `freeCapacity: Number(form.freeCapacity) || null`

Backend interpretation:

- `null` means unlimited capacity.
- Positive integer means free event capacity limit.

Backend should enforce:

- If `ticketMode` is `free`, paid tickets should probably be ignored or rejected.
- If `freeCapacity` is provided, it must be a positive integer.
- If capacity is null, define whether the event truly has unlimited registrations or a platform safety cap.

### Paid Ticket Categories

Field:

```txt
form.tickets
```

Paid mode requires at least one ticket category.

Adding a ticket:

```js
{
  id: ++ticketId.value,
  name: template.name,
  unitType: template.unitType,
  color: template.color,
  price: template.price,
  units: 0,
  peoplePerUnit: template.unitType === 'table' ? 10 : 1,
  maxPerPerson: 1,
  visible: true,
  perks: '',
  salesStart: '',
  salesEnd: '',
}
```

Current UI fields per ticket:

- Ticket name
- Seat type
- How many spots? or Number of tables
- People per table, only for table tickets
- Price
- Each person can buy
- Sales open
- Sales close
- Show on event page

Important current mismatch:

- The Perk Description UI field was removed.
- `perks` still exists in ticket state.
- `perks` is still included in the payload.
- Newly added tickets send `perks: ''`.

Backend implication:

- If perks are no longer product scope, treat `perks` as nullable/legacy and ignore it.
- If perks return later, keep the column/JSON field but do not require it.

### Ticket Name

Field:

```txt
ticket.name
```

Validation:

- Required for paid tickets.

Payload:

- Sanitized string.

Backend should enforce:

- Required if paid.
- Reasonable max length.
- Unique per event if that helps organizer reporting.

### Seat Type / Unit Type

Field:

```txt
ticket.unitType
```

Values:

- `individual`
- `table`

UI label:

- Seat type

Backend interpretation:

- `individual`: each unit is one seat/ticket.
- `table`: each unit is a table/group package, with `peoplePerUnit` seats attached.

Scalable backend model:

- Keep `unit_type`.
- Store `quantity_total` as the number of sellable units.
- Store `seats_per_unit`.
- Compute total seats as `quantity_total * seats_per_unit`.

### Quantity / Units

Field:

```txt
ticket.units
```

UI labels:

- Individual: How many spots?
- Table: Number of tables

Current defaults:

- `0`

Current validation:

- No explicit required validation.
- The input has `min="0"`.
- A zero-unit paid ticket can currently pass step validation if name is present and price is non-negative.

Payload:

- `units: Number(ticket.units) || 0`

Backend should enforce:

- Decide whether zero means hidden/unavailable/draft, or reject it for publish.
- For published ticket types, require positive quantity unless intentionally unlimited.
- The current placeholder says blank can mean unlimited, but conversion turns blank into `0`, not `null`.

This is a backend-critical ambiguity:

- UI copy says blank = unlimited.
- Payload sends blank as `0`.
- Backend should not interpret `0` as unlimited unless that rule is explicitly chosen.

Recommended fix later:

- Send `null` for unlimited.
- Send positive integer for limited quantity.
- Reject negative numbers.

### People Per Table

Field:

```txt
ticket.peoplePerUnit
```

Shown only when `unitType === 'table'`.

Default:

- `10` for table tickets.
- `1` for individual tickets.

Payload:

- `peoplePerUnit: Number(ticket.peoplePerUnit) || 1`

Backend should enforce:

- Required positive integer for table tickets.
- For individual tickets, force to `1` regardless of client input.

### Price

Field:

```txt
ticket.price
```

UI:

- Label: Price with Naira symbol.
- Placeholder: `0 = free`
- Type number.
- Min 0.

Validation:

- Price cannot be negative.
- Price may be 0 even in paid mode.

Payload:

- `price: Number(ticket.price) || 0`

Backend should enforce:

- Non-negative numeric amount.
- Store in minor units if possible, such as kobo, to avoid decimal precision problems.
- Store currency explicitly, probably `NGN`.

### Each Person Can Buy

Field:

```txt
ticket.maxPerPerson
```

UI:

- Optional.
- Type number.
- Min 1.
- Placeholder: `e.g. 2 means one person can only buy 2 tickets`

Default:

- `1`

Payload:

- `maxPerPerson: Number(ticket.maxPerPerson) || 1`

Current behavior:

- Even though the UI says optional, blank becomes `1`.
- That means the current data contract does not represent "no per-person max."

Backend implication:

- Decide whether null means unlimited or default to 1.
- The current frontend sends 1 when blank, so a backend that wants optional/unlimited will need a frontend payload change.

Recommended scalable rule:

- `max_per_order` or `max_per_buyer` nullable.
- `null` means no explicit cap beyond inventory.
- Positive integer means enforce cap across order attempts for the same user/email/phone.

### Sales Window

Fields:

```txt
ticket.salesStart
ticket.salesEnd
```

UI:

- Optional date/time pickers.
- Both use `DateTimePickerInput`.
- Min date is today.

Current validation:

- No validation that sales close is after sales open.
- No validation that sales window fits within event time.

Payload:

- `salesStart: ticket.salesStart || null`
- `salesEnd: ticket.salesEnd || null`

Backend should enforce:

- `sales_end` after `sales_start` when both exist.
- Decide whether sales can end after event start.
- Decide default sales open behavior if null.
- Decide default sales close behavior if null.

### Visibility

Field:

```txt
ticket.visible
```

UI:

- Label: Show on event page
- Helper: Attendees will see this ticket type.
- Checkbox.

Default:

- `true`

Payload:

- `visible: Boolean(ticket.visible)`

Backend implication:

- Hidden ticket types should not appear in public event detail responses.
- Hidden ticket types might still be available through private links or organizer tools if you choose to support that.

### Total Capacity Computation

Frontend computed:

```js
totalCapacity = tickets.reduce((sum, ticket) => {
  if (ticket.unitType === 'table') return sum + ticket.units * ticket.peoplePerUnit
  return sum + ticket.units
}, 0)
```

This is display-only. The payload sends ticket details, not `totalCapacity`.

Backend implication:

- Capacity should be computed server-side from ticket inventory.
- Do not trust frontend total capacity.

## Step 4: Attendees

Step 4 configures the registration form and shows an email preview.

Field:

```txt
form.attendeeFields
```

Current UI:

- Required fields show a `Required` tag and cannot be toggled.
- Optional fields show checkboxes.
- The email preview is hardcoded and display-only.

Payload:

```js
attendeeFields: form.attendeeFields.map((field) => ({
  id: field.id,
  label: field.label,
  enabled: Boolean(field.enabled),
  required: Boolean(field.required),
}))
```

Backend implication:

- Store event-specific attendee field configuration.
- Registration validation must use the event's active schema.
- Name and email are always required in current UI.
- The frontend does not currently support custom fields beyond the default list.

Recommended backend model:

- `attendee_form_fields`
  - `id`
  - `event_id`
  - `field_key`
  - `label`
  - `type`
  - `enabled`
  - `required`
  - `sort_order`
  - `options_json`
  - `created_at`
  - `updated_at`

For actual registrations:

- Store canonical fields like name/email/phone as columns.
- Store event-specific extra answers in JSON or a related `attendee_answers` table.

## Live Preview

The live preview builds `previewEvent` and passes it to `EventCard`.

Preview shape:

```js
{
  id: 'preview',
  title,
  main_image,
  date,
  location,
  category: { name },
  price,
  rating: '4.5',
}
```

Location logic:

- Online: `Online event`.
- In-person: venue or `Location TBC`.
- Hybrid: venue or `In-person & online`.

Current price logic:

```js
form.ticketMode === 'free'
  ? 0
  : Math.min(...visibleTickets.value.map((ticket) => Number(ticket.price) || 0), 0)
```

Important detail:

- Because `0` is always included in `Math.min`, paid preview price currently resolves to `0`.
- This is a preview bug or at least a misleading current behavior.
- It does not affect the payload.

Backend implication:

- Public event listing price should be computed backend-side from visible, saleable ticket types.
- Good listing price fields:
  - `min_price`
  - `max_price`
  - `is_free`
  - `currency`
  - `has_available_tickets`

## Draft Behavior

Save draft:

```js
saveCreateEventDraft(form)
```

Storage key:

```txt
kaka-create-event-draft
```

Storage location:

```txt
window.localStorage
```

Saved value:

- JSON string of `buildCreateEventPayload(form)`.

Current limitations:

- Draft is browser-local.
- Draft is not user-account scoped.
- Draft is not synced across devices.
- Draft is overwritten each time.
- There is no draft restore logic in the current Create Event page.

Backend implication:

- A scalable backend should support server-side drafts.
- Drafts should belong to organizer/user.
- Drafts should support partial validation.
- Publishing should apply stricter validation than saving a draft.

Recommended draft endpoints:

```txt
POST /api/events/drafts
PATCH /api/events/drafts/{draft}
GET /api/events/drafts/{draft}
DELETE /api/events/drafts/{draft}
POST /api/events/drafts/{draft}/publish
```

## Publish Behavior

Current function:

```js
function publishEvent() {
  if (!validateStep(4)) return
  buildCreateEventPayload(form)
  saveDraft()
  published.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
```

Important details:

- `buildCreateEventPayload(form)` is called but its return value is not assigned.
- `saveDraft()` calls `saveCreateEventDraft(form)` and stores the payload locally.
- No backend request is made.
- The success screen is purely local.

Backend implication:

- Real publishing should call an authenticated endpoint.
- The endpoint should return the canonical event ID, slug, dashboard URL, and public URL.
- The frontend success screen should use server-returned data, not a client-generated slug.

Current success link:

```js
kaka.events/e/{{ slugified form.title }}
```

This is display-only and not router-backed in the current app.

## Current Payload Contract

`buildCreateEventPayload(form)` returns:

```js
{
  title,
  startsAt,
  endsAt,
  recurring,
  recurrence,
  format,
  venue,
  meetingLink,
  category,
  description,
  organiser,
  organiserWebsite,
  tags,
  coverImage,
  secondaryImages,
  ticketMode,
  freeCapacity,
  tickets,
  attendeeFields,
  extraDetails,
}
```

Expanded shape:

```js
{
  title: String,
  startsAt: Date | String | null,
  endsAt: Date | String | null,
  recurring: {
    frequency: String | null,
    selectedDays: Array,
    useDefaultTimes: Boolean,
    perDayTimes: Object,
  },
  recurrence: {
    type: 'once' | 'recur',
    frequency: String | null,
    interval: Number,
    unit: String | null,
    days: Array,
    startDate: String | null,
    startTime: String | null,
    endTime: String | null,
    dayOverrides: Object,
    stopMode: String | null,
    endDate: String | null,
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

Fields in form state but not payload:

- `coverGradient`
- `urlImages`

Frontend-only fields not intended for backend:

- current step state
- preview toggle
- dropdown open/closed state
- toast state
- local ticket ID counter
- theme fallback state

## Sanitization

`createEventService.js` uses:

```js
const stripUnsafeHtml = (value) =>
  String(value ?? '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim()
```

This is applied to:

- Event title
- Venue
- Meeting link
- Category
- Description
- Organizer
- Organizer website
- Tags
- Ticket name
- Ticket perks
- Extra detail value

It is not a substitute for backend validation or output escaping.

Backend should still:

- Validate types.
- Enforce lengths.
- Sanitize/escape based on rendering context.
- Reject malformed URLs.
- Protect against stored XSS.
- Authorize ownership.

## Current Validation Matrix

Step 1:

- `title` required.
- `startsAt` required.
- `endsAt` required.
- `startsAt` cannot be before today at midnight.
- `endsAt` must be after `startsAt`.
- `venue` required for in-person and hybrid.
- `meetingLink` required for online and hybrid.
- `category` required.
- Recurrence rhythm/day/date requirements apply when recurring.

Step 2:

- `coverImage` required.

Step 3:

- If paid:
  - At least one ticket required.
  - Each ticket name required.
  - Each ticket price must be non-negative.

Step 4:

- No additional validation today.

Backend must add stricter validation for:

- Ticket quantity.
- Max per person optional/null behavior.
- Sales start/end logic.
- Image size/type/storage.
- URL validation.
- Category existence.
- Organizer authorization.
- Recurrence end rules.
- Timezone.
- Duplicate ticket names if desired.
- Public visibility and publish status.

## Current Backend Integration Gaps

1. Create Event publish does not call the backend.
2. Create Event draft is local-only.
3. Media upload is not server-backed.
4. The current event store has a create action, but Create Event does not use it.
5. Existing `eventService.createEvent` points to an older `events.php` path.
6. The app also has a separate Axios instance in `src/api/axios.js` that looks more Laravel/Sanctum-friendly.
7. The existing `docs/api-spec.md` create event body does not match the current Create Event payload.
8. Category data is hardcoded in the frontend instead of loaded from backend.
9. Ticket inventory rules are not enforced at the backend because publish is not wired.
10. Some frontend labels imply nullable/unlimited behavior, but payload conversion sends `0` or `1`.

## Recommended Scalable Backend Shape

The backend should be designed around stable domains, not the current page layout. The page layout can change; these domains should survive.

### Core Domains

- Users and organizations
- Events
- Event drafts
- Event schedules and occurrences
- Event media
- Categories and tags
- Ticket types
- Ticket inventory
- Orders and payments
- Registrations/attendees
- Attendee form schema
- Notifications
- Dashboard/reporting
- Audit log

### Suggested Tables

#### `events`

Core event record.

Recommended columns:

- `id`
- `organizer_user_id`
- `organization_id`
- `category_id`
- `title`
- `slug`
- `description`
- `format`
- `status` (`draft`, `published`, `cancelled`, `archived`)
- `timezone`
- `starts_at`
- `ends_at`
- `ticket_mode`
- `free_capacity`
- `organiser_display_name`
- `organiser_website`
- `published_at`
- `created_at`
- `updated_at`

#### `event_locations`

Location/private access data.

Recommended columns:

- `id`
- `event_id`
- `venue_name`
- `address`
- `city`
- `state`
- `country`
- `latitude`
- `longitude`
- `meeting_link`
- `meeting_instructions`
- `created_at`
- `updated_at`

Keep `meeting_link` out of public unauthenticated responses.

#### `event_media`

Images and other media.

Recommended columns:

- `id`
- `event_id`
- `type`
- `source_type`
- `disk`
- `path`
- `url`
- `is_cover`
- `sort_order`
- `alt_text`
- `created_at`
- `updated_at`

#### `event_recurrence_rules`

Parent recurrence configuration.

Recommended columns:

- `id`
- `event_id`
- `frequency`
- `interval`
- `timezone`
- `start_date`
- `start_time`
- `end_time`
- `end_date`
- `end_after_occurrences`
- `use_default_times`
- `rule_json`
- `created_at`
- `updated_at`

#### `event_recurrence_days`

Selected days and time overrides.

Recommended columns:

- `id`
- `recurrence_rule_id`
- `day_type` (`weekday`, `monthday`)
- `day_value`
- `start_time`
- `end_time`
- `created_at`
- `updated_at`

#### `event_occurrences`

Materialized instances for recurring events.

Recommended columns:

- `id`
- `event_id`
- `starts_at`
- `ends_at`
- `status`
- `capacity_override`
- `created_at`
- `updated_at`

This makes search, reminders, tickets, and reporting much easier.

#### `ticket_types`

Ticket category definition.

Recommended columns:

- `id`
- `event_id`
- `name`
- `unit_type`
- `color`
- `currency`
- `price_minor`
- `quantity_total`
- `quantity_sold`
- `quantity_reserved`
- `seats_per_unit`
- `max_per_buyer`
- `visible`
- `sales_start_at`
- `sales_end_at`
- `sort_order`
- `status`
- `legacy_perks`
- `created_at`
- `updated_at`

#### `ticket_inventory_holds`

Temporary holds during checkout.

Recommended columns:

- `id`
- `ticket_type_id`
- `user_id`
- `session_id`
- `quantity`
- `expires_at`
- `created_at`
- `updated_at`

This prevents overselling during payment.

#### `orders`

Purchase/registration transaction.

Recommended columns:

- `id`
- `event_id`
- `user_id`
- `buyer_email`
- `buyer_name`
- `status`
- `currency`
- `subtotal_minor`
- `fees_minor`
- `total_minor`
- `payment_provider`
- `payment_reference`
- `created_at`
- `updated_at`

#### `order_items`

Ticket quantities per order.

Recommended columns:

- `id`
- `order_id`
- `ticket_type_id`
- `quantity`
- `unit_price_minor`
- `total_price_minor`
- `created_at`
- `updated_at`

#### `attendee_form_fields`

Event-specific registration form.

Recommended columns:

- `id`
- `event_id`
- `field_key`
- `label`
- `type`
- `enabled`
- `required`
- `sort_order`
- `options_json`
- `created_at`
- `updated_at`

#### `attendees`

Actual attendee records.

Recommended columns:

- `id`
- `event_id`
- `order_id`
- `ticket_type_id`
- `name`
- `email`
- `phone`
- `status`
- `checked_in_at`
- `created_at`
- `updated_at`

#### `attendee_answers`

Event-specific answers.

Recommended columns:

- `id`
- `attendee_id`
- `field_key`
- `label_snapshot`
- `value`
- `created_at`
- `updated_at`

Snapshot the label so historical data still makes sense after organizer edits.

#### `event_extra_details`

Optional details from Step 2.

Recommended columns:

- `id`
- `event_id`
- `type`
- `label`
- `value`
- `sort_order`
- `created_at`
- `updated_at`

#### `tags` and `event_tag`

Normalize tags.

Recommended columns for `tags`:

- `id`
- `name`
- `slug`

Recommended columns for `event_tag`:

- `event_id`
- `tag_id`

## Recommended API Contract

A scalable API can still accept a shape close to the current frontend payload, but it should normalize server-side.

### Draft

```txt
POST /api/events/drafts
PATCH /api/events/drafts/{draft}
GET /api/events/drafts/{draft}
DELETE /api/events/drafts/{draft}
```

Draft validation:

- Allow incomplete fields.
- Validate basic types.
- Store payload snapshots.
- Associate with current user.

### Publish

```txt
POST /api/events/drafts/{draft}/publish
```

or:

```txt
POST /api/events
```

Publish validation:

- Full required-field validation.
- Media validation.
- Ticket inventory validation.
- Organizer authorization.
- Recurrence validation.
- Transactional creation of event, media, ticket types, form fields, and recurrence rows.

Response:

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

### Media

```txt
POST /api/media
```

Request:

- Multipart file upload.
- Returns media ID, URL, type, size, dimensions.

Then event payload should reference media IDs instead of Data URLs.

### Categories

```txt
GET /api/categories
```

Frontend should eventually load categories from backend rather than hardcoding.

### Tickets

Ticket types can be created inside publish, or managed separately:

```txt
POST /api/events/{event}/ticket-types
PATCH /api/events/{event}/ticket-types/{ticketType}
DELETE /api/events/{event}/ticket-types/{ticketType}
```

## Mapping Current Payload To Backend

| Current payload field | Backend destination |
| --- | --- |
| `title` | `events.title` |
| `startsAt` | `events.starts_at` or first `event_occurrences.starts_at` |
| `endsAt` | `events.ends_at` or first `event_occurrences.ends_at` |
| `recurrence` | `event_recurrence_rules`, `event_recurrence_days`, `event_occurrences` |
| `recurring` | Same recurrence tables, but should be merged with `recurrence` |
| `format` | `events.format` |
| `venue` | `event_locations.venue_name` or `event_locations.address` |
| `meetingLink` | `event_locations.meeting_link` |
| `category` | `categories.name` lookup, then `events.category_id` |
| `description` | `events.description` |
| `organiser` | `events.organiser_display_name` |
| `organiserWebsite` | `events.organiser_website` |
| `tags` | `tags` and `event_tag` |
| `coverImage` | `event_media` cover record |
| `secondaryImages` | `event_media` gallery records |
| `ticketMode` | `events.ticket_mode` |
| `freeCapacity` | `events.free_capacity` |
| `tickets` | `ticket_types` |
| `attendeeFields` | `attendee_form_fields` |
| `extraDetails` | `event_extra_details` |

## Backend Rules To Mirror Or Improve

Mirror:

- Required title.
- Start/end required.
- End after start.
- Format-specific venue/meeting link requirements.
- Category required.
- Cover image required for publish.
- Paid events need at least one ticket.
- Paid ticket names required.
- Ticket prices cannot be negative.
- Name/email attendee fields required.

Improve:

- Require explicit timezone.
- Normalize recurrence.
- Require recurrence stop rule or generation horizon.
- Validate image upload size/type.
- Validate organizer website URL.
- Parse tags.
- Validate ticket quantities.
- Represent unlimited capacity clearly.
- Represent optional max-per-person clearly.
- Validate sales windows.
- Prevent ticket overselling.
- Hide meeting links from public responses.
- Require authentication for creation.
- Use transactions around event publishing.

## Current Edge Cases And Ambiguities

### Blank Ticket Quantity

UI says blank can mean unlimited, but payload sends `0`.

Decision needed:

- Is `0` sold out?
- Is `0` unlimited?
- Should unlimited be `null`?

Recommended:

- Use `null` for unlimited.
- Use positive integer for limited.
- Reject `0` on publish unless explicitly supporting unavailable draft ticket types.

### Optional Max Per Person

UI says optional, but payload sends `1` when blank.

Decision needed:

- Is no input supposed to mean one per person?
- Or is no input supposed to mean unlimited?

Recommended:

- Use `null` for no explicit cap.
- Use positive integer for a cap.

### Perks Removed From UI

The UI no longer collects perks, but payload still includes `perks`.

Decision needed:

- Remove from payload later?
- Keep as legacy nullable field?

Recommended:

- Backend should not require it.
- Keep nullable if old events may have it.

### Cover Gradient Not Submitted

The UI stores `coverGradient`, but payload excludes it.

Decision needed:

- Should template gradients become real cover assets?
- Or should they be removed from data state?

### URL Images Not Submitted Separately

`urlImages` tracks externally added image URLs, but payload only sends `coverImage` and `secondaryImages`.

Decision needed:

- If source tracking matters, add source metadata to media payload.

### Paid Preview Price Always Looks Free

The current preview price calculation includes `0` inside `Math.min`, so paid preview price can display as 0 even when tickets have prices.

Backend decision:

- Listing price should be computed from ticket types server-side.

### Create Event Route Is Public

The route does not currently require auth.

Backend decision:

- Creation endpoints must require auth regardless of route state.

### Existing API Spec Is Older

`docs/api-spec.md` describes a simpler create event request with fields like `date`, `location`, `price`, `totalTickets`, and `ticketTypes`.

Current Create Event payload is richer and different.

Decision needed:

- Update the API spec after choosing the canonical backend contract.

## Suggested Backend Publish Transaction

When the frontend eventually calls publish, the backend should do the whole operation transactionally:

1. Authenticate user.
2. Validate payload.
3. Resolve or reject category.
4. Create event core row.
5. Create location row.
6. Attach media records.
7. Create recurrence rule if recurring.
8. Generate initial occurrence rows if recurring.
9. Create ticket types or free capacity config.
10. Create attendee form schema.
11. Create extra detail rows.
12. Normalize and attach tags.
13. Mark event as published.
14. Commit transaction.
15. Return canonical event resource.

If any step fails, roll back everything.

## Suggested Event Resource For Public Reads

Public event detail responses should probably include:

```json
{
  "id": 123,
  "slug": "lagos-tech-summit-2026",
  "title": "Lagos Tech Summit 2026",
  "description": "...",
  "category": {
    "id": 1,
    "name": "Startup & Tech",
    "slug": "startup-tech"
  },
  "format": "hybrid",
  "location": {
    "venue": "The Civic Centre",
    "city": "Lagos"
  },
  "starts_at": "2026-07-01T17:00:00Z",
  "ends_at": "2026-07-01T21:00:00Z",
  "timezone": "Africa/Lagos",
  "media": {
    "cover": "...",
    "gallery": []
  },
  "ticketing": {
    "mode": "paid",
    "currency": "NGN",
    "min_price": 500000,
    "max_price": 3000000,
    "ticket_types": []
  },
  "attendee_form": {
    "fields": []
  },
  "extra_details": [],
  "tags": []
}
```

Do not include:

- Meeting link for unauthenticated public viewers.
- Internal draft fields.
- Inventory reservation internals.
- Organizer-only analytics.

## Suggested Organizer Dashboard Resource

Organizer/dashboard responses can include private and operational data:

- Meeting link.
- Draft status.
- Hidden tickets.
- Sales counts.
- Remaining inventory.
- Revenue.
- Attendee answers.
- Check-in stats.
- Payout data.
- Edit URLs.

Keep public and organizer resources separate so sensitive fields do not leak.

## How To Update This Document Later

When Create Event changes, update these sections:

1. If a form field is added/removed, update "Wizard State" and the relevant step.
2. If payload changes, update "Current Payload Contract" and mapping table.
3. If validation changes, update "Current Validation Matrix".
4. If publishing starts calling the backend, update "Publish Behavior" and "Current Backend Integration Gaps".
5. If image upload changes, update "Event Images" and "Media".
6. If ticket semantics change, update "Step 3: Tickets" and edge cases.
7. If recurrence changes, update "Recurrence Model In Detail".

The goal is simple: this doc should describe what the frontend actually sends and what the backend should actually trust.
