<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EventPublicControls from '@/components/EventPublicControls.vue'
import { ArrowLeftIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useSlug } from '@/composables/useSlug'
import { getStaticEvent, quoteStaticTickets } from '@/services/staticEventCatalog'
import { useCartStore } from '@/stores/cart'
import { getVisitorId } from '@/services/eventViewService'
import {
  clearCheckoutAttempt,
  getOrCreateCheckoutToken,
  rememberOrderToken,
} from '@/utils/checkoutStorage'
import {
  getCheckoutOrder,
  initializeCheckout,
  quoteCheckout,
  verifyCheckoutPayment,
} from '@/services/checkoutService'
import { loadPaystack } from '@/utils/paystack'

defineOptions({ name: 'TicketCheckoutPage' })

const POLL_INTERVAL_MS = 2500
const MAX_POLL_MS = 10 * 60 * 1000
const router = useRouter(),
  route = useRoute(),
  auth = useAuthStore()
const { generateSlug } = useSlug()
const cart = useCartStore()
const selectedItems = computed(() =>
  cart.items.filter(
    (item) => !route.query.event || Number(item.eventId) === Number(route.query.event),
  ),
)
const checkoutItems = computed(() =>
  selectedItems.value.map((item) => ({
    ticket_type_id: Number(item.ticketId),
    quantity: Number(item.quantity),
  })),
)
const staticCheckout = computed(
  () =>
    selectedItems.value.length > 0 &&
    selectedItems.value.some((item) => item.demo === true || Boolean(getStaticEvent(item.eventId))),
)
const selectedEvent = computed(() => selectedItems.value[0])
const backToTickets = () => {
  const item = selectedEvent.value
  if (item)
    router.push({
      name: 'event-tickets',
      params: { id: item.eventId, slug: generateSlug(item.eventTitle) },
    })
  else router.push('/')
}

const quote = ref(null),
  loading = ref(true),
  submitting = ref(false),
  confirming = ref(false),
  error = ref(''),
  checkoutToken = ref(''),
  orderId = ref(''),
  reference = ref('')
const form = ref({ firstName: '', lastName: '', email: '', phone: '' })
const errors = ref({})
let pollTimer = null,
  pollStartedAt = 0,
  pollRequestInFlight = false
const money = (minor) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: quote.value?.currency || 'NGN',
  }).format(Number(minor || 0) / 100)
const groups = computed(() => {
  const grouped = new Map()
  for (const item of quote.value?.items || []) {
    const key = String(item.event_id)
    if (!grouped.has(key))
      grouped.set(key, { event_id: item.event_id, event_title: item.event_title, items: [] })
    grouped.get(key).items.push(item)
  }
  return [...grouped.values()]
})
const stopPolling = () => {
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
  pollRequestInFlight = false
}
const validate = () => {
  errors.value = {}
  const required = {
    firstName: 'First name is required.',
    lastName: 'Last name is required.',
    email: 'Email is required.',
    phone: 'Phone number is required.',
  }
  for (const [field, message] of Object.entries(required))
    if (!String(form.value[field] || '').trim()) errors.value[field] = message
  if (form.value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim()))
    errors.value.email = 'Enter a valid email address.'
  return !Object.keys(errors.value).length
}
const expiredError = (err) =>
  /expired|start a new checkout/i.test(
    Array.isArray(err?.response?.data?.errors?.checkout_token)
      ? err.response.data.errors.checkout_token.join(' ')
      : String(err?.response?.data?.errors?.checkout_token || err?.response?.data?.message || ''),
  )
const loadQuote = async () => {
  if (!selectedItems.value.length) {
    error.value = 'Your cart is empty.'
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    if (staticCheckout.value) {
      quote.value = quoteStaticTickets(selectedItems.value)
    } else {
      quote.value = await quoteCheckout(checkoutItems.value)
    }
  } catch (err) {
    error.value =
      err?.response?.data?.message ||
      err?.message ||
      'We could not confirm the tickets in your cart.'
  } finally {
    loading.value = false
  }
}
const finish = async (order) => {
  stopPolling()
  rememberOrderToken(order.public_id, checkoutToken.value)
  selectedItems.value.forEach((item) => cart.removeItem(item.eventId, item.ticketId))
  clearCheckoutAttempt()
  confirming.value = false
  await router.replace({ name: 'payment-success', params: { orderId: order.public_id } })
}
const handleOrder = async (order) => {
  if (!order) return false
  if (['paid', 'payment_review'].includes(order.status)) {
    await finish(order)
    return true
  }
  if (order.status === 'payment_failed') {
    stopPolling()
    confirming.value = false
    error.value = 'The payment was not completed. You can try again without losing your cart.'
    return true
  }
  if (order.status === 'expired') {
    stopPolling()
    confirming.value = false
    clearCheckoutAttempt()
    checkoutToken.value = ''
    error.value =
      'Your ticket reservation expired. Your cart is still here — start payment again to reserve fresh availability.'
    await loadQuote()
    return true
  }
  if (['cancelled', 'refunded'].includes(order.status)) {
    stopPolling()
    confirming.value = false
    error.value = `This order is ${order.status}.`
    return true
  }
  return false
}
const inspectOrder = async () => {
  if (!orderId.value || pollRequestInFlight) return
  pollRequestInFlight = true
  try {
    await handleOrder(
      await getCheckoutOrder({ orderId: orderId.value, checkoutToken: checkoutToken.value }),
    )
  } finally {
    pollRequestInFlight = false
  }
}
const startPolling = () => {
  stopPolling()
  confirming.value = true
  pollStartedAt = Date.now()
  pollTimer = window.setInterval(async () => {
    if (Date.now() - pollStartedAt > MAX_POLL_MS) {
      stopPolling()
      confirming.value = false
      error.value =
        'Payment is taking longer than expected. If you completed payment, use “Check payment” below.'
      return
    }
    try {
      await inspectOrder()
    } catch {
      // A transient read failure is shown by inspectOrder; the next poll can recover.
    }
  }, POLL_INTERVAL_MS)
}
const checkPayment = async () => {
  if (!reference.value || confirming.value) return
  confirming.value = true
  error.value = ''
  try {
    const terminal = await handleOrder(
      await verifyCheckoutPayment({
        reference: reference.value,
        checkoutToken: checkoutToken.value,
      }),
    )
    if (!terminal) error.value = 'Payment is not confirmed yet.'
  } catch (err) {
    error.value = err?.response?.data?.message || 'Payment is not confirmed yet.'
  } finally {
    if (!pollTimer) confirming.value = false
  }
}
const pay = async () => {
  if (submitting.value || confirming.value || !validate()) return
  if (staticCheckout.value) {
    error.value = 'Online payment isn’t available for this event yet. Please contact the organiser.'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    checkoutToken.value = getOrCreateCheckoutToken()
    const result = await initializeCheckout({
      checkoutToken: checkoutToken.value,
      visitorId: getVisitorId(),
      customer: {
        first_name: form.value.firstName.trim(),
        last_name: form.value.lastName.trim(),
        email: form.value.email.trim().toLowerCase(),
        phone: form.value.phone.trim(),
      },
      items: checkoutItems.value,
    })
    const order = result?.order
    if (!order?.public_id) throw new Error('Checkout did not return an order.')
    orderId.value = order.public_id
    rememberOrderToken(order.public_id, checkoutToken.value)
    if (await handleOrder(order)) return
    reference.value = result?.payment?.reference || ''
    const accessCode = result?.payment?.access_code || ''
    if (!reference.value || !accessCode)
      throw new Error('Payment could not be opened. Please try again.')
    const PaystackPop = await loadPaystack()
    new PaystackPop().resumeTransaction(accessCode)
    startPolling()
  } catch (err) {
    if (expiredError(err)) {
      clearCheckoutAttempt()
      checkoutToken.value = ''
      await loadQuote()
      error.value =
        'Your previous reservation expired. Availability has been refreshed; start payment again.'
    } else
      error.value = err?.response?.data?.message || err?.message || 'We could not start checkout.'
  } finally {
    submitting.value = false
  }
}
watch(
  () => auth.user,
  (user) => {
    if (!user) return
    const names = String(user.name || '').split(' ')
    if (!form.value.firstName) form.value.firstName = user.first_name || names[0] || ''
    if (!form.value.lastName) form.value.lastName = user.last_name || names.slice(1).join(' ')
    if (!form.value.email) form.value.email = user.email || ''
    if (!form.value.phone) form.value.phone = user.phone || ''
  },
  { immediate: true },
)
onMounted(() => {
  loadQuote()
  if (!staticCheckout.value) loadPaystack().catch(() => {})
})
onBeforeUnmount(stopPolling)
</script>
<template>
  <div class="event-profile ep-checkout-page">
    <header class="ep-checkout-header">
      <div class="ep-container ep-checkout-header-inner">
        <button type="button" class="ep-checkout-back" @click="backToTickets">
          <ArrowLeftIcon /> Back to tickets
        </button>
        <div v-if="selectedEvent" class="ep-checkout-identity">
          <strong>{{ selectedEvent.eventTitle }}</strong
          ><span>Secure checkout</span>
        </div>
        <EventPublicControls />
      </div>
    </header>
    <main class="ep-container ep-checkout-main">
      <h1>Checkout</h1>
      <p class="ep-checkout-intro">Your tickets are nearly yours.</p>
      <p v-if="loading" role="status">Getting your tickets ready…</p>
      <div v-else class="ep-checkout-grid">
        <form @submit.prevent="pay">
          <h2>Your details</h2>
          <p>We’ll send your ticket confirmation to this email.</p>
          <div class="ep-checkout-fields">
            <label
              v-for="(label, key) in {
                firstName: 'First name',
                lastName: 'Last name',
                email: 'Email address',
                phone: 'Phone number',
              }"
              :key="key"
              :for="`checkout-${key}`"
              >{{ label
              }}<input
                :id="`checkout-${key}`"
                v-model="form[key]"
                :type="key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'"
                :autocomplete="
                  key === 'firstName'
                    ? 'given-name'
                    : key === 'lastName'
                      ? 'family-name'
                      : key === 'email'
                        ? 'email'
                        : 'tel'
                "
                :aria-invalid="Boolean(errors[key])"
                :aria-describedby="errors[key] ? `checkout-error-${key}` : undefined"
              /><small v-if="errors[key]" :id="`checkout-error-${key}`">{{
                errors[key]
              }}</small></label
            >
          </div>
          <button class="ep-primary ep-pay-button" :disabled="submitting || confirming || !quote">
            {{
              submitting
                ? 'Starting payment…'
                : confirming
                  ? 'Confirming payment…'
                  : Number(quote?.total_minor) === 0
                    ? 'Complete booking'
                    : 'Pay securely'
            }}
          </button>
          <p v-if="staticCheckout" class="ep-payment-availability">
            Online payment isn’t available for this event yet.
          </p>
          <p v-if="confirming" aria-live="polite">
            Confirming payment… We’ll update this page as soon as your payment is confirmed.
          </p>
          <button
            v-if="reference && !submitting"
            class="ep-secondary"
            type="button"
            :disabled="confirming"
            @click="checkPayment"
          >
            Check payment
          </button>
          <p v-if="error" class="ep-checkout-error" role="alert">{{ error }}</p>
          <button
            v-if="!quote && selectedItems.length"
            class="ep-secondary"
            type="button"
            @click="loadQuote"
          >
            Try again
          </button>
        </form>
        <aside class="ep-checkout-summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <div v-if="selectedEvent" class="ep-checkout-event">
            <img v-if="selectedEvent.eventImage" :src="selectedEvent.eventImage" alt="" />
            <div>
              <strong>{{ selectedEvent.eventTitle }}</strong
              ><span>{{ selectedEvent.eventLocation }}</span>
            </div>
          </div>
          <section v-for="group in groups" :key="group.event_id">
            <h3 v-if="groups.length > 1">{{ group.event_title }}</h3>
            <div v-for="item in group.items" :key="item.ticket_type_id" class="ep-checkout-line">
              <span>{{ item.quantity }} × {{ item.ticket_name }}</span
              ><strong>{{ money(item.line_total_minor) }}</strong>
            </div>
          </section>
          <div v-if="quote" class="ep-checkout-total">
            <span>Total</span><strong>{{ money(quote.total_minor) }}</strong>
          </div>
          <p v-else>Your ticket total will appear here once availability is confirmed.</p>
        </aside>
      </div>
    </main>
  </div>
</template>
<style src="@/styles/event-profile.css"></style>
