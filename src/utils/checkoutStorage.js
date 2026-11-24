import { v4 as uuidv4 } from 'uuid'
const ATTEMPT_KEY = 'checkoutAttemptToken',
  ORDER_TOKEN_PREFIX = 'checkoutOrderToken:'
export const getOrCreateCheckoutToken = () => {
  const existing = getActiveCheckout()?.checkoutToken || sessionStorage.getItem(ATTEMPT_KEY)
  if (existing) return existing
  const token = uuidv4()
  sessionStorage.setItem(ATTEMPT_KEY, token)
  return token
}
export const clearCheckoutAttempt = () => sessionStorage.removeItem(ATTEMPT_KEY)
export const rememberOrderToken = (orderId, token) => {
  if (orderId && token) sessionStorage.setItem(`${ORDER_TOKEN_PREFIX}${orderId}`, token)
}
export const getOrderToken = (orderId) =>
  orderId ? sessionStorage.getItem(`${ORDER_TOKEN_PREFIX}${orderId}`) : null

const RECOVERY_PREFIX = 'checkoutOrderRecovery:'
export const rememberOrderRecovery = ({ order_public_id, access_token, expires_at }) => {
  sessionStorage.setItem(
    `${RECOVERY_PREFIX}${order_public_id}`,
    JSON.stringify({ access_token, expires_at }),
  )
}
export const getOrderRecovery = (orderId) => {
  const key = `${RECOVERY_PREFIX}${orderId}`
  try {
    const record = JSON.parse(sessionStorage.getItem(key) || 'null')
    if (record?.access_token && Date.parse(record.expires_at) > Date.now())
      return record.access_token
  } catch {
    /* Discard invalid or expired capability storage. */
  }
  sessionStorage.removeItem(key)
  return null
}

// Keep unresolved orders separate from editable cart state. Never persist ticket credentials.
const ACTIVE_KEY = 'checkoutActiveOrder'
export const rememberActiveCheckout = ({ orderId, reference, checkoutToken }) => {
  if (checkoutToken)
    sessionStorage.setItem(ACTIVE_KEY, JSON.stringify({ orderId, reference, checkoutToken }))
}
export const getActiveCheckout = () => {
  try {
    const value = JSON.parse(sessionStorage.getItem(ACTIVE_KEY) || 'null')
    if (typeof value?.orderId === 'string' && typeof value?.checkoutToken === 'string') return value
  } catch {
    /* Discard invalid storage. */
  }
  return null
}
export const clearActiveCheckout = () => sessionStorage.removeItem(ACTIVE_KEY)
