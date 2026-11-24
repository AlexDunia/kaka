export const EVENT_START_LEAD_MINUTES = 30

export const APP_DEFAULT_TIME_ZONE = import.meta.env?.VITE_APP_TIMEZONE || 'Africa/Lagos'

const dateTimeFormatter = (timeZone) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

const partsToObject = (parts) =>
  Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
  )

export function getZonedNowParts(timeZone = APP_DEFAULT_TIME_ZONE, now = new Date()) {
  return partsToObject(dateTimeFormatter(timeZone).formatToParts(now))
}

export function getVenueToday(timeZone = APP_DEFAULT_TIME_ZONE, now = new Date()) {
  const parts = getZonedNowParts(timeZone, now)
  return new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 0, 0, 0, 0)
}

function wallTimeNumber(value) {
  const local = toLocalDateTimeString(value)
  return local ? Date.parse(`${local}Z`) : null
}

export function getMinimumStartDateTime(
  timeZone = APP_DEFAULT_TIME_ZONE,
  now = new Date(),
  leadMinutes = EVENT_START_LEAD_MINUTES,
) {
  const minimumInstant = new Date(now.getTime() + leadMinutes * 60_000)
  const parts = getZonedNowParts(timeZone, minimumInstant)
  const minimum = new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
    minimumInstant.getMilliseconds(),
  )
  return minimum
}

export function toLocalDateTimeString(value) {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date && value.eventLocalTime?.timestamp === value.getTime())
    return value.eventLocalTime.local
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function isStartDateTimeValid(
  value,
  timeZone = APP_DEFAULT_TIME_ZONE,
  now = new Date(),
  leadMinutes = EVENT_START_LEAD_MINUTES,
) {
  const candidate = wallTimeNumber(value)
  const minimum = wallTimeNumber(getMinimumStartDateTime(timeZone, now, leadMinutes))
  return candidate !== null && minimum !== null && candidate >= minimum
}

export function isAfter(left, right) {
  const leftValue = wallTimeNumber(left)
  const rightValue = wallTimeNumber(right)
  return leftValue !== null && rightValue !== null && leftValue > rightValue
}

export function isAfterOrEqual(left, right) {
  const leftValue = wallTimeNumber(left)
  const rightValue = wallTimeNumber(right)
  return leftValue !== null && rightValue !== null && leftValue >= rightValue
}

// Pickers hold event-local wall clocks, not browser-local instants.
export function fromLocalDateTimeString(value) {
  if (!value) return null
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/)
  if (!match) return null
  const date = new Date(...[Number(match[1]), Number(match[2]) - 1, ...match.slice(3).map(Number)])
  // Keep the wall clock intact when the device's own DST gap differs from the event's.
  Object.defineProperty(date, 'eventLocalTime', {
    value: { local: value, timestamp: date.getTime() },
  })
  return date
}

export function instantToLocalDate(value, timeZone = APP_DEFAULT_TIME_ZONE) {
  if (!value) return null
  const parts = getZonedNowParts(timeZone, new Date(value))
  return fromLocalDateTimeString(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`,
  )
}

// Unchanged saved instants keep their offset (including repeated DST hours).
// Edited wall clocks are sent alone so Laravel validates and resolves the timezone.
export function editorDateFields(source, keys, timeZone) {
  return Object.fromEntries(
    keys.map((key) => {
      if (typeof source[key] === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/i.test(source[key]))
        return [key, source[key]]
      const local = toLocalDateTimeString(source[key])
      const saved = source._savedTimes?.[key]
      if (saved?.instant && saved.local === local && saved.timeZone === timeZone)
        return [key, saved.instant]
      return [`${key}Local`, local]
    }),
  )
}

export function isValidTimeZone(timeZone) {
  try {
    new Intl.DateTimeFormat('en', { timeZone }).format()
    return true
  } catch {
    return false
  }
}
