import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
import { createRenderer, h } from 'vue'
import { createPinia } from 'pinia'
import { createServer } from 'vite'

const server = await createServer({ configFile: false, optimizeDeps: { noDiscovery: true, include: [] }, resolve: { preserveSymlinks: true, alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } }, server: { middlewareMode: true }, appType: 'custom' })
const listeners = new Map()
globalThis.localStorage = { setItem() {}, removeItem() {} }
globalThis.window = { location: new URL('http://localhost:5174/'), addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener() {} }
globalThis.document = { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} }
globalThis.BroadcastChannel = undefined
const renderer = createRenderer({
  createElement: () => ({ children: [] }), createText: () => ({}), createComment: () => ({}),
  insert: (child, parent) => parent.children.push(child), remove() {}, setText() {},
  setElementText() {}, patchProp() {}, parentNode() {}, nextSibling() {},
})
let app
try {
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const { useAuthStore } = await server.ssrLoadModule('/src/stores/auth.js')
  const { useLiveWorkspaceAttendees } = await server.ssrLoadModule('/src/components/event-workspace/liveAttendeesModel.js')
  const pinia = createPinia()
  const auth = useAuthStore(pinia)
  auth.user = { id: 1 }
  auth.initialized = true
  let release, calls = 0, contextRequest
  const deferContext = () => { contextRequest = new Promise((resolve, reject) => { release = { resolve, reject } }) }
  deferContext()
  api.get = async (url) => {
    calls++
    if (url.endsWith('/admission')) return contextRequest
    return { data: { data: [], current_page: 1, last_page: 1, total: 0 } }
  }
  const contextResponse = { data: { data: { role: 'owner', entrances: [] } } }
  let model
  app = renderer.createApp({ setup() { model = useLiveWorkspaceAttendees(30, 'paid'); return () => h('div') } })
  app.use(pinia)
  app.mount({ children: [] })
  assert.equal(model.loading.value, true, 'Initial load is visible')
  release.resolve(contextResponse)
  await model.refresh()
  assert.equal(model.loading.value, false)
  assert.equal(model.orders.value.length, 0, 'An empty successful response is ready')

  deferContext()
  listeners.get('focus')()
  assert.equal(model.loading.value, false, 'Background refresh does not display initial loading')
  const before = calls
  const pending = model.refresh({ background: true })
  assert.equal(calls, before, 'Overlapping refresh requests are deduplicated')
  release.resolve(contextResponse)
  await pending

  deferContext()
  const failed = model.refresh({ background: true })
  release.reject(Object.assign(new Error('Unavailable'), { response: { status: 503 } }))
  await failed
  assert.equal(model.loading.value, false)
  assert.ok(model.error.value, 'Background failures remain visible')
  deferContext()
  const retry = model.retry()
  assert.equal(model.loading.value, true, 'Explicit retry shows progress')
  release.resolve(contextResponse)
  await retry
  assert.equal(model.error.value, '')
  assert.equal(model.loading.value, false)

  deferContext()
  const forbidden = model.refresh({ background: true })
  release.reject(Object.assign(new Error('Forbidden'), { response: { status: 403 } }))
  await forbidden
  assert.equal(model.context.value, null, 'Access loss clears private records')
  assert.ok(model.error.value)
  assert.equal(model.loading.value, false)
  console.log('PASS: initial empty load, background refresh, request deduplication, failure, retry recovery, and access loss')
} finally {
  app?.unmount()
  await server.close()
}
