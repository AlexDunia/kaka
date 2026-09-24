export const formatNumber = (value = 0) =>
  new Intl.NumberFormat('en-NG').format(Number(value || 0))

export const formatPercent = (value = 0) => {
  const number = Number(value || 0)
  return Number.isInteger(number) ? `${number}%` : `${number.toFixed(1)}%`
}

export const formatMoneyMinor = (
  minor = 0,
  currency = 'NGN',
  { compact = false } = {},
) => {
  const amount = Number(minor || 0) / 100

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: compact ? 1 : 0,
    notation: compact ? 'compact' : 'standard',
  }).format(amount)
}

export const formatEventDate = (iso, timezone = 'Africa/Lagos') => {
  if (!iso) return 'Date TBA'
  const date = new Date(iso)
  if (Number.isNaN(date.valueOf())) return 'Date TBA'

  return new Intl.DateTimeFormat('en-NG', {
    timeZone: timezone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export const formatTrend = (state, percent, currentValue = 0) => {
  if (state === 'new') return currentValue > 0 ? 'New this week' : 'No change'
  if (state === 'flat') return 'Same as last week'
  if (percent === null || percent === undefined) return 'No comparison yet'

  const value = Number(percent)
  const prefix = value > 0 ? '+' : ''
  return `${prefix}${value.toFixed(Number.isInteger(value) ? 0 : 1)}% vs last week`
}

export const unitNoun = (ticketType, quantity) => {
  if (ticketType?.unit_type === 'table') {
    return Number(quantity) === 1 ? 'table' : 'tables'
  }
  return Number(quantity) === 1 ? 'ticket' : 'tickets'
}

export const sourceNote = (sourceCode) => {
  const notes = {
    wa: 'For chats and groups',
    ig: 'For Instagram posts and bio',
    direct: 'For flyers, bios, and general sharing',
    x: 'For X / Twitter',
    fb: 'For Facebook',
    in: 'For LinkedIn',
    email: 'For email campaigns',
  }

  return notes[sourceCode] || 'Custom tracked link'
}
