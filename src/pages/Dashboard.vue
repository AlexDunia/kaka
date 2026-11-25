<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import EventWorkspace from '@/components/event-workspace/EventWorkspace.vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'
import { useSlug } from '@/composables/useSlug'
defineOptions({ name: 'EventDashboardPage' })

const route = useRoute()
const router = useRouter()
const dashboardStore = useDashboardStore()
const auth = useAuthStore()
const { generateSlug } = useSlug()

const { events, eventsLoading, eventsError } = storeToRefs(dashboardStore)

const viewKeys = [
  'events',
  'overview',
  'event-page',
  'attendees',
  'purchase',
  'share',
  'promo',
  'email',
  'checkin',
  'payout',
  'settings',
  'edit',
]
const currentManageView = computed(() =>
  viewKeys.includes(route.query.view)
    ? route.query.view
    : route.params.eventId
      ? 'overview'
      : 'events',
)
const toast = ref(null)
const overviewLoading = ref(false)
const pageError = ref('')
let toastTimer = null
let overviewRequest = 0
let dashboardRequest = 0

const selectedEventId = computed(() => {
  const routeId = Number(route.params.eventId)
  if (Number.isInteger(routeId) && routeId > 0) return routeId
  return Number(events.value[0]?.id || 0)
})

const selectedEvent = computed(() => {
  const event = events.value.find((event) => Number(event.id) === selectedEventId.value)
  const saved = dashboardStore.getOverview(selectedEventId.value)?.event
  return event || saved ? { ...event, ...saved } : null
})

const overview = computed(() =>
  selectedEventId.value ? dashboardStore.getOverview(selectedEventId.value) : null,
)

const isDashboardLoading = computed(
  () =>
    (!dashboardStore.eventsLoaded && !pageError.value && !eventsError.value) ||
    eventsLoading.value ||
    (currentManageView.value !== 'events' &&
      (overviewLoading.value ||
        (Boolean(selectedEventId.value) && !overview.value && !pageError.value))),
)

const showSuccessToast = (message) => {
  window.clearTimeout(toastTimer)
  toast.value = {
    message,
    key: Date.now(),
  }
  toastTimer = window.setTimeout(() => {
    toast.value = null
  }, 4200)
}

const showManage = (destination) => {
  const { view: key, ...filters } =
    typeof destination === 'string' ? { view: destination } : destination || {}
  if (!viewKeys.includes(key)) return
  router.push({ query: { view: key === 'overview' ? undefined : key, ...filters } })
  window.scrollTo({ top: 0, behavior: 'instant' })
}

const loadOverview = async (eventId, { force = false } = {}) => {
  if (!eventId || (!force && dashboardStore.isOverviewLoading(eventId))) return

  const request = ++overviewRequest
  overviewLoading.value = true
  pageError.value = ''

  try {
    await dashboardStore.fetchOverview(eventId, { force })
  } catch (error) {
    if (request === overviewRequest)
      pageError.value = error.userMessage || 'We could not load this event dashboard.'
  } finally {
    if (request === overviewRequest) overviewLoading.value = false
  }
}

const normalizeRouteToOwnedEvent = async () => {
  if (currentManageView.value === 'events') return
  if (!events.value.length) {
    if (!Number(route.params.eventId))
      await router.replace({ name: 'dashboard', query: { view: 'events' } })
    return
  }

  const requestedId = Number(route.params.eventId)
  // The current page is not the complete owner catalog. The protected overview
  // authorizes a directly linked event instead of silently switching its ID.
  const targetId =
    Number.isSafeInteger(requestedId) && requestedId > 0 ? requestedId : Number(events.value[0].id)

  if (route.name !== 'dashboard-event' || Number(route.params.eventId) !== targetId) {
    await router.replace({
      name: 'dashboard-event',
      params: { eventId: targetId },
      query: route.query,
    })
  }
}

const loadDashboard = async () => {
  const request = ++dashboardRequest
  pageError.value = ''

  try {
    await dashboardStore.fetchEvents({ force: Boolean(eventsError.value) })
    if (request !== dashboardRequest) return
    await normalizeRouteToOwnedEvent()
    if (request !== dashboardRequest) return

    if (selectedEventId.value && currentManageView.value !== 'events') {
      await loadOverview(selectedEventId.value)
    }
  } catch (error) {
    if (request === dashboardRequest)
      pageError.value =
        error?.response?.data?.message || eventsError.value || 'We could not load your dashboard.'
  }
}

const selectEvent = async (eventId, query = {}) => {
  const id = Number(eventId)
  if (
    !id ||
    (id === selectedEventId.value &&
      currentManageView.value !== 'events' &&
      !Object.keys(query).length)
  )
    return

  await router.push({
    name: 'dashboard-event',
    params: { eventId: id },
    query,
  })
}

const goBack = () => {
  router.push({ name: 'dashboard', query: { view: 'events' } })
}

const viewPublicEvent = () => {
  if (!selectedEventId.value) return
  router.push({
    name: 'event-details',
    params: {
      id: selectedEventId.value,
      slug: generateSlug(selectedEvent.value?.title || 'event'),
    },
  })
}

const editEvent = () => {
  if (!selectedEventId.value) return

  router.push({
    name: 'EditEvent',
    params: { id: selectedEventId.value },
  })
}

watch(
  () => route.params.eventId,
  async (next, previous) => {
    const id = Number(next)
    if (!id || id === Number(previous)) return

    // The current list page is not the ownership boundary; Laravel authorizes
    // direct links and reports a missing or forbidden event as an error.
    await loadOverview(id)
  },
)

watch(
  () => auth.user?.id,
  (id) => {
    overviewRequest++
    dashboardRequest++
    overviewLoading.value = false
    dashboardStore.reset()
    pageError.value = ''
    if (id) void loadDashboard()
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  overviewRequest++
  dashboardRequest++
  window.clearTimeout(toastTimer)
})
</script>

<template>
  <div>
    <EventWorkspace
      :view="currentManageView"
      :event="selectedEvent"
      :overview="overview"
      :events="events"
      :loading="isDashboardLoading"
      :error="pageError"
      @navigate="showManage"
      @select-event="selectEvent"
      @retry="loadDashboard"
      @public="viewPublicEvent"
      @edit="editEvent"
      @back="goBack"
      @create="router.push({ name: 'CreateEvent' })"
      @notify="showSuccessToast"
      @refresh="loadOverview(selectedEventId, { force: true })"
    />
    <Transition name="dashboard-toast">
      <div
        v-if="toast"
        :key="toast.key"
        class="dashboard-success-toast"
        role="status"
        aria-live="polite"
      >
        <span class="dashboard-success-toast__icon" aria-hidden="true"> i </span>
        <div>
          <strong>Event update</strong>
          <p>{{ toast.message }}</p>
        </div>
        <span class="dashboard-success-toast__progress" aria-hidden="true"></span>
      </div>
    </Transition>
  </div>
</template>

<style>
.dashboard-success-toast {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 100;
  max-width: 420px;
  display: flex;
  gap: 12px;
  padding: 18px 24px;
  border: 1px solid #e5e8ed;
  border-radius: 8px;
  background: white;
  box-shadow: 0 10px 40px #17121e20;
  color: #343b46;
  font:
    14px/1.5 'DM Sans',
    sans-serif;
}
.dashboard-success-toast p {
  margin: 4px 0 0;
}
.dashboard-success-toast__icon {
  color: #0f7055;
}
.dashboard-success-toast__progress {
  display: none;
}
@media (max-width: 760px) {
  .dashboard-success-toast {
    left: 20px;
    right: 20px;
    bottom: 20px;
  }
}
</style>
