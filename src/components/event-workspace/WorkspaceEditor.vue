<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CreateEvent from '@/pages/CreateEvent.vue'
import WorkspaceEventLifecycle from './WorkspaceEventLifecycle.vue'
import WorkspaceEarningsPayouts from './WorkspaceEarningsPayouts.vue'

defineProps({ eventId: [Number, String], overview: Object })
defineEmits(['navigate', 'refresh'])
const route = useRoute()
const router = useRouter()
const tabs = [
  { key: 'details', label: 'Event details' },
  { key: 'tickets', label: 'Ticket types' },
  { key: 'checkout', label: 'Checkout' },
  { key: 'access', label: 'Event access' },
  { key: 'payments', label: 'Payouts' },
]
const selected = computed(() => tabs.some((tab) => tab.key === route.query.tab) ? route.query.tab : 'details')
const formSection = computed(() => ['details', 'tickets', 'checkout'].includes(selected.value))
const lastFormSection = ref('details')
function selectTab(key) {
  if (['details', 'tickets', 'checkout'].includes(key)) lastFormSection.value = key
  router.replace({ query: { ...route.query, tab: key } })
}
function tabKey(event, index) {
  const offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
  if (!offset && !['Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + offset + tabs.length) % tabs.length
  selectTab(tabs[next].key)
  event.currentTarget.parentElement.children[next].focus()
}
</script>

<template>
  <section class="rh-screen workspace-editor" aria-label="Edit event">
    <div class="rh-tabbar rhs-tabs" role="tablist" aria-label="Event sections">
      <button v-for="(tab, index) in tabs" :id="`event-editor-tab-${tab.key}`" :key="tab.key" type="button" class="rh-tab" role="tab" :aria-selected="selected === tab.key" :aria-controls="`event-editor-pane-${tab.key}`" :tabindex="selected === tab.key ? 0 : -1" @click="selectTab(tab.key)" @keydown="tabKey($event, index)">{{ tab.label }}</button>
    </div>
    <div v-show="formSection" :id="`event-editor-pane-${formSection ? selected : lastFormSection}`" role="tabpanel" :aria-labelledby="`event-editor-tab-${formSection ? selected : lastFormSection}`">
      <CreateEvent :key="eventId" embedded :event-id="eventId" :editor-section="formSection ? selected : lastFormSection" @section-change="selectTab" />
    </div>
    <section v-if="selected === 'access'" id="event-editor-pane-access" role="tabpanel" aria-labelledby="event-editor-tab-access">
      <WorkspaceEventLifecycle :event-id="eventId" :timezone="overview?.event?.timezone" @changed="$emit('refresh')" />
    </section>
    <section v-if="selected === 'payments'" id="event-editor-pane-payments" role="tabpanel" aria-labelledby="event-editor-tab-payments">
      <WorkspaceEarningsPayouts destination-only />
    </section>
  </section>
</template>

<style scoped>
.workspace-editor { width: 100%; min-width: 0; margin-inline: 0; }
.workspace-editor .rhs-tabs { width: 100%; overflow-x: auto; margin: 0 0 32px; padding-inline: 0; }
.workspace-editor .rh-tab { flex-shrink: 0; }
</style>
