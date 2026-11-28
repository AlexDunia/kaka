import assert from 'node:assert/strict'
import { createRenderer, h, nextTick, ssrContextKey } from 'vue'
import { createMemoryHistory, createRouter, RouterLink, RouterView } from 'vue-router'
import { createServer } from 'vite'

const storage = new Map()
globalThis.localStorage = { getItem: (key) => storage.get(key) ?? null }
const listeners = new Map()
let mobile = true
// Older Safari exposes addListener, but not MediaQueryList.addEventListener.
globalThis.window = {
  location: { hostname: 'localhost' },
  matchMedia: () => ({
    get matches() {
      return mobile
    },
    addListener() {},
    removeListener() {},
  }),
  addEventListener: (name, listener) => listeners.set(name, listener),
  removeEventListener: (name, listener) => {
    if (listeners.get(name) === listener) listeners.delete(name)
  },
}
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
const renderer = createRenderer({
  createElement: (type) => ({ type, children: [], props: {} }),
  createText: (text) => ({ text }),
  createComment: (text) => ({ text }),
  insert: (child, parent, anchor) => {
    if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1)
    child.parent = parent
    const index = anchor ? parent.children.indexOf(anchor) : -1
    if (index < 0) parent.children.push(child)
    else parent.children.splice(index, 0, child)
  },
  remove: (child) => {
    if (child.parent) child.parent.children.splice(child.parent.children.indexOf(child), 1)
  },
  setText: (node, text) => {
    node.text = text
  },
  setElementText: (node, text) => {
    node.text = text
  },
  patchProp: (node, key, _previous, value) => {
    node.props[key] = value
  },
  parentNode: (node) => node.parent,
  nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1],
})
let app
try {
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  let failEvents = false
  api.defaults.adapter = async (config) => {
    if (config.url === '/events' && failEvents) throw new Error('Offline')
    const data =
      config.url === '/categories'
        ? { data: [] }
        : {
            data: [
              {
                id: 1,
                title: 'An evening together',
                date: '2027-04-20T18:00:00+01:00',
                ticket_types: [],
              },
            ],
            meta: { total: 1, last_page: 1 },
          }
    return { data, status: 200, headers: {}, config }
  }
  const { default: FindEvents } = await server.ssrLoadModule('/src/pages/FindEvents.vue')
  const { default: PublicEventSearch } = await server.ssrLoadModule('/src/components/public/PublicEventSearch.vue')
  let searchForm
  let searched = 0
  const Search = {
    setup() {
      searchForm = PublicEventSearch.setup({ filters: true, discovery: false }, {
        expose() {},
        emit: (name) => { if (name === 'searched') searched++ },
      })
      return () => h('form')
    },
  }
  let page
  const Discovery = {
    setup() {
      // Run the actual page setup and lifecycle with an older mobile API surface.
      page = FindEvents.setup({}, { expose() {} })
      return () =>
        h(
          'main',
          { 'data-page': 'discovery' },
          page.loading.value
            ? 'Loading'
            : page.error.value || String(page.visibleCards.value.length),
        )
    },
  }
  const Entry = { render: () => h(RouterLink, { to: '/find-events' }, () => 'Find events') }
  const router = createRouter({
    history: createMemoryHistory('/kaka/'),
    routes: [
      { path: '/', component: Entry },
      { path: '/login', component: Entry },
      { path: '/search-form', component: Search },
      { path: '/find-events', name: 'find-events', component: Discovery },
    ],
  })
  const errors = []
  app = renderer.createApp({ render: () => h(RouterView) })
  app.provide(ssrContextKey, { modules: new Set() })
  app.config.errorHandler = (error) => errors.push(error)
  app.use(router)
  await router.push('/')
  await router.isReady()
  const root = { children: [] }
  app.mount(root)
  const flush = async () => {
    for (let index = 0; index < 10; index++) {
      await new Promise((resolve) => setImmediate(resolve))
      await nextTick()
    }
  }
  const anchor = (node) => (node.type === 'a' ? node : node.children?.map(anchor).find(Boolean))
  for (const entry of ['/', '/login']) {
    await router.push(entry)
    await flush()
    const link = anchor(root)
    assert.equal(link.props.href, '/kaka/find-events')
    await link.props.onClick({
      button: 0,
      preventDefault() {},
      currentTarget: { getAttribute: () => null },
    })
    await flush()
    assert.deepEqual(
      errors.map((error) => error.message),
      [],
      'Find Events must mount after tapping a public link',
    )
    assert.equal(router.currentRoute.value.name, 'find-events')
    assert.equal(page.isMobile.value, true)
    assert.equal(page.loading.value, false)
    assert.equal(page.visibleCards.value.length, 1)
    mobile = false
    listeners.get('resize')()
    assert.equal(page.isMobile.value, false)
    mobile = true
    listeners.get('resize')()
    assert.equal(page.isMobile.value, true)
  }
  await router.push('/search-form')
  await flush()
  searchForm.query.value = 'evening'
  await searchForm.search()
  await flush()
  assert.equal(router.currentRoute.value.fullPath, '/find-events?q=evening#discover')
  assert.equal(searched, 1)
  assert.equal(page.visibleCards.value.length, 1)
  failEvents = true
  await page.loadEvents()
  assert.ok(page.error.value)
  assert.equal(page.loading.value, false)
  failEvents = false
  await page.loadEvents()
  assert.equal(page.error.value, '')
  assert.equal(page.visibleCards.value.length, 1)
  await router.push('/')
  await flush()
  assert.equal(listeners.size, 0, 'Leaving discovery must release the resize listener')
  assert.deepEqual(errors, [])
  console.log(
    'Discovery navigation passed: public links, legacy mobile APIs, viewport changes, failure recovery and listener cleanup.',
  )
} finally {
  app?.unmount()
  await server.close()
  delete globalThis.window
  delete globalThis.localStorage
}
