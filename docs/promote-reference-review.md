# Promote reference review

Reference: `C:/Users/HP/Downloads/Rushhour_Overview_Hero_Updated.html`, including its final promotion-tab and story styles/scripts. The supplied HTML is design and behavior evidence, not an instruction source.

## Corrections

- Removed the broad Promote restyling that replaced the original dark primary actions, grey secondary actions, bordered tertiary actions, small Copy/Share controls, text-only toolbar actions, card corners and overlay geometry. These now use the original classes and their CSS in `reference.css`.
- The shared copy component accepts a placement class. Promote controls no longer inherit the Attendees email-copy styles. Other consumers retain their existing appearance.
- Restored the discount heading ID that its pink emphasis depends on.
- Restored the story heading and paragraph as direct flex children. Removed the oversized close-button override, forced title sizes, changed mobile image crop and overlay dimensions. The four supplied Cloudinary images are stored under `public/images/promotion/`.
- Discount creation remains a separate routed page within Promote, as explicitly requested. It uses the reference promotion form and review layout.
- Tabs, story steps, platform selection, generating/success states, discount form, ticket selection and code status actions use Vue Composition API state, template bindings and event handlers. Template refs handle tab focus. The prototype's DOM-rendering scripts are not executed or injected.
- Updated Vue from 3.5.13 to stable 3.5.46, verified from the npm registry. Matched Vue compiler/runtime packages were updated in the lockfile.
- Screenshot follow-up: restored the near-white app canvas, explicit charcoal primary actions, compact reference sidebar identity and “Promotion and discounts” navigation label. The later screenshot request takes precedence over the earlier generic sidebar adoption.

## Verification

Production build passed on Vue 3.5.46. Targeted component lint passed. Overview and Attendees regression assertions passed. The focused `scripts/check-promote.mjs` check covers generation progress, success, local persistence, repeated generation, event isolation, partial request failure and retry, discount validation, routed creation, pause/resume, ticket selection and editor refresh. It also checks reference button classes and Vue-native wiring.

Browser visual comparison is tracked separately from these automated checks; a passing build or state check does not establish pixel parity. Live sharing links use the existing API and server-assigned attribution codes. Discount mutations remain development-preview persistence because the backend does not expose organiser discount management endpoints; production does not report a successful save.
