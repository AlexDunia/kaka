<script setup>
import { computed, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { overviewEventDate } from './overviewModel'
import { usePreviewWorkspaceAttendees } from './previewAttendeesModel'
import { DASHBOARD_PREVIEW } from '@/services/dashboardPreview'
import { formatNumber as number } from '@/utils/dashboardFormat'

const props = defineProps({ events: { type: Array, default: () => [] }, overview: Object })
const emit = defineEmits(['open', 'create'])
const auth = useAuthStore(),
  dashboard = useDashboardStore()
const firstName = computed(() => auth.user?.first_name || auth.user?.name?.split(' ')[0] || '')
const eventOverview = (event) =>
  dashboard.getOverview(event.id) ||
  (String(props.overview?.event?.id) === String(event.id) ? props.overview : null)
const events = computed(() =>
  props.events.map((event) => ({ ...event, ...eventOverview(event)?.event })),
)
const firstEvent = computed(() => !events.value.length && dashboard.eventsTotal === 0)
const eventSales = (event) => eventOverview(event)?.sales
const upcoming = computed(() => events.value.filter((event) => event.phase === 'upcoming'))
const featured = computed(
  () =>
    [...upcoming.value].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))[0] ||
    events.value[0],
)
const totals = computed(() =>
  DASHBOARD_PREVIEW && props.events.length && props.events.every((event) => eventSales(event))
    ? props.events.reduce(
        (sum, event) => {
          const sales = eventSales(event)
          return {
            sold: sum.sold + Number(sales.units_sold || 0),
            available: sum.available + Number(sales.available_units || 0),
            capacity: sum.capacity + Number(sales.capacity_units || 0),
          }
        },
        { sold: 0, available: 0, capacity: 0 },
      )
    : null,
)
const recent = computed(() =>
  !DASHBOARD_PREVIEW
    ? []
    : events.value
        .flatMap((event) =>
          usePreviewWorkspaceAttendees(event.id, event.ticket_mode).orders.value.map((order) => ({
            ...order,
            event,
          })),
        )
        .sort((a, b) => new Date(b.purchased) - new Date(a.purchased))
        .slice(0, 3),
)
const cover = (event) =>
  event?.cover_image
    ? { backgroundImage: `url(${JSON.stringify(event.cover_image)})` }
    : { backgroundImage: 'none' }
const phase = (event) =>
  ({ upcoming: 'Upcoming', live: 'Live now', ended: 'Event ended', draft: 'Draft' })[event.phase] ||
  'Your event'
const href = (event, query = {}) =>
  `${import.meta.env.BASE_URL}dashboard/events/${encodeURIComponent(event.id)}${Object.keys(query).length ? `?${new URLSearchParams(query)}` : ''}`
const open = (event, query = {}) => emit('open', { id: event.id, query })
const initials = (name) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
function datePart(event, options) {
  const date = new Date(event?.starts_at)
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: event.timezone || 'Africa/Lagos',
        ...options,
      }).format(date)
    : '—'
}
watch(
  () => props.events.map((event) => event.id).join(','),
  () => {
    if (DASHBOARD_PREVIEW)
      Promise.allSettled(props.events.map((event) => dashboard.fetchOverview(event.id)))
  },
  { immediate: true },
)
</script>

<template>
  <section
    class="rh-screen rh29-workspace-screen"
    data-route="events"
    aria-labelledby="rh29-home-title"
  >
    <nav v-if="dashboard.eventsLastPage > 1" class="rh-form-actions" aria-label="Event pages">
      <button
        class="rh-button rh-button-outline"
        :disabled="dashboard.eventsLoading || dashboard.eventsPage <= 1"
        @click="dashboard.fetchEvents({ page: dashboard.eventsPage - 1 }).catch(() => {})"
      >
        Previous events
      </button>
      <span
        >Page {{ dashboard.eventsPage }} of {{ dashboard.eventsLastPage }} ·
        {{ dashboard.eventsTotal }} events</span
      >
      <button
        class="rh-button rh-button-outline"
        :disabled="dashboard.eventsLoading || dashboard.eventsPage >= dashboard.eventsLastPage"
        @click="dashboard.fetchEvents({ page: dashboard.eventsPage + 1 }).catch(() => {})"
      >
        Next events
      </button>
    </nav>
    <p v-if="dashboard.eventsError" class="rh-note" role="alert">{{ dashboard.eventsError }}</p>
    <section class="rh29-home-hero">
      <div class="rh29-home-inner rh29-hero-layout">
        <div class="rh29-home-hero-copy">
          <span class="rh29-home-eyebrow"><i aria-hidden="true" />Your events, one place</span>
          <h1 id="rh29-home-title">Welcome back{{ firstName ? `, ${firstName}` : '' }}.</h1>
          <p>
            {{
              firstEvent
                ? 'Create your first event to start welcoming attendees.'
                : 'Choose an event to manage its details, tickets and guests.'
            }}
          </p>
          <div class="rh29-home-hero-actions">
            <a
              v-if="featured"
              class="rh29-hero-primary"
              :href="href(featured)"
              @click.prevent="open(featured)"
              >Open your event
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" /></svg
            ></a>
            <button v-else class="rh29-hero-primary" type="button" @click="emit('create')">
              Create event
            </button>
          </div>
        </div>
        <a
          v-if="featured"
          class="rh29-featured-event"
          :href="href(featured)"
          :aria-label="`Open ${featured.title} overview`"
          @click.prevent="open(featured)"
        >
          <div class="rh29-featured-cover mini-cover" :style="cover(featured)" />
          <div class="rh29-featured-overlay">
            <span
              >{{ phase(featured) }} <i aria-hidden="true" />{{
                datePart(featured, { day: 'numeric', month: 'short' })
              }}</span
            ><strong>{{ featured.title }}</strong
            ><small
              >Open event
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" /></svg
            ></small>
          </div>
        </a>
      </div>
    </section>
    <div id="rh29-dashboard-content" class="rh29-home-inner rh29-home-content">
      <div v-if="events.length" class="rh29-home-sectiontop">
        <div>
          <span class="rh29-overline">At a glance</span>
          <h2>How things are going</h2>
        </div>
      </div>
      <div
        v-if="events.length"
        class="rh29-overall-kpis"
        aria-label="Performance for listed events"
      >
        <article class="rh29-kpi">
          <span>Upcoming events on this page</span><strong>{{ number(upcoming.length) }}</strong
          ><small>{{
            upcoming.length === 1
              ? 'One event coming up'
              : `${number(upcoming.length)} events coming up`
          }}</small>
        </article>
        <article class="rh29-kpi">
          <span>Tickets sold</span><strong>{{ totals ? number(totals.sold) : '—' }}</strong
          ><small>Across your events</small>
        </article>
        <article class="rh29-kpi">
          <span>Tickets remaining</span
          ><strong>{{ totals ? number(totals.available) : '—' }}</strong
          ><small>{{
            totals
              ? `Of ${number(totals.capacity)} tickets available`
              : 'Open an event to see its tickets'
          }}</small>
        </article>
      </div>
      <div id="rh29-your-events" class="rh29-home-sectiontop rh29-events-section-heading">
        <div>
          <span class="rh29-overline">My events</span>
          <h2>
            {{ firstEvent ? 'Your first event starts here' : 'Your events' }}
            <span v-if="!firstEvent" class="rh29-event-counter">{{
              dashboard.eventsTotal || events.length
            }}</span>
          </h2>
          <p>
            {{
              firstEvent
                ? 'Add your event details, choose your tickets and publish when you’re ready.'
                : 'Open an event to manage its tickets, guests and sales.'
            }}
          </p>
        </div>
      </div>
      <div id="rh29-event-grid" class="rh29-event-grid">
        <a
          v-for="event in events"
          :key="event.id"
          class="rh29-event-card"
          :href="href(event)"
          @click.prevent="open(event)"
        >
          <div class="rh29-event-cover mini-cover" :style="cover(event)">
            <span class="rh29-event-status"><i aria-hidden="true" />{{ phase(event) }}</span>
          </div>
          <div class="rh29-event-card-body">
            <div class="rh29-event-title-row">
              <h3>{{ event.title }}</h3>
              <span class="rh29-card-open" aria-hidden="true"
                ><svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" /></svg
              ></span>
            </div>
            <p class="rh29-event-date">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <rect x="3.5" y="5" width="17" height="15" rx="2" />
                <path d="M7 3v4m10-4v4M4 10h16" /></svg
              ><span>{{ overviewEventDate(event) }}</span>
            </p>
            <p class="rh29-event-venue">
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
                <circle cx="12" cy="10" r="2.3" /></svg
              ><span>{{ event.venue || 'Venue to be confirmed' }}</span>
            </p>
            <div v-if="eventSales(event)" class="rh29-event-progress">
              <div>
                <span>Tickets sold</span
                ><strong
                  >{{ number(eventSales(event).units_sold) }} of
                  {{ number(eventSales(event).capacity_units) }}</strong
                >
              </div>
              <div class="rh29-progress-track">
                <i
                  :style="{
                    width: `${Math.min(100, Math.max(0, eventSales(event).sold_percent || 0))}%`,
                  }"
                />
              </div>
            </div>
            <span class="rh29-event-card-cta"
              >View event details
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" /></svg
            ></span>
          </div>
        </a>
        <button class="rh29-new-event-card" type="button" @click="emit('create')">
          <span class="rh29-plus-circle"
            ><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg></span
          ><strong>{{ firstEvent ? 'Create your first event' : 'Create a new event' }}</strong
          ><span>Start with the event name and date.</span>
        </button>
      </div>
      <div v-if="featured" class="rh29-dashboard-bottom-grid">
        <section class="rh29-activity-card" aria-labelledby="rh29-activity-title">
          <div class="rh29-section-card-head">
            <div>
              <h2 id="rh29-activity-title">Recent ticket purchases</h2>
              <p>Open an event to view its purchase records.</p>
            </div>
            <a
              :href="href(featured, { view: 'attendees' })"
              @click.prevent="open(featured, { view: 'attendees' })"
              >See attendees</a
            >
          </div>
          <a
            v-for="order in recent"
            :key="`${order.event.id}:${order.id}`"
            class="rh29-activity-row"
            :href="href(order.event, { view: 'purchase', order: order.id })"
            @click.prevent="open(order.event, { view: 'purchase', order: order.id })"
            ><span class="rh29-activity-icon">{{ initials(order.buyer) }}</span
            ><span class="rh29-activity-copy"
              ><strong
                >{{ order.buyer }} bought {{ order.ticketIds.length }}
                {{ order.ticketIds.length === 1 ? 'ticket' : 'tickets' }}</strong
              ><small>{{ order.event.title }} · {{ order.purchased }}</small></span
            ><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" /></svg
          ></a>
          <p v-if="!recent.length" class="rh-note">
            Recent ticket purchases will appear here when purchase records are available.
          </p>
        </section>
        <section class="rh29-next-card" aria-labelledby="rh29-next-title">
          <span class="rh29-overline">{{ phase(featured) }}</span>
          <h2 id="rh29-next-title">{{ featured.title }}</h2>
          <div class="rh29-next-date">
            <strong>{{ datePart(featured, { day: 'numeric' }) }}</strong
            ><span
              ><b>{{ datePart(featured, { month: 'short' }) }}</b
              ><small>{{ datePart(featured, { weekday: 'long', year: 'numeric' }) }}</small></span
            >
          </div>
          <p>Open this event to check its details and see how sales are going.</p>
          <a class="rh29-next-link" :href="href(featured)" @click.prevent="open(featured)"
            >Open event overview
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6" /></svg
          ></a>
        </section>
      </div>
    </div>
  </section>
</template>
