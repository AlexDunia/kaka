<script setup>
import { RouterLink, RouterView } from 'vue-router'
import { ref, onMounted, onUnmounted } from 'vue'

const isMobileMenuOpen = ref(false)
const scrollPosition = ref(0)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const updateScroll = () => {
  scrollPosition.value = window.scrollY
}

onMounted(() => {
  window.addEventListener('scroll', updateScroll)
  updateScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', updateScroll)
})
</script>

<template>
  <div class="app-container">
    <header class="app-header" :class="{ 'nav-shadow': scrollPosition > 20 }">
      <div class="container">
        <div class="header-content">
          <div class="logo">
            <RouterLink to="/">
              <h1>tixdemand</h1>
            </RouterLink>
          </div>

          <nav class="main-nav" :class="{ 'mobile-open': isMobileMenuOpen }">
            <RouterLink to="/" @click="isMobileMenuOpen = false" class="nav-link"
              >Events</RouterLink
            >
            <div class="nav-dropdown">
              <span class="dropdown-title">Categories</span>
              <div class="dropdown-content">
                <RouterLink to="/music" @click="isMobileMenuOpen = false">Music</RouterLink>
                <RouterLink to="/movies" @click="isMobileMenuOpen = false">Movies</RouterLink>
                <RouterLink to="/theatre" @click="isMobileMenuOpen = false"
                  >Theatre/Comedy</RouterLink
                >
                <RouterLink to="/sports" @click="isMobileMenuOpen = false">Sports</RouterLink>
                <RouterLink to="/festivals" @click="isMobileMenuOpen = false">Festivals</RouterLink>
                <RouterLink to="/others" @click="isMobileMenuOpen = false">Others</RouterLink>
              </div>
            </div>
            <RouterLink to="/contact" @click="isMobileMenuOpen = false" class="nav-link"
              >Contact</RouterLink
            >
      </nav>

          <div class="header-actions">
            <RouterLink to="/login" class="auth-btn">
              <div class="user-icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <span class="login-text">Login</span>
            </RouterLink>

            <button class="mobile-menu-toggle" @click="toggleMobileMenu">
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
    </div>
  </header>

    <main class="app-content">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <footer class="app-footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-logo">
            <h2 class="gradient-text">tixdemand</h2>
            <p>Your premier destination for event tickets</p>
          </div>

          <div class="footer-links">
            <div class="footer-section">
              <h3>Explore</h3>
              <RouterLink to="/">All Events</RouterLink>
              <RouterLink to="/music">Music</RouterLink>
              <RouterLink to="/theatre">Theatre</RouterLink>
              <RouterLink to="/sports">Sports</RouterLink>
            </div>

            <div class="footer-section">
              <h3>Account</h3>
              <RouterLink to="/login">Sign In</RouterLink>
              <RouterLink to="/register">Register</RouterLink>
              <RouterLink to="/dashboard">Dashboard</RouterLink>
            </div>

            <div class="footer-section">
              <h3>Support</h3>
              <RouterLink to="/contact">Contact Us</RouterLink>
              <a href="#">FAQ</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; 2024 tixdemand. All rights reserved.</p>
          <div class="social-links">
            <a href="#" aria-label="Facebook">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
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
            <a href="#" aria-label="Twitter">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"
                ></path>
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
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
          </div>
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
  background-color: rgba(10, 10, 15, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all var(--transition-medium) ease;
  width: 100%;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.nav-shadow {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.logo h1 {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-color);
  margin: 0;
  display: flex;
  align-items: center;
  letter-spacing: -0.04em;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo h1::before {
  content: '';
  display: inline-block;
  width: 22px;
  height: 22px;
  background-color: var(--primary);
  border-radius: 4px;
  margin-right: 8px;
  vertical-align: -3px;
  transform: rotate(45deg);
  transition: transform var(--transition-medium) ease;
}

.logo:hover h1::before {
  transform: rotate(135deg);
}

.main-nav {
  display: flex;
  gap: 2.5rem;
  align-items: center;
}

.nav-dropdown {
  position: relative;
  cursor: pointer;
}

.dropdown-title {
  display: flex;
  align-items: center;
  opacity: 0.7;
  transition: opacity var(--transition-fast) ease;
  font-size: 0.95rem;
}

.dropdown-title:after {
  content: '';
  display: inline-block;
  width: 6px;
  height: 6px;
  border-right: 2px solid;
  border-bottom: 2px solid;
  transform: rotate(45deg);
  margin-left: 8px;
  transition: transform var(--transition-fast) ease;
}

.nav-dropdown:hover .dropdown-title:after {
  transform: rotate(-135deg) translateY(-2px);
}

.nav-dropdown:hover .dropdown-title {
  opacity: 1;
}

.dropdown-content {
  position: absolute;
  top: 120%;
  left: 50%;
  transform: translateX(-50%) translateY(5px);
  background-color: var(--card-highlight);
  border-radius: 8px;
  padding: 0.5rem;
  min-width: 180px;
  box-shadow: var(--shadow-elevated);
  opacity: 0;
  visibility: hidden;
  transition: all var(--transition-fast) ease;
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.nav-dropdown:hover .dropdown-content {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}

.dropdown-content a {
  display: block;
  padding: 0.75rem 1rem;
  white-space: nowrap;
  transition:
    background-color var(--transition-fast) ease,
    color var(--transition-fast) ease;
  border-radius: 4px;
  font-size: 0.9rem;
}

.dropdown-content a:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: var(--primary);
}

.main-nav a {
  font-size: 0.95rem;
  opacity: 0.7;
  transition: all var(--transition-fast) ease;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 0;
  height: 2px;
  background-color: var(--primary);
  transition: width var(--transition-fast) ease;
}

.main-nav a:hover,
.main-nav a.router-link-active {
  opacity: 1;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.auth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.2rem;
  border-radius: var(--button-radius);
  background-color: rgba(255, 255, 255, 0.05);
  transition: all var(--transition-fast) ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.auth-btn:hover {
  background-color: rgba(232, 67, 147, 0.1);
  transform: scale(1.05);
  border-color: rgba(232, 67, 147, 0.3);
}

.user-icon {
  color: var(--text-color);
  margin-right: 0.5rem;
}

.login-text {
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.02em;
}

.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.mobile-menu-toggle span {
  display: block;
  width: 100%;
  height: 2px;
  background-color: var(--text-color);
  transition: all var(--transition-fast) ease;
}

.app-content {
  flex: 1;
  width: 100%;
}

.app-footer {
  background-color: var(--secondary);
  padding: 4rem 0 2rem;
  width: 100%;
  margin-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.03);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  margin-bottom: 3rem;
}

.footer-logo h2 {
  font-size: 1.8rem;
  margin-bottom: 0.5rem;
  letter-spacing: -0.04em;
}

.footer-logo p {
  font-size: 0.9rem;
  opacity: 0.7;
  max-width: 260px;
}

.footer-links {
  display: flex;
  gap: 5rem;
}

.footer-section h3 {
  font-size: 0.9rem;
  text-transform: uppercase;
  margin-bottom: 1.25rem;
  color: var(--primary);
  letter-spacing: 0.1em;
}

.footer-section a {
  display: block;
  font-size: 0.9rem;
  opacity: 0.7;
  margin-bottom: 0.75rem;
  transition:
    opacity var(--transition-fast) ease,
    transform var(--transition-fast) ease;
}

.footer-section a:hover {
  opacity: 1;
  transform: translateX(3px);
}

.footer-bottom {
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-bottom p {
  font-size: 0.85rem;
  opacity: 0.6;
  margin: 0;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-links a {
    display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.05);
  transition: all var(--transition-fast) ease;
  color: var(--text-secondary);
}

.social-links a:hover {
  background-color: var(--primary);
  transform: translateY(-3px);
  color: var(--text-color);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-medium) cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .main-nav {
    position: fixed;
    top: 64px;
    right: -300px;
    width: 300px;
    flex-direction: column;
    background-color: var(--secondary);
    height: calc(100vh - 64px);
    padding: 2rem;
    gap: 1.5rem;
    z-index: 90;
    align-items: flex-start;
    transition: right var(--transition-medium) ease;
    box-shadow: -5px 0 15px rgba(0, 0, 0, 0.2);
  }

  .main-nav.mobile-open {
    right: 0;
  }

  .nav-dropdown {
    width: 100%;
  }

  .dropdown-content {
    position: static;
    transform: none;
    opacity: 1;
    visibility: visible;
    padding: 0.5rem 0 0 1rem;
    box-shadow: none;
    display: none;
    background-color: transparent;
    border: none;
  }

  .nav-dropdown:hover .dropdown-content {
    display: block;
    transform: none;
  }

  .dropdown-content a {
    padding: 0.75rem 0;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .footer-content {
    flex-direction: column;
    gap: 2.5rem;
  }

  .footer-links {
    flex-wrap: wrap;
    gap: 2.5rem;
  }

  .footer-bottom {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
    padding-top: 2rem;
  }
}
</style>
