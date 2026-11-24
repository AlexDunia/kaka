import assert from 'node:assert/strict'
import { createServer } from 'vite'
import process from 'node:process'
process.env.VITE_DEMO_MODE = 'true'
const server = await createServer({
  mode: 'development',
  server: { middlewareMode: true },
  appType: 'custom',
})
try {
  const { DASHBOARD_PREVIEW } = await server.ssrLoadModule('/src/services/dashboardPreview.js')
  const { staticEvents } = await server.ssrLoadModule('/src/services/staticEventCatalog.js')
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const commerce = await server.ssrLoadModule('/src/services/checkoutService.js')
  let requests = 0
  api.defaults.adapter = async () => {
    requests++
    throw new Error('No live commerce allowed')
  }
  assert.equal(DASHBOARD_PREVIEW, true)
  assert.equal(staticEvents.length, 2)
  assert.ok(staticEvents.every((event) => event.demo === true))
  await assert.rejects(commerce.quoteCheckout([{ ticket_type_id: 990001, quantity: 1 }]))
  await assert.rejects(
    commerce.initializeCheckout({ items: [{ ticket_type_id: 20, quantity: 1 }] }),
  )
  await assert.rejects(commerce.verifyCheckoutPayment({ reference: 'demo' }))
  await assert.rejects(commerce.getCheckoutOrder({ orderId: 'demo' }))
  assert.equal(requests, 0)
  console.log('PASS explicit demo configuration enables fixtures and marks their provenance')
  console.log(
    'PASS demo mode blocks quote, initialization, payment verification and order requests',
  )
} finally {
  await server.close()
}
