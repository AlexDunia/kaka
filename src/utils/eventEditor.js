import { fromLocalDateTimeString } from './eventDateTime'

export const isPersistedTicketId = (id) =>
  typeof id === 'number' && Number.isSafeInteger(id) && id > 0
const timeState = (source, keys, timeZone) =>
  Object.fromEntries(
    keys.map((key) => [
      key,
      {
        instant: source[key],
        local: source[`${key}Local`],
        timeZone,
      },
    ]),
  )
export function hydrateEditorForm(saved) {
  const form = {
    ...saved,
    venueTimezone: saved.timeZone,
    secondaryImages: [...(saved.secondaryImages || [])],
  }
  for (const key of ['startsAt', 'endsAt'])
    form[key] = fromLocalDateTimeString(saved[`${key}Local`])
  form._savedTimes = timeState(saved, ['startsAt', 'endsAt'], saved.timeZone)
  form.tickets = (saved.tickets || []).map((ticket) => ({
    ...ticket,
    inventory: { ...ticket.inventory },
    salesStart: fromLocalDateTimeString(ticket.salesStartLocal),
    salesEnd: fromLocalDateTimeString(ticket.salesEndLocal),
    _savedTimes: timeState(ticket, ['salesStart', 'salesEnd'], saved.timeZone),
  }))
  return form
}

export const editorErrorMessages = (error) => {
  const errors = error.response?.data?.errors
  if (errors && typeof errors === 'object') return Object.values(errors).flat().join(' ')
  return (
    error.userMessage ||
    error.response?.data?.message ||
    'We could not save your event. Please try again.'
  )
}
