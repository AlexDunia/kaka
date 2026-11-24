// Public event data arrives in both the original API and Create Event shapes.
// Keep this adapter read-only so the profile never changes the organiser's data.
const array = (value) => {
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}
const text = (value) => (typeof value === 'string' ? value.trim() : '')
export const safePublicUrl = (value) => {
  const url = text(value)
  return /^(https?:\/\/|\/(?!\/)|data:image\/(?:png|jpeg|webp|gif);base64,)/i.test(url) ? url : ''
}
export const initials = (name) =>
  text(name)
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

// Offset-free dates from Create Event are wall times in the event's timezone,
// independent of the attendee's device timezone.
export function eventInstant(value, timezone = 'Africa/Lagos') {
  if (!value) return new Date(NaN)
  const local =
    typeof value === 'string' &&
    value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/)
  if (!local) return new Date(value)
  const wall = Date.UTC(
    Number(local[1]),
    Number(local[2]) - 1,
    Number(local[3]),
    Number(local[4] || 0),
    Number(local[5] || 0),
    Number(local[6] || 0),
  )
  let instant = wall
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    for (let index = 0; index < 3; index++) {
      const parts = Object.fromEntries(
        formatter.formatToParts(new Date(instant)).map((part) => [part.type, part.value]),
      )
      const represented = Date.UTC(
        Number(parts.year),
        Number(parts.month) - 1,
        Number(parts.day),
        Number(parts.hour),
        Number(parts.minute),
        Number(parts.second),
      )
      const next = wall - (represented - instant)
      if (next === instant) break
      instant = next
    }
    return new Date(instant)
  } catch {
    return new Date(value)
  }
}

export function normalizeEventProfile(source = {}, now = new Date()) {
  const stored = source.public_profile || source.publicProfile || {}
  source = {
    ...source,
    summary: stored.summary || source.summary,
    caption_title: stored.caption_title || source.caption_title,
    caption_description: stored.caption_description || source.caption_description,
    guests: stored.guests?.length ? stored.guests : source.guests,
    schedule: stored.schedule?.length ? stored.schedule : source.schedule,
    secondaryImages: stored.moments?.length
      ? stored.moments
      : source.secondaryImages ||
        source.secondary_images ||
        source.media?.filter((item) => !item.is_cover),
    faqs: stored.faqs?.length ? stored.faqs : source.faqs,
    crew: stored.crew || source.crew,
    related_events: source.related_events || stored.related_events,
  }
  const details = array(source.extraDetails || source.extra_details)
  const extra = (type) => text(details.find((item) => item.type === type)?.value)
  const date =
    source.starts_at || source.startsAt || source.date || source.event_date || source.startsAtLocal
  const end = source.ends_at || source.endsAt || source.end_date || source.endsAtLocal
  const timezone = source.event_timezone || source.timezone || source.timeZone || 'Africa/Lagos'
  const isOnline = source.format === 'online' || source.event_format === 'online'
  const address = source.address || {}
  const venue = isOnline
    ? 'Online event'
    : text(address.venue_name || source.venue || source.location)
  const location = [
    address.street || address.address_line1 || address.address,
    address.city,
    address.state,
    address.country,
  ]
    .filter(Boolean)
    .join(', ')
  const organiserSource = source.organiser || source.organizer || source.organizer_name
  const organiser =
    typeof organiserSource === 'object' && organiserSource
      ? organiserSource
      : { name: text(organiserSource) }
  const rawTickets = array(source.ticketTypes || source.ticket_types || source.tickets)
  const tickets = rawTickets
    .filter(
      (ticket) => !ticket.retired_at && ticket.visible !== false && ticket.is_visible !== false,
    )
    .map((ticket, index) => {
      const price = Number(ticket.price ?? Number(ticket.price_minor) / 100) || 0
      const stockValue =
        ticket.available_quantity ??
        ticket.availableQuantity ??
        ticket.available_units ??
        ticket.quantity ??
        ticket.units
      const remaining = stockValue == null ? null : Math.max(0, Math.floor(Number(stockValue) || 0))
      const starts =
        ticket.sales_start_date || ticket.sales_start || ticket.salesStart || ticket.salesStartLocal
      const ends =
        ticket.sales_end_date || ticket.sales_end || ticket.salesEnd || ticket.salesEndLocal
      const pending = Boolean(starts && eventInstant(starts, timezone) > now)
      const ended = Boolean(ends && eventInstant(ends, timezone) <= now)
      const id = ticket.id ?? ticket.ticket_type_id
      const purchasableId = Number.isInteger(Number(id)) && Number(id) > 0
      const max = Math.max(
        0,
        Math.min(
          Math.floor(
            Number(
              ticket.max_per_person ||
                ticket.maxPerPerson ||
                ticket.max_per_purchase ||
                ticket.maxPerPurchase,
            ) || 10,
          ),
          remaining ?? Infinity,
        ),
      )
      return {
        key: String(id ?? `ticket-${index}`),
        id: purchasableId ? Number(id) : null,
        name: text(ticket.name) || 'Admission',
        price,
        remaining,
        configured: ticket.configured_capacity_units ?? ticket.quantity ?? ticket.units ?? null,
        sold: ticket.sold_units ?? null,
        reserved: ticket.reserved_units ?? null,
        admissionCapacity: ticket.admission_capacity ?? null,
        max,
        description: text(ticket.description || ticket.perks),
        unit:
          ticket.unitType ||
          ticket.unit_type ||
          (/table/i.test(ticket.name) ? 'table' : 'individual'),
        people: Number(ticket.peoplePerUnit || ticket.people_per_unit) || 1,
        available: max > 0 && remaining !== 0 && !pending && !ended && purchasableId && price > 0,
        status:
          remaining === 0
            ? 'Sold out'
            : pending
              ? 'Sales open soon'
              : ended
                ? 'Sales ended'
                : !purchasableId
                  ? 'Tickets unavailable'
                  : '',
      }
    })
  const scheduleSource = array(source.schedule || source.agenda)
  const schedule = scheduleSource.length
    ? scheduleSource.map((item) => ({
        time: text(item.time || item.starts_at),
        title: text(item.title || item.name),
        description: text(item.description),
        label: text(item.label || item.type),
      }))
    : extra('agenda')
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => {
          const match = line.match(
            /^\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)(?:\s*[-–—:·]\s*|\s+)(.*)$/i,
          )
          return match
            ? { time: match[1], title: match[2], description: '' }
            : { time: '', title: line, description: '' }
        })
  const guestSource = array(source.guests || source.speakers || source.featured_guests)
  const guests = guestSource.length
    ? guestSource.map((guest, index) =>
        typeof guest === 'string'
          ? { id: `guest-${index}`, name: guest, role: '', bio: '', image: '', events: [] }
          : {
              ...guest,
              id: guest.id ?? `guest-${index}`,
              name: text(guest.name),
              role: text(guest.role || guest.title),
              bio: text(guest.bio || guest.description),
              image: safePublicUrl(guest.image || guest.photo || guest.avatar),
              events: array(guest.events),
            },
      )
    : extra('speakers')
        .split('\n')
        .filter((line) => line.trim())
        .map((line, index) => {
          const [name, ...role] = line.split(/\s+[–—-]\s+|\s*\|\s*/)
          return {
            id: `guest-${index}`,
            name: name.trim(),
            role: role.join(' · '),
            bio: '',
            image: '',
            events: [],
          }
        })
  const rawFaq = source.faqs?.length ? source.faqs : source.faq
  const faq = Array.isArray(rawFaq)
    ? rawFaq.map((item) => ({
        question: text(item.question || item.title),
        answer: text(item.answer || item.value),
      }))
    : (text(rawFaq) || extra('faq'))
        .split(/\n\s*\n/)
        .filter(Boolean)
        .map((group) => {
          const [question, ...answer] = group.split('\n')
          return answer.length
            ? { question, answer: answer.join('\n') }
            : { question: '', answer: question }
        })
  const images = array(
    source.secondaryImages || source.secondary_images || source.gallery || source.images,
  )
    .map((image) => ({
      src: safePublicUrl(typeof image === 'string' ? image : image.url || image.src || image.path),
      caption: typeof image === 'object' ? text(image.caption || image.alt) : '',
    }))
    .filter((image) => image.src)
  const validEnd = end && Number.isFinite(eventInstant(end, timezone).getTime())
  const salesEnd = source.sales_status?.sales_end || source.sales_end
  const salesEnded = Boolean(
    source.sales_status?.is_expired ||
      (salesEnd && eventInstant(salesEnd, timezone) <= now) ||
      (validEnd && eventInstant(end, timezone) <= now),
  )
  const category = typeof source.category === 'object' ? source.category?.name : source.category
  const tags = [
    ...array(source.sub_categories || source.subCategories),
    ...(Array.isArray(source.tags) ? source.tags : text(source.tags).split(',')),
  ]
    .map((item) => text(typeof item === 'object' ? item.name : item))
    .filter(Boolean)
  const ticketMode = source.ticket_mode || source.ticketMode || null
  const displayedPrices = tickets.filter((ticket) => ticket.price > 0).map((ticket) => ticket.price)
  const price =
    ticketMode === 'free'
      ? 0
      : displayedPrices.length
        ? Math.min(...displayedPrices)
        : Number(source.price) > 0
          ? Number(source.price)
          : null
  return {
    id: source.id,
    demo: source.demo === true,
    title: text(source.title) || 'Event',
    description: text(source.description),
    summary: text(source.summary || source.tagline || source.short_description),
    captionTitle: text(source.caption_title),
    captionDescription: text(source.caption_description),
    crew: array(source.crew),
    date,
    end,
    timezone,
    cover: safePublicUrl(source.main_image || source.coverImage || source.cover_image),
    category: text(category) || 'Event',
    tags: [...new Set(tags)],
    venue,
    location,
    isOnline,
    organiser: {
      name: text(organiser.name),
      bio: text(stored.organiser_bio || organiser.bio),
      image: safePublicUrl(stored.organiser_image || organiser.image),
      website: safePublicUrl(
        organiser.website ||
          source.organiserWebsite ||
          source.organiser_website ||
          source.organizer_website,
      ),
    },
    tickets,
    salesEnded,
    lifecycleState: source.lifecycle_state,
    guests,
    schedule,
    images,
    faq,
    ticketMode,
    registrationFields: array(source.registration_fields),
    canRegister:
      ticketMode === 'free' &&
      !salesEnded &&
      source.booking_supported !== false &&
      source.event_type !== 'recurring',
    price,
    canBuy:
      ticketMode !== 'free' &&
      source.booking_supported !== false &&
      !salesEnded &&
      tickets.some((ticket) => ticket.available && ticket.price > 0),
    extras: details
      .filter(
        (detail) => !['speakers', 'agenda', 'faq'].includes(detail.type) && text(detail.value),
      )
      .map((detail) => ({ label: text(detail.label) || detail.type, value: text(detail.value) })),
    highlights: array(source.event_options || source.eventOptions || source.selectedEventOptions)
      .map((item) => text(typeof item === 'object' ? item.name : item))
      .filter(Boolean),
    related: array(source.related_events || source.relatedEvents),
  }
}

export function profileDate(value, timezone, options) {
  const instant = eventInstant(value, timezone)
  if (!Number.isFinite(instant.getTime())) return ''
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone: timezone, ...options }).format(instant)
  } catch {
    return new Intl.DateTimeFormat('en-GB', options).format(instant)
  }
}
