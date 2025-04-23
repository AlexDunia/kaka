<script setup>
// Import router functionality is not needed for now
</script>

<template>
  <nav class="navbar">
    <div class="container navbar__container">
      <router-link to="/" class="navbar__logo">
        <span class="navbar__logo-text"> Tix<span class="navbar__logo-accent">Easy</span> </span>
      </router-link>

      <div class="navbar__menu">
        <router-link to="/" class="navbar__menu-item" active-class="navbar__menu-item--active">
          Home
        </router-link>
        <router-link to="/music" class="navbar__menu-item" active-class="navbar__menu-item--active">
          Music
        </router-link>
        <router-link
          to="/sports"
          class="navbar__menu-item"
          active-class="navbar__menu-item--active"
        >
          Sports
        </router-link>
        <router-link to="/arts" class="navbar__menu-item" active-class="navbar__menu-item--active">
          Arts
        </router-link>
        <router-link
          to="/comedy"
          class="navbar__menu-item"
          active-class="navbar__menu-item--active"
        >
          Comedy
        </router-link>
        <router-link
          to="/festivals"
          class="navbar__menu-item"
          active-class="navbar__menu-item--active"
        >
          Festivals
        </router-link>
      </div>

      <div class="navbar__actions">
        <router-link to="/search" class="navbar__action">
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
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </router-link>

        <router-link to="/create-event" class="navbar__action navbar__action--create-event">
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
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>Create Event</span>
        </router-link>

        <router-link to="/login" class="navbar__action navbar__action--auth">
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
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </router-link>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar {
  background-color: rgba(24, 24, 30, 0.8);
  backdrop-filter: blur(10px);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.navbar__container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navbar__logo {
  text-decoration: none;
  color: white;
  font-weight: 700;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
}

.navbar__logo-text {
  background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.7));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.navbar__logo-accent {
  color: var(--primary);
  -webkit-text-fill-color: var(--primary);
}

.navbar__menu {
  display: flex;
  gap: 1.5rem;
}

.navbar__menu-item {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.3s ease;
  padding: 0.25rem 0;
  position: relative;
}

.navbar__menu-item:hover {
  color: white;
}

.navbar__menu-item--active {
  color: white;
}

.navbar__menu-item--active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: var(--primary);
  border-radius: 2px;
}

.navbar__actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.navbar__action {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.navbar__action:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.05);
}

.navbar__action--auth {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.navbar__action--auth:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.navbar__action--create-event {
  background-color: var(--primary);
  color: white;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  gap: 0.5rem;
}

.navbar__action--create-event:hover {
  background-color: var(--primary-dark, #d62e7e);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(232, 67, 147, 0.3);
}

/* Responsive styles */
@media (max-width: 992px) {
  .navbar__menu {
    display: none;
  }
}

@media (max-width: 576px) {
  .navbar__action span {
    display: none;
  }

  .navbar__action--create-event {
    padding: 0.5rem;
    border-radius: 50%;
  }
}
</style>
