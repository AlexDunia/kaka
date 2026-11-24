# Phase 7 release verification

24 November 2026. **Release decision: blocked. The complete application is not production-ready.**

Both local repositories were inspected. The approved design was preserved. Authentication source, configuration, Google console settings and credentials were not changed. Its existing baseline hashes still match. Compatible frontend dependency security updates were applied, including Axios; this is a dependency change, not a claim that authentication runtime dependencies were unchanged. No real charges, monetary refunds, bank onboarding, transfers or external messages were performed. Test providers/mail were fake, databases were disposable, and existing application records were not reset.

The Laravel repository received concurrent readiness work during this audit. Those edits were preserved: editor lifecycle/cutoff read fields, removal of unused diagnostics, readiness tests and backend API/release documentation. This frontend session did not edit backend application code or Composer dependencies. A frozen pair of final commits/artifacts still needs release sign-off.

## Verified lifecycle and gaps

| Capability | Executed evidence and current limit |
| --- | --- |
| Password authentication | Restored-auth backend checks and actual HTTP session/CSRF login in the integration harnesses passed. Legacy integration expectations fail; security findings below remain. |
| Google authentication | Restored callback contract is covered by backend tests. Real Google consent/callback was not completed. Stateless linking/security issues remain; the existing implementation was preserved. |
| Draft, edit, publish, ticket configuration | Backend lifecycle tests and all 18 Phase 2 Vue checks passed: IDs, versions, partial merge/full replacement, inventory commitments, timezone/DST, media validation and historical snapshots. |
| Public discovery/details | Actual HTTP filtering, pagination and cancellation contracts passed. Draft/archive privacy is tested. The new MariaDB readiness test verifies bounded discovery. |
| Paid checkout/payment verification | Actual Vue service-to-Laravel HTTP with provider fakes passed: quote, stable retry, protected verification, historical line snapshots and issued tickets. Popup success is not treated as payment authority. Real provider completion remains a staging gate. |
| Free registration | Real server registration creates per-seat records, no fake product/payment; 1,000 registrations seeded through the actual service in an isolated workload fixture. |
| Buyer tickets/recovery | Actual protected buyer history, emailed-link exchange, single-use recovery and unauthorized rejection passed using captured test mail. Refunded credentials stay unavailable; partially refunded orders retain unrelated valid tickets. |
| Attendees/entrances/staff | Backend authorization tests and actual HTTP attendee edits, version conflict, paginated records and staff scope passed. Staff/invitation delivery uses fake mail; real SMTP delivery remains unverified. |
| Door/movement history | Actual HTTP entry/exit/re-entry, cross-device refresh and idempotency passed. Separate-process MariaDB tests prevent table over-admission and serialize cancellation. Mounted Vue tests cover manual lookup and camera stream/listener cleanup; real camera/device testing is pending. |
| Promotions/discounts | Backend offers, immutable savings and concurrent quota tests pass. **Production Vue offer authoring/status and checkout code application remain disconnected.** Current services do not send the supported discount contract. Not an end-to-end release capability. |
| Analytics/attribution | Backend aggregate/attribution tests and HTTP overview reads pass. Vue uses server event-wide metrics. All-events aggregate/recent-purchase APIs are absent; owner-list cards no longer create per-event polling or imply loaded pages are complete totals. |
| Messaging | Backend draft/audience/durable-send/retry tests pass with fake mail. **Vue composer, persistent drafts, audience count and delivery status are not integrated.** No real delivery/inbox claim is made. |
| Earnings/payout setup | Currency-separated financial records, null fee evidence, pending/review onboarding and owner isolation pass mounted Vue/backend checks. No withdrawals or owner settlement-statement list exists. Platform receipt is not seller settlement. Real provider onboarding/reconciliation remains a staging gate. |
| Refund/cancellation | Backend paid/partial/free refund, repeated/ambiguous requests, suspended/revoked credentials and late-charge handling pass. Actual HTTP zero-charge request, repeated key, permission isolation, cancellation and checkout rejection pass. 202 remains queued, not money returned. |
| Completion/retention | Backend completed/archive eligibility and preserved history tests pass. Vue uses versioned lifecycle actions and now loads saved state/cutoff from the new read contract while retaining unsaved cutoff edits on reload. No destructive delete was introduced. |

Deferred/unsupported: recurring occurrence booking/inventory, two-factor setup, blog API/content, arbitrary-amount/partial-seat refunds, seller withdrawals/manual disbursement, owner settlement statements, platform-held seller disbursement and already-settled seller recovery. Legacy unknown financial facts and provider ambiguity require actual operator reconciliation. These are not silently simulated.

## Changes made in this frontend session

- Owner event collections retain Laravel page/total metadata and expose previous/next pages. A directly linked owned event outside the loaded page is authorized through its protected overview, rather than silently replaced by the first event.
- Measured and removed owner-list request fan-out: the committed implementation started **30 overview requests for one 30-event page**; the corrected production implementation starts **zero**. It also avoids creating attendee models/pollers inside a computed list. Demo data stays gated.
- Removed verbose event response/error/search logging and the discovery parser that guessed arbitrary arrays. Store filtering now uses the shared event-service paginator contract.
- Split event detail and creation wizard into route chunks. Main JS decreased from the Phase 6 build's approximately **403.34 kB / 133.35 kB gzip** to **281.32 kB / 98.40 kB gzip**. Detail/wizard chunks are 28.49/95.25 kB respectively; they are loaded when visited. This does not establish a Web Vitals result.
- Removed unused `html2pdf.js`/`jsbarcode`, including the critical PDF dependency chain, and applied compatible npm security fixes. Final npm audit: **zero advisories**, versus 22 initially (2 critical, 12 high, 7 moderate, 1 low). Installed Axios1.21.1, Vite6.4.6, UUID11.1.1, Rollup4.68.8. Vue remains3.5.46. An npm cleanup warning concerned a locked old Rollup binary; install and production build completed successfully.
- Corrected lint targeting of generated `.vite` files and the inactive root scratch `temp1.vue`, supplied Node globals for tooling, and removed unused nonfunctional source variables/imports. Existing single-word legacy component names and the intentional authentication control-character rejection regex have narrow documented lint exceptions; authentication behavior was not altered.
- Corrected the editor test's mock to capture the existing standalone CSRF call. No production authentication change or weakened assertion was used.
- Wired the concurrently added owner lifecycle/cutoff read. UTC/offset instants stay explicit; revision reload retains unsaved edits. Earlier Phase 6 documentation about the missing read is now superseded.
- Replaced the proposed bearer-token API guide with a [current frontend service map](api-spec.md) linked to the [authoritative Laravel specification](../../kakabackend/docs/api-spec.md). Added reproducible contract/load runners and machine-readable evidence.

No migration or financial calculation change was made by this frontend session. Existing uncommitted work in either repository was preserved.

## Actual test outcomes

| Command/check | Result |
| --- | --- |
| Backend isolated feature/unit run excluding the separately executed concurrency file | **131 passed, 11 failed; 1,032 assertions; 51.24s**. No failures hidden by excluding auth tests. |
| `php scripts/test-isolated-database.php tests/Feature/EventConcurrencyTest.php` | **13 passed, 144 assertions; 243.09s**, actual separate-process MariaDB10.4.32 contention. |
| Newly added `ReleaseReadinessTest.php --stop-on-failure` | **2 passed, 96 assertions; 11.07s**; saved owner-only lifecycle/cutoff read and bounded discovery. |
| Backend full Pint `--test --format=json` | **Failed: 35 existing files require formatting.** No repository-wide rewrite applied. This is not a semantic analyzer. |
| PHP syntax, app/routes/migrations | **129 files, zero failures**. New frontend PHP harnesses also pass syntax checks. No PHPStan/Larastan configuration exists. |
| `node scripts/check-phase07-tests.mjs` | Final eleven-runner pass: **10 passed, 1 failed**. Phase2 passes all18 checks; phases3/4/5/6, public profile8 cases, public site and design-system checks pass. Machine-readable output includes the failure. This includes the new contract runner. |
| Legacy `check-phase1b.mjs` | **Fails** on its obsolete explicit `headers.Accept === application/json` expectation; it stops before later assertions. Restored Axios defaults remain unchanged. This test was not rewritten to pretend the old contract still applies. |
| `node scripts/check-phase07-contracts.mjs` | **Passed**: no owner-list request fan-out, bounded canonical pages, account reset isolation and shared discovery envelope. |
| `node scripts/check-phase06-ui.mjs` after lifecycle read wiring | **Passed**, including saved UTC cutoff initialization and unsaved cutoff retention. |
| Backend `php scripts/test-phase03-http.php` | **Passed** actual frontend paid checkout, idempotency, verification, historical ticket snapshots, buyer history and protected guest recovery with provider/mail fakes. |
| Frontend `php scripts/check-phase04-http.php` | **Passed** paid/table/individual/free registration, attendee edits/conflicts, pagination, entry/exit/re-entry, cross-device state, idempotency and permission isolation. |
| Frontend `php scripts/check-phase06-http.php` | **Passed** authoritative zero-charge finances, persisted IDs, duplicate queued refund, suspended entry, ownership, versioned cancellation, public notice and rejected checkout. |
| `php scripts/check-phase07-http.php` | **Passed** 112 bounded HTTP requests across seven workloads; 38 events and1,000 registration records in disposable SQLite. Zero workload errors. |
| `npm.cmd run build` | **Passed**, Vite6.4.6,15.38s on the final build after saved-cutoff wiring; main JS remains281.32 kB. |
| `npx.cmd eslint .` | **Passed** after targeted fixes; initial whole-tree run failed345 errors/3 warnings, largely generated cache plus actual source/config issues. |
| npm / Composer advisory audit | npm **passed,0**; Composer **failed,62 advisories across16 locked packages**. Detailed advisory identifiers/links are in the evidence file. Backend dependencies were not silently upgraded. |
| Auth baseline / built artifact scan | Existing auth hashes unchanged. No private-key/Paystack secret/AWS-key patterns, PHP, env or source maps found in the built artifact scan. This bounded pattern scan is not a complete secret audit. |

All integration runners removed their generated databases/files. Harmless test HMR port warnings occurred when Vite harnesses ran concurrently; the actual checks passed. No existing DB migration/reset was used. The restored authentication suite passing does not erase the11 failures in the older security/integration suite.

## Performance evidence and limits

Local Windows, one PHP development-server worker, disposable SQLite, fake provider, array cache, concurrency4, other verification processes running. HTTP samples include server bootstrap and queueing. This is a reproducible diagnostic workload, **not production throughput, distributed cache/rate-limit or million-user evidence**. Small samples, especially8/12 requests, are inadequate for a stable tail SLO.

| Workload | Requests | rps | p50 / p95 / p99 ms | Max SQL queries |
| --- | ---: | ---: | --- | ---: |
| Public discovery |24|0.81|4967 /6136 /6333|9|
| Popular-launch quotes |20|1.00|3726 /4751 /4864|7|
| Inventory reservation |8|0.61|5777 /7533 /7533|not observed|
| Payment verification |8|1.35|2839 /3311 /3311|34|
| Dashboard reads |20|1.47|2522 /3470 /3755|41|
| 1,000-attendee page,30 rows returned |20|1.23|2650 /4805 /5284|8|
| Idempotent scan retries,one owner session |12|1.03|3526 /4841 /4841|19|

Maximum observed PHP request peak memory was30 MiB; attendee payload21,086 bytes, dashboard6,339 bytes. Reservation resource headers were unwrapped by its service and were **not measured**. Client process RSS was98.5 MiB; client CPU totals are recorded, not server CPU utilization. Server CPU/disk/connection-pool utilization, sustained saturation, autoscaling and failure under real provider delay remain unmeasured. Multi-device state and concurrent scan integrity are established by the separate HTTP/admission and MariaDB contention checks, not a claim that this single-session benchmark simulates devices.

Independent relational discovery evidence from the newly executed backend test:121 catalog rows,30 sequential test-kernel requests, p50 **36.60ms**, p95 **66.82ms**, p99 **80.05ms**,25.48 requests/s, max6 queries,10,585-byte response,50 MiB process peak. This bypasses network/server boot/queueing and is **not comparable to external HTTP latency or production capacity**.

Inspection found bounded eager-loading for public/attendee pages and batched inventory aggregation/indexed credential lookup. Existing indexes cover event/category/date, normalized city, attendee event/name/email, movement cursors and unique credential/idempotency slots. Leading-wildcard multiword public search still scans matching text; the small fixtures do not justify new search infrastructure. Dashboard aggregation has41 queries on this fixture; profile larger commercial histories on production-like MariaDB before caching/preaggregation. No new indexes were added without evidence. Same-key dashboard requests have stale-response protection but are not generally coalesced; further request deduplication should be profiled. No claim is made that all query plans/indexes are optimal.

## Security findings and release blockers

1. **Authentication preserved but not security-cleared.** The Google provider uses [`stateless()`](https://laravel.com/docs/12.x/socialite#stateless-authentication) (state validation disabled), email-based `updateOrCreate` can replace a local password/name/provider identity, verified-email/identity-link protections expected by the legacy suite are absent, and provider exception text is appended to a failure URL. User/profile JSON is put in a success query. Login has the global API limiter rather than the failed suite's stricter credential limiter. Local-only provider TLS verification is disabled in existing auth code. These code findings and11 failed tests require an explicitly authorized authentication remediation; no Google console setting was changed here. Source tests disagree with the restored implementation, and both the real risks and test contract must be resolved before release.
2. **Backend dependencies:**62 advisories in16 packages, including framework, HTTP/OAuth-related transitives and development tools. Review applicability, update supported compatible versions in a dedicated tested backend change, and re-run both repositories. Names/severities/advisory URLs are recorded without secrets.
3. **Incomplete Phase5 Vue integration:** no production offer authoring/code checkout or messaging end-to-end path. Backend-only tests do not make these product flows ready.
4. **Deployment remains unverified:** local APP_ENV=local, APP_DEBUG=true and nonsecure local cookies are development settings, not evidence of production values. Production HTTPS/cookies/exact stateful+CORS origins/reverse proxy and callbacks need staging verification. The local CORS list contains development origins. The existing `/api` base requires a same-origin production proxy; GitHub Pages alone does not proxy Laravel.
5. **Browser/device/provider/operations gates remain open.** Browser host was unavailable and native Chrome approval timed out. No real browser/mobile/Safari/Firefox/low-memory/CPU-throttled/unstable-network visual or keyboard audit was completed. Static keyboard/manual-scan/reduced-motion paths and mounted lifecycle cleanup are narrower evidence. Real provider test-facility onboarding/refund/settlement, delivery, queue crash recovery and backup restoration remain unverified.

Owner/staff resource substitution, foreign IDs, protected credentials, webhook signatures, upload validation and CSV safety are covered by backend tests; this is positive evidence, not a full penetration test. The only `v-html` discovery use is local static SVG art, not server HTML. Verbose event payload logs were removed; preserved auth error logging/provider exception handling remains part of auth review. Laravel public directory contains the normal index entry and a local `hot` marker; deploy only the public document root and exclude `hot`, diagnostics/test routers, repository roots, env/vendor/test data. Frontend deploy only `dist`, not source/scripts/docs/scratch/reference backups. Concurrent backend work removed `/api/ping` and `/api/cors-test`; `/up` remains health.

Core Web Vitals objectives remain LCP<=2.5s, INP<=200ms, CLS<=0.1 at75th percentile. **No lab browser or field measurements were obtained.** API latency and bundle size do not establish these metrics. Field monitoring and real device/browser staging checks are required; no million-user capacity claim is supported.

## Infrastructure, deployment and recovery runbook

- Freeze tested frontend/backend revisions, lockfiles and artifact hashes. Review [backend release findings](../../kakabackend/docs/phase-07-release-report.md), this report and current API spec together. Resolve blockers before promotion.
- Use a supported production PHP/database stack, HTTPS web server/PHP-FPM, supervised durable queue workers, minute scheduler, shared session/cache/atomic-lock store and shared public assets. Existing database session/cache/queue stores can be shared by nodes using the same DB; node-local files cannot provide cross-instance consistency. No Kubernetes, sharding or new service layer is justified by these measurements.
- Keep one stable APP_KEY across nodes, securely backed up separately from encrypted DB/assets. Do not regenerate it on deploy; encrypted bank/ticket data needs its original key. Keep provider secrets server-only, never VITE variables. Separate test/live provider credentials and callbacks.
- Configure canonical APP_URL/FRONTEND_URL, exact stateful/CORS hosts and credentialed requests, secure HttpOnly cookies/SameSite/domain, trusted TLS proxy and correct client-IP handling for rate limits. Preserve `/api` and `/sanctum` at the frontend origin and the currently built `/kaka/` SPA base/fallback. Review the Google return path with that base during an authorized auth deployment; do not silently change local login settings.
- Deploy backend-compatible additions before the frontend. Install from lockfiles, build Vue, configure storage URL/symlink and permissions, cache Laravel config/routes only after correct environment values, apply forward migrations with `php artisan migrate --force` after tested backups, restart workers and run protected smoke tests. No `migrate:fresh` or destructive commercial migration rollback.
- `schedule:list` confirms commerce, admission invitation, messages and finance dispatch every minute. Run one scheduler or shared locks; supervise workers. Choose worker timeout above job timeouts and queue retry_after above worker timeout. The default database retry_after90 seconds must be reviewed against all job limits. Polling does not replace durable workers. Verify after crashes that payments/refunds/invitations/delivery/cancellation resume without duplicate credentials/charges.
- Monitor `/up` plus separate DB/cache/queue readiness, HTTP errors/p95, oldest queued age, failed jobs, expired holds, unresolved payments, refund attention, bank review, cancellation backlog and settlement mismatches. Use redacted correlation IDs; never log QR/recovery/provider access credentials, full bank details or attendee PII. Alert an operator for platform-held disbursement and settled-seller recovery; do not manually mark allocations paid.
- Establish encrypted consistent DB backups plus binlog/PITR retention, public asset backups and separate key/config recovery. Define RPO/RTO/retention with the owner. Restore into an isolated staging database/storage, verify historical amounts/IDs/decryption/assets, run lifecycle smoke checks and reconcile external provider state before reopening commerce. **No restore/failover drill was executed in this session.** Synthetic disposable test creation is not backup verification.
- Roll back application artifacts only while schema-compatible. Financial/history migrations are forward-only; after financial writes use an audited forward fix and reconcile the provider rather than erasing/reforging history.

Deployment/queue guidance was checked against [Laravel deployment](https://laravel.com/docs/12.x/deployment) and [queues](https://laravel.com/docs/12.x/queues). Browser objectives and lab/field distinctions follow [Web Vitals](https://web.dev/articles/vitals). Dependency updates followed the non-force compatible behavior described by [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/).

## Files and evidence

Changed frontend runtime/tool files: `src/App.vue`, `src/components/TimePickerModal.vue`, `src/components/event-workspace/WorkspaceEvents.vue`, `WorkspaceEventLifecycle.vue`, `WorkspaceViews.vue`, `src/pages/ContactPage.vue`, `Dashboard.vue`, `src/router/index.js`, `src/services/dashboardService.js`, `eventService.js`, `debug.js`, `src/stores/dashboard.js`, `events.js`, `eslint.config.js`, `package.json`, `package-lock.json`. Updated checks: `scripts/check-phase02.mjs`, `check-phase04-http.php`, `check-phase06-ui.mjs`.

Added: `scripts/check-phase07-contracts.mjs`, `check-phase07-tests.mjs`, `check-phase07-e2e.mjs`, `check-phase07-http.php`, `phase07-http-fixture.php`; this report and the updated API companion.

Evidence: [frontend results](phase-07-frontend-test-results.json), [local HTTP workloads](phase-07-performance-results.json), [relational kernel discovery](phase-07-discovery-kernel-results.json), [dependency summary](phase-07-dependency-summary.json), [backend advisory IDs](phase-07-backend-advisories.json), [artifact pattern scan](phase-07-artifact-check.json).

Ready for further controlled staging verification, **not production release**. Next gates are authorized auth remediation, backend advisory updates, Phase5 frontend completion, frozen-artifact browser/provider tests, representative staging load and operational restore/recovery drills. No unsupported capability was marked complete.
