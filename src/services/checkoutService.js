import api, { ensureCsrfCookie } from '@/api/axios'
import { getOrderRecovery } from '@/utils/checkoutStorage'

// Demo mode cannot contact real commerce endpoints, even with a mixed cart.
import { DASHBOARD_PREVIEW } from './dashboardPreview'
const requireLiveCheckout = () => {
  if (DASHBOARD_PREVIEW) throw new Error("Payments aren't available in this demo.")
}

const checkoutHeaders = (checkoutToken) =>
  checkoutToken ? { 'X-Checkout-Token': checkoutToken } : {}

export const quoteCheckout = async (items) => {
  requireLiveCheckout()
  const response = await api.post('/checkout/quote', { items })
  return response.data.data
}

export const initializeCheckout = async ({
  checkoutToken,
  visitorId,
  customer,
  items,
  attendees = [],
}) => {
  requireLiveCheckout()
  await ensureCsrfCookie()
  const response = await api.post('/checkout/initialize', {
    checkout_token: checkoutToken,
    visitor_id: visitorId || null,
    customer,
    items,
    attendees,
  })
  return response.data.data
}

export const verifyCheckoutPayment = async ({ reference, checkoutToken, orderId }) => {
  requireLiveCheckout()
  await ensureCsrfCookie()
  const response = await api.post(
    `/checkout/payments/${encodeURIComponent(reference)}/verify`,
    {},
    { headers: { ...checkoutHeaders(checkoutToken), ...recoveryHeaders(orderId) } },
  )
  return response.data.data
}

export const getCheckoutOrder = async ({ orderId, checkoutToken }) => {
  requireLiveCheckout()
  const response = await api.get(`/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: { ...checkoutHeaders(checkoutToken), ...recoveryHeaders(orderId) },
  })
  return response.data.data
}

const recoveryHeaders = (orderId) => {
  const token = orderId ? getOrderRecovery(orderId) : null
  return token ? { 'X-Order-Recovery-Token': token } : {}
}
export const getBuyerOrders = async (page = 1) => {
  requireLiveCheckout()
  return (await api.get('/buyer/orders', { params: { page, per_page: 20 } })).data
}
export const requestOrderRecovery = async (orderId, email) => {
  requireLiveCheckout()
  await ensureCsrfCookie()
  return (await api.post('/checkout/recovery/request', { order_public_id: orderId, email })).data
}
export const exchangeOrderRecovery = async (token) => {
  requireLiveCheckout()
  await ensureCsrfCookie()
  return (await api.post('/checkout/recovery/exchange', { token })).data.data
}
