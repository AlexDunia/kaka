import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createSSRApp, nextTick } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

const values = new Map()
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
}
globalThis.location = new URL('http://localhost:5174/')
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const model = await server.ssrLoadModule('/src/components/event-workspace/overviewModel.js')
  const { previewOverview, previewEvent } = await server.ssrLoadModule(
    '/src/services/dashboardPreview.js',
  )
  const fixedNow = new Date('2026-11-23T23:30:00+01:00')
  assert.equal(
    model.daysUntilEvent(previewEvent, fixedNow),
    19,
    'calendar countdown ignores the stale sample count',
  )
  assert.equal(model.daysUntilEvent({ starts_at: '2026-11-24T00:01:00+01:00' }, fixedNow), 1)
  assert.equal(model.daysUntilEvent({ starts_at: 'bad date' }), null)
  assert.equal(model.overviewStage(previewEvent, fixedNow), 'on-sale')
  for (const [event, stage] of [
    [{ ...previewEvent, phase: 'draft' }, 'draft'],
    [{ ...previewEvent, starts_at: '2026-12-01T18:00:00+01:00' }, 'approaching'],
    [{ ...previewEvent, starts_at: '2026-11-23T18:00:00+01:00' }, 'event-day'],
    [{ ...previewEvent, phase: 'ended' }, 'completed'],
  ])
    assert.equal(model.overviewStage(event, fixedNow), stage)
  assert.match(model.overviewEventDate(previewEvent), /Saturday, 12 December 2026/)
  assert.match(model.overviewEventDate(previewEvent), /6:00 PM/)
  const ranked = model.leadingBuyerSources([
    { source_code: 'ig', buyers: 3 },
    { source_code: 'wa', buyers: 8 },
    { source_code: 'zero', buyers: 0 },
    { source_code: 'unattributed', buyers: 9 },
  ])
  assert.deepEqual(
    ranked.map((s) => s.source_code),
    ['wa', 'ig'],
  )
  assert.equal(model.clampPercent(140), 100)
  assert.equal(model.clampPercent(-2), 0)
  const chart = model.salesChart([
    { date: '2026-01-01', units_sold: -1 },
    { date: '2026-01-02', units_sold: Infinity },
  ])
  assert.ok(!/NaN|Infinity/.test(chart.line + chart.area))
  console.log('PASS event-local countdown, all five stages, referral ranking and chart edge cases')

  async function capture(path, props, query = '') {
    const { default: component } = await server.ssrLoadModule(path)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
    })
    await router.push(`/dashboard/events/${previewEvent.id}${query}`)
    const app = createSSRApp(component, props)
    let state
    app.use(createPinia()).use(router)
    app.mixin({
      created() {
        if (this.$.type.__name === component.__name) state = this.$.setupState
      },
    })
    const html = await renderToString(app)
    return { state, router, html }
  }
  const navigations = []
  const { state: overview, html } = await capture(
    '/src/components/event-workspace/WorkspaceOverview.vue',
    {
      overview: previewOverview,
      onNavigate: (value) => navigations.push(value),
    },
  )
  assert.equal((html.match(/<article class="metric(?: revenue-metric)?">/g) ?? []).length, 4)
  assert.doesNotMatch(html, /Sales performance|Reach &amp; audience|Good to know|What stands out|From visit to purchase/)
  for (const heading of ['Ticket sales', 'Where buyers find you', 'Visitors who buy tickets', 'Buying patterns', 'Sales highlights']) {
    assert.ok(html.includes(heading), `${heading} is shown`)
  }
  overview.navigate('settings', { tab: 'details' })
  overview.navigate('attendees', { period: 'week' })
  overview.navigate('event-page')
  assert.deepEqual(navigations, [
    { view: 'settings', tab: 'details' },
    { view: 'attendees', period: 'week' },
    'event-page',
  ])
  assert.deepEqual(overview.points, model.weeklySales(previewOverview.sales_trend.all))
  assert.match(html, /Sales by week/)
  assert.match(html, /Scroll to see more weeks/)
  assert.doesNotMatch(html, /Ticket sales over time|Daily trend|Last 30 days/)
  assert.equal(overview.selectedWeek, overview.points.at(-1).date)
  console.log('PASS Overview navigation and weekly sales graph')

  const { state: guests, router } = await capture(
    '/src/components/event-workspace/WorkspaceAttendees.vue',
    {
      page: 'attendees',
      overview: previewOverview,
      eventId: previewEvent.id,
    },
    '?view=attendees&period=week',
  )
  assert.equal(guests.filteredOrders.length, 3, 'weekly purchases are actually filtered')
  await router.push({ query: { view: 'attendees' } })
  assert.equal(guests.filteredOrders.length, 9, 'all purchases return after removing the filter')
  const { state: settings } = await capture(
    '/src/components/event-workspace/WorkspaceViews.vue',
    {
      page: 'settings',
      overview: previewOverview,
      eventId: previewEvent.id,
    },
    '?view=settings&tab=payments',
  )
  assert.equal(settings.settingsTab, 'payments')
  console.log('PASS weekly-sales destination filter and payout-account Settings deep link')

  globalThis.window = { sessionStorage: globalThis.localStorage, scrollTo() {} }
  const { useWorkspacePrivacy } = await server.ssrLoadModule(
    '/src/composables/useWorkspacePrivacy.js',
  )
  window.sessionStorage.setItem('rushhour-hide-amounts', 'yes')
  const privacy = useWorkspacePrivacy()
  assert.equal(privacy.amountsHidden.value, true, 'a new view restores session privacy')
  assert.match(overview.amount(100000), /\u2022{6}/)
  const { state: earnings } = await capture(
    '/src/components/event-workspace/WorkspaceEarnings.vue',
    { overview: previewOverview },
    '?view=payout&tab=payouts',
  )
  assert.equal(earnings.tab, 'payouts')
  assert.equal(earnings.hidden, true)
  earnings.toggleAmounts()
  assert.equal(overview.hidden, false)
  assert.equal(window.sessionStorage.getItem('rushhour-hide-amounts'), 'no')
  console.log('PASS saved session privacy and shared Overview/Earnings visibility')

  const actions = [],
    opens = []
  const { state: notifications } = await capture(
    '/src/components/event-workspace/WorkspaceNotifications.vue',
    {
      event: previewEvent,
      overview: previewOverview,
      page: 'overview',
      onNavigate: (action) => actions.push(action),
      'onOpen-change': (open) => opens.push(open),
    },
  )
  notifications.panel = {
    open: false,
    showModal() {
      this.open = true
    },
    close() {
      this.open = false
    },
  }
  notifications.toggle()
  assert.equal(notifications.panel.open, true)
  notifications.go({ view: 'settings', tab: 'payments' })
  assert.equal(notifications.panel.open, false)
  assert.deepEqual(actions, [{ view: 'settings', tab: 'payments' }])
  assert.deepEqual(opens, [true, false])
  notifications.markAllRead()
  assert.equal(notifications.unread, 0)
  const restored = await capture('/src/components/event-workspace/WorkspaceNotifications.vue', {
    event: previewEvent,
    overview: previewOverview,
    page: 'overview',
  })
  assert.equal(restored.state.unread, 0, 'read updates persist across remounts')
  const withoutSetup = await capture('/src/components/event-workspace/WorkspaceNotifications.vue', {
    event: previewEvent,
    overview: { ...previewOverview, setup: undefined },
    page: 'overview',
  })
  assert.deepEqual(
    withoutSetup.state.tasks.map((task) => task.id),
    ['cover'],
    'unknown account/setup status does not create tasks',
  )
  notifications.dismissReminder()
  assert.equal(notifications.showReminder, false)
  assert.equal(
    (
      await capture('/src/components/event-workspace/WorkspaceNotifications.vue', {
        event: previewEvent,
        overview: previewOverview,
        page: 'overview',
      })
    ).state.showReminder,
    false,
  )
  console.log(
    'PASS notification open/close actions, navigation, saved read state and reminder dismissal',
  )

  const { state: preview } = await capture(
    '/src/components/event-workspace/WorkspaceEventPreview.vue',
    { overview: previewOverview },
  )
  const tier = previewOverview.ticket_types[2]
  preview.change(tier, 20)
  assert.equal(preview.count, tier.available_units)
  assert.equal(preview.total, tier.available_units * tier.price_minor)
  preview.change(tier, -100)
  assert.equal(preview.count, 0)
  console.log('PASS event-preview ticket quantities, limits and subtotal')
  await nextTick()
} finally {
  delete globalThis.window
  await server.close()
}
