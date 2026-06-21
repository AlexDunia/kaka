export const EVENT_START_LEAD_MINUTES = 30

export const APP_DEFAULT_TIME_ZONE =
  import.meta.env?.VITE_APP_TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

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
  Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]))

export function getZonedNowParts(timeZone = APP_DEFAULT_TIME_ZONE, now = new Date()) {
  return partsToObject(dateTimeFormatter(timeZone).formatToParts(now))
}

export function getVenueToday(timeZone = APP_DEFAULT_TIME_ZONE, now = new Date()) {
  const parts = getZonedNowParts(timeZone, now)
  return new Date(Number(parts.year), Number(parts.month) - 1, Number(parts.day), 0, 0, 0, 0)
}

function wallTimeNumber(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds(),
  )
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
