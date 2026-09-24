import api from '@/api/axios'

const VISITOR_STORAGE_KEY = 'kakaVisitorId'

const randomHex = (length) => {
  const bytes = new Uint8Array(Math.ceil(length / 2))

  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  return Array.from(bytes)
    .map((value) => value.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

const createVisitorId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  const variant = (8 + Math.floor(Math.random() * 4)).toString(16)

  return [
    randomHex(8),
    randomHex(4),
    `4${randomHex(3)}`,
    `${variant}${randomHex(3)}`,
    randomHex(12),
  ].join('-')
}

export const getVisitorId = () => {
  try {
    const existing = localStorage.getItem(
      VISITOR_STORAGE_KEY,
    )

    if (existing) return existing

    const visitorId = createVisitorId()

    localStorage.setItem(
      VISITOR_STORAGE_KEY,
      visitorId,
    )

    return visitorId
  } catch {
    return createVisitorId()
  }
}

export const trackEventView = async (
  eventId,
  { sourceCode = null } = {},
) => {
  const payload = {
    visitor_id: getVisitorId(),
  }

  if (
    typeof sourceCode === 'string'
    && /^[A-Za-z0-9_-]{1,32}$/.test(sourceCode)
  ) {
    payload.source_code = sourceCode.toLowerCase()
  }

  await api.post(
    `/events/${encodeURIComponent(eventId)}/track-view`,
    payload,
  )
}
