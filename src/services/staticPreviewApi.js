import { staticEvents } from './staticEventCatalog'
import { previewOverview } from './dashboardPreview'
import { isStaticPreview } from './staticPreviewMode'
import { eventInstant } from '@/utils/eventProfile'

export const STATIC_EVENTS_KEY = 'rushhour:static-events:v1'
const clone = (value) => JSON.parse(JSON.stringify(value))

function fail(status, message) {
  const error = new Error(message)
  error.response = { status, data: { message } }
  throw error
}

const seedRecord = (event) => ({
  id: event.id,
  version: 1,
  status: 'active',
  sample: event,
  form: {
    title: event.title,
    startsAt: event.date,
    startsAtLocal: event.date.slice(0, 19),
    endsAt: event.ends_at,
    endsAtLocal: event.ends_at.slice(0, 19),
    timeZone: event.timezone,
    eventType: 'single',
    format: 'in-person',
    venue: event.address.venue_name,
    city: event.address.city,
    category: event.category,
    description: event.description,
    organiser: event.organiser.name,
    coverImage: event.main_image,
    secondaryImages: event.secondaryImages.map((image) => image.url),
    tags: event.tags.join(', '),
    ticketMode: event.ticket_mode,
    freeCapacity: event.freeCapacity || null,
    tickets: event.ticketTypes.map((ticket) => ({
      ...ticket,
      unitType: ticket.unitType || 'individual',
      units: ticket.quantity,
      peoplePerUnit: ticket.peoplePerUnit || 1,
      visible: true,
      perks: ticket.description,
    })),
    attendeeFields: [],
    extraDetails: [],
  },
})

function records() {
  const raw = localStorage.getItem(STATIC_EVENTS_KEY)
  if (!raw) return staticEvents.map(seedRecord)
  try {
    const saved = JSON.parse(raw)
    if (
      !Array.isArray(saved) ||
      !saved.every(
        (row) => Number.isSafeInteger(row.id) && row.form && Number.isInteger(row.version),
      )
    )
      throw new Error()
    return saved
  } catch {
    fail(
      422,
      'Your saved static events could not be read. Keep a copy of browser storage before resetting this preview.',
    )
  }
}

function persist(rows) {
  try {
    localStorage.setItem(STATIC_EVENTS_KEY, JSON.stringify(rows))
  } catch {
    fail(
      422,
      'Your browser could not save this event. Free some browser storage or use smaller images, then try again.',
    )
  }
}

function publicEvent(record) {
  const form = record.form
  const tickets =
    form.ticketMode === 'free'
      ? [
          {
            id: record.id * 100,
            name: 'Free entry',
            price: 0,
            quantity: form.freeCapacity ?? 100,
            maxPerPerson: 1,
          },
        ]
      : form.tickets
  return {
    ...record.sample,
    ...form,
    id: record.id,
    status: record.status,
    slug: form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    date: form.startsAt || form.startsAtLocal,
    starts_at: form.startsAt || form.startsAtLocal,
    ends_at: form.endsAt || form.endsAtLocal,
    timezone: form.timeZone,
    main_image: form.coverImage,
    cover_image: form.coverImage,
    ticket_mode: form.ticketMode,
    ticketTypes: tickets,
    ticket_types: tickets,
    address: { venue_name: form.venue, city: form.city, country: 'Nigeria' },
    organiser: { name: form.organiser },
    tags:
      typeof form.tags === 'string'
        ? form.tags
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    demo: true,
    source: 'static',
  }
}

function dashboardEvent(record) {
  const event = publicEvent(record)
  return {
    ...event,
    phase:
      record.status === 'draft'
        ? 'draft'
        : eventInstant(event.ends_at, event.timezone) < new Date()
          ? 'ended'
          : eventInstant(event.starts_at, event.timezone) <= new Date()
            ? 'live'
            : 'upcoming',
    days_to_go: Math.max(
      0,
      Math.ceil((eventInstant(event.starts_at, event.timezone) - Date.now()) / 86400000),
    ),
  }
}

function overview(record) {
  const result = clone(previewOverview)
  result.event = dashboardEvent(record)
  result.notifications = []
  result.ticket_types = result.event.ticketTypes.map((ticket) => ({
    ...ticket,
    effective_capacity_units: Number(ticket.quantity ?? ticket.units ?? 0),
    available_units: Number(ticket.quantity ?? ticket.units ?? 0),
    sold_units: 0,
    reserved_units: 0,
    revenue_minor: 0,
    price_minor: Math.round(Number(ticket.price) * 100),
    sold_percent: 0,
  }))
  const capacity = result.ticket_types.reduce(
    (sum, ticket) => sum + ticket.effective_capacity_units,
    0,
  )
  result.sales = {
    units_sold: 0,
    capacity_units: capacity,
    available_units: capacity,
    reserved_units: 0,
    sold_percent: 0,
    this_week_units: 0,
    week_growth_state: 'flat',
    week_growth_percent: 0,
    admission_entries_covered: 0,
  }
  result.revenue = { currency: 'NGN', total_minor: 0, this_week_minor: 0 }
  result.traffic = {
    page_views: 0,
    unique_visitors: 0,
    converted_visitors: 0,
    conversion_percent: 0,
  }
  result.buyers = { unique_buyers: 0, average_spend_minor: 0 }
  result.sources = []
  result.sales_trend = { '7d': [], '30d': [], all: [] }
  return result
}

function page(rows, params = {}) {
  const perPage = Math.min(100, Math.max(1, Number(params.per_page) || 12))
  const current = Math.max(1, Number(params.page) || 1)
  const last = Math.max(1, Math.ceil(rows.length / perPage))
  return {
    data: rows.slice((current - 1) * perPage, current * perPage),
    current_page: current,
    last_page: last,
    total: rows.length,
    meta: { current_page: current, last_page: last, total: rows.length, per_page: perPage },
  }
}

function handle(config) {
  const path = config.url.split('?')[0]
  const method = (config.method || 'get').toLowerCase()
  const input = typeof config.data === 'string' ? JSON.parse(config.data) : config.data || {}
  const params = config.params || {}
  if (path === '/user' && method === 'get')
    return { id: 'static-organiser', name: 'Preview organiser', email: 'preview@example.test' }
  if (path === '/categories')
    return {
      data: ['Music', 'Community', 'Arts', 'Sports', 'Festivals'].map((name) => ({
        name,
        slug: name.toLowerCase(),
      })),
    }
  if (path === '/subcategories') return { data: [] }
  const rows = records()
  if (path === '/dashboard/events' && method === 'get')
    return page(rows.map(dashboardEvent), params)
  if (path === '/events' && method === 'get') {
    let events = rows.filter((row) => row.status === 'active').map(publicEvent)
    if (params.q)
      events = events.filter((event) =>
        `${event.title} ${event.description}`
          .toLowerCase()
          .includes(String(params.q).toLowerCase()),
      )
    if (params.category)
      events = events.filter(
        (event) =>
          String(event.category || '').toLowerCase() === String(params.category).toLowerCase(),
      )
    if (params.city)
      events = events.filter((event) =>
        `${event.city} ${event.address.city}`
          .toLowerCase()
          .includes(String(params.city).toLowerCase()),
      )
    if (params.sort === 'date')
      events.sort((a, b) => eventInstant(a.date, a.timezone) - eventInstant(b.date, b.timezone))
    return page(events, params)
  }
  if (path === '/create-event' && method === 'post') {
    if (!input.title?.trim()) fail(422, 'Give your event a name before saving.')
    const id = Math.max(900100, ...rows.map((row) => row.id)) + 1
    const record = { id, version: 1, status: 'draft', form: normalizeForm(input, id) }
    rows.push(record)
    persist(rows)
    return { data: record }
  }
  const match = path.match(/^\/(?:dashboard\/events|events|create-event)\/(\d+)(?:\/(.*))?$/)
  if (match) {
    const record = rows.find((row) => row.id === Number(match[1]))
    if (!record) fail(404, 'This event is not in your static version.')
    const action = match[2]
    if (path.startsWith('/dashboard/') && action === 'overview' && method === 'get')
      return { data: overview(record) }
    if (path.startsWith('/events/') && !action && method === 'get')
      return { data: publicEvent(record) }
    if (path.startsWith('/events/') && action === 'track-view' && method === 'post') return {}
    if (path.startsWith('/events/') && action === 'registration' && method === 'get')
      return {
        data: {
          booking_supported: record.form.ticketMode === 'free',
          available: record.form.freeCapacity ?? 100,
          fields: record.form.attendeeFields || [],
        },
      }
    if (path.startsWith('/create-event/')) {
      if (method === 'get' && !action) return { data: record }
      if ((method === 'patch' && !action) || (method === 'post' && action === 'publish')) {
        if (input.version !== record.version)
          fail(409, 'This static event changed in another tab. Reload it before saving again.')
        if (action === 'publish') {
          if (
            !record.form.title ||
            !record.form.coverImage ||
            !(record.form.startsAt || record.form.startsAtLocal)
          )
            fail(422, 'Add a name, cover photo and start time before publishing this static event.')
          record.status = 'active'
        } else {
          const merged = { ...record.form, ...input }
          for (const key of ['startsAt', 'endsAt']) {
            if (Object.hasOwn(input, `${key}Local`)) merged[key] = null
            else if (input[key]) delete merged[`${key}Local`]
          }
          record.form = normalizeForm(merged, record.id)
        }
        record.version++
        persist(rows)
        return { data: record }
      }
    }
  }
  fail(422, 'This action needs a connected account and is unavailable in the static version.')
}

function normalizeForm(input, eventId) {
  const form = clone(input)
  delete form.version
  delete form.ticketCollectionMode
  for (const key of ['startsAt', 'endsAt']) {
    // The editor hydrates wall-clock fields; retain them alongside any saved instant.
    if (Object.hasOwn(input, `${key}Local`)) form[key] = null
    else if (input[key]) form[`${key}Local`] = input[key].slice(0, 19)
  }
  form.tickets = (form.tickets || []).map((ticket, index) => ({
    ...ticket,
    id: ticket.id || eventId * 100 + index + 1,
  }))
  return form
}

export async function staticPreviewAdapter(config) {
  if (!isStaticPreview()) fail(403, 'Open the static version to use sample events.')
  if (config.signal?.aborted) throw new DOMException('Request cancelled', 'AbortError')
  const run = () => ({
    data: clone(handle(config)),
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  })
  // Serialize writes across tabs where Web Locks are available.
  return globalThis.navigator?.locks ? navigator.locks.request(STATIC_EVENTS_KEY, run) : run()
}
