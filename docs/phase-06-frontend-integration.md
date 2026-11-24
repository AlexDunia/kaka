# Phase 6 frontend integration

24 November 2026. Implements the requested financial and lifecycle frontend against the supplied Phase 5/6 backend handoffs. Authentication, Google configuration and login behavior were left unchanged; the existing authentication baseline hashes were verified. Existing uncommitted work was preserved. No backend application files, database migrations or API contracts were changed by this frontend work.

## Verified problems and changes

- Earnings previously used incomplete attendee pages and unavailable individual purchase data. Live earnings now read owner-authorized currency-partitioned financial metrics and paginated persisted order-item purchases. Original amounts, discounts, confirmed refunds, original/reversed platform fees, unknown provider fees, seller proceeds, pending settlement, confirmed settlement and seller recovery are distinct. Unknown historical refund coverage is explicit. No currencies are combined into a balance.
- Payout setup previously contained an in-memory demo bank form. It now uses server bank pages, submits only bank code/account number, displays masked account history and provider-confirmed onboarding states. Account names are never supplied as client verification. Raw account numbers are cleared on successful submission, dismissal, account change and unmount; they are never stored in browser storage. Repeated submission uses backend fingerprint idempotency. No withdrawal or manual paid control exists.
- Refund controls select one complete persisted order-item line, retaining all product quantities and seat entitlements. Amounts are never sent by the frontend. A UUID and payload digest survive uncertain retries in session storage, scoped to owner/event/order/items; reasons and credentials are not stored. Changed intentions have distinct identifiers. A 202 is displayed as queued. Attention retries call only the existing refund retry endpoint. Refund lists and purchase records are paginated.
- Event settings now offer close/reopen sales, explicit-offset cutoff (or clear), completion, cancellation with reason and archival through the versioned lifecycle endpoint. A conflict preserves the user's values and requires reloading the saved version. Backend eligibility and financial obligations remain authoritative. Successful operations invalidate the affected event/dashboard caches.
- Live overview registration/admission counts now use event-wide backend metrics instead of a loaded attendee page. Distinct order counts are not summed across historical currency groups.
- Published cancellation details remain visible and booking is disabled when the server says `booking_supported:false`, including ticket selection reached directly. Buyer history distinguishes partial refunds and shows confirmed refund amounts alongside original charges. Partially refunded orders retain access to remaining valid credentials; suspended/refunded credentials do not render QR codes. Protected order status refreshes on focus and every 30 seconds while visible, without repeating provider verification. Timers/listeners are cleaned up.
- Door lookup now includes the selected admission direction, allowing the backend's authorized physical-exit flow for already-inside revoked tickets. This does not restore entry entitlement. A direction change clears stale lookup results.
- Financial changes refresh relevant owner records and invalidate event/dashboard caches; admission screens receive a refresh notification. Financial/account records clear on account changes and stale responses are ignored.

Existing classes, navigation and page structure were reused. The generic `WorkspaceEarningsTable.vue` did not require a change. Live detail destinations display the authorized paginated financial ledger rather than fabricated per-person calculations. Preview-only examples remain gated behind demo mode.

## Files changed for this work

New:

- `src/services/eventFinanceService.js`
- `src/components/event-workspace/financialModel.js`
- `src/components/event-workspace/WorkspaceFinancialRecords.vue`
- `src/components/event-workspace/WorkspaceEventLifecycle.vue`
- `scripts/check-phase06-ui.mjs`
- `scripts/check-phase06-e2e.mjs`
- `scripts/check-phase06-http.php`
- This report.

Updated, preserving earlier work:

- `src/components/event-workspace/WorkspaceEarnings.vue`
- `src/components/event-workspace/WorkspaceEarningsDetails.vue`
- `src/components/event-workspace/WorkspaceEarningsPayouts.vue`
- `src/components/event-workspace/earningsModel.js`
- `src/components/event-workspace/WorkspaceViews.vue`
- `src/components/event-workspace/WorkspaceOverview.vue`
- `src/components/event-workspace/EventWorkspace.vue`
- `src/components/event-workspace/WorkspaceDoorCheckin.vue`
- `src/components/event-workspace/liveAttendeesModel.js`
- `src/components/EventTicketSelection.vue`
- `src/pages/TransactionHistory.vue`
- `src/pages/PaymentSuccess.vue`
- `src/pages/EventDetails.vue`
- `src/utils/eventProfile.js`
- `scripts/check-phase04-http.php` (reuses its guarded disposable harness for Phase 6)
- `scripts/check-phase05-analytics.mjs` (confirmed aggregate contract)
- `scripts/check-event-profile.mjs` (booking closure regression and fixture clock initialization)

## Executed verification

- `npm.cmd run build`: passed (622 modules).
- Targeted `npx.cmd eslint` across the changed JS/Vue files and checks: passed.
- Prettier applied to changed frontend files and checks.
- `node scripts/check-phase06-ui.mjs`: passed. Mounted Vue checks with HTTP mocked: currency partitions, unknown fees, persisted whole-line IDs, same UUID after a lost refund response, no optimistic refund completion, attention retries, lifecycle conflicts, pending bank verification, account isolation, credential-free storage, partially refunded order access and protected status refresh on focus.
- `php scripts/check-phase06-http.php`: passed. Actual frontend services over Laravel HTTP, disposable SQLite database and provider fakes: free registration, authoritative earnings and paginated purchase IDs, duplicate refund request identity, queued zero-amount refund, suspended entry credentials, other-owner rejection, lifecycle versions, cancelled-event checkout rejection and public cancellation contract. The harness removed its generated files. No provider charge was made.
- `node scripts/check-phase05-analytics.mjs`: passed. Event-wide server counts and invalidated in-flight cache protection.
- `node scripts/check-phase04-ui.mjs`: passed all three reported groups: paid/free seat forms, shared authorized records, retry/camera cleanup and permission isolation regressions.
- `node scripts/check-event-profile.mjs`: 8 passed, including booking closure and selection preservation.
- Backend: `php scripts/test-isolated-database.php tests/Feature/FinancialLifecycleTest.php --stop-on-failure`: **18 passed, 106 assertions**. Includes paid/partial/free refunds, ambiguous provider retries, preserved historical calculations, revocation, onboarding, settlement evidence, cancellation, completion/archive and authorization. Provider calls were faked; the isolated MariaDB database was removed.
- Backend: `php scripts/test-isolated-database.php tests/Feature/EventConcurrencyTest.php --filter="simultaneous_refund_requests|checkout_waits_for_sales_closure|cancellation_serializes" --stop-on-failure`: **3 passed, 28 assertions** using separate processes and isolated MariaDB. The isolated database was removed.
- Authentication baseline hash comparison: unchanged. `git diff --check`: passed (existing CRLF normalization warnings only).

An initial template compilation error was corrected before the passing build. The public-profile check also exposed an existing fixture clock used before initialization; its declaration was moved before use. No tests were weakened.

## Backend integration and remaining dependencies

1. Deploy the supplied backend Phase 5 and Phase 6 forward migrations in order; do not reset an existing database. This frontend adds no migration.
2. Keep the existing Sanctum session, CSRF and Vite proxy configuration. Run frontend on port 5174 and backend on port 8000 using the existing setup.
3. Restart durable queue workers and run the scheduler, including `finance:dispatch`, alongside existing commerce/admission/message workers. Configure provider test facilities for bank onboarding, refunds and settlement evidence. Production provider/mail/operator configuration remains a backend operational responsibility.
4. No owner-facing individual settlement statement endpoint exists in the supplied routes/controller. The interface displays confirmed seller settlement and pending/recovery totals and explains the statement limitation. Individual bank transfer dates, references and paginated statements require a future owner-authorized backend contract. Nothing is marked paid from platform receipt or expected allocation.
5. Purchase search supports the existing indexed buyer-email/order-reference prefix lookup. The backend does not expose ticket/source-specific purchase filtering; live detail destinations use the event's paginated ledger and do not claim filtered all-time totals. No full-catalog download was introduced.
6. The existing editor read returns a version but does not expose lifecycle state/cutoff. Lifecycle controls preserve the confirmed mutation version/state and allow explicit cutoff entry; showing the initial saved cutoff/state requires backend read-contract coverage. The frontend does not infer these values from publication status.
7. Legacy unknown refunds, provider/account review, platform-held disbursement and settled-seller recovery remain explicit operational obligations. There is no unsupported transfer, arbitrary-amount refund, partial-seat refund or manual reconciliation control.
8. Browser visual/camera and provider-test-facility sign-off remains pending. Automated verification covers mounted Vue, actual frontend-to-Laravel HTTP and isolated backend contention; it is not a claim of completed interactive browser testing or live provider settlement.

Ready for browser integration testing against the completed backend, subject to the statement/read-contract limitations above. No real provider transfers, charges, bank onboarding or monetary refunds were performed during automated development verification. No future phase was started.
