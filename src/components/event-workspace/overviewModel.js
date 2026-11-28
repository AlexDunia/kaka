// The overview uses event-local calendar days, rather than elapsed 24-hour periods.
export function daysUntilEvent(event, now = new Date()) {
  if (!event?.starts_at) return null
  const starts = new Date(event.starts_at)
  if (!Number.isFinite(starts.getTime())) return null
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: event.timezone || 'Africa/Lagos',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const calendarDay = (value) => {
      const parts = Object.fromEntries(formatter.formatToParts(value).map((p) => [p.type, p.value]))
      return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day))
    }
    return Math.round((calendarDay(starts) - calendarDay(now)) / 86400000)
  } catch {
    return null
  }
}

export function overviewStage(event, now = new Date()) {
  if (event?.phase === 'draft' || event?.status === 'draft') return 'draft'
  if (event?.phase === 'ended') return 'completed'
  if (event?.phase === 'live') return 'event-day'
  const days = daysUntilEvent(event, now)
  if (days === null) return 'on-sale'
  if (days < 0) return 'completed'
  if (days === 0) return 'event-day'
  return days <= 14 ? 'approaching' : 'on-sale'
}

export function overviewEventDate(event) {
  if (!event?.starts_at) return 'Date to be confirmed'
  const date = new Date(event.starts_at)
  if (!Number.isFinite(date.getTime())) return 'Date to be confirmed'
  try {
    const options = { timeZone: event.timezone || 'Africa/Lagos' }
    const day = new Intl.DateTimeFormat('en-GB', {
      ...options,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
    const time = new Intl.DateTimeFormat('en-US', {
      ...options,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
    return `${day} · ${time}`
  } catch {
    return 'Date to be confirmed'
  }
}

export const clampPercent = (value) => Math.min(100, Math.max(0, Number(value) || 0))
export const leadingBuyerSources = (sources) =>
  [...(sources || [])]
    .filter((source) => Number(source.buyers) > 0 && source.source_code !== 'unattributed')
    .sort((a, b) => Number(b.buyers) - Number(a.buyers))

// Dates from the API are already in the event timezone. UTC here is calendar
// arithmetic only, so a browser timezone or daylight-saving change cannot move a sale.
export function weeklySales(series = []) {
  const days = series
    .flatMap((point) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(point?.date || '')) return []
      const date = new Date(`${point.date}T00:00:00Z`)
      if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== point.date)
        return []
      return [{ ...point, timestamp: date.getTime() }]
    })
    .sort((a, b) => a.timestamp - b.timestamp)
  if (!days.length) return []
  const monday = (timestamp) => {
    const date = new Date(timestamp)
    return timestamp - ((date.getUTCDay() + 6) % 7) * 86400000
  }
  const buckets = new Map()
  for (const day of days) {
    const start = monday(day.timestamp)
    const units = Number(day.units_sold)
    buckets.set(
      start,
      (buckets.get(start) || 0) + (Number.isFinite(units) ? Math.max(0, units) : 0),
    )
  }
  const weeks = []
  // The overview API supplies at most 1,095 daily aggregates (up to 158 weeks).
  const last = monday(days.at(-1).timestamp)
  const first = Math.max(monday(days[0].timestamp), last - 157 * 7 * 86400000)
  for (let start = first; start <= last; start += 7 * 86400000) {
    weeks.push({
      date: new Date(start).toISOString().slice(0, 10),
      end_date: new Date(Math.min(start + 6 * 86400000, days.at(-1).timestamp))
        .toISOString()
        .slice(0, 10),
      units_sold: buckets.get(start) || 0,
    })
  }
  return weeks
}

export function salesChart(series = [], width = 600) {
  const points = series
    .filter((p) => p?.date)
    .map((p) => ({
      ...p,
      units_sold: Number.isFinite(Number(p.units_sold)) ? Math.max(0, Number(p.units_sold)) : 0,
    }))
  const maximum = Math.max(4, Math.ceil(Math.max(0, ...points.map((p) => p.units_sold)) / 4) * 4)
  const coordinates = points.map((p, i) => ({
    x: 44 + (i * (width - 104)) / Math.max(1, points.length - 1),
    y: 226 - (p.units_sold * 200) / maximum,
  }))
  const line = coordinates.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ')
  return {
    points,
    maximum,
    coordinates,
    line,
    area: line ? `${line} L${coordinates.at(-1).x} 226 L44 226 Z` : '',
  }
}
