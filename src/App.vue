<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useRoute } from 'vue-router'
import { useSeo } from '@/composables/useSeo'

const isMobileMenuOpen = ref(false)
const scrollPosition = ref(0)
const currentYear = ref(new Date().getFullYear())
const route = useRoute()
const { updateMetaDescription, updateSocialMeta } = useSeo()

const navigationLinks = [
  { path: '/', name: 'All' },
  { path: '/music', name: 'Music' },
  { path: '/movies', name: 'Movies' },
  { path: '/theatre', name: 'Theatre/Comedy' },
  { path: '/sports', name: 'Sports' },
  { path: '/festivals', name: 'Festivals' },
  { path: '/others', name: 'Others' },
  { path: '/contact', name: 'Contact us' },
]

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (isMobileMenuOpen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const closeMenu = () => {
  isMobileMenuOpen.value = false
  document.body.style.overflow = ''
}

const updateScroll = () => {
  scrollPosition.value = window.scrollY
}

// Update meta tags when route changes
watch(
  () => route.meta,
  (meta) => {
    if (meta.description) {
      updateMetaDescription(meta.description)
    }

    // Update social sharing meta tags
    updateSocialMeta({
      title: meta.title ? `${meta.title} | Kaka` : 'Kaka - Find and Book Amazing Events',
      description: meta.description || 'Discover and book tickets for events near you',
      url: window.location.href,
    })
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('scroll', updateScroll)
  updateScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateScroll)
  document.body.style.overflow = ''
})

const cartStore = useCartStore()
const cartCount = computed(() => cartStore.itemCount)
</script>

<template>
  <div class="app-container">
    <header class="app-header" :class="{ 'nav-shadow': scrollPosition > 20 }">
      <div class="container">
        <div class="logo">
          <RouterLink to="/">
            <img
              src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1747056280/tdlogowhite_fvgocv.png"
              alt="TD Logo"
              class="logo-img"
            />
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
            to="/contact"
            @click="closeMenu"
            class="nav-item"
            :class="{ active: $route.path === '/contact' }"
            >Contact us</RouterLink
          >
        </nav>

        <div class="header-actions">
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
            >
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
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
            >
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Navigation Modal -->
    <Transition name="modal">
      <div v-if="isMobileMenuOpen" class="mobile-nav-modal" :class="{ open: isMobileMenuOpen }">
        <div class="mobile-nav-content">
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
            >
              <path d="M18 6L6 18" />
              <path d="M6 6L18 18" />
            </svg>
          </button>
          <nav class="mobile-nav-list">
            <RouterLink
              v-for="(link, index) in navigationLinks"
              :key="link.path"
              :to="link.path"
              class="mobile-nav-item nav-item"
              :style="{ '--index': index }"
              :class="{ active: $route.path === link.path }"
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
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <footer class="app-footer">
      <div class="footer-simple">
        <div class="footer-logo-col">
          <img
            src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1747056280/tdlogowhite_fvgocv.png"
            alt="TD Logo"
            class="footer-logo-img"
          />
        </div>
        <div class="footer-center-col">
          <span class="footer-copyright">© {{ currentYear }} kakaworldcompany</span>
        </div>
        <div class="footer-social-col">
          <a
            href="https://t.me/yourtelegram"
            target="_blank"
            rel="noopener"
            aria-label="Telegram"
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
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" />
            </svg>
          </a>
          <a
            href="https://linkedin.com/in/yourprofile"
            target="_blank"
            rel="noopener"
            aria-label="LinkedIn"
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
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <path d="M16 8a6 6 0 0 1 6 6v6" />
              <line x1="8" y1="11" x2="8" y2="16" />
              <line x1="8" y1="8" x2="8" y2="8" />
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

.app-header {
  background-color: #121212;
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-shadow {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-img {
  height: 45px;
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
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 0;
  position: relative;
  cursor: pointer;
  z-index: 1;
}

.nav-item.active {
  color: #ffffff;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.cart-icon {
  color: #ffffff;
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
  color: #fff;
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
  color: #ffffff;
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
  background-color: #121212;
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
  color: rgba(255, 255, 255, 0.7);
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
  font-size: 1.1rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
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
  color: #ffffff;
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
  background-color: var(--secondary);
  padding: 4rem 0 2rem;
  width: 100%;
  margin-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.03);
}

.footer-simple {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2.2rem 0 1.2rem 0;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.footer-logo-col {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}

.footer-center-col {
  flex: 1 1 auto;
  text-align: center;
  color: #fff;
  font-size: 1.08rem;
  font-weight: 500;
  opacity: 0.85;
}

.footer-social-col {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 1.2rem;
}

.footer-social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  font-size: 1.2rem;
}

/* Remove hover effect */
.footer-social-link:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  transform: none;
}

/* Logo styles */
.logo a,
.logo-img {
  opacity: 1;
  transform: none;
}

.header-logo-img {
  height: 50px;
  width: auto;
  display: block;
  margin-right: 0.5rem;
  border-radius: 7px;
  box-shadow: 0 2px 8px rgba(192, 72, 136, 0.08);
}

.footer-logo-img {
  height: 50px;
  width: auto;
  display: block;
}
</style>
