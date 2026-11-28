const MODE_KEY = 'rushhour:static-preview:v1'

export function isStaticPreview() {
  try {
    const selected = localStorage.getItem(MODE_KEY)
    if (selected !== null) return selected === 'true'
  } catch {
    // Use the host default when the saved selection cannot be read.
  }
  return typeof window !== 'undefined' && window.location.hostname === 'alexdunia.github.io'
}

// Reload so every existing preview component selects the same data source.
export function enterStaticPreview() {
  localStorage.setItem(MODE_KEY, 'true')
  window.location.assign(`${import.meta.env.BASE_URL}dashboard`)
}

export function exitStaticPreview() {
  localStorage.setItem(MODE_KEY, 'false')
  window.location.assign(`${import.meta.env.BASE_URL}login`)
}
