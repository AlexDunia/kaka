export const WEEKDAYS = [
  { value: 0, short: 'Sun', label: 'Sunday' },
  { value: 1, short: 'Mon', label: 'Monday' },
  { value: 2, short: 'Tue', label: 'Tuesday' },
  { value: 3, short: 'Wed', label: 'Wednesday' },
  { value: 4, short: 'Thu', label: 'Thursday' },
  { value: 5, short: 'Fri', label: 'Friday' },
  { value: 6, short: 'Sat', label: 'Saturday' },
]

const validDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const endOfDate = (value) => {
  if (!value) return null
  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day, 23, 59, 59, 999)
}

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate()

function monthlyDate(start, monthOffset, recurrence) {
  const year = start.getFullYear()
  const month = start.getMonth() + monthOffset
  const targetYear = year + Math.floor(month / 12)
  const targetMonth = ((month % 12) + 12) % 12
  let day

  if (recurrence.monthlyMode === 'nth_weekday') {
    const ordinal = Number(recurrence.nthWeekday?.ordinal)
    const weekday = Number(recurrence.nthWeekday?.weekday)
    const firstWeekday = new Date(targetYear, targetMonth, 1).getDay()
    day = 1 + ((weekday - firstWeekday + 7) % 7) + (ordinal - 1) * 7
    if (day > daysInMonth(targetYear, targetMonth)) return null
  } else {
    day = Math.min(Number(recurrence.dayOfMonth) || start.getDate(), daysInMonth(targetYear, targetMonth))
  }

  return new Date(
    targetYear,
    targetMonth,
    day,
    start.getHours(),
    start.getMinutes(),
    start.getSeconds(),
    start.getMilliseconds(),
  )
}

export function deriveMonthlyPattern(value) {
  const date = validDate(value)
  if (!date) return { dayOfMonth: null, ordinal: null, weekday: null }
  return {
    dayOfMonth: date.getDate(),
    ordinal: Math.floor((date.getDate() - 1) / 7) + 1,
    weekday: date.getDay(),
  }
}

export function generateOccurrences(startValue, recurrence, limit = 5, options = {}) {
  const start = validDate(startValue)
  if (!start || !recurrence?.frequency || limit <= 0) return []

  const ignoreSeriesEnd = options.ignoreSeriesEnd === true
  const seriesEnd = ignoreSeriesEnd || recurrence.seriesEndType !== 'on_date'
    ? null
    : endOfDate(recurrence.seriesEndDate)
  const occurrenceLimit =
    ignoreSeriesEnd || recurrence.seriesEndType !== 'after_occurrences'
      ? limit
      : Math.min(limit, Number(recurrence.occurrenceCount) || 0)
  if (!ignoreSeriesEnd && recurrence.seriesEndType === 'on_date' && !seriesEnd) return []
  if (occurrenceLimit <= 0) return []

  const results = []
  const addCandidate = (candidate) => {
    if (!candidate || candidate < start || (seriesEnd && candidate > seriesEnd)) return false
    results.push(candidate)
    return results.length >= occurrenceLimit
  }

  if (recurrence.frequency === 'daily') {
    for (let offset = 0; offset < 3660 && results.length < occurrenceLimit; offset += 1) {
      const candidate = new Date(start)
      candidate.setDate(start.getDate() + offset)
      if (seriesEnd && candidate > seriesEnd) break
      addCandidate(candidate)
    }
  }

  if (recurrence.frequency === 'weekly') {
    const selected = new Set((recurrence.weeklyDays || []).map(Number))
    for (let offset = 0; offset < 3660 && results.length < occurrenceLimit; offset += 1) {
      const candidate = new Date(start)
      candidate.setDate(start.getDate() + offset)
      if (seriesEnd && candidate > seriesEnd) break
      if (selected.has(candidate.getDay())) addCandidate(candidate)
    }
  }

  if (recurrence.frequency === 'monthly') {
    for (let offset = 0; offset < 1200 && results.length < occurrenceLimit; offset += 1) {
      const candidate = monthlyDate(start, offset, recurrence)
      if (seriesEnd && candidate && candidate > seriesEnd) break
      addCandidate(candidate)
    }
  }

  return results.slice(0, occurrenceLimit)
}

export function scheduleHasOverlap(startValue, endValue, recurrence) {
  const start = validDate(startValue)
  const end = validDate(endValue)
  if (!start || !end || end <= start || !recurrence?.frequency) return false
  const duration = end.getTime() - start.getTime()
  if (recurrence.frequency === 'daily' && duration >= 24 * 60 * 60 * 1000) return true
  const occurrences = generateOccurrences(start, recurrence, 24, { ignoreSeriesEnd: true })
  return occurrences.some((occurrence, index) => {
    const next = occurrences[index + 1]
    return next ? occurrence.getTime() + duration > next.getTime() : false
  })
}
