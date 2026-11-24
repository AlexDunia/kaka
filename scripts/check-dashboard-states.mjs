import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createSSRApp, createRenderer, nextTick, ssrContextKey } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
globalThis.sessionStorage = globalThis.localStorage = {
  getItem: () => null,
  setItem() {},
  removeItem() {},
}
globalThis.window = Object.assign(new EventTarget(), {
  sessionStorage,
  location: { href: 'http://localhost:5174/' },
  clearTimeout,
  scrollTo() {},
})
globalThis.document = Object.assign(new EventTarget(), { visibilityState: 'visible' })
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})
const apps = []
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
const flush = async () => {
  for (let i = 0; i < 10; i++) await new Promise((r) => setTimeout(r, 0))
  await nextTick()
}
const routerFor = async (path) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/dashboard', name: 'dashboard', component: { render: () => null } },
      {
        path: '/dashboard/events/:eventId',
        name: 'dashboard-event',
        component: { render: () => null },
      },
      { path: '/create-event', name: 'CreateEvent', component: { render: () => null } },
      { path: '/events/:id-:slug', name: 'event-details', component: { render: () => null } },
    ],
  })
  await router.push(path)
  await router.isReady()
  return router
}
try {
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const { default: Workspace } = await server.ssrLoadModule(
    '/src/components/event-workspace/EventWorkspace.vue',
  )
  const { default: Dashboard } = await server.ssrLoadModule('/src/pages/Dashboard.vue')
  const { useAuthStore } = await server.ssrLoadModule('/src/stores/auth.js')
  const { useDashboardStore } = await server.ssrLoadModule('/src/stores/dashboard.js')
  const response = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} })
  let calls = [],
    mode = 'empty',
    release
  api.defaults.adapter = async (config) => {
    calls.push(config)
    if (mode === 'waiting')
      return new Promise((resolve) => {
        release = () =>
          resolve(response(config, { data: [], current_page: 1, last_page: 1, total: 0 }))
      })
    if (mode === 'error')
      throw {
        response: { status: 500, data: { message: 'Server error. Please try again later.' } },
      }
    if (config.url === '/dashboard/events')
      return response(config, {
        data: mode === 'owned' ? [{ id: 7, title: 'Real event' }] : [],
        current_page: 1,
        last_page: 1,
        total: mode === 'owned' ? 1 : 0,
      })
    if (config.url.includes('/42/overview'))
      throw { response: { status: 403, data: { message: 'Forbidden' } } }
    return response(config, { data: { event: { id: 7, title: 'Real event' }, sales: {} } })
  }
  async function render(props) {
    const app = createSSRApp(Workspace, {
      event: null,
      overview: null,
      events: [],
      loading: false,
      error: '',
      ...props,
    })
    app.use(createPinia()).use(await routerFor('/dashboard?view=share'))
    return renderToString(app)
  }
  for (const view of [
    'overview',
    'share',
    'promo',
    'attendees',
    'purchase',
    'email',
    'checkin',
    'payout',
    'settings',
    'events',
  ]) {
    const html = await render({ view })
    assert.match(html, /data-rh-page="events"/)
    assert.match(html, /Create your first event/)
    assert.ok(!html.includes('class="rh-side-current-event"'))
    assert.ok(!html.includes('aria-label="Event management navigation"'))
    assert.ok(!html.includes('nx-badge'))
    assert.ok(!html.includes('Upcoming events on this page'))
    assert.ok(!html.includes('Your events start here.'))
  }
  const error = await render({ view: 'share', error: 'Network unavailable' })
  assert.match(error, /Network unavailable/)
  assert.ok(!error.includes('Create your first event'))
  const loading = await render({ view: 'share', loading: true })
  assert.match(loading, /workspace-loading/)
  assert.ok(!loading.includes('Create your first event'))
  const missing = await render({
    view: 'overview',
    event: { id: 7, title: 'Real event' },
    overview: null,
    events: [{ id: 7, title: 'Real event' }],
  })
  assert.match(missing, /Reload event/)
  assert.ok(!missing.includes('Create your first event'))
  assert.ok(missing.includes('aria-label="Event management navigation"'))
  assert.ok(!missing.includes('nx-badge'))
  assert.ok(missing.includes('background-image:none'))
  const pinia = createPinia(),
    auth = useAuthStore(pinia),
    store = useDashboardStore(pinia)
  auth.user = { id: 1, name: 'New organiser' }
  const router = await routerFor('/dashboard?view=share')
  let state
  const app = renderer.createApp({
    setup() {
      state = Dashboard.setup({}, { expose() {}, emit() {} })
      return () => null
    },
  })
  app.use(pinia).use(router).provide(ssrContextKey, {})
  mode = 'waiting'
  calls = []
  app.mount({})
  apps.push(app)
  assert.equal(state.isDashboardLoading.value, true, 'An unread account is loading, not empty')
  await flush()
  release()
  await flush()
  assert.equal(
    router.currentRoute.value.query.view,
    'events',
    'No-event section links return to the designed account dashboard',
  )
  assert.equal(state.isDashboardLoading.value, false)
  assert.equal(
    calls.length,
    1,
    'A new account does not fetch event tools or fabricated notifications',
  )
  mode = 'owned'
  auth.user = { id: 2, name: 'Event owner' }
  await flush()
  assert.equal(store.events[0].id, 7, 'Account changes replace private cached records')
  mode = 'error'
  await state.loadDashboard()
  await flush()
  // Cached success may be reused; force the failed read explicitly on the next account.
  auth.user = { id: 3 }
  await flush()
  assert.ok(state.pageError.value)
  assert.equal(
    state.isDashboardLoading.value,
    false,
    'Failed requests end loading and show recovery',
  )
  assert.equal(store.events.length, 0)
  mode = 'owned'
  await router.push('/dashboard/events/42')
  await flush()
  assert.equal(
    router.currentRoute.value.params.eventId,
    '42',
    'A missing or forbidden direct event must never switch to another event',
  )
  assert.ok(state.pageError.value)
  assert.ok(calls.some((call) => call.url === '/dashboard/events/42/overview'))
  console.log(
    'PASS ten empty section links, real account dashboard, no placeholder event/badges/metrics, loading/error/retry distinction, cached-account isolation and protected direct-event recovery',
  )
} finally {
  apps.forEach((app) => app.unmount())
  await server.close()
}
