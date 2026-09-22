import api, { ensureCsrfCookie } from '@/api/axios'

const checkoutHeaders = (checkoutToken) => checkoutToken ? { 'X-Checkout-Token': checkoutToken } : {}

export const quoteCheckout = async (items) => {
  const response = await api.post('/checkout/quote', { items })
  return response.data.data
}

export const initializeCheckout = async ({ checkoutToken, visitorId, customer, items }) => {
  await ensureCsrfCookie()
  const response = await api.post('/checkout/initialize', { checkout_token: checkoutToken, visitor_id: visitorId || null, customer, items })
  return response.data.data
}

export const verifyCheckoutPayment = async ({ reference, checkoutToken }) => {
  await ensureCsrfCookie()
  const response = await api.post(`/checkout/payments/${encodeURIComponent(reference)}/verify`, {}, { headers: checkoutHeaders(checkoutToken) })
  return response.data.data
}

export const getCheckoutOrder = async ({ orderId, checkoutToken }) => {
  const response = await api.get(`/checkout/orders/${encodeURIComponent(orderId)}`, { headers: checkoutHeaders(checkoutToken) })
  return response.data.data
}
