# Rush Hour event lifecycle and relationships

Reviewed on 23 November 2026, using the current working files in `C:/Users/HP/kaka` and the connected Laravel project in `C:/Users/HP/kakabackend`.

Rush Hour connects an event organiser, an event, its public content, ticket types, buyers, payments and issued tickets. The current event wizard saves to Laravel. Paid checkout also has a Laravel implementation. Several organiser tools still use preview data or browser storage, so a screen being present does not always mean its backend flow is connected.

This reference groups the implementation by use case, including older files, alternative configurations and unfinished connections. It describes source behaviour; deployment settings, applied database migrations and live payment processing have not been verified. Application behaviour and existing files were left unchanged.

Frontend paths below are relative to `kaka`. Backend paths are relative to `kakabackend` unless they explicitly begin with `backend/` inside the frontend repository.

## How the product fits together

```text
Authenticated account
  └─ creates and owns an event through events.created_by
       ├─ public organiser identity through events.organizer_id
       ├─ category, subcategories, venue and event options
       ├─ schedule, recurrence settings and registration field settings
       ├─ cover, gallery and optional public profile
       ├─ ticket types and their sales windows
       ├─ public visits, saved events and sharing sources
       └─ paid checkout
            ├─ buyer details and optional buyer account → order
            ├─ event + ticket type + seller → order items
            ├─ Paystack attempts → payments
            ├─ verified payment → issued tickets
            └─ seller allocations → payout account or platform-held funds

Organiser workspace
  ├─ owned events and overview → Laravel outside development preview
  ├─ sharing links → Laravel outside development preview
  ├─ event details → editor API outside development preview
  └─ attendees, entrances, movement history, discounts and bank setup
       → preview, browser storage or unfinished backend connection
```

The buyer, ticket holder, public guest or speaker, event owner and public organiser can be different people. The current app does not put them all in one people table or one event membership system.

### Implementation labels

| Label             | Meaning                                                                                                                       |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Connected         | The current frontend calls a matching Laravel route and handler. This describes the code connection, not a live service test. |
| Preview           | Development substitutes example data or browser state.                                                                        |
| Browser only      | Data stays in localStorage, sessionStorage or component memory.                                                               |
| Backend only      | Laravel has the implementation, with no matching current product interaction found.                                           |
| Older or unlinked | A retained implementation is outside the current route and import path, or belongs to an older data contract.                 |
| Incomplete        | The interface, setting or schema exists, but a required connection is missing.                                                |

### Use case index

| ID   | Use case                                      | Current position                                                            |
| ---- | --------------------------------------------- | --------------------------------------------------------------------------- |
| UC01 | Sign in and establish account identity        | Connected through session authentication                                    |
| UC02 | Create and save an event draft                | Connected                                                                   |
| UC03 | Configure event dates and recurrence          | Saved; recurring occurrences are not materialised                           |
| UC04 | Add public event content and media            | Core form connected; richer profile content is database-managed             |
| UC05 | Configure ticket types and capacity           | Connected for paid event ticket types                                       |
| UC06 | Configure attendee questions                  | Settings saved; checkout does not collect the configured answers            |
| UC07 | Publish an event                              | Connected; server validation is narrower than the frontend rules            |
| UC08 | Edit an existing event                        | Connected for the owner                                                     |
| UC09 | Browse and open public events                 | Connected, with additional static and older fallback sources                |
| UC10 | Save, follow and revisit events or people     | Mixed backend likes, browser follows and older recommendation inputs        |
| UC11 | Select tickets and build a cart               | Browser session; server quote follows                                       |
| UC12 | Quote and initialise a paid order             | Connected; guest and signed-in buyers supported                             |
| UC13 | Verify payment and issue tickets              | Connected through verification and webhook handlers                         |
| UC14 | View an order and its QR tickets              | Connected with buyer ownership or checkout token                            |
| UC15 | Open the organiser workspace and report sales | Connected outside development preview                                       |
| UC16 | Share events and attribute sales              | Connected outside development preview                                       |
| UC17 | Manage attendees and their purchase details   | Preview model; no live attendee API                                         |
| UC18 | Manage entrances and door check-in            | Preview model; no live check-in API                                         |
| UC19 | Create and apply discounts                    | Preview configuration; no checkout redemption                               |
| UC20 | Message attendees and manage notifications    | Browser drafts and derived notices; attendee delivery incomplete            |
| UC21 | Review earnings and receive payouts           | Sales summaries connected; bank onboarding and payout management incomplete |
| UC22 | Manage access, roles and event administration | Owner checks connected; broader role and team features incomplete           |
| UC23 | Delete, cancel, refund or finish an event     | Older delete handler; cancellation and refund workflows incomplete          |

## People and their relationship with an event

### Account identity and event ownership

An authenticated `User` owns the event through `events.created_by`. This is the relationship used by the current draft editor, dashboard and seller allocation logic. Creating an event does not require a separate organiser role in the current create-event routes; it requires a Sanctum-authenticated account.

The form's `organiser` name is a separate public identity. `CreateEventService::resolveOrganizer()` finds an organiser by its case-insensitive name or creates one with a nullable email. It does not link that organiser record to the signed-in user's account. Matching a public organiser name therefore does not establish ownership or permission.

| Person or identity                 | Stored relationship                                                    | What it means                                                           | What it does not establish                                               |
| ---------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Event owner or creator             | `events.created_by → users.id`                                         | Can edit this event and open its dashboard through current owner checks | A team membership or shared access policy                                |
| Public organiser                   | `events.organizer_id → organizers.id`                                  | Public organiser name and contact identity                              | Login identity, event ownership or payout recipient                      |
| Buyer with an account              | `orders.user_id → users.id`, nullable                                  | Account that placed the order, when authenticated                       | The identity of every person attending                                   |
| Guest buyer                        | `orders.customer_*` plus `checkout_token_hash`                         | Buyer contact snapshot and guest access to that order                   | An automatically created user account                                    |
| Seller                             | `order_items.seller_user_id → users.id`                                | Snapshot of the event owner when checkout is quoted and saved           | A public speaker or the organiser-name record                            |
| Payout recipient                   | `payout_accounts.user_id → users.id`                                   | Seller account that can have a provider subaccount                      | A verified account merely because bank details were typed in the preview |
| Ticket holder                      | Currently reached through `tickets → order_items → orders`             | Issued admission entitlement associated with a buyer's order            | A separate named attendee account or one named person per admission      |
| Public guest, performer or speaker | `event_public_profiles.guests[]` or `extra_details` of type `speakers` | Public name, role, biography, image and optional event list             | A purchased ticket or dashboard permission                               |
| Crew member                        | `event_public_profiles.crew[]`                                         | Public name and role credit                                             | Staff access or an authenticated team invitation                         |
| Door staff                         | Preview `entrances[].contacts[]`                                       | Names, emails and optional phone numbers attached to an entrance        | A user-to-event permission or sent invitation                            |
| Visitor                            | `event_traffic_views.visitor_hash`, optional `user_id`                 | Browser visitor identity used for visits and attribution                | A unique verified human or ticket buyer                                  |
| Person saving an event             | `event_likes.user_id + event_id`                                       | Account-to-event favourite relationship                                 | Ownership, purchase or registration                                      |
| Person following a public profile  | Browser key containing event ID and name                               | Follow preference on that device                                        | A server-backed follower or cross-device account relationship            |

Sources: [Event](../../kakabackend/app/Models/Event.php), [User](../../kakabackend/app/Models/User.php), [Organizer](../../kakabackend/app/Models/Organizer.php), [Order](../../kakabackend/app/Models/Order.php), [OrderItem](../../kakabackend/app/Models/OrderItem.php), [Ticket](../../kakabackend/app/Models/Ticket.php), [CreateEventService](../../kakabackend/app/Services/CreateEventService.php), [public profile model](../../kakabackend/app/Models/EventPublicProfile.php).

### Four different meanings of role

| Role reference                                    | Current implementation                                                              | Status                                                                                                                                                      |
| ------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account role such as `admin`                      | Frontend `auth.isAdmin` checks `user.role === 'admin'`; the admin route requires it | Frontend check exists, but the inspected user model and base user migration do not define the matching role integration                                     |
| Older backend `admin` or `agent` role             | Generic `EventController` CRUD calls `hasAnyRole()`                                 | Spatie package, config and permission-table migration exist; the current `User` model does not use `HasRoles`, so these checks cannot be assumed functional |
| Role in this event, such as staff or co-organiser | Entrance contacts and access settings express parts of this idea                    | No current event membership, invitation acceptance or scoped role enforcement flow                                                                          |
| Public role such as host, DJ, producer or speaker | Text in profile guests, crew or speaker details                                     | Public descriptive content, with no access rights                                                                                                           |

The attendee field named `job` is another descriptive field: it asks for a job title. It is not an application permission. A discount's `partner` name is promotional metadata, not a seller account or staff membership.

The current owner-only endpoints do not automatically give an admin or agent access to someone else's event. The older generic CRUD role checks and the newer owner checks are different policies.

## Event data and its related records

| Record                  | Relationship                                                   | Use cases and responsibility                                                                                                    |
| ----------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `events`                | Central event record                                           | UC02–UC09; title, schedule, ownership, public identity, format, status and saved configuration                                  |
| `categories`            | `events.category_id`                                           | UC02, UC09; existing category lookup and discovery                                                                              |
| `sub_categories`        | Many events through `event_sub_category`                       | UC09 and older CRUD; the current wizard does not collect subcategories                                                          |
| `organizers`            | One organiser can appear on many events                        | UC04; public identity                                                                                                           |
| `event_addresses`       | `events.address_id`                                            | UC02, UC04; venue and address. Current wizard resolution fills the venue name and creates otherwise mostly blank address fields |
| `ticket_types`          | Many per event                                                 | UC05, UC11–UC15; price, product units, people per unit, limits, visibility and sales windows                                    |
| `faqs`                  | Many per event                                                 | UC04, UC09; older structured FAQ relation, still read publicly                                                                  |
| `event_options`         | Many-to-many through `event_event_option`                      | Older CRUD options; separate from the current wizard's JSON extra details                                                       |
| `event_media`           | Many per event, with cover flag and order                      | UC04; cover and gallery URLs                                                                                                    |
| `event_public_profiles` | Optional single row per event, unique `event_id`               | UC04, UC09; rich public content and displayed people                                                                            |
| `event_likes`           | User and event pair                                            | UC10; saved events                                                                                                              |
| `event_views`           | Older authenticated user and event visits                      | UC10; recommendation history                                                                                                    |
| `purchases`             | Older user, event and ticket type relation                     | UC10 and retained purchase-history protection; separate from current orders                                                     |
| `event_traffic_views`   | Event, hashed visitor and optional user                        | UC15–UC16; current visit analytics and attribution                                                                              |
| `event_share_links`     | Event plus unique source code                                  | UC16; built-in and custom sharing sources                                                                                       |
| `orders`                | Optional buyer account; many order items and payments          | UC12–UC14; contact snapshot, total, reservation and payment state                                                               |
| `order_items`           | Order, event, ticket type, seller and optional attributed view | UC12–UC16; commercial snapshot of each selected ticket product                                                                  |
| `payments`              | Many attempts can belong to one order                          | UC13; Paystack reference, amount, currency and verification state                                                               |
| `tickets`               | Order item, event and ticket type                              | UC13–UC14; issued QR entitlement, token and admission count                                                                     |
| `order_allocations`     | Order and seller, optional payout account                      | UC21; gross amount, platform fee, seller net and settlement state                                                               |
| `payout_accounts`       | One per seller user in the commerce migration                  | UC21; provider subaccount and account status                                                                                    |
| Permission tables       | Roles, permissions and polymorphic assignments                 | UC22; older Spatie foundation, not a completed event access system                                                              |

Attendee answers, named holders per ticket, entrances, entry and exit records, event team invitations, discount redemptions and attendee message delivery do not have matching live domain flows in the inspected Laravel routes and models. Their current frontend equivalents are described below.

## UC01 Sign in and establish account identity

The current authentication source is [src/stores/auth.js](../src/stores/auth.js), using the credentialed Axios client in [src/api/axios.js](../src/api/axios.js). Login and registration obtain a CSRF cookie, post credentials, then fetch `/api/user`. The user returned by that endpoint becomes the authenticated identity.

The store saves a user snapshot and provider label to localStorage, but does not accept those values as proof of an authenticated session. Protected routes call `auth.initialize()` and check the server-established user. Google login returns through `GoogleCallback.vue`, which also fetches the authenticated user before routing onward.

Authentication supports email/password login, registration, logout, password recovery and Google sign-in. The frontend's `updateUser()` calls `PUT /api/user`, but the inspected Laravel routes only register `GET /api/user`; account editing through that action is incomplete.

The `/create-event` page itself has no `requiresAuth` route metadata. Its create, edit and publish API endpoints are still authenticated. `/events/:id/edit`, dashboard routes, `/transactions`, `/trolio` and `/admin` have route protection; `/admin` also requires the frontend admin check.

Older [src/services/authService.js](../src/services/authService.js) implements a browser-only demo user database and generated tokens. It is not imported by the current application entry graph. [src/utils/auth.js](../src/utils/auth.js) is another unlinked bearer-token helper. Neither is the current session authentication flow.

Backend sources: [AuthController](../../kakabackend/app/Http/Controllers/Api/AuthController.php), [API routes](../../kakabackend/routes/api.php), [Google callback component](../src/components/GoogleCallback.vue), [router](../src/router/index.js).

## UC02 Create and save an event draft

The current screen is [src/pages/CreateEvent.vue](../src/pages/CreateEvent.vue). Its four steps are Basics, Details, Tickets and Attendees. The form starts as a one-time event with a start and end tomorrow. Advancing runs frontend step validation; saving a draft allows incomplete content within the backend's draft field rules.

The request flow is:

1. The organiser chooses Save draft.
2. `persistDraft()` calls `createEventDraft(form)` if the page has no draft ID.
3. `createEventService.js` requests the CSRF cookie, builds a JSON payload and posts `/api/create-event`.
4. Laravel validates draft field types, lengths and enums.
5. `CreateEventService::saveEvent()` runs the relational writes inside a database transaction.
6. The backend resolves category, organiser and venue; saves the event with `created_by` from the session and `status = draft`; synchronises ticket types and media.
7. The frontend stores the returned `data.id` in component state. Later saves on that page use `PATCH /api/create-event/{id}`.

The response summary is `{ data: { id, status, title }, message }`. The first save returns HTTP 201. The current summary does not return a slug or public URL. The success screen builds a frontend URL when needed.

This draft ID is held in memory on the creation page. There is no automatic create-page restoration of an earlier server draft or a former browser draft. Existing draft records can be reopened through the event editing route if the organiser navigates to their event.

The service still exports `saveCreateEventDraft(form)`, which writes `kaka-create-event-draft` to localStorage. The current wizard uses the API functions instead of that older helper.

Sources: [frontend service](../src/services/createEventService.js), [CreateEventController](../../kakabackend/app/Http/Controllers/Api/CreateEventController.php), [backend save service](../../kakabackend/app/Services/CreateEventService.php).

### Creation payload and database mapping

| Frontend field                             | Backend storage or transformation                                                                          | Used for                                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `title`, `description`                     | `events.title`, `events.description`, stripped of basic unsafe markup                                      | Public name and description                                               |
| `startsAtLocal`, `endsAtLocal`, `timeZone` | Parsed in the supplied timezone into `date`, `ends_at`; timezone stored as `event_timezone`                | Event schedule and editor restoration                                     |
| `startsAt`, `endsAt`                       | Fallback date inputs if local datetime strings are absent                                                  | Compatibility with serialized date values                                 |
| `eventType`, `recurrence`                  | `event_type`, JSON `recurrence_data`                                                                       | One-time or recurring configuration                                       |
| `format`, `meetingLink`                    | `event_format`, `meeting_link`                                                                             | In-person, online or hybrid event                                         |
| `venue`                                    | Resolve or create `event_addresses`; store `address_id`                                                    | Public venue                                                              |
| `category`                                 | Case-insensitive lookup of an existing category name; store `category_id`                                  | Classification; does not automatically create a category                  |
| `organiser`                                | Resolve or create `organizers`; store `organizer_id`                                                       | Public organiser identity                                                 |
| `organiserWebsite`, `tags`                 | `organiser_website`, `tags`                                                                                | Public metadata                                                           |
| `coverImage`                               | Decode supported image Data URL to public storage, or retain HTTP(S) URL; `main_image` and cover media row | Event cover                                                               |
| `secondaryImages[]`                        | Ordered gallery media; first secondary image also supplies `banner_url`                                    | Event gallery and banner compatibility                                    |
| `ticketMode`                               | `ticket_mode`                                                                                              | Free or paid configuration                                                |
| `freeCapacity`                             | `total_tickets` for a free event                                                                           | Intended registration capacity                                            |
| `tickets[]`                                | `ticket_types` relation; event minimum price and total admission capacity also calculated                  | Paid ticket products                                                      |
| `attendeeFields[]`                         | JSON `attendee_fields`                                                                                     | Registration question configuration                                       |
| `extraDetails[]`                           | JSON `extra_details`                                                                                       | Parking, dress, what to bring, agenda, speakers, food, transport and FAQs |
| Session user                               | `created_by`, preserved on edits                                                                           | Event ownership and seller identity                                       |
| New draft default                          | `status = draft`                                                                                           | Publishing state                                                          |

The builder omits UI-only `coverGradient`, `urlImages`, field help and detail icons. Numeric blank values have specific conversions: ticket `units` becomes 0; `peoplePerUnit` and `maxPerPerson` become 1; `freeCapacity` becomes null. A browser-generated ticket ID is a temporary key until the server assigns or matches a real ticket-type ID.

## UC03 Configure event dates and recurrence

Event time utilities live in [eventDateTime.js](../src/utils/eventDateTime.js); recurrence calculation lives in [recurrenceSchedule.js](../src/utils/recurrenceSchedule.js). The date picker components enforce the UI's minimum and maximum datetime constraints.

The event timezone comes from the venue selection, then the application default. The application default uses `VITE_APP_TIMEZONE`, the browser timezone or UTC. The supplied Nigerian venue suggestions use `Africa/Lagos`; a free-typed venue has no connected timezone lookup service.

The frontend requires an end after the start and normally a start at least 30 minutes ahead. For an unchanged existing start in edit mode, the lead-time check is relaxed. One-time events can span multiple days.

Recurring events keep one first start/end pair and a rule:

- Daily, weekly or monthly frequency.
- Weekly day numbers, with 0 representing Sunday.
- Monthly day-of-month or nth-weekday pattern.
- Series end date or number of occurrences.

The frontend derives previews and checks overlap. Monthly day-of-month values clamp to the final day of shorter months; a missing fifth weekday is skipped. These preview dates are not saved as occurrence records.

Laravel stores `recurrence_data` without materialising individual occurrences. There is no current occurrence table, occurrence-specific inventory, occurrence selection at checkout or per-occurrence check-in flow. A recurring event is presently one event record with recurrence configuration.

Server publishing checks recurrence frequency and the presence of an end rule, but does not reproduce the frontend's complete lead-time, overlap and recurrence validation. Active-event edits add some start/end ordering validation. Treat the saved rule, the frontend preview and a fully enforced recurring booking system as different levels of implementation.

## UC04 Add public event content and media

The creation form collects a cover, gallery, description, organiser name and website, tags and optional extra detail blocks. File inputs become Data URLs in the browser and are sent inside JSON. This is an implemented media upload path through event saving, even though there is no separate media-upload endpoint.

Laravel accepts supported base64 image formats and HTTP(S) image URLs. It writes uploads to the public storage disk, stores URLs and rebuilds the event's media rows on save. The service does not include a general cleanup lifecycle for old stored image files.

The optional `event_public_profiles` row adds summary and caption content, organiser biography and image, guests, schedule, moments, FAQs, crew and related event IDs. It is returned in `data.public_profile` by `GET /api/events/{id}`.

These richer profile fields are not new fields in the current wizard. There is no dedicated public-profile editing API in the inspected routes. They can be maintained directly in the database as described in [event-public-profile-data.md](event-public-profile-data.md).

Examples of current public person relationships are:

```json
{
  "guests": [
    {
      "id": "guest-key",
      "name": "Guest name",
      "role": "Host",
      "bio": "Public biography",
      "image": "https://example.com/guest.jpg",
      "events": [{ "id": 123, "title": "Event title" }]
    }
  ],
  "crew": [{ "name": "Crew member", "role": "Producer" }],
  "related_event_ids": [123, 456]
}
```

These are content shapes, not seeded people or account assignments. Guest-to-event lists are embedded JSON content, rather than a normalised person-to-event membership table. Related event IDs are resolved to other active events by the public event controller.

The [public profile normalizer](../src/utils/eventProfile.js) accepts older and newer field names. It combines database profile content, event relations and extra details. Speaker and agenda text can become public guests and schedule rows when structured profile content is absent. Existing FAQ records and gallery media remain usable.

The frontend repository also contains staged Laravel model, migration and test files in `backend/laravel-event-profile/`. Matching files exist in the sibling backend. [scripts/apply-event-profile-backend.py](../scripts/apply-event-profile-backend.py) copies that staged source and patches backend integration; it is an installation utility, not a runtime service or proof that a migration has run.

## UC05 Configure ticket types and capacity

Paid ticket configuration includes `id`, `name`, `unitType`, `color`, `price`, `units`, `peoplePerUnit`, `maxPerPerson`, `visible`, `perks`, `salesStart` and `salesEnd`, with local datetime strings also included for sale windows.

The backend stores these as ticket-type records. Matching IDs are updated only within the selected event's existing ticket types. Removed types are hidden when they have old purchase or current order-item history; otherwise they can be deleted. This preserves commercial references.

Ticket product units and people are different counts. For a table ticket with 5 people per unit:

- Buying 2 tables means 2 sold product units.
- It covers 10 admissions.
- The payment finalizer issues 2 QR tickets, each with `admit_count = 5`.

`events.total_tickets` is derived as admission capacity for paid events, while a ticket type's `quantity` is product capacity. Current checkout availability is calculated from capacity minus quantities in paid orders and unexpired pending reservations. Capacity is not decremented as tickets are purchased.

The public event API uses the same inventory service to add `ticket_types[].available_quantity`. The frontend checks remaining stock, sale windows and per-person limits, while the paid quote checks the authoritative database values again.

Free events can be saved and published with capacity, but the create service does not create free admission ticket types. Paid checkout explicitly rejects free events and prices of zero or less. A complete free registration and ticket issuance flow is not connected.

Sources: [ticket model](../../kakabackend/app/Models/TicketType.php), [ticket sync](../../kakabackend/app/Services/CreateEventService.php), [inventory](../../kakabackend/app/Services/Commerce/InventoryService.php), [checkout validation](../../kakabackend/app/Services/Commerce/CheckoutService.php).

## UC06 Configure attendee questions

The wizard offers full name, email, phone, company, job title, dietary requirements, T-shirt size and discovery source. Name and email are enabled and required by default. Each saved setting contains `id`, `label`, `enabled` and `required`.

Those settings reach `events.attendee_fields`. Current checkout instead collects a fixed buyer form: first name, last name, email and phone. The initialize request requires phone even if the event's configured phone question is optional.

There is no current checkout payload for custom answers, one set of answers per attendee, a version of the question schema or a separate named holder for each admission. Saving attendee question settings therefore does not yet change the buyer form or build the organiser's attendee list.

Sources: [wizard defaults](../src/pages/CreateEvent.vue), [checkout page](../src/pages/Checkout.vue), [initialize request](../../kakabackend/app/Http/Requests/InitializeCheckoutRequest.php).

## UC07 Publish an event

The Publish event action validates frontend steps 1–3, saves the latest draft and then posts `/api/create-event/{id}/publish`. The success view appears only after the publish request succeeds.

The backend checks ownership and requires a draft. It checks the title, start, category, cover, required venue or meeting link, paid ticket names and nonnegative prices, and the presence of key recurrence settings. It then changes `status` to `active`. A second publish request for a non-draft returns a validation response.

The status used in the database is `active`; some example data and presentation code use `published`. The dashboard also computes a phase such as draft, upcoming, live or ended from event status and times. A computed ended phase does not itself change the database status or create a cancellation record.

Publishing currently has these boundaries:

- It does not create a team membership or change the account's role.
- It does not register attendees, create an order or issue tickets.
- It does not generate recurrence occurrences.
- It does not enforce every frontend schedule and sales-window rule on the server.

The generic public `EventController::index()` and `show()` do not themselves restrict their main event query to active events. Publication must not be described as a fully enforced visibility boundary in this implementation. The tracking controller ignores non-active events and paid checkout requires active events, which are separate checks.

## UC08 Edit an existing event

`/events/:id/edit` reuses the current creation component. It fetches `/api/create-event/{id}` and expects `data: { id, status, form }`. Laravel rebuilds the form from the event, organiser, address, category, media and ticket types. The frontend restores local datetimes, recurrence, fields and detail blocks.

Only the owning account can use the current editor. Laravel accepts draft and active events, preserves the original creator and current status, and validates active-event content more strictly before saving. The frontend's edit action saves changes with PATCH; it does not run the new-event publish sequence.

The current workspace Settings details form also loads the editor payload, then sends a partial PATCH for title, description, venue, local start and timezone. The controller merges that request with the existing editor payload. Other settings sections are not all connected; ticket editing is available through the full editor route.

Older `DashboardEditContent.vue` and its four step components are outside the current application import graph. Their presence does not mean that this older embedded editor is active.

## UC09 Browse and open public events

The current discovery screen is `FindEvents.vue`. Routes include `/find-events`, `/search` and the category routes. [publicCatalog.js](../src/services/publicCatalog.js) reads categories and events from Laravel using `VITE_API_URL` or `/api`.

Numeric category filters use the backend's `category_id`. Text search, city and named category filtering load all matching pages and filter in the browser, because the inspected backend listing handler does not implement those search and city parameters. Current listing pagination uses `per_page`, while some older service calls still send `limit` or `category`.

Public event pages use `/events/:id-:slug`; `/event/:id` is a retained entry route. The ID selects the event; the readable slug is generated from the title for navigation. Event details and ticket selection read through `eventService.getEventById()`, then `normalizeEventProfile()` adapts the payload for display.

There are three distinct data sources:

| Source                  | Current use                                                                       | Boundary                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Laravel event records   | Discovery, real event profiles and server ticket IDs                              | Authoritative for paid checkout                                                                                  |
| `staticEventCatalog.js` | Hardcoded events 900001 and 900002, their rich profiles and related-event content | `getEventById()` checks these IDs before the API, including in production builds; their checkout is display-only |
| `public/events.json`    | Bundled fallback for some older `eventService` list and featured reads            | Sample data; current `publicCatalog` discovery does not use it as a fallback                                     |

The current `HomePage.vue` is a marketing landing page linking to discovery and organiser tools. Older notes describing two static event cards at the top of the homepage do not match this component. Static events remain directly addressable and can appear as related content on public profiles.

`eventService` also retains category fallback requests to `http://localhost/api/test-search.php`. This is an older alternative path, not the central proxy configuration.

Sources: [router](../src/router/index.js), [discovery](../src/pages/FindEvents.vue), [event service](../src/services/eventService.js), [event details](../src/pages/EventDetails.vue), [static catalog](../src/services/staticEventCatalog.js), [backend event controller](../../kakabackend/app/Http/Controllers/Api/EventController.php).

## UC10 Save follow and revisit events or people

Real event favourites use the event store's `toggleLike()` and `checkLiked()` calls. Matching authenticated Laravel routes write or read `event_likes`. These store methods use a hardcoded `http://127.0.0.1:8000` origin with credentials, instead of the central same-origin Axios client. That connection can behave differently from draft and checkout requests when deployed.

On static event profiles, saving an event only toggles component state. Following an organiser or public guest stores `rushhour-profile-follows` in localStorage using an event-and-name key. It works on that device; there is no follow API or account-scoped follow relation.

The backend recommendation engine still uses the older `event_views`, `event_likes` and `purchases` tables to build liked-event, revisit and personalised recommendations. The current public profile sends visit tracking to `EventTrackingController`, which writes `event_traffic_views`. The older `EventController::trackView()` method is not the handler registered for that route.

The analytics migration includes a one-time copy of historical `event_views` into the newer traffic table. It does not establish ongoing two-way synchronisation. Current commerce writes orders and tickets, rather than creating legacy `Purchase` rows. Recommendation routes exist, but the current homepage and discovery components do not request them. Recommendations therefore remain a separate older feature with input gaps relative to current traffic and commerce.

The `/api/user/liked-events` route exists outside the explicit authenticated route group. Its controller expects a user and should not be assumed to offer a complete anonymous-safe saved-events experience.

Sources: [event store](../src/stores/events.js), [profile interactions](../src/pages/EventDetails.vue), [recommendation engine](../../kakabackend/app/Services/RecommendationEngine.php), [analytics migration](../../kakabackend/database/migrations/2026_09_23_120000_create_dashboard_analytics_foundation.php).

## UC11 Select tickets and build a cart

The event profile opens `/events/:id-:slug/tickets`. `EventTickets.vue` loads the same event and renders `EventTicketSelection.vue`. The selection uses ticket IDs, quantities, visibility, sale windows, remaining stock and product limits.

`commitEventSelection()` validates the selection and replaces any earlier cart selection for that event. Other events remain in the cart. It saves display snapshots such as title, date, venue, cover, ticket name and price alongside event and ticket IDs.

The cart store persists `cartItems` in sessionStorage. Adding, removing or changing quantities invalidates the current checkout attempt token. Display totals are browser estimates; the server quote determines the payable amount.

The selection flow routes to `/checkout?event={id}`. Checkout then includes only that event's items. A cart checkout without that query can include multiple events; Laravel supports a multi-event order and separate seller allocations.

Static event selections can reach the same checkout screen and a local quote. Payment is blocked before initialization for an all-static checkout. This prevents the static catalog's synthetic ticket IDs from being submitted through that route as real payment items. A mixed cart is not treated as all-static; the server remains responsible for validating every supplied ID.

Sources: [ticket selection page](../src/pages/EventTickets.vue), [selection commit](../src/utils/eventSelection.js), [cart store](../src/stores/cart.js), [checkout](../src/pages/Checkout.vue).

## UC12 Quote and initialise a paid order

The current checkout sends product IDs and quantities to the server. It does not ask the backend to trust browser prices, event titles or seller IDs.

Quote payload:

```json
{
  "items": [{ "ticket_type_id": 123, "quantity": 2 }]
}
```

Initialise payload:

```json
{
  "checkout_token": "client-generated UUID",
  "visitor_id": "browser visitor UUID",
  "customer": {
    "first_name": "Buyer",
    "last_name": "Name",
    "email": "buyer@example.com",
    "phone": "buyer phone"
  },
  "items": [{ "ticket_type_id": 123, "quantity": 2 }]
}
```

The server allows 1–25 distinct ticket types, with request quantities from 1–20, subject to inventory and per-person limits. It requires an active paid event, a visible ticket type, an event owner, an open sales window and a positive server price. The quote returns currency, totals in minor units and canonical line details.

Initialisation uses a hashed checkout token and a fingerprint of the normalised cart and customer to make retries consistent. Reusing the same token with a different cart or buyer is rejected. It locks affected ticket types while it checks capacity and writes the order, order items, allocations and payment record. Paystack initialization happens after that database transaction.

The order stores buyer contact details even when the buyer has no account. If authenticated, `orders.user_id` also points to the buyer. Seller user IDs come from each event's `created_by`; they are not supplied by the browser.

An order in `pending_payment` holds inventory until `expires_at`, using a configurable reservation period. A failed payment can create another payment attempt for the same unexpired order. An expired order requires a new checkout attempt token.

Sources: [frontend checkout service](../src/services/checkoutService.js), [request validation](../../kakabackend/app/Http/Requests/InitializeCheckoutRequest.php), [checkout service](../../kakabackend/app/Services/Commerce/CheckoutService.php), [commerce migration](../../kakabackend/database/migrations/2026_09_21_010000_create_commerce_foundation_tables.php).

## UC13 Verify payment and issue tickets

The frontend resumes Paystack Popup V2 with the access code returned by the backend. While payment is pending, it polls the order every 2.5 seconds for up to 10 minutes. This polling limit is separate from the reservation duration. A Check payment action can explicitly request verification.

Both browser verification and the Paystack webhook reach `PaymentFinalizer`. The webhook validates its signature and asks Paystack to verify the reference before finalising. The finalizer checks successful provider status, reference, amount and currency against the stored payment.

On a valid success, the backend marks the payment successful and order paid, then issues one ticket per purchased product unit. Tickets have a public ID, encrypted raw token, token hash, event ID, ticket-type ID, admission count and valid status. Duplicate verification does not issue another set of tickets.

A mismatched amount, currency or reference puts the payment and unpaid order into review. A second successful payment for an already-paid order is reviewed without issuing extra tickets. If payment happened after the reservation expired, the finalizer checks available inventory again under locks. If it cannot fulfil the order, it uses payment review rather than issuing tickets. A payment made before expiry can still be honoured when verification arrives later.

Current order states are `pending_payment`, `paid`, `payment_failed`, `expired`, `payment_review`, `cancelled` and `refunded`. Current payment states are `created`, `initialized`, `success`, `failed` and `review`. State constants for cancelled and refunded do not establish implemented cancellation or refund actions.

Sources: [checkout page](../src/pages/Checkout.vue), [Paystack loader](../src/utils/paystack.js), [Paystack service](../../kakabackend/app/Services/Commerce/PaystackService.php), [webhook controller](../../kakabackend/app/Http/Controllers/Api/PaystackWebhookController.php), [payment finalizer](../../kakabackend/app/Services/Commerce/PaymentFinalizer.php).

## UC14 View an order and its QR tickets

`/payment-success/:orderId` reads the server order. If the callback has a payment reference it tries verification first. The page displays paid tickets only for a paid order and displays a separate payment-review state when needed.

Access requires either the signed-in buyer account matching `orders.user_id` or the original guest checkout token supplied in `X-Checkout-Token`. Knowing a public order ID alone is insufficient.

The frontend stores the attempt token and order-specific tokens in sessionStorage. Guests depend on that browser session retaining their token. The QR value shown by `PaymentSuccess.vue` is the server-issued ticket token.

The current paid ticket model does not store attendee name or email per ticket. Buyer details live on the order, and a table ticket can cover several people. This is why paid orders cannot yet directly supply the named attendee preview model without an explicit mapping and data extension.

`TransactionHistory.vue` is still a routed mock transaction list. The public controls' My tickets link currently points to `/trolio`, whose implementation is a trading journal with browser notes. It is not connected to issued event tickets. The paid order page is the implemented ticket-viewing destination.

Sources: [payment result page](../src/pages/PaymentSuccess.vue), [checkout storage](../src/utils/checkoutStorage.js), [order authorization](../../kakabackend/app/Services/Commerce/CheckoutService.php), [transaction page](../src/pages/TransactionHistory.vue), [public controls](../src/components/EventPublicControls.vue), [Trolio](../src/pages/Trolio.vue).

## UC15 Open the organiser workspace and report sales

`Dashboard.vue` now renders `EventWorkspace.vue`, with `WorkspaceOverview.vue` and the other `event-workspace` components. It does not render the older `DashboardManageContent.vue` component family.

The selected event ID is in `/dashboard/events/:eventId`. Workspace destinations are in `?view=...`, with additional query fields for filters and details. `/dashboard?view=events` opens the organiser's events list. An unknown event ID is normalised to the first owned event from the returned list.

Current view keys are `events`, `overview`, `event-page`, `attendees`, `purchase`, `share`, `promo`, `email`, `checkin`, `payout` and `settings`. The visible event navigation includes Overview, Attendees, Promotion and discounts, Message attendees, Door check-in, My earnings and Settings. The event-page view is an internal preview and does not initiate paid checkout.

Outside preview, the dashboard service requests the account's events and an event overview. Laravel filters the list by `created_by` and checks ownership again for event-specific reads. The overview includes event identity, ticket product capacity, sold and reserved units, available units, admission counts, revenue, traffic, buyer counts, trends and sharing-source performance.

Current analytics use paid orders and order items, rather than the older purchases table. Buyer counts, sold units and admission counts are different measures. One buyer may place multiple orders, one order may buy multiple units, and a table unit may admit several people. The analytics service has a distinct-email buyer count.

The Pinia store caches the event list in memory and overview results per event with a 30-second freshness check when requested. There is no dashboard polling or socket subscription. Refresh and navigation can fetch again; the TTL is not an automatic update interval.

### Development preview changes the data source

`dashboardPreview.js` currently exports `DASHBOARD_PREVIEW = import.meta.env.DEV && true`. In development, dashboard reads return a synthetic event with ID 900001 and a fixed overview. Sharing-link reads and writes also switch to browser preview storage. Authentication for protected routes still runs.

In a production build this flag is false. That enables the real dashboard reads, but does not create missing attendee, check-in, discount or bank APIs. These screens have separate connection limits.

The preview event ID 900001 also exists in the static public catalog. This is a shared number across separate sample systems, not a guaranteed Laravel record. The event editor still targets the real editor API, so choosing Edit for that synthetic ID is not a preview-only editing operation.

Sources: [dashboard page](../src/pages/Dashboard.vue), [workspace shell](../src/components/event-workspace/EventWorkspace.vue), [dashboard store](../src/stores/dashboard.js), [dashboard service](../src/services/dashboardService.js), [preview configuration](../src/services/dashboardPreview.js), [analytics service](../../kakabackend/app/Services/Dashboard/DashboardAnalyticsService.php).

## UC16 Share events and attribute sales

Promotion has a connected sharing-link path and a separate preview discount path. Sharing links use source codes on the public event URL, such as `?src=wa`. Built-in backend codes include `wa`, `ig`, `direct`, `x`, `fb`, `in` and `email`; custom links receive server-generated codes.

For real event pages, `trackEventView()` sends a browser visitor UUID and optional valid source code to `/api/events/{id}/track-view`. The backend hashes visitor identity and deduplicates views by event, visitor hash and hour. A known signed-in user can also be attached. Non-active events do not create tracking rows through this handler.

Checkout sends the visitor UUID. The server finds the latest tagged visit for each event in the last 30 days and snapshots its `source_code` and traffic-view ID on the order item. Paid orders then feed source views, buyers, product units and revenue in the dashboard. This is a commercial attribution relationship, not a public guest or event ownership relationship.

Copying a link uses the clipboard; sharing uses browser or platform destinations. These actions do not prove a post was published or a sale happened. A source recorded on an order is the server's attribution of a tracked visit, not proof of the buyer's identity on that social platform.

Development links are stored under an event-specific sharing-links key. They are not backend records, and a preview source code is not guaranteed to exist for a real event.

Sources: [sharing service](../src/services/dashboardShareService.js), [promotion screen](../src/components/event-workspace/WorkspacePromote.vue), [view service](../src/services/eventViewService.js), [tracking controller](../../kakabackend/app/Http/Controllers/Api/EventTrackingController.php), [attribution service](../../kakabackend/app/Services/Dashboard/EventAttributionService.php).

## UC17 Manage attendees and purchase details

`WorkspaceAttendees.vue` uses `useWorkspaceAttendees(eventId, ticketMode)` from `attendeesModel.js`. The model keeps event-specific reactive state and, in development preview, seeds `referenceGuests` and example purchases. Sample order groups link a buyer snapshot to guest ticket IDs.

The UI provides purchase and ticket views, search and filters, purchase details, guest cards, name and email edits, browser CSV export, receipt printing, buyer photos, arrival-alert preferences and movement history.

These functions share local data with Door check-in and parts of Earnings. Editing a guest does not rewrite the sample buyer's checkout snapshot. Entry and exit history is linked by the guest ticket ID. Photos are keyed by sample order ID; alert preferences are keyed by guest ID.

Outside preview the model currently starts with empty guests and orders. There is no attendee fetch from current commerce orders. Guest updates and movement changes return an unavailable result instead of saving to Laravel. Some convenience helpers, such as buyer photo storage, can still save browser-local state; that does not make them backend attendee records.

Resend ticket reports that email is not connected. Arrival alert preferences do not send emails. Browser exports and printed receipts represent the loaded model, which is sample data in preview, rather than a canonical server attendee export.

Sources: [attendees model](../src/components/event-workspace/attendeesModel.js), [sample guests](../src/components/event-workspace/referenceGuests.js), [attendee screen](../src/components/event-workspace/WorkspaceAttendees.vue), [guest card](../src/components/event-workspace/WorkspaceGuestCard.vue).

## UC18 Manage entrances and door check-in

`WorkspaceDoorCheckin.vue` reuses the attendee model. It adds entrance configuration, staff contacts, movement filtering, guest lookup, scanning and printing entrance QR codes.

Preview entrance records contain an ID, name, contact list and aliases. Renaming retains previous names as aliases so historical movement can still be associated with the entrance. The contacts contain names, emails and optional phone numbers. Saving contacts does not send invitations or create staff permissions.

Movement records contain the guest ticket ID, `kind` of `in` or `out`, timestamp and entrance name. The model prevents entering someone who is already inside or recording an exit before an entry. From these rows it derives ever arrived, inside now and sessions of entry followed by exit.

The support component can use the device camera and `BarcodeDetector` where available, but matches the result against the loaded guest model. A generated entrance QR code opens a workspace entrance URL. These are separate from the opaque tokens issued by Laravel paid tickets.

The live connection is missing between server-issued ticket tokens, event ownership or staff permission, validation, entry limits and a persistent check-in record. There is no server check-in API or multi-device entry synchronisation in the inspected backend.

Sources: [door screen](../src/components/event-workspace/WorkspaceDoorCheckin.vue), [camera and QR support](../src/components/event-workspace/WorkspaceSupport.vue), [shared movement model](../src/components/event-workspace/attendeesModel.js).

## UC19 Create and apply discounts

Promotion and discounts share `WorkspacePromote.vue`, `promotionModel.js` and browser code state passed from `WorkspaceViews.vue`. Offer configuration includes name, partner, code, percentage or fixed value, usage limit, start/end dates, eligible ticket types, used count and active state.

Frontend validation checks code format and uniqueness in the loaded list, amount, usage bounds, dates and ticket selection. Status is derived as paused, scheduled, expired, used up or available. In preview, creating, editing, pausing and resuming offers persists event-scoped browser data.

Outside preview the screen reports that discount saving and changes are not connected. The current checkout request has no promo code and the backend quote sets `discount_minor = 0`. There is no redemption, usage-limit enforcement or partner commission integration. Sample discount revenue in Earnings comes from fixed example purchase snapshots.

Sources: [promotion screen](../src/components/event-workspace/WorkspacePromote.vue), [offer model](../src/components/event-workspace/promotionModel.js), [workspace state](../src/components/event-workspace/WorkspaceViews.vue), [checkout quote](../../kakabackend/app/Services/Commerce/CheckoutService.php).

## UC20 Message attendees and manage notifications

The current message composer lets the organiser prepare an audience label, subject and body and save drafts to event-scoped localStorage. There is no connected attendee message sending route, recipient resolution, delivery log or scheduled delivery workflow.

`WorkspaceNotifications.vue` derives setup tasks from the event stage and available `overview.setup` values. It can render supplied `overview.notifications`, and remembers read and dismissed states in sessionStorage. The current Laravel overview does not supply those setup and notification fields; development fixtures can supply them. A setup card's presence does not establish a two-factor, reminder or payout backend feature.

These workspace messages are separate from authentication password-reset mail, which has its own backend controller. Event ticket resend and arrival alerts remain unconnected even if account recovery mail is configured.

Sources: [message composer and draft handling](../src/components/event-workspace/WorkspaceViews.vue), [notifications](../src/components/event-workspace/WorkspaceNotifications.vue), [password reset controller](../../kakabackend/app/Http/Controllers/Api/PasswordResetController.php).

## UC21 Review earnings and receive payouts

The earnings screen reuses the overview, sharing links, preview offers and attendee model. Outside preview, top-level sales, ticket-type and some source figures can come from the server overview. Detailed discount combinations and named buyer drilldowns lack the corresponding backend data; `earningsModel.js` returns empty rows or unknown values instead of live commercial detail.

In preview, original price and discount snapshots generate the detailed earnings examples. Editing a preview offer does not rewrite those historical examples. The bank form in `WorkspaceEarningsPayouts.vue` is an in-memory example and refuses live setup when preview is off.

Laravel commerce does have a settlement foundation:

1. Order items identify the seller account using the event owner at checkout.
2. The checkout service groups each order's lines by seller.
3. Each allocation records gross amount, platform fee and seller net in minor units.
4. An active payout account can attach a Paystack subaccount to the allocation.
5. Dynamic splits are used only when enabled and all relevant positive seller allocations have provider subaccount codes. Otherwise settlement mode is platform held.

This foundation does not mean the organiser bank form creates a real payout account. There are no matching current routes for bank verification, seller onboarding, payout requests, settlement reconciliation or a complete payout history screen. Allocation records begin with pending settlement status. Revenue totals are not confirmation of a bank settlement.

Free-mode navigation hides My earnings and redirects direct payout or promo views to Attendees. Promotion remains partly available; a free event is not a paid commerce event.

Sources: [earnings screen](../src/components/event-workspace/WorkspaceEarnings.vue), [earnings model](../src/components/event-workspace/earningsModel.js), [bank form](../src/components/event-workspace/WorkspaceEarningsPayouts.vue), [allocations](../../kakabackend/app/Services/Commerce/CheckoutService.php), [split service](../../kakabackend/app/Services/Commerce/PaystackSplitService.php), [commerce config](../../kakabackend/config/commerce.php).

## UC22 Manage access roles and event administration

The current working permission is owner access to a specific event. The draft controller compares `created_by` with the authenticated account; dashboard event list, overview and share-link handlers use the same ownership concept.

Settings has details, tickets, checkout, payments and access sections. Details can save through the editor API outside preview. Other section forms can preserve preview values or report an unavailable action. Checkout settings display a purchase limit, buyer-only or every-guest collection, phone requirements and a ticket message. Access settings display public or link-only visibility, refund preferences and transfer permission. Those preview settings do not change the current checkout request, public event query, refund processing or ticket ownership.

There are no current routes for team invitations, event role assignments, account password changes or two-factor enrolment. The notification prompt to review account security is not a completed security settings workflow.

The older generic `/api/events` CRUD path uses a different payload: category IDs, nested organiser and location data, uploaded image files, `ticket_types`, subcategories, FAQs and event options. It has admin/agent checks and should not be confused with `/api/create-event` and its JSON wizard contract. Its `hasAnyRole()` dependency is not integrated into the inspected `User` model.

The routed frontend Admin page loads the event store, a browser-based purchase store and local report calculations. It is not the current owner workspace or a complete backend administration console. Its USD formatting also differs from current NGN commerce.

Sources: [workspace settings](../src/components/event-workspace/WorkspaceViews.vue), [Admin page](../src/pages/Admin.vue), [generic event controller](../../kakabackend/app/Http/Controllers/Api/EventController.php), [permission configuration](../../kakabackend/config/permission.php), [permission migration](../../kakabackend/database/migrations/2025_04_24_045144_create_permission_tables.php).

## UC23 Delete cancel refund or finish an event

The backend generic event controller has a delete action and rejects deleting an event with `OrderItem` history. Commerce foreign keys also restrict deletion of referenced events and ticket types. The role-check integration described above affects this older route.

The older frontend event service still targets PHP-style CRUD URLs, so it is not a matching current UI client for the Laravel REST delete route. There is no complete current organiser flow for cancellation, attendee notification, refund execution or settlement adjustment.

The order model names cancelled and refunded states, but current routes do not expose a workflow to reach them. The older browser `purchaseService.cancelPurchase()` changes local purchase data and attempts an older inventory update; it is not a Paystack refund or current order cancellation.

The dashboard's ended or completed presentation is derived from event times. Paid checkout validates active status, paid mode, visibility, sale windows, ownership and stock, but its inspected quote logic does not separately enforce the event's end time. A correct sales-close window is therefore material to current booking behaviour.

Sources: [delete handler](../../kakabackend/app/Http/Controllers/Api/EventController.php), [commerce migration](../../kakabackend/database/migrations/2026_09_21_010000_create_commerce_foundation_tables.php), [older purchase service](../src/services/purchaseService.js), [checkout service](../../kakabackend/app/Services/Commerce/CheckoutService.php).

## API map by use case

All paths in this table include the `/api` prefix. The frontend's central CSRF helper separately requests `/sanctum/csrf-cookie` before authenticated mutations and checkout initialization or verification.

| Use case   | Method and path                                                     | Access and current connection                                                        |
| ---------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| UC01       | `POST /api/login`, `POST /api/register`                             | Current session authentication                                                       |
| UC01       | `GET /api/user`, `POST /api/logout`                                 | Authenticated user or logout                                                         |
| UC01       | `POST /api/forgot-password`, `POST /api/reset-password`             | Recovery handlers with throttling                                                    |
| UC01       | `GET /api/auth/google`, `GET /api/auth/google/callback`             | Backend Google OAuth flow                                                            |
| UC02       | `POST /api/create-event`                                            | Authenticated; saves new draft                                                       |
| UC02, UC08 | `PATCH /api/create-event/{id}`                                      | Owner; updates draft or active event                                                 |
| UC08       | `GET /api/create-event/{id}`                                        | Owner; editor form restoration                                                       |
| UC07       | `POST /api/create-event/{id}/publish`                               | Owner; draft to active                                                               |
| UC09       | `GET /api/events`, `GET /api/events/{event}`                        | Public listing and detail                                                            |
| UC09       | `GET /api/categories`, `GET /api/subcategories`                     | Public classification reads                                                          |
| UC10       | `POST /api/events/{event}/toggle-like`                              | Authenticated favourite toggle                                                       |
| UC10       | `GET /api/events/{event}/check-liked`                               | Authenticated favourite status                                                       |
| UC10       | `GET /api/user/liked-events`                                        | Older saved-event list; handler expects a user, route lacks explicit auth middleware |
| UC10       | `GET /api/recommendations`, `POST /api/recommendations/clear-cache` | Authenticated backend feature; not called by current discovery                       |
| UC12       | `POST /api/checkout/quote`                                          | Public quote using server ticket data                                                |
| UC12       | `POST /api/checkout/initialize`                                     | Guest or signed-in buyer; fixed buyer form and checkout UUID                         |
| UC13       | `POST /api/checkout/payments/{reference}/verify`                    | Buyer account or `X-Checkout-Token`                                                  |
| UC13       | `POST /api/payments/paystack/webhook`                               | Provider signature and server verification                                           |
| UC14       | `GET /api/checkout/orders/{publicId}`                               | Buyer account or `X-Checkout-Token`                                                  |
| UC15       | `GET /api/dashboard/events`                                         | Authenticated owned-event list; preview replaces it in development                   |
| UC15       | `GET /api/dashboard/events/{event}/overview`                        | Owner; preview replaces it in development                                            |
| UC16       | `POST /api/events/{event}/track-view`                               | Public visitor tracking; no privileged mutation; throttled and deduplicated          |
| UC16       | `GET /api/dashboard/events/{event}/share-links`                     | Owner; preview replaces it in development                                            |
| UC16       | `POST /api/dashboard/events/{event}/share-links`                    | Owner; preview writes browser state in development                                   |
| UC22       | `POST /api/events`, `PUT /api/events/{event}`                       | Older generic CRUD contract with incomplete role integration                         |
| UC23       | `DELETE /api/events/{event}`                                        | Older generic delete with history guard and incomplete role integration              |

There are no matching current routes for event attendee answers, attendee lists and edits, check-in, entrance staff, team invitations, discount redemption, attendee message delivery, public follows or bank onboarding. The frontend account update call to `PUT /api/user` also has no matching registered route.

Canonical route source: [kakabackend/routes/api.php](../../kakabackend/routes/api.php). The legacy standalone PHP endpoints below have different contracts and are not substitutes for these routes.

## Configuration and browser persistence

### Current and older network configurations

| File or setting                                       | Use cases                                                  | Configuration in source                                                                                                  |
| ----------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `src/api/axios.js`                                    | Authentication, creation, dashboard, tracking and checkout | Relative `/api`, cookies and XSRF token support                                                                          |
| `vite.config.js`                                      | Local frontend and API connection                          | Development port 5174; `/api` and `/sanctum` proxy to `http://127.0.0.1:8000`; development base `/`, build base `/kaka/` |
| `src/services/publicCatalog.js`                       | Discovery                                                  | `VITE_API_URL` or `/api`; separate public Axios client                                                                   |
| `src/services/eventService.js`                        | Event details and older list/store actions                 | `VITE_API_URL` or `http://127.0.0.1:8000/api`, then `/events`; older category fallback to localhost PHP                  |
| `src/stores/events.js`                                | Likes and older recommendation-related reads               | Some requests hardcode backend origin `http://127.0.0.1:8000`                                                            |
| `src/services/dashboardPreview.js`                    | Workspace development                                      | Preview on when `import.meta.env.DEV` is true                                                                            |
| `VITE_APP_TIMEZONE`                                   | Event schedule default                                     | Browser timezone and UTC fallbacks; Nigerian suggestions use Africa/Lagos                                                |
| `src/api/paymentService.js`                           | Unlinked older payment API helper                          | `VITE_API_URL` or placeholder domain; `/api/verify-payment` and `/api/orders`, which are not current checkout routes     |
| `src/utils/paymentService.js`                         | Unlinked older standalone PHP verification                 | `VITE_BACKEND_URL` or placeholder localhost path; `verify-payment.php`                                                   |
| Backend `config/commerce.php`                         | Paid commerce                                              | NGN default currency, 20-minute default reservation, 0 default fee basis points, dynamic splits disabled by default      |
| Backend `config/services.php`                         | Paystack and Google                                        | Provider configuration; secrets stay outside this reference                                                              |
| Backend auth, session, Sanctum and CORS configuration | Account and credentialed requests                          | Must agree with the serving frontend origin; source defaults are not proof of deployed values                            |

The older `eventService` uses a separate Axios instance for PHP-style mutations, while some public reads use raw Axios. Its generated local `csrf_token` and optional bearer token do not replace the central Sanctum session flow. The current wizard never calls that service's older `createEvent()` method.

Production also needs an API serving arrangement for relative `/api` and `/sanctum` requests. The Vite proxy is a development setting; the GitHub Pages deployment script does not itself host Laravel or standalone PHP.

### Browser storage by use case

| Storage          | Key or family                            | Purpose and authority                                                                                                                                            |
| ---------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| localStorage     | `user`, `authProvider`                   | Account display snapshot; server session remains authoritative                                                                                                   |
| localStorage     | `kaka-create-event-draft`                | Older exported local draft helper; not the current wizard save path                                                                                              |
| localStorage     | `kaka-create-preview`, theme preferences | UI preferences                                                                                                                                                   |
| localStorage     | `event_cache_*`                          | Older service response cache, five-minute expiry                                                                                                                 |
| localStorage     | `auth_token`, `csrf_token`, `users`      | Retained demo or older service helpers; not current login proof                                                                                                  |
| localStorage     | `purchases`                              | Older local purchase and report records; not current paid orders                                                                                                 |
| localStorage     | `kakaVisitorId`                          | Browser visitor UUID for traffic and attribution                                                                                                                 |
| localStorage     | `rushhour-profile-follows`               | Device-specific follow preferences                                                                                                                               |
| localStorage     | `rushhour:event-workspace:{eventId}:*`   | Preview guests, movements, activity, alerts, photos, mode, entrances, codes, sharing links, detail settings and message drafts; not a live shared event database |
| sessionStorage   | `cartItems`                              | Current cart display snapshots and selected IDs                                                                                                                  |
| sessionStorage   | `checkoutAttemptToken`                   | Current checkout UUID; cleared when the cart changes or the attempt completes                                                                                    |
| sessionStorage   | `checkoutOrderToken:{orderId}`           | Guest access token for that order                                                                                                                                |
| sessionStorage   | `rushhour:notifications:{eventId}*`      | Notification read state and payout reminder dismissal                                                                                                            |
| Component memory | Bank preview and static favourite state  | Temporary interaction only                                                                                                                                       |
| Pinia memory     | Events and overview cache                | Loaded data within the current app session                                                                                                                       |

Browser state is not account-scoped shared data simply because an event ID appears in the key. It does not synchronise across staff devices or provide a permission boundary.

## Retained frontend implementations and backups

The following inventory distinguishes files retained in the repository from code reached by the current app. Import reachability here follows static imports and literal lazy imports from `src/main.js` and the router. CSS, assets, standalone PHP and archived bundles have different loading mechanisms.

### Current event journey files

| Files or family                                                                                                              | Use cases                         | Status and purpose                                                                |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------- |
| `src/router/index.js`, `src/App.vue`, `src/main.js`                                                                          | All                               | Current routes, application shell and bootstrapping                               |
| `src/pages/CreateEvent.vue`, `src/services/createEventService.js`                                                            | UC02–UC08                         | Current wizard, payload and editor API                                            |
| `src/utils/eventDateTime.js`, `src/utils/recurrenceSchedule.js`                                                              | UC03                              | Date rules and recurrence previews                                                |
| `DateTimePicker.vue`, `DateTimePickerInput.vue`, `DatePickerModal.vue`, `TimePickerModal.vue`, `CreateEventStepSkeleton.vue` | UC02–UC03                         | Picker and loading support; `DateTimePickerInput.vue` is the current wizard entry |
| `src/pages/FindEvents.vue`, `src/services/publicCatalog.js`, `src/components/public/`                                        | UC09                              | Current discovery, public shell and search navigation                             |
| `src/pages/HomePage.vue`                                                                                                     | UC09, UC15–UC16                   | Current marketing entry; links into actual product routes                         |
| `src/pages/EventDetails.vue`, `src/utils/eventProfile.js`, `src/utils/eventProfileNavigation.js`                             | UC04, UC09–UC10                   | Current public profile and field adaptation                                       |
| `EventCover.vue`, `EventPublicControls.vue`, `EventCard.vue`, `SeoImage.vue`                                                 | UC04, UC09                        | Event presentation and navigation helpers; cards also support editor preview      |
| `src/pages/EventTickets.vue`, `EventTicketSelection.vue`, `src/utils/eventSelection.js`                                      | UC11                              | Current ticket selection and cart commit                                          |
| `src/pages/Cart.vue`, `src/stores/cart.js`, `src/pages/Checkout.vue`                                                         | UC11–UC13                         | Current cart, quote and payment flow                                              |
| `src/pages/PaymentSuccess.vue`, `src/services/checkoutService.js`, `src/utils/checkoutStorage.js`, `src/utils/paystack.js`   | UC12–UC14                         | Order access, payment verification and QR delivery                                |
| `src/stores/events.js`, `src/services/eventService.js`                                                                       | UC09–UC10 and older admin actions | Mixed current reads and older API methods; not the current creation service       |
| `src/services/staticEventCatalog.js`, `public/events.json`                                                                   | UC09, UC11                        | Static profiles and separate bundled listing fallback                             |
| `src/stores/auth.js`, login and registration components, `GoogleCallback.vue`                                                | UC01, UC22                        | Current session identity                                                          |
| `src/services/eventViewService.js`, `src/services/dashboardShareService.js`                                                  | UC15–UC16                         | Current tracking and sharing service paths                                        |
| `src/pages/Dashboard.vue`, `src/stores/dashboard.js`, `src/services/dashboardService.js`, `src/services/dashboardPreview.js` | UC15                              | Current owner workspace entry, fetching, cache and development substitution       |

### Current workspace component family

| Files under `src/components/event-workspace/`                                                                                             | Use cases        | Responsibility                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------- |
| `EventWorkspace.vue`, `WorkspaceIcons.vue`                                                                                                | UC15, UC22       | Current shell, event navigation and account display                          |
| `WorkspaceOverview.vue`, `overviewModel.js`                                                                                               | UC15             | Overview metrics and event-stage presentation                                |
| `WorkspaceViews.vue`                                                                                                                      | UC08, UC17–UC22  | View routing, messages, settings, local drafts and shared discount state     |
| `WorkspaceAttendees.vue`, `WorkspaceGuestCard.vue`, `attendeesModel.js`, `referenceGuests.js`                                             | UC17–UC18        | Buyer and guest preview records, details, exports and shared movement state  |
| `WorkspaceDoorCheckin.vue`, `WorkspaceSupport.vue`                                                                                        | UC18             | Entrances, local movements, camera lookup, QR and printing support           |
| `WorkspacePromote.vue`, `WorkspacePlatformIcon.vue`, `WorkspaceCopyButton.vue`, `promotionModel.js`                                       | UC16, UC19       | Sharing links, copy controls and preview discount forms                      |
| `WorkspaceEarnings.vue`, `WorkspaceEarningsDetails.vue`, `WorkspaceEarningsTable.vue`, `WorkspaceEarningsPayouts.vue`, `earningsModel.js` | UC21             | Earnings views, mixed server aggregates and preview detail, sample bank form |
| `WorkspaceNotifications.vue`                                                                                                              | UC20             | Derived setup tasks and local read state                                     |
| `WorkspaceEventPreview.vue`                                                                                                               | UC04, UC11, UC15 | Internal event-page preview and local selection review                       |

`src/composables/useWorkspacePrivacy.js` masks displayed amounts. Workspace CSS lives under `src/assets/event-workspace/`; public profile styles live in `src/styles/event-profile.css` and `event-profile-reference.css`. These are presentation layers, not additional event APIs or permission models.

### Older and unlinked frontend files

| Files                                                                                                                                                                                          | Intended use case           | Current position                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/components/dashboard/DashboardManageContent.vue`                                                                                                                                          | UC15–UC22                   | Older workspace root; no current import from the routed dashboard                                     |
| `DashboardOverviewView.vue`, `DashboardInsightsView.vue`, `DashboardEventHero.vue`, `DashboardStatStrip.vue`                                                                                   | UC15                        | Children of the older workspace, not the current overview implementation                              |
| `DashboardAttendeesView.vue`, `DashboardCheckinView.vue`, `DashboardPromoView.vue`, `DashboardEmailView.vue`, `DashboardPayoutView.vue`, `DashboardSettingsView.vue`, `DashboardShareView.vue` | UC16–UC22                   | Older view components reached only through the unlinked workspace family                              |
| `DashboardSidebar.vue`, `DashboardTopbar.vue`, `DashboardContentSkeleton.vue`                                                                                                                  | UC15                        | Older shell and loading components, unlinked from the current entry graph                             |
| `DashboardEditContent.vue`, `DashboardEditBasicsStep.vue`, `DashboardEditDetailsStep.vue`, `DashboardEditTicketsStep.vue`, `DashboardEditAttendeesStep.vue`                                    | UC08                        | Older embedded editor family; current editing uses `CreateEvent.vue`                                  |
| `src/pages/CategoryPage.vue`, `src/pages/SearchPage.vue`                                                                                                                                       | UC09                        | Retained browsing pages; current category and search routes render `FindEvents.vue`                   |
| `src/components/EventDetail.vue`, `EnhancedEventDetail.vue`, `EventDetailEnhanced.vue`                                                                                                         | UC09–UC11                   | Alternative older event detail components, outside the current import graph                           |
| `src/components/PurchaseModal.vue`, `CheckoutForm.vue`, `CartMobile.vue`                                                                                                                       | UC11–UC14                   | Older checkout and cart interfaces, unlinked from the current entry graph                             |
| `src/stores/quickPurchase.js`                                                                                                                                                                  | UC11                        | Older in-memory selected ticket store; no current importer                                            |
| `src/services/authService.js`, `src/utils/auth.js`                                                                                                                                             | UC01                        | Unlinked demo authentication and bearer-token helpers                                                 |
| `src/services/eventProfilePreview.js`                                                                                                                                                          | UC09                        | Compatibility re-export of static catalog lookup; no current importer                                 |
| `src/utils/paymentService.js`, `src/api/paymentService.js`                                                                                                                                     | UC13–UC14                   | Alternative old payment helpers; no current importer                                                  |
| `src/stores/purchases.js`, `src/services/purchaseService.js`, `src/stores/reports.js`, `src/services/reportService.js`                                                                         | UC12, UC15, UC22            | Still reachable through Admin, but use the older local purchase contract rather than current commerce |
| `src/pages/TransactionHistory.vue`                                                                                                                                                             | UC14                        | Still routed, with mock transactions instead of a server order-history query                          |
| `src/pages/Trolio.vue`                                                                                                                                                                         | UC14 navigation destination | Still routed and linked as My tickets in public controls, but implements a trading journal            |

The old purchase and report services also treat some async event service results as immediate objects. They should not be treated as reliable current inventory or revenue flows simply because Admin imports them.

### Backup and alternate source files

| File                                             | Use case                   | Treatment                                                                                    |
| ------------------------------------------------ | -------------------------- | -------------------------------------------------------------------------------------------- |
| `CreateEvent.vue.bak`                            | UC02–UC08                  | Root-level creation backup; not the route component                                          |
| `src/pages/CreateEvent.vue.original`             | UC02–UC08                  | Retained older wizard source                                                                 |
| `src/pages/CreateEvent.vue.full-backup`          | UC02–UC08                  | Retained full backup                                                                         |
| `src/pages/CreateEvent.vue.backup`               | UC02–UC08                  | Retained backup                                                                              |
| `src/pages/CreateEvent.vue.backup-1745456184197` | UC02–UC08                  | Retained timestamped backup                                                                  |
| `src/pages/CreateEvent.fixed.vue`                | UC02–UC08                  | Unlinked wrapper that renders the current `CreateEvent.vue`; not an independent backend flow |
| `src/pages/Cart.vue.new`                         | UC11–UC14                  | Alternate cart source, not imported by the current router                                    |
| `api/events.php.bak`                             | UC09 and old event storage | Backup PHP implementation with example content; separate from current Laravel reads          |
| `temp1.vue`                                      | UC02–UC08                  | Older creation source using the event store; not the current route component                 |
| `script.group`, `vite-create-event.log`          | Historical development     | Scratch or diagnostic artifacts; not current event service entry points                      |
| `dist.zip`                                       | Archived deployment        | Retained packaged build; not used to establish current source behaviour                      |

The creation backup family includes older `handleSubmit()` implementations that call `eventStore.createEvent(eventData)`. Their older form uses fields such as `date`, `organizer`, `totalTickets`, `mainImage`, `bannerImage` and `ticketTypes`, rather than the current draft service contract. Several backups contain repeated source sections, so they should not be assumed to be a single valid component ready to restore. The old store path reaches `eventService` and its PHP-style mutation URLs, not the current draft/publish endpoints.

Backup names do not establish a reliable version sequence. They are included as retained artifacts, not as instructions to restore them. Packaged build contents were not used to claim a current route or backend connection.

## Older standalone PHP and SQL systems

These files are in the frontend repository. They are separate from the sibling Laravel application and its migrations. Vite's current `/api` proxy points to Laravel, so a similarly named local PHP file is not automatically the handler that receives a request.

| Files                                                                                                                                                            | Use case                              | Stored data or behaviour and current position                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `api/events.php`                                                                                                                                                 | UC09; partial old purchase validation | Standalone PDO event listing and filtering with flat or JSON fields; advertises mutation verbs, but does not provide the current wizard draft/publish contract                 |
| `api/events.php.bak`                                                                                                                                             | UC09                                  | Older standalone backup and sample event content                                                                                                                               |
| `api/database.sql`                                                                                                                                               | UC02, UC09                            | Older `event_management` schema with text organiser, camelCase event fields and JSON ticket types; not Laravel's relational event schema                                       |
| `api/config.php`, `api/db_config.php`                                                                                                                            | Old event and payment endpoints       | Standalone settings and database helpers; not Laravel config                                                                                                                   |
| `api/test-search.php`                                                                                                                                            | UC09                                  | Older category/search fallback still referenced by `eventService`                                                                                                              |
| `api/payments.php`                                                                                                                                               | UC13–UC14                             | Older submitted reference, buyer form and cart contract; writes standalone transactions and named tickets from submitted cart data; not the current verified commerce pipeline |
| `api/simple-payment.php`                                                                                                                                         | UC13–UC14                             | Generates mock tickets; test flow, not verified payment evidence                                                                                                               |
| `api/proxy.php`                                                                                                                                                  | UC13                                  | Older proxy to a configured remote PHP payment URL; no current checkout importer                                                                                               |
| `payment.php`                                                                                                                                                    | UC13                                  | Older Paystack verification endpoint; separate standalone contract and configuration                                                                                           |
| `payment-simple.php`                                                                                                                                             | UC13–UC14                             | Older provider verification and generated ticket IDs, with a commented-out mock success block; not the current commerce implementation                                         |
| `backend/verify-payment.php`, `backend/db-config.php`, `backend/README.md`                                                                                       | UC13–UC14                             | Another standalone Paystack verifier with its own transaction and ticket persistence helpers                                                                                   |
| `api/database_setup.sql`, `transactions.sql`, `db_setup.php`                                                                                                     | UC13–UC14                             | Alternative setup scripts for transaction/ticket tables; not the Laravel orders, order items and encrypted-token ticket model                                                  |
| `api/check-api.php`, `api/test-api.php`, `api/test.php`, `api/test-connectivity.html`, `api/troubleshooting.md`, root `test.php`, `mime-test.php`, `phpinfo.php` | Diagnostics                           | Retained connectivity or server checks; not product use-case implementations                                                                                                   |
| `PAYSTACK_SETUP.md`                                                                                                                                              | UC13                                  | Older setup guidance; reconcile with current commerce service before use                                                                                                       |

The older schemas can also use table names such as `tickets` and `transactions`. A shared table name does not mean they share the current Laravel data model. In particular, old named-holder ticket rows and local `userTickets` or `savedTickets` helper data do not automatically become current issued QR tickets.

Blog controllers, blog tables and their author relationship are outside event ownership. A blog author is not an event organiser or event staff role merely because both are people in the product.

## Backend implementation inventory

### Runtime source families

| Backend files                                                                                                                | Use cases                   | Responsibility                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `routes/api.php`, `app/Providers/RouteServiceProvider.php`                                                                   | All API use cases           | Route registration and `/api` prefix                                                                              |
| `bootstrap/app.php`, auth, session, Sanctum and CORS config                                                                  | UC01 and protected requests | Stateful API middleware and CSRF exceptions for view tracking and provider webhook                                |
| `AuthController.php`, `PasswordResetController.php`, `User.php`                                                              | UC01                        | Current session identity and recovery                                                                             |
| `CreateEventController.php`, `Services/CreateEventService.php`                                                               | UC02–UC08                   | Draft and active editor, owner checks, validation and relational writes                                           |
| `EventController.php`                                                                                                        | UC09–UC10, older UC22–UC23  | Public reads, favourites and older generic CRUD                                                                   |
| `CategoryController.php`, `SubCategoryController.php`                                                                        | UC09                        | Classification reads                                                                                              |
| `EventTrackingController.php`, `Services/Dashboard/EventAttributionService.php`                                              | UC16                        | Current traffic and source-to-order attribution                                                                   |
| `DashboardController.php`, `Services/Dashboard/DashboardAnalyticsService.php`                                                | UC15–UC16                   | Owned event reads, paid order analytics and sharing links                                                         |
| `CheckoutController.php`, `Requests/QuoteCheckoutRequest.php`, `Requests/InitializeCheckoutRequest.php`                      | UC12–UC14                   | Checkout input and order access endpoints                                                                         |
| `Services/Commerce/CheckoutService.php`, `InventoryService.php`                                                              | UC12                        | Server pricing, reservations, snapshots and allocations                                                           |
| `Services/Commerce/PaystackService.php`, `PaystackSplitService.php`, `PaymentFinalizer.php`, `PaystackWebhookController.php` | UC13, UC21                  | Provider integration, splits, verification and ticket issuance                                                    |
| `Support/Money.php`                                                                                                          | UC12, UC15, UC21            | Decimal price to integer minor-unit conversion                                                                    |
| `RecommendationController.php`, `Services/RecommendationEngine.php`                                                          | UC10                        | Older behavioural recommendations                                                                                 |
| Models listed in the event data table                                                                                        | Corresponding use cases     | Relations and persisted domain records                                                                            |
| `database/factories/`, `database/seeders/`                                                                                   | Development data            | Event, category, subcategory, organiser, address, FAQ and ticket-type sample generation; not runtime user actions |

Controller paths above are under `app/Http/Controllers/Api/`; model paths are under `app/Models/`.

### Schema history

These migrations are retained source definitions. Their presence does not establish which migrations have been applied in any particular database.

| Migration or family under `database/migrations/`                 | Use cases                | Purpose                                                                                             |
| ---------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------- |
| `0001_01_01_000000_create_users_table.php`                       | UC01                     | Users, sessions and recovery tokens                                                                 |
| `2025_04_24_014414_create_personal_access_tokens_table.php`      | UC01                     | Sanctum token schema; current frontend primarily uses session cookies                               |
| `2025_04_24_033448_create_event_addresses_table.php`             | UC02, UC04               | Event venue/address records                                                                         |
| `2025_04_24_033449_create_organizers_table.php`                  | UC04                     | Public organiser records                                                                            |
| `2025_04_24_033450_create_categories_table.php`                  | UC02, UC09               | Event categories                                                                                    |
| `2025_04_24_033452_create_events_table.php`                      | UC02–UC09                | Original event record and ownership foreign key                                                     |
| `2025_04_24_033456_create_sub_categories_table.php`              | UC09                     | Subcategories                                                                                       |
| `2025_04_24_033457_create_ticket_types_table.php`                | UC05                     | Event ticket types                                                                                  |
| `2025_04_24_033458_create_faqs_table.php`                        | UC04                     | Structured event FAQs                                                                               |
| `2025_04_24_033459_create_event_options_table.php`               | UC04, older UC22         | Options and event-option pivot                                                                      |
| `2025_04_24_033460_create_event_sub_category_table.php`          | UC09                     | Event-subcategory pivot                                                                             |
| `2025_04_24_045144_create_permission_tables.php`                 | UC22                     | Spatie roles, permissions and assignment tables                                                     |
| `2025_11_19_011014_add_google_fields_to_users_table.php`         | UC01                     | Google identity fields                                                                              |
| `2025_11_27_050041_add_status_to_events_table.php`               | UC07                     | Event publishing status foundation                                                                  |
| `2025_11_30_051332_create_event_views_table.php`                 | UC10                     | Older signed-in event views                                                                         |
| `2025_11_30_051333_create_event_likes_table.php`                 | UC10                     | Account favourites                                                                                  |
| `2025_11_30_051335_create_purchases_table.php`                   | UC10 and older purchases | Earlier purchase records                                                                            |
| `2026_06_21_000001_add_create_event_columns_to_events_table.php` | UC02–UC08                | End, timezone, event type/format, meeting link, organiser website, tags and JSON form configuration |
| `2026_06_21_000002_add_sales_start_date_and_banner_url.php`      | UC04–UC05                | Ticket sales-start and banner URL support                                                           |
| `2026_06_21_000003_create_event_media_table.php`                 | UC04                     | Ordered media and cover rows                                                                        |
| `2026_06_21_000004_make_event_fields_nullable_for_drafts.php`    | UC02                     | Incomplete draft support                                                                            |
| `2026_06_21_135615_make_organizers_email_nullable.php`           | UC04                     | Allows organiser names without an email                                                             |
| `2026_09_21_000001_add_editor_fields_to_ticket_types_table.php`  | UC05, UC08               | Ticket product units, appearance, limits and visibility                                             |
| `2026_09_21_010000_create_commerce_foundation_tables.php`        | UC12–UC14, UC21          | Orders, lines, allocations, payments, tickets and payout accounts                                   |
| `2026_09_23_120000_create_dashboard_analytics_foundation.php`    | UC15–UC16                | Current traffic, sharing links, legacy visit import and commerce attribution fields                 |
| `2026_11_23_000001_create_event_public_profiles_table.php`       | UC04, UC09               | Optional event public profile without seeded event content                                          |

## Existing references and their limits

| Existing file                                                                                                                                                                  | Useful subject                                  | How it relates to this reference                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `README.md`                                                                                                                                                                    | Original project architecture and setup         | Its `USE_LOCAL_STORAGE` switching instructions do not describe the current creation service                                  |
| `docs/create-event-current-infrastructure.md`                                                                                                                                  | Wizard, date and recurrence concepts            | Local-only publishing statements are older than the current API-connected code                                               |
| `docs/api-spec.md`                                                                                                                                                             | Original planned Laravel contract               | Contains planned bearer-token and endpoint assumptions; current route and controller source governs actual connections       |
| `docs/event-public-profile-data.md`                                                                                                                                            | Rich public profile schema and backend location | Useful profile contract; its homepage static-card description is older than the current landing component                    |
| `docs/event-workspace-data-and-redesign.md`                                                                                                                                    | Workspace data and design transition            | Background reference; verify screen reachability against the current workspace                                               |
| `docs/single-event-workspace-source-of-truth.md`                                                                                                                               | Earlier screen and copy inventory               | Describes the older dashboard component family and local tab state; current dashboard uses query views and the new workspace |
| `docs/overview-reference-review.md`, `attendees-reference-review.md`, `door-checkin-reference-review.md`, `promote-reference-review.md`, `earnings-reference-review.md`        | Individual workspace interface reviews          | Supporting design and interaction notes, not proof of live API connectivity                                                  |
| `docs/public-site-foundation.md`                                                                                                                                               | Public site implementation                      | Supporting discovery and landing context                                                                                     |
| `dashboard-and-event-creation-guide.txt`, `onboarding-and-event-upload-reference.txt`, `event-view-and-dashboard-complete-reference.txt`, `google-auth-architecture-guide.txt` | Broader historical flow descriptions            | Retained references; resolve differences against current imports, services and handlers                                      |
| `AI_PROJECT_DEEP_CONTEXT.md` and backend `AI_BACKEND_DEEP_CONTEXT.md`, `BACKEND_WALKTHROUGH.md`                                                                                | Project orientation                             | Background documentation, not an independently verified deployment state                                                     |

### Existing verification code

Frontend checks under `scripts/` cover event profile, workspace, attendees, door check-in, promotion, overview, earnings and public site behaviour. Backend feature tests include `CreateEventTest`, `CommercePaymentLifecycleTest`, `DashboardAnalyticsTest`, `EventPublicProfileTest` and `AuthRecoveryTest`.

The commerce tests cover server prices, reservation competition, idempotent initialization, guest and buyer order access, one ticket per unit, tables, verification mismatches, duplicate webhooks, late payment and multi-event allocations. These tests express the intended implementation checks; this documentation-only review did not run the suite or perform a live purchase.

## Connections still needed for the complete journey

| Connection                                      | Current pieces                                                   | Missing relationship or behaviour                                                         |
| ----------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Account to shared event team                    | Owner ID, old role tables, access settings and staff contact UI  | Event membership, invitation acceptance, per-event roles and enforced permissions         |
| Public organiser to account                     | Public organiser record and event owner account                  | Explicit ownership of an organiser profile if organiser identity needs account management |
| Recurring event to individual sessions          | Saved recurrence JSON and frontend previews                      | Server occurrences, per-occurrence tickets, booking choice and check-in                   |
| Event questions to attendee answers             | Saved attendee field configuration and fixed buyer form          | Answer capture, validation, schema version and attendee storage                           |
| Free event to registration                      | Free mode and capacity                                           | Registration endpoint, named registrants, inventory and issued admission                  |
| Paid order to named attendees                   | Orders, order items and issued tickets                           | Named holder or attendee records, assignment and live organiser list                      |
| Issued ticket to door movement                  | Encrypted ticket token and preview movement UI                   | Authorised token validation, admission rules, persistent check-in and shared device state |
| Staff contact to event access                   | Entrance contact forms                                           | Real account invitation and scoped access                                                 |
| Offer to paid amount                            | Preview offer forms and `discount_minor` field                   | Server offers, code submission, redemption, limits and historical savings                 |
| Buyer or attendee to outgoing message           | Buyer contact data, composer and local drafts                    | Audience resolution, delivery provider, send endpoint and delivery history                |
| Current traffic and commerce to recommendations | New traffic/orders and older recommendation engine               | Current signal ingestion or a deliberate migration from legacy views/purchases            |
| Seller allocation to received payout            | Allocation and payout-account models, optional split integration | Real bank onboarding, verified account management and settlement reconciliation           |
| Account to full ticket history                  | Protected order detail and placeholder navigation                | An order/ticket list for the account and a working My tickets destination                 |
| Published status to public visibility           | Active publish status and public reads                           | Consistent filtering or access policy for drafts and other non-public events              |
| Event end to booking closure                    | Computed event phase and ticket sales windows                    | Explicit server policy for booking after an event has ended                               |
| Current deployment to one API configuration     | Central proxy plus several absolute and older URLs               | A consistent production origin and removal or deliberate isolation of old clients         |

These are the boundaries between the implemented paths and the remaining product work. They also explain why an event, a person appearing publicly on it, a buyer, a ticket and an event staff role should not be treated as interchangeable records.
