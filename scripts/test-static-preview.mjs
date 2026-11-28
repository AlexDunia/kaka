import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createPinia, setActivePinia } from 'pinia'

const memory = new Map()
let storageFull = false
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => {
    if (storageFull) throw new Error('Storage full')
    memory.set(key, String(value))
  },
  removeItem: (key) => memory.delete(key),
}
globalThis.sessionStorage = globalThis.localStorage
localStorage.setItem('rushhour:static-preview:v1', 'true')
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { staticPreviewAdapter: adapter, STATIC_EVENTS_KEY } = await server.ssrLoadModule(
    '/src/services/staticPreviewApi.js',
  )
  const request = async (url, method = 'get', data, params) =>
    (await adapter({ url, method, data: JSON.stringify(data), params })).data
  const rejects = (run, status) => assert.rejects(run, (error) => error.response?.status === status)
  const initial = await request('/events')
  const { isStaticPreview } = await server.ssrLoadModule('/src/services/staticPreviewMode.js')
  localStorage.removeItem('rushhour:static-preview:v1')
  globalThis.window = { location: { hostname: 'alexdunia.github.io' } }
  assert.equal(isStaticPreview(), true)
  const { getPublicEvents, getPublicCategories } = await server.ssrLoadModule('/src/services/publicCatalog.js')
  const discovery = await getPublicEvents()
  assert.equal(discovery.events.length, 3)
  assert.equal(discovery.total, 3)
  assert.ok((await getPublicCategories()).length > 0)
  assert.equal((await getPublicEvents({ category: 'music' })).events.length, 2)
  assert.equal((await getPublicEvents({ q: 'rooftop' })).events.length, 1)
  assert.equal((await getPublicEvents({ q: 'no matching event' })).events.length, 0)
  localStorage.setItem('rushhour:static-preview:v1', 'false')
  assert.equal(isStaticPreview(), false)
  window.location.hostname = 'localhost'
  localStorage.removeItem('rushhour:static-preview:v1')
  assert.equal(isStaticPreview(), false)
  delete globalThis.window
  localStorage.setItem('rushhour:static-preview:v1', 'true')
  assert.equal(initial.data.length, 3)
  assert.equal(initial.data.filter((event) => event.ticket_mode === 'free').length, 1)
  assert.equal(initial.data.filter((event) => event.ticket_mode === 'paid').length, 2)
  for (const event of initial.data) {
    assert.ok(event.description && event.main_image && event.address.venue_name)
    assert.ok(event.guests.length && event.schedule.length && event.faqs.length)
    assert.ok(event.ticketTypes.length)
    const dashboard = (await request(`/dashboard/events/${event.id}/overview`)).data
    assert.equal(dashboard.event.id, event.id)
    assert.equal(dashboard.event.ticket_mode, event.ticket_mode)
  }
  assert.equal((await request('/events', 'get', null, { q: 'rooftop' })).data.length, 1)
  assert.equal((await request('/events', 'get', null, { per_page: 2, page: 2 })).data.length, 1)
  await rejects(() => request('/create-event', 'post', { title: ' ' }), 422)
  await rejects(() => request('/events/123'), 404)
  await rejects(() => request('/checkout/initialize', 'post', {}), 422)
  await rejects(() => request('/user', 'put', { name: 'Changed' }), 422)
  const form = {
    title: 'A local evening',
    description: 'Meet friends and share ideas.',
    startsAtLocal: '2027-04-20T18:00:00',
    endsAtLocal: '2027-04-20T21:00:00',
    timeZone: 'Africa/Lagos',
    eventType: 'single',
    format: 'in-person',
    venue: 'The Garden',
    city: 'Lagos',
    category: 'Community',
    organiser: 'Local hosts',
    coverImage: '/sample.jpg',
    ticketMode: 'free',
    freeCapacity: 40,
    tickets: [],
    secondaryImages: [],
    tags: 'Community',
  }
  const draft = (await request('/create-event', 'post', form)).data
  assert.equal(draft.status, 'draft')
  assert.equal((await request('/events')).data.length, 3)
  assert.equal((await request('/dashboard/events')).data.length, 4)
  assert.equal(JSON.parse(localStorage.getItem(STATIC_EVENTS_KEY)).at(-1).id, draft.id)
  assert.equal((await request(`/create-event/${draft.id}`)).data.form.title, form.title)
  const published = (await request(`/create-event/${draft.id}/publish`, 'post', { version: 1 }))
    .data
  assert.equal(published.status, 'active')
  assert.equal((await request('/events')).data.length, 4)
  await rejects(
    () => request(`/create-event/${draft.id}`, 'patch', { version: 1, title: 'Stale edit' }),
    409,
  )
  const edited = (
    await request(`/create-event/${draft.id}`, 'patch', {
      version: 2,
      title: 'An updated evening',
      startsAtLocal: '2027-04-21T19:00:00',
    })
  ).data
  assert.equal(edited.version, 3)
  const profile = (await request(`/events/${draft.id}`)).data
  assert.equal(profile.title, 'An updated evening')
  assert.equal(profile.starts_at, '2027-04-21T19:00:00')
  assert.equal((await request(`/events/${draft.id}/registration`)).data.available, 40)
  const beforeFailure = localStorage.getItem(STATIC_EVENTS_KEY)
  storageFull = true
  await rejects(
    () => request(`/create-event/${draft.id}`, 'patch', { version: 3, title: 'Unsaved edit' }),
    422,
  )
  storageFull = false
  assert.equal(localStorage.getItem(STATIC_EVENTS_KEY), beforeFailure)
  localStorage.setItem(STATIC_EVENTS_KEY, '{broken')
  await rejects(() => request('/events'), 422)
  assert.equal(localStorage.getItem(STATIC_EVENTS_KEY), '{broken')
  localStorage.setItem(STATIC_EVENTS_KEY, beforeFailure)
  const { default: api, ensureCsrfCookie } = await server.ssrLoadModule('/src/api/axios.js')
  let liveCalls = 0
  api.defaults.adapter = async (config) => {
    liveCalls++
    return { data: { live: true }, status: 200, headers: {}, config }
  }
  assert.equal((await api.get('/events')).data.data.length, 4)
  await rejects(() => api.post('/checkout/initialize', {}), 422)
  await ensureCsrfCookie()
  assert.equal(liveCalls, 0)
  setActivePinia(createPinia())
  const { useAuthStore } = await server.ssrLoadModule('/src/stores/auth.js')
  const auth = useAuthStore()
  await auth.initialize()
  assert.equal(auth.user.name, 'Preview organiser')
  assert.equal(auth.isAuthenticated, false)
  assert.equal(localStorage.getItem('user'), null)
  assert.equal(liveCalls, 0)
  const { hydrateEditorForm } = await server.ssrLoadModule('/src/utils/eventEditor.js')
  const { createEventDraft, updateEventDraft, publishEvent } = await server.ssrLoadModule(
    '/src/services/createEventService.js',
  )
  const wizardDraft = (await createEventDraft(hydrateEditorForm(form))).data
  const wizardEdit = (
    await updateEventDraft(wizardDraft.id, {
      ...hydrateEditorForm(wizardDraft.form),
      version: wizardDraft.version,
      title: 'Saved through the existing wizard',
    })
  ).data
  assert.equal(wizardEdit.form.title, 'Saved through the existing wizard')
  assert.equal((await publishEvent(wizardEdit.id, wizardEdit.version)).data.status, 'active')
  assert.equal(liveCalls, 0)
  const { normalizeEventProfile } = await server.ssrLoadModule('/src/utils/eventProfile.js')
  for (const event of initial.data) {
    const profile = normalizeEventProfile(event)
    assert.equal(event.ticket_mode === 'free' ? profile.canRegister : profile.canBuy, true)
  }
  localStorage.removeItem('rushhour:static-preview:v1')
  await rejects(() => request('/events'), 403)
  assert.equal((await api.get('/events')).data.live, true)
  assert.equal(liveCalls, 1)
  console.log(
    'Static preview checks passed: samples, filtering, drafts, publishing, editing, version conflicts, storage recovery, request isolation and live-mode routing.',
  )
} finally {
  await server.close()
}
