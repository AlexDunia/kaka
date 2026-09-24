<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import DashboardContentSkeleton from '@/components/dashboard/DashboardContentSkeleton.vue'
import DashboardManageContent from '@/components/dashboard/DashboardManageContent.vue'
import DashboardSidebar from '@/components/dashboard/DashboardSidebar.vue'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar.vue'
import { useDashboardStore } from '@/stores/dashboard'

const route = useRoute()
const router = useRouter()
const dashboardStore = useDashboardStore()

const {
  events,
  eventsLoading,
  eventsError,
} = storeToRefs(dashboardStore)

const dropdownOpen = ref(false)
const currentManageView = ref('overview')
const loadingView = ref('overview')
const toast = ref(null)
const overviewLoading = ref(false)
const pageError = ref('')
let toastTimer = null

const selectedEventId = computed(() => {
  const routeId = Number(route.params.eventId)
  if (Number.isInteger(routeId) && routeId > 0) return routeId
  return Number(events.value[0]?.id || 0)
})

const selectedEvent = computed(() =>
  events.value.find(
    (event) => Number(event.id) === selectedEventId.value,
  ) || null,
)

const overview = computed(() =>
  selectedEventId.value
    ? dashboardStore.getOverview(selectedEventId.value)
    : null,
)

const isDashboardLoading = computed(
  () =>
    eventsLoading.value
    || overviewLoading.value
    || (
      Boolean(selectedEventId.value)
      && !overview.value
      && !pageError.value
    ),
)

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

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

const showManage = (key) => {
  currentManageView.value = key
  loadingView.value = key
}

const loadOverview = async (eventId, { force = false } = {}) => {
  if (!eventId) return

  overviewLoading.value = true
  pageError.value = ''

  try {
    await dashboardStore.fetchOverview(
      eventId,
      { force },
    )
  } catch (error) {
    pageError.value =
      error?.response?.data?.message
      || 'We could not load this event dashboard.'
  } finally {
    overviewLoading.value = false
  }
}

const normalizeRouteToOwnedEvent = async () => {
  if (!events.value.length) return

  const requestedId = Number(route.params.eventId)
  const requestedIsOwned = events.value.some(
    (event) => Number(event.id) === requestedId,
  )

  const targetId = requestedIsOwned
    ? requestedId
    : Number(events.value[0].id)

  if (
    route.name !== 'dashboard-event'
    || Number(route.params.eventId) !== targetId
  ) {
    await router.replace({
      name: 'dashboard-event',
      params: { eventId: targetId },
    })
  }
}

const loadDashboard = async () => {
  pageError.value = ''

  try {
    await dashboardStore.fetchEvents()
    await normalizeRouteToOwnedEvent()

    if (selectedEventId.value) {
      await loadOverview(selectedEventId.value)
    }
  } catch (error) {
    pageError.value =
      error?.response?.data?.message
      || eventsError.value
      || 'We could not load your dashboard.'
  }
}

const selectEvent = async (eventId) => {
  closeDropdown()

  const id = Number(eventId)
  if (!id || id === selectedEventId.value) return

  currentManageView.value = 'overview'

  await router.push({
    name: 'dashboard-event',
    params: { eventId: id },
  })
}

const goBack = () => {
  router.push('/')
}

const viewPublicEvent = () => {
  if (!selectedEvent.value?.public_path) return
  router.push(selectedEvent.value.public_path)
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

    const owned = events.value.some(
      (event) => Number(event.id) === id,
    )

    if (!owned) {
      await normalizeRouteToOwnedEvent()
      return
    }

    await loadOverview(id)
  },
)

onMounted(loadDashboard)
onBeforeUnmount(() => window.clearTimeout(toastTimer))
</script>

<template>
  <div class="event-dashboard">
    <DashboardSidebar
      :dropdown-open="dropdownOpen"
      :current-manage-view="currentManageView"
      :events="events"
      :current-event="selectedEvent"
      @toggle-dropdown="toggleDropdown"
      @go-back="goBack"
      @select-view="showManage"
      @select-event="selectEvent"
    />

    <main class="main">
      <DashboardTopbar
        :event="selectedEvent"
        @view-public="viewPublicEvent"
        @edit-event="editEvent"
      />

      <div id="page-body" class="page-body">
        <DashboardContentSkeleton
          v-if="isDashboardLoading"
          :view="loadingView"
        />

        <section
          v-else-if="pageError"
          class="mv-wrap"
          role="alert"
        >
          <div class="card" style="padding:var(--s6)">
            <div class="chart-head-title">
              We could not load this dashboard.
            </div>
            <p
              style="
                margin-top:var(--s3);
                color:var(--t-lo);
                line-height:1.6;
              "
            >
              {{ pageError }}
            </p>
            <button
              type="button"
              class="btn btn-primary"
              style="margin-top:var(--s4)"
              @click="loadDashboard"
            >
              Try again
            </button>
          </div>
        </section>

        <section
          v-else-if="!events.length"
          class="mv-wrap"
        >
          <div class="card" style="padding:var(--s6)">
            <div class="chart-head-title">
              No events yet
            </div>
            <p
              style="
                margin-top:var(--s3);
                color:var(--t-lo);
                line-height:1.6;
              "
            >
              Create an event first. Its live sales data will appear here.
            </p>
            <button
              type="button"
              class="btn btn-primary"
              style="margin-top:var(--s4)"
              @click="router.push({ name: 'CreateEvent' })"
            >
              Create event
            </button>
          </div>
        </section>

        <DashboardManageContent
          v-else
          :current-manage-view="currentManageView"
          :event="selectedEvent"
          :overview="overview"
          @select-view="showManage"
          @link-created="showSuccessToast"
          @refresh-overview="loadOverview(selectedEventId, { force: true })"
        />
      </div>
    </main>

    <Transition name="dashboard-toast">
      <div
        v-if="toast"
        :key="toast.key"
        class="dashboard-success-toast"
        role="status"
        aria-live="polite"
      >
        <span
          class="dashboard-success-toast__icon"
          aria-hidden="true"
        >
          &#10003;
        </span>
        <div>
          <strong>Done</strong>
          <p>{{ toast.message }}</p>
        </div>
        <span
          class="dashboard-success-toast__progress"
          aria-hidden="true"
        ></span>
      </div>
    </Transition>
  </div>
</template>

<style>
@import '@/components/dashboard/eventDashboard.css';
@import '@/components/dashboard/dashboardLoading.css';
</style>
