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
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../pages/SearchPage.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/Login.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../pages/Register.vue'),
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../pages/ForgotPassword.vue'),
    },
    {
      path: '/music',
      name: 'music',
      component: () => import('../pages/CategoryPage.vue'),
      props: { category: 'music' },
    },
    {
      path: '/movies',
      name: 'movies',
      component: () => import('../pages/CategoryPage.vue'),
      props: { category: 'movies' },
    },
    {
      path: '/theatre',
      name: 'theatre',
      component: () => import('../pages/CategoryPage.vue'),
      props: { category: 'theatre' },
    },
    {
      path: '/sports',
      name: 'sports',
      component: () => import('../pages/CategoryPage.vue'),
      props: { category: 'sports' },
    },
    {
      path: '/festivals',
      name: 'festivals',
      component: () => import('../pages/CategoryPage.vue'),
      props: { category: 'festivals' },
    },
    {
      path: '/others',
      name: 'others',
      component: () => import('../pages/CategoryPage.vue'),
      props: { category: 'others' },
    },
    {
      path: '/contact',
      name: 'contact',
      component: () => import('../pages/ContactPage.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../pages/Dashboard.vue'),
      // meta: { requiresAuth: true },
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../pages/Admin.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
    },
    {
      path: '/event/:id',
      name: 'event-details',
      component: EventDetails,
      props: true,
    },
    {
      path: '/create-event',
      name: 'CreateEvent',
      component: CreateEvent,
      meta: {
        title: 'Create Event',
      },
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: CheckoutPage,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../pages/NotFound.vue'),
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
    next()
  }
})

export default router
