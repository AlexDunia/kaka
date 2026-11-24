import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia, setActivePinia } from 'pinia'
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
globalThis.sessionStorage = localStorage
globalThis.window = new EventTarget()
window.location = { href: 'http://localhost:5174/' }
globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible' })
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})
try {
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const { useAuthStore } = await server.ssrLoadModule('/src/stores/auth.js')
  const { useDashboardStore } = await server.ssrLoadModule('/src/stores/dashboard.js')
  const { useEventStore } = await server.ssrLoadModule('/src/stores/events.js')
  const { default: Events } = await server.ssrLoadModule(
    '/src/components/event-workspace/WorkspaceEvents.vue',
  )
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().user = { id: 1 }
  const calls = []
  api.defaults.adapter = async (config) => {
    calls.push(config)
    const data =
      config.url === '/dashboard/events'
        ? { data: [{ id: 31, title: 'Second page' }], current_page: 2, last_page: 3, total: 65 }
        : { data: [], meta: { total: 0, last_page: 1 } }
    return { config, status: 200, statusText: 'OK', headers: {}, data }
  }
  const app = createSSRApp({
    setup() {
      const state = Events.setup(
        { events: Array.from({ length: 30 }, (_, i) => ({ id: i + 1 })), overview: null },
        { expose() {}, emit() {} },
      )
      assert.equal(state.recent.value.length, 0)
      return () => null
    },
  })
  app.use(pinia)
  await renderToString(app)
  assert.equal(
    calls.length,
    0,
    'Event list must not start per-event polling or dashboard aggregation',
  )
  const dashboard = useDashboardStore()
  await dashboard.fetchEvents({ page: 2 })
  assert.deepEqual(calls.at(-1).params, { page: 2, per_page: 30 })
  assert.equal(dashboard.events[0].id, 31)
  assert.equal(dashboard.eventsLastPage, 3)
  assert.equal(dashboard.eventsTotal, 65)
  dashboard.reset()
  assert.equal(dashboard.eventsPage, 1)
  assert.equal(dashboard.eventsTotal, 0)
  const events = useEventStore()
  await events.searchEvents('Evening', '12', 2, 12, 'date-asc')
  assert.equal(calls.at(-1).url, '/events')
  assert.equal(calls.at(-1).params.category_id, '12')
  assert.equal(events.events.length, 0)
  assert.equal(events.totalItems, 0)
  console.log(
    'PASS no owner-list request fan-out, bounded canonical pagination, reset isolation and one shared discovery response contract',
  )
} finally {
  await server.close()
}
