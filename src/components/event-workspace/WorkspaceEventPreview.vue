<script setup>
import { computed, reactive, ref } from 'vue'
import { DASHBOARD_PREVIEW } from '@/services/dashboardPreview'
import { formatMoneyMinor } from '@/utils/dashboardFormat'
import { overviewEventDate } from './overviewModel'
import { useWorkspacePrivacy } from '@/composables/useWorkspacePrivacy'
const props = defineProps({ overview: { type: Object, required: true } })
defineEmits(['navigate', 'public'])
const event = computed(() => props.overview.event || {})
const quantities = reactive({}),
  review = ref(false)
const tiers = computed(() =>
  (props.overview.ticket_types || []).filter((tier) => tier.visible !== false),
)
const total = computed(() =>
  tiers.value.reduce((sum, t) => sum + (quantities[t.id] || 0) * Number(t.price_minor || 0), 0),
)
const count = computed(() => Object.values(quantities).reduce((sum, n) => sum + n, 0))
const { amountsHidden } = useWorkspacePrivacy()
const money = (value) =>
  amountsHidden.value
    ? '••••••'
    : formatMoneyMinor(value, props.overview.revenue?.currency || 'NGN')
const limit = (t) =>
  Math.max(0, Math.min(Number(t.available_units) || 0, Number(t.max_per_person) || 10))
function change(t, delta) {
  quantities[t.id] = Math.min(limit(t), Math.max(0, (quantities[t.id] || 0) + delta))
  review.value = false
}
</script>
<template>
  <section data-route="event-page" class="rh-screen" aria-labelledby="rh-public-title">
    <div class="rh-page-heading">
      <div>
        <span class="rh-eyebrow">Public event page / Preview</span>
        <h1 id="rh-public-heading">What ticket buyers will see</h1>
        <p>Preview the event page your buyers would see. Checkout isn’t connected yet.</p>
      </div>
      <button class="rh-button rh-button-outline" @click="$emit('navigate', 'overview')">
        ← Back to overview
      </button>
    </div>
    <div
      class="rh-public-cover"
      :style="
        event.cover_image
          ? {
              '--event-cover': `url(${JSON.stringify(event.cover_image)})`,
            }
          : {}
      "
    >
      <div class="rh-public-cover-inner">
        <span class="rh-status-badge rh-light-badge">{{
          event.phase === 'draft'
            ? 'Draft'
            : event.phase === 'ended'
              ? 'Event ended'
              : event.phase === 'live'
                ? 'Live now'
                : 'Upcoming'
        }}</span>
        <h2 id="rh-public-title">{{ event.title }}</h2>
        <p>{{ overviewEventDate(event) }}</p>
        <p>{{ event.venue || 'Venue to be confirmed' }}</p>
      </div>
    </div>
    <div class="rh-two-col rh-public-columns">
      <div class="rh-module">
        <div class="rh-module-title">
          <div>
            <h2>About this event</h2>
            <p>
              {{
                DASHBOARD_PREVIEW
                  ? 'An evening of great music and unforgettable moments.'
                  : 'See what your event has in store.'
              }}
            </p>
          </div>
        </div>
        <p v-if="event.description || DASHBOARD_PREVIEW" class="rh-about-text">
          {{
            event.description ||
            'Experience an evening of music and good company in Lagos. Choose the ticket that works for you, then come ready for a memorable night.'
          }}
        </p>
        <div class="rh-detail-list">
          <div>
            <span>When</span><strong>{{ overviewEventDate(event) }}</strong>
          </div>
          <div>
            <span>Where</span><strong>{{ event.venue || 'Venue to be confirmed' }}</strong>
          </div>
          <div v-if="event.contact_email || event.contact_phone">
            <span>Contact the organizer</span
            ><strong>{{
              [event.contact_email, event.contact_phone].filter(Boolean).join(' · ')
            }}</strong>
          </div>
          <div>
            <span>Organised with</span
            ><span class="rh-wordmark"
              ><span class="rh-wordmark-name">Rush Hour</span
              ><span class="rh-wordmark-tickets">Tickets</span></span
            >
          </div>
        </div>
      </div>
      <div class="rh-module">
        <div class="rh-module-title">
          <div>
            <h2>Choose your tickets</h2>
            <p>Select a ticket type and how many tickets you’d like.</p>
          </div>
        </div>
        <div class="rh-ticket-chooser">
          <div v-for="tier in tiers" :key="tier.id" class="rh-ticket-option">
            <div>
              <strong>{{ tier.name }}</strong
              ><span
                >{{ tier.available_units }} remaining<span v-if="tier.price_minor != null">
                  · {{ money(tier.price_minor) }} each</span
                ></span
              >
            </div>
            <div class="rh-stepper">
              <button
                :aria-label="`Remove ${tier.name} ticket`"
                :disabled="!quantities[tier.id]"
                @click="change(tier, -1)"
              >
                −</button
              ><output :aria-label="`${tier.name} quantity`">{{ quantities[tier.id] || 0 }}</output
              ><button
                :aria-label="`Add ${tier.name} ticket`"
                :disabled="(quantities[tier.id] || 0) >= limit(tier)"
                @click="change(tier, 1)"
              >
                +
              </button>
            </div>
          </div>
          <p v-if="!tiers.length" class="rh-note">
            Your ticket options will appear here when they’re available.
          </p>
        </div>
        <div class="rh-checkout-total">
          <span>Subtotal</span><strong>{{ money(total) }}</strong>
        </div>
        <button
          v-if="DASHBOARD_PREVIEW"
          class="rh-button rh-button-dark rh-fullwidth"
          :disabled="!count"
          @click="review = true"
        >
          Continue with tickets</button
        ><button v-else class="rh-button rh-button-dark rh-fullwidth" @click="$emit('public')">
          Open public event page
        </button>
        <p v-if="DASHBOARD_PREVIEW" class="rh-note">
          Checkout isn’t connected yet, so no payment will be taken and no tickets will be issued.
        </p>
        <p v-if="review" class="rh-note" role="status">
          You selected {{ count }} {{ count === 1 ? 'ticket' : 'tickets' }} for {{ money(total) }}.
          Your preview selection is ready.
        </p>
      </div>
    </div>
    <footer class="rh-brand-footer">
      <span class="rh-wordmark rh-wordmark-inverse"
        ><span class="rh-wordmark-name">Rush Hour</span
        ><span class="rh-wordmark-tickets">Tickets</span></span
      >
      <p>Find your next great experience.</p>
    </footer>
  </section>
</template>
<style>
.event-workspace [data-route='event-page'] .rh-stepper button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.event-workspace [data-route='event-page'] .rh-public-cover::before {
  background-image: var(--event-cover, none);
}
.event-workspace [data-route='event-page'] .rh-fullwidth:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
