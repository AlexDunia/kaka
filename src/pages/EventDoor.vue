<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WorkspaceDoorCheckin from '@/components/event-workspace/WorkspaceDoorCheckin.vue'
import WorkspaceAttendees from '@/components/event-workspace/WorkspaceAttendees.vue'
import { getAdmissionContext, operationsError } from '@/services/eventOperationsService'
const route = useRoute(),
  router = useRouter(),
  context = ref(null),
  error = ref(''),
  message = ref(''),
  loading = ref(true)
let version = 0
const overview = computed(() => ({
  event: { ...context.value?.event, timezone: context.value?.event.event_timezone },
}))
const page = computed(() =>
  context.value?.role !== 'door' && ['attendees', 'purchase'].includes(route.query.view)
    ? route.query.view
    : 'checkin',
)
async function load() {
  const request = ++version
  context.value = null
  loading.value = true
  error.value = ''
  try {
    const result = await getAdmissionContext(route.params.eventId)
    if (request === version) context.value = result
  } catch (err) {
    if (request === version) error.value = operationsError(err)
  } finally {
    if (request === version) loading.value = false
  }
}
function navigate(query) {
  const next = typeof query === 'string' ? { view: query } : query
  void router.push({ query: next })
}
watch(() => route.params.eventId, load, { immediate: true })
onBeforeUnmount(() => {
  version++
})
</script>
<template>
  <div class="event-workspace">
    <main class="main-inner content">
      <header class="rh-page-heading">
        <div>
          <span class="rh-eyebrow">Event day</span>
          <h1>{{ context?.event.title || 'Door check-in' }}</h1>
        </div>
        <nav class="rh-form-actions" aria-label="Event operations">
          <button class="rh-button rh-button-outline" @click="navigate({ view: 'checkin' })">
            Door check-in</button
          ><button
            v-if="context && context.role !== 'door'"
            class="rh-button rh-button-outline"
            @click="navigate({ view: 'attendees' })"
          >
            Attendees
          </button>
        </nav>
      </header>
      <p v-if="loading" role="status">Getting your event access ready...</p>
      <p v-else-if="error" role="alert">
        {{ error }} <button class="rh-row-button" @click="load">Try again</button>
      </p>
      <template v-else-if="context"
        ><p v-if="message" role="status">{{ message }}</p>
        <WorkspaceDoorCheckin
          v-if="page === 'checkin'"
          :key="route.params.eventId"
          :event-id="route.params.eventId"
          :overview="overview"
          @navigate="navigate"
          @notify="message = $event" /><WorkspaceAttendees
          v-else
          :key="`attendees-${route.params.eventId}`"
          :page="page"
          :event-id="route.params.eventId"
          :overview="overview"
          @navigate="navigate"
          @notify="message = $event"
      /></template>
    </main>
  </div>
</template>
<style src="@/assets/event-workspace/isolation.css"></style>
<style src="@/assets/event-workspace/reference.css"></style>
<style src="@/assets/event-workspace/integration.css"></style>
<style src="@/assets/event-workspace/brand.css"></style>
<style src="@/assets/event-workspace/attendees.css"></style>
<style src="@/assets/event-workspace/checkin.css"></style>
