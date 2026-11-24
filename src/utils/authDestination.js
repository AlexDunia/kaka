const key = 'rushhour-auth-destination'

export function safeAuthDestination(value) {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    /[\\\u0000-\u0020]/.test(value)
  )
    return null
  if (/^\/(login|register|auth)(\/|\?|#|$)/.test(value)) return null
  return value
}

export function rememberAuthDestination(value) {
  const destination = safeAuthDestination(value)
  if (destination) sessionStorage.setItem(key, destination)
  else sessionStorage.removeItem(key)
}

export function takeAuthDestination() {
  const destination = safeAuthDestination(sessionStorage.getItem(key))
  sessionStorage.removeItem(key)
  return destination
}
