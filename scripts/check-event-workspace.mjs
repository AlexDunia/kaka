import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

const values = new Map()
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
}
globalThis.location = new URL('http://localhost:5175/')
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { default: Workspace } = await server.ssrLoadModule(
    '/src/components/event-workspace/EventWorkspace.vue',
  )
  const { default: Views } = await server.ssrLoadModule(
    '/src/components/event-workspace/WorkspaceViews.vue',
  )
  const { previewEvent, previewOverview } = await server.ssrLoadModule(
    '/src/services/dashboardPreview.js',
  )
  const warnings = []
  async function render(props) {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { render: () => null } },
        { path: '/events/:id-:slug', name: 'event-details', component: { render: () => null } },
      ],
    })
    await router.push('/')
    const app = createSSRApp(Workspace, {
      view: 'overview',
      event: previewEvent,
      overview: previewOverview,
      events: [previewEvent],
      ...props,
    })
    app.use(createPinia()).use(router)
    app.config.warnHandler = (message) => warnings.push(message)
    return renderToString(app)
  }
  for (const view of [
    'events',
    'event-page',
    'overview',
    'attendees',
    'share',
    'promo',
    'email',
    'checkin',
    'payout',
    'settings',
  ]) {
    const html = await render({ view })
    assert.ok(html.includes('event-workspace'), view)
    assert.ok(!html.includes('NaN'), `${view}: invalid number`)
    assert.ok(!html.includes('<iframe'), `${view}: must render native Vue`)
    assert.ok(!html.includes('rushhour.example'), `${view}: placeholder public link`)
    console.log(`PASS ${view}`)
  }
  const overview = await render({})
  const sidebar = overview.slice(overview.indexOf('<aside'), overview.indexOf('</aside>'))
  assert.ok(sidebar.indexOf('workspace-sidebar-header') < sidebar.indexOf('rh-side-current-event'))
  assert.ok(sidebar.indexOf('rh-side-current-event') < sidebar.indexOf('workspace-sidebar-scroll'))
  assert.ok(sidebar.indexOf('workspace-sidebar-scroll') < sidebar.indexOf('rh-side-links'))
  assert.ok(sidebar.indexOf('workspace-sidebar-scroll') < sidebar.indexOf('rh29-side-footer'))
  for (const label of [
    'Overview',
    'Attendees',
    'Promote',
    'Discount codes',
    'Message attendees',
    'Door check-in',
    'My earnings',
    'Settings',
  ])
    assert.ok(sidebar.includes(`>${label}</span>`), label)
  assert.match(overview, /Sales at a glance/)
  assert.match(overview, /₦4\.4M/)
  assert.match(overview, /Sales performance/)
  const zero = structuredClone(previewOverview)
  zero.ticket_types = []
  zero.sources = []
  zero.sales_trend = {}
  zero.sales.units_sold = 0
  zero.revenue.total_minor = 0
  assert.ok((await render({ overview: zero })).includes('Your sales trend will appear'))
  assert.ok((await render({ loading: true })).includes('Getting your event ready'))
  assert.ok((await render({ error: 'Try again.' })).includes('We couldn’t load your event.'))
  assert.ok(
    (await render({ event: null, overview: null, events: [] })).includes('Your events start here.'),
  )
  assert.deepEqual(warnings, [], 'Vue runtime warnings')
  console.log('PASS zero-sales, loading, error, no-events, native rendering and Vue warnings')

  let state, attendeeState
  const behaviorApp = createSSRApp(Views, {
    page: 'attendees',
    eventId: previewEvent.id,
    overview: previewOverview,
  })
  const behaviorRouter = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { render: () => null } },
      { path: '/events/:id-:slug', name: 'event-details', component: { render: () => null } },
    ],
  })
  await behaviorRouter.push('/')
  behaviorApp.use(createPinia()).use(behaviorRouter)
  behaviorApp.mixin({
    created() {
      if (this.$.type.__name === 'WorkspaceViews') state = this.$.setupState
      if (this.$.type.__name === 'WorkspaceAttendees') attendeeState = this.$.setupState
    },
  })
  await renderToString(behaviorApp)
  assert.ok(state, 'workspace state is available to the render check')
  assert.equal(attendeeState.filteredOrders.length, 9)
  attendeeState.search = 'Zainab'
  assert.equal(
    attendeeState.filteredOrders.length,
    1,
    'search finds a guest inside a grouped purchase',
  )
  attendeeState.search = 'no-such-guest'
  assert.equal(attendeeState.filteredOrders.length, 0)
  attendeeState.search = ''
  attendeeState.attendeeSource = 'discount'
  assert.equal(attendeeState.filteredOrders.length, 5, 'purchase-source filter')
  attendeeState.attendeeSource = 'all'
  const code = { active: true, used: 0, limit: 10 }
  assert.equal(state.codeStatus(code), 'available')
  assert.equal(state.codeStatus({ ...code, active: false }), 'paused')
  assert.equal(state.codeStatus({ ...code, start: '2099-01-01' }), 'scheduled')
  assert.equal(state.codeStatus({ ...code, end: '2000-01-01' }), 'expired')
  assert.equal(state.codeStatus({ ...code, used: 10 }), 'used-up')
  console.log('PASS grouped purchase search, attribution filters and five discount statuses')
} finally {
  await server.close()
}
