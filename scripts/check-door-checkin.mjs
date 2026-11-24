import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

const values = new Map()
let blockStorage = false
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem(key, value) {
    if (blockStorage) throw new Error('Storage blocked')
    values.set(key, value)
  },
}
globalThis.location = new URL('http://localhost:5174/')
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom',
})
try {
  const { default: Door } = await server.ssrLoadModule(
    '/src/components/event-workspace/WorkspaceDoorCheckin.vue',
  )
  const { default: Workspace } = await server.ssrLoadModule(
    '/src/components/event-workspace/EventWorkspace.vue',
  )
  const { previewEvent, previewOverview } = await server.ssrLoadModule(
    '/src/services/dashboardPreview.js',
  )
  const { useWorkspaceAttendees } = await server.ssrLoadModule(
    '/src/components/event-workspace/attendeesModel.js',
  )
  const model = useWorkspaceAttendees(900001, 'paid')
  const warnings = []
  async function capture(query = {}, shell = false) {
    let state, attendee
    const navigation = [],
      notices = []
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { render: () => null } }],
    })
    await router.push({ path: '/', query: { view: 'checkin', ...query } })
    const app = createSSRApp(
      shell ? Workspace : Door,
      shell
        ? {
            view: 'checkin',
            event: previewEvent,
            overview: previewOverview,
            events: [previewEvent],
          }
        : {
            eventId: 900001,
            overview: previewOverview,
            onNavigate: (value) => navigation.push(value),
            onNotify: (value) => notices.push(value),
          },
    )
    app.use(createPinia()).use(router)
    app.config.warnHandler = (message) => warnings.push(message)
    app.mixin({
      created() {
        if (this.$.type.__name === 'WorkspaceDoorCheckin') state = this.$.setupState
        if (this.$.type.__name === 'WorkspaceAttendees') attendee = this.$.setupState
      },
    })
    const html = await renderToString(app)
    return { state, attendee, html, navigation, notices }
  }
  const start = await capture()
  assert.match(start.html, /Activate door check-in/)
  assert.ok(!start.html.includes('Guest activity'))
  const ada = model.guests.value[0]
  assert.equal(start.state.record(ada, 'in'), false, 'activation is required')
  start.state.activate()
  assert.equal(start.state.active, true)
  const list = await capture()
  assert.match(list.html, /Guest activity/)
  assert.equal(list.state.filteredGuests.length, 12)
  list.state.search = 'RH-4103'
  assert.equal(list.state.filteredGuests[0].name, 'Zainab Musa')
  list.state.search = ''
  list.state.viewGuest(ada)
  assert.equal(list.navigation.at(-1).view, 'checkin')
  assert.equal(list.navigation.at(-1).order, 'RHO-26001')
  assert.equal(list.navigation.at(-1).doorGuest, ada.id)
  assert.match(list.state.href(list.state.guestQuery(ada)), /view=checkin/)
  assert.equal(list.state.record(ada, 'in', 1), true)
  assert.equal(list.state.checkedIn, 1)
  assert.equal(list.state.insideNow, 1)
  assert.equal(list.state.record(ada, 'in', 1), false, 'a repeated scan cannot admit twice')
  assert.equal(model.movements.value.length, 1)
  assert.equal(list.state.record(ada, 'out', 1), true)
  assert.equal(list.state.insideNow, 0)
  assert.equal(list.state.checkedIn, 1, 'an exit keeps the earlier arrival')
  assert.equal(list.state.record(ada, 'out', 1), false)
  assert.equal(model.recordMovement('UNKNOWN', 'in').ok, false)
  blockStorage = true
  const before = model.movements.value.length
  assert.equal(list.state.record(ada, 'in', 1), false)
  assert.equal(
    model.movements.value.length,
    before,
    'failed persistence does not change arrival state',
  )
  blockStorage = false
  list.state.status = 'left'
  assert.equal(list.state.filteredGuests.length, 1)
  list.state.status = 'not-arrived'
  assert.equal(list.state.filteredGuests.length, 11)
  list.state.status = 'all'
  list.state.entranceFilter = '1'
  assert.equal(list.state.filteredGuests.length, 1)
  list.state.findTicket('rh-4101')
  assert.equal(list.state.scanGuest.id, ada.id)
  list.state.findTicket('INVALID')
  assert.equal(list.state.scanGuest, null)
  assert.match(list.state.scanError, /couldn’t find/)
  console.log(
    'PASS activation, search, entrance/status filters, scan lookup, duplicate prevention, shared arrivals and storage failure',
  )

  const paid = await capture(list.navigation.at(-1))
  assert.match(paid.html, /Purchase receipt/)
  assert.ok(paid.attendee.receiptFacts.some(([label]) => label === 'Amount paid'))
  paid.attendee.navigate('attendees')
  assert.deepEqual(paid.navigation.at(-1), { view: 'checkin' })
  paid.attendee.openHistory(ada)
  assert.equal(paid.navigation.at(-1).view, 'checkin')
  assert.equal(paid.navigation.at(-1).history, ada.id)
  const history = await capture(paid.navigation.at(-1))
  assert.match(history.html, /Ada Okafor’s visits/)
  history.attendee.historyBack()
  assert.equal(history.navigation.at(-1).view, 'checkin')
  assert.equal(history.navigation.at(-1).doorGuest, ada.id)
  model.setMode('free')
  const free = await capture({ doorGuest: ada.id, guest: ada.id, order: 'RHO-26001' })
  assert.match(free.html, /Registration details/)
  assert.ok(!free.attendee.receiptFacts.some(([label]) => label === 'Amount paid'))
  assert.ok(!free.html.includes('Purchase receipt'))
  assert.ok(!free.html.includes('₦'))
  assert.ok(!free.html.includes('>Paid<'))
  const freeList = await capture()
  assert.match(freeList.html, /Registrations/)
  console.log(
    'PASS paid/free guest records, no financial fields for free events, in-section history and return navigation',
  )

  model.setMode('paid')
  const manage = await capture({ entrance: '1' })
  Object.assign(manage.state.entranceForm, { name: 'VIP entrance', contacts: [] })
  manage.state.saveEntrance()
  assert.match(manage.state.formError, /already have/)
  Object.assign(manage.state.entranceForm, {
    name: 'Main entrance renamed',
    contacts: [{ name: 'Door team', email: 'door@example.com', phone: '' }],
  })
  manage.state.saveEntrance()
  assert.equal(
    manage.state.entranceCount(manage.state.entrances[0]),
    1,
    'renaming retains historical entry totals',
  )
  const updated = await capture({ entrance: '1' })
  assert.equal(updated.state.entranceForm.name, 'Main entrance renamed')
  updated.state.viewGuest(ada)
  const fromEntrance = await capture(updated.navigation.at(-1))
  assert.equal(fromEntrance.state.currentEntrance, 1)
  fromEntrance.attendee.navigate('attendees')
  assert.deepEqual(fromEntrance.navigation.at(-1), { view: 'checkin', entrance: '1' })
  const adding = await capture({ entrance: 'new' })
  Object.assign(adding.state.entranceForm, { name: 'Side entrance', contacts: [] })
  adding.state.saveEntrance()
  assert.equal(adding.state.entrances.length, 3)
  assert.equal(adding.navigation.at(-1).view, 'checkin')
  assert.equal(adding.navigation.at(-1).entrance, '3')
  const shell = await capture({ doorGuest: ada.id, guest: ada.id, order: 'RHO-26001' }, true)
  assert.match(shell.html, /aria-current="page"[^>]*>[\s\S]*?Door check-in/)
  assert.equal(warnings.length, 0, warnings.join('\n'))
  console.log(
    'PASS entrance create/edit, staff validation, rename history, entrance return context and Vue warnings',
  )
} finally {
  await server.close()
}
