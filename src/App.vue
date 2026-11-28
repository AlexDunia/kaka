<script setup>
import { pngIconUrl } from '@/constants/pngIcons'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { ref, onMounted, onUnmounted, computed, watch, provide } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useSeo } from '@/composables/useSeo'
import { getRushHourLogo } from '@/constants/brand'
import { playThemeToggleClick } from '@/utils/themeClickSound'
import PublishGuidance from '@/components/PublishGuidance.vue'
import HeroSection from '@/components/HeroSection.vue'
import PageSkeleton from '@/components/PageSkeleton.vue'
import AccountMenu from '@/components/AccountMenu.vue'
import PublicSite from '@/components/public/PublicSite.vue'
import PublicBrandLoader from '@/components/public/PublicBrandLoader.vue'
import { usePublicPageLoader } from '@/composables/usePublicPageLoader'
import { isScheduleNavigation, usesPublicShell, usesPublicTypography } from '@/utils/routePresentation'
import throttle from 'lodash.throttle' // âœ… use throttling to reduce scroll event calls

const isMobileMenuOpen = ref(false)
const currentYear = ref(new Date().getFullYear())
const route = useRoute()
const router = useRouter()
const eventProfileHeaderCollapsed = ref(false)
provide('eventProfileHeaderCollapsed', eventProfileHeaderCollapsed)
const usesPublicSite = computed(() => usesPublicShell(route))
const isEventProfileRoute = computed(() => ['event-details', 'event-details-legacy'].includes(route.name))
watch(() => route.name, (name) => {
  const screen = ['event-details', 'event-details-legacy'].includes(name) ? 'event-page' : name === 'event-tickets' ? 'event-tickets' : name === 'checkout' ? 'event-checkout' : null
  if (screen) document.body.dataset.rhPage = screen
  else if (['event-page', 'event-tickets', 'event-checkout'].includes(document.body.dataset.rhPage)) delete document.body.dataset.rhPage
  document.body.classList.remove('rh30-scrolled')
}, { immediate: true })
const { updateMetaDescription, updateSocialMeta } = useSeo()
const pageOwnedSkeletonRoutes = new Set([
  'event-tickets',
  'home',
  'search',
  'music',
  'movies',
  'theatre',
  'sports',
  'festivals',
  'others',
  'event-details',
  'event-details-legacy',
  'checkout',
  'blog',
  'blog-post',
  'admin',
  'transactions',
  'dashboard',
  'dashboard-event',
  'payment-success',
])
const routeUsesShellSkeleton = (targetRoute) => !pageOwnedSkeletonRoutes.has(targetRoute?.name)
const isRouteLoading = ref(routeUsesShellSkeleton(route))
const skeletonRoute = ref(route)
const chromeRoute = computed(() => (isRouteLoading.value ? skeletonRoute.value : route))
const showHero = computed(
  () =>
    !usesPublicSite.value && !isRouteLoading.value && (chromeRoute.value.name === 'home' || chromeRoute.value.path === '/'),
)
const isCreateEventRoute = computed(() =>
  chromeRoute.value.name === 'CreateEvent' || chromeRoute.value.name === 'EditEvent',
)
const usesFullScreenShell = computed(() => Boolean(chromeRoute.value.meta?.fullScreenShell))
const showGlobalHeader = computed(
  () => !isCreateEventRoute.value && !usesFullScreenShell.value,
)

const routeSkeletonVariant = computed(() => {
  const targetRoute = skeletonRoute.value || route
  if (targetRoute.name === 'CreateEvent' || targetRoute.name === 'EditEvent') return 'create-event'
  if (['event-details', 'event-details-legacy'].includes(targetRoute.name)) return 'detail'
  if (['dashboard', 'dashboard-event'].includes(targetRoute.name)) return 'dashboard-overview'
  if (['admin', 'transactions'].includes(targetRoute.name)) return 'dashboard'
  if (['login', 'register', 'forgot-password', 'reset-password', 'google-callback'].includes(targetRoute.name))
    return 'auth'
  if (targetRoute.name === 'contact') return 'contact'
  if (targetRoute.name === 'cart') return 'cart'
  if (targetRoute.name === 'not-found') return 'not-found'
  if (targetRoute.name === 'checkout') return 'form'
  if (['blog', 'blog-post'].includes(targetRoute.name)) return 'blog'
  return 'grid'
})

const routeSkeletonEnabled = computed(() => routeUsesShellSkeleton(skeletonRoute.value))

const showRouteSkeleton = () => {
  isRouteLoading.value = true
}

const hideRouteSkeleton = () => {
  isRouteLoading.value = false
}

const removeRouteBeforeEach = router.beforeEach((to, from) => {
  if (isScheduleNavigation(to, from)) return true
  if (to.fullPath !== from.fullPath) {
    skeletonRoute.value = to
    if (routeUsesShellSkeleton(to)) {
      showRouteSkeleton()
    } else {
      isRouteLoading.value = false
    }
  }
  return true
})

const removeRouteAfterEach = router.afterEach((to, from) => {
  if (isScheduleNavigation(to, from)) return
  if (routeUsesShellSkeleton(to)) {
    hideRouteSkeleton()
  } else {
    isRouteLoading.value = false
  }
})

router.onError(() => {
  if (routeUsesShellSkeleton(skeletonRoute.value)) {
    hideRouteSkeleton()
  } else {
    isRouteLoading.value = false
  }
})

watch(
  () => route.fullPath,
  () => {
    skeletonRoute.value = route
  },
)

const themePreferenceKey = 'kaka-theme-preference-v2'
const theme = ref('light')
const brandLogoUrl = computed(() => getRushHourLogo(theme.value))
let themeInstantToken = 0

const applyThemeInstantly = (callback) => {
  if (typeof document === 'undefined') {
    callback()
    return
  }

  const root = document.documentElement
  const token = ++themeInstantToken
  root.classList.add('theme-instant')
  void root.offsetHeight
  callback()

  const releaseInstantTheme = () => {
    if (themeInstantToken === token) {
      root.classList.remove('theme-instant')
    }
  }

  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    window.requestAnimationFrame(() => window.requestAnimationFrame(releaseInstantTheme))
  } else {
    releaseInstantTheme()
  }
}

const applyTheme = (value, { instant = true } = {}) => {
  theme.value = value
  if (typeof document !== 'undefined') {
    const updateDocumentTheme = () => {
      const root = document.documentElement
      root.classList.toggle('light', value === 'light')
      root.classList.toggle('dark', value === 'dark')
      root.style.colorScheme = value === 'light' ? 'light' : 'dark'
    }

    if (instant) {
      applyThemeInstantly(updateDocumentTheme)
    } else {
      updateDocumentTheme()
    }
  }
  if (typeof window !== 'undefined') {
    window.localStorage?.setItem(themePreferenceKey, value)
  }
}

const initializeTheme = () => {
  if (typeof window === 'undefined') return
  const stored = window.localStorage?.getItem(themePreferenceKey)
  if (stored === 'light' || stored === 'dark') {
    applyTheme(stored)
    return
  }

  applyTheme('light')
}

const toggleTheme = () => {
  playThemeToggleClick()
  applyTheme(theme.value === 'light' ? 'dark' : 'light', { instant: false })
}

provide('themeController', {
  theme,
  applyTheme,
  toggleTheme,
})

const navigationLinks = [
  { path: '/', name: 'All' },
  { path: '/music', name: 'Music' },
  { path: '/movies', name: 'Movies' },
  { path: '/theatre', name: 'Theatre/Comedy' },
  { path: '/sports', name: 'Sports' },
  { path: '/festivals', name: 'Festivals' },
  { path: '/others', name: 'Others' },
  { path: '/blog', name: 'Blog' },
  { path: '/contact', name: 'Contact us' },
]

// âœ… Menu toggle logic
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  document.body.style.overflow = isMobileMenuOpen.value ? 'hidden' : ''
}

const closeMenu = () => {
  isMobileMenuOpen.value = false
  document.body.style.overflow = ''
}

// âœ… Update meta tags when route changes
watch(
  () => route.meta,
  (meta) => {
    if (meta.description && meta.publicSite) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
    } else if (meta.description) {
      updateMetaDescription(meta.description)
    }

    updateSocialMeta({
      title: meta.title ? `${meta.title} | Rush Hour Ticket` : 'Rush Hour Ticket | Find your next event',
      description: meta.description || 'Discover and book tickets for events near you',
      url: window.location.href,
    })
  },
  { immediate: true },
)

const cartStore = useCartStore()
const authStore = useAuthStore()
const { visible: publicLoading, stage: publicLoadingStage, destination: publicLoadingDestination, sequence: publicLoadingSequence } = usePublicPageLoader(router)
provide('publicPageLoading', publicLoading)
const cartCount = computed(() => cartStore.itemCount)
const isAuthenticated = computed(() => authStore.isAuthenticated || authStore.isPreview)
const scrollPosition = ref(0)
const handleScroll = throttle(() => {
  scrollPosition.value = window.scrollY
}, 100)

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
  initializeTheme()
  if (routeUsesShellSkeleton(route)) {
    hideRouteSkeleton()
  } else {
    isRouteLoading.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  removeRouteBeforeEach()
  removeRouteAfterEach()
})
</script>

<template>
  <div v-if="route.meta.requiresAuth && !authStore.initialized && authStore.error" role="alert">
    {{ authStore.error }}
    <button type="button" :disabled="authStore.isLoading" @click="authStore.initialize()" :aria-busy="authStore.isLoading">
      {{ authStore.isLoading ? 'Checking your login...' : 'Try again' }}
    </button>
  </div>
  <PublishGuidance />
  <PublicBrandLoader v-if="publicLoading" :stage="publicLoadingStage" :destination="publicLoadingDestination" :sequence="publicLoadingSequence" />
  <PublicSite v-if="usesPublicSite" :header-collapsed="isEventProfileRoute && eventProfileHeaderCollapsed" :inert="publicLoading || undefined" :aria-busy="publicLoading || undefined"><RouterView /></PublicSite>
  <div v-else :inert="publicLoading || undefined" class="app-container" :class="{ 'public-typography': usesPublicTypography(route), 'has-global-header': showGlobalHeader, 'event-profile-route': isEventProfileRoute, 'event-profile-header-collapsed': isEventProfileRoute && eventProfileHeaderCollapsed }">
    <header
      v-if="showGlobalHeader"
      class="app-header"
      :class="{ 'nav-shadow': scrollPosition > 20 }"
      :inert="isEventProfileRoute && eventProfileHeaderCollapsed"
      :aria-hidden="isEventProfileRoute && eventProfileHeaderCollapsed ? true : undefined"
    >
      <div class="container">
        <div class="logo">
          <RouterLink to="/">
            <img :src="brandLogoUrl" alt="Rush Hour" class="logo-img" />
          </RouterLink>
        </div>

        <nav class="main-nav">
          <RouterLink
            to="/"
            @click="closeMenu"
            class="nav-item"
            :class="{ active: $route.path === '/' }"
            >All</RouterLink
          >
          <RouterLink
            to="/music"
            @click="closeMenu"
            class="nav-item"
            :class="{ active: $route.path === '/music' }"
            >Music</RouterLink
          >
          <RouterLink
            to="/movies"
            @click="closeMenu"
            class="nav-item"
            :class="{ active: $route.path === '/movies' }"
            >Movies</RouterLink
          >
          <RouterLink
            to="/theatre"
            @click="closeMenu"
            class="nav-item"
            :class="{ active: $route.path === '/theatre' }"
            >Theatre/Comedy</RouterLink
          >
          <RouterLink
            to="/sports"
            @click="closeMenu"
            class="nav-item"
            :class="{ active: $route.path === '/sports' }"
            >Sports</RouterLink
          >
          <RouterLink
            to="/festivals"
            @click="closeMenu"
            class="nav-item"
            :class="{ active: $route.path === '/festivals' }"
            >Festivals</RouterLink
          >
          <RouterLink
            to="/others"
            @click="closeMenu"
            class="nav-item"
            :class="{ active: $route.path === '/others' }"
            >Others</RouterLink
          >
          <RouterLink
            to="/blog"
            @click="closeMenu"
            class="nav-item"
            :class="{ active: $route.path.startsWith('/blog') }"
            >Blog</RouterLink
          >
          <RouterLink
            to="/contact"
            @click="closeMenu"
            class="nav-item"
            :class="{ active: $route.path === '/contact' }"
            >Contact us</RouterLink
          >
        </nav>

        <div class="header-actions">
          <button
            type="button"
            class="theme-toggle"
            @click="toggleTheme"
            :aria-label="theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'"
          >
            <span class="theme-icon-window" aria-hidden="true">
              <span class="theme-icon-track" :class="{ 'is-light': theme === 'light' }">
                <svg class="theme-icon theme-icon--moon" viewBox="0 0 24 24" fill="none"><image :href="pngIconUrl('moon')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg>
                <svg class="theme-icon theme-icon--sun" viewBox="0 0 24 24" fill="none"><image :href="pngIconUrl('sun')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg>
              </span>
            </span>
          </button>
          <template v-if="isAuthenticated">
            <AccountMenu context="site" />
          </template>

          <template v-else>
            <RouterLink to="/login" class="auth-link">Login</RouterLink>
            <RouterLink to="/register" class="auth-button">Sign up</RouterLink>
          </template>

          <RouterLink to="/cart" class="cart-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ><image :href="pngIconUrl('cart')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg>
            <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
          </RouterLink>

          <button
            class="mobile-menu-toggle"
            :class="{ active: isMobileMenuOpen }"
            @click="toggleMobileMenu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ><image :href="pngIconUrl('menu')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg>
          </button>
        </div>
      </div>
    </header>

    <HeroSection v-if="showHero" />

    <!-- Mobile Navigation Modal -->
    <Transition name="rh-popup">
      <div data-popup-overlay v-if="isMobileMenuOpen" class="mobile-nav-modal" :class="{ open: isMobileMenuOpen }">
        <div data-popup-panel class="mobile-nav-content">
          <button class="modal-close" @click="closeMenu">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            ><image :href="pngIconUrl('close')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg>
          </button>
          <nav class="mobile-nav-list">
            <RouterLink
              v-for="(link, index) in navigationLinks"
              :key="link.path"
              :to="link.path"
              class="mobile-nav-item nav-item"
              :style="{ '--index': index }"
              :class="{
                active:
                  link.path === '/blog'
                    ? $route.path.startsWith('/blog')
                    : $route.path === link.path,
              }"
              @click="closeMenu"
            >
              {{ link.name }}
            </RouterLink>
          </nav>
        </div>
      </div>
    </Transition>

    <main class="app-content">
      <RouterView v-slot="{ Component }">
        <transition name="fade">
          <PageSkeleton
            v-if="isRouteLoading && routeSkeletonEnabled"
            :key="`route-skeleton-${skeletonRoute.fullPath || route.fullPath}`"
            :variant="routeSkeletonVariant"
          />
          <component v-else :is="Component" />
        </transition>
      </RouterView>
    </main>

    <footer v-if="!usesFullScreenShell" class="app-footer">
      <div class="footer-simple">
        <div class="footer-logo-col">
          <img :src="brandLogoUrl" alt="Rush Hour" class="footer-logo-img" />
        </div>
        <div class="footer-center-col">
          <span class="footer-copyright">Â© {{ currentYear }} kakaworldcompany</span>
        </div>
        <div class="footer-social-col">
          <a
            href="https://instagram.com/kakaworld"
            target="_blank"
            rel="noopener"
            aria-label="Instagram"
            class="footer-social-link"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </a>
          <a
            href="https://tiktok.com/@kakaworld"
            target="_blank"
            rel="noopener"
            aria-label="TikTok"
            class="footer-social-link"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path
                d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64c.298 0 .593.044.876.13V9.4a6.33 6.33 0 00-1-.08A6.34 6.34 0 003 15.66a6.34 6.34 0 0010.86 4.48V14.8a8.81 8.81 0 005.73 2.15V13.5a5.85 5.85 0 01-3.82-1.43 4.3 4.3 0 002.89-1.2 4.3 4.3 0 001.93-3.62v-.56z"
              />
            </svg>
          </a>
          <a
            href="https://facebook.com/kakaworld"
            target="_blank"
            rel="noopener"
            aria-label="Facebook"
            class="footer-social-link"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
            </svg>
          </a>
          <a
            href="https://x.com/kakaworld"
            target="_blank"
            rel="noopener"
            aria-label="X (Twitter)"
            class="footer-social-link"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M4 4l11.733 16h4.267l-11.733-16z"></path>
              <path d="M4 20l6.768-6.768M20 4l-6.768 6.768"></path>
            </svg>
          </a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

:global(:root) {
  --app-header-height: 96px;
  --app-logo-height: 72px;
}

.app-header {
  background-color: var(--color-surface);
  height: var(--app-header-height);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid var(--color-border);
}

.nav-shadow {
  box-shadow: var(--shadow-subtle);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-img {
  height: var(--app-logo-height);
  width: auto;
  display: block;
  margin-right: 0.5rem;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: 2rem;
  margin: 0 auto;
}

.nav-item {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  min-height: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
  color: var(--color-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 0;
  position: relative;
  transform: none;
  transition: none;
  z-index: 1;
}

.main-nav .nav-item:hover,
.main-nav .nav-item:focus,
.main-nav .nav-item:focus-visible,
.mobile-nav-list .nav-item:hover,
.mobile-nav-list .nav-item:focus,
.mobile-nav-list .nav-item:focus-visible {
  background: transparent;
  box-shadow: none;
  color: var(--color-muted);
  outline: none;
  transform: none;
}

.nav-item.active {
  color: var(--color-primary);
  font-weight: 600;
}

.main-nav .nav-item.active:hover,
.main-nav .nav-item.active:focus,
.main-nav .nav-item.active:focus-visible,
.mobile-nav-list .nav-item.active:hover,
.mobile-nav-list .nav-item.active:focus,
.mobile-nav-list .nav-item.active:focus-visible {
  color: var(--color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.theme-toggle {
  border: 1px solid var(--color-border);
  border-radius: 999px;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: var(--color-text);
  font-size: 1.1rem;
  cursor: pointer;
}

.user-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  background: #34d36b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-on-action);
  font-weight: 700;
  font-size: 0.95rem;
  text-transform: uppercase;
  box-shadow: var(--shadow-subtle);
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.auth-link,
.auth-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--color-text);
  border-radius: 999px;
  padding: 0.65rem 1rem;
  font-size: 0.9rem;
}

.auth-link {
  background: var(--color-tab-bg);
}

.auth-button {
  background: #34d36b;
  color: var(--color-on-action);
}

.cart-icon {
  color: var(--color-text);
  text-decoration: none;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cart-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #e04e95;
  color: var(--color-on-action);
  font-size: 0.75rem;
  font-weight: 700;
  border-radius: 50%;
  padding: 0.15em 0.5em;
  min-width: 1.5em;
  text-align: center;
}

.mobile-menu-toggle {
  display: none;
  background: transparent;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  padding: 0;
}

/* Mobile Navigation Modal */
.mobile-nav-modal {
  position: fixed;
  top: 0;
  right: 0;
  width: 85%;
  max-width: 400px;
  height: 100vh;
  background-color: var(--color-surface);
  border-left: 1px solid var(--color-border);
  z-index: 1050;
  display: flex;
  flex-direction: column;
  opacity: 0;
  visibility: hidden;
  transform: translateX(100%);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.mobile-nav-modal.open {
  opacity: 1;
  visibility: visible;
  transform: translateX(0);
}

.mobile-nav-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 2rem 0;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: var(--color-muted);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  line-height: 1;
}

.mobile-nav-list {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 1rem 0;
  margin-top: 2rem;
}

.mobile-nav-item {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-muted);
  text-decoration: none;
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: calc(var(--index) * 0.1s);
}

.mobile-nav-item:last-of-type {
  border-bottom: none;
}

.mobile-nav-modal.open .mobile-nav-item {
  opacity: 1;
  transform: translateY(0);
}

.mobile-nav-item.active {
  color: var(--color-text);
}

/* Modal Transition */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.app-content {
  flex: 1;
  width: 100%;
}

/* Mobile styles */
@media (max-width: 992px) {
  .mobile-menu-toggle {
    display: flex;
  }

  .main-nav {
    display: none;
  }
}

/* Keep the existing fade transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.app-footer {
  background-color: var(--color-surface);
  padding: 3rem 1rem 2rem;
  width: 100%;
  margin-top: 2rem;
  border-top: 1px solid var(--color-border);
}

.footer-simple {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  gap: 2rem;
}

.footer-logo-col {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}

.footer-center-col {
  flex: 1 1 auto;
  text-align: center;
  color: var(--color-text);
  font-size: 1rem;
  font-weight: 500;
  opacity: 0.85;
}

.footer-social-col {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.footer-social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-tab-bg);
  color: var(--color-text);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.footer-social-link:hover {
  background: color-mix(in srgb, var(--color-tab-bg) 80%, var(--color-text));
  color: var(--color-text);
  transform: translateY(-2px);
}

.footer-social-link svg {
  width: 20px;
  height: 20px;
  transition: all 0.3s ease;
}

.footer-social-link:hover svg {
  transform: scale(1.1);
}

/* Platform-specific hover colors */
.footer-social-link[aria-label='Instagram']:hover {
  background: linear-gradient(
    45deg,
    #f09433 0%,
    #e6683c 25%,
    #dc2743 50%,
    #cc2366 75%,
    #bc1888 100%
  );
  box-shadow: var(--shadow-subtle);
}

.footer-social-link[aria-label='TikTok']:hover {
  background: #000000;
  box-shadow: var(--shadow-subtle);
  color: #00f2ea;
}

.footer-social-link[aria-label='Facebook']:hover {
  background: #1877f2;
  box-shadow: var(--shadow-subtle);
}

.footer-social-link[aria-label='X (Twitter)']:hover {
  background: #000000;
  box-shadow: var(--shadow-subtle);
}

.footer-logo-img {
  height: 45px;
  width: auto;
  display: block;
}

/* Reference-style fixed global header */
:global(:root) {
  --app-header-height: 92px;
  --app-logo-height: 64px;
}

.app-container.has-global-header {
  padding-top: var(--app-header-height);
}

.app-header {
  position: fixed;
  inset: 0 0 auto;
  width: 100%;
  height: var(--app-header-height);
  background: color-mix(in srgb, var(--color-surface) 91%, transparent);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom-color: color-mix(in srgb, var(--color-text) 7%, transparent);
}

.nav-shadow {
  box-shadow: var(--shadow-subtle);
}

.app-header .container {
  max-width: 1160px;
}

.logo {
  flex: 0 0 auto;
}

.logo-img {
  margin-right: 0;
  object-fit: contain;
}

.main-nav {
  height: 100%;
  gap: clamp(1.45rem, 2.35vw, 2.45rem);
  padding: 0 1.5rem;
}

.main-nav .nav-item {
  height: 100%;
  padding: 0;
  color: color-mix(in srgb, var(--color-text) 72%, transparent);
  font-size: 0.92rem;
  transition: color 0.2s ease;
}

.main-nav .nav-item::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: var(--color-primary);
  opacity: 0;
  transform: scaleX(0.4);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.main-nav .nav-item.active::after {
  opacity: 1;
  transform: scaleX(1);
}

.header-actions {
  flex: 0 0 auto;
  gap: 1rem;
  padding-left: 1.2rem;
  border-left: 1px solid color-mix(in srgb, var(--color-text) 7%, transparent);
}

.theme-toggle {
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  font-size: 1rem;
}

.theme-toggle:hover,
.theme-toggle:focus-visible,
.cart-icon:hover,
.cart-icon:focus-visible {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  outline: none;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-primary);
  background: transparent;
  color: var(--color-text);
  font-size: 0.72rem;
  box-shadow: none;
}

.auth-link,
.auth-button {
  padding: 0.58rem 0.85rem;
  font-size: 0.92rem;
}

.cart-icon {
  width: 34px;
  height: 34px;
  padding: 7px;
  border-radius: 999px;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.cart-icon svg {
  width: 19px;
  height: 19px;
}

@media (max-width: 992px) {
  .app-header .container {
    padding-inline: 1rem;
  }

  .header-actions {
    margin-left: auto;
  }
}

@media (max-width: 600px) {
  :global(:root) {
    --app-header-height: 72px;
    --app-logo-height: 46px;
  }

  .auth-link {
    display: none;
  }

  .auth-button {
    padding: 0.44rem 0.62rem;
  }

  .header-actions {
    gap: 0.35rem;
    padding-left: 0.55rem;
  }

  .mobile-menu-toggle {
    width: 34px;
    height: 34px;
    align-items: center;
    justify-content: center;
  }

  .mobile-menu-toggle svg {
    width: 20px;
    height: 20px;
  }
}

/* Refined transparent header controls */
.app-header {
  background: color-mix(in srgb, var(--color-surface) 68%, transparent);
  backdrop-filter: blur(22px) saturate(125%);
  -webkit-backdrop-filter: blur(22px) saturate(125%);
}

.main-nav .nav-item.active,
.main-nav .nav-item.active:hover,
.main-nav .nav-item.active:focus,
.main-nav .nav-item.active:focus-visible {
  color: var(--color-primary);
}

.theme-toggle {
  color: color-mix(in srgb, var(--color-text) 88%, transparent);
  overflow: hidden;
}

.theme-toggle:hover,
.theme-toggle:focus-visible,
.cart-icon:hover,
.cart-icon:focus-visible {
  color: var(--color-primary);
  background: transparent;
}

.theme-icon-window {
  display: block;
  width: 20px;
  height: 20px;
  overflow: hidden;
}

.theme-icon-track {
  display: flex;
  width: 40px;
  height: 20px;
  transform: translateX(0);
  transition: transform 0.48s cubic-bezier(0.22, 1, 0.36, 1);
}

.theme-icon-track.is-light {
  transform: translateX(-20px);
}

.theme-icon {
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
  transition: transform 0.48s cubic-bezier(0.22, 1, 0.36, 1);
}

.theme-icon--moon {
  transform: rotate(0deg);
}

.theme-icon--sun {
  color: #e7b85c;
  transform: rotate(-70deg);
}

.theme-icon-track.is-light .theme-icon--moon {
  transform: rotate(55deg);
}

.theme-icon-track.is-light .theme-icon--sun {
  transform: rotate(0deg);
}

.user-avatar {
  border-color: color-mix(in srgb, var(--color-primary) 82%, transparent);
  box-shadow: none;
}

.cart-icon {
  color: color-mix(in srgb, var(--color-text) 78%, transparent);
}

/* Keep the global header aligned with the wider main canvas */
.app-header .container {
  max-width: 1280px;
}

/* Brand hierarchy: pink for identity and interaction */
.main-nav .nav-item.active,
.main-nav .nav-item.active:hover,
.main-nav .nav-item.active:focus,
.main-nav .nav-item.active:focus-visible {
  color: var(--color-accent);
}

.main-nav .nav-item::after {
  background: var(--color-accent);
}

.theme-toggle:hover,
.theme-toggle:focus-visible,
.cart-icon:hover,
.cart-icon:focus-visible {
  color: var(--color-accent);
}

.user-avatar {
  border-color: color-mix(in srgb, var(--color-accent) 82%, transparent);
}

.auth-button {
  background: var(--color-accent);
  color: var(--color-on-action);
}

/* One alignment rail for header, content, and footer */
.app-header .container,
.footer-simple {
  width: var(--page-content-width);
  max-width: none;
  padding-inline: 0;
}
</style>

<style>
.event-profile-route > .app-header {
  transition: transform .28s cubic-bezier(.2,.75,.2,1), opacity .22s ease;
}
.event-profile-route > .app-header .container { width: 85%; max-width: 1500px; }
.event-profile-route { --app-header-height: 81px; }
.event-profile-header-collapsed > .app-header { transform: translateY(-104%); opacity: 0; pointer-events: none; }
@media (max-width: 760px) {
  .event-profile-route > .app-header .container { width: 80%; }
  .event-profile-route > .app-footer { padding-bottom: 110px; }
}
@media (prefers-reduced-motion: reduce) {
  .event-profile-route > .app-header { transition: none; }
}
.theme-instant,
.theme-instant *,
.theme-instant *::before,
.theme-instant *::after {
  transition: none !important;
  animation: none !important;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: 'Figtree', sans-serif;
  transition:
    background-color 0.4s ease,
    color 0.4s ease;
  min-height: 100vh;
}

/* Responsive styles */
@media (max-width: 768px) {
  .app-footer {
    padding: 2rem 1rem 1.5rem;
  }

  .footer-simple {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }

  .footer-logo-col {
    justify-content: center;
  }

  .footer-center-col {
    font-size: 0.9rem;
    order: 2;
  }

  .footer-social-col {
    order: 1;
    gap: 1.2rem;
  }

  .footer-logo-img {
    height: 40px;
  }
}

@media (max-width: 480px) {
  .app-footer {
    padding: 1.5rem 1rem 1rem;
  }

  .footer-simple {
    gap: 1.2rem;
  }

  .footer-social-col {
    gap: 1rem;
  }

  .footer-social-link {
    width: 36px;
    height: 36px;
  }

  .footer-social-link svg {
    width: 18px;
    height: 18px;
  }

  .footer-logo-img {
    height: 35px;
  }
}
</style>

