import api, { ensureCsrfCookie } from '@/api/axios'

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

export const initializeCheckout = async ({ checkoutToken, visitorId, customer, items }) => {
  requireLiveCheckout()
  await ensureCsrfCookie()
  const response = await api.post('/checkout/initialize', {
    checkout_token: checkoutToken,
    visitor_id: visitorId || null,
    customer,
    items,
  })
  return response.data.data
}

export const verifyCheckoutPayment = async ({ reference, checkoutToken }) => {
  requireLiveCheckout()
  await ensureCsrfCookie()
  const response = await api.post(
    `/checkout/payments/${encodeURIComponent(reference)}/verify`,
    {},
    { headers: checkoutHeaders(checkoutToken) },
  )
  return response.data.data
}

export const getCheckoutOrder = async ({ orderId, checkoutToken }) => {
  requireLiveCheckout()
  const response = await api.get(`/checkout/orders/${encodeURIComponent(orderId)}`, {
    headers: checkoutHeaders(checkoutToken),
  })
  return response.data.data
}
