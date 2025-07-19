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
  { path: '/blog', name: 'Blog' },
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
              src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1751633898/tdlogo_lfg0lh-_2_hcydfz.png"
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
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <footer class="app-footer">
      <div class="footer-simple">
        <div class="footer-logo-col">
          <img
            src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1751633898/tdlogo_lfg0lh-_2_hcydfz.png"
            alt="TD Logo"
            class="footer-logo-img"
          />
        </div>
        <div class="footer-center-col">
          <span class="footer-copyright">© {{ currentYear }} kakaworldcompany</span>
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
  height: 60px;
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
  z-index: 1;
  transition: color 0.3s ease;
}

.nav-item:hover {
  cursor: pointer;
  color: #ffffff;
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
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  padding: 1rem 1.5rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  opacity: 0;
  transform: translateY(20px);
  transition:
    opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
    color 0.3s ease;
  transition-delay: calc(var(--index) * 0.1s);
}

.mobile-nav-item:hover {
  cursor: pointer;
  color: #ffffff;
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
  padding: 3rem 1rem 2rem;
  width: 100%;
  margin-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.03);
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
  color: #fff;
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
  background: rgba(255, 255, 255, 0.04);
  color: #fff;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.footer-social-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
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
  box-shadow: 0 4px 12px rgba(220, 39, 67, 0.2);
}

.footer-social-link[aria-label='TikTok']:hover {
  background: #000000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  color: #00f2ea;
}

.footer-social-link[aria-label='Facebook']:hover {
  background: #1877f2;
  box-shadow: 0 4px 12px rgba(24, 119, 242, 0.2);
}

.footer-social-link[aria-label='X (Twitter)']:hover {
  background: #000000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.footer-logo-img {
  height: 45px;
  width: auto;
  display: block;
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
