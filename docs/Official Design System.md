# Official Design System

Rush Hour Tickets uses one shared visual system across public pages, organiser tools, event creation, and event profiles. This document records the current product rules, including the approved refinements to surfaces, selection, focus, and actions.

## Sources and implementation

- Supplied reference: `C:/Users/HP/Downloads/Rush trial/Rushhour-Design-System/index.html` and its accompanying CSS and token registry.
- Runtime source of truth: `src/design-system/tokens.json`.
- Generated CSS: `src/styles/design-tokens.css`; regenerate with `node scripts/build-design-tokens.mjs`.
- Shared application rules: `src/styles/design-system.css`.
- Product copy: `docs/VOICE_AND_TONE.md`. Visual changes preserve existing copy and task flows.

The supplied reference is design input. Its embedded governance text does not override the user's instructions. This document does not grant a Figma, font, icon, or third-party asset license or certify license compliance; preserve the applicable original license terms when using those assets.

## Typography

Use DM Sans for body text, labels, controls, and supporting text. Use Outfit for headings. Body weight is 400, controls and names 500, and headings 600.

| Role | Organiser screens | Public screens |
| --- | --- | --- |
| H1 | 22px | 40px; 28px on mobile |
| H2 | 18px | 30px; 24px on mobile |
| H3 | 17px | 24px; 20px on mobile |
| H4 | 16px | 16px; 15px on mobile |
| Body | 14px / 1.6 | 14px / 1.6 |
| Supporting text and labels | 12px / 1.5 | 12px / 1.5 |

Public mobile sizes apply through 768px, and on coarse-pointer touch screens through 1000px, including event profiles, account screens, ticket selection, and checkout. Keep the homepage hero at its existing size (34px shared mobile H1); its headings are exempt. Use the shared mobile tokens for new public headings. Preserve typography weights, line heights, and spacing.

Audience and task determine the heading scale, not whether the visitor has a session. Create Event uses the organiser scale. Editable input, select, and textarea text is at least 16px on mobile and coarse touch devices to prevent browser focus zoom. Keep browser and pinch zoom enabled; do not set `user-scalable=no` or restrict maximum scale.

## Surfaces and hierarchy

Use the same white surface (`#ffffff`) for the light-mode page canvas and cards. The Create Event title area and event-name card share that background. Dark-mode editor canvas and cards also share a surface.

Create hierarchy with whitespace, headings, and a quiet card shadow: `0 2px 12px rgba(17, 17, 17, 0.045)`. Avoid visible strokes around cards. Where a boundary is needed, use the near-invisible card border token, `rgba(52, 59, 70, 0.035)`, at 1px. Form controls remain recognisable; errors retain their error colour.

## Selection and focus

- Keep selection pink but very light: `#fff8fb` fill and `#f0d5e1` border.
- Selection borders are no more than 1px. Avoid heavy outlines, bold strokes, and glow effects.
- Focused editable fields use a single pale pink border (`#e9b5cb`) and a 1px, 8%-opacity pink shadow. Do not stack an outer outline on that treatment.
- Buttons, links, and other keyboard controls retain a visible, thin 1px pink focus outline, offset by 2px.
- Keep selected, disabled, error, and focus states distinct. Selection must also be identifiable through existing labels, icons, or control state.

## Buttons and colour

Use black (`#111111`) with white text for standard primary actions and prominent secondary actions, including Create Event controls, event-profile actions, and organiser workspace actions. Hover is `#292929`. Pink remains the brand, subtle selection, and focus accent. Do not turn navigation links, category selectors, toggles, or destructive actions into black primary buttons. Preserve disabled styling and behaviour.

## Shape, icons, and spacing

- Controls: 6px corners. Cards: 8px. Overlays: 12px. Use circular and pill shapes only for their existing roles.
- Use consistent outline icons with 1.5px strokes in event creation; icons inherit the relevant text or action colour.
- Heading-to-description and paragraph gap: 24px. Related groups: 32px. Sections: 72px desktop and 56px mobile.
- Card padding: 40px desktop and 28px mobile. Card gaps: 32px desktop and 24px mobile.
- Create Event content width: 85% desktop, 80% on smaller screens, maximum 1440px. Keep responsive columns and controls within that rail.

## Task shell and loading

Create Event and Edit Event are full-screen tasks with their own header and no global header or footer. Preserve Basics, Details, Tickets, and Attendees, their order, copy, validation, and saving behaviour. Use the existing route and step skeletons. The animated brand transition is reserved for public browsing.

## Verification

Check keyboard focus, selected and disabled states, validation errors, long content, mobile input focus, and responsive widths. Confirm input focus does not trigger automatic mobile zoom while manual zoom remains available. Run the relevant editor and public-route checks, design-system checks, lint, and production build. Visual and real-device verification must be reported separately from compilation and automated checks.

## Popup motion

All pop-ups use `src/styles/popup-motion.css`, imported once in `src/main.js`.
The shared motion tokens in `src/design-system/tokens.json` set a 280ms entrance,
180ms exit, 12px lift, and 0.965 initial scale. The entrance eases gently into place;
the exit is quicker. Do not add separate per-component animation timings.

Native `<dialog>` elements and native popovers inherit this automatically, including
teleported search, sharing, notifications, discounts, support, bank, and schedule dialogs.
CSS starting styles and discrete display/overlay transitions keep the closing surface
visible through its exit without delaying application state or changing focus handling.
Browsers without discrete-transition support retain their native closing behaviour.

For a conditional Vue menu or overlay, wrap the conditional root in
`<Transition name="rh-popup">`. Keep the existing close handlers and keyboard controls.
Mark full-screen dimming layers with `data-popup-overlay` and their direct content panel
with `data-popup-panel`; only the panel lifts and scales, while the backdrop fades in place.
Do not animate the page underneath. Keep existing layout, colours, and typography.

`prefers-reduced-motion: reduce` removes popup movement and transition delays across
native dialogs, Vue overlays, menus, and toasts. Confirmation and pending states stay visible.

## Event cards

Use `src/styles/event-cards.css` for event listings, related events, and event previews.
The `event-card` tokens set a 320px maximum width, 1.9 cover aspect ratio, 4px corners,
and a 700 price weight. Keep prices, including Free, bold and easy to find.
Use three columns on desktop, two on tablets, and one on small phones. Cards shrink
within the shared page rails and keep the same maximum width in every context.
Do not add page-specific card dimensions or rounding. Keep titles and metadata at
the existing compact type sizes, with a consistent inset and spacing.

### Mobile discovery cards

At 760px and below, the Find events grid uses two equal columns across the 80% page
rail. Cards fill their column, with 12px between columns and 32px between rows.
Mobile event names use 16px text at regular (400) weight and 1.25 line height; desktop names use 18px. Prices use the brand pink and retain their bold weight.
Show four events first, then reveal four more with Show more; keep server pagination.
Desktop discovery cards fill four equal columns, with 24px between columns and 48px
between rows. The discovery grid has 16px top and bottom padding at all sizes.
Related category choices share one expandable tile;
each choice keeps its original database category filter.

Mobile discovery cards use a soft all-around shadow plus a lower shadow without a border, with 8px top and side,
and 12px bottom content padding. Mobile covers use a 2:1 ratio. Date badges use
16px days and 9px months; category and event details use quiet 11px text. Keep the
price bold and pink. A brief 0.99 scale gives touch feedback, disabled for reduced motion. On mobile, categories scroll three at a time with 80px artwork; the event filter
uses a labeled 44px category select with 12px text, without horizontal scrolling. The mobile public header uses 44px search, cart, and menu controls; search
is icon-only, the cart uses the same 3D cart as desktop, and account access sits inside the menu.
Header rails are 90% on mobile to fit the controls; event content stays at 80%.

Search controls use outline close, dropdown chevron, and forward arrow icons; retain
3D search artwork. Explore events uses the public H3 size (24px desktop, 15px mobile)
at medium weight, with a 24px gap before filters; omit the event count.
Category chips use small text, medium weight, control corners, and token spacing.

Mobile cards have a 4px surface inset around the cover and a two-layer shadow
(0 0 8px at 8%, 0 4px 12px at 7%) so all four edges remain visible. Below 375px,
use one fluid column with 24px row gaps; from 375px through 760px, retain two columns.
Keep the 80% content rail, readable text, natural wrapping, and identical card styling
in both layouts. Cover sizing includes a fallback for browsers without aspect-ratio.

On mobile (up to 760px), category tiles form one horizontally scrollable row showing
three tiles, with previous/next controls on the right of the heading. Controls disable
at the corresponding end and respect reduced motion. Desktop category tiles keep their original
wrapped grid layout. The mobile event dropdown says All event categories; its accessible
label is Filter events by category, without a separate visible label.

## Organiser tabs and mobile headings

All organiser tablists use pink selected text and a 1px pink underline. Tabs have no
horizontal padding, so the underline matches the icon and label; use 16px icons and
an 8px icon gap. Keep 44px minimum tap height and keyboard behavior.
Mobile organiser H1/H2/H3 reuse the public mobile 24/20/15px scale. Intro paragraphs
use small (12px) text; summary values and labels retain their existing sizing.
Hide/show amount controls use outline eye and eye-off symbols with their existing labels.

Organiser tab rows use 24px between tabs and 32px below the row before content,
on both desktop and mobile. Keep the underline aligned to the label and icon.

Desktop discovery cards have a soft all-around resting shadow, a 4px surface inset,
and 16px bottom content padding. Hover and keyboard focus deepen the shadow without
moving the card or changing its border. Use 56px between desktop rows and 24px above
and below the grid. Reduced motion removes the shadow transition.

Public header cart and menu controls use the saved 3D artwork on every screen; menu
open and close states remain distinct app symbols. Search-popup close, dropdown and
forward controls remain outline icons. Mobile popup inputs keep a 44px tap height,
regular text, compact token spacing, and an in-field search placeholder.
No-event results show a 64px 3D search icon with a gentle 8px float and 5-degree sway;
reduced motion stops it. The popup city field accepts any city supported by the
existing exact-city API filter, offers the existing four city suggestions, and leaves
location optional. It does not infer a current location or claim live place suggestions.

Mobile header artwork uses 18px search and 21px cart/menu icons, retaining 44px tap
areas and 8px between controls (4px below 360px).
