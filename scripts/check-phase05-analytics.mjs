import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createRenderer, nextTick, ssrContextKey } from 'vue'
import { createPinia } from 'pinia'
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
globalThis.document = { visibilityState: 'visible' }
globalThis.localStorage = { getItem: () => null, setItem: () => {} }
const flush = async () => {
  for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0))
  await nextTick()
}
let app
try {
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const { useDashboardStore } = await server.ssrLoadModule('/src/stores/dashboard.js')
  const { default: Overview } = await server.ssrLoadModule(
    '/src/components/event-workspace/WorkspaceOverview.vue',
  )
  const response = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} })
  const pinia = createPinia(),
    store = useDashboardStore(pinia)
  let release
  api.defaults.adapter = (config) =>
    new Promise((resolve) => {
      release = () => resolve(response(config, { data: { sales: { units_sold: 1 } } }))
    })
  const old = store.fetchOverview(7)
  await flush()
  store.invalidateOverview(7)
  release()
  await old
  assert.equal(
    store.getOverview(7),
    null,
    'Invalidated in-flight aggregates cannot repopulate the cache',
  )
  assert.equal(store.isOverviewLoading(7), false)
  api.defaults.adapter = async (config) => response(config, { data: { sales: { units_sold: 2 } } })
  await store.fetchOverview(7)
  assert.equal(store.getOverview(7).sales.units_sold, 2)
  const calls = []
  api.defaults.adapter = async (config) => {
    calls.push(config)
    return response(config, {
      data: [{ id: 1 }],
      total: 123,
      current_page: 1,
      per_page: 1,
      last_page: 123,
    })
  }
  let state
  app = renderer.createApp({
    setup() {
      state = Overview.setup(
        {
          overview: {
            event: { id: 7, ticket_mode: 'free' },
            sales: { units_sold: 0 },
            metrics: {
              by_currency: [{ currency: 'NGN', orders: 3, admissions_covered: 123 }],
              actual_attendance: 8,
            },
          },
        },
        { expose: () => {}, emit: () => {} },
      )
      return () => null
    },
  })
  app.use(pinia)
  app.provide(ssrContextKey, {})
  app.mount({})
  await flush()
  assert.equal(
    state.registrations.value,
    null,
    'Production overview does not create a preview or paginated attendee model',
  )
  assert.equal(
    state.registrationGuestTotal.value,
    123,
    'Guest total uses server event-wide admission coverage',
  )
  assert.equal(state.arrivedGuests.value, 8, 'Arrival totals use authoritative event-wide metrics')
  assert.equal(calls.length, 0)
  app.unmount()
  app = null
  console.log(
    'PASS invalidated aggregate requests, fresh canonical cache, server guest totals with bounded reads and no invented production arrival counts',
  )
} finally {
  app?.unmount()
  await server.close()
}
