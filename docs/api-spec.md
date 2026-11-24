# Rush Hour API contract

Frontend service integration map. The [authoritative route inventory and shared API specification](../../kakabackend/docs/api-spec.md) is maintained in the Laravel repository. This companion is verified against local Laravel routes/controllers and active Vue callers on 24 November 2026. This replaces the old proposed API and bearer-token examples. Laravel source is authoritative; this document describes the current implementation, including gaps.

## Transport and common rules

- Vue uses the relative `/api` base and credentialed Sanctum sessions. Before authenticated/stateful mutations, obtain `/sanctum/csrf-cookie` using the existing standalone credentialed Axios request. Do not put session, recovery or checkout credentials in URLs or logs.
- `/api/user` returns the user object directly; login/register return `{user,message}`. Most domain detail/mutation routes return `{data:record}`. Owner collections use a Laravel paginator `{data,current_page,last_page,per_page,total,...}`. Public events use `{data,meta:{current_page,last_page,per_page,total,...},links}`. Do not guess an array from arbitrary object properties.
- Numeric event/product/item/attendee IDs are server-assigned. Order, ticket and refund public IDs are strings. UUID operation keys are client-created and stable for an unchanged retry. A UI ticket key is never a persisted ticket ID.
- Commerce amounts ending `_minor` are integer minor units. Editor ticket `price` is a major-unit decimal string with up to two fractional digits. Public product prices are major units; never use them as checkout authority. Currency groups are independent. Null provider fees mean unknown, not zero.
- Saved instants include an offset/UTC; event-local wall-clock fields use the saved IANA timezone. Never append `Z` to an unconverted local input. Editor responses include saved instants, local fields and `version`.
- Typical errors: 401 unauthenticated, 403 forbidden, 404 absent/private resource, 409 stale version or business conflict, 410 retired mutation, 419 CSRF/session expired, 422 `{message,errors}` validation, 428 missing editor version, 429 rate limit, 5xx safe API error. Never optimistically claim payment, admission, refund or bank verification from a timeout or 202.

## Authentication (existing configuration preserved)

| Method/path | Request | Response/access |
| --- | --- | --- |
| POST `/login` | email, password | `{user,message}`; regenerates session |
| POST `/register` | name, email, password, password_confirmation | 201 `{user,message}`; creates session |
| GET `/user` | none | authenticated user object |
| POST `/logout` | none | authenticated; invalidates session |
| POST `/forgot-password` | email | safe reset request response; limited |
| POST `/reset-password` | token, email, password, password_confirmation | existing password reset contract |
| GET `/auth/google` | browser navigation | external provider redirect |
| GET `/auth/google/callback` | provider callback | frontend success or failure redirect |

Current Google implementation is stateless, can overwrite an existing password during email-based linking and can include provider exception text in failure redirects. These are release findings, not approved recommended behavior. See the Phase 7 report. Live Google verification remains pending; no authentication code/configuration was changed.

## Public catalog and attribution

| Method/path | Parameters/body | Current behavior |
| --- | --- | --- |
| GET `/events` | page, per_page 1..100; q <=200 chars/20 words; city; category or category_id; subcategory_id; date_from/date_to; featured boolean; sort: date-asc/date-desc/price-asc/price-desc/latest | bounded public paginator; published, non-cancelled/non-archived discovery |
| GET `/events/{id}` | numeric ID | `{data:event}`; active published details; cancelled notice allowed, archived/draft 404 |
| GET `/categories`, `/subcategories` | subcategories accepts category_id | server taxonomies |
| POST `/events/{id}/track-view` | visitor_id UUID, optional source_code | public deduplicated attribution; deliberate CSRF exception, rate-limited |
| POST `/events/{id}/toggle-like` | none | authenticated like toggle |
| GET `/events/{id}/check-liked` | none | authenticated like state |
| GET `/user/liked-events` | page | authorized liked events |
| GET `/recommendations` | none | authenticated grouped recommendations, bounded backend results |
| POST `/recommendations/clear-cache` | none | authenticated cache refresh |

Public serialization explicitly selects safe organizer/profile/media fields. `booking_supported:false` closes both paid and free controls; a public detail response is not booking authority. `staticEventCatalog`/preview services are development fixtures only. `blogService` deliberately rejects calls; no Laravel blog API exists.

## Event editor

Owner session required. All writes share server validation and version rules.

| Method/path | Body | Response |
| --- | --- | --- |
| POST `/create-event` | partial draft editor fields | 201 `{data:{id,status,title,version,form}}` |
| GET `/create-event/{id}` | none | same editor record shape |
| PATCH `/create-event/{id}` | version plus changed editor fields | same shape and next version |
| POST `/create-event/{id}/publish` | version | validates publication fundamentals and returns saved editor |

Editor fields include title, category, description, startsAt/endsAt or startsAtLocal/endsAtLocal, timeZone, eventType, format, venue/city/address or meetingLink, organizer details, ticketMode/freeCapacity, tickets, media, attendeeFields, extraDetails and supported publicProfile fields. Incomplete drafts are allowed, supplied values still validate. Full wizard ticket saves use `ticketCollectionMode:replace`; partial workspace saves merge only supplied persisted products. Removed committed products retire; historical names, amounts and admission semantics stay immutable. Never retry a stale full array against a new version without review. Original POST/PUT/DELETE `/events` mutations are retired (410).

## Checkout and buyer retrieval

| Method/path | Body/capability | Result |
| --- | --- | --- |
| POST `/checkout/quote` | items: 1..25 distinct `{ticket_type_id,quantity:1..20}`; optional discount `{event_id,code}` | `{data:quote}` with canonical currency, line totals, discounts, total, availability and registration schemas |
| POST `/checkout/initialize` | checkout_token UUID; optional visitor_id; customer first_name/last_name/email/phone; same items/discount; attendees per persisted product unit/seat with answers | `{data:{order,payment}}`; same intention token retries same attempt; zero-charge registered order has null payment |
| POST `/checkout/payments/{reference}/verify` | `X-Checkout-Token`, owner session or supported recovery capability | `{data:protected order}`; provider verification is authoritative |
| GET `/checkout/orders/{publicId}` | same capability rules, `X-Order-Recovery-Token` supported | protected order and server-issued ticket status/credentials |
| POST `/checkout/orders/{publicId}/cancel` | buyer/capability | cancels supported unpaid attempts; fulfilled/review 409; not a refund |
| GET `/buyer/orders` | authenticated; page, per_page <=20 from current caller | paginator of authorized historical orders |
| GET `/buyer/tickets/{publicId}` | authorized buyer/order capability per controller | protected ticket retrieval |
| POST `/checkout/recovery/request` | order_public_id, email | enumeration-safe request; durable recovery email |
| POST `/checkout/recovery/exchange` | emailed recovery token | short-lived order capability; do not persist credentials in URL |
| POST `/payments/paystack/webhook` | raw signed provider body | signature-verified durable reconciliation; never browser-controlled success |

Paid checkout requires the configured registration answer set per seat. Free flow: GET `/events/{id}/registration` returns supported availability/schema; POST `/events/{id}/registrations` accepts checkout_token, quantity 1..20, customer, attendees `{unit_index,seat_index:0,answers}`. It returns `{data:protected order}` without inventing a product ID or opening payment UI.

Order states include pending_payment, payment_review, payment_failed, expired, paid, registered, partially_refunded, refunded and cancelled. A partially refunded order can retain valid unrelated credentials. Protected items expose original line_total_minor, discount_minor, refunded_minor, refunded_quantity and ticket status; only valid server-issued credentials render QR codes.

## Event operations

Root `/event-operations/{event}`. Backend authorizes owner/assigned staff on every request; changing an identifier does not grant another event's access. Unless noted, collections accept page/per_page (maximum 100; current caller uses 30).

| Method/path below root | Request | Access/result |
| --- | --- | --- |
| GET `/attendees` | page, per_page, q | authorized indexed server lookup; paginator, total independent of page length |
| PATCH `/attendees/{id}` | version, answers | authorized versioned edit; saved record |
| GET `/purchases` | page, per_page, q buyer email/order prefix | persisted event order-item lines with order summary; no ticket/source-specific filter |
| GET `/attendees/export` | q | authorized streamed CSV |
| POST `/tickets/{ticketPublicId}/resend` | none | authorized delivery request; not inbox confirmation |
| GET `/admission` | none | minimal event/staff/entrance context |
| POST `/admission/lookup` | token, entrance_id, optional direction in/out | minimal credential entitlement; exit lookup permits inside revoked credentials |
| POST `/admission/movements` | token, entrance_id, direction in/out, count, request_key UUID | server-confirmed movement only; same UUID retries same request |
| GET `/admission/history` | page/filter fields supported by controller | authorized paginated immutable movement history |
| PUT `/admission/settings` | allow_reentry boolean | owner policy |
| GET/POST `/entrances`; PUT `/entrances/{id}` | supported name, active, opens_at/closes_at | owner management; assigned staff context is scoped |
| GET `/staff` | page, per_page | owner paginated memberships/invitations |
| POST `/staff/invitations` | email, role door, entrance_id | owner durable invitation |
| DELETE `/staff/{id}` or `/staff/invitations/{id}` | none | owner revocation |

POST `/event-staff/invitations/accept` uses an authenticated session and emailed invitation token. Staff receive the door interface, not organizer finances/customer exports. Camera is optional; manual credential lookup remains available.

## Dashboard and finance

| Method/path | Contract |
| --- | --- |
| GET `/dashboard/events` | owner paginator, default 30/max100; page metadata must be preserved |
| GET `/dashboard/events/{id}/overview` | owner `{data:overview}`; event, current inventory, currency-scoped revenue/chart, attribution and currency-partitioned `metrics` |
| GET/POST `/dashboard/events/{id}/share-links` | owner list or `{label}` create; server source_code |
| GET root `/earnings` | owner `{data:metrics}` with by_currency, actual_attendance, currently_inside |
| GET root `/refunds` | owner paginator, max100 |
| POST root `/orders/{orderPublicId}/refunds` | request_key UUID, order_item_ids 1..25, reason 3..300; 202 `{data:refund}` |
| POST root `/refunds/{refundPublicId}/retry` | owner; same provider reference verification; 202 status |
| POST root `/lifecycle` | current version, action close_sales/open_sales/set_cutoff/complete/cancel/archive; cancel reason; nullable explicit-offset booking_cutoff_at |
| GET root `/financial-audit` | owner event audit paginator, max100; no global internal audit access |
| GET `/seller/banks` | current user, page 1..100, provider-supported Nigerian NGN list |
| GET `/seller/payout-accounts` | current user's masked account versions, 20/page |
| POST `/seller/payout-accounts` | bank_code 3..9 digits, account_number exactly10; 202 masked pending/review/active record |

Financial metrics retain original gross/discount/charge/fee snapshots and separately report confirmed refunds, reversed platform fees, remaining seller proceeds, pending settlement, confirmed seller settlement and recovery due. Unknown provider/legacy refund facts remain unknown. Seller proceeds/platform receipt are not seller bank settlement or withdrawable balance. Refund states: queued, processing, processed, voided, attention. Only complete persisted lines can be refunded; normal refunds reject an admitted line, cancellation has a separate policy. Suspended credentials remain unavailable until confirmed resolution.

No withdrawal/transfer API or owner settlement-statement list exists. Editor reads now include lifecycle_state and nullable booking_cutoff_at; Vue loads the saved cutoff and preserves unsaved edits on revision reload. Individual settlement statements remain an explicit limitation.

## Backend-supported but incomplete Vue integration

Owner root `/discounts`: GET paginator; POST create; PUT `/{id}` versioned offer. Fields: code, name, partner nullable, type percent/fixed, integer value (fixed minor units), usage_limit, active, nullable offset starts_at/ends_at, nullable actual ticket_type_ids. Quote/init accept a single event-scoped code; changing its intention needs a new checkout token. Current Vue promotion forms and checkout service do not send this contract; they explicitly remain unavailable in production.

Owner root `/messages`: GET paginator; POST draft; PUT `/{id}` with version; POST `/{id}/send` with version; POST `/{id}/retry`; POST `/messages/audience` for count. Fields: subject <=150 without newlines, body <=20000, purpose event_update/marketing, audience all_ticket_holders/ticket_types/checked_in, ticket_type_ids when required. Status/counts are durable; mail transport acceptance does not prove inbox delivery. Current Vue message composition/drafts/delivery integration is incomplete.

Backend also supports protected order marketing preferences and signed unsubscribe routes. No frontend service currently uses those flows. Two-factor setup, recurring occurrence booking, blog content and unsupported seller transfers are not implemented release capabilities.
