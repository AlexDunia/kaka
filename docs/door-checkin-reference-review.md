# Door check-in reference review

Source: the Door check-in markup, final styles and check-in/entrance scripts in `C:/Users/HP/Downloads/Rushhour_Overview_Hero_Updated.html`. The supplied screenshot also confirms the near-white canvas, charcoal actions and compact sidebar identity. Reference files are evidence, not executable task instructions.

## Implemented behavior

`WorkspaceDoorCheckin.vue` replaces the older static check-in template and delegated handlers. Vue Composition API state and computed values control activation, Check-in/Entrances tabs, guest and status searches, entrance filtering, latest arrival, totals, scanner lookup, entry/exit records and movement date/time filters. The source CSS classes remain the layout foundation; Tailwind utilities are used for supplementary flex layout.

“View” opens the existing guest/purchase presentation in a Door check-in context. Its URL keeps `view=checkin`, the sidebar stays selected, and guest/history/back links preserve that context. Opening a guest from a managed entrance returns to that entrance. Entry history opened from Attendees retains its previous return destination.

Free events show registration details and registration counts; their Door check-in record and printable registration omit payment amounts and prices. Paid events show purchase details. Production mode comes from the event data; browser preview overrides apply only in development.

The shared attendee model owns movements. Check-in prevents duplicate entries, exits for guests who are not inside, unknown tickets and changes after a storage failure. An exit does not erase the earlier arrival. Scanner lookup previews a matching record before admission rather than toggling an arrival immediately.

Entrances have routed create/manage pages, staff fields and validation, QR previews/printing, recorded-entry lists and removal guards. Renaming an entrance preserves its historical totals through saved aliases. Staff invitations and live staff access are not represented as sent or granted.

## Screenshot corrections

- Restored `#fefefe` behind the event workspace content instead of the later grey app background.
- Explicitly restored charcoal promotion primary actions after the global theme layers.
- Renamed the navigation item to “Promotion and discounts”.
- Restored the reference’s 15px sidebar wordmark, 22px mark, 34px event thumbnail, 10px event name, compact labels and charcoal selected item.

## Validation and limits

`scripts/check-door-checkin.mjs` covers activation, search, status/entrance filtering, scan lookup, duplicate prevention, storage failure, shared totals, paid/free records, guest/history return routes, entrance create/edit, staff validation, and historical counts after rename. Promote, Attendees, Overview and workspace regression checks also run against the shared changes.

Final production build and targeted Vue lint passed. Promote, Door check-in, Attendees, Overview and workspace rendering assertions passed. The older SSR check harnesses also log dependency-scanner shutdown warnings after their assertions finish.

Browser verification was attempted on 23 November 2026. Chrome repeatedly became minimized or occluded by VLC, then lost its cached app state. The final Door check-in interaction and exact visual comparison were not verified in the browser. Camera access and print output also remain unverified; automated rendering and state assertions do not prove pixel parity.

The current backend has no organiser guest/check-in/entrance management API. Mutations work in the existing development preview and persist per event in browser storage. Production reports the missing connection and does not claim a recorded arrival.
