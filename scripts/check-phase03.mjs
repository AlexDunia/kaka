import assert from 'node:assert/strict'
import axios from 'axios'
import { createServer } from 'vite'
const values = new Map()
globalThis.sessionStorage = {
  getItem: (k) => values.get(k) ?? null,
  setItem: (k, v) => values.set(k, String(v)),
  removeItem: (k) => values.delete(k),
}
globalThis.window = new EventTarget()
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})
try {
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const service = await server.ssrLoadModule('/src/services/checkoutService.js')
  const storage = await server.ssrLoadModule('/src/utils/checkoutStorage.js')
  const calls = []
  api.defaults.adapter = async (config) => {
    calls.push(config)
    return {
      data: { data: { status: 'pending_payment' } },
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
  axios.defaults.adapter = api.defaults.adapter
  const attempt = storage.getOrCreateCheckoutToken()
  assert.equal(storage.getOrCreateCheckoutToken(), attempt)
  storage.rememberActiveCheckout({
    orderId: 'pending-order',
    reference: 'pending-ref',
    checkoutToken: attempt,
  })
  storage.clearCheckoutAttempt()
  assert.equal(
    storage.getOrCreateCheckoutToken(),
    attempt,
    'Cart edits cannot replace an unresolved order token',
  )
  assert.equal(storage.getActiveCheckout().reference, 'pending-ref')
  storage.clearActiveCheckout()
  assert.notEqual(storage.getOrCreateCheckoutToken(), attempt)
  storage.rememberOrderRecovery({
    order_public_id: 'order-1',
    access_token: 'verified-capability',
    expires_at: new Date(Date.now() + 60000).toISOString(),
  })
  await service.getCheckoutOrder({ orderId: 'order-1' })
  assert.equal(calls.at(-1).headers['X-Order-Recovery-Token'], 'verified-capability')
  await service.getCheckoutOrder({ orderId: 'order-2' })
  assert.equal(calls.at(-1).headers['X-Order-Recovery-Token'], undefined)
  await service.verifyCheckoutPayment({ orderId: 'order-1', reference: 'test/ref' })
  assert.equal(calls.at(-1).url, '/checkout/payments/test%2Fref/verify')
  assert.equal(calls.at(-1).headers['X-Order-Recovery-Token'], 'verified-capability')
  await service.requestOrderRecovery('order-1', 'buyer@example.invalid')
  assert.deepEqual(JSON.parse(calls.at(-1).data), {
    order_public_id: 'order-1',
    email: 'buyer@example.invalid',
  })
  await service.exchangeOrderRecovery('email-token')
  assert.deepEqual(JSON.parse(calls.at(-1).data), { token: 'email-token' })
  await service.getBuyerOrders(2)
  assert.deepEqual(calls.at(-1).params, { page: 2, per_page: 20 })
  storage.rememberOrderRecovery({
    order_public_id: 'order-1',
    access_token: 'expired',
    expires_at: new Date(0).toISOString(),
  })
  assert.equal(storage.getOrderRecovery('order-1'), null)
  assert.equal(values.has('checkoutOrderRecovery:order-1'), false)
  console.log(
    'PASS recovery headers, scope, expiry, encoded references, CSRF mutations and paginated history contracts',
  )
} finally {
  await server.close()
}
