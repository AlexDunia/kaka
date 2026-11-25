import assert from 'node:assert/strict'
import axios from 'axios'
import { createServer } from 'vite'
import { createSSRApp, nextTick } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom' })
const originalAdapter = axios.defaults.adapter
globalThis.requestAnimationFrame = () => 0
const storage = new Map()
globalThis.localStorage = { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }
try {
  const { default: Editor } = await server.ssrLoadModule('/src/pages/CreateEvent.vue')
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const warnings = []
  async function render(section, embedded = true) {
    let state
    const router = createRouter({ history: createMemoryHistory(), routes: [
      { path: '/', name: 'home', component: {} },
      { path: '/create-event', name: 'CreateEvent', component: {} },
      { path: '/dashboard/events/:eventId', name: 'dashboard-event', component: {} },
    ] })
    await router.push(embedded ? '/dashboard/events/30?view=edit' : '/create-event')
    const app = createSSRApp(Editor, { embedded, eventId: embedded ? 30 : undefined, editorSection: section })
    app.use(createPinia()).use(router)
    app.config.warnHandler = message => warnings.push(message)
    app.mixin({ created() { if (this.$.type.__name === 'CreateEvent') state = this.$.setupState } })
    const html = await renderToString(app)
    return { html, state, router }
  }
  for (const [section, expected, absent] of [
    ['details', 'Event name', 'How are people attending?'],
    ['tickets', 'How are people attending?', 'Event name'],
    ['checkout', 'Your registration is confirmed.', 'Event name'],
  ]) {
    const { html } = await render(section)
    assert.ok(html.includes(expected), section)
    // Checkout's email sample contains the phrase Event name, so check input IDs instead.
    if (section !== 'checkout') assert.ok(!html.includes(absent), section)
    else assert.ok(!html.includes('id="event-name"'))
    assert.ok(html.includes('Save changes'))
    assert.ok(!html.includes('Continue'))
    assert.ok(!html.includes('ce-progress'))
    assert.ok(!html.includes('Make it'))
    assert.ok(!html.includes('Let&#39;s build'))
  }
  const create = await render('details', false)
  assert.ok(create.html.includes('ce-progress'))
  assert.ok(create.html.includes('Continue'))
  assert.ok(!create.html.includes('ce-embedded'))
  const { default: Workspace } = await server.ssrLoadModule('/src/components/event-workspace/EventWorkspace.vue')
  const { previewEvent, previewOverview } = await server.ssrLoadModule('/src/services/dashboardPreview.js')
  for (const view of ['settings', 'edit']) {
    for (const tab of ['details', 'tickets', 'checkout', 'access', 'payments']) {
      const workspaceRouter = createRouter({ history: createMemoryHistory(), routes: [
        { path: '/dashboard/events/:eventId', name: 'dashboard-event', component: {} },
      ] })
      await workspaceRouter.push(`/dashboard/events/30?view=${view}&tab=${tab}`)
      const app = createSSRApp(Workspace, { view, event: previewEvent, overview: previewOverview, events: [previewEvent] })
      app.use(createPinia()).use(workspaceRouter)
      app.config.warnHandler = message => warnings.push(message)
      const html = await renderToString(app)
      assert.ok(html.includes('workspace-sidebar-scroll'), 'editor keeps the dashboard sidebar')
      assert.match(html, new RegExp(`id="event-editor-tab-${tab}"[^>]*aria-selected="true"`))
      assert.match(html, new RegExp(`id="rh35-header-title"[^>]*>${view === 'settings' ? 'Settings' : 'Edit event'}</strong>`))
      assert.ok(!html.includes('ce-progress'))
    }
  }
  const { state, router } = await render('details')
  assert.ok(state)
  let mode = 'success', writes = 0
  const record = { id: 30, status: 'active', version: 2, form: {
    title: 'An evening together', timeZone: 'Africa/Lagos', startsAtLocal: '2027-02-14T18:00:00', endsAtLocal: '2027-02-14T22:00:00',
    eventType: 'one_time', format: 'in-person', venue: 'Lagos', category: 'Music', description: 'An evening for music.',
    coverImage: 'https://example.com/cover.jpg', ticketMode: 'free', freeCapacity: 100, tickets: [],
  } }
  const response = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} })
  const failure = status => Object.assign(new Error('Request failed'), { response: { status, data: { message: status === 403 ? 'You do not have access to this event.' : 'Please reload the saved event.', errors: status === 422 ? { title: ['Enter an event name.'] } : undefined } } })
  api.defaults.adapter = async config => {
    if (config.method === 'get') {
      if (mode === 'forbidden') throw failure(403)
      return response(config, { data: record })
    }
    writes++
    if (mode === 'conflict') throw failure(409)
    if (mode === 'invalid') throw failure(422)
    if (mode === 'failure') throw failure(503)
    const payload = JSON.parse(config.data)
    assert.equal(payload.version, record.version)
    assert.equal(payload.title, state.form.title)
    assert.ok(!("tickets" in payload), "event details never replace ticket inventory")
    assert.ok(!("attendeeFields" in payload), "event details do not save checkout fields")
    return response(config, { data: { ...record, version: record.version + 1 } })
  }
  axios.defaults.adapter = async config => response(config, {})
  mode = 'forbidden'
  await state.loadEventForEditing()
  assert.ok(state.editorLoadError)
  await state.saveEventChanges()
  assert.equal(writes, 0, 'failed authorization cannot submit the default form')
  mode = 'success'
  await state.loadEventForEditing()
  await nextTick()
  state.form.title = ''
  await state.saveEventChanges()
  assert.equal(writes, 0, 'invalid input cannot submit')
  assert.ok(state.errors.title)
  state.form.attendeeFields[0].label = 'Unsaved checkout label'
  state.form.title = 'Updated event'
  await state.saveEventChanges()
  assert.equal(writes, 1)
  assert.equal(state.form.version, 3)
  assert.equal(state.form.attendeeFields[0].label, 'Unsaved checkout label', 'saving details preserves unsaved fields in another tab')
  assert.equal(router.currentRoute.value.name, 'dashboard-event', 'saving stays in the editor')
  mode = 'conflict'
  await state.saveEventChanges()
  assert.equal(state.conflict, true)
  await state.saveEventChanges()
  assert.equal(writes, 2, 'conflicts block repeated saves until reload')
  mode = 'success'
  await state.reloadConflictedEvent()
  await nextTick()
  mode = 'failure'
  state.form.title = 'Keep my changes'
  await state.saveEventChanges()
  assert.equal(state.isSaving, false)
  assert.equal(state.form.title, 'Keep my changes')
  assert.ok(state.saveError.length)
  mode = 'success'
  await Promise.all([state.saveEventChanges(), state.saveEventChanges()])
  assert.equal(writes, 4, 'double clicks produce one retry request')
  mode = 'invalid'
  await state.saveEventChanges()
  assert.ok(state.errors.title)
  assert.equal(state.isSaving, false)
  assert.deepEqual(warnings, [])
  console.log('PASS editor sections, creation preservation, saves, validation, forbidden access, conflicts, retry and duplicate submission')
} finally {
  axios.defaults.adapter = originalAdapter
  await server.close()
}
