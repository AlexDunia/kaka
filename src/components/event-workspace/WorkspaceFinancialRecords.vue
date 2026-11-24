<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import { useEventStore } from '@/stores/events'
import { getPurchases, operationsError } from '@/services/eventOperationsService'
import {
  getEventEarnings,
  getRefunds,
  requestRefund,
  retryRefund,
} from '@/services/eventFinanceService'
import { formatMoneyMinor } from '@/utils/dashboardFormat'
import { useWorkspacePrivacy } from '@/composables/useWorkspacePrivacy'
import { financialRows, financeStatus, refundIntention } from './financialModel'
const props = defineProps({ eventId: [String, Number], purchasesOnly: Boolean })
const auth = useAuthStore(),
  dashboard = useDashboardStore(),
  events = useEventStore()
const { amountsHidden } = useWorkspacePrivacy()
const money = (value, currency) =>
  value == null
    ? 'Not yet known'
    : amountsHidden.value
      ? '••••••'
      : formatMoneyMinor(value, currency)
const metrics = ref(null),
  purchases = ref(null),
  refunds = ref(null),
  error = ref('')
const search = ref(''),
  busy = ref(false),
  reading = ref(false),
  selected = ref(null),
  reason = ref(''),
  notice = ref('')
const emit = defineEmits(['changed'])
let generation = 0,
  timer,
  active = true
const scope = computed(() => `${auth.user?.id}:${props.eventId}`)
async function load(
  page = purchases.value?.current_page || 1,
  refundPage = refunds.value?.current_page || 1,
) {
  if (reading.value) return
  const version = generation
  reading.value = true
  try {
    const results = await Promise.all([
      getEventEarnings(props.eventId),
      getPurchases(props.eventId, { page, per_page: 30, q: search.value.trim() || undefined }),
      getRefunds(props.eventId, refundPage),
    ])
    if (!active || version !== generation) return
    const changed =
      metrics.value &&
      (JSON.stringify(metrics.value) !== JSON.stringify(results[0]) ||
        JSON.stringify(refunds.value?.data) !== JSON.stringify(results[2].data))
    ;[metrics.value, purchases.value, refunds.value] = results
    error.value = ''
    if (changed) invalidate()
  } catch (e) {
    if (active && version === generation) {
      error.value = operationsError(e)
      if ([401, 403].includes(e.response?.status))
        metrics.value = purchases.value = refunds.value = null
    }
  } finally {
    if (version === generation) reading.value = false
  }
}
function invalidate() {
  dashboard.invalidateEvent(props.eventId)
  events.invalidateEvent(props.eventId)
  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(`rushhour-admission:${props.eventId}`)
    channel.postMessage('refresh')
    channel.close()
  }
  emit('changed')
}
function selectPurchase(item) {
  selected.value = item
  reason.value = ''
  error.value = ''
}
async function refund() {
  if (busy.value || !selected.value || reason.value.trim().length < 3) return
  busy.value = true
  const version = generation,
    item = selected.value
  try {
    const payload = { order_item_ids: [item.id], reason: reason.value.trim() }
    payload.request_key = await refundIntention(
      auth.user.id,
      props.eventId,
      item.order.public_id,
      payload.order_item_ids,
      payload.reason,
    )
    const result = await requestRefund(props.eventId, item.order.public_id, payload)
    if (version !== generation || !active) return
    notice.value = `${financeStatus(result.status)}. Only confirmed refunds are counted as money returned.`
    selected.value = null
    reason.value = ''
    invalidate()
    await load()
  } catch (e) {
    if (active && version === generation)
      error.value = operationsError(
        e,
        'The refund could not be confirmed. Keep the same reason and retry to check this request.',
      )
  } finally {
    if (version === generation) busy.value = false
  }
}
async function retry(row) {
  if (busy.value) return
  busy.value = true
  const version = generation
  try {
    const result = await retryRefund(props.eventId, row.public_id)
    if (!active || version !== generation) return
    notice.value = `${financeStatus(result.status)}. We will check the existing refund again.`
    await load()
  } catch (e) {
    if (active && version === generation) {
      error.value = operationsError(e)
      if ([401, 403].includes(e.response?.status))
        metrics.value = purchases.value = refunds.value = null
    }
  } finally {
    if (version === generation) busy.value = false
  }
}
watch(
  scope,
  () => {
    generation++
    reading.value = false
    busy.value = false
    metrics.value = purchases.value = refunds.value = selected.value = null
    reason.value = search.value = notice.value = error.value = ''
    clearInterval(timer)
    if (!auth.user?.id) return
    void load(1, 1)
    timer = setInterval(() => {
      if (document.visibilityState !== 'hidden' && !busy.value) void load()
    }, 15000)
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  active = false
  generation++
  clearInterval(timer)
})
</script>
<template>
  <section class="rhe-earn-section">
    <p v-if="error" role="alert">
      {{ error }} <button class="rhea-inline-link" @click="load()">Reload records</button>
    </p>
    <p v-if="notice" role="status">{{ notice }}</p>
    <p v-if="reading" role="status">Getting your financial records…</p>
    <template v-if="!purchasesOnly">
      <section v-for="group in metrics?.by_currency || []" :key="group.currency" class="rhe-card">
        <h2>Your earnings in {{ group.currency }}</h2>
        <p>
          Original purchase amounts stay unchanged. Seller proceeds are separate from confirmed
          settlement.
        </p>
        <div class="rhe-ledger">
          <div v-for="[key, label] in financialRows" :key="key">
            <span>{{ label }}</span
            ><strong>{{ money(group[key], group.currency) }}</strong>
          </div>
        </div>
        <p v-if="group.legacy_refund_amounts_unknown">
          Some older refund amounts are unconfirmed. These figures include confirmed refunds only.
        </p>
        <p v-if="group.unknown_provider_fee_items">
          Provider fees are still unconfirmed for {{ group.unknown_provider_fee_items }} purchase
          lines.
        </p>
      </section>
      <p v-if="metrics && !metrics.by_currency.length" class="rhe-card">
        No completed financial records yet.
      </p>
    </template>
    <section class="rhe-card">
      <h2>Purchase records</h2>
      <form class="rhe-actions" @submit.prevent="load(1)">
        <label
          >Find an order or buyer email<input
            v-model="search"
            type="search"
            maxlength="100" /></label
        ><button class="rh-button rh-button-outline" :disabled="reading">Search</button>
      </form>
      <div v-for="item in purchases?.data || []" :key="item.id" class="rhe-ledger">
        <strong>{{ item.ticket_name }} · {{ item.order?.public_id }}</strong>
        <p>
          {{ item.order?.customer_email }} · {{ financeStatus(item.order?.status) }} ·
          {{ item.quantity }} units · {{ item.people_per_unit }} people per unit
        </p>
        <p>
          Original value {{ money(item.line_total_minor, item.currency) }} · Discounts
          {{ money(item.discount_minor, item.currency) }} · Confirmed refunds
          {{ money(item.refunded_minor, item.currency) }}
        </p>
        <button
          v-if="
            ['paid', 'registered', 'partially_refunded'].includes(item.order?.status) &&
            item.refunded_quantity < item.quantity
          "
          class="rh-button rh-button-outline"
          :disabled="busy"
          @click="selectPurchase(item)"
        >
          Refund this purchase line
        </button>
      </div>
      <p v-if="purchases && !purchases.data.length">No purchases match your search.</p>
      <nav v-if="purchases" aria-label="Purchase pages">
        <button
          :disabled="reading || purchases.current_page <= 1"
          @click="load(purchases.current_page - 1)"
        >
          Previous
        </button>
        Page {{ purchases.current_page }} of {{ purchases.last_page }}
        <button
          :disabled="reading || purchases.current_page >= purchases.last_page"
          @click="load(purchases.current_page + 1)"
        >
          Next
        </button>
      </nav>
    </section>
    <form v-if="selected" class="rhe-card" @submit.prevent="refund">
      <h2>Refund {{ selected.ticket_name }}</h2>
      <p>
        This refunds the whole purchase line: all {{ selected.quantity }} units and their admission
        seats. The server confirms the amount and eligibility. A line with an admitted guest cannot
        be refunded here. Free registrations are voided without a payment.
      </p>
      <label
        >Reason<textarea v-model="reason" minlength="3" maxlength="300" required :disabled="busy" />
      </label>
      <div class="rhe-actions">
        <button class="rh-button rh-button-dark" :disabled="busy">
          {{ busy ? 'Submitting refund…' : 'Confirm whole-line refund' }}</button
        ><button
          type="button"
          class="rh-button rh-button-outline"
          :disabled="busy"
          @click="selected = null"
        >
          Keep purchase
        </button>
      </div>
    </form>
    <section class="rhe-card">
      <h2>Refund history</h2>
      <div v-for="row in refunds?.data || []" :key="row.public_id" class="rhe-ledger">
        <strong>{{ row.public_id }} · {{ financeStatus(row.status) }}</strong>
        <p>{{ money(row.amount_minor, row.currency) }} · {{ row.reason }}</p>
        <button
          v-if="row.status === 'attention'"
          class="rh-button rh-button-outline"
          :disabled="busy"
          @click="retry(row)"
        >
          Check this refund again
        </button>
      </div>
      <p v-if="refunds && !refunds.data.length">No refund requests yet.</p>
      <nav v-if="refunds" aria-label="Refund pages">
        <button
          :disabled="reading || refunds.current_page <= 1"
          @click="load(undefined, refunds.current_page - 1)"
        >
          Previous
        </button>
        Page {{ refunds.current_page }} of {{ refunds.last_page }}
        <button
          :disabled="reading || refunds.current_page >= refunds.last_page"
          @click="load(undefined, refunds.current_page + 1)"
        >
          Next
        </button>
      </nav>
    </section>
  </section>
</template>
