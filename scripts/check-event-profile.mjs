import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { createRenderer, h, nextTick } from 'vue'
import { compileScript, parse } from '@vue/compiler-sfc'
import { normalizeEventProfile, profileDate, safePublicUrl } from '../src/utils/eventProfile.js'
import { commitEventSelection } from '../src/utils/eventSelection.js'

test('server booking closure disables paid selection without hiding cancellation details', () => {
  const profile = normalizeEventProfile({
    id: 71,
    title: 'Cancelled event',
    ticket_mode: 'paid',
    lifecycle_state: 'cancelled',
    booking_supported: false,
    tickets: [{ id: 3, name: 'General', price: 1000, capacity: 10 }],
  })
  assert.equal(profile.canBuy, false)
  assert.equal(profile.lifecycleState, 'cancelled')
  assert.equal(commitEventSelection({}, profile, [{ quantity: 1 }]), false)
})

const catalogSource = (
  await readFile(new URL('../src/services/staticEventCatalog.js', import.meta.url), 'utf8')
)
  .replace(
    "import { DASHBOARD_PREVIEW } from './dashboardPreview'",
    'const DASHBOARD_PREVIEW = true',
  )
  .replace(/import concert from ['"][^'"]+['"];?/, "const concert = '/event-cover.jpg'")
  .replace(
    "'@/utils/eventProfile'",
    JSON.stringify(new URL('../src/utils/eventProfile.js', import.meta.url).href),
  )
const { staticEvents, quoteStaticTickets } = await import(
  `data:text/javascript;base64,${Buffer.from(catalogSource).toString('base64')}`
)

const now = new Date('2026-11-23T12:00:00Z')

test('the first two static events include every profile section and use canonical checkout prices', () => {
  assert.equal(staticEvents.length, 2)
  assert.equal(staticEvents[0].title, 'Lagos after sunset')
  for (const source of staticEvents) {
    const profile = normalizeEventProfile(source, now)
    assert.ok(
      profile.guests.length &&
        profile.schedule.length &&
        profile.images.length &&
        profile.faq.length &&
        profile.crew.length,
    )
    assert.ok(profile.captionTitle && profile.captionDescription)
    assert.ok(profile.tickets.some((ticket) => ticket.name === 'Early bird' && ticket.available))
  }
  const quote = quoteStaticTickets([
    { eventId: 900001, ticketId: 990004, quantity: 2, pricePerTicket: 0 },
  ])
  assert.equal(quote.items[0].ticket_name, 'Early bird')
  assert.equal(quote.total_minor, 1600000)
  assert.throws(
    () => quoteStaticTickets([{ eventId: 900001, ticketId: 991001, quantity: 1 }]),
    /no longer available/,
  )
})

test('maps organiser content from Create Event without fabricating guests, photos or tickets', () => {
  const source = {
    id: 10,
    title: 'An evening together',
    startsAt: '2026-12-12T18:00:00+01:00',
    timeZone: 'Africa/Lagos',
    organiser: 'Our team',
    venue: 'Lagos',
    tickets: [{ id: 35, name: 'Admission', price: 8000, units: 4, maxPerPerson: 6 }],
    extraDetails: [
      { type: 'speakers', value: 'Ada — Host\nTobi | Performer' },
      { type: 'agenda', value: '6:00 PM Doors open\n7:30 PM – Live performance' },
      { type: 'faq', value: 'When do doors open?\nAt 6 PM.\n\nWhat should I bring?\nYour ticket.' },
      { type: 'parking', label: 'Parking', value: 'Parking is available.' },
    ],
  }
  const copy = JSON.stringify(source),
    event = normalizeEventProfile(source, now)
  assert.equal(event.organiser.name, 'Our team')
  assert.deepEqual(
    event.guests.map(({ name, role }) => ({ name, role })),
    [
      { name: 'Ada', role: 'Host' },
      { name: 'Tobi', role: 'Performer' },
    ],
  )
  assert.deepEqual(
    event.schedule.map(({ time, title }) => ({ time, title })),
    [
      { time: '6:00 PM', title: 'Doors open' },
      { time: '7:30 PM', title: 'Live performance' },
    ],
  )
  assert.equal(event.faq[1].answer, 'Your ticket.')
  assert.equal(event.extras[0].label, 'Parking')
  assert.equal(event.tickets[0].id, 35)
  assert.equal(event.tickets[0].max, 4)
  assert.equal(event.canBuy, true)
  assert.equal(JSON.stringify(source), copy)
  const empty = normalizeEventProfile({}, now)
  assert.deepEqual(
    [empty.guests, empty.schedule, empty.images, empty.faq, empty.tickets],
    [[], [], [], [], []],
  )
  assert.equal(empty.canBuy, false)
})

test('keeps numeric ticket IDs, filters hidden tiers, and respects sale windows and stock', () => {
  const event = normalizeEventProfile(
    {
      ticketTypes: [
        { id: '21', name: 'Open', price: 8000, quantity: 4 },
        { id: 22, name: 'Sold out', price: 6000, quantity: 0 },
        { id: 23, name: 'Hidden', price: 0, quantity: 4, visible: false },
        { id: 24, name: 'Future', price: 9000, quantity: 3, salesStart: '2026-12-01T12:00:00Z' },
        { id: 25, name: 'Ended', price: 9000, quantity: 3, salesEnd: '2026-11-01T12:00:00Z' },
        { name: 'No server ID', price: 1000, quantity: 4 },
      ],
    },
    now,
  )
  assert.equal(event.tickets.length, 5)
  assert.deepEqual(
    event.tickets.map((ticket) => ticket.available),
    [true, false, false, false, false],
  )
  assert.equal(event.tickets[0].id, 21)
  assert.equal(
    normalizeEventProfile(
      { ends_at: '2026-11-01T12:00:00Z', tickets: [{ id: 1, price: 0, units: 4 }] },
      now,
    ).canBuy,
    false,
  )
  assert.equal(
    normalizeEventProfile(
      { sales_status: { is_expired: true }, tickets: [{ id: 1, price: 0, units: 4 }] },
      now,
    ).canBuy,
    false,
  )
  assert.equal(
    normalizeEventProfile({ ticket_mode: 'paid', tickets: [{ id: 1, price: 0, units: 4 }] }, now)
      .price,
    null,
  )
  assert.equal(normalizeEventProfile({ ticket_mode: 'free', tickets: [] }, now).price, 0)
})

test('formats the event timezone and rejects executable media URLs', () => {
  assert.equal(
    profileDate('2026-12-12T18:00:00', 'Africa/Lagos', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }),
    '18:00',
  )
  assert.equal(
    profileDate('2026-12-12T17:00:00Z', 'Africa/Lagos', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }),
    '18:00',
  )
  assert.equal(profileDate('invalid', 'Africa/Lagos', { year: 'numeric' }), '')
  assert.equal(safePublicUrl('javascript:alert(1)'), '')
  assert.equal(safePublicUrl('//untrusted.example/test.jpg'), '')
  assert.equal(safePublicUrl('/images/cover.jpg'), '/images/cover.jpg')
})

// Exercise the actual Vue component with a lightweight renderer. This is a
// component test, not a browser/layout substitute; no DOM or external services.
const { descriptor } = parse(
  await readFile(new URL('../src/components/EventTicketSelection.vue', import.meta.url), 'utf8'),
)
const compiled = compileScript(descriptor, { id: 'ticket-selection-check', inlineTemplate: true })
const componentContent = compiled.content.replace(
  /import EventPublicControls from ['"]@\/components\/EventPublicControls\.vue['"];?/,
  'const EventPublicControls = { render: () => null }',
)
const moduleCode = componentContent.replace(
  /from (["'])([^"']+)\1/g,
  (_, quote, specifier) =>
    `from ${quote}${specifier.startsWith('@/') ? new URL('../src/' + specifier.slice(2) + '.js', import.meta.url).href : import.meta.resolve(specifier)}${quote}`,
)
const { default: TicketSelection } = await import(
  `data:text/javascript;base64,${Buffer.from(moduleCode).toString('base64')}`
)
const renderer = createRenderer({
  createElement: (tag) => ({
    tag,
    children: [],
    props: {},
    open: false,
    showModal() {
      this.open = true
    },
    close() {
      this.open = false
    },
  }),
  createText: (text) => ({ text }),
  createComment: (text) => ({ text }),
  insert(node, parent, anchor) {
    if (node.parent) {
      const previous = node.parent.children.indexOf(node)
      if (previous >= 0) node.parent.children.splice(previous, 1)
    }
    const index = anchor ? parent.children.indexOf(anchor) : -1
    if (index >= 0) parent.children.splice(index, 0, node)
    else parent.children.push(node)
    node.parent = parent
  },
  remove(node) {
    if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1)
  },
  setText(node, text) {
    node.text = text
  },
  setElementText(node, text) {
    node.text = text
    node.children = []
  },
  parentNode: (node) => node.parent,
  nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1] || null,
  patchProp(node, key, previous, next) {
    node.props[key] = next
  },
})
const all = (node) => [node, ...(node.children || []).flatMap(all)]
const textOf = (node) => `${node.text || ''}${(node.children || []).map(textOf).join('')}`
test('ticket picker caps quantities, filters tables, reviews totals and emits real checkout IDs', async () => {
  globalThis.window = { scrollTo() {} }
  const profile = normalizeEventProfile(
    {
      id: 10,
      tickets: [
        { id: 21, name: 'Admission', price: 8000, units: 2, maxPerPerson: 4 },
        { id: 22, name: 'Table', price: 60000, units: 1, unitType: 'table', peoplePerUnit: 4 },
        { id: 23, name: 'Sold out', price: 4000, units: 0 },
      ],
    },
    now,
  )
  const root = { children: [] },
    emitted = []
  renderer.render(h(TicketSelection, { profile, onCheckout: (items) => emitted.push(items) }), root)
  await nextTick()
  await nextTick()
  const find = (predicate) => all(root).find(predicate)
  const button = (label) =>
    find(
      (node) =>
        node.tag === 'button' &&
        textOf(node)
          .trim()
          .replace(/\s*\u2192$/, '') === label,
    )
  const add = () => find((node) => node.props?.['aria-label'] === 'Add one Admission')
  assert.equal(
    find((node) => node.tag === 'dialog'),
    undefined,
  )
  assert.ok(find((node) => node.tag === 'header'))
  assert.equal(button('Continue').props.disabled, true)
  assert.equal(
    find((node) => node.props?.['aria-label'] === 'Add one Sold out').props.disabled,
    true,
  )
  add().props.onClick()
  await nextTick()
  add().props.onClick()
  await nextTick()
  assert.equal(add().props.disabled, true)
  assert.equal(find((node) => node.props?.['aria-label'] === 'Admission selected').text, '2')
  button('Tables').props.onClick()
  await nextTick()
  assert.equal(add(), undefined)
  find((node) => node.props?.['aria-label'] === 'Add one Table').props.onClick()
  await nextTick()
  button('Continue').props.onClick()
  await nextTick()
  assert.match(textOf(root), /Review your tickets/)
  assert.match(textOf(root), /76,000/)
  button('Continue to checkout').props.onClick()
  assert.deepEqual(
    emitted[0].map(({ id, quantity }) => ({ id, quantity })),
    [
      { id: 21, quantity: 2 },
      { id: 22, quantity: 1 },
    ],
  )
  renderer.render(null, root)
  delete globalThis.window
})

test('database field names and stored JSON map to the complete public profile', () => {
  const event = normalizeEventProfile(
    {
      id: 50,
      event_timezone: 'Africa/Lagos',
      extra_details: JSON.stringify([{ type: 'parking', label: 'Parking', value: 'On site.' }]),
      public_profile: {
        summary: 'A short introduction.',
        caption_title: 'Join us.',
        caption_description: 'An evening together.',
        guests: [{ name: 'Ada', role: 'Host' }],
        schedule: [{ time: '6 PM', title: 'Welcome' }],
        moments: [{ url: '/storage/photo.jpg', caption: 'On stage' }],
        faqs: [{ question: 'When?', answer: 'At 6 PM.' }],
        crew: [{ name: 'Tobi', role: 'Producer' }],
      },
      ticket_types: [
        {
          id: 51,
          price: '8000.00',
          quantity: 10,
          max_per_person: 2,
          sales_start_date: '2026-12-01T12:00:00Z',
          people_per_unit: 4,
          unit_type: 'table',
        },
      ],
    },
    now,
  )
  assert.equal(event.captionTitle, 'Join us.')
  assert.equal(event.guests[0].name, 'Ada')
  assert.equal(event.images[0].caption, 'On stage')
  assert.equal(event.faq[0].answer, 'At 6 PM.')
  assert.equal(event.extras[0].value, 'On site.')
  assert.equal(event.tickets[0].max, 2)
  assert.equal(event.tickets[0].available, false)
})

test('review selection replaces prior tickets for the same event and preserves unrelated cart items', () => {
  const profile = normalizeEventProfile(
    {
      id: 10,
      title: 'Evening together',
      tickets: [
        { id: 21, name: 'Early bird', price: 8000, units: 40 },
        { id: 22, name: 'Table', price: 60000, units: 5, unitType: 'table' },
      ],
    },
    now,
  )
  const cart = {
    items: [
      { eventId: 10, ticketId: 21, quantity: 4 },
      { eventId: 99, ticketId: 100, quantity: 1 },
    ],
    removeItem(eventId, ticketId) {
      this.items = this.items.filter(
        (item) => item.eventId !== eventId || item.ticketId !== ticketId,
      )
    },
    addItem(item) {
      this.items.push(item)
    },
  }
  assert.equal(
    commitEventSelection(cart, profile, [
      { ...profile.tickets[0], quantity: 2 },
      { ...profile.tickets[1], quantity: 1 },
    ]),
    true,
  )
  assert.equal(cart.items.length, 3)
  assert.equal(cart.items.find((item) => item.ticketId === 21).quantity, 2)
  assert.equal(
    cart.items
      .filter((item) => item.eventId === 10)
      .reduce((total, item) => total + item.totalPrice, 0),
    76000,
  )
  assert.equal(cart.items.find((item) => item.eventId === 99).quantity, 1)
  assert.equal(
    commitEventSelection(cart, profile, [{ ...profile.tickets[0], quantity: 41 }]),
    false,
  )
})
