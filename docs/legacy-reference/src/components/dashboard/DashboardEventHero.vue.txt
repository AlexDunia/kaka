<script setup>
import { computed } from 'vue'
import { formatEventDate } from '@/utils/dashboardFormat'

const props = defineProps({
  overview: {
    type: Object,
    required: true,
  },
})

const event = computed(() => props.overview.event || {})

const phaseLabel = computed(() => {
  if (event.value.phase === 'live') return 'Live now'
  if (event.value.phase === 'upcoming') return 'Upcoming'
  if (event.value.phase === 'ended') return 'Event ended'
  if (event.value.phase === 'draft') return 'Draft'
  return event.value.status || 'Event'
})

const countdownLabel = computed(() => {
  if (event.value.phase === 'live') return 'Happening now'
  if (event.value.phase === 'ended') return 'Event ended'

  const days = event.value.days_to_go
  if (days === null || days === undefined) return ''
  if (days === 0) return 'Today'
  if (days === 1) return '1 day to go'
  return `${days} days to go`
})
</script>

<template>
  <div class="event-hero">
    <img
      v-if="event.cover_image"
      :src="event.cover_image"
      :alt="event.title"
    />

    <div class="event-hero-overlay"></div>

    <div class="event-hero-content">
      <div class="hero-status">
        <span class="status-dot"></span>
        {{ phaseLabel }}
      </div>

      <div class="hero-title">
        {{ event.title }}
      </div>

      <div class="hero-meta">
        <div class="hero-meta-item">
          <svg viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>

          {{
            formatEventDate(
              event.starts_at,
              event.timezone,
            )
          }}
        </div>

        <div class="hero-meta-item">
          <svg viewBox="0 0 24 24">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>

          {{ event.venue || 'Venue TBA' }}
        </div>

        <div
          v-if="countdownLabel"
          class="hero-countdown"
        >
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>

          {{ countdownLabel }}
        </div>
      </div>
    </div>
  </div>
</template>
