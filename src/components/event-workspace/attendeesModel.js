import { computed, ref } from 'vue'
import { DASHBOARD_PREVIEW } from '@/services/dashboardPreview'
import { referenceGuests } from './referenceGuests'

export const purchaseSources = {
  'RHO-26001': { code: 'SUNSET10', channel: 'whatsapp' },
  'RHO-26002': { code: 'FRIENDS20', channel: 'instagram' },
  'RHO-26003': { code: null, channel: 'whatsapp' },
  'RHO-26004': { code: 'SUNSET10', channel: 'facebook' },
  'RHO-26005': { code: null, channel: null },
  'RHO-26006': { code: 'VIPNIGHT', channel: 'whatsapp' },
  'RHO-26007': { code: null, channel: 'instagram' },
  'RHO-26008': { code: 'FRIENDS20', channel: null },
  'RHO-26009': { code: null, channel: 'tiktok' },
}
export const channelNames = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  x: 'X',
}
// The HTML uses these purchase snapshots, separately from overview tier prices.
export const samplePriceMinor = { 'Early bird': 800000, 'General admission': 1000000, VIP: 2200000 }
const groups = [
  ['RH-4101', 'RH-4102', 'RH-4103'],
  ['RH-4104', 'RH-4105'],
  ...referenceGuests.slice(5).map((g) => [g.id]),
]
const states = new Map()
export function useWorkspaceAttendees(eventId, actualMode = 'paid') {
  const key = String(eventId)
  if (states.has(key)) return states.get(key)
  const namespace = `rushhour:event-workspace:${key}:`
  function read(name, fallback) {
    try {
      return JSON.parse(localStorage.getItem(namespace + name)) ?? fallback
    } catch {
      return fallback
    }
  }
  function save(name, value) {
    try {
      localStorage.setItem(namespace + name, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  }
  const guests = ref(DASHBOARD_PREVIEW ? read('guests', structuredClone(referenceGuests)) : [])
  const movements = ref(DASHBOARD_PREVIEW ? read('movements', []) : [])
  const activity = ref(DASHBOARD_PREVIEW ? read('attendee-activity', {}) : {})
  const alerts = ref(DASHBOARD_PREVIEW ? read('arrival-alerts', {}) : {})
  const photos = ref(DASHBOARD_PREVIEW ? read('buyer-photos', {}) : {})
  const mode = ref(
    (DASHBOARD_PREVIEW ? read('attendee-mode', actualMode) : actualMode) === 'free'
      ? 'free'
      : 'paid',
  )
  const orders = computed(() =>
    DASHBOARD_PREVIEW
      ? groups.map((ticketIds, i) => {
          // Buyer identity is the checkout snapshot, even after editing the first guest.
          const buyer = referenceGuests.find((g) => g.id === ticketIds[0])
          return {
            id: `RHO-${26001 + i}`,
            buyer: buyer.name,
            email: buyer.email,
            ticketIds,
            purchased: buyer.purchased,
            payment: 'Paid',
          }
        })
      : [],
  )
  const visits = (id) => movements.value.filter((v) => v.id === id)
  const inside = (id) => visits(id).at(-1)?.kind === 'in'
  const everArrived = (id) => visits(id).some((v) => v.kind === 'in')
  const guestState = (id) =>
    inside(id) ? 'Inside now' : everArrived(id) ? 'Has left' : 'Not arrived yet'
  const ticketsFor = (order) =>
    order ? order.ticketIds.map((id) => guests.value.find((g) => g.id === id)).filter(Boolean) : []
  const orderFor = (id) => orders.value.find((order) => order.ticketIds.includes(id))
  const orderTotal = (order) =>
    mode.value === 'free'
      ? 0
      : ticketsFor(order).reduce((sum, g) => sum + (samplePriceMinor[g.type] || 0), 0)
  function setMode(value) {
    mode.value = value === 'free' ? 'free' : 'paid'
    save('attendee-mode', mode.value)
  }
  function recordMovement(id, kind, entrance = 'Main entrance') {
    if (!DASHBOARD_PREVIEW)
      return {
        ok: false,
        message: 'Live door check-in isn’t connected yet. No arrival has been recorded.',
      }
    if (!guests.value.some((g) => g.id === id))
      return { ok: false, message: 'This guest wasn’t found for your event.' }
    if (!['in', 'out'].includes(kind)) return { ok: false, message: 'Choose an entry or exit.' }
    if (kind === 'in' && inside(id))
      return {
        ok: false,
        message:
          'This guest is already inside. Review their entry history before admitting them again.',
      }
    if (kind === 'out' && !inside(id))
      return {
        ok: false,
        message: 'This guest isn’t inside. Record an entry before recording an exit.',
      }
    const next = [...movements.value, { id, kind, at: new Date().toISOString(), entrance }]
    if (!save('movements', next))
      return {
        ok: false,
        message: 'We couldn’t save this arrival. Check your browser storage and try again.',
      }
    movements.value = next
    return { ok: true, message: kind === 'in' ? 'Guest checked in.' : 'Guest exit recorded.' }
  }
  function updateGuest(id, change) {
    if (!DASHBOARD_PREVIEW)
      return {
        ok: false,
        message: 'Guest updates aren’t connected yet. Your changes haven’t been saved.',
      }
    const guest = guests.value.find((g) => g.id === id)
    const name = String(change.name || '').trim(),
      email = String(change.email || '').trim()
    if (!guest || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return { ok: false, message: 'Enter the guest’s name and a valid email address.' }
    if (guest.name === name && guest.email === email)
      return { ok: true, message: 'Everything is already up to date.' }
    const previous = { ...guest },
      previousActivity = activity.value[id] || []
    Object.assign(guest, { name, email })
    activity.value[id] = [
      { kind: 'edit', at: new Date().toISOString() },
      ...previousActivity,
    ].slice(0, 30)
    if (!save('guests', guests.value)) {
      Object.assign(guest, previous)
      activity.value[id] = previousActivity
      return {
        ok: false,
        message: 'We couldn’t save the guest details. Check your browser storage and try again.',
      }
    }
    save('attendee-activity', activity.value)
    return { ok: true, message: 'Guest details saved in this browser. No email was sent.' }
  }
  function saveAlert(id, value) {
    if (!DASHBOARD_PREVIEW) return false
    const next = { ...alerts.value, [id]: value }
    if (!save('arrival-alerts', next)) return false
    alerts.value = next
    return true
  }
  function savePhoto(orderId, value) {
    const next = { ...photos.value, [orderId]: value }
    if (!save('buyer-photos', next)) return false
    photos.value = next
    return true
  }
  const state = {
    guests,
    movements,
    activity,
    alerts,
    photos,
    mode,
    orders,
    visits,
    inside,
    everArrived,
    guestState,
    ticketsFor,
    orderFor,
    orderTotal,
    setMode,
    recordMovement,
    updateGuest,
    saveAlert,
    savePhoto,
  }
  states.set(key, state)
  return state
}

export function arrivalWords(tickets, everArrived) {
  const count = tickets.filter((t) => everArrived(t.id)).length
  if (tickets.length === 1) return count ? 'Arrived' : 'Not arrived yet'
  if (count === tickets.length) return `All ${tickets.length} guests arrived`
  return count ? `${count} of ${tickets.length} guests arrived` : 'No guests have arrived yet'
}
export function visitSessions(rows) {
  const sessions = []
  for (const visit of rows) {
    if (visit.kind === 'in') sessions.push({ entry: visit, exit: null })
    else if (visit.kind === 'out') {
      const open = [...sessions].reverse().find((s) => !s.exit)
      if (open) open.exit = visit
    }
  }
  return sessions
}
export function visitDate(value, timezone = 'Africa/Lagos', timeOnly = false) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return 'Time not recorded'
  try {
    return new Intl.DateTimeFormat(timeOnly ? 'en-US' : 'en-GB', {
      timeZone: timezone,
      ...(timeOnly
        ? { hour: 'numeric', minute: '2-digit', hour12: true }
        : { day: 'numeric', month: 'short', year: 'numeric' }),
    }).format(new Date(value))
  } catch {
    return 'Time not recorded'
  }
}
