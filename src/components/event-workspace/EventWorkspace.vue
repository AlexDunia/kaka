<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import WorkspaceIcons from './WorkspaceIcons.vue'
import WorkspaceOverview from './WorkspaceOverview.vue'
import WorkspaceViews from './WorkspaceViews.vue'
import WorkspaceEarnings from './WorkspaceEarnings.vue'
import WorkspaceNotifications from './WorkspaceNotifications.vue'
import WorkspaceEventPreview from './WorkspaceEventPreview.vue'
import WorkspaceEvents from './WorkspaceEvents.vue'
import { overviewStage } from './overviewModel'
import { useWorkspacePrivacy } from '@/composables/useWorkspacePrivacy'
import { DASHBOARD_PREVIEW } from '@/services/dashboardPreview'
import { usePreviewWorkspaceAttendees } from './previewAttendeesModel'
const props = defineProps({
  view: String,
  event: Object,
  overview: Object,
  events: Array,
  loading: Boolean,
  error: String,
})
const emit = defineEmits([
  'navigate',
  'select-event',
  'retry',
  'public',
  'edit',
  'back',
  'create',
  'notify',
  'refresh',
])
const auth = useAuthStore()
const route = useRoute()
const accountWorkspace = computed(() => props.view === 'events' || !props.event)
const attendeeMode = computed(() =>
  props.event && props.overview
    ? DASHBOARD_PREVIEW
      ? usePreviewWorkspaceAttendees(props.event.id, props.overview.event?.ticket_mode).mode.value
      : props.overview.event?.ticket_mode || 'paid'
    : props.event?.ticket_mode || 'paid',
)
watch(
  () => [attendeeMode.value, props.view],
  () => {
    if (attendeeMode.value === 'free' && ['payout', 'promo'].includes(props.view))
      emit('navigate', 'attendees')
  },
)
const { amountsHidden } = useWorkspacePrivacy()
const mobileOpen = ref(false),
  notifications = ref(false)
const notificationPanel = ref(null)
const stage = computed(() => overviewStage(props.overview?.event || props.event))
const activeView = computed(() =>
  props.view === 'purchase' ? 'attendees' : props.view === 'event-page' ? 'overview' : props.view,
)
function navigateMobile(key) {
  if (key === 'create') emit('create')
  else emit('navigate', key)
  mobileOpen.value = false
}
const displayName = computed(
  () =>
    auth.user?.name ||
    [auth.user?.first_name, auth.user?.last_name].filter(Boolean).join(' ') ||
    'Event organiser',
)
const initials = computed(() =>
  displayName.value
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase(),
)
const groups = [
  {
    name: 'Main',
    items: [
      { key: 'overview', label: 'Overview', icon: 'nav-overview' },
      { key: 'attendees', label: 'Attendees', icon: 'nav-attendees' },
    ],
  },
  {
    name: 'Grow sales',
    items: [
      { key: 'share', label: 'Promote', icon: 'nav-promote' },
      { key: 'promo', label: 'Discount codes', icon: 'nav-discounts' },
      { key: 'email', label: 'Message attendees', icon: 'nav-messages' },
    ],
  },
  { name: 'Event day', items: [{ key: 'checkin', label: 'Door check-in', icon: 'nav-checkin' }] },
  { name: 'Money', items: [{ key: 'payout', label: 'My earnings', icon: 'nav-earnings' }] },
  { name: 'Manage', items: [{ key: 'settings', label: 'Settings', icon: 'nav-settings' }] },
]
const visibleGroups = computed(() =>
  (accountWorkspace.value ? [] : groups)
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => attendeeMode.value !== 'free' || !['payout', 'promo'].includes(item.key),
      ),
    }))
    .filter((group) => group.items.length),
)
const title = computed(() =>
  accountWorkspace.value
    ? 'Dashboard'
    : props.view === 'event-page'
      ? 'Event preview'
      : props.view === 'events'
        ? 'Dashboard'
        : groups.flatMap((g) => g.items).find((i) => i.key === activeView.value)?.label ||
          'Overview',
)
const page = computed(() =>
  accountWorkspace.value
    ? 'events'
    : props.view === 'promo' && route.query.screen === 'discount'
      ? 'discount-detail'
      : { share: 'promote', promo: 'discounts', email: 'messages', payout: 'earnings' }[
          props.view
        ] || props.view,
)
const phase = computed(
  () =>
    ({ upcoming: 'Upcoming', live: 'Live now', ended: 'Event ended', draft: 'Draft' })[
      props.event?.phase
    ] || 'Your event',
)
</script>
<template>
  <div
    class="event-workspace"
    :class="{ 'amounts-hidden': amountsHidden }"
    :data-rh-page="page"
    :data-rh-overview-stage="stage"
    :data-rh-attendee-event-type="attendeeMode"
    :data-rh-history-view="view === 'checkin' && Boolean(route.query.history)"
  >
    <WorkspaceNotifications
      v-if="!accountWorkspace && overview"
      ref="notificationPanel"
      :key="event?.id"
      :event="overview?.event || event"
      :overview="overview"
      :page="page"
      :event-type="attendeeMode"
      @navigate="$emit('navigate', $event)"
      @open-change="notifications = $event"
    />
    <WorkspaceIcons />
    <aside class="side rh-app-side" aria-label="Event sidebar">
      <div class="workspace-sidebar-header">
        <a
          href="#"
          class="rh-side-brand"
          aria-label="Rush Hour Tickets workspace"
          @click.prevent="$emit('back')"
          ><span class="rh-side-mark" aria-hidden="true">rh</span
          ><span class="rh-wordmark rh-side-wordmark"
            ><span class="rh-wordmark-name">Rush Hour</span
            ><span class="rh-wordmark-tickets">Tickets</span></span
          ></a
        >
        <div v-if="!accountWorkspace" class="rh-side-current-event">
          <span
            class="rh-event-thumb mini-cover"
            :style="
              event?.cover_image
                ? { backgroundImage: `url(${JSON.stringify(event.cover_image)})` }
                : { backgroundImage: 'none' }
            "
            aria-hidden="true"
          />
          <div class="rh-current-copy">
            <strong>{{ event?.title || 'Your event' }}</strong
            ><span>{{ phase }}</span>
          </div>
        </div>
      </div>
      <div class="workspace-sidebar-scroll">
        <nav class="rh29-workspace-nav" aria-label="Workspace navigation">
          <span class="rh29-side-label">Workspace</span
          ><button class="rh29-workspace-link rh29-workspace-link-active" @click="$emit('back')">
            <svg class="rh-side-icon" aria-hidden="true"><use href="#ico-grid" /></svg
            >Dashboard</button
          ><button class="rh29-workspace-link" @click="$emit('back')">
            <svg class="rh-side-icon" aria-hidden="true"><use href="#ico-calendar" /></svg>My events</button
          ><button class="rh29-workspace-link" @click="$emit('create')">
            <svg class="rh-side-icon" aria-hidden="true"><use href="#ico-calendar" /></svg>Create
            event
          </button>
        </nav>
        <nav v-if="!accountWorkspace" class="rh-back-nav" aria-label="Your events">
          <a class="rh-my-events" href="#" @click.prevent="$emit('back')"
            ><svg class="rh-side-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M14 6l-6 6 6 6M9 12h11" /></svg
            ><span>My events</span></a
          >
        </nav>
        <label v-if="!accountWorkspace && events?.length > 1" class="workspace-event-picker"
          ><span class="rh-sr">Change event</span
          ><select :value="event?.id" @change="$emit('select-event', Number($event.target.value))">
            <option v-for="item in events" :key="item.id" :value="item.id">{{ item.title }}</option>
          </select></label
        >
        <nav
          v-if="!accountWorkspace"
          class="rh-side-links"
          aria-label="Event management navigation"
        >
          <div v-for="group in visibleGroups" :key="group.name" class="rh-menu-group">
            <div class="rh-menu-title">{{ group.name }}</div>
            <a
              v-for="item in group.items"
              :key="item.key"
              class="side-link rh-side-link"
              :href="`${route.path}?view=${item.key}`"
              :class="{ selected: activeView === item.key }"
              :aria-current="activeView === item.key ? 'page' : undefined"
              @click.prevent="$emit('navigate', item.key)"
            >
              <svg class="rh-side-icon" aria-hidden="true"><use :href="`#ico-${item.icon}`" /></svg
              ><span>{{ item.label }}</span>
            </a>
          </div>
        </nav>
        <div class="rh29-side-footer">
          <span class="rh29-avatar">{{ initials }}</span
          ><span
            ><strong>Organizer workspace</strong
            ><small
              ><span class="rh-wordmark"
                ><span class="rh-wordmark-name">Rush Hour</span
                ><span class="rh-wordmark-tickets">Tickets</span></span
              ></small
            ></span
          >
        </div>
      </div>
    </aside>
    <div id="top" class="main">
      <header class="topbar">
        <div class="main-inner">
          <strong id="rh35-header-title" class="rh35-header-title" aria-live="polite">{{
            title
          }}</strong>
          <div class="mobile-head">
            <span class="brand-square">rh<br />tk</span
            ><span class="rh-wordmark brand-name"
              ><span class="rh-wordmark-name">Rush Hour</span
              ><span class="rh-wordmark-tickets">Tickets</span></span
            >
          </div>
          <div class="top-actions">
            <button
              v-if="!accountWorkspace && overview"
              class="small-circle nx-bell"
              aria-label="Notifications"
              :aria-expanded="notifications"
              aria-haspopup="dialog"
              aria-controls="nx-panel"
              @click="notificationPanel.toggle()"
            >
              <svg class="icon" aria-hidden="true"><use href="#ico-bell" /></svg
              ><span
                v-if="notificationPanel?.pending?.length"
                class="nx-badge"
                aria-hidden="true"
                >{{ notificationPanel.pending.length }}</span
              ></button
            ><span class="avatar" :title="displayName">{{ initials }}</span
            ><button
              class="workspace-mobile-toggle"
              :aria-expanded="mobileOpen"
              aria-controls="workspace-mobile-nav"
              aria-label="Open workspace navigation"
              @click="mobileOpen = !mobileOpen"
            >
              <svg class="icon" aria-hidden="true"><use href="#ico-menu" /></svg>
            </button>
          </div>
        </div>
      </header>
      <nav
        v-if="mobileOpen"
        id="workspace-mobile-nav"
        class="workspace-mobile-nav"
        aria-label="Mobile event navigation"
      >
        <button @click="$emit('back')">My events</button>
        <button v-if="accountWorkspace" @click="navigateMobile('create')">Create event</button>
        <strong v-else>{{ event?.title }}</strong
        ><template v-for="group in visibleGroups" :key="group.name"
          ><span>{{ group.name }}</span
          ><button
            v-for="item in group.items"
            :key="item.key"
            :aria-current="activeView === item.key ? 'page' : undefined"
            @click="navigateMobile(item.key)"
          >
            {{ item.label }}
          </button></template
        >
      </nav>
      <main class="main-inner content" :aria-busy="loading">
        <div v-if="loading" class="workspace-loading" role="status">
          <span class="rh-sr">Getting your workspace ready…</span>
          <div class="workspace-skeleton-hero" />
          <div class="workspace-skeleton-row"><i v-for="i in 4" :key="i" /></div>
          <div class="workspace-skeleton-panels"><i /><i /></div>
        </div>
        <section v-else-if="error" class="rh-module workspace-empty" role="alert">
          <h1>
            {{
              accountWorkspace ? 'We couldn’t load your events.' : 'We couldn’t load this event.'
            }}
          </h1>
          <p>{{ error }}</p>
          <button class="rh-button rh-button-dark" @click="$emit('retry')">Try again</button>
        </section>
        <WorkspaceEvents
          v-else-if="accountWorkspace"
          :events="events"
          :overview="overview"
          @open="$emit('select-event', $event.id, $event.query)"
          @create="$emit('create')"
        />
        <section v-else-if="!overview" class="rh-module workspace-empty" role="alert">
          <h1>We couldn’t load this event’s overview.</h1>
          <p>Your event is selected. Reload its details to continue.</p>
          <button class="rh-button rh-button-dark" @click="$emit('retry')">Reload event</button>
        </section>
        <template v-else>
          <WorkspaceEventPreview
            v-if="view === 'event-page'"
            :overview="overview"
            @navigate="$emit('navigate', $event)"
            @public="$emit('public')"
          />
          <WorkspaceOverview
            v-if="view === 'overview'"
            :overview="overview"
            @navigate="$emit('navigate', $event)"
            @public="$emit('public')"
            @edit="$emit('edit')"
          />
          <WorkspaceEarnings
            v-if="view === 'payout'"
            :key="event.id"
            :event-id="event.id"
            :overview="overview"
            @navigate="$emit('navigate', $event)"
            @refresh="$emit('refresh')"
          />
          <WorkspaceViews
            :key="event.id"
            v-show="!['overview', 'payout', 'event-page'].includes(view)"
            :page="page"
            :overview="overview"
            :event-id="event.id"
            @navigate="$emit('navigate', $event)"
            @notify="$emit('notify', $event)"
            @public="$emit('public')"
            @edit="$emit('edit')"
            @refresh="$emit('refresh')"
          />
        </template>
      </main>
    </div>
  </div>
</template>
<style src="@/assets/event-workspace/isolation.css"></style>
<style src="@/assets/event-workspace/reference.css"></style>
<style src="@/assets/event-workspace/integration.css"></style>

<style src="@/assets/event-workspace/brand.css"></style>
<style src="@/assets/event-workspace/overview.css"></style>
<style src="@/assets/event-workspace/attendees.css"></style>
<style src="@/assets/event-workspace/checkin.css"></style>
<style src="@/assets/event-workspace/promote.css"></style>
<style src="@/assets/event-workspace/shell.css"></style>
