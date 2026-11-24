<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { DASHBOARD_PREVIEW as preview } from '@/services/dashboardPreview'
import { formatMoneyMinor } from '@/utils/dashboardFormat'
import {
  arrivalWords,
  channelNames,
  purchaseSources,
  samplePriceMinor,
  useWorkspaceAttendees,
  visitDate,
  visitSessions,
} from './attendeesModel'
import WorkspaceCopyButton from './WorkspaceCopyButton.vue'
import WorkspaceGuestCard from './WorkspaceGuestCard.vue'

const props = defineProps({
  page: String,
  overview: Object,
  eventId: [Number, String],
  context: String,
})
const emit = defineEmits(['navigate', 'notify'])
const route = useRoute()
const model = useWorkspaceAttendees(props.eventId, props.overview.event?.ticket_mode)
const { guests, orders, mode, photos } = model
const free = computed(() => mode.value === 'free')
const event = computed(() => props.overview.event || {})
const recordWord = computed(() => (free.value ? 'registration' : 'purchase'))
const search = ref(''),
  tier = ref('all'),
  arrival = ref('all'),
  attendeeSource = ref('all'),
  attendeeCode = ref(''),
  attendeeChannel = ref('')
const searchInput = ref(null)
watch(
  () => [props.page, route.query.source, route.query.code, route.query.channel, route.query.tier],
  () => {
    if (props.page !== 'attendees') return
    attendeeSource.value = ['discount', 'social'].includes(route.query.source)
      ? route.query.source
      : 'all'
    if (free.value && attendeeSource.value === 'discount') attendeeSource.value = 'all'
    attendeeCode.value =
      attendeeSource.value === 'discount' ? String(route.query.code || '').toUpperCase() : ''
    attendeeChannel.value =
      attendeeSource.value === 'social' ? String(route.query.channel || '').toLowerCase() : ''
    if (route.query.tier) {
      tier.value = String(route.query.tier)
      search.value = ''
      arrival.value = 'all'
    }
  },
  { immediate: true },
)
const weeklyOnly = computed(() => route.query.period === 'week')
const sourceOrders = computed(() =>
  orders.value.filter((order) => {
    const source = preview ? purchaseSources[order.id] || {} : {}
    return (
      attendeeSource.value === 'all' ||
      (attendeeSource.value === 'discount' &&
        source.code &&
        (!attendeeCode.value || source.code === attendeeCode.value)) ||
      (attendeeSource.value === 'social' &&
        source.channel &&
        (!attendeeChannel.value || source.channel === attendeeChannel.value))
    )
  }),
)
const filteredOrders = computed(() =>
  !preview
    ? sourceOrders.value
    : sourceOrders.value.filter((order) => {
        const tickets = model.ticketsFor(order),
          query = search.value.trim().toLowerCase()
        const arrived = tickets.filter((t) => model.everArrived(t.id)).length
        return (
          (!query ||
            [
              order.id,
              order.buyer,
              order.email,
              ...tickets.flatMap((t) => [t.name, t.email, t.id, t.type]),
            ].some((value) => String(value).toLowerCase().includes(query))) &&
          (tier.value === 'all' || tickets.some((t) => t.type === tier.value)) &&
          (!weeklyOnly.value || tickets.some((t) => t.period === 'week')) &&
          (arrival.value === 'all' ||
            (arrival.value === 'checked' && arrived > 0) ||
            (arrival.value === 'pending' && arrived === 0) ||
            (arrival.value === 'complete' && arrived === tickets.length))
        )
      }),
)
const shownTickets = computed(() => [
  ...new Map(
    filteredOrders.value
      .flatMap((order) => model.ticketsFor(order))
      .map((ticket) => [ticket.id, ticket]),
  ).values(),
])
const arrived = computed(() => shownTickets.value.filter((t) => model.everArrived(t.id)).length)
const hasFilters = computed(() =>
  Boolean(
    search.value ||
      tier.value !== 'all' ||
      arrival.value !== 'all' ||
      attendeeSource.value !== 'all' ||
      weeklyOnly.value,
  ),
)
const title = computed(() =>
  attendeeSource.value === 'discount'
    ? attendeeCode.value
      ? `These guests used ${attendeeCode.value} to buy their tickets.`
      : 'These guests bought tickets using a discount code.'
    : attendeeSource.value === 'social'
      ? attendeeChannel.value
        ? `These guests ${free.value ? 'registered' : 'bought tickets'} through your ${channelNames[attendeeChannel.value] || attendeeChannel.value} link.`
        : `These guests ${free.value ? 'registered' : 'bought tickets'} through your tracked social links.`
      : `This is your ${free.value ? 'registration' : 'guest'} list for ${event.value.title}. Find a guest and see who has arrived.`,
)
const ticketTypes = computed(() => [
  ...new Set([
    ...(props.overview.ticket_types || []).map((t) => t.name),
    ...guests.value.map((t) => t.type),
  ]),
])
const selectedOrder = computed(() => orders.value.find((order) => order.id === route.query.order))
const purchaseGuests = computed(() => model.ticketsFor(selectedOrder.value))
const historyGuest = computed(() => guests.value.find((guest) => guest.id === route.query.history))
const sessions = computed(() => visitSessions(model.visits(historyGuest.value?.id)).reverse())
const receiptFacts = computed(() =>
  selectedOrder.value
    ? [
        [free.value ? 'Registration number' : 'Order number', selectedOrder.value.id],
        [free.value ? 'Registered on' : 'Bought on', selectedOrder.value.purchased],
        [
          preview
            ? free.value
              ? 'Guests included'
              : 'Tickets in this purchase'
            : 'Loaded guest records',
          String(purchaseGuests.value.length),
        ],
        ...(free.value && props.context === 'door'
          ? []
          : [
              [
                preview ? 'Amount paid' : 'Purchase items total',
                free.value ? 'Free' : money(model.orderTotal(selectedOrder.value)),
              ],
            ]),
      ]
    : [],
)
const money = (value) =>
  formatMoneyMinor(
    value,
    selectedOrder.value?.currency || props.overview.revenue?.currency || 'NGN',
  )
const initials = (name) =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
const notify = (text) => emit('notify', text)
function navigationQuery(view, query = {}) {
  if (props.context !== 'door') return { view, ...query }
  const back = route.query.returnEntrance ? { returnEntrance: route.query.returnEntrance } : {}
  if (view === 'attendees')
    return {
      view: 'checkin',
      ...(route.query.returnEntrance ? { entrance: route.query.returnEntrance } : {}),
    }
  const id =
    query.history || query.guest || orders.value.find((o) => o.id === query.order)?.ticketIds[0]
  return {
    view: 'checkin',
    ...back,
    ...query,
    ...(id ? { doorGuest: id, guest: id, order: model.orderFor(id)?.id } : {}),
  }
}
function destination(view, query = {}) {
  return `${import.meta.env.BASE_URL}${route.name === 'event-door' ? 'door/' : 'dashboard/events/'}${encodeURIComponent(props.eventId)}?${new URLSearchParams(navigationQuery(view, query))}`
}
function navigate(view, query = {}) {
  emit('navigate', navigationQuery(view, query))
}
function selectSource(source) {
  if (!preview && source !== 'all') {
    notify('Source filtering is not available for guest records yet.')
    return
  }
  if (free.value && source === 'discount') return
  attendeeSource.value = source
  attendeeCode.value = ''
  attendeeChannel.value = ''
  navigate('attendees', source === 'all' ? {} : { source })
}
function resetLocalFilters() {
  search.value = ''
  tier.value = 'all'
  arrival.value = 'all'
  attendeeSource.value = 'all'
  attendeeCode.value = ''
  attendeeChannel.value = ''
}
function clearFilters() {
  resetLocalFilters()
  navigate('attendees')
  nextTick(() => searchInput.value?.focus())
}
function changeMode(value) {
  model.setMode(value)
  resetLocalFilters()
  navigate('attendees')
}
function sourceKeys(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  const tabs = [...event.currentTarget.querySelectorAll('[role=tab]')].filter((tab) => !tab.hidden)
  const index = tabs.indexOf(event.target)
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? tabs.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
  tabs[next]?.click()
  tabs[next]?.focus()
}
function typeSummary(order) {
  if (!preview)
    return order.lines.map((line) => `${line.quantity} x ${line.ticket_name}`).join(', ')
  const types = new Map()
  for (const ticket of model.ticketsFor(order))
    types.set(ticket.type, (types.get(ticket.type) || 0) + 1)
  return [...types].map(([type, count]) => `${count > 1 ? `${count} × ` : ''}${type}`).join(' · ')
}
function matchingGuests(order) {
  const query = search.value.trim().toLowerCase()
  if (!query || [order.id, order.buyer, order.email].some((v) => v.toLowerCase().includes(query)))
    return ''
  return model
    .ticketsFor(order)
    .filter((t) => [t.name, t.email, t.id].some((v) => v.toLowerCase().includes(query)))
    .map((t) => t.name)
    .join(', ')
}
function sourceText(order) {
  const source = purchaseSources[order.id] || {}
  return [
    !free.value && source.code ? `Code: ${source.code}` : '',
    source.channel ? `Link: ${channelNames[source.channel] || source.channel}` : '',
  ]
    .filter(Boolean)
    .join(' · ')
}
function progress(order) {
  const tickets = model.ticketsFor(order),
    count = tickets.filter((t) => model.everArrived(t.id)).length
  return count === tickets.length ? 'all' : count ? 'some' : 'none'
}
function openPurchase(order) {
  navigate('purchase', { order: order.id })
}
function openHistory(guest) {
  navigate('checkin', {
    history: guest.id,
    ...(preview
      ? {}
      : { ticket: guest.ticketPublicId, attendeePage: model.attendeePage.value.current_page }),
  })
}
function historyBack() {
  const owner = model.orderFor(historyGuest.value?.id)
  if (owner) navigate('purchase', { order: owner.id, guest: historyGuest.value.id })
  else navigate('attendees')
}
const historyBackHref = computed(() => {
  const owner = model.orderFor(historyGuest.value?.id)
  return owner
    ? destination('purchase', { order: owner.id, guest: historyGuest.value.id })
    : destination('attendees')
})
const editDialog = ref(null),
  alertDialog = ref(null),
  editing = ref(null),
  alertGuest = ref(null)
const edit = reactive({ name: '', email: '', answers: {} }),
  alert = reactive({ self: '', teammate: '' }),
  editError = ref(''),
  alertError = ref('')
function openEdit(guest) {
  editing.value = guest
  Object.assign(edit, {
    name: preview ? guest.name : guest.originalName || '',
    email: guest.email,
    answers: { ...guest.answers },
  })
  editError.value = ''
  editDialog.value.showModal()
  nextTick(() => editDialog.value?.querySelector?.('[name="name"]')?.focus())
}
async function saveGuest() {
  const result = await model.updateGuest(editing.value.id, edit)
  if (!result.ok) {
    editError.value = result.message
    return
  }
  if (!editDialog.value) return
  editDialog.value.close()
  notify(result.message)
}
function openAlert(guest) {
  alertGuest.value = guest
  Object.assign(alert, { self: '', teammate: '', ...model.alerts.value[guest.id] })
  alertError.value = ''
  alertDialog.value.showModal()
}
function saveArrivalAlert() {
  if (
    !model.saveAlert(alertGuest.value.id, {
      self: alert.self.trim(),
      teammate: alert.teammate.trim(),
    })
  ) {
    alertError.value = preview
      ? 'We couldn’t save your alert preference. Check your browser storage and try again.'
      : 'Arrival alerts aren’t connected yet. Your preference hasn’t been saved.'
    return
  }
  alertDialog.value.close()
  notify(
    `Arrival alert preferences saved in this browser for ${alert.teammate ? 'you and your teammate' : 'you'}. No emails were sent.`,
  )
}
async function resend(guest) {
  if (!preview) {
    try {
      const result = await model.resend(guest.ticketPublicId)
      notify(result.message)
    } catch {
      notify('The ticket link was not queued. Please try again.')
    }
    return
  }
  notify(
    `We couldn’t resend the ticket to ${guest.email} because email isn’t connected yet. No email was sent.`,
  )
}
function closeFromBackdrop(event) {
  const dialog = event.currentTarget
  if (event.target !== dialog) return
  const r = dialog.getBoundingClientRect()
  if (
    event.clientX < r.left ||
    event.clientX > r.right ||
    event.clientY < r.top ||
    event.clientY > r.bottom
  )
    dialog.close()
}
async function exportGuests() {
  if (!preview) {
    try {
      const blob = await model.exportGuests(search.value.trim())
      const url = URL.createObjectURL(blob),
        link = document.createElement('a')
      link.href = url
      link.download = `event-${props.eventId}-attendees.csv`
      link.click()
      URL.revokeObjectURL(url)
      notify('Guest list exported.')
    } catch {
      notify('The guest list could not be exported. Please try again.')
    }
    return
  }
  const rows = [
    ['Name', 'Email', 'Ticket type', 'Ticket code', free.value ? 'Registered' : 'Purchased'],
    ...guests.value.map((t) => [t.name, t.email, t.type, t.id, t.purchased]),
  ]
  const csv = rows
    .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })),
    link = document.createElement('a')
  link.href = url
  link.download = preview ? 'rushhour-demo-ticket-records.csv' : 'rushhour-guest-list.csv'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 500)
  notify('Guest list exported.')
}
const printing = ref(false)
async function printReceipt() {
  printing.value = true
  await nextTick()
  window.print()
}
function finishPrint() {
  printing.value = false
}
const photo = computed(() => photos.value[selectedOrder.value?.id] || '')
async function uploadPhoto(event) {
  if (!preview) {
    notify('Buyer photo uploads are not available.')
    return
  }
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    notify('Choose a JPG, PNG or WebP photo.')
    return
  }
  if (file.size > 10 * 1024 * 1024) {
    notify('Choose a photo smaller than 10 MB.')
    return
  }
  const id = selectedOrder.value?.id
  try {
    const url = URL.createObjectURL(file),
      image = new Image()
    try {
      await new Promise((resolve, reject) => {
        image.onload = resolve
        image.onerror = reject
        image.src = url
      })
    } finally {
      URL.revokeObjectURL(url)
    }
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 320
    const side = Math.min(image.naturalWidth, image.naturalHeight)
    canvas
      .getContext('2d')
      .drawImage(
        image,
        (image.naturalWidth - side) / 2,
        (image.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        320,
        320,
      )
    notify(
      model.savePhoto(id, canvas.toDataURL('image/jpeg', 0.79))
        ? 'Photo added to this browser.'
        : 'We couldn’t save this photo. Check your browser storage and try again.',
    )
  } catch {
    notify('We couldn’t open that photo. Choose another image and try again.')
  }
}
const selectedGuest = ref(''),
  sticky = ref(false),
  stickyStyle = ref({}),
  guestTooltip = ref(null)
function syncSticky() {
  guestTooltip.value = null
  if (props.page !== 'purchase') {
    sticky.value = false
    return
  }
  const root = document.querySelector('.event-workspace'),
    top = root?.querySelector('.topbar')?.getBoundingClientRect().bottom || 0
  const marker = document.getElementById('rh-v24-purchase-guest-names')
  root?.style.setProperty('--rh-guest-header-bottom', `${Math.max(0, top)}px`)
  sticky.value = Boolean(marker && marker.getBoundingClientRect().top <= top + 24)
  const left = root?.querySelector('.main')?.getBoundingClientRect().left || 0
  stickyStyle.value = {
    top: `${Math.max(0, top)}px`,
    left: `${Math.max(0, left)}px`,
    '--rh-guest-scroll-offset': `${Math.max(0, top) + 88}px`,
  }
  if (sticky.value) {
    let best = purchaseGuests.value[0]?.id
    for (const guest of purchaseGuests.value) {
      const card = document.getElementById(`rh-v25-guest-${guest.id}`)
      if (card?.getBoundingClientRect().top < top + 135) best = guest.id
    }
    selectedGuest.value = best
  }
}
function jumpToGuest(id, smooth = true) {
  selectedGuest.value = id
  guestTooltip.value = null
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  document
    .getElementById(`rh-v25-guest-${id}`)
    ?.scrollIntoView({ behavior: smooth && !reduced ? 'smooth' : 'instant', block: 'start' })
}
function showTooltip(event, guest) {
  const r = event.currentTarget.getBoundingClientRect()
  guestTooltip.value = {
    name: guest.name,
    status: model.guestState(guest.id),
    id: guest.id,
    left: Math.max(12, Math.min(r.right - 220, window.innerWidth - 232)),
    top: r.bottom + 10,
  }
}
function historyUpdates(guest) {
  if (!guest) return []
  return [
    ...model
      .visits(guest.id)
      .slice(-6)
      .reverse()
      .map((v) => ({
        label: v.kind === 'in' ? 'Entered event' : 'Left event',
        time: `${visitDate(v.at, event.value.timezone)}, ${visitDate(v.at, event.value.timezone, true)}`,
      })),
    ...(model.activity.value[guest.id] || []).slice(0, 3).map((v) => ({
      label: 'Guest details updated',
      time: `${visitDate(v.at, event.value.timezone)}, ${visitDate(v.at, event.value.timezone, true)}`,
    })),
    { label: free.value ? 'Guest registered' : 'Ticket purchased', time: guest.purchased },
  ]
}
watch(
  () => [props.page, route.query.order, route.query.guest],
  async () => {
    if (editDialog.value?.open) editDialog.value.close()
    if (alertDialog.value?.open) alertDialog.value.close()
    sticky.value = false
    selectedGuest.value = String(route.query.guest || purchaseGuests.value[0]?.id || '')
    await nextTick()
    if (typeof window !== 'undefined') {
      if (props.page === 'purchase' && route.query.guest)
        jumpToGuest(String(route.query.guest), false)
      syncSticky()
    }
  },
)
let searchTimer
if (!preview) {
  watch(search, () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      void model.loadAttendees({ page: 1, q: search.value.trim() || undefined })
      void model.loadPurchases({ page: 1, q: search.value.trim() || undefined })
    }, 300)
  })
  watch(
    () => route.query.order,
    (id) => {
      if (id) void model.loadPurchases({ page: 1, q: String(id) })
    },
    { immediate: true },
  )
  if (route.query.attendeePage)
    void model.loadAttendees({ page: Number(route.query.attendeePage) || 1 })
  watch(
    () => route.query.history,
    (id) => {
      const ticket = route.query.ticket || guests.value.find((g) => g.id === id)?.ticketPublicId
      if (ticket) void model.loadHistory({ page: 1, ticket_public_id: String(ticket) })
    },
    { immediate: true },
  )
}
onMounted(() => {
  window.addEventListener('scroll', syncSticky, { passive: true })
  window.addEventListener('resize', syncSticky)
  window.addEventListener('afterprint', finishPrint)
  if (props.page === 'purchase' && route.query.guest)
    nextTick(() => jumpToGuest(String(route.query.guest), false))
  syncSticky()
})
onBeforeUnmount(() => {
  clearTimeout(searchTimer)
  window.removeEventListener('scroll', syncSticky)
  window.removeEventListener('resize', syncSticky)
  window.removeEventListener('afterprint', finishPrint)
})
</script>

<template>
  <div
    class="workspace-attendees"
    :class="{ 'workspace-printing-receipt': printing }"
    @click.stop
    @submit.stop
    @keydown.stop
  >
    <section
      v-show="page === 'attendees'"
      data-route="attendees"
      class="rh-screen rh-v19-attendees"
      aria-labelledby="rh-attendees-title"
    >
      <div
        class="rh-attendee-source-tabs"
        role="tablist"
        aria-label="Filter guest list by purchase source"
        @keydown="sourceKeys"
      >
        <button
          v-for="[source, label] in [
            ['all', free ? 'All registrations' : 'All purchases'],
            ['discount', 'Discount codes'],
            ['social', 'Social links'],
          ]"
          :key="source"
          :hidden="free && source === 'discount'"
          type="button"
          role="tab"
          :data-rh-attendee-source="source"
          :aria-selected="attendeeSource === source"
          :tabindex="attendeeSource === source ? 0 : -1"
          @click="selectSource(source)"
        >
          {{ label }}
        </button>
      </div>
      <p v-if="!preview && model.error.value" role="alert" class="rh-note">
        {{ model.error.value }}
        <button type="button" class="rh-row-button" @click="model.retry">Try again</button>
      </p>
      <p v-if="!preview && model.loading.value" role="status" class="rh-note">
        Getting your event records ready...
      </p>
      <div class="rh-page-heading">
        <div>
          <span class="rh-eyebrow" aria-hidden="true">Main / Attendees</span>
          <h1 id="rh-attendees-title">{{ title }}</h1>
        </div>
        <div class="rh-attendee-heading-actions">
          <label v-if="preview" class="rh-event-type-preview"
            ><span>Event type preview</span
            ><select
              id="rh-attendee-event-type"
              :value="mode"
              aria-label="Preview attendees for a paid or free event"
              @change="changeMode($event.target.value)"
            >
              <option value="paid">Paid event</option>
              <option value="free">Free event</option>
            </select></label
          ><button
            id="rh-export-attendees"
            type="button"
            class="rh-button rh-button-outline"
            @click="exportGuests"
          >
            ↧ Export guest list
          </button>
        </div>
      </div>
      <p v-if="preview && weeklyOnly" class="rh-note" role="status">
        Showing purchases from this week.
        <button class="rh-row-button" @click="clearFilters">Show all purchases</button>
      </p>
      <div class="rh-summary-grid rh-v19-summary">
        <article class="rh-summary-card">
          <span id="rh-attendee-bookings-label">{{
            free ? 'Registrations' : 'Purchases made'
          }}</span
          ><strong id="rh-v19-bookings-total">{{ filteredOrders.length }}</strong>
        </article>
        <article class="rh-summary-card">
          <span id="rh-attendee-tickets-label">{{
            preview ? (free ? 'Guests registered' : 'Tickets bought') : 'Guest records on this page'
          }}</span
          ><strong id="rh-v19-tickets-total">{{ shownTickets.length }}</strong
          ><small>For the selected list</small>
        </article>
        <article class="rh-summary-card">
          <span>Guests who have arrived</span
          ><strong id="rh-v19-checked-total">{{ arrived }} of {{ shownTickets.length }}</strong
          ><small>For the guest list shown</small>
        </article>
      </div>
      <div class="rh-v19-table-heading">
        <h2 id="rh-purchases-heading">{{ free ? 'Registrations' : 'Purchases and guests' }}</h2>
        <p id="rh-attendee-list-description">
          {{
            free
              ? 'Registered guests and their arrival status.'
              : 'Each row is a purchase. Open one to see its receipt and the people whose tickets were bought together.'
          }}
        </p>
      </div>
      <div
        class="rh-module rh-v19-bookings-module"
        role="region"
        aria-labelledby="rh-purchases-heading"
      >
        <div class="rh-table-scroll rh-v19-scroll">
          <table class="rh-data-table rh-v19-table">
            <caption class="rh-sr">
              {{
                free
                  ? 'Registrations and guest arrival status.'
                  : 'Purchases and guest arrival status.'
              }}
            </caption>
            <thead>
              <tr>
                <th class="rh-purchase-buyer-head" scope="col">
                  <div class="rh-purchase-column-label">
                    {{ free ? 'Registered by' : 'Ticket buyer' }}
                  </div>
                  <div class="rh-purchase-search">
                    <label class="rh-field rh-search-field"
                      ><span class="rh-sr">Search guests and registrations</span
                      ><input
                        id="rh-attendee-search"
                        maxlength="100"
                        ref="searchInput"
                        v-model="search"
                        type="search"
                        autocomplete="off"
                        :placeholder="
                          !preview
                            ? 'Start of guest name, email or order reference'
                            : free
                              ? 'Search name, email or registration'
                              : 'Search name, email or ticket code'
                        " /></label
                    ><button
                      v-show="hasFilters"
                      id="rh-v19-clear-filters"
                      class="rh-v19-clear"
                      type="button"
                      @click="clearFilters"
                    >
                      Reset filters
                    </button>
                  </div>
                </th>
                <th class="rh-purchase-ticket-head" scope="col">
                  <div class="rh-purchase-column-label">
                    {{ free ? 'Guests' : 'Tickets bought' }}
                  </div>
                  <label class="rh-field rh-compact-select"
                    ><span class="rh-sr">Ticket type</span
                    ><select
                      id="rh-attendee-tier"
                      :disabled="!preview"
                      v-model="tier"
                      aria-label="Filter by ticket type"
                    >
                      <option value="all">{{ free ? 'All passes' : 'All ticket types' }}</option>
                      <option v-for="type in ticketTypes" :key="type" :value="type">
                        {{ type }}
                      </option>
                    </select></label
                  >
                </th>
                <th class="rh-purchase-arrival-head" scope="col">
                  <div class="rh-purchase-column-label">Guest arrivals</div>
                  <label class="rh-field rh-compact-select"
                    ><span class="rh-sr">Arrival</span
                    ><select
                      id="rh-attendee-arrival"
                      :disabled="!preview"
                      v-model="arrival"
                      aria-label="Filter by arrival status"
                    >
                      <option value="all">All arrival statuses</option>
                      <option value="checked">At least one guest arrived</option>
                      <option value="pending">No guests arrived yet</option>
                      <option value="complete">All guests arrived</option>
                    </select></label
                  >
                </th>
                <th class="rh-purchase-date-head" scope="col">
                  <div class="rh-purchase-column-label">
                    {{ free ? 'Registered on' : 'Date bought' }}
                  </div>
                </th>
                <th class="rh-th-action rh-purchase-details-head" scope="col">
                  <div class="rh-purchase-column-label">
                    {{ free ? 'Registration' : 'Purchase' }}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody id="rh-attendee-rows">
              <tr v-for="order in filteredOrders" :key="order.id" class="rh-v19-booking-row">
                <td :data-label="free ? 'Registered by' : 'Buyer'" class="rh-v19-buyer-cell">
                  <div class="rh-table-person">
                    <span class="rh-initial">{{ initials(order.buyer) }}</span>
                    <div class="rh-person-copy rh-table-entity">
                      <strong>{{ order.buyer }}</strong>
                      <div class="rh30-buyer-email">
                        <small>{{ order.email }}</small
                        ><WorkspaceCopyButton
                          class="rh30-inline-email-copy"
                          compact
                          :value="order.email"
                          :label="`Copy email for ${order.buyer}`"
                          @notify="notify"
                        />
                      </div>
                      <small v-if="matchingGuests(order)" class="rh-v19-guest-match"
                        >Guest: {{ matchingGuests(order) }}</small
                      ><small
                        v-if="attendeeSource !== 'all' && sourceText(order)"
                        class="rh-attendee-source-tag"
                        >{{ sourceText(order) }}</small
                      >
                    </div>
                  </div>
                </td>
                <td :data-label="free ? 'Guests' : 'Tickets bought'">
                  <strong
                    >{{ preview ? order.ticketIds.length : order.quantity }}
                    {{
                      free
                        ? (preview ? order.ticketIds.length : order.quantity) === 1
                          ? 'guest'
                          : 'guests'
                        : (preview ? order.ticketIds.length : order.quantity) === 1
                          ? 'ticket'
                          : 'tickets'
                    }}</strong
                  ><small class="rh-attendee-ticket-types">{{ typeSummary(order) }}</small>
                </td>
                <td data-label="Arrival">
                  <span class="rh-v19-progress" :class="progress(order)"
                    ><span class="rh-v19-progress-dot" aria-hidden="true" />{{
                      preview
                        ? arrivalWords(model.ticketsFor(order), model.everArrived)
                        : `${model.ticketsFor(order).filter((guest) => model.everArrived(guest.id)).length} of ${model.ticketsFor(order).length} loaded guest records arrived`
                    }}</span
                  >
                </td>
                <td :data-label="free ? 'Registered' : 'Purchased'">{{ order.purchased }}</td>
                <td data-label="Details" class="rh-v19-action-cell">
                  <a
                    class="rh-v19-detail-button rh-v22-view-btn"
                    :href="destination('purchase', { order: order.id })"
                    :aria-label="`Open ${recordWord} for ${order.buyer}`"
                    @click.prevent="openPurchase(order)"
                    >Open {{ recordWord }}</a
                  >
                </td>
              </tr>
              <tr v-if="!filteredOrders.length">
                <td colspan="5" class="rh-v19-empty">
                  <template v-if="preview"
                    >We couldn’t find a matching {{ recordWord }}. Try another name, email or
                    ticket, or reset your filters.
                    <button type="button" @click="clearFilters">Reset filters</button></template
                  ><template v-else
                    >No purchases are shown on this page. Try another email or order
                    reference.</template
                  >
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="rh-module-foot rh-v19-foot">
          <span v-if="preview" id="rh-attendee-count" role="status"
            >Showing {{ filteredOrders.length }} of {{ sourceOrders.length }}
            {{ sourceOrders.length === 1 ? recordWord : recordWord + 's' }}</span
          >
          <nav v-if="!preview" class="rh-form-actions" aria-label="Purchase pages">
            <button
              class="rh-button rh-button-outline"
              :disabled="model.purchasePage.value.current_page <= 1 || model.loading.value"
              @click="
                model.loadPurchases({
                  page: model.purchasePage.value.current_page - 1,
                  q: search || undefined,
                })
              "
            >
              Previous
            </button>
            <span
              >Page {{ model.purchasePage.value.current_page }} of
              {{ model.purchasePage.value.last_page }} ({{
                model.purchasePage.value.total
              }}
              purchase items)</span
            >
            <button
              class="rh-button rh-button-outline"
              :disabled="
                model.purchasePage.value.current_page >= model.purchasePage.value.last_page ||
                model.loading.value
              "
              @click="
                model.loadPurchases({
                  page: model.purchasePage.value.current_page + 1,
                  q: search || undefined,
                })
              "
            >
              Next
            </button>
          </nav>
        </div>
      </div>
      <section v-if="!preview" class="rh-module">
        <h2>Guest records</h2>
        <p class="rh-note">
          Search by the start of a guest name or email. Guest and purchase pages are loaded
          separately.
        </p>
        <div class="rh-table-scroll">
          <table class="rh-data-table">
            <thead>
              <tr>
                <th>Guest</th>
                <th>Ticket</th>
                <th>Arrival</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="guest in guests" :key="guest.id">
                <td>
                  {{ guest.name }}<small>{{ guest.email }}</small>
                </td>
                <td>
                  {{ guest.type }}<small>{{ guest.ticketPublicId }}</small>
                </td>
                <td>{{ model.guestState(guest.id) }}</td>
                <td>
                  <button class="rh-row-button" @click="openEdit(guest)">Update guest</button
                  ><button class="rh-row-button" @click="openHistory(guest)">Entry history</button
                  ><button class="rh-row-button" @click="resend(guest)">Resend ticket</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <nav class="rh-form-actions" aria-label="Guest pages">
          <button
            class="rh-button rh-button-outline"
            :disabled="model.attendeePage.value.current_page <= 1"
            @click="
              model.loadAttendees({
                page: model.attendeePage.value.current_page - 1,
                q: search || undefined,
              })
            "
          >
            Previous</button
          ><span
            >Page {{ model.attendeePage.value.current_page }} of
            {{ model.attendeePage.value.last_page }} ({{
              model.attendeePage.value.total
            }}
            guests)</span
          ><button
            class="rh-button rh-button-outline"
            :disabled="model.attendeePage.value.current_page >= model.attendeePage.value.last_page"
            @click="
              model.loadAttendees({
                page: model.attendeePage.value.current_page + 1,
                q: search || undefined,
              })
            "
          >
            Next
          </button>
        </nav>
      </section>
    </section>

    <section
      v-if="page === 'purchase'"
      data-route="purchase"
      class="rh-screen rh-v22-purchase-page rh-v25-page"
      aria-labelledby="rh-v22-purchase-title"
    >
      <div class="rh-v25-heading rh-v26-purchase-heading rh28-purchase-hero">
        <div class="rh28-purchase-copy">
          <a
            class="rh-v26-back"
            :href="destination('attendees')"
            :aria-label="context === 'door' ? 'Back to door check-in' : 'Back to attendees'"
            @click.prevent="navigate('attendees')"
            ><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m14 6-6 6 6 6" /></svg
            >{{ context === 'door' ? 'Door check-in' : 'Attendees' }}</a
          >
          <h1 id="rh-v22-purchase-title">
            {{
              selectedOrder
                ? `${free ? 'Registration summary' : 'Purchase details'} for ${selectedOrder.buyer}`
                : `We couldn’t find this ${recordWord}`
            }}
          </h1>
          <p v-if="selectedOrder && preview" id="rh-v25-heading-description">
            {{
              free
                ? `${selectedOrder.buyer} registered ${purchaseGuests.length} ${purchaseGuests.length === 1 ? 'guest' : 'guests'}${purchaseGuests.length > 1 ? ', including themselves' : ''}.`
                : 'The receipt below shows what was bought. You’ll also find the details and arrival status for each guest.'
            }}
          </p>
          <p v-else-if="!selectedOrder">Go back to Attendees and choose a {{ recordWord }}.</p>
          <p v-else class="rh-note">
            This receipt shows the purchase items on the current page. Guest records are paginated
            separately; the buyer is not automatically assigned to a seat.
          </p>
        </div>
        <div v-if="selectedOrder" class="rh28-photo-wrap">
          <div
            id="rh28-photo-frame"
            class="rh28-guest-photo"
            role="img"
            :aria-label="
              photo
                ? `Photo for ${selectedOrder.buyer}`
                : `No photo added for ${selectedOrder.buyer}`
            "
          >
            <img
              v-if="photo"
              id="rh28-buyer-photo"
              :src="photo"
              :alt="`Photo of ${selectedOrder.buyer}`"
            />
            <div v-else id="rh28-photo-initials" class="rh28-photo-fallback" aria-hidden="true">
              {{ initials(selectedOrder.buyer) }}
            </div>
          </div>
          <label v-if="preview" class="rh28-photo-upload" for="rh28-photo-input"
            ><svg
              aria-hidden="true"
              fill="none"
              height="14"
              stroke="currentColor"
              stroke-width="1.75"
              viewBox="0 0 24 24"
              width="14"
            >
              <path d="M12 16V4m-4 4 4-4 4 4M4 15v4c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-4" /></svg
            ><span>{{ photo ? 'Change photo' : 'Add photo' }}</span
            ><input
              id="rh28-photo-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Add a photo for the ticket buyer"
              @change="uploadPhoto"
          /></label>
        </div>
      </div>
      <div v-if="selectedOrder" class="rh-v25-all-details">
        <section
          id="rh-v25-purchase-receipt"
          class="rh-module rh-v22-purchase-lead rh-v23-purchase-slip rh-v24-purchase-slip rh-v25-purchase-receipt"
          :aria-label="free ? 'Registration details' : 'Purchase receipt'"
        >
          <div class="rh-v24-receipt-top">
            <h2>{{ free ? 'Registration details' : 'Purchase receipt' }}</h2>
            <button
              id="rh-v24-print-purchase"
              class="rh-v24-print-btn"
              type="button"
              @click="printReceipt"
            >
              <svg
                aria-hidden="true"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.8"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v7H6zM18 12h.01"
                /></svg
              ><span>{{ free ? 'Print registration' : 'Print receipt' }}</span>
            </button>
          </div>
          <div class="rh-v22-purchase-lead-main">
            <div>
              <h2>
                {{ selectedOrder.buyer }} {{ free ? 'registered' : 'bought' }}
                {{ purchaseGuests.length }}
                {{
                  free
                    ? purchaseGuests.length === 1
                      ? 'guest'
                      : 'guests'
                    : purchaseGuests.length === 1
                      ? 'ticket'
                      : 'tickets'
                }}{{ free && purchaseGuests.length > 1 ? ', including themselves' : '' }}
              </h2>
              <div class="rh-v22-buyer-contact">
                <span class="rh-v26-receipt-buyer">{{ selectedOrder.email }}</span
                ><WorkspaceCopyButton
                  :value="selectedOrder.email"
                  :label="`Copy ${selectedOrder.buyer}’s email address`"
                  @notify="notify"
                />
              </div>
            </div>
            <span class="rh-v22-paid">{{
              preview ? (free ? 'Free' : 'Paid') : selectedOrder.payment.replaceAll('_', ' ')
            }}</span>
          </div>
          <div class="rh-v22-receipt-facts">
            <div
              v-for="([label, value], index) in receiptFacts"
              :key="label"
              :class="{ 'rh-v24-metric': index > 1 }"
            >
              <span>{{ label }}</span>
              <div class="rh28-email-line rh-compact-copy">
                <strong>{{ value }}</strong
                ><WorkspaceCopyButton
                  v-if="index === 0"
                  :value="value"
                  :label="`Copy ${free ? 'registration' : 'order'} number`"
                  @notify="notify"
                />
              </div>
            </div>
          </div>
          <div id="rh-v24-purchase-guest-names" class="rh-v24-receipt-guests">
            <span>{{
              free
                ? purchaseGuests.length === 1
                  ? 'Registered guest'
                  : 'Guests included in this registration'
                : purchaseGuests.length === 1
                  ? 'This ticket is for'
                  : 'These tickets are for'
            }}</span>
            <div>
              <span v-for="guest in purchaseGuests" :key="guest.id" class="rh-v24-guest-name">{{
                guest.name
              }}</span>
            </div>
          </div>
          <div class="rh-v23-purchase-footer">
            <span class="rh-wordmark" aria-label="Rush Hour Tickets"
              ><span class="rh-wordmark-name">Rush Hour</span
              ><span class="rh-wordmark-tickets">Tickets</span></span
            ><span>{{ free ? 'Registration details' : 'Purchase details' }}</span>
          </div>
        </section>
        <div id="rh-v25-receipt-end" aria-hidden="true" />
        <div id="rh-v25-primary-guest">
          <WorkspaceGuestCard
            v-if="purchaseGuests[0]"
            :guest="purchaseGuests[0]"
            :order="selectedOrder"
            :model="model"
            :free="free"
            :timezone="event.timezone"
            :history-href="destination('checkin', { history: purchaseGuests[0].id })"
            @edit="openEdit"
            @resend="resend"
            @alert="openAlert"
            @history="openHistory"
            @notify="notify"
          />
        </div>
        <section
          v-if="purchaseGuests.length > 1"
          id="rh-v25-other-section"
          class="rh-v25-other-section"
          aria-labelledby="rh-v25-other-heading"
        >
          <div class="rh-v25-other-heading">
            <div>
              <span class="rh-v25-section-label">{{
                free ? 'Also in this registration' : 'Also on this purchase'
              }}</span>
              <h2 id="rh-v25-other-heading">
                {{ purchaseGuests.length - 1 }} more
                {{ purchaseGuests.length === 2 ? 'guest' : 'guests' }}
              </h2>
              <p>
                {{
                  free
                    ? purchaseGuests.length === 2
                      ? 'This guest is included in the same registration.'
                      : 'These guests are included in the same registration.'
                    : purchaseGuests.length === 2
                      ? 'Their ticket was bought together with the first guest’s ticket.'
                      : 'Their tickets were bought together with the first guest’s ticket.'
                }}
              </p>
            </div>
          </div>
          <div id="rh-v25-other-guests">
            <WorkspaceGuestCard
              v-for="guest in purchaseGuests.slice(1)"
              :key="guest.id"
              :guest="guest"
              :order="selectedOrder"
              :model="model"
              :free="free"
              :timezone="event.timezone"
              :history-href="destination('checkin', { history: guest.id })"
              @edit="openEdit"
              @resend="resend"
              @alert="openAlert"
              @history="openHistory"
              @notify="notify"
            />
          </div>
        </section>
      </div>
    </section>

    <section
      v-if="page === 'checkin' && route.query.history"
      data-route="checkin"
      class="rh-screen rh-v22-door"
      aria-labelledby="rh-v26-history-title"
    >
      <div id="rh-v26-history-only">
        <div class="rh-v26-history-heading">
          <a class="rh-v26-back" :href="historyBackHref" @click.prevent="historyBack"
            ><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m14 6-6 6 6 6" /></svg>Back to
            {{ context === 'door' ? 'guest details' : 'tickets' }}</a
          >
          <h1 id="rh-v26-history-title">
            {{
              historyGuest
                ? historyGuest.name + '’s visits'
                : !preview && route.query.ticket
                  ? 'Ticket movement history'
                  : 'We couldn’t find this guest'
            }}
          </h1>
          <p>
            {{
              preview
                ? 'See when this guest came in and left.'
                : 'Ticket movement history includes counted entries and exits. A table credential can cover several guests.'
            }}
          </p>
        </div>
        <template v-if="historyGuest || (!preview && route.query.ticket)"
          ><div v-if="historyGuest" class="rh-v26-history-status">
            <span
              class="rh-v23-signal"
              :class="{ 'is-pulsing': model.inside(historyGuest.id) }"
              aria-hidden="true"
              ><i /></span
            ><span>{{ model.guestState(historyGuest.id) }}</span>
          </div>
          <section class="rh-module rh-v26-visit-card" aria-labelledby="rh-v26-visits-heading">
            <h2 id="rh-v26-visits-heading">
              {{ preview ? 'Visits' : 'Ticket entries and exits' }}
            </h2>
            <template v-if="!preview"
              ><div
                v-for="movement in model.movements.value"
                :key="movement.request_key || movement.at + movement.kind"
                class="rh-v26-visit"
              >
                <strong
                  >{{ movement.kind === 'in' ? 'Entered' : 'Left' }}:
                  {{ movement.count }} admission(s)</strong
                ><span>{{ movement.entrance }}</span
                ><time
                  >{{ visitDate(movement.at, event.timezone) }}
                  {{ visitDate(movement.at, event.timezone, true) }}</time
                >
              </div>
              <p v-if="!model.movements.value.length" class="rh-note">
                No movements are recorded on this history page.
              </p>
              <nav class="rh-form-actions" aria-label="Ticket history pages">
                <button
                  class="rh-row-button"
                  :disabled="model.historyPage.value.current_page <= 1"
                  @click="
                    model.loadHistory({
                      page: model.historyPage.value.current_page - 1,
                      ticket_public_id: route.query.ticket,
                    })
                  "
                >
                  Previous</button
                ><span
                  >Page {{ model.historyPage.value.current_page }} of
                  {{ model.historyPage.value.last_page }}</span
                ><button
                  class="rh-row-button"
                  :disabled="
                    model.historyPage.value.current_page >= model.historyPage.value.last_page
                  "
                  @click="
                    model.loadHistory({
                      page: model.historyPage.value.current_page + 1,
                      ticket_public_id: route.query.ticket,
                    })
                  "
                >
                  Next
                </button>
              </nav></template
            >
            <div>
              <div
                v-for="(session, index) in preview ? sessions : []"
                :key="session.entry.at + index"
                class="rh-v26-visit"
              >
                <div class="rh-v26-visit-count">Visit {{ sessions.length - index }}</div>
                <div class="rh-v26-visit-time">
                  <span>Entered</span
                  ><strong>{{ visitDate(session.entry.at, event.timezone, true) }}</strong
                  ><small>{{ visitDate(session.entry.at, event.timezone) }}</small>
                </div>
                <div class="rh-v26-visit-time">
                  <span>Left</span
                  ><strong>{{
                    session.exit ? visitDate(session.exit.at, event.timezone, true) : 'Still inside'
                  }}</strong
                  ><small>{{
                    session.exit
                      ? visitDate(session.exit.at, event.timezone)
                      : 'No exit recorded yet'
                  }}</small>
                </div>
              </div>
              <div v-if="preview && !sessions.length" class="rh-v26-history-empty">
                This guest hasn’t checked in yet. Their entry and exit times will appear here when
                they do.
              </div>
            </div>
          </section>
          <section
            v-if="historyGuest && preview"
            class="rh-module rh-v26-activity-card"
            aria-labelledby="rh-v26-activity-heading"
          >
            <h2 id="rh-v26-activity-heading">Recent updates</h2>
            <ul class="rh-v25-updates-list">
              <li v-for="(item, index) in historyUpdates(historyGuest)" :key="index">
                <span class="rh-v25-update-dot" aria-hidden="true" /><span
                  ><strong>{{ item.label }}</strong
                  ><small>{{ item.time }}</small></span
                >
              </li>
            </ul>
          </section></template
        >
        <p v-else class="rh-note">Go back to Attendees and choose a guest.</p>
      </div>
    </section>

    <div
      v-if="page === 'purchase' && sticky && selectedOrder"
      id="rh-v21-sticky"
      class="rh-v21-sticky rh-v22-sticky"
      :style="stickyStyle"
    >
      <div class="main-inner rh-v21-sticky-inner">
        <a
          class="rh-sticky-attendees-back"
          :href="destination('attendees')"
          @click.prevent="navigate('attendees')"
          ><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg
          >{{ context === 'door' ? 'Door check-in' : 'Attendees' }}</a
        >
        <div class="rh-v21-sticky-title">
          <div>
            <small>Viewing guest</small
            ><strong id="rh-v21-sticky-name">{{
              guests.find((g) => g.id === selectedGuest)?.name || selectedOrder.buyer
            }}</strong>
          </div>
        </div>
        <nav
          id="rh-v21-sticky-guests"
          class="rh-v21-sticky-guests"
          aria-label="Switch guests from this purchase"
        >
          <button
            v-for="guest in purchaseGuests"
            :key="guest.id"
            type="button"
            class="rh-v25-person"
            :class="{
              'is-selected': selectedGuest === guest.id,
              'is-checked': model.inside(guest.id),
            }"
            :aria-current="selectedGuest === guest.id ? 'true' : undefined"
            :aria-label="`Go to ${guest.name}`"
            :title="`${guest.name} — ${model.guestState(guest.id)}`"
            :aria-describedby="guestTooltip?.id === guest.id ? 'rh-guest-name-tooltip' : undefined"
            @click="jumpToGuest(guest.id)"
            @mouseenter="showTooltip($event, guest)"
            @focus="showTooltip($event, guest)"
            @mouseleave="guestTooltip = null"
            @blur="guestTooltip = null"
            @keydown.esc="guestTooltip = null"
          >
            <span class="rh-v20-person-icon"
              ><svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="7.5" r="3.15" />
                <path d="M5 20v-1.2c0-3.7 2.9-6 7-6s7 2.3 7 6V20z" /></svg
            ></span>
          </button>
        </nav>
      </div>
    </div>
    <Teleport v-if="guestTooltip" to=".event-workspace"
      ><div
        id="rh-guest-name-tooltip"
        role="tooltip"
        :style="{ left: guestTooltip.left + 'px', top: guestTooltip.top + 'px' }"
      >
        <strong>{{ guestTooltip.name }}</strong
        ><span>{{ guestTooltip.status }}</span>
      </div></Teleport
    >

    <dialog
      ref="editDialog"
      id="rh-v25-edit-dialog"
      class="rh-v25-dialog"
      aria-labelledby="rh-v25-edit-title"
      @click="closeFromBackdrop"
    >
      <form id="rh-v25-edit-form" @submit.prevent="saveGuest">
        <div class="rh-v25-dialog-top">
          <h2 id="rh-v25-edit-title">Update guest details</h2>
          <button
            type="button"
            class="rh-v25-dialog-close"
            aria-label="Close dialog"
            @click="editDialog.close()"
          >
            ×
          </button>
        </div>
        <p>Ticket {{ editing?.id }}</p>
        <label class="rh-field"
          ><span>Full name</span
          ><input
            v-model="edit.name"
            :disabled="
              !preview &&
              editing?.schema?.length > 0 &&
              !editing.schema.some((field) => field.id === 'name')
            "
            name="name"
            autocomplete="name"
            :required="
              preview || editing?.schema?.some((field) => field.id === 'name' && field.required)
            "
            maxlength="200" /></label
        ><label class="rh-field"
          ><span>Email for this ticket</span
          ><input
            v-model="edit.email"
            :disabled="
              !preview &&
              editing?.schema?.length > 0 &&
              !editing.schema.some((field) => field.id === 'email')
            "
            name="email"
            type="email"
            autocomplete="email"
            :required="
              preview || editing?.schema?.some((field) => field.id === 'email' && field.required)
            "
            maxlength="255"
        /></label>
        <div class="rh-v26-edit-readonly">
          <div>
            <span>Ticket type</span><strong>{{ editing?.type }}</strong>
          </div>
          <div>
            <span>Ticket code</span><strong>{{ editing?.id }}</strong>
          </div>
        </div>
        <p class="rh-v26-edit-note">
          {{
            free
              ? 'This updates the guest’s name and email. The registration contact, ticket type and code stay the same.'
              : 'This updates the guest’s name and email. The buyer’s account, receipt and ticket details stay the same.'
          }}
        </p>
        <p v-if="editError" class="rh-error" role="alert">{{ editError }}</p>
        <div class="rh-v25-edit-controls">
          <button
            class="rh-button rh-button-dark"
            :disabled="!preview && model.busy.value"
            type="submit"
          >
            Save changes</button
          ><button class="rh-button rh-button-outline" type="button" @click="editDialog.close()">
            Cancel
          </button>
        </div>
        <template v-if="!preview"
          ><label
            v-for="field in (editing?.schema || []).filter(
              (field) => !['name', 'email'].includes(field.id),
            )"
            :key="field.id"
            class="rh-field"
            ><span>{{ field.label }}</span
            ><input
              v-model="edit.answers[field.id]"
              :required="field.required"
              maxlength="2000" /></label
        ></template>
        <p>
          {{
            preview
              ? 'Changes are saved in this browser.'
              : 'Changes are saved to this event. Historical purchase details stay the same.'
          }}
        </p>
      </form>
    </dialog>
    <dialog
      ref="alertDialog"
      id="rh-v22-alert-dialog"
      class="rh-v22-dialog"
      aria-labelledby="rh-v22-alert-heading"
      @click="closeFromBackdrop"
    >
      <form id="rh-v22-alert-form" @submit.prevent="saveArrivalAlert">
        <div class="rh-v22-dialog-heading">
          <h2 id="rh-v22-alert-heading">Notify me when this guest arrives</h2>
          <button
            class="rh-v22-dialog-x"
            aria-label="Close"
            type="button"
            @click="alertDialog.close()"
          >
            ×
          </button>
        </div>
        <p>Guest: {{ alertGuest?.name }}</p>
        <label class="rh-field"
          ><span>Your email</span
          ><input
            id="rh-v22-alert-email"
            v-model="alert.self"
            autocomplete="email"
            placeholder="you@yourbusiness.com"
            required
            type="email" /></label
        ><label class="rh-field"
          ><span>Teammate’s email <small>(optional)</small></span
          ><input
            id="rh-v26-alert-teammate"
            v-model="alert.teammate"
            autocomplete="email"
            placeholder="teammate@yourbusiness.com"
            type="email"
        /></label>
        <p class="rh-v22-small-note">
          Your alert preference will be saved in this browser. Email notifications aren’t connected
          yet.
        </p>
        <p v-if="alertError" class="rh-error" role="alert">{{ alertError }}</p>
        <div class="rh-v22-dialog-buttons">
          <button class="rh-button rh-button-dark" type="submit">Save arrival alert</button
          ><button class="rh-button rh-button-outline" type="button" @click="alertDialog.close()">
            Cancel
          </button>
        </div>
      </form>
    </dialog>
    <Teleport v-if="printing && selectedOrder" to=".event-workspace"
      ><div id="rh-v24-print-sheet" class="workspace-attendee-print">
        <div class="rh-v24-print-brand">
          <span class="rh-wordmark"
            ><span class="rh-wordmark-name">Rush Hour</span
            ><span class="rh-wordmark-tickets">Tickets</span></span
          ><span>{{ free ? 'Registration summary' : 'Purchase receipt' }}</span>
        </div>
        <h1>{{ free ? 'Registration summary' : 'Purchase items' }}</h1>
        <p v-if="!preview">
          Status: {{ selectedOrder.payment }}. This printout contains the purchase items loaded on
          this page.
        </p>
        <div class="rh-v24-print-summary">
          <div>
            <span>{{ free ? 'Registered by' : 'Paid by' }}</span
            ><strong>{{ selectedOrder.buyer }}</strong
            ><small>{{ selectedOrder.email }}</small>
          </div>
          <div>
            <span>{{ free ? 'Registration number' : 'Order number' }}</span
            ><strong>{{ selectedOrder.id }}</strong
            ><small>{{ free ? 'Registered' : 'Purchased' }} {{ selectedOrder.purchased }}</small>
          </div>
        </div>
        <h2>
          {{
            free
              ? 'Guests included'
              : `Tickets for ${purchaseGuests.length} ${purchaseGuests.length === 1 ? 'person' : 'people'}`
          }}
        </h2>
        <table class="rh-v24-print-table">
          <thead>
            <tr>
              <th>#</th>
              <th>{{ preview ? 'Guest' : 'Ticket product' }}</th>
              <th>{{ preview ? 'Type' : 'Quantity' }}</th>
              <th>{{ preview ? 'Ticket code' : 'Admissions per unit' }}</th>
              <th v-if="!free || context !== 'door'">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(guest, index) in preview ? purchaseGuests : []" :key="guest.id">
              <td>{{ index + 1 }}</td>
              <td>
                <strong>{{ guest.name }}</strong
                ><br /><small>{{ guest.email }}</small>
              </td>
              <td>{{ guest.type }}</td>
              <td>{{ guest.id }}</td>
              <td v-if="!free || context !== 'door'" class="rh-v24-print-money">
                {{
                  free
                    ? 'Free'
                    : money(
                        preview
                          ? samplePriceMinor[guest.type] || 0
                          : selectedOrder.lines.find((line) => line.id === guest.orderItemId)
                              ?.unit_price_minor || 0,
                      )
                }}
              </td>
            </tr>
            <tr v-for="(line, index) in preview ? [] : selectedOrder.lines" :key="line.id">
              <td>{{ index + 1 }}</td>
              <td>{{ line.ticket_name }}</td>
              <td>{{ line.quantity }}</td>
              <td>{{ line.people_per_unit }}</td>
              <td class="rh-v24-print-money">{{ money(line.line_total_minor) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="rh-v24-print-totals">
          <span>{{ purchaseGuests.length }} {{ free ? 'guests' : 'tickets' }}</span>
          <div v-if="!free || context !== 'door'">
            <small>{{ free ? 'Amount paid' : 'Total' }}</small
            ><strong>{{ free ? 'Free' : money(model.orderTotal(selectedOrder)) }}</strong>
          </div>
        </div>
      </div></Teleport
    >
  </div>
</template>
