<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import WorkspaceCopyButton from './WorkspaceCopyButton.vue'
const props = defineProps({
  item: Object,
  codeStatus: Function,
  eligibleLabels: Function,
  amount: Function,
})
defineEmits(['back', 'action', 'notify'])
const route = useRoute()
const labels = {
  available: 'Available',
  paused: 'Paused',
  scheduled: 'Scheduled',
  expired: 'Expired',
  'used-up': 'Used up',
}
const actions = {
  available: 'Pause code',
  paused: 'Resume code',
  scheduled: 'Start now',
  expired: 'Reactivate',
  'used-up': 'Increase limit',
}
const state = computed(() => (props.item ? props.codeStatus(props.item) : ''))
const used = computed(() => Math.max(0, Number(props.item?.used) || 0))
const limit = computed(() => Math.max(1, Number(props.item?.limit) || 1))
const remaining = computed(() => Math.max(0, limit.value - used.value))
const progress = computed(() => Math.min(100, (used.value / limit.value) * 100))
</script>

<template>
  <section
    class="rh-screen rh35-detail"
    data-route="discount-detail"
    aria-labelledby="rh35-detail-title"
  >
    <div class="rh35-detail-intro">
      <a class="rh35-back" :href="`${route.path}?view=promo`" @click.prevent="$emit('back')"
        >← Back to discount codes</a
      >
      <h1 id="rh35-detail-title">{{ item ? item.name || item.code : 'Discount not found' }}</h1>
      <p id="rh35-detail-intro-copy">
        {{
          item
            ? `Code: ${item.code} · ${amount(item)} · ${eligibleLabels(item.eligible)}`
            : 'This code was not found.'
        }}
      </p>
    </div>
    <div v-if="item" id="rh35-detail-content">
      <div class="rh35-code-hero">
        <div>
          <span class="rh35-label">DISCOUNT CODE</span>
          <h2>{{ item.code }}</h2>
          <p>{{ amount(item) }} for {{ eligibleLabels(item.eligible) }}</p>
        </div>
        <div class="rh35-code-hero-actions">
          <WorkspaceCopyButton
            compact
            button-class="rh35-copy-code"
            text="Copy code"
            :value="item.code"
            label="Copy discount code"
            @notify="$emit('notify', $event)"
          /><button type="button" @click="$emit('action', item)">{{ actions[state] }}</button>
        </div>
      </div>
      <div class="rh35-detail-stats">
        <article>
          <span>Used so far</span><strong>{{ used }}</strong
          ><small>orders used this code</small>
        </article>
        <article>
          <span>Uses left</span><strong>{{ remaining }}</strong
          ><small>of {{ limit }} allowed</small>
        </article>
        <article>
          <span>Status</span><strong class="rh35-stat-word">{{ labels[state] }}</strong
          ><small>{{
            {
              available: 'Ready to use',
              paused: 'Code is off',
              scheduled: 'Starts later',
              expired: 'End date passed',
              'used-up': 'Usage limit reached',
            }[state]
          }}</small>
        </article>
      </div>
      <section class="rh35-detail-panel">
        <h2>How many times was it used?</h2>
        <p>{{ used }} of {{ limit }} orders used {{ item.code }}.</p>
        <div class="rh35-used-track" role="img" :aria-label="`${used} of ${limit} uses`">
          <span :style="{ width: `${progress}%` }" />
        </div>
        <div class="rh35-used-legend">
          <span><i />{{ used }} used</span><span><i />{{ remaining }} left</span>
        </div>
      </section>
      <section class="rh35-detail-panel">
        <h2>About this discount</h2>
        <dl class="rh35-facts">
          <div>
            <dt>Offer name</dt>
            <dd>{{ item.name || item.code }}</dd>
          </div>
          <div>
            <dt>Code</dt>
            <dd>{{ item.code }}</dd>
          </div>
          <div v-if="item.partner">
            <dt>Creator or partner</dt>
            <dd>{{ item.partner }}</dd>
          </div>
          <div>
            <dt>Saving</dt>
            <dd>{{ amount(item) }}</dd>
          </div>
          <div>
            <dt>Tickets</dt>
            <dd>{{ eligibleLabels(item.eligible) }}</dd>
          </div>
          <div>
            <dt>Starts</dt>
            <dd>{{ item.start || 'Immediately' }}</dd>
          </div>
          <div>
            <dt>Ends</dt>
            <dd>{{ item.end || 'No end date' }}</dd>
          </div>
        </dl>
      </section>
    </div>
  </section>
</template>
