import catalog from '@/api/axios'

export const collection = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.data?.data)) return payload.data.data
  return []
}

export function normalizeCategory(category) {
  const name =
    typeof category === 'string'
      ? category
      : category.name || category.title || category.label || ''
  return {
    name,
    value: String(typeof category === 'string' ? category : category.slug || category.id || name),
  }
}

export async function getPublicCategories(signal) {
  const { data } = await catalog.get('/categories', { signal })
  return collection(data)
    .map(normalizeCategory)
    .filter((category) => category.name)
}

export async function getPublicEvents(filters = {}, signal) {
  // The existing Laravel endpoint accepts category_id, but has no search/city
  // filters. Search the complete matching database collection before paginating.
  const numericCategory = /^\d+$/.test(String(filters.category || ''))
  const localFiltering = Boolean(
    filters.q || filters.city || (filters.category && !numericCategory),
  )
  const params = {
    page: localFiltering ? 1 : filters.page || 1,
    per_page: localFiltering ? 100 : 12,
    ...(numericCategory ? { category_id: filters.category } : {}),
  }
  const { data } = await catalog.get('/events', { signal, params })
  const meta = data.meta || data.pagination || {}
  if (localFiltering) {
    let events = collection(data)
    const lastPage = Number(meta.last_page || meta.pages || 1)
    for (let page = 2; page <= lastPage; page++) {
      const response = await catalog.get('/events', { signal, params: { ...params, page } })
      events = events.concat(collection(response.data))
    }
    events = events.filter((event) => matchesPublicFilters(event, filters))
    const offset = (Math.max(1, Number(filters.page) || 1) - 1) * 12
    return {
      events: events.slice(offset, offset + 12),
      total: events.length,
      pages: Math.max(1, Math.ceil(events.length / 12)),
    }
  }
  return {
    events: collection(data),
    total: Number(meta.total ?? collection(data).length),
    pages: Number(meta.last_page || meta.pages || 1),
  }
}

export function matchesPublicFilters(event, filters) {
  const category = typeof event.category === 'object' ? event.category?.name : event.category
  const categoryKey = String(event.category_id || event.category?.id || '')
  const wanted = String(filters.category || '').toLowerCase()
  if (
    wanted &&
    wanted !== categoryKey &&
    !String(category || '')
      .toLowerCase()
      .includes(wanted)
  )
    return false
  const location = [
    event.address?.city,
    event.address?.state,
    event.address?.venue_name,
    event.city,
    event.venue,
    event.location,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  if (filters.city && !location.includes(filters.city.toLowerCase())) return false
  const search = [
    event.title,
    event.description,
    category,
    event.tags,
    location,
    event.organizer?.name,
    event.organiser?.name,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/<[^>]+>/g, ' ')
    .toLowerCase()
  return (
    !filters.q ||
    filters.q
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .every((word) => search.includes(word))
  )
}

export function categoryArtIndex(name) {
  if (/music|concert|night|party/i.test(name)) return 0
  if (/meet|tech|business|conference|education|workshop/i.test(name)) return 1
  if (/food|dining/i.test(name)) return 2
  if (/sport|fitness|outdoor|wellness/i.test(name)) return 4
  return 3
}

export function categoryLabel(name) {
  const labels = [
    [/food/i, 'Food'],
    [/startup|tech/i, 'Tech'],
    [/meetup/i, 'Meetups'],
    [/music/i, 'Music'],
    [/conference|summit/i, 'Conferences'],
    [/art &|creativ/i, 'Arts'],
    [/business/i, 'Business'],
    [/sport|fitness/i, 'Sports'],
    [/workshop/i, 'Workshops'],
    [/party|social/i, 'Social'],
    [/faith|community/i, 'Community'],
    [/theatre/i, 'Theatre'],
    [/education/i, 'Education'],
  ]
  for (const [pattern, label] of labels) if (pattern.test(name)) return label
  return name
}
