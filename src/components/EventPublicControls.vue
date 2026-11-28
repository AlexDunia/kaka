<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@/components/icons/pngIcons'
import { useAuthStore } from '@/stores/auth'
import AccountMenu from '@/components/AccountMenu.vue'
const auth = useAuthStore(),
  route = useRoute(),
  root = ref(null),
  open = ref(false)
const close = () => {
  open.value = false
}
const outside = (event) => {
  if (root.value && !root.value.contains(event.target)) close()
}
const escape = (event) => {
  if (event.key === 'Escape') close()
}
watch(() => route.fullPath, close)
onMounted(() => {
  document.addEventListener('click', outside)
  document.addEventListener('keydown', escape)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', outside)
  document.removeEventListener('keydown', escape)
})
</script>
<template>
  <div ref="root" class="ep-public-controls">
    <AccountMenu v-if="auth.isAuthenticated" />
    <RouterLink
      v-else
      class="ep-account-link"
      :to="{ path: '/login', query: { redirect: route.fullPath } }"
      aria-label="Log in to your account"
      ><UserCircleIcon
    /></RouterLink>
    <button
      type="button"
      class="ep-menu-trigger"
      aria-label="Open navigation menu"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click.stop="open = !open"
    >
      <component :is="open ? XMarkIcon : Bars3Icon" />
    </button>
    <Transition name="rh-popup"
      ><nav v-if="open" class="ep-public-menu" role="menu" aria-label="Site navigation">
        <RouterLink to="/" role="menuitem">Explore events</RouterLink
        ><RouterLink to="/my-tickets" role="menuitem">My tickets</RouterLink
        ><RouterLink to="/cart" role="menuitem">Your cart</RouterLink
        ><RouterLink to="/dashboard" role="menuitem">Manage events</RouterLink
        ><RouterLink to="/create-event" role="menuitem">Create event</RouterLink
        ><RouterLink to="/contact" role="menuitem">Get in touch</RouterLink>
      </nav></Transition
    >
  </div>
</template>
