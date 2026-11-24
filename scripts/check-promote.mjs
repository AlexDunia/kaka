import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

const values = new Map()
let failedWrite = 0,
  writes = 0
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem(key, value) {
    if (++writes === failedWrite) throw new Error('Storage unavailable')
    values.set(key, value)
  },
}
globalThis.location = new URL('http://localhost:5174/')
globalThis.matchMedia = () => ({ matches: true })
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom',
})
try {
  const { default: Views } = await server.ssrLoadModule(
    '/src/components/event-workspace/WorkspaceViews.vue',
  )
  const { previewOverview } = await server.ssrLoadModule('/src/services/dashboardPreview.js')
  const { validateDiscount, freshDiscount, mergeShareLinks, story } = await server.ssrLoadModule(
    '/src/components/event-workspace/promotionModel.js',
  )
  const service = await server.ssrLoadModule('/src/services/dashboardShareService.js')
  const warnings = []
  async function capture(query = {}, initialise) {
    let state, parent
    const navigation = []
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: { render: () => null } },
        { path: '/events/:id-:slug', name: 'event-details', component: { render: () => null } },
      ],
    })
    await router.push({ path: '/', query: { view: 'share', ...query } })
    const app = createSSRApp(Views, {
      page: 'promote',
      overview: previewOverview,
      eventId: 900001,
      onNavigate: (value) => navigation.push(value),
    })
    app.use(createPinia()).use(router)
    app.config.warnHandler = (message) => warnings.push(message)
    app.mixin({
      created() {
        if (this.$.type.__name === 'WorkspaceViews') parent = this.$.setupState
        if (this.$.type.__name === 'WorkspacePromote') {
          state = this.$.setupState
          initialise?.(state)
        }
      },
    })
    const fullHTML = await renderToString(app)
    const start = fullHTML.lastIndexOf('<section', fullHTML.indexOf('workspace-promote'))
    const tags = /<\/?section\b[^>]*>/g
    tags.lastIndex = start
    let depth = 0,
      end = fullHTML.length,
      token
    while ((token = tags.exec(fullHTML))) {
      depth += token[0].startsWith('</') ? -1 : 1
      if (!depth) {
        end = tags.lastIndex
        break
      }
    }
    return { state, parent, navigation, html: fullHTML.slice(start, end) }
  }
  const empty = await capture()
  assert.match(empty.html, /You haven’t created any sharing links yet/)
  assert.ok(
    !empty.html.includes('Which links bring more buyers?'),
    'hide results before links exist',
  )
  assert.equal(story.length, 4)
  assert.deepEqual(
    story.map((s) => s.image),
    [
      '/src/assets/event-workspace/reference-9a9afa357f4d.jpg',
      '/src/assets/event-workspace/reference-e9a38191012a.jpg',
      '/src/assets/event-workspace/reference-5931d3672e70.jpg',
      '/src/assets/event-workspace/reference-ff9b5ae2a009.jpg',
    ],
  )
  await empty.state.loadLinks()
  empty.state.selected = ['whatsapp', 'instagram']
  const generating = empty.state.generateLinks()
  assert.equal(empty.state.phase, 'generating', 'show progress while generation is pending')
  await generating
  assert.equal(empty.state.phase, 'ready')
  assert.equal(empty.state.ready.length, 2)
  assert.equal(empty.state.links.length, 2)
  assert.match(empty.state.sourceUrl(empty.state.links[0]), /src=whatsapp/)
  await empty.state.generateLinks()
  assert.equal(empty.state.links.length, 2, 'repeated generation does not duplicate links')
  assert.equal(
    (await service.getEventShareLinks(900002)).length,
    0,
    'links stay within their event',
  )
  const refreshed = await capture({}, (s) => {
    s.links = empty.state.links
  })
  assert.match(refreshed.html, /Which links bring more buyers\?/)
  assert.match(refreshed.html, /class="rh33-action secondary small"/)
  assert.match(refreshed.html, /class="rh33-tool-copy"/)
  assert.ok(
    !refreshed.html.slice(refreshed.html.indexOf('workspace-promote')).includes('rh28-copy-email'),
    'promotion copy controls do not inherit attendee geometry',
  )
  empty.state.selected = ['facebook', 'telegram']
  failedWrite = writes + 2
  await empty.state.generateLinks()
  assert.equal(empty.state.phase, 'choose', 'partial failure never shows congratulations')
  assert.match(empty.state.linkError, /couldn’t create all/)
  assert.equal(
    empty.state.links.length,
    3,
    'retain successfully created records after a partial failure',
  )
  failedWrite = 0
  await empty.state.generateLinks()
  assert.equal(empty.state.phase, 'ready')
  assert.equal(empty.state.links.length, 4)
  console.log(
    'PASS sharing progress, success, persistence, duplicate prevention, event isolation and failure recovery',
  )

  const inline = await capture({ tab: 'discounts' }, (state) => state.startDiscount())
  assert.match(inline.html, /id="rh33-offer-form"/)
  assert.ok(
    !inline.html.includes('Back to discounts'),
    'default creation stays inside the reference card',
  )
  assert.equal(inline.navigation.length, 0, 'opening the inline editor does not navigate')
  inline.state.closeDiscountForm()
  assert.equal(inline.state.createOpen, false)
  const creation = await capture({ tab: 'discounts', screen: 'create-discount' })
  assert.match(creation.html, /Back to discounts/)
  assert.ok(!creation.html.includes('role="tablist"'), 'the form is its own page inside Promote')
  const valid = { ...freshDiscount(), name: 'Campus offer', code: 'CAMPUS15', value: 15 }
  assert.equal(validateDiscount(valid, []), '')
  assert.match(validateDiscount({ ...valid, value: 101 }, []), /percentage/)
  assert.match(validateDiscount({ ...valid, limit: 1.5 }, []), /whole-number/)
  assert.match(
    validateDiscount({ ...valid, start: '2026-12-10', end: '2026-12-01' }, []),
    /end date/,
  )
  assert.match(validateDiscount(valid, [valid]), /already exists/)
  Object.assign(creation.state.offer, valid)
  creation.state.saveDiscount()
  assert.equal(creation.parent.codes[0].code, valid.code)
  assert.deepEqual(creation.navigation.at(-1), { view: 'share', tab: 'discounts' })
  const paused = await capture({ tab: 'discounts' })
  paused.state.toggleCode(paused.parent.codes[0])
  assert.equal(paused.parent.codes[0].active, false)
  const resumed = await capture({ tab: 'discounts' })
  resumed.state.toggleCode(resumed.parent.codes[0])
  assert.equal(resumed.parent.codes[0].active, true)
  creation.state.chooseTickets('VIP', true)
  assert.deepEqual([...creation.state.offer.eligible], ['VIP'])
  creation.state.chooseTickets('all', true)
  assert.deepEqual([...creation.state.offer.eligible], ['all'])
  const editing = await capture({ tab: 'discounts', screen: 'edit-discount', code: valid.code })
  assert.equal(editing.state.offer.code, valid.code, 'refresh restores the routed code editor')
  assert.equal(warnings.length, 0, warnings.join('\n'))
  assert.throws(() => mergeShareLinks([], { label: 'Bad response' }))
  console.log(
    'PASS inline discount creation/cancel, legacy editor URLs, validation, pause/resume and edit refresh',
  )

  const css = await readFile('src/assets/event-workspace/promote.css', 'utf8')
  assert.ok(
    !/\.rh33-action\s*\{/.test(css),
    'integration CSS must not replace reference action shapes',
  )
  const component = await readFile('src/components/event-workspace/WorkspacePromote.vue', 'utf8')
  assert.ok(
    !/innerHTML|addEventListener|document\.getElementById/.test(component),
    'interactions use Vue bindings and template refs',
  )
  assert.ok(
    !component.includes('<div aria-live="polite">\n            <h2 id="rh-story-heading"'),
    'preserve direct flex children in story layout',
  )
  console.log('PASS reference control classes and Vue-native interaction wiring')
} finally {
  await server.close()
}
