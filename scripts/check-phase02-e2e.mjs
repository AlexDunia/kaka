import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'
// This runner is intentionally restricted to the disposable local test server.
const origin = 'http://127.0.0.1:8012'
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})
globalThis.window = new EventTarget()
const values = new Map()
globalThis.localStorage = {
  getItem: (k) => values.get(k) ?? null,
  setItem: (k, v) => values.set(k, String(v)),
  removeItem: (k) => values.delete(k),
}
try {
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const service = await server.ssrLoadModule('/src/services/createEventService.js')
  const { hydrateEditorForm } = await server.ssrLoadModule('/src/utils/eventEditor.js')
  const { normalizeEventProfile } = await server.ssrLoadModule('/src/utils/eventProfile.js')
  const { getPublicEvents } = await server.ssrLoadModule('/src/services/publicCatalog.js')
  const { useAuthStore } = await server.ssrLoadModule('/src/stores/auth.js')
  api.defaults.baseURL = `${origin}/api`
  api.defaults.headers.common.Origin = 'http://localhost:5174'
  api.defaults.headers.common.Referer = 'http://localhost:5174/'
  const cookies = new Map()
  api.interceptors.request.use((config) => {
    if (cookies.size)
      config.headers.Cookie = [...cookies].map(([key, value]) => `${key}=${value}`).join('; ')
    if (cookies.has('XSRF-TOKEN'))
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(cookies.get('XSRF-TOKEN'))
    return config
  })
  const remember = (response) => {
    for (const raw of response.headers['set-cookie'] || []) {
      const pair = raw.split(';')[0]
      const i = pair.indexOf('=')
      cookies.set(pair.slice(0, i), pair.slice(i + 1))
    }
    return response
  }
  api.interceptors.response.use(remember, (error) => {
    if (error.response) remember(error.response)
    throw error
  })
  setActivePinia(createPinia())
  const auth = useAuthStore(),
    email = `phase02-${Date.now()}@example.invalid`,
    password = 'Phase02-test-password-948!'
  await auth.register({ name: 'Phase 2 test organiser', email, password })
  assert.ok(auth.user.id)
  console.log('PASS real Sanctum registration and session verification in isolated database')
  const categories = (await api.get('/categories')).data.data
  const category = categories[0].name
  let response = await service.createEventDraft({
    title: 'Lifecycle round trip',
    secondaryImages: [],
    tickets: [],
    attendeeFields: [],
    extraDetails: [],
  })
  let saved = response.data
  assert.equal(saved.version, 1)
  console.log('PASS incomplete draft creation returns persisted form and revision')
  let form = hydrateEditorForm(saved.form)
  Object.assign(form, {
    title: 'Lifecycle round trip',
    format: 'in-person',
    venue: 'Test venue',
    city: 'Abuja',
    venueTimezone: 'America/New_York',
    category,
    ticketMode: 'paid',
    coverImage: 'https://example.invalid/phase02-cover.jpg',
  })
  const dates = await server.ssrLoadModule('/src/utils/eventDateTime.js')
  form.startsAt = dates.fromLocalDateTimeString('2027-11-07T01:30:00')
  form.endsAt = dates.fromLocalDateTimeString('2027-11-07T04:00:00')
  form.tickets = [
    {
      id: 'new-1',
      name: 'General',
      price: '5000.00',
      units: 10,
      peoplePerUnit: 1,
      unitType: 'individual',
      maxPerPerson: 2,
      visible: true,
      color: '#ec4899',
    },
    {
      id: 'new-2',
      name: 'Gold table',
      price: '20000.00',
      units: 3,
      peoplePerUnit: 4,
      unitType: 'table',
      maxPerPerson: 1,
      visible: true,
      color: '#ec4899',
    },
  ]
  saved = (await service.updateEventDraft(saved.id, form)).data
  const ids = saved.form.tickets.map((t) => t.id)
  assert.ok(ids.every(Number.isInteger))
  assert.equal(saved.version, 2)
  const reopened = (await service.getEventForEditing(saved.id)).data
  assert.equal(reopened.form.startsAtLocal, '2027-11-07T01:30:00')
  form = hydrateEditorForm(reopened.form)
  saved = (await service.updateEventDraft(saved.id, form)).data
  assert.deepEqual(
    saved.form.tickets.map((t) => t.id),
    ids,
  )
  assert.equal(saved.form.startsAt, reopened.form.startsAt)
  console.log('PASS full wizard save/reopen keeps assigned ticket IDs and repeated-DST instant')
  saved = (
    await service.patchEvent(
      saved.id,
      {
        publicProfile: {
          summary: 'An evening together',
          faqs: [{ question: 'Where?', answer: 'At the test venue.' }],
        },
      },
      saved.version,
    )
  ).data
  saved = (await service.publishEvent(saved.id, saved.version)).data
  assert.equal(saved.status, 'active')
  let detail = (await api.get(`/events/${saved.id}`)).data.data
  assert.equal(detail.public_profile.summary, 'An evening together')
  assert.equal(detail.ticket_types.length, 2)
  assert.equal(detail.date.slice(0, 10), '2027-11-07')
  console.log('PASS versioned profile save, publish and real public display resource')
  const previousVersion = saved.version
  saved = (
    await service.patchEvent(
      saved.id,
      { tickets: [{ id: ids[0], price: '6000.25', units: 0 }] },
      saved.version,
    )
  ).data
  assert.equal(saved.form.tickets.length, 2)
  assert.equal(saved.form.tickets[0].inventory.available_units, 0)
  detail = (await api.get(`/events/${saved.id}`)).data.data
  const profile = normalizeEventProfile(detail, new Date('2027-01-01T00:00:00Z'))
  assert.equal(profile.tickets.find((t) => t.id === ids[0]).price, 6000.25)
  assert.equal(profile.tickets.find((t) => t.id === ids[0]).available, false)
  assert.ok(profile.tickets.find((t) => t.id === ids[1]).available)
  console.log(
    'PASS narrow product edit preserves the other product and displays current price and zero stock',
  )
  await assert.rejects(
    service.patchEvent(saved.id, { title: 'Stale edit' }, previousVersion),
    (e) => e.response?.status === 409,
  )
  await assert.rejects(
    service.patchEvent(saved.id, { title: 'No version' }),
    (e) => e.response?.status === 428,
  )
  await assert.rejects(
    service.patchEvent(saved.id, { tickets: [{ id: 999999, name: 'Foreign' }] }, saved.version),
    (e) => e.response?.status === 422,
  )
  await assert.rejects(
    service.patchEvent(saved.id, { tickets: [{ id: ids[1], units: -1 }] }, saved.version),
    (e) => e.response?.status === 422,
  )
  await assert.rejects(
    service.patchEvent(saved.id, { startsAtLocal: '2027-03-14T02:30:00' }, saved.version),
    (e) => e.response?.status === 422,
  )
  assert.equal((await service.getEventForEditing(saved.id)).data.version, saved.version)
  console.log(
    'PASS stale/missing revisions, invalid IDs/capacity and nonexistent DST times do not mutate the event',
  )
  const filtered = await getPublicEvents({
    q: 'Lifecycle round trip',
    city: 'abuja',
    category: String(categories[0].id),
    page: 1,
  })
  assert.equal(filtered.total, 1)
  assert.equal(filtered.events[0].id, saved.id)
  const empty = await getPublicEvents({ q: 'unmatched search phrase', city: 'Abuja', page: 1 })
  assert.equal(empty.total, 0)
  console.log('PASS server-filtered search, exact city, category and pagination')
  form = hydrateEditorForm(saved.form)
  form.tickets = form.tickets.filter((t) => t.id === ids[1])
  saved = (await service.updateEventDraft(saved.id, form)).data
  detail = (await api.get(`/events/${saved.id}`)).data.data
  assert.deepEqual(
    detail.ticket_types.map((t) => t.id),
    [ids[1]],
  )
  saved = (
    await service.patchEvent(saved.id, { tickets: [{ id: ids[1], visible: false }] }, saved.version)
  ).data
  detail = (await api.get(`/events/${saved.id}`)).data.data
  assert.equal(detail.ticket_types.length, 0)
  assert.equal(normalizeEventProfile(detail).price, null)
  console.log(
    'PASS deliberate full-collection removal and hidden products disappear from public sale without promising free admission',
  )
  await auth.logout()
  await assert.rejects(service.getEventForEditing(saved.id), (e) => e.response?.status === 401)
  await auth.register({
    name: 'Another test organiser',
    email: `other-${Date.now()}@example.invalid`,
    password,
  })
  await assert.rejects(service.getEventForEditing(saved.id), (e) => e.response?.status === 403)
  console.log('PASS unauthenticated and foreign-owner editor access are denied')
  console.log('Phase 2 frontend/Laravel HTTP end-to-end checks passed')
} catch (error) {
  console.error('E2E check failed:', error.message, error.response?.status, error.response?.data)
  process.exitCode = 1
} finally {
  await server.close()
}
