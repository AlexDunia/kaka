import assert from 'node:assert/strict'
import fs from 'node:fs'
import { createHash } from 'node:crypto'
import postcss from 'postcss'
import { createServer } from 'vite'
import { createSSRApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { createPinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

const filename = process.argv[2] || 'C:/Users/HP/Downloads/Rushhour_Overview_Hero_Updated.html'
const reference = fs.readFileSync(filename, 'utf8')
const styles = [...reference.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
  .map((match) => match[1])
  .join('\n')
const canonical = (rule) =>
  rule.nodes
    .filter((node) => node.type === 'decl')
    .map(
      (node) =>
        `${node.prop}:${node.value.replace(/url\([\s\S]*?\)/g, 'url(ASSET)')}${node.important ? '!important' : ''}`,
    )
    .join(';')
    .replace(/\s+/g, ' ')
const imported = new Set()
postcss
  .parse(fs.readFileSync('src/assets/event-workspace/reference.css', 'utf8'))
  .walkRules((rule) => imported.add(canonical(rule)))
let rules = 0
postcss.parse(styles).walkRules((rule) => {
  assert.ok(imported.has(canonical(rule)), `Missing reference declarations: ${rule.selector}`)
  rules++
})
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
const hashes = new Set(
  [...reference.matchAll(/data:image\/(?:png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)/g)].map(
    (match) => hash(Buffer.from(match[1], 'base64')),
  ),
)
let assets = 0
for (const directory of ['src/assets/event-workspace']) {
  for (const filename of fs.readdirSync(directory).filter((name) => /\.(jpg|png)$/.test(name))) {
    assert.ok(
      hashes.has(hash(fs.readFileSync(`${directory}/${filename}`))),
      `Artwork differs: ${filename}`,
    )
    assets++
  }
}
console.log(`PASS ${rules} reference CSS declaration groups and ${assets} original artwork files`)

const values = new Map()
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
}
globalThis.location = new URL('http://localhost:5174/')
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
  const service = await server.ssrLoadModule('/src/services/dashboardService.js')
  const { story } = await server.ssrLoadModule('/src/components/event-workspace/promotionModel.js')
  const storyScript = reference.match(
    /<script id="rh-story-and-copy-actions">([\s\S]*?)<\/script>/,
  )[1]
  const originalStory = [...storyScript.matchAll(/"data:image\/[^;]+;base64,([A-Za-z0-9+/=]+)"/g)]
  assert.equal(story.length, originalStory.length)
  story.forEach((slide, index) =>
    assert.equal(
      hash(fs.readFileSync(slide.image.replace(/^\//, ''))),
      hash(Buffer.from(originalStory[index][1], 'base64')),
      `Story image ${index + 1}`,
    ),
  )
  console.log('PASS exact story image bytes and slide order')
  async function capture(page, query = {}) {
    let state, discounts
    const warnings = []
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:pathMatch(.*)*', component: { render: () => null } }],
    })
    await router.push({ path: '/dashboard/events/900001', query })
    const navigation = []
    const app = createSSRApp(Views, {
      page,
      overview: previewOverview,
      eventId: previewOverview.event.id,
      onNavigate: (destination) => navigation.push(destination),
    })
    app.use(createPinia()).use(router)
    app.config.warnHandler = (message) => warnings.push(message)
    app.mixin({
      created() {
        if (this.$.type.__name === 'WorkspaceViews') state = this.$.setupState
        if (this.$.type.__name === 'WorkspaceDiscountCodes') discounts = this.$.setupState
      },
    })
    const html = await renderToString(app)
    assert.deepEqual(warnings, [])
    return { state, discounts, html, navigation }
  }
  const settings = await capture('settings')
  const ticket = settings.state.settingsTickets[0]
  await settings.state.editTicket(ticket)
  settings.state.ticketForm.price = 9000
  settings.state.ticketForm.capacity = ticket.sold_units - 1
  await settings.state.saveTicket()
  assert.match(settings.state.ticketFeedback, /existing purchases/)
  assert.equal(values.has('rushhour:event-workspace:900001:ticket-settings'), false)
  settings.state.ticketForm.capacity = ticket.effective_capacity_units + 20
  await settings.state.saveTicket()
  assert.equal(settings.state.editingTicket, null)
  const saved = await service.getDashboardOverview(900001)
  assert.equal(saved.ticket_types[0].price_minor, 900000)
  assert.equal(saved.ticket_types[0].available_units, ticket.available_units + 20)
  assert.equal(
    saved.ticket_types[0].revenue_minor,
    ticket.revenue_minor,
    'past purchases retain their original prices',
  )
  assert.equal(saved.revenue.total_minor, previewOverview.revenue.total_minor)
  settings.state.details.name = 'An updated event'
  await settings.state.saveDetails()
  assert.equal((await service.getDashboardOverview(900001)).event.title, 'An updated event')
  assert.equal((await service.getDashboardEvents())[0].title, 'An updated event')
  console.log(
    'PASS inline ticket validation/save and shared preview updates without rewriting past revenue',
  )

  const { discounts, state, html } = await capture('discounts')
  assert.match(html, /data-route="discounts"/)
  assert.match(html, /You can give buyers a special price\./)
  assert.ok(
    !html.includes('rh-promo-tab-promotion'),
    'standalone codes retain their own reference screen',
  )
  await discounts.openEditor()
  Object.assign(discounts.offer, { name: 'Friends offer', code: 'FRIENDS15', value: 15 })
  discounts.saveDiscount()
  assert.equal(discounts.editor, false)
  assert.equal(state.codes[0].code, 'FRIENDS15')
  const paused = await capture('discounts')
  paused.discounts.codeAction(paused.state.codes[0])
  assert.equal(paused.state.codes[0].active, false)
  const resumed = await capture('discounts')
  resumed.discounts.codeAction(resumed.state.codes[0])
  assert.equal(resumed.state.codes[0].active, true)
  await discounts.openEditor(state.codes[0])
  discounts.closeEditor()
  assert.equal(discounts.editor, false)
  discounts.search = 'SUNSET10'
  assert.equal(discounts.filtered.length, 1)
  console.log(
    'PASS standalone discount create/edit/cancel, pause/resume, search and reference screen',
  )
  const detail = await capture('discount-detail', { screen: 'discount', code: 'FRIENDS15' })
  assert.match(detail.html, /data-route="discount-detail"/)
  for (const text of [
    'Back to discount codes',
    'Used so far',
    'Uses left',
    'How many times was it used?',
    'About this discount',
  ])
    assert.ok(detail.html.includes(text), text)
  detail.discounts.showDetails(detail.state.codes[0])
  assert.deepEqual(detail.navigation.at(-1), {
    view: 'promo',
    screen: 'discount',
    code: 'FRIENDS15',
  })
  const editor = await capture('discounts', { screen: 'edit-discount', code: 'FRIENDS15' })
  assert.equal(editor.discounts.editor, true)
  assert.equal(editor.discounts.offer.code, 'FRIENDS15')
  console.log('PASS reference discount details, list navigation and edit deep links')
} finally {
  await server.close()
}
