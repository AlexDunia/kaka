<script setup>
import { computed } from 'vue'
import WorkspaceCopyButton from './WorkspaceCopyButton.vue'
import { visitDate } from './attendeesModel'
const props = defineProps({
  guest: Object,
  order: Object,
  model: Object,
  free: Boolean,
  timezone: String,
  historyHref: String,
})
defineEmits(['edit', 'resend', 'alert', 'history', 'notify'])
const state = computed(() => props.model.guestState(props.guest.id))
const visits = computed(() => props.model.visits(props.guest.id))
const lastEntry = computed(() => [...visits.value].reverse().find((v) => v.kind === 'in'))
const lastExit = computed(() => [...visits.value].reverse().find((v) => v.kind === 'out'))
const fields = computed(() => [
  ['Full name', props.guest.name],
  ['Email address', props.guest.email],
  ['Ticket type', props.guest.type],
  ['Ticket code', props.guest.id],
  ...(props.guest.id === props.order.ticketIds[0]
    ? []
    : [[props.free ? 'Registered by' : 'Bought by', props.order.buyer]]),
])
const alert = computed(() => props.model.alerts.value[props.guest.id])
const stamp = (visit) =>
  visit
    ? `${visitDate(visit.at, props.timezone)}, ${visitDate(visit.at, props.timezone, true)}`
    : ''
</script>
<template>
  <section
    class="rh-v25-guest-section"
    :id="`rh-v25-guest-${guest.id}`"
    :data-ticket-id="guest.id"
    data-v25-guest-section
    :aria-label="`Details for ${guest.name}`"
  >
    <article class="rh-module rh-v25-info-card">
      <div class="rh-v25-card-header">
        <h3>{{ guest.name }}’s details</h3>
      </div>
      <div class="rh-purchase-guest-content">
        <div class="rh-purchase-person-details">
          <div class="rh-v25-fields">
            <div v-for="[label, value] in fields" :key="label">
              <span>{{ label }}</span>
              <div v-if="['Email address', 'Ticket code'].includes(label)" class="rh28-email-line">
                <strong>{{ value }}</strong
                ><WorkspaceCopyButton
                  :value="value"
                  :label="`Copy ${guest.name}’s ${label.toLowerCase()}`"
                  @notify="$emit('notify', $event)"
                />
              </div>
              <strong v-else>{{ value }}</strong>
            </div>
          </div>
          <div class="rh-v25-actions">
            <button type="button" class="rh-v25-action" @click="$emit('edit', guest)">
              Update guest details</button
            ><button type="button" class="rh-v25-action" @click="$emit('resend', guest)">
              Resend ticket
            </button>
          </div>
        </div>
        <section class="rh-v25-arrival-card" aria-label="Guest arrival">
          <div class="rh-v25-card-header"><h3>Has this guest arrived?</h3></div>
          <div
            class="rh-v25-arrival-status"
            :class="{ 'is-inside': model.inside(guest.id), 'is-left': state === 'Has left' }"
            role="status"
          >
            <span
              class="rh-v23-signal"
              :class="{ 'is-pulsing': model.inside(guest.id) }"
              aria-hidden="true"
              ><i /></span
            ><strong>{{ state }}</strong>
          </div>
          <div class="rh-v25-arrival-facts">
            <div>
              <span>Last entered</span><strong>{{ stamp(lastEntry) || 'Not yet' }}</strong>
            </div>
            <div>
              <span>Last left</span><strong>{{ stamp(lastExit) || 'No exit recorded yet' }}</strong>
            </div>
          </div>
          <div class="rh-v25-actions rh-v25-arrival-actions">
            <button
              v-if="!model.everArrived(guest.id)"
              type="button"
              class="rh-v25-action rh-v25-alert-btn"
              @click="$emit('alert', guest)"
            >
              Notify me on arrival</button
            ><a class="rh-v25-action" :href="historyHref" @click.prevent="$emit('history', guest)"
              >See entry history</a
            >
          </div>
          <p v-if="alert && !model.everArrived(guest.id)" class="rh-v25-alert-saved">
            Arrival alert saved for
            {{ [alert.self, alert.teammate].filter(Boolean).join(' and ') }}. Email alerts aren’t
            connected yet.
          </p>
        </section>
      </div>
    </article>
  </section>
</template>
