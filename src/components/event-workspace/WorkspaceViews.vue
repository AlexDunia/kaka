<script setup>
import { pngIconUrl } from '@/constants/pngIcons'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EventEditorConflict from '@/components/EventEditorConflict.vue'
import { editorErrorMessages } from '@/utils/eventEditor'
import { patchEvent, getEventForEditing } from '@/services/createEventService'
import WorkspaceDoorCheckin from './WorkspaceDoorCheckin.vue'
import WorkspaceEventLifecycle from './WorkspaceEventLifecycle.vue'
import { DASHBOARD_PREVIEW as preview } from '@/services/dashboardPreview'
import WorkspacePromote from './WorkspacePromote.vue'
import WorkspaceDiscountCodes from './WorkspaceDiscountCodes.vue'
import { formatMoneyMinor, formatNumber as number } from '@/utils/dashboardFormat'
import WorkspaceAttendees from './WorkspaceAttendees.vue'
import { useWorkspacePrivacy } from '@/composables/useWorkspacePrivacy'

const props = defineProps({
  page: String,
  overview: { type: Object, required: true },
  eventId: [Number, String],
})
const emit = defineEmits(['navigate', 'notify', 'edit', 'public', 'refresh'])
const router = useRouter()
const route = useRoute()
const event = computed(() => props.overview.event || {})
const namespace = () => `rushhour:event-workspace:${props.eventId}:`
function read(key, fallback) {
  if (!preview) return fallback
  try {
    return JSON.parse(localStorage.getItem(namespace() + key)) ?? fallback
  } catch {
    return fallback
  }
}
function save(key, value) {
  try {
    localStorage.setItem(namespace() + key, JSON.stringify(value))
    return true
  } catch {
    notify('We couldn’t save this in your browser. Check your storage settings and try again.')
    return false
  }
}
const notify = (text) => emit('notify', text)
const { amountsHidden } = useWorkspacePrivacy()
const money = (value) =>
  amountsHidden.value
    ? '••••••'
    : formatMoneyMinor(value, props.overview.revenue?.currency || 'NGN')
function tabKeys(e) {
  if (
    e.target.getAttribute('role') !== 'tab' ||
    !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)
  )
    return
  const tabs = [...e.target.closest('[role="tablist"]').querySelectorAll('[role="tab"]')].filter(
    (el) => !el.hidden,
  )
  const index = tabs.indexOf(e.target)
  const next =
    e.key === 'Home'
      ? 0
      : e.key === 'End'
        ? tabs.length - 1
        : (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
  e.preventDefault()
  tabs[next]?.click()
  tabs[next]?.focus()
}
const messageDate = (() => {
  const date = new Date(event.value.starts_at)
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'long',
        timeZone: event.value.timezone || 'Africa/Lagos',
      }).format(date)
    : ''
})()
const message = ref({
  audience: 'All ticket holders',
  subject: `Your ${event.value.title} event details`,
  body: `Hi there!\n\nWe’re looking forward to seeing you at ${event.value.title}${messageDate ? ` on ${messageDate}` : ''}.\n\nVenue: ${event.value.venue || 'We’ll confirm the venue soon'}.\n\nPlease keep your ticket ready for check-in.\n\nSee you there!\nRush Hour Tickets`,
})
const drafts = ref(read('drafts', []))
const codes = ref(
  read(
    'codes',
    preview
      ? [
          {
            name: 'Campus Store',
            code: 'SUNSET10',
            type: 'percent',
            value: 10,
            limit: 100,
            used: 38,
            active: true,
            eligible: ['all'],
          },
          {
            name: 'Friends offer',
            code: 'FRIENDS20',
            type: 'percent',
            value: 20,
            limit: 50,
            used: 16,
            active: false,
            eligible: ['all'],
          },
          {
            name: 'VIP offer',
            code: 'VIPNIGHT',
            type: 'fixed',
            value: 2000,
            limit: 20,
            used: 8,
            active: true,
            eligible: ['VIP'],
          },
        ]
      : [],
  ),
)
function codeStatus(c) {
  const now = new Date(),
    zone = event.value.timezone || 'Africa/Lagos'
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: zone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  if (!c.active) return 'paused'
  if (c.start && c.start > today) return 'scheduled'
  if (c.end && c.end < today) return 'expired'
  if (c.used >= c.limit) return 'used-up'
  return 'available'
}
function persistCodes(next) {
  if (!preview) {
    unavailable()
    return false
  }
  if (!save('codes', next)) return false
  codes.value = next
  return true
}
function unavailable() {
  notify('This action isn’t connected yet. Your changes haven’t been sent.')
}
const settingsTab = ref('details'),
  bankDialog = ref(null)
const editableForm = ref(null)
const ticketOverrides = ref(read('ticket-settings', {}))
const settingsTickets = computed(() =>
  preview
    ? (props.overview.ticket_types || []).map((ticket) => ({
        ...ticket,
        ...ticketOverrides.value[ticket.id],
      }))
    : (editableForm.value?.tickets || []).map((ticket) => ({
        ...ticket,
        price_minor: Math.round(Number(ticket.price) * 100),
        configured_capacity_units: ticket.inventory.configured_capacity_units,
        effective_capacity_units: ticket.inventory.configured_capacity_units,
        ...ticket.inventory,
      })),
)
const conflict = ref(false),
  conflictRecord = ref(null),
  conflictLoading = ref(false),
  conflictError = ref('')
async function loadConflictRecord() {
  conflictLoading.value = true
  conflictError.value = ''
  try {
    conflictRecord.value = (await getEventForEditing(props.eventId)).data
  } catch {
    conflictError.value = 'We could not load the saved event. Your edits are still here.'
  } finally {
    conflictLoading.value = false
  }
}
async function handleConflict(error) {
  if ([409, 428].includes(error.response?.status)) {
    conflict.value = true
    await loadConflictRecord()
  }
}
async function reloadConflictedEvent() {
  await loadConflictRecord()
  if (!conflictRecord.value || conflictError.value) return
  applyEditorRecord(conflictRecord.value)
  editingTicket.value = null
  conflict.value = false
  ticketFeedback.value = ''
}
const editingTicket = ref(null),
  ticketEditor = ref(null),
  ticketSaving = ref(false),
  ticketFeedback = ref('')
const ticketForm = reactive({ price: 0, capacity: 1, availability: 'on' })
async function editTicket(ticket) {
  editingTicket.value = ticket
  ticketFeedback.value = ''
  Object.assign(ticketForm, {
    price: Number(ticket.price_minor || 0) / 100,
    capacity: ticket.configured_capacity_units ?? ticket.effective_capacity_units,
    availability: ticket.visible === false ? 'off' : 'on',
  })
  await nextTick()
  ticketEditor.value?.scrollIntoView({ block: 'nearest' })
  ticketEditor.value?.querySelector('input')?.focus({ preventScroll: true })
}
async function saveTicket() {
  const ticket = editingTicket.value
  if (!ticket || ticketSaving.value || conflict.value) return
  const capacity = Number(ticketForm.capacity),
    price = Number(ticketForm.price)
  if (
    !Number.isFinite(price) ||
    price <= 0 ||
    price > 999999.99 ||
    !/^\d+(?:\.\d{1,2})?$/.test(String(ticketForm.price)) ||
    !Number.isSafeInteger(capacity) ||
    capacity > 1000000 ||
    capacity < Number(ticket.sold_units || 0) + Number(ticket.reserved_units || 0)
  ) {
    ticketFeedback.value =
      'Choose a valid price and keep enough tickets for existing purchases and reservations.'
    return
  }
  const patch = {
    price_minor: Math.round(price * 100),
    effective_capacity_units: capacity,
    available_units: capacity - Number(ticket.sold_units || 0) - Number(ticket.reserved_units || 0),
    visible: ticketForm.availability === 'on',
  }
  ticketSaving.value = true
  try {
    const next = { ...ticketOverrides.value, [ticket.id]: patch }
    if (preview) {
      if (!save('ticket-settings', next)) return
    } else {
      const source = editableForm.value
      if (!source?.tickets?.some((item) => String(item.id) === String(ticket.id))) {
        ticketFeedback.value =
          'We couldn’t load this ticket for editing. Reload the page and try again.'
        return
      }
      const result = await patchEvent(
        props.eventId,
        {
          tickets: [
            {
              id: ticket.id,
              price: String(ticketForm.price),
              units: capacity,
              visible: patch.visible,
            },
          ],
        },
        source.version,
      )
      editableForm.value = { ...result.data.form, version: result.data.version }
      emit('refresh')
    }
    if (preview) ticketOverrides.value = next
    editingTicket.value = null
    ticketFeedback.value = preview
      ? 'Ticket saved for this preview. Existing purchases keep their original price.'
      : 'Ticket saved. Existing purchases keep their original price.'
  } catch (error) {
    ticketFeedback.value = editorErrorMessages(error)
    await handleConflict(error)
  } finally {
    ticketSaving.value = false
  }
}
const checkout = reactive(
  read('rhs-checkout-form', {
    limit: 10,
    collect: 'buyer',
    phone: 'optional',
    message: '',
  }),
)
const access = reactive(
  read('rhs-access-form', {
    visibility: 'public',
    refund: 'review',
    transfer: 'yes',
  }),
)
watch(
  () => [props.page, route.query.tab],
  () => {
    if (props.page === 'settings')
      settingsTab.value = ['details', 'tickets', 'checkout', 'payments', 'access'].includes(
        route.query.tab,
      )
        ? route.query.tab
        : 'details'
  },
  { immediate: true },
)
const details = reactive({
  name: event.value.title || '',
  description:
    event.value.description ||
    (preview
      ? 'Experience an evening of music and good company in Lagos. Choose the ticket that works for you, then come ready for a memorable night.'
      : ''),
  date: event.value.starts_at?.slice(0, 10) || '',
  time: event.value.starts_at?.slice(11, 16) || '',
  venue: event.value.venue || '',
  email: '',
  phone: '',
})
const detailsSaving = ref(false),
  detailsReady = ref(preview)
function applyEditorRecord(record) {
  const source = { ...record.form, version: record.version }
  editableForm.value = source
  Object.assign(details, {
    name: source.title || '',
    description: source.description || '',
    venue: source.venue || '',
    date: source.startsAtLocal?.slice(0, 10) || '',
    time: source.startsAtLocal?.slice(11, 16) || '',
  })
  detailsReady.value = true
}
if (preview) Object.assign(details, read('details', {}))
if (!preview)
  getEventForEditing(props.eventId)
    .then((result) => applyEditorRecord(result.data))
    .catch((error) => {
      notify(editorErrorMessages(error))
    })
async function saveDetails() {
  if (detailsSaving.value || conflict.value) return
  if (!detailsReady.value) {
    notify('We couldn’t load your editable event details. Reload the page and try again.')
    return
  }
  detailsSaving.value = true
  try {
    if (preview) {
      if (save('details', details)) {
        notify('Event details saved for this preview.')
        emit('refresh')
      }
    } else {
      const source = editableForm.value
      const startsAtLocal = `${details.date}T${details.time}:00`
      const changes = {
        title: details.name,
        description: details.description,
        venue: details.venue,
      }
      if (startsAtLocal.slice(0, 16) !== source.startsAtLocal?.slice(0, 16))
        changes.startsAtLocal = startsAtLocal
      const result = await patchEvent(props.eventId, changes, source.version)
      applyEditorRecord(result.data)
      notify('Your event details are saved.')
      emit('refresh')
    }
  } catch (error) {
    notify(editorErrorMessages(error))
    await handleConflict(error)
  } finally {
    detailsSaving.value = false
  }
}
function navigatePath(path) {
  const [key, query] = path.replace('#/', '').split('?')
  const map = {
    overview: 'overview',
    attendees: 'attendees',
    purchase: 'purchase',
    promote: 'share',
    discounts: 'promo',
    messages: 'email',
    checkin: 'checkin',
    earnings: 'payout',
    settings: 'settings',
  }
  if (key === 'event-page') emit('navigate', 'event-page')
  else if (key === 'events') router.push({ name: 'dashboard', query: { view: 'events' } })
  else if (map[key])
    emit('navigate', {
      view: map[key],
      ...Object.fromEntries(new URLSearchParams(query)),
    })
}
function handleClick(e) {
  const b = e.target.closest('button,a')
  if (!b) return
  const id = b.id,
    data = b.dataset
  const actions = {
    'rh-preview-message': () => notify('Your message preview is ready beside the message form.'),
    'rhs-ticket-cancel': () => {
      editingTicket.value = null
    },
  }
  if (actions[id]) actions[id]()
  else if (
    (id || data.rhAction) &&
    !b.hasAttribute('@click') &&
    !b.closest('dialog') &&
    b.type !== 'submit' &&
    !data.settingsTab &&
    !data.promoTab
  ) {
    /* Vue-bound controls handle their own actions. */
  }
}
function handleSubmit(e) {
  const form = e.target
  if (!(form instanceof HTMLFormElement) || !form.reportValidity()) return
  const data = Object.fromEntries(new FormData(form))
  if (form.id === 'rh-message-form') {
    if (!preview) return unavailable()
    if (save('drafts', [{ ...message.value }, ...drafts.value])) {
      drafts.value.unshift({ ...message.value })
      notify('Draft saved in this browser. You can return to it here.')
    }
    return
  }
  if (form.id === 'rh-settings-form') {
    saveDetails()
    return
  }
  if (form.id === 'rhs-ticket-form') {
    saveTicket()
    return
  }
  if (form.id?.startsWith('rhs-')) {
    if (!preview) return unavailable()
    save(form.id, data)
    notify('Your settings are saved for this preview.')
    return
  }
}
</script>
<template>
  <div
    class="workspace-view-host"
    @click="handleClick"
    @submit.prevent="handleSubmit"
    @keydown="tabKeys"
  >
    <WorkspaceAttendees
      v-if="['attendees', 'purchase'].includes(page)"
      :page="page"
      :overview="overview"
      :event-id="eventId"
      @navigate="$emit('navigate', $event)"
      @notify="$emit('notify', $event)"
    />
    <WorkspacePromote
      v-if="page === 'promote'"
      :page="page"
      :event-id="eventId"
      :overview="overview"
      :codes="codes"
      :code-status="codeStatus"
      :persist-codes="persistCodes"
      @navigate="$emit('navigate', $event)"
      @notify="$emit('notify', $event)"
    />
    <WorkspaceDiscountCodes
      v-if="['discounts', 'discount-detail'].includes(page)"
      :overview="overview"
      :codes="codes"
      :code-status="codeStatus"
      :persist-codes="persistCodes"
      @navigate="$emit('navigate', $event)"
      @notify="$emit('notify', $event)"
    />
    <section
      aria-labelledby="rh-messages-title"
      class="rh-screen"
      data-route="messages"
      v-show="page === &#x27;messages&#x27;"
    >
      <div class="rh-page-heading">
        <div>
          <span class="rh-eyebrow">GROW SALES / MESSAGE ATTENDEES</span>
          <h1 id="rh-messages-title">Message attendees</h1>
          <p>
            Send ticket holders a reminder or event update.
          </p>
        </div>
      </div>
      <div class="rh-two-col rh-message-columns">
        <form class="rh-module rh-form-panel" id="rh-message-form">
          <div class="rh-module-title">
            <div>
              <h2>Write a message</h2>
              <p>Choose who to message, then write your update.</p>
            </div>
          </div>
          <label class="rh-field"
            ><span>Who is this for?</span
            ><select id="rh-message-audience" name="audience" v-model="message.audience">
              <option value="All ticket holders">All ticket holders</option>
              <option value="VIP ticket holders">VIP ticket holders</option>
              <option value="General admission ticket holders">
                General admission ticket holders
              </option>
              <option value="Early bird ticket holders">Early bird ticket holders</option>
            </select></label
          ><label class="rh-field"
            ><span>Subject</span
            ><input
              id="rh-message-subject"
              maxlength="100"
              name="subject"
              required=""
              v-model="message.subject" /></label
          ><label class="rh-field"
            ><span>Message</span
            ><textarea
              id="rh-message-body"
              name="body"
              required=""
              rows="8"
              v-model="message.body"
            ></textarea>
          </label>
          <div class="rh-form-actions">
            <button class="rh-button rh-button-outline" id="rh-preview-message" type="button">
              Show message preview</button
            ><button class="rh-button rh-button-dark" type="submit">Save draft</button>
          </div>
          <p class="rh-note">
            Saving a draft keeps it in this browser; it doesn’t send the message. Email and SMS
            delivery aren’t connected yet.
          </p>
        </form>
        <div class="rh-module rh-preview-pane">
          <div class="rh-module-title">
            <div>
              <h2>Message preview</h2>
              <p>Review your message before sending.</p>
            </div>
          </div>
          <div class="rh-email-preview">
            <div class="rh-email-meta">
              To: <strong id="rh-preview-recipient">{{ message.audience }}</strong>
            </div>
            <div class="rh-email-meta">
              Subject: <strong id="rh-preview-subject">{{ message.subject }}</strong>
            </div>
            <div class="rh-email-body" id="rh-preview-body">{{ message.body }}</div>
          </div>
          <div class="rh-drafts">
            <h3>Saved drafts</h3>
            <div class="rh-draft-list" id="rh-draft-list">
              <button
                v-for="(draft, index) in drafts"
                :key="index"
                class="workspace-draft"
                @click="message = { ...draft }"
              >
                <strong>{{ draft.subject }}</strong
                ><small>{{ draft.audience }}</small>
              </button>
              <p v-if="!drafts.length" class="rh-note">
                No saved drafts yet. Save a message to finish later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
    <EventEditorConflict
      v-if="conflict"
      class="rh-module rh-form-panel"
      :record="conflictRecord"
      :loading="conflictLoading"
      :error="conflictError"
      @retry="loadConflictRecord"
      @reload="reloadConflictedEvent"
    />
    <WorkspaceDoorCheckin
      v-if="page === 'checkin'"
      :overview="overview"
      :event-id="eventId"
      @navigate="$emit('navigate', $event)"
      @notify="$emit('notify', $event)"
    />
    <section
      aria-label="Settings"
      class="rh-screen"
      data-route="settings"
      v-show="page === &#x27;settings&#x27;"
    >
      <div aria-label="Settings sections" class="rh-tabbar rhs-tabs" role="tablist">
        <button
          class="rh-tab"
          data-settings-tab="details"
          role="tab"
          type="button"
          @click="settingsTab = &#x27;details&#x27;"
          :aria-selected="settingsTab === &#x27;details&#x27;"
        >
          <img class="rh-tab-icon" :src="pngIconUrl('document')" alt="" aria-hidden="true" width="20" height="20" />
          Event details</button
        ><button
          class="rh-tab"
          data-settings-tab="tickets"
          role="tab"
          type="button"
          @click="settingsTab = &#x27;tickets&#x27;"
          :aria-selected="settingsTab === &#x27;tickets&#x27;"
        >
          <img class="rh-tab-icon" :src="pngIconUrl('ticket')" alt="" aria-hidden="true" width="20" height="20" />
          Ticket types</button
        ><button
          class="rh-tab"
          data-settings-tab="checkout"
          role="tab"
          type="button"
          @click="settingsTab = &#x27;checkout&#x27;"
          :aria-selected="settingsTab === &#x27;checkout&#x27;"
        >
          <img class="rh-tab-icon" :src="pngIconUrl('cart')" alt="" aria-hidden="true" width="20" height="20" />
          Checkout</button
        ><button
          class="rh-tab"
          data-settings-tab="access"
          role="tab"
          type="button"
          @click="settingsTab = &#x27;access&#x27;"
          :aria-selected="settingsTab === &#x27;access&#x27;"
        >
          <img class="rh-tab-icon" :src="pngIconUrl('security')" alt="" aria-hidden="true" width="20" height="20" />
          Event access</button
        ><button
          class="rh-tab"
          data-settings-tab="payments"
          role="tab"
          type="button"
          @click="settingsTab = &#x27;payments&#x27;"
          :aria-selected="settingsTab === &#x27;payments&#x27;"
        >
          <img class="rh-tab-icon" :src="pngIconUrl('wallet')" alt="" aria-hidden="true" width="20" height="20" />
          Payouts
        </button>
      </div>
      <div
        class="rh-settings-pane"
        data-settings-pane="details"
        v-show="settingsTab === &#x27;details&#x27;"
      >
        <WorkspaceEventLifecycle
          v-if="!preview"
          :event-id="eventId"
          :timezone="editableForm?.timeZone || event.timezone"
          @changed="emit('refresh')"
        />
        <form class="rh-module rh-form-panel rhs-form" id="rh-settings-form">
          <div class="rh-module-title">
            <div>
              <h2>Tell people about your event</h2>
              <p>These are the details people see before they buy a ticket.</p>
            </div>
          </div>
          <div class="rh-form-grid">
            <label class="rh-field rh-span-2"
              ><span>Event name</span
              ><input maxlength="100" name="name" required="" v-model="details.name"
            /></label>
            <label class="rh-field rh-span-2"
              ><span>About your event</span
              ><textarea
                maxlength="20000"
                name="description"
                placeholder="What should guests expect?"
                rows="4"
                v-model="details.description"
              ></textarea>
            </label>
            <label class="rh-field"
              ><span>Event date</span
              ><input name="date" required="" type="date" v-model="details.date" /></label
            ><label class="rh-field"
              ><span
                >Start time ({{ editableForm?.timeZone || event.timezone || 'Africa/Lagos' }})</span
              ><input name="time" required="" type="time" v-model="details.time"
            /></label>
            <label class="rh-field rh-span-2"
              ><span>Venue / address</span
              ><input
                maxlength="255"
                name="venue"
                :required="editableForm?.format !== 'online'"
                v-model="details.venue"
            /></label>
          </div>
          <div class="rhs-divider"></div>
          <div class="rh-module-title">
            <div>
              <h2>How can guests reach you?</h2>
              <p v-if="!preview">Contact details are not available for editing yet.</p>
              <p>Add a contact for questions about your event.</p>
            </div>
          </div>
          <div class="rh-form-grid">
            <label class="rh-field"
              ><span>Email address (optional)</span
              ><input
                name="email"
                placeholder="you@example.com"
                type="email"
                v-model="details.email"
                :disabled="!preview" /></label
            ><label class="rh-field"
              ><span>Phone number (optional)</span
              ><input
                maxlength="25"
                name="phone"
                placeholder="0800 000 0000"
                type="tel"
                v-model="details.phone"
                :disabled="!preview"
            /></label>
          </div>
          <div class="rh-form-actions">
            <button
              class="rh-button rh-button-dark"
              type="submit"
              :disabled="detailsSaving || !detailsReady || conflict"
             :aria-busy="detailsSaving">
              Save changes</button
            ><span class="rhs-feedback" id="rhs-details-feedback" role="status"></span>
          </div>
        </form>
      </div>
      <div
        class="rh-settings-pane"
        data-settings-pane="tickets"
        v-show="settingsTab === &#x27;tickets&#x27;"
      >
        <div class="rh-module rhs-ticket-module">
          <div class="rh-module-title">
            <div>
              <h2>Choose how you sell your tickets</h2>
              <p>Change prices for future purchases or adjust how many tickets people can buy.</p>
            </div>
          </div>
          <div class="rh-table-scroll">
            <table class="rh-data-table">
              <thead>
                <tr>
                  <th>Ticket type</th>
                  <th>Price</th>
                  <th>Sold</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="rhs-ticket-rows">
                <tr v-for="ticket in settingsTickets" :key="ticket.id">
                  <td>
                    <strong>{{ ticket.name }}</strong>
                  </td>
                  <td>
                    {{ ticket.price_minor == null ? 'View in editor' : money(ticket.price_minor) }}
                  </td>
                  <td>
                    {{ ticket.sold_units }} sold &middot; {{ ticket.reserved_units || 0 }} reserved
                  </td>
                  <td>
                    {{ ticket.available_units }} available &middot;
                    {{ ticket.configured_capacity_units ?? ticket.effective_capacity_units }}
                    configured &middot;
                    {{ ticket.admission_capacity ?? 'Not available' }} admissions
                  </td>
                  <td>
                    <span
                      class="rhs-ticket-status"
                      :class="{ live: ticket.visible !== false && ticket.available_units > 0 }"
                      >{{
                        ticket.visible === false
                          ? 'Paused'
                          : ticket.available_units > 0
                            ? 'On sale'
                            : 'Sold out'
                      }}</span
                    >
                  </td>
                  <td>
                    <button
                      class="rh-button rh-button-outline rhs-edit"
                      type="button"
                      :disabled="conflict || ticketSaving"
                      @click="editTicket(ticket)"
                     :aria-busy="ticketSaving">
                      Edit
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="rh-module-foot">
            <span id="rhs-ticket-summary"
              >{{ number(overview.sales?.units_sold) }} tickets sold ·
              {{
                number(
                  settingsTickets.reduce(
                    (sum, ticket) => sum + Number(ticket.available_units || 0),
                    0,
                  ),
                )
              }}
              left</span
            ><span>Existing purchases keep their original price.</span>
          </div>
        </div>
        <form
          v-if="editingTicket"
          ref="ticketEditor"
          class="rh-module rh-form-panel rhs-form"
          id="rhs-ticket-form"
        >
          <div class="rh-module-title">
            <div>
              <h2 id="rhs-ticket-title">Edit {{ editingTicket.name }}</h2>
              <p>Changes apply to tickets you sell from now on.</p>
            </div>
          </div>
          <div class="rh-form-grid">
            <label class="rh-field"
              ><span>Price per ticket (₦)</span
              ><input
                v-model.number="ticketForm.price"
                min="0"
                name="price"
                max="999999.99"
                step="0.01"
                required=""
                type="number" /></label
            ><label class="rh-field"
              ><span>Total tickets</span
              ><input
                v-model.number="ticketForm.capacity"
                :min="
                  Math.max(
                    0,
                    Number(editingTicket.sold_units || 0) +
                      Number(editingTicket.reserved_units || 0),
                  )
                "
                name="capacity"
                max="1000000"
                required=""
                step="1"
                type="number" /></label
            ><label class="rh-field rh-span-2"
              ><span>Ticket availability</span
              ><select v-model="ticketForm.availability" name="availability">
                <option value="on">Available for sale</option>
                <option value="off">Pause sales</option>
              </select></label
            >
          </div>
          <div class="rh-form-actions">
            <button
              class="rh-button rh-button-dark"
              type="submit"
              :disabled="ticketSaving || conflict"
             :aria-busy="ticketSaving">
              {{ ticketSaving ? 'Saving ticket…' : 'Save ticket' }}</button
            ><button class="rh-button rh-button-outline" id="rhs-ticket-cancel" type="button">
              Cancel
            </button>
          </div>
        </form>
        <p class="rhs-feedback" id="rhs-ticket-feedback" role="status">{{ ticketFeedback }}</p>
      </div>
      <div
        class="rh-settings-pane"
        data-settings-pane="checkout"
        v-show="settingsTab === &#x27;checkout&#x27;"
      >
        <form class="rh-module rh-form-panel rhs-form" id="rhs-checkout-form">
          <div class="rh-module-title">
            <div>
              <h2>Make buying a ticket easy</h2>
              <p>
                Choose the information you need from buyers and how many tickets they can buy at
                once.
              </p>
            </div>
          </div>
          <div class="rh-form-grid">
            <label class="rh-field"
              ><span>Maximum tickets per purchase</span
              ><input
                max="100"
                min="1"
                name="limit"
                required=""
                step="1"
                type="number"
                v-model.number="checkout.limit" /></label
            ><label class="rh-field"
              ><span>Collect guest names and emails from</span
              ><select v-model="checkout.collect" name="collect">
                <option value="buyer">The buyer only</option>
                <option value="each">Every guest</option>
              </select></label
            ><label class="rh-field"
              ><span>Ask for a phone number?</span
              ><select v-model="checkout.phone" name="phone">
                <option value="optional">Optional</option>
                <option value="required">Required</option>
                <option value="no">No</option>
              </select></label
            ><label class="rh-field rh-span-2"
              ><span>Message to include with tickets (optional)</span
              ><textarea
                maxlength="1000"
                name="message"
                v-model="checkout.message"
                placeholder="e.g. Bring your ticket and arrive early."
                rows="4"
              ></textarea>
            </label>
          </div>
          <div class="rh-form-actions">
            <button class="rh-button rh-button-dark" type="submit">Save changes</button
            ><span class="rhs-feedback" id="rhs-checkout-feedback" role="status"></span>
          </div>
          <p class="rhs-local-note">
            Settings are saved for this preview. Tickets can’t be sent until payments are connected.
          </p>
        </form>
      </div>
      <div
        class="rh-settings-pane"
        data-settings-pane="access"
        v-show="settingsTab === &#x27;access&#x27;"
      >
        <form class="rh-module rh-form-panel rhs-form" id="rhs-access-form">
          <div class="rh-module-title">
            <div>
              <h2>Choose who can find your event</h2>
              <p>Decide how people discover your event and what happens when their plans change.</p>
            </div>
          </div>
          <div class="rh-form-grid">
            <label class="rh-field rh-span-2"
              ><span>Who can find your event?</span
              ><select v-model="access.visibility" name="visibility">
                <option value="public">Everyone – public event</option>
                <option value="private">Only people with your event link</option>
              </select></label
            ><label class="rh-field"
              ><span>Refunds if a guest changes their plans</span
              ><select v-model="access.refund" name="refund">
                <option value="review">Review requests individually</option>
                <option value="7">Allow requests up to 7 days before</option>
                <option value="none">No voluntary refunds</option>
              </select></label
            ><label class="rh-field"
              ><span>Can guests transfer their tickets?</span
              ><select v-model="access.transfer" name="transfer">
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select></label
            >
          </div>
          <div class="rh-form-actions">
            <button class="rh-button rh-button-dark" type="submit">Save changes</button
            ><span class="rhs-feedback" id="rhs-access-feedback" role="status"></span>
          </div>
          <p class="rhs-local-note">
            Saved for this preview. Event access, refunds, and transfers aren’t connected yet. Refund rules still apply.
          </p>
        </form>
      </div>
      <div
        class="rh-settings-pane"
        data-settings-pane="payments"
        v-show="settingsTab === &#x27;payments&#x27;"
      >
        <div class="rh-module rh-form-panel rhs-form">
          <div class="rh-module-title">
            <div>
              <h2>Where should we send your money?</h2>
              <p>Add or change your bank account and see payments to your bank in Payouts.</p>
            </div>
          </div>
          <div class="rh-form-actions">
            <a
              class="rh-button rh-button-dark"
              href="#"
              @click.prevent="navigatePath(&#x27;#/earnings?tab=payouts&#x27;)"
              >Manage payouts</a
            >
          </div>
        </div>
      </div>
    </section>
    <dialog ref="bankDialog" class="workspace-dialog" aria-labelledby="workspace-bank-title">
      <h2 id="workspace-bank-title">Payout account setup</h2>
      <p>
        Bank checks and payouts aren’t available yet. Your payout details will appear here when ready.
      </p>
      <button class="rh-button rh-button-outline" @click="bankDialog.close()">Close</button>
    </dialog>
  </div>
</template>
