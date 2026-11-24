import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'

const storage = () => {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  }
}
globalThis.localStorage = storage()
globalThis.sessionStorage = storage()
globalThis.window = new EventTarget()
window.localStorage = localStorage
window.sessionStorage = sessionStorage
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
let checks = 0
const check = async (label, run) => {
  await run()
  checks++
  console.log(`PASS ${label}`)
}
const deferred = () => {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}
try {
  const {
    default: api,
    ensureCsrfCookie,
    getApiErrorMessage,
  } = await server.ssrLoadModule('/src/api/axios.js')
  const { default: events } = await server.ssrLoadModule('/src/services/eventService.js')
  const { useAuthStore } = await server.ssrLoadModule('/src/stores/auth.js')
  const { useDashboardStore } = await server.ssrLoadModule('/src/stores/dashboard.js')
  const { useEventStore } = await server.ssrLoadModule('/src/stores/events.js')
  const { useCartStore } = await server.ssrLoadModule('/src/stores/cart.js')
  const { DASHBOARD_PREVIEW } = await server.ssrLoadModule('/src/services/dashboardPreview.js')
  const { staticEvents } = await server.ssrLoadModule('/src/services/staticEventCatalog.js')
  const { getPublicEvents } = await server.ssrLoadModule('/src/services/publicCatalog.js')
  const { createEventDraft, updateEventDraft, publishEvent } = await server.ssrLoadModule(
    '/src/services/createEventService.js',
  )
  const { quoteCheckout } = await server.ssrLoadModule('/src/services/checkoutService.js')
  setActivePinia(createPinia())
  const calls = []
  let handler = () => ({})
  api.defaults.adapter = async (config) => {
    calls.push(config)
    const data = await handler(config)
    return { data, status: 200, statusText: 'OK', headers: {}, config }
  }
  const fail = (status, data = {}) => {
    const error = new Error('Request failed')
    error.response = { status, data }
    error.config = calls.at(-1)
    throw error
  }
  const user = { id: 1, name: 'Test organiser', email: 'test@example.invalid', role: 'user' }
  await check('demo is disabled and the static catalog is empty by default', () => {
    assert.equal(DASHBOARD_PREVIEW, false)
    assert.deepEqual(staticEvents, [])
  })
  await check('central cookie credentials, XSRF and JSON configuration', () => {
    assert.equal(api.defaults.baseURL, '/api')
    assert.equal(api.defaults.withCredentials, true)
    assert.equal(api.defaults.withXSRFToken, true)
    assert.equal(api.defaults.headers.Accept, 'application/json')
  })
  await check('concurrent CSRF calls share a single request', async () => {
    const gate = deferred()
    handler = () => gate.promise
    const before = calls.length
    const requests = [ensureCsrfCookie(), ensureCsrfCookie()]
    gate.resolve({})
    await Promise.all(requests)
    assert.equal(calls.length - before, 1)
  })
  await check('empty and failed event responses never become fixtures', async () => {
    handler = () => ({ data: [], meta: { total: 0, last_page: 1 } })
    assert.deepEqual((await events.getAllEvents()).data, [])
    handler = () => fail(500)
    await assert.rejects(events.getAllEvents())
    await assert.rejects(events.getEventById(900001))
  })
  await check('invalid event IDs are rejected before sending requests', async () => {
    const before = calls.length
    for (const id of ['1oops', 0, -1, 'sample']) await assert.rejects(events.getEventById(id))
    assert.equal(calls.length, before)
  })
  await check('public discovery uses the shared Laravel resource and pagination', async () => {
    handler = () => ({
      data: [{ id: 2, title: 'Live event', status: 'active' }],
      meta: { total: 13, last_page: 2 },
    })
    const result = await getPublicEvents({ page: 2 })
    assert.equal(result.events[0].id, 2)
    assert.equal(result.pages, 2)
    assert.deepEqual(calls.at(-1).params, { page: 2, per_page: 12 })
  })
  const auth = useAuthStore(),
    dashboard = useDashboardStore(),
    eventStore = useEventStore()
  await check('browser-stored users cannot authenticate a session', async () => {
    localStorage.setItem('user', JSON.stringify(user))
    handler = () => fail(401)
    await auth.initialize({ force: true })
    assert.equal(auth.isAuthenticated, false)
    assert.equal(localStorage.getItem('user'), null)
  })
  await check('email login verifies the authoritative user after CSRF and login', async () => {
    calls.length = 0
    handler = (config) => (config.url === '/user' ? user : { user })
    await auth.login('test@example.invalid', 'password')
    assert.equal(auth.user.id, 1)
    assert.deepEqual(
      calls.map((call) => call.url),
      ['/sanctum/csrf-cookie', '/login', '/user'],
    )
  })
  await check('validation, ownership, rate limits and server errors stay recoverable', async () => {
    assert.equal(
      getApiErrorMessage({ response: { status: 422, data: { errors: 'Choose a ticket.' } } }),
      'Choose a ticket.',
    )
    assert.equal(
      getApiErrorMessage({
        response: { status: 422, data: { errors: { title: ['Add a title.'] } } },
      }),
      'Add a title.',
    )
    for (const status of [403, 429, 500]) {
      handler = () => fail(status, { message: status === 500 ? 'private exception' : undefined })
      await assert.rejects(
        api.get('/test'),
        (error) => Boolean(error.userMessage) && !error.userMessage.includes('private exception'),
      )
    }
    assert.equal(auth.isAuthenticated, true)
  })
  await check(
    '419 clears account state and refreshes CSRF without replaying a mutation',
    async () => {
      calls.length = 0
      handler = (config) => (config.url === '/sanctum/csrf-cookie' ? {} : fail(419))
      await assert.rejects(api.post('/create-event', {}))
      await new Promise((resolve) => setTimeout(resolve, 0))
      assert.equal(calls.filter((call) => call.method === 'post').length, 1)
      assert.equal(calls.filter((call) => call.url === '/sanctum/csrf-cookie').length, 1)
      assert.equal(auth.isAuthenticated, false)
      assert.deepEqual(dashboard.events, [])
    },
  )
  await check('favourites use paginated cookie requests and CSRF for toggles', async () => {
    handler = () => ({ data: [], meta: { current_page: 2, last_page: 2 } })
    const result = await eventStore.fetchLikedEvents(2)
    assert.equal(calls.at(-1).url, '/user/liked-events')
    assert.equal(calls.at(-1).params.page, 2)
    assert.equal(result.meta.current_page, 2)
    await eventStore.toggleLike(2)
    assert.equal(calls.at(-1).url, '/events/2/toggle-like')
  })
  await check('late public detail responses cannot replace a newer event', async () => {
    const first = deferred(),
      second = deferred()
    handler = (config) => (config.url === '/events/1' ? first.promise : second.promise)
    const a = eventStore.fetchEventById(1, true),
      b = eventStore.fetchEventById(2, true)
    second.resolve({ data: { id: 2 } })
    await b
    first.resolve({ data: { id: 1 } })
    await a
    assert.equal(eventStore.currentEvent.id, 2)
  })
  await check('dashboard event switching keeps responses keyed to their event', async () => {
    const first = deferred(),
      second = deferred()
    handler = (config) => (config.url.includes('/1/') ? first.promise : second.promise)
    const a = dashboard.fetchOverview(1),
      b = dashboard.fetchOverview(2)
    second.resolve({ data: { event: { id: 2 } } })
    await b
    first.resolve({ data: { event: { id: 1 } } })
    await a
    assert.equal(dashboard.getOverview(1).event.id, 1)
    assert.equal(dashboard.getOverview(2).event.id, 2)
  })
  await check(
    'logout invalidates late account responses while preserving cart selections',
    async () => {
      const gate = deferred()
      handler = (config) => (config.url === '/dashboard/events' ? gate.promise : {})
      const pending = dashboard.fetchEvents({ force: true })
      const cart = useCartStore()
      cart.addItem({ eventId: 2, ticketId: 20, quantity: 1 })
      await auth.logout()
      gate.resolve({ data: [{ id: 1 }] })
      await pending
      assert.deepEqual(dashboard.events, [])
      assert.equal(dashboard.eventsLoaded, false)
      assert.equal(cart.items.length, 1)
    },
  )
  await check('account switching clears previous event metrics', async () => {
    handler = (config) => (config.url === '/user' ? { ...user, id: 2 } : {})
    await auth.login('second@example.invalid', 'password')
    assert.equal(auth.user.id, 2)
    assert.equal(dashboard.getOverview(1), null)
  })
  await check('retired event writers fail honestly without sending legacy payloads', async () => {
    const before = calls.length
    await assert.rejects(events.createEvent({}))
    await assert.rejects(events.updateEvent(1, {}))
    await assert.rejects(events.deleteEvent(1))
    assert.equal(calls.length, before)
  })
  await check(
    'canonical editor creation, update and publish preserve camelCase payloads',
    async () => {
      const form = {
        title: 'Real event',
        version: 5,
        secondaryImages: [],
        tickets: [],
        attendeeFields: [],
        extraDetails: [],
      }
      handler = () => ({
        data: { id: 3, status: 'draft', version: 6, form: { ...form, version: 6 } },
      })
      await createEventDraft(form)
      assert.equal(calls.at(-1).url, '/create-event')
      await updateEventDraft(3, form)
      assert.equal(calls.at(-1).method, 'patch')
      await publishEvent(3, 6)
      assert.equal(calls.at(-1).url, '/create-event/3/publish')
    },
  )
  await check('checkout quotes stay on the server-authoritative endpoint', async () => {
    handler = () => ({ data: { total_minor: 250000, currency: 'NGN' } })
    const result = await quoteCheckout([{ ticket_type_id: 20, quantity: 1 }])
    assert.equal(calls.at(-1).url, '/checkout/quote')
    assert.equal(result.total_minor, 250000)
  })
  await check(
    'a newer refresh wins over an older response for the same dashboard event',
    async () => {
      const older = deferred(),
        newer = deferred()
      let count = 0
      handler = () => (++count === 1 ? older.promise : newer.promise)
      const a = dashboard.fetchOverview(3, { force: true })
      const b = dashboard.fetchOverview(3, { force: true })
      newer.resolve({ data: { event: { id: 3, title: 'Latest title' } } })
      await b
      older.resolve({ data: { event: { id: 3, title: 'Old title' } } })
      await a
      assert.equal(dashboard.getOverview(3).event.title, 'Latest title')
    },
  )
  console.log(`${checks} Phase 1B checks passed`)
} finally {
  await server.close()
}
