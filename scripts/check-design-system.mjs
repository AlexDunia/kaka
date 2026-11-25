import assert from 'node:assert/strict'
import fs from 'node:fs'
import postcss from 'postcss'
import { createServer } from 'vite'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { usesPublicShell, usesPublicTypography } from '../src/utils/routePresentation.js'

const tokens = JSON.parse(fs.readFileSync('src/design-system/tokens.json', 'utf8'))
assert.deepEqual(['h1', 'h2', 'h3', 'h4', 'body'].map((key) => tokens.size[key]), ['22px', '18px', '17px', '16px', '14px'])
assert.equal(tokens.size.metric, '24px')
assert.deepEqual(['public-h1', 'public-h2', 'public-h3'].map((key) => tokens.size[key]), ['40px', '30px', '24px'])
assert.deepEqual(['public-h1-mobile', 'public-h2-mobile', 'public-h3-mobile'].map((key) => tokens.size[key]), ['34px', '28px', '22px'])
const css = postcss.parse(fs.readFileSync('src/styles/design-system.css', 'utf8'))
const generated = postcss.parse(fs.readFileSync('src/styles/design-tokens.css', 'utf8'))
for (const [key, value] of Object.entries(tokens.size)) {
  let found = false
  generated.walkDecls(`--ds-size-${key}`, (declaration) => { if (declaration.value === value) found = true })
  assert.ok(found, `Generated ${key} token is stale`)
}
for (const heading of ['h1', 'h2', 'h3', 'h4']) {
  const rule = css.nodes.find((node) => node.selector === `#app :is(${heading}, .rh-${heading}):not(.event-profile *)`)
  assert.ok(rule?.nodes.some((node) => node.prop === 'font-size' && node.important && node.value === `var(--ds-size-${heading})`), `${heading} must use the global scale outside the v31 event-profile exception`)
}
const paragraph = css.nodes.find((node) => node.selector === '#app :is(p, .rh-body):not(.event-profile *)')
for (const heading of ['h1', 'h2', 'h3']) {
  const publicRule = css.nodes.find((node) => node.selector === '#app .public-site, #app .public-typography' && node.nodes?.some((declaration) => declaration.prop === `--ds-size-${heading}`))
  assert.ok(publicRule.nodes.some((node) => node.prop === `--ds-size-${heading}` && node.value.includes(`--ds-size-public-${heading}`)), `${heading} must be enlarged only within public pages`)
}
for (const name of ['strip', 'track', 'group']) {
  const rule = css.nodes.find((node) => node.selector === `#app .public-site .rh-audience-${name}`)
  assert.ok(rule?.nodes.some((node) => node.prop === 'display' && node.value === 'flex'), `Ticker ${name} must be a row on every public route`)
}
assert.ok(paragraph.nodes.some((node) => node.prop === 'margin' && node.value.includes('--ds-rhythm-paragraph-gap')))
assert.ok(Number.parseInt(tokens.rhythm['paragraph-gap']) > 16)
assert.ok(Number.parseInt(tokens.rhythm['card-padding']) > 32)

const hover = css.nodes.find((node) => node.selector?.includes('.ep-event-card:is(:hover, :active, :focus-visible)'))
assert.ok(hover.nodes.some((node) => node.prop === 'border' && node.value === '0' && node.important))
assert.ok(hover.nodes.some((node) => node.prop === 'background' && node.value === 'var(--ds-color-surface)' && node.important))
assert.ok(hover.nodes.some((node) => node.prop === 'transform' && node.value === 'none' && node.important))

// The public shell resets links to static; a tab must contain its own underline.
const eventTab = css.nodes.find((node) => node.selector === "body[data-rh-page='event-page'] #app .event-profile .rh24-tab")
assert.ok(eventTab.nodes.some((node) => node.prop === 'position' && node.value === 'relative'))
assert.ok(eventTab.nodes.some((node) => node.prop === 'filter' && node.value === 'none'))
const eventBar = css.nodes.find((node) => node.selector === "body[data-rh-page='event-page'] #app .event-profile .rh29-nav-row")
assert.ok(eventBar.nodes.some((node) => node.prop === 'border-bottom' && node.value === '0'))
assert.ok(eventBar.nodes.some((node) => node.prop === 'backdrop-filter' && node.value === 'none'))
const profileSource = fs.readFileSync('src/pages/EventDetails.vue', 'utf8')
assert.match(profileSource, /id="ep-about" class="[^"]*rh24-about/)

const publicRoutes = [
  { path: '/', name: 'home' }, { path: '/find-events', name: 'find-events' }, { path: '/about', name: 'about' },
  { path: '/events/12-an-evening', name: 'event-details' }, { path: '/login', name: 'login' },
  { path: '/register', name: 'register' }, { path: '/contact', name: 'contact' }, { path: '/blog', name: 'blog' },
]
publicRoutes.forEach((route) => assert.equal(usesPublicShell({ ...route, meta: {} }), true, route.path))
assert.equal(usesPublicShell({ name: 'dashboard', meta: { requiresAuth: true } }), false)
assert.equal(usesPublicShell({ name: 'checkout', meta: { fullScreenShell: true } }), false)
for (const name of ['dashboard', 'dashboard-event', 'admin', 'transactions']) {
  assert.equal(usesPublicTypography({ name, meta: { requiresAuth: true } }), false, name)
}
for (const name of ['CreateEvent', 'EditEvent', 'google-callback']) {
  assert.equal(usesPublicTypography({ name, meta: {} }), false, name)
}
for (const name of ['home', 'find-events', 'event-details', 'event-tickets', 'checkout']) {
  assert.equal(usesPublicTypography({ name, meta: {} }), true, name)
}

const normalise = (html) => html
  .replace(/<!---->/g, '')
  .replace(/<div[^>]*class="home-scroll-greeting[^"]*"[^>]*>[\s\S]*?<\/div><\/div>/g, '')
  .replace(/\saria-current="[^"]*"/g, '')
  .replace(/\sclass="([^"]*)"/g, (_, classes) => {
    const remaining = classes.split(/\s+/).filter((name) => name && name !== 'is-current' && !name.startsWith('router-link-')).join(' ')
    return remaining ? ` class="${remaining}"` : ''
  })
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try {
  const { default: Shell } = await server.ssrLoadModule('/src/components/public/PublicSite.vue')
  const { useAuthStore } = await server.ssrLoadModule('/src/stores/auth.js')
  for (const authenticated of [false, true]) {
    let baseline
    for (const route of publicRoutes) {
      const router = createRouter({ history: createMemoryHistory(), routes: publicRoutes.concat([{ path: '/cart' }, { path: '/create-event' }, { path: '/dashboard' }]).map((entry) => ({ ...entry, component: { render: () => h('main') } })) })
      const pinia = createPinia()
      const app = createSSRApp({ render: () => h(Shell, null, { default: () => h('main', [h('h1', 'Your next event')]) }) })
      app.use(pinia)
      app.use(router)
      useAuthStore(pinia).user = authenticated ? { id: 1, name: 'Sample organiser' } : null
      await router.push(route.path)
      await router.isReady()
      const html = await renderToString(app)
      assert.equal((html.match(/class="rh-audience-strip"/g) || []).length, route.name === 'home' ? 1 : 0, `${route.path} audience ticker must be Home-only`)
      const headers = [...html.matchAll(/<header\b[^>]*>[\s\S]*?<\/header>/g)]
      assert.equal(headers.length, 1, `${route.path} must render one header`)
      const header = normalise(headers[0][0])
      baseline ??= header
      assert.equal(header, baseline, `${route.path} rendered a different public header`)
    }
  }
  console.log('Shared design checks passed: documented scale, increased rhythm, neutral card hover, and identical header rendering on eight public routes with and without a session.')
} finally { await server.close() }
