<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { MinusIcon, PlusIcon, ArrowLeftIcon } from '@heroicons/vue/24/outline'
import EventPublicControls from '@/components/EventPublicControls.vue'
import { profileDate } from '@/utils/eventProfile'
const props = defineProps({
  profile: { type: Object, required: true },
  initialSelection: { type: Array, default: () => [] },
  initialTicket: { type: String, default: '' },
})
const emit = defineEmits(['close', 'checkout'])
const header = ref(null)
let headerObserver
const quantities = ref(
    Object.fromEntries(
      props.initialSelection.map((item) => [String(item.ticketId), Number(item.quantity)]),
    ),
  ),
  filter = ref('all'),
  reviewing = ref(false)
const money = (value) =>
  value === 0
    ? 'Free'
    : new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(value)
const visibleTickets = computed(() =>
  props.profile.tickets.filter((ticket) => filter.value === 'all' || ticket.unit === filter.value),
)
const selection = computed(() =>
  props.profile.tickets
    .filter((ticket) => quantities.value[ticket.key] > 0 && ticket.available)
    .map((ticket) => ({
      ...ticket,
      quantity: Math.min(ticket.max, Math.max(0, Math.floor(quantities.value[ticket.key]))),
    })),
)
const total = computed(() =>
  selection.value.reduce((sum, ticket) => sum + ticket.price * ticket.quantity, 0),
)
const count = computed(() => selection.value.reduce((sum, ticket) => sum + ticket.quantity, 0))
const hasTables = computed(() => props.profile.tickets.some((ticket) => ticket.unit === 'table'))
function change(ticket, delta) {
  if (!props.profile.canBuy || !ticket.available) return
  quantities.value[ticket.key] = Math.max(
    0,
    Math.min(ticket.max, (quantities.value[ticket.key] || 0) + delta),
  )
}
onMounted(() => {
  const measure = () =>
    document.documentElement.style.setProperty(
      '--rh28-header-height',
      `${header.value?.offsetHeight || 86}px`,
    )
  if (typeof document !== 'undefined') measure()
  if (typeof ResizeObserver !== 'undefined' && header.value) {
    headerObserver = new ResizeObserver(measure)
    headerObserver.observe(header.value)
  }
  const linked = props.profile.tickets.find(
    (ticket) =>
      ticket.key === props.initialTicket ||
      ticket.name.toLowerCase().replace(/\s+/g, '-') === props.initialTicket,
  )
  if (linked?.available && !quantities.value[linked.key]) quantities.value[linked.key] = 1
})
onBeforeUnmount(() => headerObserver?.disconnect())
watch(
  () => props.profile.tickets,
  (tickets) => {
    quantities.value = Object.fromEntries(
      tickets.map((ticket) => [
        ticket.key,
        ticket.available ? Math.min(ticket.max, quantities.value[ticket.key] || 0) : 0,
      ]),
    )
  },
  { immediate: true },
)
watch(
  () => props.profile.id,
  () => {
    quantities.value = {}
    filter.value = 'all'
    reviewing.value = false
  },
)

function review() {
  reviewing.value = true
  window.scrollTo({ top: 0, behavior: 'instant' })
}
function editSelection() {
  reviewing.value = false
  window.scrollTo({ top: 0, behavior: 'instant' })
}
</script>
<template>
  <section
    class="event-profile rh27-ticket-page ep-ticket-page"
    data-route="event-tickets"
    aria-labelledby="ep-picker-heading"
  >
    <div class="ep-picker-shell rh26-picker-shell">
      <header ref="header" class="ep-picker-top rh27-simple-top">
        <button type="button" class="rh27-back" @click="emit('close')">
          <ArrowLeftIcon /> Back to event
        </button>
        <div class="rh28-ticket-identity">
          <strong>{{ profile.title }}</strong
          ><span
            >{{
              profileDate(profile.date, profile.timezone, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })
            }}<template v-if="profile.venue"> · {{ profile.venue }}</template></span
          >
        </div>
        <EventPublicControls />
      </header>
      <div v-if="!reviewing" class="rh27-intro"><h1 id="ep-picker-heading">Your selection</h1></div>
      <div v-if="!reviewing" class="ep-picker-columns rh26-picker-columns">
        <section class="rh26-picker-list" aria-label="Available tickets">
          <div
            class="ep-ticket-filters rh26-picker-filters"
            role="group"
            aria-label="Filter ticket types"
          >
            <button
              v-for="option in [
                { key: 'all', label: 'All tickets' },
                ...(hasTables ? [{ key: 'table', label: 'Tables' }] : []),
              ]"
              :key="option.key"
              type="button"
              :class="{ active: filter === option.key }"
              :aria-pressed="filter === option.key"
              @click="filter = option.key"
            >
              {{ option.label }}
            </button>
          </div>
          <div class="ep-ticket-list rh26-picker-ticket-list">
            <article
              v-for="ticket in visibleTickets"
              :key="ticket.key"
              class="ep-ticket-option rh24-ticket-option"
              :class="{
                'is-unavailable': !ticket.available,
                'is-selected': quantities[ticket.key] > 0,
              }"
            >
              <div class="ep-ticket-copy">
                <strong>{{ ticket.name }}</strong
                ><small
                  >{{
                    ticket.status ||
                    (ticket.remaining == null
                      ? 'Tickets available'
                      : `${ticket.remaining} ${ticket.unit === 'table' ? 'tables' : 'spots'} available`)
                  }}<template v-if="ticket.unit === 'table'">
                    · {{ ticket.people }} guests per table</template
                  ></small
                ><b class="rh26-ticket-unit-price">{{ money(ticket.price) }}</b>
              </div>
              <div
                class="ep-quantity rh24-qty"
                :aria-label="`${ticket.name} quantity`"
                role="group"
              >
                <button
                  type="button"
                  :aria-label="`Remove one ${ticket.name}`"
                  :disabled="!quantities[ticket.key] || !ticket.available || !profile.canBuy"
                  @click="change(ticket, -1)"
                >
                  <MinusIcon /></button
                ><output :aria-label="`${ticket.name} selected`">{{
                  quantities[ticket.key] || 0
                }}</output
                ><button
                  type="button"
                  :aria-label="`Add one ${ticket.name}`"
                  :disabled="
                    !ticket.available ||
                    !profile.canBuy ||
                    (quantities[ticket.key] || 0) >= ticket.max
                  "
                  @click="change(ticket, 1)"
                >
                  <PlusIcon />
                </button>
              </div>
            </article>
            <p v-if="!visibleTickets.length" class="rh26-empty-filter">
              No ticket options in this category.
            </p>
          </div>
        </section>
        <aside class="ep-order-summary rh26-picker-summary" aria-label="Order summary">
          <div class="rh26-order-heading">
            <h3>Order summary</h3>
            <span>{{ count }} selected</span>
          </div>
          <div class="rh26-cart-lines">
            <p v-if="!count">No tickets selected yet.</p>
            <div v-for="ticket in selection" :key="ticket.key" class="rh26-cart-line">
              <span>{{ ticket.quantity }} × {{ ticket.name }}</span
              ><strong>{{ money(ticket.price * ticket.quantity) }}</strong>
            </div>
          </div>
          <div class="rh24-subtotal rh26-picker-total">
            <span>Subtotal</span><strong>{{ total === 0 ? '₦0' : money(total) }}</strong>
          </div>
          <button
            type="button"
            class="rh24-cta"
            :disabled="!count || !profile.canBuy"
            @click="review"
          >
            Continue <span aria-hidden="true">→</span>
          </button>
        </aside>
      </div>
      <section v-else class="ep-review" aria-label="Review selected tickets">
        <h1 id="ep-picker-heading">Review your tickets</h1>
        <p>Check your tickets before continuing.</p>
        <div class="ep-review-receipt">
          <div v-for="ticket in selection" :key="ticket.key" class="rh27-review-row">
            <span>{{ ticket.quantity }} × {{ ticket.name }}</span
            ><strong>{{ money(ticket.price * ticket.quantity) }}</strong>
          </div>
          <div class="rh27-review-row rh27-review-total">
            <span>Total</span><strong>{{ money(total) }}</strong>
          </div>
        </div>
        <div class="ep-review-actions">
          <button type="button" class="ep-secondary" @click="editSelection">
            Back to ticket choices</button
          ><button
            type="button"
            class="ep-primary"
            :disabled="!count || !profile.canBuy"
            @click="emit('checkout', selection)"
          >
            Continue to checkout
          </button>
        </div>
      </section>
    </div>
  </section>
</template>
