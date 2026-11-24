<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import QrcodeVue from 'qrcode.vue'
import { DASHBOARD_PREVIEW as preview } from '@/services/dashboardPreview'
import { useWorkspaceAttendees, visitDate } from './attendeesModel'
import WorkspaceAttendees from './WorkspaceAttendees.vue'
import WorkspaceSupport from './WorkspaceSupport.vue'

const props = defineProps({ eventId: [String, Number], overview: Object })
const emit = defineEmits(['navigate', 'notify'])
const route = useRoute()
const event = computed(() => props.overview.event || {})
const model = useWorkspaceAttendees(props.eventId, event.value.ticket_mode)
const { guests, movements, mode } = model
const free = computed(() => mode.value === 'free')
const namespace = `rushhour:event-workspace:${props.eventId}:`
function read(key, fallback) {
  if (!preview) return fallback
  try {
    return JSON.parse(localStorage.getItem(namespace + key)) ?? fallback
  } catch {
    return fallback
  }
}
function save(key, value) {
  if (!preview) {
    notify('Live door check-in isn’t connected yet. Your changes haven’t been saved.')
    return false
  }
  try {
    localStorage.setItem(namespace + key, JSON.stringify(value))
    return true
  } catch {
    notify('We couldn’t save that. Check your browser storage and try again.')
    return false
  }
}
const notify = (text) => emit('notify', text)
const active = ref(read('door-active', false))
const entrances = ref(
  read('entrances', [
    { id: 1, name: 'Main entrance', contacts: [] },
    { id: 2, name: 'VIP entrance', contacts: [] },
  ]).map((door, i) => ({
    ...door,
    id: door.id || i + 1,
    contacts: door.contacts || [],
    aliases: door.aliases || [],
  })),
)
const tab = computed(() => (route.query.tab === 'entrances' ? 'entrances' : 'checkin'))
const managing = computed(() => Boolean(route.query.entrance))
const managed = computed(() =>
  entrances.value.find((d) => String(d.id) === String(route.query.entrance)),
)
const adding = computed(() => route.query.entrance === 'new')
const selectedGuest = computed(() => guests.value.find((g) => g.id === route.query.doorGuest))
const guestPage = computed(() => Boolean(route.query.doorGuest || route.query.history))
const detailPage = computed(() => (route.query.history ? 'checkin' : 'purchase'))
const currentEntrance = ref(entrances.value[0]?.id)
watch(
  () => [route.query.entrance, route.query.returnEntrance],
  () => {
    const id = route.query.returnEntrance || route.query.entrance
    const door = entrances.value.find((d) => String(d.id) === String(id))
    if (door) currentEntrance.value = door.id
  },
  { immediate: true },
)
const search = ref(''),
  status = ref('all'),
  entranceFilter = ref('all'),
  day = ref(''),
  time = ref('')
const tabButtons = ref({})
const belongsTo = (movement, door) =>
  [door.name, ...(door.aliases || [])].includes(movement.entrance)
const entriesAt = (door) =>
  movements.value
    .filter((v) => v.kind === 'in' && belongsTo(v, door))
    .slice()
    .reverse()
const entranceCount = (door) => new Set(entriesAt(door).map((v) => v.id)).size
const checkedIn = computed(() => guests.value.filter((g) => model.everArrived(g.id)).length)
const insideNow = computed(() => guests.value.filter((g) => model.inside(g.id)).length)
const latest = computed(() => [...movements.value].reverse().find((v) => v.kind === 'in'))
const stamp = (value) =>
  value
    ? `${visitDate(value, event.value.timezone)}, ${visitDate(value, event.value.timezone, true)}`
    : 'Not arrived'
const latestName = computed(
  () => guests.value.find((g) => g.id === latest.value?.id)?.name || 'No arrivals yet',
)
const lastEntry = (id) => [...model.visits(id)].reverse().find((v) => v.kind === 'in')
const filteredGuests = computed(() =>
  guests.value.filter((g) => {
    const selected = entrances.value.find((d) => String(d.id) === entranceFilter.value)
    return (
      [g.name, g.email, g.id, g.type]
        .join(' ')
        .toLowerCase()
        .includes(search.value.trim().toLowerCase()) &&
      (status.value === 'all' ||
        (status.value === 'inside' && model.inside(g.id)) ||
        (status.value === 'left' && model.guestState(g.id) === 'Has left') ||
        (status.value === 'not-arrived' && !model.everArrived(g.id))) &&
      (!selected || model.visits(g.id).some((v) => belongsTo(v, selected)))
    )
  }),
)
function clearMovementFilters() {
  day.value = ''
  time.value = ''
}
function trySample() {
  scanCode.value = 'RH-4101'
  findTicket()
}
function dateParts(at) {
  const date = new Date(at)
  return {
    day: new Intl.DateTimeFormat('en-CA', {
      timeZone: event.value.timezone || 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date),
    time: new Intl.DateTimeFormat('en-GB', {
      timeZone: event.value.timezone || 'Africa/Lagos',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(date),
  }
}
const filteredMovements = computed(() =>
  [...movements.value].reverse().filter((v) => {
    const parts = dateParts(v.at),
      selected = entrances.value.find((d) => String(d.id) === entranceFilter.value)
    return (
      (!day.value || parts.day === day.value) &&
      (!time.value || parts.time.slice(0, 2) === time.value.slice(0, 2)) &&
      (!selected || belongsTo(v, selected))
    )
  }),
)
function go(query = {}) {
  emit('navigate', { view: 'checkin', ...query })
}
function href(query = {}) {
  return `${import.meta.env.BASE_URL}dashboard/events/${encodeURIComponent(props.eventId)}?${new URLSearchParams({ view: 'checkin', ...query })}`
}
function guestQuery(guest) {
  return {
    doorGuest: guest.id,
    guest: guest.id,
    order: model.orderFor(guest.id)?.id,
    ...(managed.value ? { returnEntrance: String(managed.value.id) } : {}),
  }
}
function viewGuest(guest) {
  go(guestQuery(guest))
}
function activate() {
  if (save('door-active', true)) active.value = true
}
function changeTab(name) {
  go(name === 'entrances' ? { tab: 'entrances' } : {})
}
function tabKeys(e) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
  e.preventDefault()
  const next =
    e.key === 'Home'
      ? 'checkin'
      : e.key === 'End'
        ? 'entrances'
        : tab.value === 'checkin'
          ? 'entrances'
          : 'checkin'
  changeTab(next)
  nextTick(() => tabButtons.value[next]?.focus())
}
function record(guest, kind, entranceId = currentEntrance.value) {
  if (!active.value) {
    notify('Activate door check-in before recording an arrival.')
    return false
  }
  const door = entrances.value.find((d) => String(d.id) === String(entranceId))
  if (!door) {
    notify('Choose an entrance before recording an arrival.')
    return false
  }
  const result = model.recordMovement(guest.id, kind, door.name)
  notify(result.message)
  return result.ok
}

const entranceForm = reactive({ name: '', contacts: [] }),
  formError = ref(''),
  formFeedback = ref('')
const entranceHeading = ref(null)
watch(
  () => route.query.entrance,
  async () => {
    formError.value = ''
    formFeedback.value = ''
    Object.assign(entranceForm, {
      name: managed.value?.name || '',
      contacts: (managed.value?.contacts || []).map((c) => ({ ...c })),
    })
    if (managing.value) {
      await nextTick()
      entranceHeading.value?.focus()
    }
  },
  { immediate: true },
)
function saveEntrance() {
  const name = entranceForm.name.trim(),
    contacts = entranceForm.contacts.map((c) => ({
      name: c.name.trim(),
      email: c.email.trim(),
      phone: String(c.phone || '').trim(),
    }))
  if (!name) {
    formError.value = 'Enter your entrance name.'
    return
  }
  if (
    entrances.value.some(
      (d) => d.id !== managed.value?.id && d.name.toLowerCase() === name.toLowerCase(),
    )
  ) {
    formError.value = 'You already have an entrance with this name.'
    return
  }
  if (
    contacts.some((c) => !c.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) ||
    new Set(contacts.map((c) => c.email.toLowerCase())).size !== contacts.length
  ) {
    formError.value = 'Enter each staff member’s name and a different valid email address.'
    return
  }
  const existing = managed.value
  const door = {
    id: existing?.id || Math.max(0, ...entrances.value.map((d) => Number(d.id))) + 1,
    name,
    contacts,
    aliases: [
      ...new Set([
        ...(existing?.aliases || []),
        ...(existing && existing.name !== name ? [existing.name] : []),
      ]),
    ],
  }
  const next = existing
    ? entrances.value.map((d) => (d.id === existing.id ? door : d))
    : [...entrances.value, door]
  if (!save('entrances', next)) return
  entrances.value = next
  if (existing)
    formFeedback.value = 'Entrance details saved in this browser. No staff invitations were sent.'
  else {
    go({ entrance: String(door.id) })
    notify('Your entrance is ready. You can now print its QR code.')
  }
  formError.value = ''
}
const deleteDialog = ref(null)
function removeEntrance() {
  const door = managed.value
  if (!door || entrances.value.length < 2 || movements.value.some((v) => belongsTo(v, door))) {
    formError.value =
      'Keep at least one entrance. Entrances with recorded activity can’t be removed.'
    deleteDialog.value?.close()
    return
  }
  const next = entrances.value.filter((d) => d.id !== door.id)
  if (!save('entrances', next)) return
  entrances.value = next
  if (currentEntrance.value === door.id) currentEntrance.value = next[0].id
  if (entranceFilter.value === String(door.id)) entranceFilter.value = 'all'
  deleteDialog.value.close()
  go({ tab: 'entrances' })
  notify('Entrance removed.')
}
const scanDialog = ref(null),
  scanCode = ref(''),
  scanGuest = ref(null),
  scanError = ref(''),
  scanInput = ref(null),
  camera = ref(null)
let origin = null
function openScan(doorId) {
  if (doorId) currentEntrance.value = doorId
  origin = document.activeElement
  scanCode.value = ''
  scanGuest.value = null
  scanError.value = ''
  scanDialog.value.showModal()
  nextTick(() => scanInput.value?.focus())
}
function findTicket(value = scanCode.value) {
  scanGuest.value =
    guests.value.find((g) => g.id.toUpperCase() === String(value).trim().toUpperCase()) || null
  scanError.value = scanGuest.value
    ? ''
    : 'We couldn’t find that ticket for this event. Check the code and try again.'
}
function openCamera() {
  scanDialog.value.close()
  camera.value.open('scan')
}
function cameraFound(id) {
  scanCode.value = id
  findTicket(id)
  scanDialog.value.showModal()
}
function scanDetails() {
  const guest = scanGuest.value
  scanDialog.value.close()
  viewGuest(guest)
}
const printDoor = ref(null)
const qrValue = (door) => new URL(href({ entrance: String(door.id) }), location.origin).href
async function printEntrance(door) {
  printDoor.value = door
  await nextTick()
  window.print()
}
onBeforeUnmount(() => {
  scanDialog.value?.close()
  deleteDialog.value?.close()
})
</script>

<template>
  <div class="workspace-door-checkin" @click.stop @submit.stop @keydown.stop>
    <template v-if="guestPage">
      <div
        v-if="selectedGuest && !route.query.history"
        class="rh-dc-guest-controls flex flex-wrap items-center gap-3"
      >
        <span
          ><strong>{{ selectedGuest.name }}</strong> ·
          {{ model.guestState(selectedGuest.id) }}</span
        >
        <label
          >Entrance<select v-model="currentEntrance">
            <option v-for="door in entrances" :key="door.id" :value="door.id">
              {{ door.name }}
            </option>
          </select></label
        >
        <button
          class="rh-button rh-button-dark"
          type="button"
          @click="record(selectedGuest, model.inside(selectedGuest.id) ? 'out' : 'in')"
        >
          {{ model.inside(selectedGuest.id) ? 'Record exit' : 'Check in guest' }}
        </button>
      </div>
      <WorkspaceAttendees
        :page="detailPage"
        :context="route.query.doorGuest ? 'door' : undefined"
        :overview="overview"
        :event-id="eventId"
        @navigate="$emit('navigate', $event)"
        @notify="$emit('notify', $event)"
      />
    </template>
    <section
      v-else
      class="rh-screen rh-v22-door rh-dc-route"
      data-route="checkin"
      aria-label="Door check-in"
    >
      <div v-if="!active" id="rh-dc-start" class="rh-dc-start">
        <div class="rh-dc-start-content">
          <div class="rh-dc-start-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path
                d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3M8 12h8"
              />
            </svg>
          </div>
          <h1>Activate door check-in</h1>
          <p>Activate check-in to record guests as they arrive.</p>
          <button
            class="rh-button rh-button-dark rh-dc-activate-btn"
            type="button"
            @click="activate"
          >
            Activate door check-in
          </button>
        </div>
      </div>
      <template v-else-if="!managing">
        <div class="rh-dc-tabs" role="tablist" aria-label="Door check-in sections">
          <button
            v-for="name in ['checkin', 'entrances']"
            :id="`rh-dc-tab-${name}`"
            :key="name"
            :ref="
              (el) => {
                tabButtons[name] = el
              }
            "
            type="button"
            role="tab"
            :aria-selected="tab === name"
            :tabindex="tab === name ? 0 : -1"
            :aria-controls="`rh-dc-${name}-panel`"
            @click="changeTab(name)"
            @keydown="tabKeys"
          >
            {{ name === 'checkin' ? 'Check-in' : 'Entrances' }}
          </button>
        </div>
        <div
          v-if="tab === 'checkin'"
          id="rh-dc-checkin-panel"
          role="tabpanel"
          aria-labelledby="rh-dc-tab-checkin"
        >
          <div class="rh-dc-top">
            <div class="rh-dc-overview">
              <div class="rh-dc-titleline">
                <div>
                  <h1>
                    This is your door check-in for <span>{{ event.title }}</span>
                  </h1>
                  <p class="rh-dc-active-line">
                    <span class="rh-dc-live-dot" aria-hidden="true" /> Active
                  </p>
                </div>
              </div>
              <div class="rh-dc-latest">
                <span>Latest check-in</span><strong>{{ latestName }}</strong
                ><small>{{ latest ? stamp(latest.at) : '' }}</small>
              </div>
            </div>
            <div class="rh-dc-scan-panel rh-dc-scan-simple">
              <div class="rh-dc-scan-heading"><strong>Scan a guest with QR code</strong></div>
              <button
                class="rh-button rh-button-dark rh-dc-primary-scan"
                type="button"
                @click="openScan()"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.7"
                  aria-hidden="true"
                >
                  <path d="M4 8V5h4m8 0h4v3M20 16v3h-4M8 19H4v-3M5 12h14" /></svg
                >Scan tickets
              </button>
            </div>
          </div>
          <div class="rh-dc-numbers" aria-label="Check-in totals">
            <div>
              <span>{{ free ? 'Registrations' : 'Tickets' }}</span
              ><strong>{{ guests.length }}</strong>
            </div>
            <div>
              <span>Checked in</span><strong>{{ checkedIn }}</strong>
            </div>
            <div>
              <span>Inside now</span><strong>{{ insideNow }}</strong>
            </div>
            <div>
              <span>Not arrived</span><strong>{{ guests.length - checkedIn }}</strong>
            </div>
          </div>
          <section
            class="rh-module rh-v22-door-search rh-dc-activity"
            aria-labelledby="rh-dc-activity-title"
          >
            <div class="rh-dc-activity-head">
              <div>
                <h2 id="rh-dc-activity-title">Guest activity</h2>
                <p>See who has arrived and who is still to come.</p>
              </div>
              <span role="status">{{ filteredGuests.length }} of {{ guests.length }} guests</span>
            </div>
            <div class="rh-filterbar rh-v22-door-filters rh-dc-filterbar">
              <label class="rh-field rh-search-field"
                ><span class="rh-sr">Search guests</span
                ><input
                  v-model="search"
                  type="search"
                  placeholder="Search name, email or ticket code" /></label
              ><label class="rh-field rh-compact-select"
                ><span class="rh-sr">Filter by status</span
                ><select v-model="status">
                  <option value="all">All guests</option>
                  <option value="inside">Inside now</option>
                  <option value="left">Has left</option>
                  <option value="not-arrived">Not arrived</option>
                </select></label
              ><label class="rh-field rh-compact-select"
                ><span class="rh-sr">Filter by entrance</span
                ><select v-model="entranceFilter">
                  <option value="all">
                    {{ entrances.length === 1 ? entrances[0].name : 'All entrances' }}
                  </option>
                  <template v-if="entrances.length > 1"
                    ><option v-for="door in entrances" :key="door.id" :value="String(door.id)">
                      {{ door.name }}
                    </option></template
                  >
                </select></label
              >
            </div>
            <div class="rh-table-scroll">
              <table class="rh-data-table rh-v22-door-table rh-dc-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>{{ free ? 'Registration' : 'Ticket' }}</th>
                    <th>Status</th>
                    <th>Last entry</th>
                    <th class="rh-th-action">Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="guest in filteredGuests" :key="guest.id">
                    <td>
                      <strong>{{ guest.name }}</strong
                      ><small>{{ guest.email }}</small>
                    </td>
                    <td>
                      <span class="rh-dc-ticket-type">{{ guest.type }}</span
                      ><small>{{ guest.id }}</small>
                    </td>
                    <td>
                      <span
                        class="rh-v22-where"
                        :class="
                          model.inside(guest.id)
                            ? 'inside'
                            : model.everArrived(guest.id)
                              ? 'left'
                              : 'pending'
                        "
                        >{{ model.guestState(guest.id) }}</span
                      >
                    </td>
                    <td>
                      <span>{{ stamp(lastEntry(guest.id)?.at) }}</span>
                    </td>
                    <td>
                      <a
                        class="rh-v22-action-btn rh-dc-view"
                        :href="href(guestQuery(guest))"
                        @click.prevent="viewGuest(guest)"
                        >View</a
                      >
                    </td>
                  </tr>
                  <tr v-if="!filteredGuests.length">
                    <td colspan="5" class="rh-dc-empty-records">
                      {{
                        preview
                          ? 'No guests match your search or filters.'
                          : 'Live guest records aren’t connected to door check-in yet.'
                      }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <details class="rh-dc-movements">
            <summary>Entries and exits <span>View history</span></summary>
            <section class="rh-module rh-v22-movements">
              <div class="rh-module-title"><h2>Entries and exits</h2></div>
              <div class="rh-v22-movement-filters">
                <label class="rh-field"><span>Day</span><input v-model="day" type="date" /></label
                ><label class="rh-field"
                  ><span>Time (within this hour)</span><input v-model="time" type="time" /></label
                ><button class="rh-v22-action-btn" type="button" @click="clearMovementFilters">
                  Clear
                </button>
              </div>
              <div class="rh-v22-movement-list">
                <div
                  v-for="(visit, index) in filteredMovements"
                  :key="visit.at + visit.id + index"
                  class="rh-dc-movement-row"
                >
                  <strong>{{ guests.find((g) => g.id === visit.id)?.name }}</strong
                  ><span
                    >{{ visit.kind === 'in' ? 'Entered' : 'Left' }} · {{ visit.entrance }} ·
                    {{ stamp(visit.at) }}</span
                  >
                </div>
                <p v-if="!filteredMovements.length" class="rh-note">
                  No entries or exits match these filters.
                </p>
              </div>
            </section>
          </details>
        </div>
        <div
          v-else
          id="rh-dc-entrances-panel"
          role="tabpanel"
          aria-labelledby="rh-dc-tab-entrances"
        >
          <section class="rh-dc-doors-section" aria-labelledby="rh-dc-doors-heading">
            <div class="rh-dc-doors-header">
              <div>
                <h2 id="rh-dc-doors-heading">Your entrances</h2>
                <p>Add entrances and keep track of where your guests check in.</p>
              </div>
              <button
                class="rh-button rh-button-dark"
                type="button"
                @click="go({ entrance: 'new' })"
              >
                Add entrance
              </button>
            </div>
            <div class="rh-dc-door-list">
              <article v-for="door in entrances" :key="door.id" class="rh-dc-entrance-card">
                <div class="rh-dc-entrance-leading">
                  <span class="rh-dc-entrance-graphic" aria-hidden="true"
                    ><svg
                      viewBox="0 0 24 24"
                      width="19"
                      height="19"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                    >
                      <path
                        d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M2 21h20M9 21V7h6v14M13 14h.01"
                      /></svg
                  ></span>
                  <div class="rh-dc-entrance-info">
                    <h3>{{ door.name }}</h3>
                    <span
                      >{{ entranceCount(door) }}
                      {{ entranceCount(door) === 1 ? 'guest' : 'guests' }} checked in</span
                    >
                  </div>
                </div>
                <div class="rh-dc-door-contact">
                  <span>Check-in staff</span
                  ><strong>{{
                    door.contacts.length
                      ? door.contacts[0].name +
                        (door.contacts.length > 1 ? ` +${door.contacts.length - 1} more` : '')
                      : 'No staff added'
                  }}</strong
                  ><small v-if="door.contacts.length">{{ door.contacts.length }} assigned</small>
                </div>
                <div class="rh-dc-entrance-actions">
                  <button
                    class="rh-button rh-button-outline rh-dc-print-list"
                    type="button"
                    @click="printEntrance(door)"
                  >
                    Print QR code</button
                  ><a
                    class="rh-button rh-button-outline rh-dc-door-manage"
                    :href="href({ entrance: String(door.id) })"
                    @click.prevent="go({ entrance: String(door.id) })"
                    >Manage</a
                  >
                </div>
              </article>
            </div>
          </section>
        </div>
      </template>
      <section
        v-else
        id="rh-dc-manage-page"
        class="rh-dc-manage-page"
        aria-label="Entrance settings"
      >
        <div class="rh-dc-manage-nav">
          <a :href="href({ tab: 'entrances' })" @click.prevent="go({ tab: 'entrances' })"
            >← All entrances</a
          >
        </div>
        <template v-if="managed || adding"
          ><header class="rh-dc-manage-header">
            <div>
              <h1 ref="entranceHeading" tabindex="-1">{{ managed?.name || 'Add an entrance' }}</h1>
              <p>
                {{
                  managed
                    ? 'Update your entrance details or print its QR code.'
                    : 'Give your entrance a name and add a contact if you have one.'
                }}
              </p>
            </div>
            <button
              v-if="managed"
              class="rh-button rh-button-dark"
              type="button"
              @click="openScan(managed.id)"
            >
              Scan tickets at this entrance
            </button>
          </header>
          <div class="rh-dc-manage-layout">
            <form class="rh-dc-entrance-form rh-dc-contact-form" @submit.prevent="saveEntrance">
              <section class="rh-module rh-dc-manage-module">
                <h2>Entrance details</h2>
                <label class="rh-field"
                  ><span>Entrance name</span
                  ><input
                    v-model="entranceForm.name"
                    maxlength="80"
                    required
                    placeholder="e.g. Main entrance"
                /></label>
                <h2>Who will be at this entrance?</h2>
                <p>Add the people working at this entrance.</p>
                <fieldset
                  v-for="(staff, i) in entranceForm.contacts"
                  :key="i"
                  class="rh-dc-staff-person"
                >
                  <legend>Staff member {{ i + 1 }}</legend>
                  <button
                    class="rh-dc-remove-staff"
                    type="button"
                    :aria-label="`Remove staff member ${i + 1}`"
                    @click="entranceForm.contacts.splice(i, 1)"
                  >
                    Remove</button
                  ><label
                    >Full name<input
                      v-model="staff.name"
                      autocomplete="name"
                      maxlength="80"
                      required /></label
                  ><label
                    >Email address<input
                      v-model="staff.email"
                      type="email"
                      maxlength="160"
                      required /></label
                  ><label
                    >Phone number (optional)<input v-model="staff.phone" type="tel" maxlength="30"
                  /></label>
                </fieldset>
                <p v-if="!entranceForm.contacts.length" class="rh-dc-staff-empty">
                  No staff added yet. You can add them later.
                </p>
                <button
                  class="rh-button rh-button-outline"
                  type="button"
                  @click="entranceForm.contacts.push({ name: '', email: '', phone: '' })"
                >
                  Add staff member
                </button>
                <p v-if="formError" class="rh-dc-edit-error" role="alert">{{ formError }}</p>
                <p v-if="formFeedback" role="status">{{ formFeedback }}</p>
                <div class="rh-dc-contact-actions">
                  <button class="rh-button rh-button-dark" type="submit">
                    {{ managed ? 'Save changes' : 'Create entrance' }}</button
                  ><button
                    class="rh-button rh-button-outline"
                    type="button"
                    @click="go({ tab: 'entrances' })"
                  >
                    Cancel
                  </button>
                </div>
              </section>
            </form>
            <aside class="rh-dc-qr-card">
              <h2>Your entrance QR code</h2>
              <p>
                {{
                  managed
                    ? 'Print this code and place it at your entrance.'
                    : 'Create your entrance to get its QR code.'
                }}
              </p>
              <QrcodeVue v-if="managed" :value="qrValue(managed)" :size="180" level="M" /><button
                v-if="managed"
                class="rh-button rh-button-outline"
                type="button"
                @click="printEntrance(managed)"
              >
                Print QR code
              </button>
              <p v-if="managed" class="rh-note">
                Preview code only. Guest self check-in requires a live connection.
              </p>
            </aside>
          </div>
          <section v-if="managed" class="rh-module rh-dc-manage-module rh-dc-entrance-entries">
            <h2>Guests checked in here</h2>
            <p>{{ entriesAt(managed).length }} recorded entries</p>
            <div class="rh-table-scroll">
              <table class="rh-data-table rh-dc-table">
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>{{ free ? 'Registration' : 'Ticket' }}</th>
                    <th>Entry time</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(visit, i) in entriesAt(managed)" :key="visit.at + i">
                    <td>
                      <strong>{{ guests.find((g) => g.id === visit.id)?.name }}</strong
                      ><small>{{ guests.find((g) => g.id === visit.id)?.email }}</small>
                    </td>
                    <td>{{ visit.id }}</td>
                    <td>{{ stamp(visit.at) }}</td>
                    <td>
                      <a
                        v-if="guests.find((g) => g.id === visit.id)"
                        class="rh-v22-action-btn rh-dc-view"
                        :href="href(guestQuery(guests.find((g) => g.id === visit.id)))"
                        @click.prevent="viewGuest(guests.find((g) => g.id === visit.id))"
                        >View</a
                      >
                    </td>
                  </tr>
                  <tr v-if="!entriesAt(managed).length">
                    <td colspan="4" class="rh-dc-empty-records">
                      Guest check-ins at this entrance will appear here.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <button
            v-if="managed && entrances.length > 1"
            class="rh-dc-manage-remove"
            type="button"
            @click="deleteDialog.showModal()"
          >
            Remove entrance
          </button></template
        >
        <div v-else class="rh-module rh-module rh-dc-manage-module">
          <h1>This entrance isn’t available</h1>
          <p>Go back to your entrances to choose another one.</p>
        </div>
      </section>
    </section>
    <dialog
      ref="scanDialog"
      class="rh-v22-dialog rh-dc-scan-dialog"
      aria-labelledby="door-scan-title"
      @close="origin?.focus?.()"
    >
      <div class="rh-v22-dialog-head">
        <h2 id="door-scan-title">Scan a guest’s ticket</h2>
        <button
          class="rh33-close"
          type="button"
          aria-label="Close scanner"
          @click="scanDialog.close()"
        >
          ×
        </button>
      </div>
      <p class="rh-dc-camera-note">
        Point your camera at a ticket QR code, or enter the ticket code below.
      </p>
      <button class="rh-button rh-button-outline" type="button" @click="openCamera">
        Use camera
      </button>
      <form @submit.prevent="findTicket()">
        <label class="rh-field"
          ><span>Ticket code</span
          ><input
            ref="scanInput"
            v-model="scanCode"
            autocomplete="off"
            required
            placeholder="e.g. RH-4101" /></label
        ><label class="rh-field"
          ><span>Entrance</span
          ><select v-model="currentEntrance">
            <option v-for="door in entrances" :key="door.id" :value="door.id">
              {{ door.name }}
            </option>
          </select></label
        >
        <div class="rh-v22-dialog-buttons">
          <button class="rh-button rh-button-dark" type="submit">Find ticket</button
          ><button class="rh-button rh-button-outline" type="button" @click="scanDialog.close()">
            Cancel
          </button>
        </div>
      </form>
      <p v-if="scanError" class="rh-dc-scan-feedback" role="alert">{{ scanError }}</p>
      <div v-if="scanGuest" class="rh-dc-ticket-preview">
        <div class="rh-dc-ticket-ident">
          <span class="rh-dc-ticket-label">{{ free ? 'Registration found' : 'Ticket found' }}</span
          ><strong>{{ scanGuest.name }}</strong
          ><span>{{ scanGuest.email }}</span>
        </div>
        <div class="rh-dc-ticket-sub">
          <span>{{ scanGuest.type }} · {{ scanGuest.id }}</span
          ><strong>{{ model.guestState(scanGuest.id) }}</strong>
        </div>
        <p v-if="model.inside(scanGuest.id)" class="rh-dc-already">This guest is already inside.</p>
        <div class="rh-dc-ticket-actions">
          <button
            v-if="!model.inside(scanGuest.id)"
            class="rh-button rh-button-dark"
            type="button"
            @click="record(scanGuest, 'in')"
          >
            Check in guest</button
          ><button class="rh-button rh-button-outline" type="button" @click="scanDetails">
            View guest details
          </button>
        </div>
      </div>
      <button v-if="preview" class="rh-dc-try-example" type="button" @click="trySample">
        Try sample ticket RH-4101
      </button>
    </dialog>
    <dialog ref="deleteDialog" class="workspace-dialog" aria-labelledby="door-remove-title">
      <h2 id="door-remove-title">Remove {{ managed?.name }}?</h2>
      <p>Entrances with recorded activity are kept in your event history.</p>
      <div class="rh-form-actions">
        <button class="rh-button rh-button-outline" type="button" @click="deleteDialog.close()">
          Cancel</button
        ><button class="rh-button rh-button-dark" type="button" @click="removeEntrance">
          Remove entrance
        </button>
      </div>
    </dialog>
    <WorkspaceSupport
      ref="camera"
      :event="event"
      :guests="guests"
      :preview="preview"
      @scan="cameraFound"
    />
    <Teleport v-if="printDoor" to=".event-workspace"
      ><div class="rh-dc-print-sheet">
        <div class="rh-dc-print-brand">Rush Hour Tickets</div>
        <p>{{ event.title }}</p>
        <h1>{{ printDoor.name }}</h1>
        <QrcodeVue :value="qrValue(printDoor)" :size="240" level="M" />
        <p>Entrance QR code</p>
        <small>Preview entrance access. Live staff access isn’t connected yet.</small
        ><button
          class="rh-button rh-button-outline workspace-no-print"
          type="button"
          @click="printDoor = null"
        >
          Close print preview
        </button>
      </div></Teleport
    >
  </div>
</template>
