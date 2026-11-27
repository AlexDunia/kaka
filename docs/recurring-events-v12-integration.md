# Recurring events V12 integration

Status: the Vue editor and versioned save adapter are implemented. **The current Laravel API does not support this schedule contract. Database persistence and publication of V12 schedules are release blockers until the changes below are implemented and tested.** No backend files or database records were changed in this phase.

## Verified starting point

- The reference is `rush-hour-recurring-v12.html` and its accompanying product specification, dated 25 November 2026. Its JavaScript is a behavior reference, not production persistence.
- Frontend: `src/pages/CreateEvent.vue`, `src/services/createEventService.js`, `src/utils/eventEditor.js`, and `src/utils/eventEditorSections.js`.
- Backend: `app/Services/EventEditorValidation.php` currently restricts recurrence to `frequency`, `weeklyDays`, monthly rules, and inclusive series-end rules. Its allowed-key validation rejects V12.
- `app/Services/CreateEventService.php` already writes and reads `events.recurrence_data` as JSON and returns `{ id, version, status, form }`. The existing JSON column can hold a new draft representation after validation/service changes; adding a second draft database is unnecessary.
- Current event/ticket records do not supply the concrete V12 event-day/session model. Do not infer occurrence-specific stock or admission rights from the editor.

Existing saved rule-based schedules remain in their existing editor. They are not silently converted. New recurring schedules use V12. One-time creation remains on its existing path.

## Frontend behavior

The editor has independent weekly and monthly configurations. Weekly and monthly each allow a clamped calendar-year anniversary. The revised flow treats the full range as one schedule, with month navigation inside a single day-picker dialog; weekly ranges may span more than 31 days. Start is inclusive and end is exclusive. No dates are automatically added by choosing a range.

Each selected date may have no times or multiple same-day, nonoverlapping sessions. A blank single time pair is a valid date-only day. Adjacent sessions are valid; overnight sessions are rejected for V12, as specified by the reference. Existing legacy overnight schedules remain unchanged.

Ordinary complete edits are added to the form when leaving a day. Incomplete edits and pending bulk intentions remain in that date's draft. Checking shared times does not apply them until explicit Save. Repeating weekdays only fills eligible dates in the open month. Independent conflicting times/drafts require an in-product confirmation before replacement. Detached dates are excluded from routine shared-template propagation.

The source-removal and no-time-exception gaps identified in the specification are handled: removing a source session detaches the template while retaining other dates' copied times; an inherited date can explicitly keep no times without deleting the date.

The prototype's local “Saved” status is shown as **Time added / Added to event draft**. Only the parent event's existing save action can produce a server-confirmed event save. No localStorage/sessionStorage schedule database or fake network fallback is used.

Time selectors show quarter-hour choices, with an every-minute option. Only the open selector is rendered. Production UI limits each date to 24 sessions; this bounded limit is a deliberate addition to the unbounded prototype and must match server validation.

Desktop uses a split month dialog. At 650px and below the same month dialog fills the screen and the same day editor is teleported into its own dialog. Mobile navigation uses `scheduleMonth=YYYY-MM&scheduleMode=weekly|monthly` on the current Vue route. Back closes the workspace, direct links restore an existing configuration, and calendar navigation does not remount the form. Date grids start on Monday and use the event-local current date supplied by the existing timezone utility.

## Exact save contract

Extend the existing routes; the frontend does not invent a second schedule endpoint:

- `POST /api/create-event`: create a draft, including incomplete schedule drafts.
- `GET /api/create-event/{id}`: return the full draft, stable identifiers and current integer version.
- `PATCH /api/create-event/{id}`: atomically merge changed event fields and replace the explicitly supplied recurrence draft using the existing optimistic `version`.
- `POST /api/create-event/{id}/publish`: validate and publish the active configuration transactionally. Reject publication while supporting infrastructure is incomplete.

The existing `eventType` is `recurring`; `timeZone` remains the event's IANA timezone. The `recurrence` field is now a tagged union: unchanged legacy rules, or this V12 representation:

```json
{
  "schemaVersion": 2,
  "activeMode": "weekly",
  "configurations": {
    "weekly": {
      "startDate": "2026-11-25",
      "endDateExclusive": "2026-12-10",
      "days": {
        "2026-11-26": {
          "id": 501,
          "inheritance": "source",
          "sessions": [{ "id": 901, "startTime": "09:30", "endTime": "10:30" }]
        },
        "2026-11-28": { "inheritance": "exception", "sessions": [] }
      },
      "drafts": {},
      "sharedTemplate": {
        "sourceDate": "2026-11-26",
        "sessions": [{ "startTime": "09:30", "endTime": "10:30" }]
      }
    },
    "monthly": {
      "startDate": null,
      "endDateExclusive": null,
      "days": {},
      "drafts": {},
      "sharedTemplate": null
    }
  }
}
```

`days` and `drafts` are date-keyed objects, not arrays. Return empty maps as `{}`, including when PHP associative decoding would otherwise re-encode them as `[]`. The client rejects malformed or unknown schedule versions instead of opening them in the legacy editor. An absent key means no day; an existing key with `sessions: []` means a day with no known times. Session/day IDs are optional for new records and supplied by Laravel once persisted. Never copy a session ID from one date to another. Inheritance is `independent`, `source`, `linked`, or `exception`.

Empty range dates and unfinished time values use `null` on the wire, matching Laravel's empty-string normalization. The API adapter restores blank strings inside the Vue form; do not invent dates or times.

`drafts[date]` is an editor-only object: `{ slots: [{ id?, startTime, endTime }], repeat: boolean, share: null|boolean, detached: boolean }`. Partial/invalid slots can be persisted here for recovery but cannot be published. `share: null` means unchanged; true/false are pending enable/disable choices. Persisting this object must not perform a pending bulk action.

Both configurations round-trip, including the inactive draft. Range changes retain out-of-range `days` and `drafts` for editing recovery; these are retained draft records, **not active public occurrences**. Only keys in `[startDate, endDateExclusive)` form the active schedule. A range change affecting booked occurrences must be rejected or use the existing controlled lifecycle workflow before changing the public snapshot.

For a new V12 event, root `startsAtLocal` / `endsAtLocal` may be null: a day without times must not acquire invented midnight sessions. Derive any parent summary timestamps on the server from actual publishable sessions and define date-only discovery behavior separately. Do not apply the legacy required-single-timestamp validation to this tagged schedule variant. The editor-section adapter now also forwards the existing `startsAtLocal` / `endsAtLocal` fields correctly when saving legacy event dates.

Responses retain the current envelope `{ data: { id, version, status, form: { ..., recurrence } } }`. The frontend compares the returned V12 content with the submitted draft, ignoring assigned IDs. Missing, downgraded, or partially dropped schedules produce an error instead of a success toast. The supplied contract must round-trip without silently clearing drafts, inactive configurations, exceptions or retained dates.

When recurring is switched off, its local draft is retained until the form is discarded; a one-time save continues to submit `recurrence: null` under the existing contract. Persisting a disabled schedule across reloads would require a separate agreed inactive-draft contract; it is not represented as an active recurring event.

## Backend implementation sequence

1. Extend the existing tagged recurrence validator and resource, preserving legacy input/output. Validate mode, strict date keys, exclusive bounds, calendar-year clamping, inheritance values, template/source references, session format, maximum 24 sessions/date, duplicates and overlap. Bound the total draft payload, including retained dates and unfinished drafts. Use event-local dates, not browser-local UTC conversions.
2. Persist both configurations and editor metadata in the existing JSON draft with event ownership, Sanctum/CSRF checks, and the existing integer version. Save atomically; return 409/428 on stale/missing versions, 422 for validation, and safe user-facing errors. Add idempotency to draft creation and protect retries so a timeout does not create a second event. The current client does not claim create-request idempotency.
3. Introduce forward-compatible concrete event-day/session records for published schedules, with stable IDs, foreign keys and a unique date per schedule. Keep an unpublished draft separate from public materialization. Resolve local times into UTC using the parent IANA timezone and a documented DST policy. Never accept session/day IDs belonging to another event.
4. Publish the active mode only, in a transaction with the event version check and appropriate locks. Reject unfinished active drafts; date-only days are allowed but need an explicit discovery/booking policy. Reconcile by stable ID/date, avoiding duplicate sessions on retries. Do not hard-delete or silently move booked occurrences.
5. Connect public discovery, event details, purchasing and admission to the published snapshot. Existing event-wide ticket inventory and historical prices must not be multiplied or rewritten by adding sessions. Occurrence-specific stock, ticket choice and admission entitlements are unresolved product/domain decisions and are publication blockers until agreed and implemented.
6. Enforce the exclusive end boundary in authenticated/public listing and new-purchase queries using event timezone, independently of background jobs. Keep organiser history, purchases, receipts and authorised ticket access intact. Send any reschedule/cancellation notifications after commit through the existing delivery infrastructure.

Do not run destructive migrations or reset records. Do not expose new public V12 purchases based only on JSON accepted by the draft endpoint. Partial infrastructure may support draft saves while publication remains explicitly unavailable.

## Verification and release gate

Frontend checks: `node scripts/check-explicit-schedule.mjs`, `node scripts/check-recurrence-ui.mjs` (legacy regression), `node scripts/check-workspace-editor.mjs`, targeted ESLint, and `npm.cmd run build`. Network checks in the new suite use mocked responses; they do not prove real database persistence or browser behavior.

Backend integration must test authorised success and reload, invalid/oversized payloads, foreign IDs, denied access, timezone midnight/DST cases, exclusive-end discovery/purchases, stale concurrent edits, duplicate creates/retries, failed transactions, protected booked-session edits, pending bulk intent, and inactive-mode isolation. Use isolated test databases and preserve historical records.

Then verify the actual app at desktop/mobile widths: keyboard/focus, Escape/Back, direct links after authenticated loading, native dialog nesting, minute dropdown positioning, resize while editing, shared-time checkbox timing, and real save/reload/publish. Browser access was denied in the current session, so these visual interactions remain unverified.

This phase adds no migrations and changes no backend files. **The new recurring experience is not ready for a production end-to-end release until the existing Laravel save contract and publication/domain blockers above are resolved.**
