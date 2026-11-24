import { DASHBOARD_PREVIEW } from './dashboardPreview'
import api, { ensureCsrfCookie } from '@/api/axios'

const previewKey = (eventId) => `rushhour:event-workspace:${eventId}:sharing-links`
function readPreviewLinks(eventId) {
  const value = JSON.parse(localStorage.getItem(previewKey(eventId)) || '[]')
  if (!Array.isArray(value)) throw new Error('Invalid saved sharing links')
  return value
}

export const getEventShareLinks = async (eventId, { signal } = {}) => {
  if (DASHBOARD_PREVIEW) return readPreviewLinks(eventId)
  const response = await api.get(`/dashboard/events/${encodeURIComponent(eventId)}/share-links`, {
    signal,
  })

  return response.data.data
}

export const createEventShareLink = async (eventId, label) => {
  if (DASHBOARD_PREVIEW) {
    const links = readPreviewLinks(eventId)
    const existing = links.find((link) => link.label.toLowerCase() === label.toLowerCase())
    if (existing) return existing
    const code = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const link = {
      id: `preview-${code}`,
      label,
      source_code: code,
      views: 0,
      buyers: 0,
      conversion_percent: 0,
    }
    localStorage.setItem(previewKey(eventId), JSON.stringify([...links, link]))
    return structuredClone(link)
  }
  await ensureCsrfCookie()

  const response = await api.post(`/dashboard/events/${encodeURIComponent(eventId)}/share-links`, {
    label,
  })

  return response.data.data
}
