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
globalThis.document = { visibilityState: 'visible' }
globalThis.window = new EventTarget()
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})
const renderer = createRenderer({
  createComment: () => ({}),
  createText: () => ({}),
  createElement: () => ({}),
  insert() {},
  remove() {},
  setText() {},
  setElementText() {},
  parentNode: () => null,
  nextSibling: () => null,
  patchProp() {},
})
const apps = []
const flush = async () => {
  for (let i = 0; i < 8; i++) await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}
try {
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const { useAuthStore } = await server.ssrLoadModule('/src/stores/auth.js')
  const { refundIntention } = await server.ssrLoadModule(
    '/src/components/event-workspace/financialModel.js',
  )
  const { default: Records } = await server.ssrLoadModule(
    '/src/components/event-workspace/WorkspaceFinancialRecords.vue',
  )
  const { default: Lifecycle } = await server.ssrLoadModule(
    '/src/components/event-workspace/WorkspaceEventLifecycle.vue',
  )
  const { default: Payouts } = await server.ssrLoadModule(
    '/src/components/event-workspace/WorkspaceEarningsPayouts.vue',
  )
  const { default: PaymentSuccess } = await server.ssrLoadModule('/src/pages/PaymentSuccess.vue')
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/payment-success/:orderId',
        name: 'payment-success',
        component: { render: () => null },
      },
    ],
  })
  await router.push('/payment-success/order-1')
  await router.isReady()
  const pinia = createPinia(),
    auth = useAuthStore(pinia)
  auth.user = { id: 9 }
  const response = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} })
  axios.defaults.adapter = async (config) => response(config, {})
  const calls = []
  let lostRefund = true,
    stale = true,
    submittedBank = false,
    privateDenied = false
  const item = {
    id: 27,
    quantity: 2,
    people_per_unit: 4,
    ticket_name: 'Historical table',
    currency: 'NGN',
    line_total_minor: 20000,
    discount_minor: 2000,
    refunded_minor: 0,
    refunded_quantity: 0,
    order: { public_id: 'order-1', status: 'paid' },
  }
  const page = (data) => ({ data, current_page: 1, last_page: 2, total: 31 })
  api.defaults.adapter = async (config) => {
    calls.push(config)
    const payload = config.data ? JSON.parse(config.data) : null
    if (privateDenied) throw { response: { status: 403 } }
    if (config.url.startsWith('/checkout/orders/'))
      return response(config, {
        data: {
          public_id: 'order-1',
          status: 'partially_refunded',
          items: [
            {
              id: 27,
              event_id: 1,
              tickets: [
                {
                  public_id: 'refunded-ticket',
                  status: 'refunded',
                  token: 'historical-credential',
                },
                {
                  public_id: 'valid-ticket',
                  status: 'valid',
                  token: 'server-issued-valid-credential',
                },
              ],
            },
          ],
        },
      })
    if (config.url.endsWith('/earnings'))
      return response(config, {
        data: {
          by_currency: [
            {
              currency: 'NGN',
              gross_minor: 20000,
              discounts_minor: 2000,
              charged_minor: 18000,
              refunds_minor: 0,
              provider_fee_minor: null,
              confirmed_settled_minor: 0,
              pending_settlement_minor: 17000,
            },
            { currency: 'USD', gross_minor: 500 },
          ],
          actual_attendance: 2,
        },
      })
    if (config.url.endsWith('/purchases')) return response(config, page([item]))
    if (config.url.endsWith('/refunds') && config.method === 'get')
      return response(
        config,
        page([
          { public_id: 'refund-1', status: 'attention', amount_minor: 18000, currency: 'NGN' },
        ]),
      )
    if (config.url.includes('/orders/order-1/refunds')) {
      assert.deepEqual(payload.order_item_ids, [27])
      assert.equal(payload.amount_minor, undefined)
      if (lostRefund) {
        lostRefund = false
        throw new Error('lost response')
      }
      return response(config, {
        data: { public_id: 'refund-1', status: 'queued', amount_minor: 18000, currency: 'NGN' },
      })
    }
    if (config.url.endsWith('/retry'))
      return response(config, { data: { public_id: 'refund-1', status: 'queued' } })
    if (config.url.startsWith('/create-event/'))
      return response(config, {
        data: {
          version: 4,
          lifecycle_state: 'sales_closed',
          booking_cutoff_at: '2030-06-21T16:00:00+00:00',
          form: {},
        },
      })
    if (config.url.endsWith('/lifecycle')) {
      if (stale) {
        stale = false
        throw { response: { status: 409 } }
      }
      return response(config, { data: { id: 1, version: 5, lifecycle_state: 'cancelled' } })
    }
    if (config.url === '/seller/banks')
      return response(config, { data: [{ code: '058', name: 'Test bank' }] })
    if (config.url === '/seller/payout-accounts' && config.method === 'get')
      return response(
        config,
        page(
          submittedBank
            ? [{ id: 2, status: 'pending', onboarding_state: 'queued', account_last4: '6789' }]
            : [],
        ),
      )
    if (config.url === '/seller/payout-accounts') {
      submittedBank = true
      assert.deepEqual(payload, { bank_code: '058', account_number: '0123456789' })
      return response(config, { data: { id: 2, status: 'pending' } })
    }
    throw new Error(`Unexpected request ${config.method} ${config.url}`)
  }
  const mount = (Component, props = {}) => {
    let state
    const app = renderer.createApp({
      setup() {
        state = Component.setup(props, { expose() {}, emit() {} })
        return () => null
      },
    })
    app.use(pinia)
    app.use(router)
    app.provide(ssrContextKey, {})
    app.mount({})
    apps.push(app)
    return {
      app,
      get state() {
        return state
      },
    }
  }
  const records = mount(Records, { eventId: 1 })
  await flush()
  assert.equal(records.state.metrics.value.by_currency.length, 2, 'Currencies stay separate')
  assert.equal(
    records.state.money(null, 'NGN'),
    'Not yet known',
    'Missing fee evidence is not zero',
  )
  records.state.selected.value = item
  records.state.reason.value = 'Buyer requested a refund'
  await records.state.refund()
  assert.ok(records.state.selected.value, 'A lost response keeps the same intention editable')
  await records.state.refund()
  const requests = calls
    .filter((c) => c.url.includes('/orders/order-1/refunds'))
    .map((c) => JSON.parse(c.data))
  assert.equal(requests[0].request_key, requests[1].request_key, 'Uncertain retry retains UUID')
  assert.match(records.state.notice.value, /Queued/)
  assert.equal(
    records.state.metrics.value.by_currency[0].refunds_minor,
    0,
    '202 does not fabricate a refund',
  )
  await records.state.retry({ public_id: 'refund-1' })
  assert.equal(calls.filter((c) => c.url.endsWith('/retry')).length, 1)
  const uuid = await refundIntention(9, 1, 'order-1', [27], 'Buyer requested a refund')
  await refundIntention(9, 1, 'order-1', [27], 'Different reason')
  assert.equal(await refundIntention(9, 1, 'order-1', [27], 'Buyer requested a refund'), uuid)
  assert.ok(
    ![...values.values()].join('').includes('Buyer requested'),
    'No reason or bank details in storage',
  )
  const lifecycle = mount(Lifecycle, { eventId: 1 })
  await flush()
  assert.equal(
    lifecycle.state.cutoff.value,
    '2030-06-21T16:00:00+00:00',
    'Saved UTC cutoff is read without reinterpreting its timezone',
  )
  lifecycle.state.cutoff.value = '2030-06-21T18:00:00+01:00'
  lifecycle.state.action.value = 'cancel'
  lifecycle.state.reason.value = 'Venue unavailable'
  await lifecycle.state.submit()
  assert.equal(lifecycle.state.conflict.value, true)
  assert.equal(lifecycle.state.reason.value, 'Venue unavailable', '409 preserves unsaved reason')
  await lifecycle.state.reload()
  assert.equal(
    lifecycle.state.cutoff.value,
    '2030-06-21T18:00:00+01:00',
    'Reloading the revision retains unsaved cutoff edits',
  )
  await lifecycle.state.submit()
  assert.equal(lifecycle.state.version.value, 5)
  assert.match(lifecycle.state.notice.value, /Refunds will be checked/)
  const payouts = mount(Payouts)
  await flush()
  await payouts.state.showForm()
  payouts.state.form.bank_code = '058'
  payouts.state.form.account_number = '0123456789'
  await payouts.state.saveBank()
  assert.equal(payouts.state.latest.value.status, 'pending', 'Submission is not bank verification')
  assert.equal(payouts.state.form.account_number, '')
  assert.ok(![...values.values()].join('').includes('0123456789'))
  const payment = mount(PaymentSuccess)
  await flush()
  assert.equal(
    payment.state.paid.value,
    true,
    'Partially refunded orders retain access to remaining valid tickets',
  )
  assert.equal(payment.state.order.value.items[0].tickets[0].status, 'refunded')
  assert.equal(payment.state.order.value.items[0].tickets[1].status, 'valid')
  const beforeReads = calls.filter((c) => c.url.startsWith('/checkout/orders/')).length
  window.dispatchEvent(new Event('focus'))
  await flush()
  assert.equal(
    calls.filter((c) => c.url.startsWith('/checkout/orders/')).length,
    beforeReads + 1,
    'Focus refreshes authoritative credential validity',
  )
  payment.app.unmount()
  apps.splice(apps.indexOf(payment.app), 1)
  privateDenied = true
  auth.user = { id: 10 }
  await flush()
  assert.equal(records.state.metrics.value, null, 'Account switch clears private financial data')
  assert.equal(payouts.state.accounts.value.length, 0)
  assert.match(records.state.error.value, /do not have access/)
  console.log(
    'PASS currency partitions, unknown fees, whole-line amounts, stable uncertain refund retries, attention verification, lifecycle conflicts, queued bank onboarding, account isolation and private storage',
  )
} finally {
  apps.forEach((app) => app.unmount())
  await server.close()
}
