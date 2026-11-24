import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import axios from 'axios'
import { createRenderer, h, nextTick, reactive } from 'vue'
import { parse, compileTemplate } from '@vue/compiler-sfc'
import {
  usePublicPageLoader,
  shouldShowPublicLoader,
} from '../src/composables/usePublicPageLoader.js'
import { eventProfileNavigation } from '../src/utils/eventProfileNavigation.js'
import {
  safeAuthDestination,
  rememberAuthDestination,
  takeAuthDestination,
} from '../src/utils/authDestination.js'
import { usesPublicTransition } from '../src/utils/routePresentation.js'

test('brand animation is reserved for browsing and event creation, never auth or purchase tasks', () => {
  for (const name of [
    'login',
    'register',
    'forgot-password',
    'reset-password',
    'google-callback',
    'cart',
    'checkout',
    'event-tickets',
    'payment-success',
  ]) {
    assert.equal(usesPublicTransition({ name, meta: {} }), false, name)
  }
  for (const name of ['home', 'find-events', 'features', 'event-moments', 'CreateEvent']) {
    assert.equal(usesPublicTransition({ name, meta: {} }), true, name)
  }
})

test('auth continuation preserves internal destinations and rejects external URLs and auth loops', () => {
  assert.equal(safeAuthDestination('/create-event'), '/create-event')
  assert.equal(safeAuthDestination('/checkout?event=42'), '/checkout?event=42')
  for (const value of [
    'https://example.com',
    '//example.com',
    '/\\example.com',
    '/login?redirect=/login',
    '/register',
    ['/create-event'],
    '/\nexample.com',
  ]) {
    assert.equal(safeAuthDestination(value), null)
  }
  const previousStorage = globalThis.sessionStorage
  const values = new Map()
  globalThis.sessionStorage = {
    setItem: (key, value) => values.set(key, value),
    getItem: (key) => values.get(key),
    removeItem: (key) => values.delete(key),
  }
  try {
    rememberAuthDestination('/create-event')
    assert.equal(takeAuthDestination(), '/create-event')
    assert.equal(takeAuthDestination(), null)
  } finally {
    globalThis.sessionStorage = previousStorage
  }
})

test('event tabs replace the brand header at the v31 About paragraph boundary and restore above it', () => {
  const position = { headerHeight: 76, navHeight: 70, scrollY: 400 }
  assert.deepEqual(eventProfileNavigation({ ...position, leadTop: 154 }), {
    collapsed: true,
    tabsTop: 0,
    activeThreshold: 112,
  })
  assert.deepEqual(eventProfileNavigation({ ...position, leadTop: 155 }), {
    collapsed: false,
    tabsTop: 76,
    activeThreshold: 188,
  })
  assert.equal(eventProfileNavigation({ ...position, leadTop: 0, scrollY: 8 }).collapsed, false)
  assert.equal(eventProfileNavigation({ ...position, leadTop: undefined }).collapsed, false)
})

const requests = []
axios.defaults.adapter = async (config) => {
  requests.push(config)
  if (config.url === '/categories')
    return { data: { data: [{ id: 12, name: 'Food & Dining' }] }, status: 200, config }
  const events = Array.from({ length: 18 }, (_, index) => ({
    id: index + 1,
    title: index === 17 ? 'An evening of food' : `Event ${index + 1}`,
    category_id: 12,
    category: { name: 'Food & Dining' },
    address: { city: index === 17 ? 'Abuja' : 'Lagos' },
  }))
  const page = Number(config.params.page)
  let filtered = config.params.category_id
    ? events.filter((event) => event.category_id === Number(config.params.category_id))
    : events
  if (config.params.q)
    filtered = filtered.filter((event) =>
      config.params.q
        .toLowerCase()
        .split(/\s+/)
        .every((word) => event.title.toLowerCase().includes(word)),
    )
  if (config.params.city)
    filtered = filtered.filter(
      (event) => event.address.city.toLowerCase() === config.params.city.toLowerCase(),
    )
  return {
    data: {
      data: filtered.slice((page - 1) * 12, page * 12),
      meta: { total: filtered.length, last_page: Math.max(1, Math.ceil(filtered.length / 12)) },
    },
    status: 200,
    config,
  }
}
const catalogSource = (
  await readFile(new URL('../src/services/publicCatalog.js', import.meta.url), 'utf8')
).replace(
  "import catalog from '@/api/axios'",
  `import axios from '${import.meta.resolve('axios')}'; const catalog = axios.create()`,
)
const { getPublicEvents, getPublicCategories } = await import(
  `data:text/javascript;base64,${Buffer.from(catalogSource).toString('base64')}`
)

test('loads database categories, preserving their identifiers', async () => {
  assert.deepEqual(await getPublicCategories(), [{ name: 'Food & Dining', value: '12' }])
})

test('uses category_id for Laravel pagination', async () => {
  requests.length = 0
  const result = await getPublicEvents({ category: '12', page: 2 })
  assert.equal(requests[0].params.category_id, '12')
  assert.equal(requests[0].params.page, 2)
  assert.equal(result.events.length, 6)
  assert.equal(result.total, 18)
})

test('sends search and city to the backend and consumes its matching page', async () => {
  requests.length = 0
  const result = await getPublicEvents({ q: 'evening food', city: 'Abuja' })
  assert.equal(requests.length, 1)
  assert.equal(requests[0].params.q, 'evening food')
  assert.equal(requests[0].params.city, 'Abuja')
  assert.equal(result.total, 1)
  assert.equal(result.events[0].id, 18)
  assert.equal(result.pages, 1)
  assert.equal((await getPublicEvents({ q: 'no-match' })).events.length, 0)
})

test('never substitutes sample events after a request failure', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(
    getPublicEvents({}, controller.signal),
    (error) => error.code === 'ERR_CANCELED',
  )
})

const renderer = createRenderer({
  createElement: (type) => ({ type, children: [] }),
  createText: (text) => ({ text }),
  createComment: (text) => ({ text }),
  insert: (child, parent) => {
    parent.children.push(child)
  },
  remove() {},
  setText() {},
  setElementText() {},
  patchProp() {},
  parentNode() {},
  nextSibling() {},
})

test('replays public transitions even with a session, while skipping Back and protected pages', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] })
  const previousWindow = globalThis.window
  globalThis.window = {
    history: { state: { position: 0 } },
    matchMedia: () => ({ matches: false }),
    setTimeout: (...args) => setTimeout(...args),
  }
  const hooks = {}
  const router = {
    currentRoute: { value: { name: 'home', meta: {} } },
    beforeEach: (fn) => {
      hooks.before = fn
      return () => {}
    },
    afterEach: (fn) => {
      hooks.after = fn
      return () => {}
    },
    onError: () => () => {},
  }
  const auth = reactive({ isAuthenticated: false })
  let state
  const app = renderer.createApp({
    setup() {
      state = usePublicPageLoader(router, auth)
      return () => h('div')
    },
  })
  try {
    app.mount({ children: [] })
    assert.equal(state.visible.value, true)
    assert.equal(state.stage.value, 'brand')
    t.mock.timers.tick(1375)
    assert.equal(state.stage.value, 'skeleton')
    t.mock.timers.tick(285)
    assert.equal(state.stage.value, 'reveal')
    t.mock.timers.tick(190)
    assert.equal(state.visible.value, false)
    const home = { path: '/', meta: {} },
      find = { name: 'find-events', path: '/find-events', meta: {} }
    hooks.before(find, home)
    assert.equal(state.visible.value, true)
    window.history.state.position = 1
    hooks.after(find, home)
    t.mock.timers.tick(1850)
    window.history.state.position = 0
    hooks.before(home, find)
    assert.equal(state.visible.value, false)
    hooks.after(home, find)
    auth.isAuthenticated = true
    await nextTick()
    hooks.before(find, home)
    assert.equal(state.visible.value, true)
    hooks.before({ name: 'dashboard', path: '/dashboard', meta: { requiresAuth: true } }, find)
    assert.equal(state.visible.value, false)
    hooks.before({ name: 'CreateEvent', path: '/create-event', meta: { requiresAuth: true } }, find)
    assert.equal(state.visible.value, true)
    assert.equal(shouldShowPublicLoader({ authenticated: false, protectedRoute: true }), false)
    assert.equal(shouldShowPublicLoader({ authenticated: false, samePage: true }), false)
  } finally {
    app.unmount()
    globalThis.window = previousWindow
    t.mock.timers.reset()
  }
})

test('all public templates compile as Vue single-file components', async () => {
  for (const file of [
    'src/pages/HomePage.vue',
    'src/pages/FindEvents.vue',
    'src/pages/AboutPage.vue',
    'src/pages/EventDetails.vue',
    'src/components/EventCover.vue',
    'src/components/public/PublicSite.vue',
    'src/components/public/PublicEventSearch.vue',
    'src/components/public/DiscoveryHero.vue',
    'src/components/public/DiscoveryCities.vue',
    'src/components/public/PublicBrandLoader.vue',
    'src/components/public/CaptionLetters.vue',
    'src/components/home/HomeScrollGreeting.vue',
  ]) {
    const source = await readFile(file, 'utf8')
    const { descriptor, errors } = parse(source)
    assert.deepEqual(errors, [], file)
    const result = compileTemplate({
      source: descriptor.template.content,
      filename: file,
      id: 'public-site-check',
    })
    assert.deepEqual(result.errors, [], file)
    assert.ok(!source.includes('iframe') && !source.includes('postMessage'), file)
  }
})
