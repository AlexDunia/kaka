import assert from 'node:assert/strict'
import { createSSRApp, nextTick } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createServer } from 'vite'

const stored = new Map()
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, value),
}
globalThis.location = new URL('http://localhost:5174/')
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { default: Workspace } = await server.ssrLoadModule(
    '/src/components/event-workspace/EventWorkspace.vue',
  )
  const { previewEvent, previewOverview } = await server.ssrLoadModule(
    '/src/services/dashboardPreview.js',
  )
  const { useWorkspaceAttendees, visitSessions } = await server.ssrLoadModule(
    '/src/components/event-workspace/attendeesModel.js',
  )
  const model = useWorkspaceAttendees(previewEvent.id)
  const warnings = []
  async function capture(query = { view: 'attendees' }) {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
    })
    await router.push({ path: `/dashboard/events/${previewEvent.id}`, query })
    const navigations = [],
      notifications = []
    const app = createSSRApp(Workspace, {
      view: query.view || 'attendees',
      event: previewEvent,
      overview: previewOverview,
      events: [previewEvent],
      onNavigate: (v) => navigations.push(v),
      onNotify: (v) => notifications.push(v),
    })
    app.use(createPinia()).use(router)
    let state, shell
    app.mixin({
      created() {
        if (this.$.type.__name === 'WorkspaceAttendees') state = this.$.setupState
        if (this.$.type.__name === 'EventWorkspace') shell = this.$.setupState
      },
    })
    app.config.warnHandler = (message) => warnings.push(message)
    const html = await renderToString(app)
    return { state, shell, html, router, navigations, notifications }
  }
  const all = await capture()
  assert.equal(all.state.filteredOrders.length, 9)
  assert.equal(all.state.shownTickets.length, 12)
  all.state.search = '  Zainab  '
  assert.equal(all.state.filteredOrders.length, 1)
  assert.equal(all.state.shownTickets.length, 3, 'search retains the whole purchase')
  assert.equal(all.state.matchingGuests(all.state.filteredOrders[0]), 'Zainab Musa')
  all.state.search = 'VIP'
  assert.equal(all.state.filteredOrders.length, 3, 'ticket type is searchable')
  all.state.search = ''
  all.state.tier = 'Early bird'
  assert.equal(all.state.filteredOrders.length, 3)
  all.state.clearFilters()
  assert.equal(all.state.filteredOrders.length, 9)
  assert.deepEqual(all.navigations.at(-1), { view: 'attendees' })
  const discount = await capture({ view: 'attendees', source: 'discount' })
  assert.equal(discount.state.filteredOrders.length, 5)
  assert.equal(discount.state.shownTickets.length, 8)
  const social = await capture({ view: 'attendees', source: 'social' })
  assert.equal(social.state.filteredOrders.length, 7)
  assert.equal(social.state.shownTickets.length, 10)
  const code = await capture({ view: 'attendees', source: 'discount', code: 'sunset10' })
  assert.equal(code.state.filteredOrders.length, 2)
  assert.equal(code.state.shownTickets.length, 4)
  assert.match(code.state.title, /SUNSET10/)
  const channel = await capture({ view: 'attendees', source: 'social', channel: 'whatsapp' })
  assert.equal(channel.state.filteredOrders.length, 3)
  assert.equal(channel.state.shownTickets.length, 5)
  assert.match(channel.state.title, /WhatsApp link/)
  const week = await capture({ view: 'attendees', period: 'week' })
  assert.equal(week.state.filteredOrders.length, 3)
  assert.equal(week.state.shownTickets.length, 6)
  console.log(
    'PASS grouped search, ticket/arrival filters, code/channel deep links and matching summary totals',
  )

  model.movements.value.push(
    { id: 'RH-4101', kind: 'in', at: '2026-11-23T18:00:00+01:00', entrance: 'Main entrance' },
    { id: 'RH-4101', kind: 'out', at: '2026-11-23T19:00:00+01:00', entrance: 'Main entrance' },
  )
  all.state.arrival = 'checked'
  assert.equal(all.state.filteredOrders.length, 1, 'a guest who left still counts as arrived')
  assert.equal(all.state.arrived, 1)
  all.state.arrival = 'complete'
  assert.equal(all.state.filteredOrders.length, 0)
  assert.deepEqual(
    visitSessions(model.visits('RH-4101')).map((s) => [s.entry.kind, s.exit?.kind]),
    [['in', 'out']],
  )
  console.log('PASS arrivals persist after exit and visit history pairs entries/exits')

  const order = model.orders.value[0]
  all.state.openPurchase(order)
  assert.deepEqual(all.navigations.at(-1), { view: 'purchase', order: order.id })
  const purchase = await capture({ view: 'purchase', order: order.id })
  assert.equal(purchase.state.purchaseGuests.length, 3)
  assert.equal(purchase.shell.activeView, 'attendees')
  assert.match(purchase.html, /Purchase details for Ada Okafor/)
  assert.match(purchase.html, /Purchase receipt/)
  assert.match(purchase.html, /rh-v25-primary-guest/)
  assert.match(purchase.html, /2 more guests/)
  assert.ok(!purchase.html.includes('workspace-overlay'), 'purchase content is a routed page')
  assert.equal(model.orderTotal(order), 4000000, 'reference purchase snapshot is ₦40,000')
  const fakeDialog = () => ({
    open: false,
    showModal() {
      this.open = true
    },
    close() {
      this.open = false
    },
  })
  purchase.state.editDialog = fakeDialog()
  purchase.state.openEdit(model.guests.value[0])
  assert.equal(purchase.state.editDialog.open, true)
  Object.assign(purchase.state.edit, { name: 'Ada Guest', email: 'ada.guest@example.com' })
  purchase.state.saveGuest()
  assert.equal(purchase.state.editDialog.open, false)
  assert.equal(model.guests.value[0].name, 'Ada Guest')
  assert.equal(
    model.orders.value[0].buyer,
    'Ada Okafor',
    'buyer receipt identity remains unchanged',
  )
  assert.equal(model.orders.value[0].email, 'ada.okafor@example.com')
  assert.equal(model.guests.value[0].type, 'VIP')
  assert.equal(model.activity.value['RH-4101'][0].kind, 'edit')
  assert.ok(
    JSON.parse(stored.get(`rushhour:event-workspace:${previewEvent.id}:guests`))[0].name ===
      'Ada Guest',
  )
  purchase.state.alertDialog = fakeDialog()
  purchase.state.openAlert(model.guests.value[2])
  Object.assign(purchase.state.alert, {
    self: 'organiser@example.com',
    teammate: 'teammate@example.com',
  })
  purchase.state.saveArrivalAlert()
  assert.equal(purchase.state.alertDialog.open, false)
  assert.deepEqual(model.alerts.value['RH-4103'], {
    self: 'organiser@example.com',
    teammate: 'teammate@example.com',
  })
  purchase.state.resend(model.guests.value[2])
  assert.match(purchase.notifications.at(-1), /No email was sent/)
  purchase.state.openHistory(model.guests.value[0])
  assert.deepEqual(purchase.navigations.at(-1), { view: 'checkin', history: 'RH-4101' })
  const history = await capture({ view: 'checkin', history: 'RH-4101' })
  assert.match(history.html, /Ada Guest’s visits/)
  assert.equal(history.state.sessions.length, 1)
  assert.ok(!history.html.includes('id="rh-v26-history-only" hidden'))
  history.state.historyBack()
  assert.deepEqual(history.navigations.at(-1), {
    view: 'purchase',
    order: order.id,
    guest: 'RH-4101',
  })
  const absent = await capture({ view: 'purchase', order: 'missing' })
  assert.match(absent.html, /We couldn’t find this purchase/)
  console.log(
    'PASS routed purchase/receipt, guest edits, immutable buyer, arrival preferences and dedicated history',
  )

  all.state.changeMode('free')
  assert.equal(model.mode.value, 'free')
  assert.equal(stored.get(`rushhour:event-workspace:${previewEvent.id}:attendee-mode`), '"free"')
  const free = await capture({ view: 'attendees', source: 'discount' })
  assert.equal(free.state.attendeeSource, 'all')
  assert.equal(free.state.filteredOrders.length, 9)
  assert.equal(free.state.shownTickets.length, 12)
  assert.match(free.html, /data-rh-attendee-event-type="free"/)
  assert.equal(
    free.shell.visibleGroups
      .flatMap((g) => g.items)
      .some((i) => ['payout', 'promo'].includes(i.key)),
    false,
  )
  const registration = await capture({ view: 'purchase', order: order.id })
  assert.match(registration.html, /Registration summary for Ada Okafor/)
  assert.equal(registration.state.receiptFacts[3][1], 'Free')
  assert.equal(model.orderTotal(order), 0)
  const freeSocial = await capture({ view: 'attendees', source: 'social' })
  assert.equal(freeSocial.state.filteredOrders.length, 7)
  assert.match(freeSocial.state.title, /registered through/)
  all.state.changeMode('paid')
  assert.equal(model.mode.value, 'paid')
  assert.equal(model.orderTotal(order), 4000000)
  await nextTick()
  assert.deepEqual(warnings, [])
  console.log(
    'PASS free/paid switching, reset semantics, free social links, registration receipts and Vue warnings',
  )
} finally {
  await server.close()
}
