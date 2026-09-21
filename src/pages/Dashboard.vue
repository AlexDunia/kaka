<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardContentSkeleton from '@/components/dashboard/DashboardContentSkeleton.vue'
import DashboardManageContent from '@/components/dashboard/DashboardManageContent.vue'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar.vue'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar.vue'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'

const LAST_EVENT_KEY = 'kakaDashboardLastEventId'
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const dashboardStore = useDashboardStore()
const dropdownOpen = ref(false)
const currentManageView = ref('overview')
const pageBody = ref(null)
const showInitialSkeleton = ref(false)
const dashboardError = ref('')
const booting = ref(true)
let overviewAbortController = null
let skeletonTimer = null

const routeEventId = computed(() => {
  const value = Number(route.params.eventId)
  return Number.isInteger(value) && value > 0 ? value : null
})
const activeEvent = computed(() => routeEventId.value ? dashboardStore.getEventById(routeEventId.value) : null)
const overview = computed(() => routeEventId.value ? dashboardStore.getOverview(routeEventId.value) : null)
const isRefreshing = computed(() => routeEventId.value ? dashboardStore.isOverviewLoading(routeEventId.value) : false)
const user = computed(() => authStore.user)
const scrollPageToTop = () => pageBody.value?.scrollTo({ top: 0 })
const closeDropdown = () => { dropdownOpen.value = false }
const toggleDropdown = () => { dropdownOpen.value = !dropdownOpen.value }
const showManage = (view) => { currentManageView.value = view; scrollPageToTop() }

const resolveInitialEvent = () => {
  if (routeEventId.value && dashboardStore.getEventById(routeEventId.value)) return routeEventId.value
  try {
    const stored = Number(localStorage.getItem(LAST_EVENT_KEY))
    if (Number.isInteger(stored) && dashboardStore.getEventById(stored)) return stored
  } catch {}
  return dashboardStore.events[0]?.id || null
}
const rememberEvent = (eventId) => { try { localStorage.setItem(LAST_EVENT_KEY, String(eventId)) } catch {} }
const routeToEvent = async (eventId, { replace = false } = {}) => {
  const event = dashboardStore.getEventById(eventId)
  if (!event) return
  rememberEvent(event.id); closeDropdown()
  const target = { name: 'dashboard-event', params: { eventId: event.id } }
  if (replace) await router.replace(target)
  else await router.push(target)
}
const selectEvent = async (eventId) => {
  if (Number(eventId) === routeEventId.value) return closeDropdown()
  currentManageView.value = 'overview'
  await routeToEvent(eventId)
}
const loadOverview = async (eventId) => {
  if (!eventId) return
  overviewAbortController?.abort()
  overviewAbortController = new AbortController()
  dashboardError.value = ''
  const cached = Boolean(dashboardStore.getOverview(eventId))
  clearTimeout(skeletonTimer)
  if (!cached) skeletonTimer = window.setTimeout(() => { showInitialSkeleton.value = true }, 120)
  try { await dashboardStore.fetchOverview(eventId, { signal: overviewAbortController.signal }) }
  catch (error) {
    if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return
    dashboardError.value = error?.response?.status === 403 ? 'You do not have access to this event dashboard.' : error?.response?.status === 404 ? 'This event no longer exists.' : error?.response?.data?.message || 'We could not load this dashboard.'
  } finally { clearTimeout(skeletonTimer); showInitialSkeleton.value = false }
}
const openPublicEvent = () => { const path = overview.value?.event?.public_path || activeEvent.value?.public_path; if (path) router.push(path) }
const editEvent = () => { if (activeEvent.value) router.push({ name: 'EditEvent', params: { id: activeEvent.value.id } }) }
const bootstrap = async () => {
  booting.value = true; dashboardError.value = ''
  try {
    await dashboardStore.fetchEvents()
    if (!dashboardStore.hasEvents) return
    const eventId = resolveInitialEvent()
    if (!eventId) return
    if (routeEventId.value !== Number(eventId)) { await routeToEvent(eventId, { replace: true }); return }
    rememberEvent(eventId); await loadOverview(eventId)
  } catch (error) { dashboardError.value = dashboardStore.eventsError || 'We could not load your dashboard.' }
  finally { booting.value = false }
}
watch(() => route.params.eventId, async (nextId, previousId) => {
  if (!dashboardStore.eventsLoaded || nextId === previousId) return
  const eventId = Number(nextId)
  if (!Number.isInteger(eventId) || !dashboardStore.getEventById(eventId)) {
    const fallback = resolveInitialEvent(); if (fallback) await routeToEvent(fallback, { replace: true }); return
  }
  rememberEvent(eventId); await loadOverview(eventId)
})
onMounted(bootstrap)
onBeforeUnmount(() => { overviewAbortController?.abort(); clearTimeout(skeletonTimer) })
</script>

<template>
  <div class="event-dashboard">
    <DashboardSidebar :dropdown-open="dropdownOpen" :events="dashboardStore.events" :active-event="activeEvent" :current-manage-view="currentManageView" :user="user" @toggle-dropdown="toggleDropdown" @go-back="router.push('/')" @select-event="selectEvent" @select-view="showManage" />
    <main class="main">
      <DashboardTopbar v-if="activeEvent" :event="overview?.event || activeEvent" :refreshing="isRefreshing" @view-public="openPublicEvent" @edit-event="editEvent" />
      <div id="page-body" ref="pageBody" class="page-body">
        <section v-if="!booting && dashboardStore.eventsLoaded && !dashboardStore.hasEvents" class="dashboard-zero-state"><h1>Your events will live here.</h1><p>Create your first event, then come back here to see sales and activity.</p><button type="button" class="btn btn-primary" @click="router.push({ name: 'CreateEvent' })">Create event</button></section>
        <section v-else-if="dashboardError && !overview" class="dashboard-zero-state"><h1>We couldn't load this event.</h1><p>{{ dashboardError }}</p><button type="button" class="btn btn-ghost" @click="routeEventId && loadOverview(routeEventId)">Try again</button></section>
        <DashboardContentSkeleton v-else-if="showInitialSkeleton && !overview" view="overview" />
        <DashboardManageContent v-else-if="activeEvent && overview" :current-manage-view="currentManageView" :event="overview.event" :overview="overview" @select-view="showManage" />
      </div>
    </main>
  </div>
</template>

<style>
@import '@/components/dashboard/eventDashboard.css';
@import '@/components/dashboard/dashboardLoading.css';
.dashboard-zero-state { width:min(100%,620px); margin:clamp(56px,10vh,110px) auto; padding:0 24px; text-align:center; color:var(--color-text) }
.dashboard-zero-state h1 { margin:0 0 10px; font-size:clamp(1.6rem,4vw,2.3rem); letter-spacing:-.04em }
.dashboard-zero-state p { margin:0 auto 22px; max-width:470px; color:var(--color-muted); line-height:1.6 }
</style>
