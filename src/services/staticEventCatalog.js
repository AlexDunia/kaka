import { DASHBOARD_PREVIEW } from './dashboardPreview'
// Two complete static public events, kept separate from database-owned records.
import concert from '@/assets/event-workspace/reference-a091d7590289.jpg'
import { normalizeEventProfile } from '@/utils/eventProfile'
const momentOne = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=750&q=75'
const momentTwo = 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=750&q=75'

const related = [
  {
    id: 900002,
    title: 'Neon City Sessions',
    slug: 'neon-city-sessions',
    date: '2027-01-22T18:00:00+01:00',
    venue: 'Lagos, Nigeria',
    main_image: momentOne,
  },
  {
    id: 900003,
    title: 'Rooftop Conversations',
    slug: 'rooftop-conversations',
    date: '2027-02-06T17:00:00+01:00',
    venue: 'Victoria Island, Lagos',
    main_image: momentTwo,
  },
  {
    id: 900004,
    title: 'Culture in the City',
    slug: 'culture-in-the-city',
    date: '2027-02-20T18:00:00+01:00',
    venue: 'Lagos, Nigeria',
    main_image: concert,
  },
]
function buildStaticEvent(id) {
  const selected = related.find((event) => event.id === Number(id))
  return {
    id: 900001,
    title: 'Lagos after sunset',
    slug: 'lagos-after-sunset',
    summary: 'One city. One night. The kind of memories you keep talking about.',
    description:
      'The city comes alive after sunset. Join us for a carefully curated night of music, energy, creativity and connection — with familiar faces, new friends and the very best of Lagos after dark.\n\nFrom the first set to the last song, every detail is built around one simple idea: bringing good people together for a memorable night out. Come as you are and find your people.',
    date: '2026-12-12T18:00:00+01:00',
    ends_at: '2026-12-12T23:00:00+01:00',
    timezone: 'Africa/Lagos',
    main_image: concert,
    category: 'Music',
    tags: ['Highlife', 'Live experience', 'One city', 'Lagos, Nigeria · December 2026'],
    address: {
      venue_name: 'Eko Hotel & Suites',
      city: 'Victoria Island',
      state: 'Lagos',
      country: 'Nigeria',
    },
    organiser: { name: 'Moonlight Collective', bio: 'The team bringing this event to life.' },
    guests: [
      {
        id: 'zara',
        name: 'Zara Bello',
        role: 'Live performer',
        bio: 'Zara brings soulful vocals and a warm stage presence to the evening.',
        image:
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=480&h=580&fit=crop&q=80',
      },
      {
        id: 'tobi',
        name: 'Tobi Adeyemi',
        role: 'Special guest',
        bio: 'Join Tobi for a live set celebrating music and community.',
        image:
          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=480&h=580&fit=crop&q=80',
      },
      {
        id: 'mira',
        name: 'Mira Okon',
        role: 'Event host',
        bio: 'Mira will guide the evening and help everyone feel welcome.',
        image:
          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=480&h=580&fit=crop&q=80',
      },
      {
        id: 'deji',
        name: 'Deji Cole',
        role: 'Guest DJ',
        bio: 'Deji closes the evening with a selection of crowd favourites.',
        image:
          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=480&h=580&fit=crop&q=80',
      },
    ],
    schedule: [
      {
        time: '6:00 PM',
        title: 'Doors open',
        label: 'Welcome',
        description: 'Arrive, settle in and soak up the atmosphere.',
      },
      {
        time: '7:00 PM',
        title: 'The warm-up',
        label: 'Music',
        description: 'Music, mingling and the first wave of energy.',
      },
      {
        time: '8:30 PM',
        title: 'Main experience',
        label: 'Headline',
        description: 'Live sets and unforgettable crowd moments.',
      },
      {
        time: '10:30 PM',
        title: 'The after-hours flow',
        label: 'Late night',
        description: 'Keep moving, keep connecting and enjoy the night.',
      },
    ],
    secondaryImages: [
      { url: concert, caption: 'A night together' },
      { url: momentOne, caption: 'Live on stage' },
      { url: momentTwo, caption: 'From the crowd' },
    ],
    faqs: [
      {
        question: 'What time should I arrive?',
        answer: 'Doors open at 6:00 PM. Arrive early to settle in before the first set.',
      },
      {
        question: 'What should I bring?',
        answer: 'Bring your ticket confirmation and a valid photo ID.',
      },
      {
        question: 'Can I book a table for my group?',
        answer: 'Yes. Choose a table in the ticket selection to keep your group together.',
      },
    ],
    caption_title: 'Something worth showing up for.',
    caption_description: 'Live music, good people and an unforgettable night.',
    crew: [
      { name: 'Ada Okafor', role: 'Creative director' },
      { name: 'Emeka Nwosu', role: 'Production lead' },
    ],
    ticketTypes: [
      {
        id: 990001,
        name: 'General admission',
        price: 10000,
        quantity: 240,
        maxPerPerson: 6,
        description: 'Entry for one person.',
      },
      {
        id: 990002,
        name: 'VIP',
        price: 20000,
        quantity: 30,
        maxPerPerson: 4,
        description: 'Reserved seating close to the stage.',
      },
      {
        id: 990003,
        name: 'Table for 4',
        price: 60000,
        quantity: 5,
        maxPerPerson: 2,
        unitType: 'table',
        peoplePerUnit: 4,
        description: 'A reserved table for your group.',
      },
      {
        id: 990004,
        name: 'Early bird',
        price: 8000,
        quantity: 40,
        description: 'Early booking admission.',
      },
    ],
    related_events: [],
    source: 'static',
    ...selected,
  }
}

const first = buildStaticEvent(900001)
first.ticketTypes.sort((left, right) =>
  left.name === 'Early bird' ? -1 : right.name === 'Early bird' ? 1 : 0,
)
const second = buildStaticEvent(900002)
second.address = { ...second.address, venue_name: 'Terra Kulture' }
second.tags = ['Highlife', 'Live experience', 'One city', 'Lagos, Nigeria · January 2027']
second.description =
  'Join us for live music, thoughtful performances and an evening with the city’s creative community. Neon City Sessions brings artists and listeners together in a welcoming space.\n\nTake your time, meet new people and enjoy each set. Your ticket includes entry to every performance on the schedule.'
second.ticketTypes = first.ticketTypes.map((ticket, index) => ({ ...ticket, id: 991001 + index }))
second.ends_at = '2027-01-22T23:00:00+01:00'
const brief = (event) => ({
  id: event.id,
  title: event.title,
  slug: event.slug,
  date: event.date,
  main_image: event.main_image,
  venue: event.address?.venue_name || event.venue,
  organizer: event.organiser.name,
  source: 'static',
})
first.related_events = [brief(second)]
second.related_events = [brief(first)]
for (const event of [first, second])
  for (const guest of event.guests) guest.events = [brief(first), brief(second)]
for (const event of [first, second]) event.demo = true
export const staticEvents = DASHBOARD_PREVIEW ? [first, second] : []
export const getStaticEvent = (id) => staticEvents.find((event) => event.id === Number(id)) || null
export const getEventProfilePreview = getStaticEvent

export function quoteStaticTickets(items) {
  const rows = items.map((item) => {
    const event = getStaticEvent(item.eventId)
    const profile = normalizeEventProfile(event || {})
    const ticket = profile.tickets.find((candidate) => candidate.id === Number(item.ticketId))
    const quantity = Number(item.quantity)
    if (
      !profile.canBuy ||
      !ticket?.available ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > ticket.max
    )
      throw new Error(
        'Some selected tickets are no longer available. Please review your selection.',
      )
    return {
      event_id: profile.id,
      event_title: profile.title,
      ticket_type_id: ticket.id,
      ticket_name: ticket.name,
      quantity,
      unit_price_minor: Math.round(ticket.price * 100),
      line_total_minor: Math.round(ticket.price * 100) * quantity,
    }
  })
  return {
    currency: 'NGN',
    items: rows,
    total_minor: rows.reduce((total, item) => total + item.line_total_minor, 0),
  }
}
