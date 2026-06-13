# AI Project Deep Context

## Project Summary

This repository is a Vue 3 / Vite frontend application for an event marketplace and event creation platform, with a companion PHP backend in the `api/` and `backend/` folders. The frontend is the primary application layer, with event discovery, event page rendering, cart checkout, payment integration, event creation, and user authentication.

> The user explicitly asked: do not modify application code, do not refactor, do not fix bugs, only inspect and document.

## Core Technology Stack

- Vue 3
- Vite
- Pinia for state management
- Vue Router for client-side navigation
- Axios for API requests
- Heroicons for icons
- `qrcode.vue` for QR generation
- `uuid` for local unique IDs
- Paystack inline payment integration in `src/pages/Checkout.vue`
- Local and session storage in the browser for persistence

## Entry Points

- `package.json`: project scripts and dependencies
- `vite.config.js`: alias `@` -> `./src`
- `jsconfig.json`: path alias for editor tooling
- `src/main.js`: mounts Vue app, installs Pinia and router
- `src/App.vue`: global app shell, route skeletons, navigation, theme handling, `HeroSection` on home page, auth initialization

## Routing

The router is defined in `src/router/index.js`. Important routes include:

- `/` → `HomePage.vue`
- `/search` → `SearchPage.vue`
- `/login` → `LoginPage.vue`
- `/register` → `Register.vue`
- `/forgot-password` → `ForgotPassword.vue`
- `/music`, `/movies`, `/theatre`, `/sports`, `/festivals`, `/others` → `CategoryPage.vue`
- `/contact` → `ContactPage.vue`
- `/dashboard` → `Dashboard.vue` (requires auth)
- `/admin` → `Admin.vue` (requires admin)
- `/event/:id` → legacy event detail route
- `/events/:id-:slug` → `EventDetails.vue`
- `/create-event` → `CreateEvent.vue`
- `/checkout` → `Checkout.vue`
- `/cart` → `Cart.vue`
- `/blog` → `BlogList.vue`
- `/blog/:slug` → `BlogPost.vue`
- `/auth/google/success` → `GoogleCallback.vue`

Route meta is used for page titles and descriptions.

## State Management

### `src/stores/auth.js`

- Stores `user`, `isLoading`, `error`, `authProvider`
- Derived values: `isAuthenticated`, `isAdmin`
- Persists `user` and `authProvider` in `localStorage`
- Supports login/register/logout/fetch user/update/reset password/update password
- Uses `http://127.0.0.1:8000/api` endpoints with `axios` and `withCredentials`

### `src/stores/events.js`

- Stores `events`, `featuredEvents`, `currentEvent`, loading state, error state, search query, category, pagination
- Supports:
  - `fetchAllEvents`
  - `fetchEventById`
  - `fetchEventsByCategory`
  - `fetchFeaturedEvents`
  - `createEvent`
  - `updateEvent`
  - `deleteEvent`
  - `searchEvents`
  - `resetFilters`
  - `fetchEventBySlug`
- Includes caching logic and 5-minute freshness checks
- Uses both `eventService` and raw axios calls for likes and auth-dependent endpoints
- Handles inconsistent API response shapes and fallback search endpoint logic

### `src/stores/cart.js`

- Persists cart items in `sessionStorage`
- Exposes `items`, `itemCount`, `total`, `isEmpty`
- Supports `addItem`, `updateQuantity`, `removeItem`, `clearCart`

### `src/stores/purchases.js`

- Stores purchase history in state and exposes computed totals
- Supports user and admin purchase retrieval and create/cancel purchase
- Relies on `purchaseService.js` for local storage persistence and event ticket inventory updates

## Services and API Layer

### `src/services/eventService.js`

This is the main event data service.

Key behaviors:

- Uses `EVENTS_API_URL = http://127.0.0.1:8000/api/events`
- Uses fallback URL `http://localhost/api/test-search.php`
- Axios instance with:
  - `Content-Type: application/json`
  - 8-second timeout
  - request interceptor for CSRF token, random request ID, request sanitization
  - response interceptor that rejects on empty responses or `response.data.error`
- Provides methods:
  - `getAllEvents(page, limit)`
  - `getEventById(id)`
  - `getEventsByCategory(category, page, limit)`
  - `getFeaturedEvents(limit)`
  - `searchEvents(query, category, page, limit)`
  - `createEvent(eventData)`
  - `updateEvent(id, eventData)`
  - `deleteEvent(id)`
  - `getAllCategories()` and `getAllSubCategories()`
  - `getSubCategoriesByCategory(categoryId)`
  - `getEventBySlug(slug)`
  - cache cleanup `clearExpiredEventCache()`
- Uses `ensureMinLoadTime()` to keep loading skeleta visible
- Has a fallback API mechanism if the main API times out or is unavailable

### `src/services/createEventService.js`

Focuses on client-side event payload construction and draft saving.

- `DEFAULT_CREATE_EVENT_TIPS`: tip list used in `CreateEvent.vue`
- `buildCreateEventPayload(form)`: creates sanitized event payload with:
  - `title`, `startsAt`, `endsAt`
  - `recurring` config with `frequency`, `selectedDays`, `useDefaultTimes`, `perDayTimes`
  - `recurrence` metadata: `type`, `frequency`, `interval`, `unit`, `days`, `startDate`, `startTime`, `endTime`, `dayOverrides`, `stopMode`, `endDate`
  - `format`, `venue`, `meetingLink`, `category`, `description`, `organiser`, `tags`
  - `coverImage`, `secondaryImages`, `ticketMode`, `freeCapacity`, `tickets`, `attendeeFields`, `extraDetails`
- `saveCreateEventDraft(form)`: writes sanitized payload to `localStorage` under `kaka-create-event-draft`

### `src/services/purchaseService.js`

This is a local purchase simulator using browser storage.

- Uses `localStorage` key `purchases`
- Methods:
  - `getAllPurchases()`
  - `getPurchasesByUser(userId)`
  - `createPurchase(purchaseData)`
  - `cancelPurchase(purchaseId, userId)`
  - `getPurchaseStats()`
- `createPurchase()` calls `eventService.getEventById(eventId)` and `eventService.updateEvent(...)`
- Inventory is updated locally by mutating event state
- This service is not a remote checkout backend

## UI and Styling

### Global Styles

- `src/assets/main.css`: global CSS entry point
- `src/styles/theme.css`: theme CSS variables for light/dark mode

### Application Shell

- `src/App.vue` manages:
  - header/nav links, mobile menu, cart badge, auth links
  - route skeletons via `PageSkeleton.vue`
  - theme persistence and toggle
  - SEO meta updates using `useSeo`
  - hero section visible only on home route
  - route transition and loading skeleton timing

### Key Reusable Components

- `src/components/EventCard.vue`: reusable event tile for event listings
- `src/components/PageSkeleton.vue`: skeleton placeholder for route transitions and page-specific variants
- `src/components/HeroSection.vue`: hero banner with search and featured event highlights
- `src/components/DateTimePicker.vue` / `DateTimePickerInput.vue`: date/time selection used on create event and checkout
- `src/components/GoogleCallback.vue`: social auth redirect landing page
- `src/components/SeoImage.vue`: social preview image component
- `src/components/SkeletonLoader.vue`: generic skeleton loader

## Key Pages and Flow

### `src/pages/HomePage.vue`

- Loads all events and featured events on mount
- Uses `useLoading()` composable to avoid hanging UI
- Renders search results when `eventStore.searchQuery` is set
- Shows featured event cards and empty/fallback states

### `src/pages/EventDetails.vue`

- Loads event details from `eventStore.fetchEventById()` or `eventStore.fetchEventBySlug()`
- Supports likes via `eventStore.toggleLike()` / `checkLiked()`
- Renders QR code using `qrcode.vue`
- Supports add-to-cart and checkout prompts
- Uses `useSeo()` and `addEventStructuredData()` for page metadata
- Handles slug redirect / canonical event URL logic

### `src/pages/CreateEvent.vue`

This is the largest and most complex page.

- Multi-step wizard with sections: Basics, Details, Tickets, Attendees
- Event recurrence support with:
  - one-time vs recurring toggle
  - repeat frequency options: daily, weekly, monthly
  - selected days for weekly/monthly recurrence
  - per-day time overrides and default times
  - repeat start/end date and time fields
  - validations for recurrence readiness
- Event type options: in-person, online, hybrid
- Venue autocompletion from a small in-file list
- Cover image upload via drag/drop or URL
- Ticket mode support: free or paid
- Ticket builder with templates and custom categories
- Attendee field form builder
- Draft save to `localStorage`
- Preview pane rendered via `EventCard`
- Local theme toggle for this page

### `src/pages/Cart.vue`

- Displays cart items from `cartStore`
- Allows quantity update, item removal, and clearing cart
- Persists cart in `sessionStorage`
- Navigates to `/checkout` with a `checkoutCart` snapshot in `sessionStorage`

### `src/pages/Checkout.vue`

- Loads Paystack inline script dynamically
- Uses environment values from `import.meta.env.VITE_API_URL` and `VITE_PAYSTACK_PUBLIC_KEY`
- Validates customer contact form
- Builds custom fields and metadata for Paystack transaction
- Calls backend `/verify-payment` endpoint after payment callback
- Clears cart on success and routes to `/payment-success`

## Recurring Event Data Model

The recurring event form state is centralized in `CreateEvent.vue` under `form` and includes two main recurrence objects:

- `form.recurring`:
  - `frequency` (`every_day`, `every_week`, `every_month`)
  - `selectedDays`
  - `useDefaultTimes`
  - `perDayTimes`
- `form.recurrence`:
  - `type` (`once` or `recur`)
  - `frequency` / `unit`
  - `interval`
  - `days`
  - `startDate` / `startTime` / `endTime`
  - `dayOverrides`
  - `stopMode` / `endDate`

The form is validated by `isStepComplete()` and `validateStep()` before advancing pages.

`buildCreateEventPayload()` converts that state into a sanitized payload suitable for API submission.

## Persistent Storage Patterns

- `localStorage` is used for:
  - auth user data (`user`, `authProvider`)
  - theme preference (`kaka-theme-preference`)
  - create event draft (`kaka-create-event-draft`)
  - auth token (`auth_token`)
  - event cache (`event_cache_*`)
  - purchase history (`purchases`)
- `sessionStorage` is used for:
  - cart items (`cartItems`)
  - checkout snapshot (`checkoutCart`)
  - `lastEventPage` navigation state

## Backend and Platform Context

There are two PHP-related backend surfaces in the repository:

- `api/`: root API endpoints and test files such as `blogs.php`, `events.php`, `payments.php`, `test-api.php`, etc.
- `backend/`: another PHP application area with `db-config.php`, `verify-payment.php`, `api/blog.php`, and MVC-like structure under `controllers`, `models`, `utils`

A `.env` file exists with `VITE_PAYSTACK_PUBLIC_KEY`.

## Running the App

Likely commands based on `package.json`:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`

## Important Observations

- `eventService.js` is designed for a Laravel-style API but also includes fallback APIs and response-shape normalization.
- `purchaseService.js` is a local browser-based purchase simulator, not a fully remote ecommerce backend.
- `auth.js` depends on `http://127.0.0.1:8000/api` and `withCredentials`; authentication state is persisted in `localStorage`.
- `CreateEvent.vue` is the central page for recurring event setup and is the most complex file in the frontend.
- `App.vue` provides route transition skeletons, theme management, and global navigation.
- Checkout relies on Paystack and a backend `/verify-payment` endpoint, so full payment flow requires backend availability.

## Areas to Preserve Carefully

- Recurrence form state and validation in `src/pages/CreateEvent.vue`
- API service fallback and response normalization in `src/services/eventService.js`
- Local storage persistence in `src/stores/cart.js`, `src/stores/auth.js`, and `src/services/purchaseService.js`
- Route access control hints in `src/router/index.js` and auth store state

## Suggested Next Inspection for AI

- `src/pages/CreateEvent.vue` and `src/services/createEventService.js` for recurring event behavior
- `src/stores/events.js` and `src/services/eventService.js` for search/pagination and remote data normalization
- `src/pages/Checkout.vue` for payment flow and backend verification
- `src/pages/EventDetails.vue` for cart, likes, QR, and SEO metadata

---

Document generated by AI inspection only. No application code was modified.
