# Phase 4 frontend integration

## Scope and verified problems

Implemented the frontend against C:/Users/HP/kakabackend/docs/phase-04-api-handoff.md and verified the actual controllers, services, resources and routes. Attendees and Door check-in remain separate interfaces. Existing owner navigation, layouts and style sheets are retained; functional guest pagination and registration fields use existing table/form components and classes.

Production previously had empty, disconnected attendee/door models, browser-only preview mutations, local ticket-code camera matching, sample receipt prices, no per-seat registration payload, and no free-registration path. Camera permission could resolve after the scanner had closed. Staff needed an operations page that did not request private owner analytics.

Authentication code, Google settings, Axios/CSRF configuration and proxy configuration were not changed. Existing session guards are reused for new routes. Pre-existing uncommitted changes were preserved. No backend implementation or existing development database migration was performed by this task.

## Changes

- Added an event-operations service using the confirmed APIs. Production records come from authorised server responses; referenceGuests and browser preview persistence remain restricted to explicitly enabled demo mode.
- Added a shared account/event-scoped attendee model with bounded 30-record pages, server prefix search, stale-response guards and targeted guest updates. Private records clear on account changes or loss of access. Neither QR credentials nor attendee answers are persisted as a competing browser database.
- Added purchase and guest pagination, historical-schema guest editing with versions/conflict feedback, actual purchase item totals, protected resend and server-streamed CSV export. Buyers remain distinct from attendees and table product units remain distinct from admission seats. Receipts print product quantities and historical line totals rather than charging a table price for each seat.
- Connected entrance creation/update/deactivation, UTC opening/closing windows, owner-only re-entry policy, bounded staff memberships/invitations and revocation. Invitation acceptance uses the existing account and the emailed single-use capability; it does not change login or account credentials.
- Added /door/:eventId for minimal, authorised staff operations and /event-invitations/accept for emailed staff links. These pages use the existing door/attendee interfaces and do not load dashboard analytics or event-editor APIs. Invitation fragments are removed immediately; temporary invitation state is session-scoped for the existing login continuation.
- Manual and camera scanning use indexed server credential lookup. Manual admission codes can be copied from the existing protected ticket page. Displayed ticket public IDs are never treated as secret credentials. Scanner lookup is advisory; every entry/exit count must be confirmed online by the movement API.
- A lost movement response retains its request UUID. Only a fingerprint and UUID are kept in sessionStorage, scoped by account/event; the raw credential stays in memory. Retrying the original operation after remount reuses that UUID. A different operation is blocked until the uncertain one is resolved. No independent offline admissions or successful local-only scans are created.
- Entry/exit/re-entry and partial table counts use server outcomes. Denials and network errors never show a successful admission. Authorised views refresh every five seconds while visible, on focus and after mutations; same-browser event invalidation uses BroadcastChannel without attendee data. Timers, channel listeners, animation frames and media tracks are released, including late getUserMedia responses.
- Paid checkout collects one answer set per product unit/admission seat from the server quote and preserves the historical form/answers for failed-attempt retries. Free registration uses the public registration form/availability and registration endpoint, with no Paystack attempt. Registered orders are fulfilled in ticket/history screens and expose only server-issued valid credentials. Recurring availability is not fabricated.

## Files changed

- src/components/event-workspace/EventWorkspace.vue
- src/components/event-workspace/WorkspaceAttendees.vue
- src/components/event-workspace/WorkspaceGuestCard.vue
- src/components/event-workspace/attendeesModel.js
- src/components/event-workspace/liveAttendeesModel.js
- src/components/event-workspace/previewAttendeesModel.js
- src/components/event-workspace/WorkspaceDoorCheckin.vue
- src/components/event-workspace/WorkspaceSupport.vue
- src/components/event-workspace/WorkspaceViews.vue
- src/services/eventOperationsService.js
- src/services/checkoutService.js
- src/pages/Checkout.vue
- src/pages/EventDetails.vue
- src/pages/EventTickets.vue
- src/pages/PaymentSuccess.vue
- src/pages/TransactionHistory.vue
- src/pages/EventDoor.vue
- src/pages/EventInvitation.vue
- src/utils/eventProfile.js
- src/router/index.js
- scripts/check-phase04-ui.mjs
- scripts/check-phase04-e2e.mjs
- scripts/check-phase04-http.php
- scripts/phase04-http-fixture.php
- docs/phase-04-frontend-integration.md

referenceGuests.js was reviewed and left unchanged as demo-only data. Authentication files, dashboard owner-loading behavior, stylesheets and unrelated working-tree changes were not rewritten.

## Database and API contracts

No frontend-owned database migration or backend API change. Uses the handoff's public registration form/registration, checkout attendee payload, protected order/ticket, event-operations attendee/purchase/edit/export/resend, admission context/lookup/movement/history/settings, entrance and staff contracts. Uses integer minor money and server-assigned attendee, ticket, order and entrance IDs. Model reads are paginated; it never downloads every attendee or purchase to filter locally.

## Verification and actual results

- php scripts/check-phase04-http.php (frontend repository): passed real HTTP calls from the Vue services against a new isolated Laravel SQLite database. Covered paid table/individual checkout, required seat answers, identical attempt replay, rejection of changed answers, server-issued credentials, free registration replay/capacity/availability, paginated search/purchases, versioned editing/conflicts, entry/exit/re-entry, original scan replay, independent device sessions and event/entrance/account isolation. Paystack is faked; mail uses a test transport. Only generated database/router/fixture/log files were removed.
- php scripts/test-isolated-database.php --filter=RegistrationAdmissionTest (backend repository): 10 passed, 84 assertions. Includes required/historical registration fields, free zero-capacity edges, recurring rejection, scope/revocation, invitation ownership/expiry, exports and admission state.
- php scripts/test-isolated-database.php --filter=test_simultaneous_partial_scans_cannot_exceed_table_entitlement: 1 passed, 13 assertions using separate processes on MariaDB 10.4.32. The generated database was removed. The HTTP SQLite fixture is not used as proof of locking correctness.
- node scripts/check-phase04-ui.mjs: passed actual Vue setup/lifecycle checks for shared authoritative pages, pagination, server totals, no optimistic admission after lost responses, stable retries across remount, credential-free storage, account clearing, door-only privacy, late camera-stream cleanup, camera/server lookup, paid table-seat payloads, historical retry answers and free registration without a payment popup.
- node scripts/check-phase03-ui.mjs and node scripts/check-phase03.mjs: passed commerce lifecycle/storage/recovery regressions.
- node scripts/check-event-profile.mjs: 7 passed.
- Phase 2 frontend regression: 18 passed using the same in-memory standalone-CSRF test adapter documented in the Phase 3 report. No authentication source was changed to accommodate Node tests.
- Scoped ESLint and npm.cmd run build: passed. git diff --check: passed. Existing auth/proxy SHA-256 snapshots matched.

## Backend contract limits and remaining dependencies

1. The current purchases API paginates order items, while the attendee list is independently paginated and cannot filter by order/order-item ID. A complete purchase with guests spanning pages cannot be loaded through a bounded detail query. The UI explicitly labels loaded guest records and page item totals; it does not invent missing guests or download the entire event. To complete that part of the original full-purchase interface, Laravel must supply an authorised purchase-detail contract with paginated seats, or a validated order-item filter on attendee reads.
2. Server filters for ticket type, arrival, attribution source, and movement day/hour are absent. Unsupported whole-list controls remain unavailable; day/hour filtering is explicitly limited to the loaded movement page. Add validated backend filters if those controls must operate across the complete event.
3. Movement history returns ticket-level direction/count rather than affected seat IDs. Table history therefore shows counted credential movements, not invented individual visit sessions. Seat-specific history needs an authorised server representation if required. Current inside/entries flags still come directly from attendee records.
4. Staff list responses identify existing members by account ID and do not include names/phone numbers. Invitations use email only; names/phones are not falsely reported as saved. Buyer photos and arrival-email alerts have no authoring/delivery contract and remain preview-only.
5. Physical camera/browser compatibility and an interactive configured Paystack test-mode pass remain manual checks. No real provider charge, live outbound email or physical-device scan was claimed. Multiple-device API consistency and simultaneous server scans were verified as described above.

## Integration instructions and readiness

Deploy the supplied backend Phase 4 migration through its reviewed process, with checkout/door writes paused for historical seat backfill and existing data backed up; never reset an existing database. Run the existing durable commerce workers/minute scheduler plus admission:dispatch-invitations, configure a real mail transport and the correct FRONTEND_URL. The frontend adds no migration or auth configuration. Keep the existing local ports (5174/8000) and proxy settings.

Owner access remains in the existing dashboard's Attendees and Door check-in destinations. Staff links use /door/{eventId}; invitation emails use /event-invitations/accept#token=.... Free events link to /checkout?event={eventId}&registration=1. Keep all new service calls within the confirmed handoff contracts.

The implemented API and component flows are ready for interactive end-to-end validation. Full cross-page purchase details and whole-event filters remain backend integration dependencies above, so this is not a claim that every original preview interaction is production-complete. No later phase was started.
