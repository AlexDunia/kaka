<script setup>
import { pngIconUrl } from '@/constants/pngIcons'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import PublicSymbols from './PublicSymbols.vue'
import PublicHeaderSearch from './PublicHeaderSearch.vue'
import CaptionLetters from './CaptionLetters.vue'
import HomeAudienceTicker from '@/components/home/HomeAudienceTicker.vue'
import HomeScrollGreeting from '@/components/home/HomeScrollGreeting.vue'
import AccountMenu from '@/components/AccountMenu.vue'
import { useAuthStore } from '@/stores/auth'
import '@/styles/public-site.css'
import '@/styles/public-catalog.css'
import '@/styles/public-motion.css'

const route = useRoute()
const props = defineProps({ headerCollapsed: Boolean })
const auth = useAuthStore()
const menuOpen = ref(false)
const menuToggle = ref(null)
const content = ref(null)
const organizerPrompt = ref(null)
const organizerCaptionReady = ref(false)
let captionObserver
let captionTimer
function prepareCaption() {
  captionObserver?.disconnect()
  window.clearTimeout(captionTimer)
  organizerCaptionReady.value = false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    organizerCaptionReady.value = true
    return
  }
  captionObserver = new IntersectionObserver(
    ([entry]) => {
      window.clearTimeout(captionTimer)
      if (!entry.isIntersecting || organizerCaptionReady.value) return
      captionTimer = window.setTimeout(() => {
        organizerCaptionReady.value = true
        captionObserver?.disconnect()
      }, 180)
    },
    { threshold: 0.5 },
  )
  if (organizerPrompt.value) captionObserver.observe(organizerPrompt.value)
}
let revealObserver
const isActive = (link) => {
  if (link.to === '/find-events') return Boolean(discovery.value)
  return route.path === link.to || (link.to === '/about' && route.name === 'about')
}
const prepareMotion = async () => {
  await nextTick()
  revealObserver?.disconnect()
  if (!content.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return
        target.classList.add('rh-arrived')
        revealObserver.unobserve(target)
      })
    },
    { threshold: 0.12 },
  )
  content.value
    .querySelectorAll('.story-row, .section-heading, .event-card, .city-card')
    .forEach((element) => {
      element.classList.remove('rh-arrived')
      revealObserver.observe(element)
    })
}
watch(
  () => route.path,
  () => {
    prepareMotion()
    prepareCaption()
  },
)
const isHome = computed(() => route.name === 'home')
const discovery = computed(
  () => route.name === 'search' || route.name === 'find-events' || route.meta.discoveryCategory,
)
const links = [
  { to: '/', label: 'Home' },
  { to: '/find-events', label: 'Find event' },
  { to: '/about', label: 'About us' },
]
const escape = (event) => {
  if (event.key === 'Escape' && menuOpen.value) {
    menuOpen.value = false
    menuToggle.value?.focus()
  }
}
watch(
  () => props.headerCollapsed,
  (collapsed) => {
    if (collapsed) menuOpen.value = false
  },
)
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)
onMounted(() => {
  document.addEventListener('keydown', escape)
  prepareMotion()
  prepareCaption()
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', escape)
  revealObserver?.disconnect()
  captionObserver?.disconnect()
  window.clearTimeout(captionTimer)
})
</script>

<template>
  <div
    class="public-site"
    :class="{
      'public-site--discovery': discovery,
      'public-site--home': isHome,
      'public-site--page': !isHome && !discovery,
    }"
  >
    <PublicSymbols />
    <HomeAudienceTicker v-if="isHome" />
    <header
      class="site-header"
      data-public-header
      :class="{ 'menu-open': menuOpen, 'site-header--collapsed': headerCollapsed }"
      :inert="headerCollapsed || undefined"
      :aria-hidden="headerCollapsed || undefined"
    >
      <div class="container nav-shell">
        <RouterLink to="/" class="wordmark" aria-label="Rush Hour Ticket home"
          ><span class="rh-brand-main">rushhour</span
          ><span class="rh-brand-tickets">ticket</span></RouterLink
        >
        <nav class="desktop-nav" aria-label="Main navigation">
          <RouterLink
            v-for="link in links"
            :key="link.to"
            :to="link.to"
            :class="{ 'is-current': isActive(link) }"
            :aria-current="isActive(link) ? 'location' : undefined"
            >{{ link.label }}</RouterLink
          >
        </nav>
        <div class="header-actions">
          <PublicHeaderSearch />
          <RouterLink class="public-cart-link" to="/cart" aria-label="Your cart"
            ><svg class="icon" aria-hidden="true" viewBox="0 0 24 24" @contextmenu.prevent @dragstart.prevent><image :href="pngIconUrl('cart')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg></RouterLink
          ><AccountMenu v-if="(auth.isAuthenticated || auth.isPreview)" context="site" class="header-account" /><RouterLink
            v-else
            class="public-login-link"
            to="/login"
            >Log in</RouterLink
          ><button
            ref="menuToggle"
            class="mobile-toggle"
            type="button"
            aria-controls="public-mobile-nav"
            :aria-expanded="menuOpen"
            :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
            @click="menuOpen = !menuOpen"
          >
            <img class="mobile-menu-art" draggable="false" @contextmenu.prevent @dragstart.prevent :src="pngIconUrl(menuOpen ? 'close' : 'menu')" alt="" aria-hidden="true" width="24" height="24" />
          </button>
        </div>
      </div>
      <Transition name="rh-popup" appear><nav v-if="menuOpen"
        id="public-mobile-nav"
        class="mobile-nav"
        :class="{ open: menuOpen }"
        aria-label="Mobile navigation"
      >
        <RouterLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :class="{ 'is-current': isActive(link) }"
          :aria-current="isActive(link) ? 'location' : undefined"
          @click="menuOpen = false"
          >{{ link.label }}</RouterLink
        ><RouterLink to="/create-event" @click="menuOpen = false">Create event</RouterLink
        ><RouterLink to="/contact" @click="menuOpen = false">Contact us</RouterLink>
        <AccountMenu v-if="(auth.isAuthenticated || auth.isPreview)" context="site" label="Your account" />
        <RouterLink v-else to="/login" @click="menuOpen = false">Log in</RouterLink>
      </nav></Transition>
      <HomeScrollGreeting
        v-if="isHome || discovery"
        :key="route.path"
        :seller="Boolean(discovery)"
      />
    </header>
    <div ref="content" class="public-page-content">
      <div :key="route.path" class="public-page-arrival"><slot /></div>
    </div>
    <footer class="site-footer">
      <div
        ref="organizerPrompt"
        class="container footer-organizer-prompt"
        :class="{ 'footer-organizer-prompt--ready': organizerCaptionReady }"
      >
        <span
          ><CaptionLetters text="Want to sell your event?" :ready="organizerCaptionReady"
        /></span>
        <RouterLink
          :to="
            (auth.isAuthenticated || auth.isPreview)
              ? '/create-event'
              : { path: '/register', query: { redirect: '/create-event' } }
          "
          ><CaptionLetters text="Start here" :ready="organizerCaptionReady"
        /></RouterLink>
      </div>
      <div class="container">
        <div class="footer-line">
          <RouterLink class="wordmark" :to="discovery ? '/find-events#top' : '/#top'"
            ><span class="rh-brand-main">rushhour</span
            ><span class="rh-brand-tickets">ticket</span></RouterLink
          >
          <nav class="footer-links" aria-label="Footer navigation">
            <RouterLink
              v-for="link in links"
              :key="link.to"
              :to="link.to"
              :class="{ 'is-current': isActive(link) }"
              :aria-current="isActive(link) ? 'location' : undefined"
              >{{ link.label }}</RouterLink
            >
          </nav>
        </div>
        <p class="legal-note">© {{ new Date().getFullYear() }} Rush Hour Ticket.</p>
      </div>
    </footer>
  </div>
</template>
