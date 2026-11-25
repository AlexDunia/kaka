import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import HomePage from '../pages/HomePage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/orders/recover',
      name: 'order-recovery',
      component: () => import('../pages/OrderRecovery.vue'),
      meta: { title: 'Recover your order', disableRouteSkeleton: true },
    },
    {
      path: '/events/:id-:slug/tickets',
      name: 'event-tickets',
      component: () => import('../pages/EventTickets.vue'),
      meta: { title: 'Your selection', disableRouteSkeleton: true, fullScreenShell: true },
    },
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: {
        title: 'Find events worth showing up for',
        publicSite: true,
        description:
          'Find concerts, meetups, food events, and experiences near you with Rush Hour Ticket.',
        disableRouteSkeleton: true,
      },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../pages/FindEvents.vue'),
      meta: {
        title: 'Find events',
        publicSite: true,
        description:
          'Search for events, concerts, movies, theatre shows, sports events, and festivals.',
        disableRouteSkeleton: true,
      },
    },
    {
      path: '/find-events',
      name: 'find-events',
      component: () => import('../pages/FindEvents.vue'),
      meta: { title: 'Find events', publicSite: true, disableRouteSkeleton: true },
    },
    {
      path: '/features',
      name: 'features',
      component: HomePage,
      props: { sectionOnly: 'features' },
      meta: { title: 'Features', publicSite: true, disableRouteSkeleton: true },
    },
    {
      path: '/event-moments',
      name: 'event-moments',
      component: HomePage,
      props: { sectionOnly: 'moments' },
      meta: { title: 'Event moments', publicSite: true, disableRouteSkeleton: true },
    },
    {
      path: '/about',
      alias: '/about-us',
      name: 'about',
      component: () => import('../pages/AboutPage.vue'),
      meta: { title: 'About us', publicSite: true, disableRouteSkeleton: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/LoginPage.vue'),
      meta: {
        title: 'Login',
        description: 'Login to your account to manage your tickets and events.',
      },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../pages/Register.vue'),
      meta: {
        title: 'Create Account',
        description: 'Create a new account to book tickets and manage your events.',
      },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../pages/ForgotPassword.vue'),
      meta: {
        title: 'Forgot Password',
        description: 'Reset your password to regain access to your account.',
      },
    },
    {
      path: '/music',
      name: 'music',
      component: () => import('../pages/FindEvents.vue'),
      props: { category: 'music' },
      meta: {
        publicSite: true,
        discoveryCategory: 'music',
        title: 'Music Events',
        description:
          'Find and book tickets for the best music events, concerts, and performances near you.',
        disableRouteSkeleton: true,
      },
    },
    {
      path: '/movies',
      name: 'movies',
      component: () => import('../pages/FindEvents.vue'),
      props: { category: 'movies' },
      meta: {
        publicSite: true,
        discoveryCategory: 'movies',
        title: 'Movie Events',
        description:
          'Find and book tickets for the latest movie screenings, premieres, and film festivals.',
        disableRouteSkeleton: true,
      },
    },
    {
      path: '/theatre',
      name: 'theatre',
      component: () => import('../pages/FindEvents.vue'),
      props: { category: 'theatre' },
      meta: {
        publicSite: true,
        discoveryCategory: 'theatre',
        title: 'Theatre & Comedy Events',
        description:
          'Find and book tickets for theatre shows, plays, musicals, and comedy performances.',
        disableRouteSkeleton: true,
      },
    },
    {
      path: '/sports',
      name: 'sports',
      component: () => import('../pages/FindEvents.vue'),
      props: { category: 'sports' },
      meta: {
        publicSite: true,
        discoveryCategory: 'sports',
        title: 'Sports Events',
        description:
          'Find and book tickets for sports events, matches, tournaments, and competitions.',
        disableRouteSkeleton: true,
      },
    },
    {
      path: '/festivals',
      name: 'festivals',
      component: () => import('../pages/FindEvents.vue'),
      props: { category: 'festivals' },
      meta: {
        publicSite: true,
        discoveryCategory: 'festivals',
        title: 'Festivals',
        description:
          'Find and book tickets for the best festivals, celebrations, and cultural events.',
        disableRouteSkeleton: true,
      },
    },
    {
      path: '/others',
      name: 'others',
      component: () => import('../pages/FindEvents.vue'),
      props: { category: 'others' },
      meta: {
        publicSite: true,
        discoveryCategory: 'others',
        title: 'Other Events',
        description:
          "Discover unique events and experiences that don't fit traditional categories.",
        disableRouteSkeleton: true,
      },
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../pages/ContactPage.vue'),
      meta: {
        title: 'Contact Us',
        description: 'Get in touch with our team for support, inquiries, or feedback.',
      },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../pages/Dashboard.vue'),
      // meta: { requiresAuth: true },
      meta: {
        title: 'My Dashboard',
        description: 'Manage event performance, tickets, guests, payouts, and settings.',
        requiresAuth: true,
        disableRouteSkeleton: true,
        fullScreenShell: true,
      },
    },
    {
      path: '/dashboard/events/:eventId',
      name: 'dashboard-event',
      component: () => import('../pages/Dashboard.vue'),
      meta: {
        title: 'Event Dashboard',
        description: 'Manage event performance, tickets, guests, payouts, and settings.',
        requiresAuth: true,
        disableRouteSkeleton: true,
        fullScreenShell: true,
      },
    },
    {
      path: '/trolio',
      name: 'trolio',
      component: () => import('../pages/Trolio.vue'),
      meta: {
        title: 'Trolio',
        description: 'TradeLog dashboard draft.',
        requiresAuth: true,
        disableRouteSkeleton: true,
        fullScreenShell: true,
      },
    },
    {
      path: '/event/:id',
      name: 'event-details-legacy',
      component: () => import('../pages/EventDetails.vue'),
      props: true,
      meta: {
        title: 'Event Details',
        description: 'View details and book tickets for this event.',
        disableRouteSkeleton: true,
      },
    },
    {
      path: '/events/:id-:slug',
      name: 'event-details',
      component: () => import('../pages/EventDetails.vue'),
      props: (route) => ({
        id: route.params.id,
        slug: route.params.slug,
      }),
      meta: {
        title: 'Event Details',
        description: 'View details and book tickets for this event.',
        disableRouteSkeleton: true,
      },
    },
    {
      path: '/create-event',
      name: 'CreateEvent',
      component: () => import('../pages/CreateEvent.vue'),
      meta: {
        title: 'Create Event',
        requiresAuth: true,
        fullScreenShell: true,
        description: 'Create and publish your own event to sell tickets.',
      },
    },
    {
      path: '/events/:id/edit',
      name: 'EditEvent',
      redirect: (to) => ({ name: 'dashboard-event', params: { eventId: to.params.id }, query: { ...to.query, view: 'edit', tab: 'details' } }),
      meta: {
        title: 'Edit Event',
        description: 'Update your published event.',
        requiresAuth: true,
        fullScreenShell: true,
      },
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: () => import('../pages/Checkout.vue'),
      meta: {
        title: 'Checkout',
        fullScreenShell: true,
        description: 'Complete your ticket purchase securely.',
        disableRouteSkeleton: true,
      },
    },
    {
      path: '/payment-success/:orderId',
      name: 'payment-success',
      component: () => import('../pages/PaymentSuccess.vue'),
      meta: {
        title: 'Payment Confirmed',
        description: 'View your KakaTickets order and tickets.',
        disableRouteSkeleton: true,
      },
    },
    {
      path: '/cart',
      name: 'cart',
      component: () => import('../pages/Cart.vue'),
      meta: {
        title: 'Shopping Cart',
        description: 'Review your selected tickets before checkout.',
      },
    },
    {
      path: '/blog',
      name: 'blog',
      component: () => import('@/pages/BlogList.vue'),
      meta: {
        title: 'Blog - Event Planning Tips & Insights',
        disableRouteSkeleton: true,
      },
    },
    {
      path: '/auth/google/success',
      name: 'google-callback',
      component: () => import('../components/GoogleCallback.vue'),
    },
    {
      path: '/blog/:slug',
      name: 'blog-post',
      component: () => import('@/pages/BlogPost.vue'),
      meta: {
        title: 'Blog Post',
        disableRouteSkeleton: true,
      },
    },

    {
      path: '/my-tickets',
      alias: '/transactions',
      name: 'transactions',
      component: () => import('../pages/TransactionHistory.vue'),
      meta: {
        title: 'Transaction History',
        description: 'View your transaction history and past purchases.',
        requiresAuth: true,
        disableRouteSkeleton: true,
      },
    },
    {
      path: '/door/:eventId',
      name: 'event-door',
      component: () => import('../pages/EventDoor.vue'),
      meta: { title: 'Door check-in', requiresAuth: true },
    },
    {
      path: '/event-invitations/accept',
      name: 'event-invitation',
      component: () => import('../pages/EventInvitation.vue'),
      meta: { title: 'Event invitation' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../pages/NotFound.vue'),
      meta: {
        title: 'Page Not Found',
        description: 'The page you are looking for does not exist.',
      },
    },
  ],
  // Add scrollBehavior to reset scroll position to top on route changes
  scrollBehavior(to, from) {
    // Ticket selection is a full-screen layer over the same event profile.
    if (to.path === from.path && ['event-details', 'event-details-legacy'].includes(to.name)) {
      return false
    }
    if (to.hash) return { el: to.hash, top: 130, behavior: 'instant' }

    // Otherwise, scroll to top
    return { top: 0, left: 0, behavior: 'instant' }
  },
})

// Protected routes are authorized by the backend session.
// localStorage is never accepted as proof of authentication.
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth) {
    await authStore.initialize()

    if (!authStore.isAuthenticated) {
      return {
        name: 'login',
        query: {
          redirect: to.fullPath,
        },
      }
    }

    if (to.meta.requiresAdmin && !authStore.isAdmin) {
      return { name: 'home' }
    }
  }

  if (to.meta.title) {
    document.title = `${to.meta.title} | Rush Hour Ticket`
  }

  return true
})

export default router
