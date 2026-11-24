import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createRouter, createMemoryHistory } from 'vue-router'

const storage = new Map()
globalThis.localStorage = {
  getItem: (k) => storage.get(k) ?? null,
  setItem: (k, v) => storage.set(k, v),
}
const server = await createServer({
  configFile: false,
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom',
})
try {
  const { default: Earnings } = await server.ssrLoadModule(
    '/src/components/event-workspace/WorkspaceEarnings.vue',
  )
  const { previewOverview } = await server.ssrLoadModule('/src/services/dashboardPreview.js')
  const { buildEarnings, defaultEarningsCodes, snapshotAmount } = await server.ssrLoadModule(
    '/src/components/event-workspace/earningsModel.js',
  )
  const { useWorkspaceAttendees } = await server.ssrLoadModule(
    '/src/components/event-workspace/attendeesModel.js',
  )
  const attendees = useWorkspaceAttendees(900001, 'paid')
  const warnings = []
  async function capture(query = {}, overview = previewOverview, eventId = 900001) {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/dashboard/events/:id', component: { render: () => null } }],
    })
    await router.push({ path: `/dashboard/events/${eventId}`, query: { view: 'payout', ...query } })
    const navigation = [],
      states = {}
    const app = createSSRApp(Earnings, { overview, eventId, onNavigate: (v) => navigation.push(v) })
    app.use(router)
    app.config.warnHandler = (warning) => warnings.push(warning)
    app.mixin({
      created() {
        states[this.$.type.__name] = this.$.setupState
      },
    })
    const html = await renderToString(app)
    return {
      html,
      state: states.WorkspaceEarnings,
      details: states.WorkspaceEarningsDetails,
      payouts: states.WorkspaceEarningsPayouts,
      navigation,
      router,
    }
  }
  const input = {
    overview: previewOverview,
    preview: true,
    codes: defaultEarningsCodes,
    guests: attendees.guests.value,
    orders: attendees.orders.value,
  }
  const model = buildEarnings(input)
  assert.equal(model.stats().count, 412)
  assert.equal(model.stats().paid + model.stats().saved, model.stats().gross)
  assert.equal(model.buyers().length, 12)
  assert.equal(model.buyers({ code: 'SUNSET10', tier: 'vip' }).length, 1)
  const oldPaid = model.buyers().find((p) => p.ticket.id === 'RH-4101').paid
  const changed = buildEarnings({
    ...input,
    codes: [{ ...defaultEarningsCodes[0], value: 95, active: false }],
    overview: {
      ...previewOverview,
      ticket_types: previewOverview.ticket_types.map((t) => ({ ...t, price_minor: 99 })),
    },
  })
  assert.equal(changed.buyers().find((p) => p.ticket.id === 'RH-4101').paid, oldPaid)
  assert.equal(changed.stats({ code: 'SUNSET10' }).paid, model.stats({ code: 'SUNSET10' }).paid)
  assert.equal(snapshotAmount(2200000, 'VIPNIGHT'), 2000000)
  const configured = buildEarnings({
    ...input,
    codes: [...defaultEarningsCodes, { code: 'NEWCODE', eligible: ['2'] }],
    links: [{ label: 'Telegram', source_code: 'telegram' }],
  })
  assert.equal(configured.codeRows('general').find((c) => c.code === 'NEWCODE').stats.count, 0)
  assert.ok(!configured.codeRows('early').some((c) => c.code === 'NEWCODE'))
  assert.equal(configured.sourceRows().find((s) => s.source === 'telegram').links.length, 1)
  assert.equal(configured.sourceRows().find((s) => s.source === 'telegram').stats.count, 0)
  const live = buildEarnings({ ...input, preview: false })
  assert.equal(live.buyers().length, 0)
  assert.equal(live.codeRows()[0].stats.paid, null)
  assert.equal(live.stats({ tier: 'general' }).paid, previewOverview.ticket_types[1].revenue_minor)
  assert.equal(live.stats({ channel: 'wa' }).paid, previewOverview.sources[0].revenue_minor)
  assert.equal(live.stats({ tier: 'general', channel: 'wa' }).paid, null)
  console.log(
    'PASS original purchase snapshots, attribution scopes, configured codes/links and production data boundaries',
  )

  const start = await capture()
  assert.match(start.html, /See who bought your tickets/)
  assert.ok(
    !/<template[\s>]/.test(start.html),
    'earnings content must render outside inert HTML template elements',
  )
  storage.set('rushhour:event-workspace:900001:sharing-links', 'invalid-json')
  await start.state.loadLinks()
  assert.match(start.state.linksError, /couldn’t load/)
  storage.set(
    'rushhour:event-workspace:900001:sharing-links',
    JSON.stringify([{ label: 'Telegram', source_code: 'telegram' }]),
  )
  await start.state.loadLinks()
  assert.equal(start.state.linksError, '')
  assert.equal(start.state.model.sourceRows().find((s) => s.source === 'telegram').links.length, 1)
  start.state.openTier(previewOverview.ticket_types[1])
  assert.deepEqual(start.navigation.at(-1), { view: 'payout', screen: 'ticket', tier: 'general' })
  start.state.selectTab('social')
  assert.deepEqual(start.navigation.at(-1), { view: 'payout', tab: 'social' })
  for (const tab of ['sales', 'discounts', 'social', 'payouts']) {
    const result = await capture({ tab })
    assert.equal(result.state.tab, tab)
    assert.match(
      result.html,
      new RegExp(
        `earnings-panel-${tab}|rhe-payouts|Money made with each code|Which social links brought in sales`,
      ),
    )
  }
  const code = await capture({ screen: 'code', code: 'SUNSET10' })
  assert.match(code.html, /About SUNSET10/)
  assert.match(code.html, /Ada Okafor/)
  assert.ok(!code.html.includes('Chidi Eze'), 'unrelated buyers stay out of code results')
  assert.equal(code.details.breakdownRows[0].cells.at(-1).query.code, 'SUNSET10')
  const source = await capture({ screen: 'source', channel: 'whatsapp' })
  assert.match(source.html, /Sales from WhatsApp/)
  assert.ok(source.details.breakdownRows.every((r) => r.cells.at(-1).query.channel === 'whatsapp'))
  const scoped = await capture({ screen: 'ticket', tier: 'vip', code: 'SUNSET10' })
  assert.equal(scoped.details.filteredPeople.length, 1)
  assert.equal(scoped.details.back.values.screen, 'code')
  const personLink = scoped.details.peopleRows(scoped.details.filteredPeople)[0].cells.at(-1)
  assert.match(personLink.href, /view=payout/)
  const person = await capture(personLink.query)
  assert.match(person.html, /Ada Okafor’s ticket/)
  assert.equal(person.details.back.values.screen, 'ticket')
  assert.equal(person.details.back.values.code, 'SUNSET10')
  person.details.go(person.details.back.values)
  assert.equal(person.navigation.at(-1).tier, 'vip')
  const buyers = await capture({ screen: 'buyers' })
  buyers.details.search = 'ada.okafor@example.com'
  assert.equal(
    buyers.details.filteredPeople.length,
    3,
    'buyer email also finds guests on the same order',
  )
  buyers.details.search = 'RHO-26001'
  assert.equal(
    buyers.details.filteredPeople.length,
    3,
    'search includes the buyer’s order and its guests',
  )
  buyers.details.search = 'not-a-real-buyer'
  assert.equal(buyers.details.filteredPeople.length, 0)
  for (const query of [
    { screen: 'ticket', tier: 'missing' },
    { screen: 'code', code: 'missing' },
    { screen: 'source', channel: 'missing' },
    { screen: 'person', ticket: 'missing' },
  ])
    assert.match((await capture(query)).html, /couldn’t find this record/)
  const restored = await capture({ screen: 'ticket', tier: 'vip', channel: 'whatsapp' })
  assert.equal(restored.details.scope.channel, 'whatsapp')
  assert.equal((await capture({ tab: 'social' })).state.tab, 'social')
  console.log(
    'PASS all four tabs, code/source/ticket/person pages, scoped back links, buyer search and URL restoration',
  )

  const payout = await capture({ tab: 'payouts' })
  payout.payouts.showForm()
  assert.equal(payout.payouts.editing, true)
  Object.assign(payout.payouts.form, { bank: 'GTBank', number: '123', holder: 'Sample organiser' })
  assert.equal(payout.payouts.saveBank(), false)
  Object.assign(payout.payouts.form, { number: '0123456789' })
  assert.equal(payout.payouts.saveBank(), true)
  assert.equal(payout.payouts.bank.holder, 'Sample organiser')
  payout.payouts.showForm()
  payout.payouts.form.holder = 'Changed'
  payout.payouts.closeForm()
  assert.equal(payout.payouts.bank.holder, 'Sample organiser', 'cancel keeps saved details')
  assert.ok(
    ![...storage.keys()].some((key) => key.includes('bank')),
    'sample bank details are not persisted',
  )
  start.state.toggleAmounts()
  const masked = await capture({ screen: 'person', ticket: 'RH-4101' })
  assert.match(masked.html, /••••••/)
  assert.ok(!masked.html.includes('19,800'))
  const free = await capture(
    { tab: 'payouts' },
    { ...previewOverview, event: { ...previewOverview.event, ticket_mode: 'free' } },
    900009,
  )
  assert.match(free.html, /This event is free/)
  assert.ok(
    !free.html.includes('Amount paid') &&
      !free.html.includes('Add bank account') &&
      !free.html.includes('rhe-tabs'),
  )
  assert.equal(warnings.length, 0, warnings.join('\n'))
  console.log(
    'PASS payout form validation/save/edit/cancel, payment privacy, free-event guard and Vue render warnings',
  )
} finally {
  await server.close()
  delete globalThis.localStorage
}
