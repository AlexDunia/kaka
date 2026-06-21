import { APP_DEFAULT_TIME_ZONE, toLocalDateTimeString } from '@/utils/eventDateTime'

export const DEFAULT_CREATE_EVENT_TIPS = [
  {
    id: 'cover-photo',
    body: 'Adding a cover photo increases registrations by up to 3x.',
    status: 'active',
    sortOrder: 10,
  },
  {
    id: 'description',
    body: 'Events with descriptions get 2x more clicks.',
    status: 'active',
    sortOrder: 20,
  },
  {
    id: 'early-bird',
    body: 'Early Bird pricing creates urgency and often sells out faster.',
    status: 'active',
    sortOrder: 30,
  },
  {
    id: 'faq',
    body: 'A FAQ section reduces attendee questions before the event.',
    status: 'active',
    sortOrder: 40,
  },
  {
    id: 'capacity',
    body: 'Setting a capacity limit helps people decide sooner.',
    status: 'active',
    sortOrder: 50,
  },
]

const stripUnsafeHtml = (value) =>
  String(value ?? '')
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim()

const sanitizeTicket = (ticket) => ({
  id: ticket.id,
  name: stripUnsafeHtml(ticket.name),
  unitType: ticket.unitType,
  color: ticket.color,
  price: Number(ticket.price) || 0,
  units: Number(ticket.units) || 0,
  peoplePerUnit: Number(ticket.peoplePerUnit) || 1,
  maxPerPerson: Number(ticket.maxPerPerson) || 1,
  visible: Boolean(ticket.visible),
  perks: stripUnsafeHtml(ticket.perks),
  salesStart: ticket.salesStart || null,
  salesEnd: ticket.salesEnd || null,
  salesStartLocal: toLocalDateTimeString(ticket.salesStart),
  salesEndLocal: toLocalDateTimeString(ticket.salesEnd),
})

const sanitizeRecurrence = (recurrence = {}) => ({
  frequency: recurrence.frequency || null,
  weeklyDays: Array.isArray(recurrence.weeklyDays) ? [...recurrence.weeklyDays] : [],
  monthlyMode: recurrence.monthlyMode || 'day_of_month',
  dayOfMonth: Number(recurrence.dayOfMonth) || null,
  nthWeekday: {
    ordinal: Number(recurrence.nthWeekday?.ordinal) || null,
    weekday: Number.isInteger(recurrence.nthWeekday?.weekday)
      ? recurrence.nthWeekday.weekday
      : null,
  },
  seriesEndType: recurrence.seriesEndType || null,
  seriesEndDate:
    recurrence.seriesEndType === 'on_date' ? recurrence.seriesEndDate || null : null,
  occurrenceCount:
    recurrence.seriesEndType === 'after_occurrences'
      ? Number(recurrence.occurrenceCount) || null
      : null,
})
export const buildCreateEventPayload = (form) => ({
  title: stripUnsafeHtml(form.title),
  startsAt: form.startsAt || null,
  endsAt: form.endsAt || null,
  startsAtLocal: toLocalDateTimeString(form.startsAt),
  endsAtLocal: toLocalDateTimeString(form.endsAt),
  timeZone: form.venueTimezone || APP_DEFAULT_TIME_ZONE,
  eventType: form.eventType,
  recurrence: form.eventType === 'recurring' ? sanitizeRecurrence(form.recurrence) : null,
  format: form.format,
  venue: stripUnsafeHtml(form.venue),
  meetingLink: stripUnsafeHtml(form.meetingLink),
  category: stripUnsafeHtml(form.category),
  description: stripUnsafeHtml(form.description),
  organiser: stripUnsafeHtml(form.organiser),
  organiserWebsite: stripUnsafeHtml(form.organiserWebsite),
  tags: stripUnsafeHtml(form.tags),
  coverImage: form.coverImage || null,
  secondaryImages: [...form.secondaryImages],
  ticketMode: form.ticketMode,
  freeCapacity: Number(form.freeCapacity) || null,
  tickets: form.tickets.map(sanitizeTicket),
  attendeeFields: form.attendeeFields.map((field) => ({
    id: field.id,
    label: field.label,
    enabled: Boolean(field.enabled),
    required: Boolean(field.required),
  })),
  extraDetails: form.extraDetails.map((detail) => ({
    type: detail.type,
    label: detail.label,
    value: stripUnsafeHtml(detail.value),
  })),
})

export const saveCreateEventDraft = (form) => {
  const payload = buildCreateEventPayload(form)
  window.localStorage?.setItem('kaka-create-event-draft', JSON.stringify(payload))
  return payload
}
