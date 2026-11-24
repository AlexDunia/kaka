import { DASHBOARD_PREVIEW, previewEvent, previewOverview } from './dashboardPreview'
import api from '@/api/axios'

function previewSnapshot() {
  const overview = structuredClone(previewOverview)
  try {
    const namespace = `rushhour:event-workspace:${previewEvent.id}:`
    const details = JSON.parse(localStorage.getItem(`${namespace}details`) || 'null')
    if (details && typeof details === 'object') {
      Object.assign(overview.event, {
        title: details.name || overview.event.title,
        description: details.description || overview.event.description,
        venue: details.venue || overview.event.venue,
        contact_email: details.email || '',
        contact_phone: details.phone || '',
      })
      if (/^\d{4}-\d{2}-\d{2}$/.test(details.date) && /^\d{2}:\d{2}$/.test(details.time))
        overview.event.starts_at = `${details.date}T${details.time}:00+01:00`
    }
    const tickets = JSON.parse(localStorage.getItem(`${namespace}ticket-settings`) || '{}')
    overview.ticket_types = overview.ticket_types.map((ticket) => ({
      ...ticket,
      ...tickets?.[ticket.id],
    }))
    for (const ticket of overview.ticket_types) {
      ticket.sold_percent = ticket.effective_capacity_units
        ? (ticket.sold_units / ticket.effective_capacity_units) * 100
        : 0
    }
    overview.sales.capacity_units = overview.ticket_types.reduce(
      (sum, ticket) => sum + ticket.effective_capacity_units,
      0,
    )
    overview.sales.available_units = overview.ticket_types.reduce(
      (sum, ticket) => sum + ticket.available_units,
      0,
    )
    overview.sales.sold_percent = overview.sales.capacity_units
      ? (overview.sales.units_sold / overview.sales.capacity_units) * 100
      : 0
  } catch {
    // Keep the original preview when browser storage is unavailable.
  }
  return overview
}

export const getDashboardEventsPage = async ({ signal, page = 1 } = {}) => {
  if (DASHBOARD_PREVIEW)
    return { data: [previewSnapshot().event], current_page: 1, last_page: 1, total: 1 }
  return (await api.get('/dashboard/events', { signal, params: { page, per_page: 30 } })).data
}
export const getDashboardEvents = async (options) => (await getDashboardEventsPage(options)).data

export const getDashboardOverview = async (eventId, { signal } = {}) => {
  if (DASHBOARD_PREVIEW) return previewSnapshot()
  const response = await api.get(`/dashboard/events/${encodeURIComponent(eventId)}/overview`, {
    signal,
  })
  return response.data.data
}
