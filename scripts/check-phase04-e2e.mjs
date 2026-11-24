import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { randomUUID } from 'node:crypto'
import axios from 'axios'
import { createServer } from 'vite'
const origin = 'http://127.0.0.1:8014'
const fixture = JSON.parse(await readFile(process.env.PHASE04_FIXTURE, 'utf8'))
const http = axios.getAdapter('http')
async function actor(email) {
  const jar = new Map()
  const client = axios.create({
    baseURL: origin,
    adapter: http,
    headers: {
      Accept: 'application/json',
      Origin: 'http://localhost:5174',
      Referer: 'http://localhost:5174/',
    },
  })
  client.interceptors.request.use((config) => {
    config.headers.Cookie = [...jar].map(([key, value]) => `${key}=${value}`).join('; ')
    if (jar.has('XSRF-TOKEN'))
      config.headers['X-XSRF-TOKEN'] = decodeURIComponent(jar.get('XSRF-TOKEN'))
    return config
  })
  client.interceptors.response.use((response) => {
    for (const cookie of response.headers['set-cookie'] || []) {
      const pair = cookie.split(';')[0],
        index = pair.indexOf('=')
      jar.set(pair.slice(0, index), pair.slice(index + 1))
    }
    return response
  })
  await client.get('/sanctum/csrf-cookie')
  if (email) await client.post('/api/login', { email, password: 'Phase04-test-password!' })
  return client
}
const buyer = await actor(),
  owner = await actor('owner-phase04@example.invalid'),
  secondDevice = await actor('owner-phase04@example.invalid'),
  door = await actor('door-phase04@example.invalid'),
  other = await actor('other-phase04@example.invalid')
let current = buyer
const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: 'custom',
})
try {
  const { default: api } = await server.ssrLoadModule('/src/api/axios.js')
  const commerce = await server.ssrLoadModule('/src/services/checkoutService.js')
  const operations = await server.ssrLoadModule('/src/services/eventOperationsService.js')
  api.defaults.adapter = (config) =>
    current.request({ ...config, baseURL: origin, adapter: http, url: '/api' + config.url })
  axios.defaults.adapter = (config) =>
    current.request({ ...config, baseURL: origin, adapter: http })
  const customer = {
    first_name: 'Buyer',
    last_name: 'Only',
    email: 'buyer-phase04@example.invalid',
    phone: '08000000000',
  }
  async function purchase(type, count) {
    const items = [{ ticket_type_id: type, quantity: 1 }]
    const quote = await commerce.quoteCheckout(items)
    assert.ok(Object.keys(quote.registration_schemas).length)
    const attendees = Array.from({ length: count }, (_, seat_index) => ({
      ticket_type_id: type,
      unit_index: 0,
      seat_index,
      answers: { name: `Actual guest ${seat_index}`, email: `guest${seat_index}@example.invalid` },
    }))
    const checkoutToken = randomUUID()
    const attempt = await commerce.initializeCheckout({ checkoutToken, customer, items, attendees })
    const duplicate = await commerce.initializeCheckout({
      checkoutToken,
      customer,
      items,
      attendees,
    })
    assert.equal(duplicate.order.public_id, attempt.order.public_id)
    assert.equal(duplicate.payment.reference, attempt.payment.reference)
    await assert.rejects(
      commerce.initializeCheckout({
        checkoutToken,
        customer,
        items,
        attendees: attendees.map((guest, index) =>
          index === 0
            ? { ...guest, answers: { ...guest.answers, name: 'Changed behind existing attempt' } }
            : guest,
        ),
      }),
      (error) => error.response?.status === 422,
    )
    const paid = await commerce.verifyCheckoutPayment({
      reference: attempt.payment.reference,
      checkoutToken,
    })
    assert.equal(paid.status, 'paid')
    assert.equal(paid.items[0].tickets[0].admit_count, count)
    assert.equal(paid.items[0].tickets[0].attendees.length, count)
    return paid.items[0].tickets[0]
  }
  const table = await purchase(fixture.table_type, 4)
  const individual = await purchase(fixture.individual_type, 1)
  const registration = {
    checkout_token: randomUUID(),
    quantity: 1,
    customer,
    attendees: [
      {
        unit_index: 0,
        seat_index: 0,
        answers: { name: 'Free guest', email: 'free@example.invalid' },
      },
    ],
  }
  assert.equal((await operations.getFreeRegistration(fixture.free_event)).available, 2)
  const free = await operations.registerFreeEvent(fixture.free_event, registration)
  assert.equal(free.status, 'registered')
  assert.equal(free.items[0].tickets[0].attendees[0].name, 'Free guest')
  const repeat = await operations.registerFreeEvent(fixture.free_event, registration)
  assert.equal(repeat.public_id, free.public_id)
  assert.equal((await operations.getFreeRegistration(fixture.free_event)).available, 1)
  await assert.rejects(
    operations.registerFreeEvent(fixture.free_event, { ...registration, quantity: 2 }),
    (error) => error.response?.status === 422,
  )
  await assert.rejects(
    operations.registerFreeEvent(fixture.free_event, {
      ...registration,
      checkout_token: randomUUID(),
      quantity: 2,
      attendees: [],
    }),
    (error) => error.response?.status === 422,
  )
  current = owner
  const attendees = await operations.getAttendees(fixture.table_event, {
    page: 1,
    per_page: 1,
    q: 'Actual',
  })
  assert.equal(attendees.total, 4)
  assert.equal(attendees.data.length, 1)
  assert.equal(attendees.data[0].ticket.token, undefined)
  const updated = await operations.updateAttendee(fixture.table_event, attendees.data[0].id, {
    version: attendees.data[0].lock_version,
    answers: { name: 'Updated guest' },
  })
  assert.equal(updated.name, 'Updated guest')
  await assert.rejects(
    operations.updateAttendee(fixture.table_event, updated.id, {
      version: 1,
      answers: { name: 'Stale' },
    }),
    (error) => error.response?.status === 409,
  )
  const purchases = await operations.getPurchases(fixture.table_event, { page: 1, per_page: 1 })
  assert.equal(purchases.data[0].people_per_unit, 4)
  const gate = fixture.gates[fixture.table_event]
  const lookup = await operations.lookupAdmission(fixture.table_event, {
    token: table.token,
    entrance_id: gate,
  })
  assert.equal(lookup.admit_count, 4)
  const request = {
    token: table.token,
    entrance_id: gate,
    direction: 'in',
    count: 3,
    request_key: randomUUID(),
  }
  const entered = await operations.recordAdmission(fixture.table_event, request)
  assert.equal(entered.outcome, 'recorded')
  assert.equal(entered.inside_count, 3)
  current = secondDevice
  const replay = await operations.recordAdmission(fixture.table_event, request)
  assert.equal(replay.inside_count, 3)
  const second = await operations.lookupAdmission(fixture.table_event, {
    token: table.token,
    entrance_id: gate,
  })
  assert.equal(second.inside_count, 3)
  const denied = await operations.recordAdmission(fixture.table_event, {
    ...request,
    count: 2,
    request_key: randomUUID(),
  })
  assert.equal(denied.outcome, 'denied')
  const exited = await operations.recordAdmission(fixture.table_event, {
    ...request,
    direction: 'out',
    count: 2,
    request_key: randomUUID(),
  })
  assert.equal(exited.inside_count, 1)
  const noReentry = await operations.recordAdmission(fixture.table_event, {
    ...request,
    count: 2,
    request_key: randomUUID(),
  })
  assert.equal(noReentry.outcome, 'denied')
  await secondDevice.put(`/api/event-operations/${fixture.table_event}/admission/settings`, {
    allow_reentry: true,
  })
  const reentry = await operations.recordAdmission(fixture.table_event, {
    ...request,
    count: 2,
    request_key: randomUUID(),
  })
  assert.equal(reentry.inside_count, 3)
  const history = await operations.getAdmissionHistory(fixture.table_event, {
    ticket_public_id: table.public_id,
    per_page: 1,
    page: 1,
  })
  assert.equal(history.total, 3)
  assert.equal(history.data.length, 1)
  const ownGate = await operations.saveEntrance(fixture.table_event, null, {
    name: 'Second entrance',
    active: true,
  })
  current = door
  const scoped = await operations.getAdmissionContext(fixture.table_event)
  assert.equal(scoped.role, 'door')
  assert.equal(scoped.entrances.length, 1)
  await assert.rejects(
    operations.getAttendees(fixture.table_event, { page: 1 }),
    (error) => error.response?.status === 403,
  )
  await assert.rejects(
    operations.lookupAdmission(fixture.table_event, {
      token: table.token,
      entrance_id: ownGate.id,
    }),
    (error) => error.response?.status === 403,
  )
  await assert.rejects(
    operations.getAdmissionContext(fixture.individual_event),
    (error) => error.response?.status === 403,
  )
  current = other
  await assert.rejects(
    operations.getPurchases(fixture.table_event, { page: 1 }),
    (error) => error.response?.status === 403,
  )
  current = owner
  for (const [eventId, ticket] of [
    [fixture.individual_event, individual],
    [fixture.free_event, free.items[0].tickets[0]],
  ]) {
    const result = await operations.recordAdmission(eventId, {
      token: ticket.token,
      entrance_id: fixture.gates[eventId],
      direction: 'in',
      count: 1,
      request_key: randomUUID(),
    })
    assert.equal(result.outcome, 'recorded')
    assert.equal(result.inside_count, 1)
  }
  console.log(
    'PASS real HTTP paid/table/individual and free registration; server-issued credentials; attendee editing and conflict; paginated records; entry/exit/re-entry; cross-device state; idempotent scans and permission isolation',
  )
} finally {
  await server.close()
}
