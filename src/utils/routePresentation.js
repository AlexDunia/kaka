// Public pages share one chrome regardless of whether a session is present.
// Checkout, ticket selection, and organiser tools retain their task-specific shells.
export function usesPublicShell(route) {
  return (
    Boolean(route) &&
    !route.meta?.requiresAuth &&
    !route.meta?.requiresAdmin &&
    !route.meta?.fullScreenShell &&
    !['CreateEvent', 'EditEvent', 'google-callback'].includes(route.name)
  )
}

// This describes the page's audience, never the visitor's session state.
export function usesPublicTypography(route) {
  return (
    Boolean(route) &&
    !route.meta?.requiresAuth &&
    !route.meta?.requiresAdmin &&
    !['CreateEvent', 'EditEvent', 'google-callback'].includes(route.name)
  )
}

export function usesPublicTransition(route) {
  return [
    'home',
    'find-events',
    'search',
    'music',
    'movies',
    'theatre',
    'sports',
    'festivals',
    'others',
    'about',
    'features',
    'event-moments',
    'event-details',
    'event-details-legacy',
    'CreateEvent',
  ].includes(route?.name)
}
