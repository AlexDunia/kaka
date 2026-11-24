import assert from 'node:assert/strict'
import axios from 'axios'
import { createServer } from 'vite'
import { createRenderer, nextTick, ssrContextKey } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
const values = new Map()
globalThis.sessionStorage = globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
}
globalThis.window = Object.assign(new EventTarget(), {
  setInterval,
  clearInterval,
  PaystackPop: class {
    resumeTransaction() {
      opened++
    }
  },
})
let opened = 0
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})
const renderer = createRenderer({
  createComment: () => ({}),
  createText: () => ({}),
  createElement: () => ({}),
  insert: () => {},
  remove: () => {},
  setText: () => {},
  setElementText: () => {},
  parentNode: () => null,
  nextSibling: () => null,
  patchProp: () => {},
})
const flush = async () => {
  for (let i = 0; i < 15; i++) await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}
try {
  const { default: Checkout } = await server.ssrLoadModule('/src/pages/Checkout.vue')
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const { useCartStore } = await server.ssrLoadModule('/src/stores/cart.js')
  const storage = await server.ssrLoadModule('/src/utils/checkoutStorage.js')
  const response = (config, data) => ({
    config,
    data: { data },
    status: 200,
    statusText: 'OK',
    headers: {},
  })
  axios.defaults.adapter = async (config) => response(config, {})
  let verifyCalls = 0
  let initializeCalls = 0,
    getCalls = 0,
    release,
    nextPayment = { reference: 'server-reference' },
    nextTotal = 10000
  const quote = {
    currency: 'NGN',
    total_minor: 10000,
    items: [
      {
        event_id: 1,
        ticket_type_id: 3,
        quantity: 1,
        ticket_name: 'Entry',
        line_total_minor: 10000,
      },
    ],
  }
  const pending = { ...quote, public_id: 'server-order', status: 'pending_payment' }
  api.defaults.adapter = async (config) => {
    if (config.url === '/checkout/quote') return response(config, quote)
    if (config.url === '/checkout/initialize') {
      initializeCalls++
      return new Promise((resolve) => {
        release = () =>
          resolve(
            response(config, {
              order: { ...pending, total_minor: nextTotal },
              payment: nextPayment,
            }),
          )
      })
    }
    if (config.url.includes('/verify')) {
      verifyCalls++
      return response(config, pending)
    }
    if (config.url.startsWith('/checkout/orders/')) {
      getCalls++
      return response(config, pending)
    }
    throw new Error('Unexpected request ' + config.url)
  }
  async function mount() {
    const pinia = createPinia()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/checkout', component: { render: () => null } },
        {
          path: '/payment-success/:orderId',
          name: 'payment-success',
          component: { render: () => null },
        },
      ],
    })
    await router.push('/checkout')
    await router.isReady()
    const cart = useCartStore(pinia)
    if (!cart.items.length) cart.addItem({ eventId: 1, ticketId: 3, quantity: 1 })
    let state
    const app = renderer.createApp({
      setup() {
        state = Checkout.setup({}, { expose: () => {} })
        return () => null
      },
    })
    app.use(pinia)
    app.use(router)
    app.provide(ssrContextKey, {})
    app.mount({})
    await flush()
    return { state, app, cart }
  }
  let { state, app, cart } = await mount()
  assert.ok(state.pay, 'Checkout setup is testable')
  state.form.value = {
    firstName: 'Ada',
    lastName: 'Buyer',
    email: 'ada@example.invalid',
    phone: '08000000000',
  }
  const first = state.pay()
  await flush()
  await state.pay()
  assert.equal(initializeCalls, 1, 'Repeated clicks must not initialize twice')
  release()
  await first
  assert.equal(storage.getActiveCheckout().reference, 'server-reference')
  assert.equal(state.unresolved.value, true)
  await Promise.all([state.checkPayment(), state.checkPayment()])
  assert.equal(verifyCalls, 1, 'Manual status checks work during polling and cannot overlap')
  state.stopPolling()
  state.confirming.value = false
  await state.pay()
  assert.equal(initializeCalls, 1, 'Uncertain initialization cannot open another payment')
  const token = storage.getActiveCheckout().checkoutToken
  cart.updateQuantity(1, 3, 2)
  assert.equal(storage.getOrCreateCheckoutToken(), token, 'Cart edits retain unresolved attempt')
  app.unmount()
  const recovered = await mount()
  state = recovered.state
  app = recovered.app
  assert.equal(state.orderId.value, 'server-order')
  assert.ok(getCalls >= 1, 'Refresh reads the protected existing order')
  assert.equal(initializeCalls, 1)
  assert.equal(opened, 0, 'Missing access code never fabricates a provider popup')
  app.unmount()
  await state.handleOrder({ ...pending, status: 'paid' })
  assert.equal(
    storage.getActiveCheckout().orderId,
    'server-order',
    'Unmounted results cannot finish checkout',
  )
  values.clear()
  nextTotal = 12000
  nextPayment = { reference: 'price-reference', access_code: 'server-access-code' }
  const changed = await mount()
  state = changed.state
  app = changed.app
  state.form.value = {
    firstName: 'Ada',
    lastName: 'Buyer',
    email: 'ada@example.invalid',
    phone: '08000000000',
  }
  const priceAttempt = state.pay()
  await flush()
  release()
  await priceAttempt
  assert.equal(state.quote.value.total_minor, 12000)
  assert.equal(opened, 0, 'Price changes require review before opening payment')
  await state.pay()
  assert.equal(opened, 1)
  await state.handleOrder({ ...pending, status: 'payment_failed' })
  assert.equal(state.confirming.value, false)
  assert.equal(storage.getOrCreateCheckoutToken(), storage.getActiveCheckout().checkoutToken)
  await state.handleOrder({ ...pending, status: 'expired' })
  assert.equal(storage.getActiveCheckout(), null)
  assert.equal(state.reference.value, '')
  await state.handleOrder({ ...pending, status: 'payment_review' })
  assert.equal(changed.cart.items.length, 1, 'Review must not consume the cart or issue tickets')
  const before = initializeCalls
  await state.pay()
  assert.equal(initializeCalls, before, 'Review orders cannot pay again')
  app.unmount()
  values.clear()
  const mismatch = await mount()
  mismatch.state.form.value = {
    firstName: 'Ada',
    lastName: 'Buyer',
    email: 'ada@example.invalid',
    phone: '08000000000',
  }
  const originalAdapter = api.defaults.adapter
  api.defaults.adapter = async (config) => {
    if (config.url === '/checkout/initialize') {
      const error = new Error('Cart mismatch')
      error.response = {
        status: 422,
        data: { errors: { checkout_token: ['This token belongs to another cart.'] } },
      }
      throw error
    }
    return originalAdapter(config)
  }
  const retainedToken = storage.getOrCreateCheckoutToken()
  await mismatch.state.pay()
  assert.equal(
    storage.getActiveCheckout().checkoutToken,
    retainedToken,
    'A mismatched retry must not create a fresh attempt',
  )
  api.defaults.adapter = originalAdapter
  mismatch.app.unmount()
  console.log(
    'PASS price-change confirmation, failed retry identity, expiry reset and payment review guard',
  )
  console.log(
    'PASS Vue checkout duplicate clicks, unresolved reference, cart-edit token preservation, refresh recovery and unmount guards',
  )
} finally {
  await server.close()
}
