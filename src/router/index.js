import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../pages/HomePage.vue'
import EventDetails from '../pages/EventDetails.vue'
import CreateEvent from '../pages/CreateEvent.vue'
import CheckoutPage from '../pages/Checkout.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
      meta: {
        title: 'Home - Find and Book Amazing Events',
        description:
          'Discover and book tickets for the best events, concerts, movies, theatre shows, sports events, and festivals near you.',
      },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../pages/SearchPage.vue'),
      meta: {
        title: 'Search Events',
        description:
          'Search for events, concerts, movies, theatre shows, sports events, and festivals.',
      },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/Login.vue'),
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
      component: () => import('../pages/CategoryPage.vue'),
      props: { category: 'music' },
      meta: {
        title: 'Music Events',
        description:
          'Find and book tickets for the best music events, concerts, and performances near you.',
      },
    },
    {
      path: '/movies',
      name: 'movies',
      component: () => import('../pages/CategoryPage.vue'),
      props: { category: 'movies' },
      meta: {
        title: 'Movie Events',
        description:
          'Find and book tickets for the latest movie screenings, premieres, and film festivals.',
      },
    },
    {
      path: '/theatre',
      name: 'theatre',
      component: () => import('../pages/CategoryPage.vue'),
      props: { category: 'theatre' },
      meta: {
        title: 'Theatre & Comedy Events',
        description:
          'Find and book tickets for theatre shows, plays, musicals, and comedy performances.',
      },
    },
    {
      path: '/sports',
      name: 'sports',
      component: () => import('../pages/CategoryPage.vue'),
      props: { category: 'sports' },
      meta: {
        title: 'Sports Events',
        description:
          'Find and book tickets for sports events, matches, tournaments, and competitions.',
      },
    },
    {
      path: '/festivals',
      name: 'festivals',
      component: () => import('../pages/CategoryPage.vue'),
      props: { category: 'festivals' },
      meta: {
        title: 'Festivals',
        description:
          'Find and book tickets for the best festivals, celebrations, and cultural events.',
      },
    },
    {
      path: '/others',
      name: 'others',
      component: () => import('../pages/CategoryPage.vue'),
      props: { category: 'others' },
      meta: {
        title: 'Other Events',
        description:
          "Discover unique events and experiences that don't fit traditional categories.",
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
        description: 'Manage your events, tickets, and account settings.',
        requiresAuth: true,
      },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../pages/Admin.vue'),
      meta: {
        title: 'Admin Dashboard',
        description: 'Manage events, users, and site settings.',
        requiresAuth: true,
        requiresAdmin: true,
      },
    },
    {
      path: '/event/:id',
      name: 'event-details-legacy',
      component: EventDetails,
      props: true,
      meta: {
        title: 'Event Details',
        description: 'View details and book tickets for this event.',
      },
    },
    {
      path: '/events/:id-:slug',
      name: 'event-details',
      component: EventDetails,
      props: (route) => ({
        id: route.params.id,
        slug: route.params.slug,
      }),
      meta: {
        title: 'Event Details',
        description: 'View details and book tickets for this event.',
      },
    },
    {
      path: '/create-event',
      name: 'CreateEvent',
      component: CreateEvent,
      meta: {
        title: 'Create Event',
        description: 'Create and publish your own event to sell tickets.',
      },
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: CheckoutPage,
      meta: {
        title: 'Checkout',
        description: 'Complete your ticket purchase securely.',
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
      },
    },
    {
      path: '/blog/:slug',
      name: 'blog-post',
      component: () => import('@/pages/BlogPost.vue'),
      meta: {
        title: 'Blog Post',
      },
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('../pages/TransactionHistory.vue'),
      meta: {
        title: 'Transaction History',
        description: 'View your transaction history and past purchases.',
        requiresAuth: true,
      },
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
  scrollBehavior(to, from, savedPosition) {
    // If the user is using the browser history (back/forward), restore the saved position
    if (savedPosition) {
      return savedPosition
    }

    // Otherwise, scroll to top
    return { top: 0 }
  },
})

// Route guard for authenticated routes
router.beforeEach((to, from, next) => {
  const userStore = localStorage.getItem('user')
  const user = userStore ? JSON.parse(userStore) : null

  // Check if route requires authentication
  if (to.meta.requiresAuth && !user) {
    next({ name: 'login' })
  }
  // Check if route requires admin role
  else if (to.meta.requiresAdmin && (!user || user.role !== 'admin')) {
    next({ name: 'home' })
  } else {
    // Update document title based on route meta
    if (to.meta.title) {
      document.title = `${to.meta.title} | Kaka`
    }
    next()
  }
})

export default router
