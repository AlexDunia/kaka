import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'
import { createSSRApp, nextTick } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createMemoryHistory, createRouter } from 'vue-router'
const storage = () => {
  const values = new Map()
  return {
    getItem: (k) => values.get(k) ?? null,
    setItem: (k, v) => values.set(k, String(v)),
    removeItem: (k) => values.delete(k),
  }
}
globalThis.window = new EventTarget()
globalThis.localStorage = storage()
window.localStorage = localStorage
globalThis.sessionStorage = storage()
window.sessionStorage = sessionStorage
window.scrollTo = () => {}
globalThis.requestAnimationFrame = () => 0
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})
let count = 0
const check = async (label, run) => {
  await run()
  count++
  console.log(`PASS ${label}`)
}
try {
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const service = await server.ssrLoadModule('/src/services/createEventService.js')
  const { hydrateEditorForm } = await server.ssrLoadModule('/src/utils/eventEditor.js')
  const dates = await server.ssrLoadModule('/src/utils/eventDateTime.js')
  const { normalizeEventProfile } = await server.ssrLoadModule('/src/utils/eventProfile.js')
  const { getPublicEvents } = await server.ssrLoadModule('/src/services/publicCatalog.js')
  const { useEventStore } = await server.ssrLoadModule('/src/stores/events.js')
  const { useDashboardStore } = await server.ssrLoadModule('/src/stores/dashboard.js')
  const saved = {
    version: 5,
    title: 'Evening together',
    timeZone: 'America/New_York',
    startsAt: '2027-11-07T06:30:00+00:00',
    startsAtLocal: '2027-11-07T01:30:00',
    endsAt: '2027-11-07T09:00:00+00:00',
    endsAtLocal: '2027-11-07T04:00:00',
    format: 'in-person',
    city: 'Lagos',
    venue: 'Event venue',
    category: 'Music & Concert',
    eventType: 'one_time',
    ticketMode: 'paid',
    coverImage: 'https://example.invalid/cover.jpg',
    secondaryImages: [],
    attendeeFields: [],
    extraDetails: [],
    tickets: [
      {
        id: 20,
        name: 'General',
        unitType: 'individual',
        color: '#ec4899',
        price: 5000,
        units: 10,
        peoplePerUnit: 1,
        maxPerPerson: null,
        visible: true,
        inventory: {
          configured_capacity_units: 10,
          sold_units: 3,
          reserved_units: 2,
          available_units: 5,
          admission_capacity: 10,
        },
        salesStart: '2027-11-07T05:00:00Z',
        salesStartLocal: '2027-11-07T01:00:00',
        salesEnd: null,
        salesEndLocal: null,
      },
      {
        id: 21,
        name: 'Table',
        unitType: 'table',
        color: '#ec4899',
        price: 20000,
        units: 0,
        peoplePerUnit: 4,
        maxPerPerson: 1,
        visible: false,
        inventory: {
          configured_capacity_units: 0,
          sold_units: 0,
          reserved_units: 0,
          available_units: 0,
          admission_capacity: 0,
        },
      },
    ],
  }
  const record = (form = saved, version = form.version) => ({
    data: { id: 7, version, status: 'draft', form: { ...form, version } },
  })
  let handler = () => record()
  const calls = []
  api.defaults.adapter = async (config) => {
    calls.push(config)
    return { data: await handler(config), status: 200, config, headers: {} }
  }
  setActivePinia(createPinia())
  await check('hydration keeps persisted IDs, configured capacity and inventory', () => {
    const form = hydrateEditorForm(saved)
    assert.equal(form.version, 5)
    assert.deepEqual(
      form.tickets.map((t) => t.id),
      [20, 21],
    )
    assert.equal(form.tickets[0].units, 10)
    assert.equal(form.tickets[0].inventory.available_units, 5)
  })
  await check(
    'new UI ticket keys never become persisted IDs; decimals and zero capacity survive',
    () => {
      const form = hydrateEditorForm(saved)
      form.tickets.push({ ...form.tickets[0], id: 'new-1', price: '12.30', units: 0 })
      form.freeCapacity = 0
      const payload = service.buildCreateEventPayload(form)
      assert.equal(payload.tickets[0].id, 20)
      assert.equal('id' in payload.tickets[2], false)
      assert.equal(payload.tickets[2].price, '12.30')
      assert.equal(payload.tickets[2].units, 0)
      assert.equal(payload.freeCapacity, 0)
      assert.equal(payload.tickets[0].maxPerPerson, null)
    },
  )
  await check(
    'unchanged repeated DST hours preserve their saved offset; edits send only local time',
    () => {
      const form = hydrateEditorForm(saved)
      const payload = service.buildCreateEventPayload(form)
      assert.equal(payload.startsAt, saved.startsAt)
      assert.equal('startsAtLocal' in payload, false)
      assert.equal(payload.tickets[0].salesStart, saved.tickets[0].salesStart)
      form.startsAt = dates.fromLocalDateTimeString('2027-11-07T02:00:00')
      const edited = service.buildCreateEventPayload(form)
      assert.equal(edited.startsAtLocal, '2027-11-07T02:00:00')
      assert.equal('startsAt' in edited, false)
      assert.equal(dates.toLocalDateTimeString(null), null)
    },
  )
  await check('IANA timezone conversion and validation support save/reopen wall clocks', () => {
    assert.equal(
      dates.toLocalDateTimeString(dates.instantToLocalDate(saved.startsAt, 'Africa/Lagos')),
      '2027-11-07T07:30:00',
    )
    assert.equal(dates.isValidTimeZone('Africa/Lagos'), true)
    assert.equal(dates.isValidTimeZone('Invalid/Zone'), false)
  })
  await check(
    'complete wizard updates explicitly replace and carry the saved version',
    async () => {
      handler = () => record(saved, 6)
      await service.updateEventDraft(7, hydrateEditorForm(saved))
      const body = JSON.parse(calls.at(-1).data)
      assert.equal(body.version, 5)
      assert.equal(body.ticketCollectionMode, 'replace')
      assert.equal(body.tickets.length, 2)
    },
  )
  await check(
    'workspace product and profile patches merge without unrelated ticket/media arrays',
    async () => {
      await service.patchEvent(7, { tickets: [{ id: 20, price: '6000.00', units: 10 }] }, 6)
      const body = JSON.parse(calls.at(-1).data)
      assert.equal(body.tickets.length, 1)
      assert.equal('ticketCollectionMode' in body, false)
      assert.equal('secondaryImages' in body, false)
      await service.patchEvent(
        7,
        { publicProfile: { summary: 'An evening together', faqs: [] } },
        6,
      )
      const profile = JSON.parse(calls.at(-1).data)
      assert.equal(profile.publicProfile.summary, 'An evening together')
      assert.equal('tickets' in profile, false)
    },
  )
  await check('publish sends only the last saved revision', async () => {
    await service.publishEvent(7, 6)
    assert.deepEqual(JSON.parse(calls.at(-1).data), { version: 6 })
  })
  await check(
    'successful writes invalidate public and dashboard caches; failures retain them',
    async () => {
      const events = useEventStore(),
        dashboard = useDashboardStore()
      events.currentEvent = { id: 7 }
      dashboard.eventsLoaded = true
      dashboard.overviewByEvent = { 7: { data: { event: { id: 7 } }, fetchedAt: Date.now() } }
      await service.patchEvent(7, { title: 'Saved' }, 6)
      assert.equal(events.currentEvent, null)
      assert.equal(dashboard.eventsLoaded, false)
      assert.equal(dashboard.getOverview(7), null)
      events.currentEvent = { id: 7 }
      handler = (config) => {
        if (config.url === '/sanctum/csrf-cookie') return {}
        const error = new Error('Conflict')
        error.response = { status: 409, data: { message: 'Reload first' } }
        error.config = calls.at(-1)
        throw error
      }
      const before = calls.length
      await assert.rejects(service.patchEvent(7, { title: 'Unsaved' }, 5))
      assert.equal(calls.filter((c) => c.method === 'patch').length > 0, true)
      assert.equal(calls.length - before, 2)
      assert.equal(events.currentEvent.id, 7)
    },
  )
  await check('discovery sends all filters and requests exactly one matching page', async () => {
    handler = () => ({ data: [{ id: 77 }], meta: { total: 37, last_page: 4 } })
    const before = calls.length
    const result = await getPublicEvents({
      q: 'evening food',
      city: 'Abuja',
      category: '12',
      page: 3,
      sort: 'date-asc',
    })
    assert.equal(calls.length - before, 1)
    assert.deepEqual(calls.at(-1).params, {
      q: 'evening food',
      city: 'Abuja',
      category_id: '12',
      page: 3,
      per_page: 12,
      sort: 'date-asc',
    })
    assert.equal(result.total, 37)
    assert.equal(result.pages, 4)
  })
  await check('paid zero-stock, hidden and retired products never imply free admission', () => {
    const base = { id: 7, ticket_mode: 'paid', price: 0, ends_at: '2030-01-01T20:00:00Z' }
    assert.equal(normalizeEventProfile(base).price, null)
    assert.equal(normalizeEventProfile(base).canBuy, false)
    const profile = normalizeEventProfile({
      ...base,
      ticket_types: [
        {
          id: 20,
          name: 'General',
          price: '5000.00',
          quantity: 10,
          available_quantity: 0,
          configured_capacity_units: 10,
          sold_units: 8,
          reserved_units: 2,
        },
        { id: 21, price: 1, visible: false },
        { id: 22, price: 1, retired_at: '2026-01-01' },
      ],
    })
    assert.equal(profile.tickets.length, 1)
    assert.equal(profile.tickets[0].remaining, 0)
    assert.equal(profile.tickets[0].configured, 10)
    assert.equal(profile.canBuy, false)
    assert.equal(normalizeEventProfile({ ...base, ticket_mode: 'free' }).price, 0)
  })
  await check('recurring metadata never extends an ended event commerce window', () => {
    const profile = normalizeEventProfile({
      id: 7,
      ticket_mode: 'paid',
      event_type: 'recurring',
      date: '2020-01-01T10:00:00Z',
      ends_at: '2020-01-01T20:00:00Z',
      recurrence: { frequency: 'daily' },
      ticket_types: [{ id: 20, price: 5, available_quantity: 9 }],
    })
    assert.equal(profile.salesEnded, true)
    assert.equal(profile.canBuy, false)
  })
  const { default: Wizard } = await server.ssrLoadModule('/src/pages/CreateEvent.vue')
  let wizard
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { render: () => null } },
      { path: '/create-event', name: 'CreateEvent', component: Wizard },
      { path: '/events/:id-:slug', name: 'event-details', component: { render: () => null } },
    ],
  })
  await router.push('/create-event')
  const app = createSSRApp(Wizard)
  app.use(createPinia()).use(router)
  app.mixin({
    created() {
      if (this.$.type.__name === 'CreateEvent') wizard = this.$.setupState
    },
  })
  await renderToString(app)
  await check('wizard saves replace temporary IDs with returned IDs and revisions', async () => {
    handler = (config) => (config.url === '/sanctum/csrf-cookie' ? {} : record(saved, 6))
    wizard.addTicket()
    assert.match(wizard.form.tickets[0].id, /^new-/)
    await wizard.persistDraft()
    await nextTick()
    assert.deepEqual(
      wizard.form.tickets.map((t) => t.id),
      [20, 21],
    )
    assert.equal(wizard.form.version, 6)
  })
  await check(
    'wizard conflict loads the saved event while keeping unsaved inputs and blocking stale retries',
    async () => {
      wizard.form.title = 'My unsaved event'
      handler = (config) => {
        if (config.method === 'patch') {
          const e = new Error('Conflict')
          e.response = { status: 409, data: { message: 'Event changed' } }
          e.config = config
          throw e
        }
        return config.url === '/sanctum/csrf-cookie'
          ? {}
          : record({ ...saved, title: 'Other saved event' }, 8)
      }
      await wizard.saveDraft()
      assert.equal(wizard.conflict, true)
      assert.equal(wizard.form.title, 'My unsaved event')
      assert.equal(wizard.conflictRecord.form.title, 'Other saved event')
      const before = calls.length
      await wizard.saveDraft()
      assert.equal(calls.length, before)
      await wizard.reloadConflictedEvent()
      await nextTick()
      assert.equal(wizard.form.title, 'Other saved event')
      assert.equal(wizard.form.version, 8)
    },
  )
  await check(
    'wizard rejects unsupported and oversized image uploads before reading them',
    async () => {
      const before = wizard.form.coverImage
      await wizard.handleFiles([
        { type: 'image/svg+xml', size: 100 },
        { type: 'image/png', size: 6 * 1024 * 1024 },
      ])
      assert.equal(wizard.form.coverImage, before)
    },
  )
  const { default: Workspace } = await server.ssrLoadModule(
    '/src/components/event-workspace/WorkspaceViews.vue',
  )
  const { previewOverview } = await server.ssrLoadModule('/src/services/dashboardPreview.js')
  let workspace
  handler = (config) => (config.url === '/sanctum/csrf-cookie' ? {} : record(saved, 5))
  const workspaceApp = createSSRApp(Workspace, {
    page: 'settings',
    eventId: 7,
    overview: { ...structuredClone(previewOverview), event: { ...previewOverview.event, id: 7 } },
  })
  workspaceApp.use(createPinia()).use(router)
  workspaceApp.mixin({
    created() {
      if (this.$.type.__name === 'WorkspaceViews') workspace = this.$.setupState
    },
  })
  await renderToString(workspaceApp)
  await new Promise((resolve) => setTimeout(resolve, 0))
  await check(
    'workspace edits one product with its configured capacity and returned revision',
    async () => {
      await workspace.editTicket(workspace.settingsTickets[0])
      assert.equal(workspace.ticketForm.capacity, 10)
      workspace.ticketForm.price = 6000.25
      workspace.ticketForm.capacity = 5
      handler = (config) =>
        config.url === '/sanctum/csrf-cookie'
          ? {}
          : record(
              {
                ...saved,
                tickets: saved.tickets.map((t) =>
                  t.id === 20 ? { ...t, price: 6000.25, units: 5 } : t,
                ),
              },
              6,
            )
      await workspace.saveTicket()
      const body = JSON.parse(calls.at(-1).data)
      assert.deepEqual(body, {
        tickets: [{ id: 20, price: '6000.25', units: 5, visible: true }],
        version: 5,
      })
      assert.equal(workspace.editableForm.version, 6)
      assert.equal(workspace.editableForm.tickets.length, 2)
    },
  )
  await check(
    'workspace details omit tickets/media and unchanged timezone-sensitive instants',
    async () => {
      workspace.details.name = 'Updated title'
      await workspace.saveDetails()
      const body = JSON.parse(calls.at(-1).data)
      assert.equal(body.title, 'Updated title')
      assert.equal('tickets' in body, false)
      assert.equal('startsAtLocal' in body, false)
      assert.equal('secondaryImages' in body, false)
    },
  )
  await check(
    'workspace 428 keeps unsaved details and reloads a revision without replaying the mutation',
    async () => {
      workspace.details.name = 'Unsaved details'
      handler = (config) => {
        if (config.method === 'patch') {
          const error = new Error('Revision required')
          error.response = { status: 428, data: { message: 'Reload first' } }
          error.config = config
          throw error
        }
        return config.url === '/sanctum/csrf-cookie'
          ? {}
          : record({ ...saved, title: 'Latest saved details' }, 9)
      }
      await workspace.saveDetails()
      assert.equal(workspace.conflict, true)
      assert.equal(workspace.details.name, 'Unsaved details')
      assert.equal(workspace.conflictRecord.version, 9)
      const before = calls.length
      await workspace.saveDetails()
      assert.equal(calls.length, before)
      await workspace.reloadConflictedEvent()
      assert.equal(workspace.details.name, 'Latest saved details')
      assert.equal(workspace.editableForm.version, 9)
    },
  )
  await check(
    'device DST gaps do not change event-local picker values or saved instants',
    async () => {
      const oldZone = process.env.TZ
      try {
        process.env.TZ = 'America/New_York'
        const local = dates.fromLocalDateTimeString('2027-03-14T02:30:00')
        assert.equal(dates.toLocalDateTimeString(local), '2027-03-14T02:30:00')
        const { default: PickerInput } = await server.ssrLoadModule(
          '/src/components/DateTimePickerInput.vue',
        )
        const html = await renderToString(
          createSSRApp(PickerInput, { modelValue: local, dateFormat: 'YYYY-MM-DD' }),
        )
        assert.match(html, /2027-03-14 02:30 AM/)
        const { default: Picker } = await server.ssrLoadModule('/src/components/DateTimePicker.vue')
        let picker
        const app = createSSRApp(Picker, { initialDateTime: local })
        app.mixin({
          created() {
            if (this.$.type.__name === 'DateTimePicker') picker = this.$.setupState
          },
        })
        await renderToString(app)
        assert.equal(picker.hours, 2)
        picker.updateSelectedDateTime()
        assert.equal(dates.toLocalDateTimeString(picker.selectedDate), '2027-03-14T02:30:00')
      } finally {
        if (oldZone === undefined) delete process.env.TZ
        else process.env.TZ = oldZone
      }
    },
  )
  console.log(`${count} Phase 2 frontend checks passed`)
} finally {
  await server.close()
}
