export const SCHEDULE_SCHEMA = 2
export const MAX_SESSIONS_PER_DAY = 24
export const cloneSchedule = (value) => JSON.parse(JSON.stringify(value))
export const isExplicitSchedule = (value) => value?.schemaVersion === SCHEDULE_SCHEMA
export const emptyConfiguration = () => ({
  startDate: '',
  endDateExclusive: '',
  days: {},
  drafts: {},
  sharedTemplate: null,
})
export const createExplicitSchedule = () => ({
  schemaVersion: SCHEDULE_SCHEMA,
  activeMode: 'weekly',
  configurations: { weekly: emptyConfiguration(), monthly: emptyConfiguration() },
})

const objectMap = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value))
const canonicalSessions = (value) =>
  Array.isArray(value) &&
  value.length <= MAX_SESSIONS_PER_DAY &&
  value.every(
    (slot) =>
      objectMap(slot) &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(slot.startTime) &&
      /^([01]\d|2[0-3]):[0-5]\d$/.test(slot.endTime),
  ) &&
  !sessionError(value)
export function validExplicitScheduleShape(value) {
  if (
    !isExplicitSchedule(value) ||
    !['weekly', 'monthly'].includes(value.activeMode) ||
    !objectMap(value.configurations)
  )
    return false
  return ['weekly', 'monthly'].every((mode) => {
    const config = value.configurations[mode]
    if (
      !objectMap(config) ||
      typeof config.startDate !== 'string' ||
      typeof config.endDateExclusive !== 'string' ||
      !objectMap(config.days) ||
      !objectMap(config.drafts)
    )
      return false
    if (
      config.sharedTemplate !== null &&
      (!objectMap(config.sharedTemplate) ||
        !canonicalSessions(config.sharedTemplate.sessions) ||
        !config.sharedTemplate.sessions.length ||
        !config.days[config.sharedTemplate.sourceDate])
    )
      return false
    return (
      Object.entries(config.days).every(
        ([date, day]) =>
          calendarDate(date) &&
          objectMap(day) &&
          ['source', 'linked', 'independent', 'exception'].includes(day.inheritance) &&
          canonicalSessions(day.sessions),
      ) &&
      Object.entries(config.drafts).every(
        ([date, draft]) =>
          calendarDate(date) &&
          objectMap(draft) &&
          Array.isArray(draft.slots) &&
          draft.slots.length <= MAX_SESSIONS_PER_DAY &&
          draft.slots.every(
            (slot) =>
              objectMap(slot) &&
              typeof slot.startTime === 'string' &&
              typeof slot.endTime === 'string',
          ),
      )
    )
  })
}

export function calendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d, 12)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d ? date : null
}
export const dateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export function addCalendarDays(value, count) {
  const date = calendarDate(value)
  if (!date) return ''
  date.setDate(date.getDate() + count)
  return dateKey(date)
}
export function rangeMaximum(start) {
  const date = calendarDate(start)
  if (!date) return ''
  const month = date.getMonth()
  const day = date.getDate()
  date.setDate(1)
  date.setFullYear(date.getFullYear() + 1)
  date.setMonth(month)
  date.setDate(Math.min(day, new Date(date.getFullYear(), month + 1, 0).getDate()))
  return dateKey(date)
}
export function rangeError(config, mode) {
  if (!calendarDate(config.startDate)) return 'Choose a start date.'
  if (!calendarDate(config.endDateExclusive)) return 'Choose an end date.'
  if (config.endDateExclusive <= config.startDate)
    return 'Choose an end date after your start date.'
  if (config.endDateExclusive > rangeMaximum(config.startDate, mode))
    return 'Choose a period of up to one year.'
  return ''
}
export const withinRange = (date, config) =>
  Boolean(calendarDate(date) && date >= config.startDate && date < config.endDateExclusive)
export const formatScheduleDate = (
  value,
  options = { day: 'numeric', month: 'long', year: 'numeric' },
) => calendarDate(value)?.toLocaleDateString('en-GB', options) || 'Choose date'
export function formatSessionTime(value) {
  if (!value) return 'Select time'
  const [h, m] = value.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}
export const sameSessions = (a, b) =>
  JSON.stringify(a.map((s) => [s.startTime, s.endTime])) ===
  JSON.stringify(b.map((s) => [s.startTime, s.endTime]))
export function sessionError(slots) {
  if (slots.length > MAX_SESSIONS_PER_DAY) return `Add up to ${MAX_SESSIONS_PER_DAY} times per day.`
  if (!slots.length || (slots.length === 1 && !slots[0].startTime && !slots[0].endTime)) return ''
  for (const slot of slots) {
    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.startTime || '') ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.endTime || '')
    )
      return 'Choose a start and end time.'
    if (slot.endTime <= slot.startTime) return 'End time must be after start time.'
  }
  const sorted = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime))
  for (let i = 1; i < sorted.length; i++)
    if (sorted[i].startTime < sorted[i - 1].endTime)
      return 'These times overlap. Choose a different time.'
  return ''
}
export const completeSessions = (slots) =>
  cloneSchedule(slots.filter((s) => s.startTime && s.endTime)).sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  )
export const scheduledDays = (config) =>
  Object.keys(config.days)
    .filter((date) => withinRange(date, config))
    .sort()
export function scheduleMonths(config, mode) {
  if (rangeError(config, mode)) return []
  const months = []
  let date = `${config.startDate.slice(0, 7)}-01`
  while (date < config.endDateExclusive && months.length < 13) {
    months.push(date.slice(0, 7))
    const next = calendarDate(date)
    next.setMonth(next.getMonth() + 1)
    date = dateKey(next)
  }
  return months
}
export function monthGrid(month) {
  const start = calendarDate(`${month}-01`)
  if (!start) return []
  const padding = (start.getDay() + 6) % 7
  const count = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
  return Array.from({ length: Math.ceil((padding + count) / 7) * 7 }, (_, i) =>
    i < padding || i >= padding + count
      ? null
      : `${month}-${String(i - padding + 1).padStart(2, '0')}`,
  )
}
export function weekdayTargets(date, config, today) {
  const weekday = calendarDate(date)?.getDay()
  return monthGrid(date.slice(0, 7)).filter(
    (day) =>
      day && day >= today && withinRange(day, config) && calendarDate(day).getDay() === weekday,
  )
}
export function addScheduleDay(config, date) {
  if (!config.days[date])
    config.days[date] = {
      sessions: cloneSchedule(config.sharedTemplate?.sessions || []),
      inheritance: config.sharedTemplate ? 'linked' : 'independent',
    }
}
export function removeScheduleDay(config, date) {
  delete config.days[date]
  delete config.drafts[date]
  if (config.sharedTemplate?.sourceDate === date) {
    config.sharedTemplate = null
    Object.values(config.days).forEach((day) => {
      if (day.inheritance === 'linked') day.inheritance = 'independent'
    })
  }
}
// IDs belong to their date. Copies never borrow IDs from another occurrence.
const copiedSessions = (slots) => slots.map((s) => ({ startTime: s.startTime, endTime: s.endTime }))
export function bulkConflicts(config, date, slots, targets, sharing) {
  const affected = new Set(targets)
  if (sharing)
    scheduledDays(config).forEach((key) => {
      if (config.days[key].inheritance !== 'exception') affected.add(key)
    })
  return [...affected].filter(
    (key) =>
      key !== date &&
      (config.drafts[key] ||
        (config.days[key]?.sessions.length &&
          !sameSessions(config.days[key].sessions, slots) &&
          config.days[key].inheritance !== 'linked')),
  )
}
export function commitScheduleDay(config, date, slots, targets, sharing) {
  const sessions = completeSessions(slots)
  if (sharing === false) {
    config.sharedTemplate = null
    Object.values(config.days).forEach((day) => {
      if (['source', 'linked'].includes(day.inheritance)) day.inheritance = 'independent'
    })
  }
  if (sharing === true && sessions.length) {
    config.sharedTemplate = { sourceDate: date, sessions: copiedSessions(sessions) }
    scheduledDays(config).forEach((key) => {
      if (key !== date && config.days[key].inheritance !== 'exception') {
        config.days[key].sessions = copiedSessions(sessions)
        config.days[key].inheritance = 'linked'
        delete config.drafts[key]
      }
    })
  }
  for (const key of targets) {
    addScheduleDay(config, key)
    config.days[key].sessions = key === date ? sessions : copiedSessions(sessions)
    config.days[key].inheritance =
      sharing && sessions.length
        ? key === date
          ? 'source'
          : 'linked'
        : config.sharedTemplate
          ? 'exception'
          : 'independent'
    delete config.drafts[key]
  }
  if (config.sharedTemplate?.sourceDate === date && !sessions.length) {
    config.sharedTemplate = null
    Object.values(config.days).forEach((day) => {
      if (day.inheritance === 'linked') day.inheritance = 'independent'
    })
  }
}
export function explicitScheduleError(schedule, { publish = false, today = '' } = {}) {
  if (!isExplicitSchedule(schedule) || !['weekly', 'monthly'].includes(schedule.activeMode))
    return 'Choose how often your event runs.'
  const config = schedule.configurations[schedule.activeMode]
  if (!config) return 'Choose your event dates.'
  const error = rangeError(config, schedule.activeMode)
  if (error) return error
  const days = scheduledDays(config)
  if (publish && !days.length) return 'Add at least one event day.'
  if (publish && Object.keys(config.drafts).some((date) => withinRange(date, config)))
    return 'Finish or remove your unfinished time changes before publishing.'
  for (const date of days) {
    const sessionIssue = sessionError(config.days[date].sessions)
    if (sessionIssue) return sessionIssue
  }
  if (publish && today && !days.some((date) => date >= today))
    return 'Add an upcoming event day before publishing.'
  return ''
}
export function scheduleWireValue(schedule) {
  // Keep the editor representation explicit and versioned. Laravel owns IDs,
  // timezone resolution, publication, and the authoritative saved response.
  if (!validExplicitScheduleShape(schedule))
    throw new Error('We could not read this schedule. Reload the saved event before trying again.')
  const result = createExplicitSchedule()
  result.activeMode = schedule.activeMode
  for (const mode of ['weekly', 'monthly']) {
    result.configurations[mode] = cloneSchedule(schedule.configurations[mode])
    const config = result.configurations[mode]
    config.startDate ||= null
    config.endDateExclusive ||= null
    Object.values(config.drafts).forEach((draft) => {
      draft.slots.forEach((slot) => {
        slot.startTime ||= null
        slot.endTime ||= null
      })
    })
  }
  return result
}

export function readExplicitSchedule(value) {
  if (!isExplicitSchedule(value)) throw new Error('This schedule cannot be opened in this editor.')
  const result = cloneSchedule(value)
  for (const mode of ['weekly', 'monthly']) {
    const config = result.configurations?.[mode]
    if (!objectMap(config)) continue
    config.startDate ??= ''
    config.endDateExclusive ??= ''
    if (objectMap(config.drafts))
      Object.values(config.drafts).forEach((draft) => {
        if (!Array.isArray(draft?.slots)) return
        draft.slots.forEach((slot) => {
          if (!objectMap(slot)) return
          slot.startTime ??= ''
          slot.endTime ??= ''
        })
      })
  }
  if (!validExplicitScheduleShape(result))
    throw new Error('We could not read this schedule. Reload the saved event before trying again.')
  return result
}
