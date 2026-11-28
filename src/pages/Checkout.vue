<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EventPublicControls from '@/components/EventPublicControls.vue'
import { ArrowLeftIcon } from '@/components/icons/pngIcons'
import { useAuthStore } from '@/stores/auth'
import { useSlug } from '@/composables/useSlug'
import { getStaticEvent, quoteStaticTickets } from '@/services/staticEventCatalog'
import { isStaticPreview } from '@/services/staticPreviewMode'
import { useCartStore } from '@/stores/cart'
import { getVisitorId } from '@/services/eventViewService'
import {
  clearCheckoutAttempt,
  clearActiveCheckout,
  getActiveCheckout,
  rememberActiveCheckout,
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
import eventService from '@/services/eventService'
import { normalizeEventProfile } from '@/utils/eventProfile'
import { registerFreeEvent, getFreeRegistration } from '@/services/eventOperationsService'

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
    isStaticPreview() ||
    (selectedItems.value.length > 0 &&
      selectedItems.value.some((item) => item.demo === true || Boolean(getStaticEvent(item.eventId)))),
)
const freeEvent = ref(null),
  registrationQuantity = ref(1),
  registrationForm = ref(null),
  attendeeAnswers = ref({})
const freeRegistration = computed(() => route.query.registration === '1')
const selectedEvent = computed(
  () =>
    selectedItems.value[0] ||
    (freeEvent.value
      ? {
          eventId: freeEvent.value.id,
          eventTitle: freeEvent.value.title,
          eventLocation: freeEvent.value.venue,
          eventImage: freeEvent.value.cover,
        }
      : null),
)
const attendeeRows = computed(() => {
  const lines =
    freeRegistration.value && freeEvent.value
      ? [
          {
            ticket_type_id: null,
            quantity: registrationQuantity.value,
            people_per_unit: 1,
            event_id: freeEvent.value.id,
            ticket_name: 'Free registration',
          },
        ]
      : quote.value?.items || []
  const rows = []
  for (const line of lines) {
    const fields = freeRegistration.value
      ? freeEvent.value.registrationFields
      : quote.value?.registration_schemas?.[line.event_id] || line.registration_schema || []
    for (let unit = 0; unit < line.quantity; unit++)
      for (let seat = 0; seat < line.people_per_unit; seat++) {
        if (rows.length >= 500) return rows
        rows.push({
          key: `${line.ticket_type_id}:${unit}:${seat}`,
          ticket_type_id: line.ticket_type_id,
          unit_index: unit,
          seat_index: seat,
          fields,
          name: line.ticket_name,
        })
      }
  }
  return rows
})
const attendeePayload = () =>
  attendeeRows.value.map((row) => ({
    ...(row.ticket_type_id ? { ticket_type_id: row.ticket_type_id } : {}),
    unit_index: row.unit_index,
    seat_index: row.seat_index,
    answers: Object.fromEntries(
      row.fields
        .filter((field) => attendeeAnswers.value[`${row.key}:${field.id}`] !== undefined)
        .map((field) => [field.id, attendeeAnswers.value[`${row.key}:${field.id}`]]),
    ),
  }))
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
  verifying = ref(false),
  error = ref(''),
  checkoutToken = ref(''),
  orderId = ref(''),
  reference = ref(''),
  orderStatus = ref(''),
  accessCode = ref('')
let disposed = false
const unresolved = computed(() => orderStatus.value === 'pending_payment')
const terminal = computed(() =>
  ['cancelled', 'refunded', 'payment_review', 'paid', 'registered'].includes(orderStatus.value),
)
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
}
const validate = () => {
  errors.value = {}
  const required = {
    firstName: 'First name is required.',
    lastName: 'Last name is required.',
    email: 'Email is required.',
    ...(!freeRegistration.value ? { phone: 'Phone number is required.' } : {}),
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
  if (freeRegistration.value) {
    loading.value = true
    error.value = ''
    try {
      const [response, registration] = await Promise.all([
        eventService.getEventById(route.query.event),
        getFreeRegistration(route.query.event),
      ])
      registrationForm.value = registration
      const profile = normalizeEventProfile(response.data)
      if (!profile.canRegister || !registration.booking_supported)
        throw new Error('Registration is not available for this event.')
      if (!disposed) freeEvent.value = { ...profile, registrationFields: registration.fields }
    } catch (err) {
      error.value = err?.message || 'Registration could not be loaded.'
    } finally {
      loading.value = false
    }
    return
  }
  if (!selectedItems.value.length) {
    error.value = 'Your cart is empty.'
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  quote.value = null
  try {
    if (staticCheckout.value) {
      if (isStaticPreview()) {
        const ids = [...new Set(selectedItems.value.map((item) => Number(item.eventId)))]
        const events = await Promise.all(ids.map((id) => eventService.getEventById(id)))
        const byId = new Map(events.map((response) => [response.data.id, response.data]))
        quote.value = quoteStaticTickets(selectedItems.value, (id) => byId.get(Number(id)))
      } else quote.value = quoteStaticTickets(selectedItems.value)
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
  clearActiveCheckout()
  rememberOrderToken(order.public_id, checkoutToken.value)
  if (order.status === 'paid') {
    for (const line of order.items || []) {
      const item = cart.items.find((item) => Number(item.ticketId) === Number(line.ticket_type_id))
      if (item)
        cart.updateQuantity(item.eventId, item.ticketId, Math.max(0, item.quantity - line.quantity))
    }
  }
  clearCheckoutAttempt()
  confirming.value = false
  await router.replace({ name: 'payment-success', params: { orderId: order.public_id } })
}
const handleOrder = async (order) => {
  if (!order || disposed) return false
  orderStatus.value = order.status
  quote.value = order
  if (['paid', 'registered', 'payment_review'].includes(order.status)) {
    await finish(order)
    return true
  }
  if (order.status === 'payment_failed') {
    accessCode.value = ''
    stopPolling()
    confirming.value = false
    error.value = 'Payment wasn’t completed. Your tickets are still in your cart.'
    return true
  }
  if (order.status === 'expired') {
    stopPolling()
    confirming.value = false
    clearCheckoutAttempt()
    checkoutToken.value = ''
    clearActiveCheckout()
    orderId.value = ''
    reference.value = ''
    accessCode.value = ''
    error.value =
      'Your reservation expired. Your cart is still here. Start payment again to reserve available tickets.'
    await loadQuote()
    return true
  }
  if (['cancelled', 'refunded'].includes(order.status)) {
    stopPolling()
    confirming.value = false
    clearActiveCheckout()
    error.value = `This order is ${order.status}.`
    return true
  }
  return false
}
const inspectOrder = async () => {
  if (!orderId.value || pollRequestInFlight || verifying.value) return
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
  if (disposed) return
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
    } catch (err) {
      if ([401, 403, 404].includes(err?.response?.status)) {
        stopPolling()
        confirming.value = false
        error.value =
          'We couldn’t open this order. Use your order recovery link to check its status.'
      }
    }
  }, POLL_INTERVAL_MS)
}
const checkPayment = async () => {
  if (!orderId.value || verifying.value || pollRequestInFlight || submitting.value) return
  verifying.value = true
  confirming.value = true
  error.value = ''
  try {
    const terminal = await handleOrder(
      reference.value
        ? await verifyCheckoutPayment({
            reference: reference.value,
            checkoutToken: checkoutToken.value,
            orderId: orderId.value,
          })
        : await getCheckoutOrder({ orderId: orderId.value, checkoutToken: checkoutToken.value }),
    )
    if (!terminal) error.value = 'Payment is not confirmed yet.'
  } catch (err) {
    error.value = err?.response?.data?.message || 'Payment is not confirmed yet.'
  } finally {
    verifying.value = false
    if (!pollTimer) confirming.value = false
  }
}
const pay = async () => {
  if (isStaticPreview()) {
    error.value = 'You can explore checkout here. Payments and registrations need a connected account.'
    return
  }
  if (
    submitting.value ||
    confirming.value ||
    terminal.value ||
    (unresolved.value && !accessCode.value)
  )
    return
  if (accessCode.value) {
    submitting.value = true
    try {
      const PaystackPop = await loadPaystack()
      if (!disposed) {
        new PaystackPop().resumeTransaction(accessCode.value)
        accessCode.value = ''
        startPolling()
      }
    } catch {
      error.value = 'Payment could not be opened. Check payment status before trying again.'
    } finally {
      submitting.value = false
    }
    return
  }
  if (!validate()) return
  if (freeRegistration.value) {
    if (
      !freeEvent.value ||
      !Number.isInteger(registrationQuantity.value) ||
      registrationQuantity.value < 1 ||
      registrationQuantity.value > 20
    )
      return
    submitting.value = true
    error.value = ''
    try {
      checkoutToken.value = getOrCreateCheckoutToken()
      rememberActiveCheckout({ orderId: '', reference: '', checkoutToken: checkoutToken.value })
      const order = await registerFreeEvent(freeEvent.value.id, {
        checkout_token: checkoutToken.value,
        quantity: registrationQuantity.value,
        customer: {
          first_name: form.value.firstName.trim(),
          last_name: form.value.lastName.trim(),
          email: form.value.email.trim(),
          phone: form.value.phone.trim(),
        },
        attendees: attendeePayload(),
      })
      rememberOrderToken(order.public_id, checkoutToken.value)
      await handleOrder(order)
    } catch (err) {
      error.value =
        Object.values(err?.response?.data?.errors || {})
          .flat()
          .find((value) => typeof value === 'string') ||
        err?.response?.data?.message ||
        'Registration is unconfirmed. Retry with the same details to check this attempt.'
    } finally {
      submitting.value = false
    }
    return
  }
  if (staticCheckout.value) {
    error.value = 'Online payment isn’t available for this event yet. Please contact the organiser.'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    checkoutToken.value = getOrCreateCheckoutToken()
    rememberActiveCheckout({
      orderId: orderId.value,
      reference: reference.value,
      checkoutToken: checkoutToken.value,
    })
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
      attendees: attendeePayload(),
    })
    if (disposed) return
    const order = result?.order
    if (!order?.public_id) throw new Error('We couldn’t create your order. Please try again.')
    orderId.value = order.public_id
    rememberOrderToken(order.public_id, checkoutToken.value)
    reference.value = result?.payment?.reference || ''
    rememberActiveCheckout({
      orderId: order.public_id,
      reference: reference.value,
      checkoutToken: checkoutToken.value,
    })
    const previousTotal = quote.value?.total_minor
    if (await handleOrder(order)) return
    const paymentAccessCode = result?.payment?.access_code || ''
    if (reference.value && !paymentAccessCode) {
      error.value =
        'We’re checking whether payment was opened. Use Check payment before trying again.'
      startPolling()
      return
    }
    if (!reference.value || !paymentAccessCode)
      throw new Error('Payment could not be opened. Please try again.')
    if (previousTotal !== undefined && Number(previousTotal) !== Number(order.total_minor)) {
      accessCode.value = result.payment.access_code
      error.value =
        'Your ticket price has changed. Review the updated total, then continue payment.'
      return
    }
    const PaystackPop = await loadPaystack()
    if (disposed) return
    new PaystackPop().resumeTransaction(paymentAccessCode)
    startPolling()
  } catch (err) {
    if (expiredError(err)) {
      clearCheckoutAttempt()
      checkoutToken.value = ''
      clearActiveCheckout()
      orderStatus.value = ''
      orderId.value = ''
      reference.value = ''
      await loadQuote()
      error.value =
        'Your previous reservation expired. Availability has been refreshed; start payment again.'
    } else {
      if (
        err?.response?.status === 422 &&
        !orderId.value &&
        !err.response.data?.errors?.checkout_token
      ) {
        clearActiveCheckout()
        clearCheckoutAttempt()
        await loadQuote()
      }
      const fields = err?.response?.data?.errors
      error.value =
        (fields &&
          Object.values(fields)
            .flat()
            .find((value) => typeof value === 'string')) ||
        err?.response?.data?.message ||
        err?.message ||
        'We could not start checkout. Retry with the same details to check the existing attempt.'
    }
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
onMounted(async () => {
  const active = getActiveCheckout()
  if (active?.orderId) {
    checkoutToken.value = active.checkoutToken
    orderId.value = active.orderId
    reference.value = active.reference || ''
    orderStatus.value = 'pending_payment'
    try {
      const done = await handleOrder(
        await getCheckoutOrder({ orderId: active.orderId, checkoutToken: active.checkoutToken }),
      )
      if (!done) startPolling()
    } catch {
      error.value =
        'We couldn’t check your previous payment. Check its status before starting another payment.'
    } finally {
      loading.value = false
    }
    return
  }
  loadQuote()
  if (!staticCheckout.value && !freeRegistration.value) loadPaystack().catch(() => {})
})
onBeforeUnmount(() => {
  disposed = true
  stopPolling()
})
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
      <p class="ep-checkout-intro">You’re almost there.</p>
      <p v-if="loading" role="status">Getting your tickets ready…</p>
      <div v-else class="ep-checkout-grid">
        <form @submit.prevent="pay">
          <h2>Your details</h2>
          <p>We’ll email your ticket confirmation here.</p>
          <div class="ep-checkout-fields">
            <label
              v-for="(label, key) in {
                firstName: 'First name',
                lastName: 'Last name',
                email: 'Email address',
                phone: freeRegistration ? 'Phone number (optional)' : 'Phone number',
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
                :maxlength="key === 'email' ? 255 : key === 'phone' ? 50 : 100"
                :aria-invalid="Boolean(errors[key])"
                :aria-describedby="errors[key] ? `checkout-error-${key}` : undefined"
              /><small v-if="errors[key]" :id="`checkout-error-${key}`">{{
                errors[key]
              }}</small></label
            >
          </div>
          <label v-if="freeRegistration && freeEvent" class="ep-checkout-fields"
            >Number of guests<input
              v-model.number="registrationQuantity"
              type="number"
              min="1"
              :max="Math.min(20, registrationForm?.available || 0)"
              required
              :disabled="submitting || unresolved"
          /></label>
          <template v-for="(attendee, index) in attendeeRows" :key="attendee.key">
            <fieldset
              v-if="attendee.fields.length"
              class="ep-checkout-fields"
              :disabled="submitting || unresolved"
            >
              <legend>{{ attendee.name }} - guest {{ index + 1 }}</legend>
              <label v-for="field in attendee.fields" :key="field.id"
                >{{ field.label
                }}<input
                  v-model="attendeeAnswers[`${attendee.key}:${field.id}`]"
                  :type="field.type === 'email' ? 'email' : 'text'"
                  :required="field.required"
                  :maxlength="field.id === 'email' ? 255 : field.id === 'name' ? 200 : 2000"
              /></label>
            </fieldset>
          </template>
          <button
            class="ep-primary ep-pay-button"
            :aria-busy="submitting || confirming"
            :disabled="
              submitting ||
              confirming ||
              (!quote && !freeEvent) ||
              (freeRegistration && !registrationForm?.available) ||
              terminal ||
              (unresolved && !accessCode)
            "
          >
            {{
              submitting
                ? 'Starting payment…'
                : confirming
                  ? 'Confirming payment…'
                  : freeRegistration
                    ? 'Complete registration'
                    : Number(quote?.total_minor) === 0
                      ? 'Complete booking'
                      : 'Pay securely'
            }}
          </button>
          <p v-if="staticCheckout" class="ep-payment-availability">
            Online payment isn’t available for this event yet.
          </p>
          <p v-if="confirming" aria-live="polite">
            Checking payment… This page will update when it’s confirmed.
          </p>
          <button
            v-if="orderId && !submitting"
            class="ep-secondary"
            type="button"
            :disabled="verifying" :aria-busy="verifying"
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
          <p v-else-if="freeEvent">
            Free registration for {{ registrationQuantity }} guest(s). Availability is confirmed
            when you submit.
          </p>
          <p v-else>We’ll show your total after checking ticket availability.</p>
        </aside>
      </div>
    </main>
  </div>
</template>
<style src="@/styles/event-profile.css"></style>
