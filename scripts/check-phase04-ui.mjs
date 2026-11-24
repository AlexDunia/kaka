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
globalThis.window = new EventTarget()
globalThis.document = Object.assign(new EventTarget(), {
  visibilityState: 'visible',
  activeElement: null,
})
globalThis.requestAnimationFrame = () => 1
globalThis.cancelAnimationFrame = () => {}
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
  for (let i = 0; i < 8; i++) await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}
const apps = []
try {
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const { useWorkspaceAttendees } = await server.ssrLoadModule(
    '/src/components/event-workspace/attendeesModel.js',
  )
  const { useAuthStore } = await server.ssrLoadModule('/src/stores/auth.js')
  const { default: Support } = await server.ssrLoadModule(
    '/src/components/event-workspace/WorkspaceSupport.vue',
  )
  const response = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} })
  axios.defaults.adapter = async (config) => response(config, {})
  let inside = false,
    networkFailure = true,
    calls = [],
    role = 'owner',
    lookupCount = 0
  const attendee = () => ({
    id: 1,
    order_item_id: 5,
    name: 'Real attendee',
    email: 'real@example.invalid',
    inside,
    entries: inside ? 1 : 0,
    lock_version: 2,
    answers: { name: 'Real attendee' },
    order_item: { ticket_name: 'Table', registration_schema: [{ id: 'name', required: true }] },
    ticket: { public_id: 'public-ticket' },
  })
  const paginator = (data) => ({ data, current_page: 1, last_page: 2, total: 31, per_page: 30 })
  api.defaults.adapter = async (config) => {
    calls.push(config)
    if (config.url.endsWith('/admission'))
      return response(config, {
        data: {
          event: { id: 1, title: 'Real event' },
          role,
          entrances: [{ id: 2, name: 'Main', active: true }],
        },
      })
    if (config.url.endsWith('/attendees')) return response(config, paginator([attendee()]))
    if (config.url.endsWith('/purchases'))
      return response(
        config,
        paginator([
          {
            id: 5,
            quantity: 1,
            people_per_unit: 4,
            line_total_minor: 10000,
            order: {
              public_id: 'real-order',
              customer_first_name: 'Buyer',
              customer_email: 'buyer@example.invalid',
              status: 'paid',
            },
          },
        ]),
      )
    if (config.url.endsWith('/admission/history')) return response(config, paginator([]))
    if (config.url.endsWith('/admission/lookup')) {
      lookupCount++
      return response(config, {
        data: { ticket_public_id: 'public-ticket', admit_count: 4, inside_count: inside ? 1 : 0 },
      })
    }
    if (config.url.endsWith('/admission/movements')) {
      inside = true
      if (networkFailure) {
        networkFailure = false
        throw new Error('Response lost')
      }
      const payload = JSON.parse(config.data)
      return response(config, {
        data: {
          outcome: 'recorded',
          count: 1,
          direction: 'in',
          request_key: payload.request_key,
          ticket_public_id: 'public-ticket',
          inside_count: 1,
        },
      })
    }
    throw new Error('Unexpected URL ' + config.url)
  }
  const pinia = createPinia()
  const auth = useAuthStore(pinia)
  auth.user = { id: 9 }
  function mountModel() {
    let model
    const app = renderer.createApp({
      setup() {
        model = useWorkspaceAttendees(1, 'paid')
        return () => null
      },
    })
    app.use(pinia)
    app.mount({})
    apps.push(app)
    return {
      app,
      get model() {
        return model
      },
    }
  }
  const first = mountModel(),
    second = mountModel()
  await flush()
  assert.equal(first.model, second.model, 'Both interfaces share one authoritative cache')
  assert.equal(first.model.guests.value[0].name, 'Real attendee')
  assert.equal(first.model.guests.value[0].ticketPublicId, 'public-ticket')
  assert.equal(first.model.orderTotal(first.model.orders.value[0]), 10000)
  await first.model.loadAttendees({ page: 2, q: 'Real' })
  assert.deepEqual(calls.filter((call) => call.url.endsWith('/attendees')).at(-1).params, {
    page: 2,
    q: 'Real',
    per_page: 30,
  })
  const code = 'server-issued-credential-xxxxxxxxxxxxxxxxxxxxxxxx'
  const uncertain = await first.model.recordMovement(code, 'in', 2, 1)
  assert.equal(uncertain.ok, false)
  assert.equal(first.model.inside('1'), false, 'No optimistic admission after a lost response')
  assert.ok(
    ![...values.values()].join('').includes(code),
    'Admission credential never enters browser storage',
  )
  const originalKey = JSON.parse(
    calls.filter((call) => call.url.endsWith('/movements')).at(-1).data,
  ).request_key
  first.app.unmount()
  second.app.unmount()
  const recovered = mountModel()
  await flush()
  const blocked = await recovered.model.recordMovement(code, 'out', 2, 1)
  assert.equal(blocked.ok, false, 'An uncertain operation cannot silently switch direction')
  const retried = await recovered.model.recordMovement(code, 'in', 2, 1)
  assert.equal(retried.ok, true)
  assert.equal(
    JSON.parse(calls.filter((call) => call.url.endsWith('/movements')).at(-1).data).request_key,
    originalKey,
  )
  assert.equal(recovered.model.inside('1'), true)
  auth.user = { id: 10 }
  await nextTick()
  assert.equal(
    recovered.model.guests.value.length,
    0,
    'Account changes clear private cached records',
  )
  recovered.app.unmount()
  role = 'door'
  calls = []
  const scoped = mountModel()
  await flush()
  assert.equal(
    calls.some((call) => call.url.endsWith('/attendees') || call.url.endsWith('/purchases')),
    false,
    'Door scope never requests personal attendee/buyer data',
  )
  scoped.app.unmount()
  let state,
    release,
    stopped = 0
  window.BarcodeDetector = class {}
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: {
      mediaDevices: {
        getUserMedia: () =>
          new Promise((resolve) => {
            release = resolve
          }),
      },
    },
  })
  const cameraApp = renderer.createApp({
    setup() {
      state = Support.setup({ preview: false, guests: [] }, { expose: () => {}, emit: () => {} })
      return () => null
    },
  })
  cameraApp.provide(ssrContextKey, {})
  cameraApp.mount({})
  apps.push(cameraApp)
  const starting = state.startCamera()
  await nextTick()
  cameraApp.unmount()
  release({ getTracks: () => [{ stop: () => stopped++ }] })
  await starting
  assert.equal(stopped, 1, 'Late camera permission releases the acquired stream after unmount')
  assert.equal(state.cameraRunning.value, false)
  assert.equal(lookupCount, 0)
  const { default: Checkout } = await server.ssrLoadModule('/src/pages/Checkout.vue')
  Object.assign(window, {
    setInterval,
    clearInterval,
    PaystackPop: class {
      resumeTransaction() {
        throw new Error('Free registration must not use Paystack')
      }
    },
  })
  const schema = [{ id: 'name', label: 'Guest name', required: true, type: 'text' }]
  let submitted
  const originalAdapter = api.defaults.adapter
  api.defaults.adapter = async (config) => {
    if (config.url === '/events/10')
      return response(config, {
        data: {
          id: 10,
          title: 'Free event',
          ticket_mode: 'free',
          event_type: 'one-time',
          status: 'active',
          ends_at: '2040-01-01T20:00:00Z',
          registration_fields: schema,
          booking_supported: true,
        },
      })
    if (config.url === '/events/10/registration')
      return response(config, {
        data: { event_id: 10, fields: schema, capacity: 2, available: 2, booking_supported: true },
      })
    if (config.url === '/events/10/registrations') {
      submitted = JSON.parse(config.data)
      return response(config, {
        data: { public_id: 'free-order', status: 'registered', total_minor: 0, items: [] },
      })
    }
    throw new Error('Unexpected free booking request ' + config.url)
  }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/checkout', name: 'checkout', component: { render: () => null } },
      {
        path: '/payment-success/:orderId',
        name: 'payment-success',
        component: { render: () => null },
      },
    ],
  })
  await router.push('/checkout?event=10&registration=1')
  await router.isReady()
  let checkout
  const checkoutApp = renderer.createApp({
    setup() {
      checkout = Checkout.setup({}, { expose: () => {} })
      return () => null
    },
  })
  checkoutApp.use(pinia)
  checkoutApp.use(router)
  checkoutApp.provide(ssrContextKey, {})
  checkoutApp.mount({})
  apps.push(checkoutApp)
  await flush()
  assert.equal(checkout.registrationForm.value.available, 2)
  checkout.registrationQuantity.value = 2
  checkout.form.value = {
    firstName: 'Buyer',
    lastName: 'Only',
    email: 'buyer@example.invalid',
    phone: '',
  }
  checkout.attendeeAnswers.value = { 'null:0:0:name': 'Guest one', 'null:1:0:name': 'Guest two' }
  await checkout.pay()
  assert.equal(submitted.attendees.length, 2)
  assert.equal(submitted.attendees[0].answers.name, 'Guest one')
  assert.equal(submitted.attendees[1].unit_index, 1)
  assert.equal(submitted.attendees[0].ticket_type_id, undefined)
  assert.equal(router.currentRoute.value.params.orderId, 'free-order')
  checkoutApp.unmount()
  const { useCartStore } = await server.ssrLoadModule('/src/stores/cart.js')
  const cart = useCartStore(pinia)
  cart.addItem({ eventId: 11, ticketId: 3, quantity: 1 })
  api.defaults.adapter = async (config) => {
    if (config.url === '/checkout/quote')
      return response(config, {
        data: {
          currency: 'NGN',
          total_minor: 10000,
          registration_schemas: { 11: schema },
          items: [
            {
              event_id: 11,
              ticket_type_id: 3,
              ticket_name: 'Table',
              quantity: 1,
              people_per_unit: 4,
              line_total_minor: 10000,
            },
          ],
        },
      })
    if (config.url === '/checkout/initialize') {
      submitted = JSON.parse(config.data)
      return response(config, {
        data: {
          order: {
            public_id: 'paid-order',
            status: 'pending_payment',
            items: [],
            total_minor: 10000,
          },
          payment: { reference: 'pending-reference' },
        },
      })
    }
    throw new Error('Unexpected paid booking request ' + config.url)
  }
  await router.push('/checkout?event=11')
  const paidApp = renderer.createApp({
    setup() {
      checkout = Checkout.setup({}, { expose: () => {} })
      return () => null
    },
  })
  paidApp.use(pinia)
  paidApp.use(router)
  paidApp.provide(ssrContextKey, {})
  paidApp.mount({})
  apps.push(paidApp)
  await flush()
  assert.equal(checkout.attendeeRows.value.length, 4)
  checkout.form.value = {
    firstName: 'Buyer',
    lastName: 'Only',
    email: 'buyer@example.invalid',
    phone: '08000000000',
  }
  for (const row of checkout.attendeeRows.value)
    checkout.attendeeAnswers.value[`${row.key}:name`] = `Actual seat ${row.seat_index}`
  await checkout.pay()
  assert.equal(submitted.attendees.length, 4)
  assert.equal(submitted.attendees[3].seat_index, 3)
  assert.equal(submitted.attendees[0].answers.name, 'Actual seat 0')
  assert.equal(submitted.attendees[0].ticket_type_id, 3)
  await checkout.handleOrder({
    public_id: 'paid-order',
    status: 'payment_failed',
    items: [
      {
        event_id: 11,
        ticket_type_id: 3,
        ticket_name: 'Historical table',
        quantity: 1,
        people_per_unit: 4,
        registration_schema: schema,
      },
    ],
    total_minor: 10000,
  })
  assert.equal(
    checkout.attendeePayload()[3].answers.name,
    'Actual seat 3',
    'Failed attempts retain their historical attendee schema and original answers',
  )
  paidApp.unmount()
  api.defaults.adapter = originalAdapter
  role = 'owner'
  const { default: Door } = await server.ssrLoadModule(
    '/src/components/event-workspace/WorkspaceDoorCheckin.vue',
  )
  let doorState
  const doorApp = renderer.createApp({
    setup() {
      doorState = Door.setup(
        { eventId: 1, overview: { event: { title: 'Real event' } } },
        { expose: () => {}, emit: () => {} },
      )
      return () => null
    },
  })
  doorApp.use(pinia)
  doorApp.use(router)
  doorApp.provide(ssrContextKey, {})
  doorApp.mount({})
  apps.push(doorApp)
  await flush()
  doorState.scanDialog.value = {
    showModal() {
      this.open = true
    },
    close() {
      this.open = false
    },
  }
  await doorState.cameraFound('server-issued-credential-xxxxxxxxxxxxxxxxxxxxxxxx')
  assert.equal(
    doorState.scanGuest.value.ticket_public_id,
    'public-ticket',
    'Camera input invalidation must complete before server lookup',
  )
  doorApp.unmount()
  console.log(
    'PASS paid checkout collects every table seat and camera scans reach indexed server lookup',
  )

  console.log(
    'PASS free registration Vue flow uses canonical availability, one answer set per guest, no invented product ID and no payment popup',
  )
  console.log(
    'PASS shared authorised pages, server totals, paginated lookup, uncertain scan retry across remount, credential-free storage, account isolation, minimal door scope and camera permission/unmount cleanup',
  )
} finally {
  for (const app of apps) if (app._container) app.unmount()
  await server.close()
}
