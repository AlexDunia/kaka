<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

defineProps({
  isEditMode: {
    type: Boolean,
    required: true,
  },
  currentStep: {
    type: Number,
    required: true,
  },
})

defineEmits(['enter-edit-mode', 'exit-edit-mode', 'select-step'])

const authStore = useAuthStore()
const storedUser = ref(null)

const readStoredUser = () => {
  try {
    const userJson = localStorage.getItem('user')
    storedUser.value = userJson ? JSON.parse(userJson) : null
  } catch {
    storedUser.value = null
  }
}

onMounted(() => {
  readStoredUser()
})

const dashboardUser = computed(() => authStore.user || storedUser.value || {})

const displayName = computed(() => {
  const user = dashboardUser.value
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ')
  return user.display_name || user.name || fullName || user.email || 'Organiser'
})

const avatarUrl = computed(() => {
  const user = dashboardUser.value
  return (
    user.avatar_url ||
    user.avatar ||
    user.photo ||
    user.photoURL ||
    user.picture ||
    user.image ||
    user.profile_image ||
    user.profileImage ||
    ''
  )
})

const userInitials = computed(() => {
  const source = displayName.value.includes('@')
    ? displayName.value.split('@')[0]
    : displayName.value

  const initials = source
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return initials || 'U'
})
</script>

<template>
  <header class="topbar" aria-label="Dashboard header">
    <div class="topbar-manage dashboard-header-shell" id="topbar-manage">
      <div class="dashboard-header-title-wrap">
        <span class="dashboard-header-kicker">Organiser workspace</span>
        <h1 class="dashboard-header-title">Dashboard</h1>
      </div>

      <div class="dashboard-auth" :aria-label="`Authenticated as ${displayName}`">
        <div class="dashboard-auth-copy">
          <span>Signed in</span>
          <strong>{{ displayName }}</strong>
        </div>
        <div class="dashboard-avatar" aria-hidden="true">
          <img v-if="avatarUrl" :src="avatarUrl" :alt="displayName" />
          <span v-else>{{ userInitials }}</span>
        </div>
      </div>
    </div>
  </header>
</template>
