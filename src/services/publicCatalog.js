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
  const numericCategory = /^\d+$/.test(String(filters.category || ''))
  const params = {
    page: filters.page || 1,
    per_page: 12,
    ...(filters.q ? { q: filters.q } : {}),
    ...(filters.city ? { city: filters.city } : {}),
    ...(filters.category
      ? { [numericCategory ? 'category_id' : 'category']: filters.category }
      : {}),
    ...(filters.sort ? { sort: filters.sort } : {}),
  }
  const { data } = await catalog.get('/events', { signal, params })
  return {
    events: collection(data),
    total: Number(data.meta.total),
    pages: Number(data.meta.last_page),
  }
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
