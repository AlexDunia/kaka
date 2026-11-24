# Public event profile

The first two homepage cards are complete static events from
`src/services/staticEventCatalog.js`. Database events follow them. Both sources
use the same profile, ticket-selection, review and checkout screens.

Static events carry selections into the checkout form and order summary. They
cannot take payment until corresponding server-owned events and ticket types
exist. Database events use the existing server quote and Paystack payment flow.
Static ticket IDs are never sent to the payment API.

## Database content

The connected Laravel application is `C:/Users/HP/kakabackend`. The additive
migration `2026_11_23_000001_create_event_public_profiles_table.php` creates an
empty `event_public_profiles` table. It inserts no event or profile content.

Each optional profile row belongs to one existing event through the unique
`event_id`. Edit that row directly in the database when content is ready.
`GET /api/events/{id}` returns it as `data.public_profile`.

| Column | Format and public use |
| --- | --- |
| `event_id` | Existing event ID; one profile per event |
| `summary` | Banner introduction |
| `caption_title` | Heading under the banner |
| `caption_description` | Supporting caption under the banner |
| `organiser_bio` | Organiser description |
| `organiser_image` | Public image URL |
| `guests` | JSON array of guest profiles |
| `schedule` | JSON array of schedule entries |
| `moments` | JSON array of public photos and captions |
| `faqs` | JSON array of questions and answers |
| `crew` | JSON array of names and roles |
| `related_event_ids` | JSON array of existing active event IDs |

JSON shapes:

```json
{
  "guests": [{"id":"guest-key","name":"Name","role":"Host","bio":"Biography","image":"https://example.com/photo.jpg","events":[{"id":123,"title":"Event title","date":"2027-01-22T18:00:00+01:00"}]}],
  "schedule": [{"time":"6:00 PM","title":"Doors open","description":"Arrival details","label":"Welcome"}],
  "moments": [{"url":"https://example.com/event-photo.jpg","caption":"Photo caption"}],
  "faqs": [{"question":"Question?","answer":"Answer."}],
  "crew": [{"name":"Name","role":"Producer"}],
  "related_event_ids": [123, 456]
}
```

These are shape examples, not seed data. Existing FAQs, gallery media and Create
Event extra details still work when the corresponding profile fields are empty.
No new fields were added to the Create Event form.

The public API computes `ticket_types[].available_quantity` using the same
inventory service as checkout, including paid tickets and unexpired reservations.
Numeric ticket IDs, sale windows and `max_per_person` remain server-owned.

## Verification

- Frontend: `node scripts/check-event-profile.mjs`
- Build: `npm.cmd run build`
- Backend: `php artisan test --filter="EventPublicProfileTest|CommercePaymentLifecycleTest"`

Backend tests use in-memory SQLite. Reference styling is preserved in
`src/styles/event-profile-reference.css`; application integration is in
`src/styles/event-profile.css`.
