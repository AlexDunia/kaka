<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import QrcodeVue from 'qrcode.vue'
import WorkspaceCopyButton from '@/components/event-workspace/WorkspaceCopyButton.vue'
import { getCheckoutOrder, verifyCheckoutPayment } from '@/services/checkoutService'
import { getOrderToken } from '@/utils/checkoutStorage'
const route = useRoute(),
  router = useRouter(),
  order = ref(null),
  loading = ref(true),
  error = ref(''),
  copyMessage = ref('')
const orderId = computed(() => String(route.params.orderId || ''))
const checkoutToken = computed(() => getOrderToken(orderId.value))
const callbackReference = computed(() => String(route.query.reference || route.query.trxref || ''))
const paid = computed(() =>
    ['paid', 'registered', 'partially_refunded'].includes(order.value?.status),
  ),
  review = computed(() => order.value?.status === 'payment_review')
const groups = computed(() => {
  const grouped = new Map()
  for (const item of order.value?.items || []) {
    const key = String(item.event_id)
    if (!grouped.has(key))
      grouped.set(key, { event_id: item.event_id, event_title: item.event_title, items: [] })
    grouped.get(key).items.push(item)
  }
  return [...grouped.values()]
})
const auth = useAuthStore()
let loadVersion = 0,
  refreshTimer,
  refreshing = false
const refreshVisible = () => {
  if (document.visibilityState !== 'hidden' && !loading.value && !refreshing) void load(false, true)
}
const load = async (verifyCallback = true, background = false) => {
  const version = ++loadVersion
  const id = orderId.value
  refreshing = true
  if (!background) {
    loading.value = true
    order.value = null
  }
  error.value = ''
  try {
    let current
    if (verifyCallback && callbackReference.value) {
      try {
        current = await verifyCheckoutPayment({
          reference: callbackReference.value,
          checkoutToken: checkoutToken.value,
          orderId: id,
        })
      } catch {
        /* A pending provider response can recover through the protected order read. */
      }
    }
    if (current?.public_id !== id)
      current = await getCheckoutOrder({ orderId: id, checkoutToken: checkoutToken.value })
    if (version === loadVersion) order.value = current
  } catch (err) {
    if (version === loadVersion)
      error.value =
        err?.response?.status === 403
          ? 'You do not have access to this order.'
          : err?.response?.status === 404
            ? 'This order could not be found.'
            : 'We could not load this order.'
  } finally {
    if (version === loadVersion) {
      loading.value = false
      refreshing = false
    }
  }
}
onBeforeUnmount(() => {
  loadVersion++
  clearInterval(refreshTimer)
  window.removeEventListener('focus', refreshVisible)
})
watch([orderId, callbackReference, () => auth.user?.id], load, { immediate: true })
refreshTimer = setInterval(refreshVisible, 30000)
window.addEventListener('focus', refreshVisible)
</script>
<template>
  <main>
    <p v-if="copyMessage" role="status">{{ copyMessage }}</p>
    <section v-if="loading">Confirming your payment…</section>
    <section v-else-if="error">
      <h1>We couldn't open this order</h1>
      <p>{{ error }}</p>
      <button @click="router.push({ name: 'order-recovery', query: { order: orderId } })">
        Recover your order</button
      ><button @click="router.push('/')">Back to events</button>
    </section>
    <section v-else-if="review">
      <h1>Your payment needs review</h1>
      <p>
        We need to review this order. Your payment and tickets aren’t confirmed. Don’t pay again.
      </p>
      <button @click="load">Check status</button>
    </section>
    <template v-else-if="paid"
      ><section>
        <h1>You're in.</h1>
        <p>
          {{
            order.status === 'partially_refunded'
              ? 'Part of this order has been refunded. Remaining valid tickets are shown below.'
              : order.status === 'registered'
                ? 'Your registration is confirmed. Your admission codes are ready.'
                : 'Payment confirmed. Your tickets are ready.'
          }}
        </p>
      </section>
      <section v-for="group in groups" :key="group.event_id">
        <h2>{{ group.event_title }}</h2>
        <article v-for="item in group.items" :key="item.id">
          <p v-if="item.refunded_quantity">
            {{ item.refunded_quantity }} units refunded or voided.
          </p>
          <p
            v-for="ticket in (item.tickets || []).filter((ticket) => ticket.status !== 'valid')"
            :key="ticket.public_id"
          >
            {{ ticket.public_id }} ? {{ ticket.status.replaceAll('_', ' ') }}
          </p>
          <template v-for="ticket in item.tickets" :key="ticket.public_id"
            ><div v-if="ticket.token && ticket.status === 'valid'">
              <div>
                <strong>{{ item.ticket_name }}</strong
                ><span>Ticket {{ ticket.public_id }}</span
                ><span v-if="ticket.admit_count > 1">Admits {{ ticket.admit_count }}</span>
              </div>
              <QrcodeVue
                :value="ticket.token"
                :size="112"
                level="M"
                render-as="svg"
              /><WorkspaceCopyButton
                :value="ticket.token"
                label="Copy admission code"
                @notify="copyMessage = $event"
              /></div
          ></template>
        </article></section
    ></template>
    <section v-else-if="['cancelled', 'refunded'].includes(order?.status)">
      <h1>This order is {{ order.status }}</h1>
      <p>Tickets from this order are no longer available.</p>
    </section>
    <section v-else-if="order?.status === 'payment_failed'">
      <h1>Payment wasn’t completed</h1>
      <p>Payment failed. Check ticket availability before trying again.</p>
    </section>
    <section v-else-if="order?.status === 'expired'">
      <h1>Your reservation has expired</h1>
      <p>
        If you completed payment, check again. We’ll confirm ticket availability before issuing
        tickets.
      </p>
      <button @click="load">Check payment</button>
    </section>
    <section v-else>
      <h1>Waiting for payment confirmation</h1>
      <p>Already paid? Check again. You won’t be charged again.</p>
      <button @click="load">Check again</button>
    </section>
  </main>
</template>
<style scoped>
main {
  min-height: 100vh;
  padding: 60px 18px;
  background: var(--color-bg);
  color: var(--color-text);
}
section {
  max-width: 760px;
  margin: 0 auto 24px;
  padding: 28px;
  border: 1px solid var(--color-border);
  border-radius: 16px;
  background: var(--color-surface);
}
article > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 14px;
  border: 1px solid var(--color-border);
  margin-top: 12px;
}
span {
  display: block;
  margin-top: 4px;
  color: var(--color-muted);
}
button {
  min-height: 46px;
  padding: 0 20px;
  border: 0;
  border-radius: 999px;
  background: var(--color-accent);
  color: var(--color-on-action);
  cursor: pointer;
}
</style>
