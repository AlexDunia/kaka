const MODE_KEY = 'rushhour:static-preview:v1'

export function isStaticPreview() {
  try {
    return localStorage.getItem(MODE_KEY) === 'true'
  } catch {
    return false
  }
}

// Reload so every existing preview component selects the same data source.
export function enterStaticPreview() {
  localStorage.setItem(MODE_KEY, 'true')
  window.location.assign(`${import.meta.env.BASE_URL}dashboard`)
}

export function exitStaticPreview() {
  localStorage.removeItem(MODE_KEY)
  window.location.assign(`${import.meta.env.BASE_URL}login`)
}
