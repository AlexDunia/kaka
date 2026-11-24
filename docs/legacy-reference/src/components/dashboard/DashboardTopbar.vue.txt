<script setup>
import { computed } from 'vue'
import AccountMenu from '@/components/AccountMenu.vue'
import { formatEventDate } from '@/utils/dashboardFormat'

const props = defineProps({
  event: {
    type: Object,
    default: null,
  },
})

defineEmits([
  'view-public',
  'edit-event',
])

const statusLabel = computed(() => {
  if (props.event?.phase === 'live') return 'Live'
  if (props.event?.phase === 'upcoming') return 'Upcoming'
  if (props.event?.phase === 'ended') return 'Ended'
  if (props.event?.phase === 'draft') return 'Draft'
  return props.event?.status || 'Event'
})

const meta = computed(() => {
  if (!props.event) return ''

  return [
    formatEventDate(
      props.event.starts_at,
      props.event.timezone,
    ),
    props.event.venue || 'Venue TBA',
  ].join(' · ')
})
</script>

<template>
  <header
    class="topbar"
    aria-label="Dashboard header"
  >
    <div class="topbar-manage dashboard-header-shell">
      <div class="dashboard-header-title-wrap">
        <span class="dashboard-header-kicker">
          Event dashboard
        </span>

        <div class="dashboard-title-row">
          <h1 class="dashboard-header-title">
            {{ event?.title || 'Your event' }}
          </h1>

          <span
            v-if="event"
            class="dashboard-header-status"
          >
            <span class="status-dot"></span>
            {{ statusLabel }}
          </span>
        </div>

        <p class="dashboard-header-meta">
          {{ meta }}
        </p>
      </div>

      <div class="dashboard-header-right">
        <div
          v-if="event"
          class="dashboard-header-actions"
        >
          <button
            type="button"
            class="btn btn-ghost dashboard-header-action"
            @click="$emit('view-public')"
          >
            View public page
          </button>

          <button
            type="button"
            class="btn btn-primary dashboard-header-action"
            @click="$emit('edit-event')"
          >
            Edit event
          </button>
        </div>

        <AccountMenu context="dashboard" />
      </div>
    </div>
  </header>
</template>
