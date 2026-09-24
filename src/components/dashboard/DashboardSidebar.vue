<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { RUSH_HOUR_DARK_LOGO } from '@/constants/brand'

const props = defineProps({
  dropdownOpen: {
    type: Boolean,
    required: true,
  },
  currentManageView: {
    type: String,
    required: true,
  },
  events: {
    type: Array,
    default: () => [],
  },
  currentEvent: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits([
  'toggle-dropdown',
  'go-back',
  'select-view',
  'select-event',
])

const authStore = useAuthStore()

const otherEvents = computed(() =>
  props.events.filter(
    (event) =>
      Number(event.id)
      !== Number(props.currentEvent?.id),
  ),
)

const displayName = computed(() => {
  const user = authStore.user || {}
  return user.name
    || [user.first_name, user.last_name].filter(Boolean).join(' ')
    || user.email
    || 'Event organiser'
})

const initials = computed(() =>
  displayName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
    || 'EO',
)

const phaseLabel = (event) => {
  if (event?.phase === 'live') return 'Live now'
  if (event?.phase === 'upcoming') return 'Upcoming'
  if (event?.phase === 'ended') return 'Ended'
  if (event?.phase === 'draft') return 'Draft'
  return event?.status || 'Event'
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <img
        :src="RUSH_HOUR_DARK_LOGO"
        alt="Rush Hour"
        class="sidebar-brand-logo"
      />
    </div>

    <button
      class="back-link"
      type="button"
      @click="$emit('go-back')"
    >
      <svg viewBox="0 0 24 24">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      My Events
    </button>

    <div
      v-if="currentEvent"
      class="event-switcher"
    >
      <button
        class="switcher-current"
        type="button"
        @click="$emit('toggle-dropdown')"
      >
        <div class="switcher-thumb">
          <img
            v-if="currentEvent.cover_image"
            :src="currentEvent.cover_image"
            :alt="currentEvent.title"
          />
        </div>

        <div class="switcher-info">
          <div class="switcher-name">
            {{ currentEvent.title }}
          </div>
          <div class="switcher-action">
            {{ events.length > 1 ? 'Change event' : phaseLabel(currentEvent) }}
          </div>
        </div>

        <div
          v-if="events.length > 1"
          class="switcher-arrow"
          :class="{ open: dropdownOpen }"
        >
          <svg viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>

      <div
        v-if="events.length > 1"
        class="events-dropdown"
        :class="{ open: dropdownOpen }"
      >
        <div class="dropdown-label">
          Your other events
        </div>

        <button
          v-for="event in otherEvents"
          :key="event.id"
          class="dropdown-event"
          type="button"
          @click="$emit('select-event', event.id)"
        >
          <div class="dropdown-thumb">
            <img
              v-if="event.cover_image"
              :src="event.cover_image"
              :alt="event.title"
            />
          </div>

          <div class="dropdown-event-copy">
            <div class="dropdown-event-name">
              {{ event.title }}
            </div>
            <div class="dropdown-event-meta">
              {{ phaseLabel(event) }}
            </div>
          </div>

          <div
            v-if="event.phase === 'live'"
            class="dropdown-live-dot"
          ></div>
        </button>
      </div>
    </div>

    <nav
      class="sidebar-nav"
      id="sidebar-nav"
    >
      <div class="dashboard-nav-sections">
        <div class="nav-section-label">Main</div>

        <button
          class="nav-item"
          :class="{ active: currentManageView === 'overview' }"
          type="button"
          @click="$emit('select-view', 'overview')"
        >
          <svg viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          <span class="nav-label">Overview</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: currentManageView === 'attendees' }"
          type="button"
          @click="$emit('select-view', 'attendees')"
        >
          <svg viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
          <span class="nav-label">Attendees</span>
        </button>

        <div class="nav-section-label">Grow sales</div>

        <button
          class="nav-item"
          :class="{ active: currentManageView === 'share' }"
          type="button"
          @click="$emit('select-view', 'share')"
        >
          <svg viewBox="0 0 24 24">
            <path d="M7 17L17 7" />
            <path d="M7 7h10v10" />
          </svg>
          <span class="nav-label">Promote</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: currentManageView === 'promo' }"
          type="button"
          @click="$emit('select-view', 'promo')"
        >
          <svg viewBox="0 0 24 24">
            <line x1="19" y1="5" x2="5" y2="19" />
            <circle cx="7" cy="7" r="2" />
            <circle cx="17" cy="17" r="2" />
          </svg>
          <span class="nav-label">Discount codes</span>
        </button>

        <button
          class="nav-item"
          :class="{ active: currentManageView === 'email' }"
          type="button"
          @click="$emit('select-view', 'email')"
        >
          <svg viewBox="0 0 24 24">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <span class="nav-label">Message attendees</span>
        </button>

        <div class="nav-section-label">Event day</div>

        <button
          class="nav-item"
          :class="{ active: currentManageView === 'checkin' }"
          type="button"
          @click="$emit('select-view', 'checkin')"
        >
          <svg viewBox="0 0 24 24">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          <span class="nav-label">Door check-in</span>
        </button>

        <div class="nav-section-label">Money</div>

        <button
          class="nav-item"
          :class="{ active: currentManageView === 'payout' }"
          type="button"
          @click="$emit('select-view', 'payout')"
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 1v22" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7H14a3.5 3.5 0 010 7H6" />
          </svg>
          <span class="nav-label">Earnings</span>
        </button>

        <div class="nav-section-label">Manage</div>

        <button
          class="nav-item"
          :class="{ active: currentManageView === 'settings' }"
          type="button"
          @click="$emit('select-view', 'settings')"
        >
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
          <span class="nav-label">Settings</span>
        </button>
      </div>
    </nav>

    <div class="sidebar-footer">
      <div class="sidebar-user">
        <div class="sidebar-avatar">
          {{ initials }}
        </div>
        <div>
          <div class="sidebar-user-name">
            {{ displayName }}
          </div>
          <div class="sidebar-user-role">
            Event organiser
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
button.back-link,
button.switcher-current,
button.nav-item,
button.dropdown-event {
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
}

button.back-link {
  border-bottom: 1px solid var(--line);
}

button.nav-item {
  appearance: none;
}

button.dropdown-event {
  appearance: none;
}
</style>
