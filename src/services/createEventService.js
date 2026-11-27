import { APP_DEFAULT_TIME_ZONE, editorDateFields } from '@/utils/eventDateTime'
import { getActivePinia } from 'pinia'
import { useEventStore } from '@/stores/events'
import { useDashboardStore } from '@/stores/dashboard'
import {
  isExplicitSchedule,
  readExplicitSchedule,
  scheduleWireValue,
} from '@/utils/explicitSchedule'
import { isPersistedTicketId } from '@/utils/eventEditor'
import api, { ensureCsrfCookie } from '@/api/axios'

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

const sanitizeTicket = (ticket, timeZone) => ({
  ...(isPersistedTicketId(ticket.id) ? { id: ticket.id } : {}),
  name: stripUnsafeHtml(ticket.name),
  unitType: ticket.unitType,
  color: ticket.color,
  price: String(ticket.price ?? '0'),
  units: ticket.units === '' || ticket.units == null ? 0 : Number(ticket.units),
  peoplePerUnit: ticket.unitType === 'individual' ? 1 : Number(ticket.peoplePerUnit),
  maxPerPerson:
    ticket.maxPerPerson === '' || ticket.maxPerPerson == null ? null : Number(ticket.maxPerPerson),
  visible: ticket.visible !== false,
  perks: stripUnsafeHtml(ticket.perks),
  ...editorDateFields(ticket, ['salesStart', 'salesEnd'], timeZone),
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
  seriesEndDate: recurrence.seriesEndType === 'on_date' ? recurrence.seriesEndDate || null : null,
  occurrenceCount:
    recurrence.seriesEndType === 'after_occurrences'
      ? Number(recurrence.occurrenceCount) || null
      : null,
})
export const buildCreateEventPayload = (form) => ({
  title: stripUnsafeHtml(form.title),
  ...editorDateFields(
    form,
    ['startsAt', 'endsAt'],
    form.venueTimezone || form.timeZone || APP_DEFAULT_TIME_ZONE,
  ),
  timeZone: form.venueTimezone || form.timeZone || APP_DEFAULT_TIME_ZONE,
  eventType: form.eventType,
  recurrence:
    form.eventType === 'recurring'
      ? isExplicitSchedule(form.recurrence)
        ? scheduleWireValue(form.recurrence)
        : sanitizeRecurrence(form.recurrence)
      : null,
  format: form.format,
  venue: stripUnsafeHtml(form.venue),
  city: stripUnsafeHtml(form.city),
  meetingLink: stripUnsafeHtml(form.meetingLink),
  category: stripUnsafeHtml(form.category),
  description: stripUnsafeHtml(form.description),
  organiser: stripUnsafeHtml(form.organiser),
  organiserWebsite: stripUnsafeHtml(form.organiserWebsite),
  tags: stripUnsafeHtml(form.tags),
  coverImage: form.coverImage || null,
  secondaryImages: [...(form.secondaryImages || [])],
  ticketMode: form.ticketMode,
  freeCapacity:
    form.freeCapacity === '' || form.freeCapacity == null ? null : Number(form.freeCapacity),
  tickets: (form.tickets || []).map((ticket) =>
    sanitizeTicket(ticket, form.venueTimezone || form.timeZone || APP_DEFAULT_TIME_ZONE),
  ),
  attendeeFields: (form.attendeeFields || []).map((field) => ({
    id: field.id,
    label: field.label,
    enabled: Boolean(field.enabled),
    required: Boolean(field.required),
  })),
  extraDetails: (form.extraDetails || []).map((detail) => ({
    type: detail.type,
    label: detail.label,
    value: stripUnsafeHtml(detail.value),
  })),
})

const scheduleFingerprint = (value) => {
  const clean = (data) =>
    Array.isArray(data)
      ? data.map(clean)
      : data && typeof data === 'object'
        ? Object.fromEntries(
            Object.keys(data)
              .sort()
              .filter((key) => !['id', 'clientId'].includes(key))
              .map((key) => [key, clean(data[key])]),
          )
        : data
  return JSON.stringify(clean(value))
}
const mutationResult = (response, expectedSchedule) => {
  const record = response.data?.data
  if (!record?.id || !Number.isInteger(record.version) || !record.form) {
    throw new Error('Your event response was incomplete. Reload the editor before saving again.')
  }
  if (isExplicitSchedule(expectedSchedule)) {
    let confirmed = false
    try {
      record.form.recurrence = readExplicitSchedule(record.form.recurrence)
      confirmed =
        scheduleFingerprint(scheduleWireValue(record.form.recurrence)) ===
        scheduleFingerprint(scheduleWireValue(readExplicitSchedule(expectedSchedule)))
    } catch {
      /* A missing or malformed schedule must not become a success. */
    }
    if (!confirmed) {
      const error = new Error(
        'We could not confirm your saved schedule. Your changes are still here. Reload the saved event before trying again.',
      )
      error.userMessage = error.message
      throw error
    }
  }
  if (getActivePinia()) {
    useEventStore().invalidateEvent(record.id)
    useDashboardStore().invalidateEvent(record.id)
  }
  return response.data
}

export const createEventDraft = async (form) => {
  await ensureCsrfCookie()
  return mutationResult(
    await api.post('/create-event', buildCreateEventPayload(form)),
    form.eventType === 'recurring' ? form.recurrence : null,
  )
}

// Only the complete wizard requests replacement. Workspace/profile edits use merges.
export const updateEventDraft = (eventId, form) =>
  patchEvent(
    eventId,
    {
      ...buildCreateEventPayload(form),
      ticketCollectionMode: 'replace',
    },
    form.version,
  )

export const patchEvent = async (eventId, changes, version) => {
  await ensureCsrfCookie()
  return mutationResult(
    await api.patch(`/create-event/${encodeURIComponent(eventId)}`, { ...changes, version }),
    changes.recurrence,
  )
}

export const publishEvent = async (eventId, version) => {
  await ensureCsrfCookie()
  return mutationResult(
    await api.post(`/create-event/${encodeURIComponent(eventId)}/publish`, { version }),
  )
}

export const getEventForEditing = async (eventId) => {
  const response = (await api.get(`/create-event/${encodeURIComponent(eventId)}`)).data
  const schedule = response.data?.form?.recurrence
  if (schedule?.schemaVersion !== undefined) {
    try {
      response.data.form.recurrence = readExplicitSchedule(schedule)
    } catch {
      const error = new Error(
        'We could not read this schedule. Reload the saved event before trying again.',
      )
      error.userMessage = error.message
      throw error
    }
  }
  return response
}
