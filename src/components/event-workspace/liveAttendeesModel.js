import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { getActivePinia } from 'pinia'
import { v4 as uuid, v5 as fingerprintUuid } from 'uuid'
import { useAuthStore } from '@/stores/auth'
import * as api from '@/services/eventOperationsService'
const caches = new WeakMap()
const pageState = () => ref({ current_page: 1, last_page: 1, total: 0, per_page: 30 })
export function useLiveWorkspaceAttendees(eventId, actualMode) {
  const auth = useAuthStore()
  const account = auth.user?.id
  const pinia = getActivePinia()
  if (!caches.has(pinia)) caches.set(pinia, new Map())
  const cache = caches.get(pinia),
    key = `${account}:${eventId}`
  if (!cache.has(key)) cache.set(key, createModel(eventId, actualMode, account))
  const model = cache.get(key)
  onMounted(model.attach)
  onBeforeUnmount(() => {
    if (model.detach()) cache.delete(key)
  })
  watch(
    () => auth.user?.id,
    (value) => {
      if (value !== account) model.clear()
    },
  )
  return model
}
function createModel(eventId, actualMode, account) {
  const pendingKey = `rushhour-admission-request:${account}:${eventId}`
  const guests = ref([]),
    orders = ref([]),
    movements = ref([]),
    entrances = ref([])
  const mode = ref(actualMode === 'free' ? 'free' : 'paid')
  const photos = ref({}),
    activity = ref({}),
    alerts = ref({})
  const context = ref(null),
    loading = ref(false),
    error = ref(''),
    busy = ref(false)
  const attendeePage = pageState(),
    purchasePage = pageState(),
    historyPage = pageState()
  const queries = { attendees: { page: 1 }, purchases: { page: 1 }, history: { page: 1 } }
  const versions = { attendees: 0, purchases: 0, history: 0, context: 0 }
  let consumers = 0,
    timer,
    channel,
    active = true,
    refreshing = null,
    pending = null,
    initialLoadFinished = false
  const normalizeGuest = (row) => ({
    ...row,
    id: String(row.id),
    attendeeId: row.id,
    ticketPublicId: row.ticket?.public_id,
    type: row.order_item?.ticket_name || 'Admission',
    name: row.name || 'Unnamed attendee',
    originalName: row.name,
    email: row.email || '',
    purchased: row.created_at,
    version: row.lock_version,
    schema: row.order_item?.registration_schema || [],
    orderItemId: row.order_item_id,
  })
  function normalizeOrders(rows) {
    const grouped = new Map()
    for (const row of rows) {
      const order = row.order
      if (!order) continue
      if (!grouped.has(order.public_id))
        grouped.set(order.public_id, {
          id: order.public_id,
          buyer: [order.customer_first_name, order.customer_last_name].filter(Boolean).join(' '),
          email: order.customer_email,
          purchased: order.created_at,
          payment: order.status,
          ticketIds: [],
          itemIds: [],
          amountMinor: 0,
          currency: row.currency,
          quantity: 0,
          people: 0,
          lines: [],
          partial: true,
        })
      const value = grouped.get(order.public_id)
      value.itemIds.push(row.id)
      value.lines.push(row)
      value.amountMinor += Number(row.line_total_minor)
      value.quantity += row.quantity
      value.people += row.quantity * row.people_per_unit
      value.ticketIds.push(...guests.value.filter((g) => g.orderItemId === row.id).map((g) => g.id))
    }
    return [...grouped.values()]
  }
  const fail = (err) => {
    if (!active) return
    error.value = api.operationsError(err)
    if ([401, 403].includes(err?.response?.status)) {
      clear()
      error.value = api.operationsError(err)
    }
  }
  async function loadAttendees(params = queries.attendees) {
    queries.attendees = { ...params, per_page: 30 }
    const version = ++versions.attendees
    try {
      const result = await api.getAttendees(eventId, queries.attendees)
      if (!active || version !== versions.attendees) return
      guests.value = result.data.map(normalizeGuest)
      attendeePage.value = result
      for (const order of orders.value)
        order.ticketIds = guests.value
          .filter((g) => order.itemIds.includes(g.orderItemId))
          .map((g) => g.id)
    } catch (err) {
      if (version === versions.attendees) fail(err)
    }
  }
  async function loadPurchases(params = queries.purchases) {
    queries.purchases = { ...params, per_page: 30 }
    const version = ++versions.purchases
    try {
      const result = await api.getPurchases(eventId, queries.purchases)
      if (!active || version !== versions.purchases) return
      orders.value = normalizeOrders(result.data)
      purchasePage.value = result
    } catch (err) {
      if (version === versions.purchases) fail(err)
    }
  }
  async function loadHistory(params = queries.history) {
    queries.history = { ...params, per_page: 30 }
    const version = ++versions.history
    try {
      const result = await api.getAdmissionHistory(eventId, queries.history)
      if (!active || version !== versions.history) return
      movements.value = result.data
        .map((row) => ({
          ...row,
          id: row.ticket_public_id,
          kind: row.direction,
          at: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(row.occurred_at)
            ? row.occurred_at.replace(' ', 'T') + 'Z'
            : row.occurred_at,
          entrance: row.entrance_name,
        }))
        .reverse()
      historyPage.value = result
    } catch (err) {
      if (version === versions.history) fail(err)
    }
  }
  async function loadContext() {
    const version = ++versions.context
    try {
      const result = await api.getAdmissionContext(eventId)
      if (!active || version !== versions.context) return
      context.value = result
      entrances.value = result.entrances.map((door) => ({ ...door, contacts: [], aliases: [] }))
    } catch (err) {
      if (version === versions.context) fail(err)
    }
  }
  async function refresh({ background = false } = {}) {
    if (!active || refreshing) return refreshing
    loading.value = !background || !initialLoadFinished
    error.value = ''
    refreshing = (async () => {
      await loadContext()
      if (!active || !context.value) return
      await Promise.all([
        loadHistory(),
        ...(context.value.role === 'door' ? [] : [loadAttendees(), loadPurchases()]),
      ])
    })().finally(() => {
      refreshing = null
      initialLoadFinished = true
      loading.value = false
    })
    return refreshing
  }
  const visibleRefresh = () => {
    if (document.visibilityState !== 'hidden') void refresh({ background: true })
  }
  function attach() {
    consumers++
    if (consumers !== 1) return
    void refresh()
    timer = setInterval(visibleRefresh, 5000)
    window.addEventListener('focus', visibleRefresh)
    document.addEventListener('visibilitychange', visibleRefresh)
    if (typeof BroadcastChannel !== 'undefined') {
      channel = new BroadcastChannel(`rushhour-admission:${eventId}`)
      channel.onmessage = visibleRefresh
    }
  }
  function stop() {
    clearInterval(timer)
    channel?.close()
    channel = null
    window.removeEventListener('focus', visibleRefresh)
    document.removeEventListener('visibilitychange', visibleRefresh)
  }
  function clear() {
    active = false
    stop()
    pending = null
    guests.value = []
    orders.value = []
    movements.value = []
    entrances.value = []
    context.value = null
    error.value = 'Reopen this event to load the current account records.'
  }
  function detach() {
    consumers--
    if (consumers > 0) return false
    clear()
    return true
  }
  const guest = (id) => guests.value.find((g) => g.id === String(id))
  const visits = (id) => {
    const publicId = guest(id)?.ticketPublicId || id
    return movements.value.filter((v) => v.id === publicId)
  }
  const inside = (id) => Boolean(guest(id)?.inside)
  const everArrived = (id) => Number(guest(id)?.entries) > 0
  const guestState = (id) =>
    inside(id) ? 'Inside now' : everArrived(id) ? 'Has left' : 'Not arrived yet'
  const ticketsFor = (order) =>
    order ? guests.value.filter((g) => order.itemIds.includes(g.orderItemId)) : []
  const orderFor = (id) =>
    orders.value.find((order) => order.itemIds.includes(guest(id)?.orderItemId))
  async function updateGuest(id, change) {
    if (busy.value) return { ok: false, message: 'Please wait for the current update.' }
    const current = guest(id)
    if (!current) return { ok: false, message: 'Reload this attendee before editing.' }
    busy.value = true
    try {
      const answers = current.schema.length
        ? Object.fromEntries(
            current.schema
              .filter(
                (field) =>
                  change[field.id] !== undefined || change.answers?.[field.id] !== undefined,
              )
              .map((field) => [
                field.id,
                ['name', 'email'].includes(field.id) ? change[field.id] : change.answers[field.id],
              ]),
          )
        : { name: change.name, email: change.email }
      const result = await api.updateAttendee(eventId, current.attendeeId, {
        version: current.version,
        answers,
      })
      if (active)
        Object.assign(
          current,
          normalizeGuest({
            ...current,
            ...result,
            order_item: { ticket_name: current.type, registration_schema: current.schema },
            ticket: { public_id: current.ticketPublicId },
          }),
        )
      channel?.postMessage('refresh')
      return { ok: true, message: 'Guest details saved.' }
    } catch (err) {
      if (err?.response?.status === 409) await loadAttendees()
      return {
        ok: false,
        message: api.operationsError(err, 'Guest details were not saved. Please try again.'),
      }
    } finally {
      busy.value = false
    }
  }
  async function lookup(token, entranceId, direction = 'in') {
    return api.lookupAdmission(eventId, {
      token: token.trim(),
      entrance_id: Number(entranceId),
      direction,
    })
  }
  async function recordMovement(token, kind, entranceId, count = 1) {
    if (busy.value) return { ok: false, message: 'Please wait for the current scan.' }
    const input = {
      token: token.trim(),
      direction: kind,
      entrance_id: Number(entranceId),
      count: Number(count),
    }
    const fingerprint = fingerprintUuid(JSON.stringify(input), fingerprintUuid.URL)
    if (!pending) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(pendingKey) || 'null')
        if (saved?.fingerprint) {
          if (saved.fingerprint !== fingerprint)
            return {
              ok: false,
              message:
                'A previous scan is unconfirmed. Retry the original credential, direction and count before recording another movement.',
            }
          pending = { fingerprint, payload: { ...input, request_key: saved.request_key } }
        }
      } catch {
        return {
          ok: false,
          message:
            'Scan retry storage is unavailable. Restore browser storage before recording admission.',
        }
      }
    }
    if (pending && pending.fingerprint !== fingerprint)
      return {
        ok: false,
        message:
          'The previous scan is unconfirmed. Retry that same scan before recording another movement.',
      }
    pending ||= { fingerprint, payload: { ...input, request_key: uuid() } }
    busy.value = true
    try {
      sessionStorage.setItem(
        pendingKey,
        JSON.stringify({ fingerprint, request_key: pending.payload.request_key }),
      )
      const result = await api.recordAdmission(eventId, pending.payload)
      pending = null
      sessionStorage.removeItem(pendingKey)
      await refresh()
      channel?.postMessage('refresh')
      return {
        ...result,
        ok: result.outcome === 'recorded',
        message:
          result.outcome === 'recorded'
            ? result.direction === 'in'
              ? `${result.count} ${result.count === 1 ? 'entry' : 'entries'} recorded.`
              : `${result.count} ${result.count === 1 ? 'exit' : 'exits'} recorded.`
            : {
                event_inactive: 'This event is not active. No movement was recorded.',
                entrance_closed: 'This entrance is closed for entry. No movement was recorded.',
                insufficient_admission_entitlement:
                  'That count is not available for this ticket. Check its current entry and exit status. No movement was recorded.',
              }[result.reason] ||
              'No movement was recorded. Check the ticket status before trying again.',
      }
    } catch (err) {
      if (err?.response && err.response.status < 500) {
        pending = null
        sessionStorage.removeItem(pendingKey)
      }
      return {
        ok: false,
        message: api.operationsError(
          err,
          'The scan is unconfirmed. Check your connection and retry the same scan; no successful admission has been confirmed.',
        ),
      }
    } finally {
      busy.value = false
    }
  }
  async function persistEntrance(id, input) {
    const result = await api.saveEntrance(eventId, id, input)
    if (active) {
      const index = entrances.value.findIndex((e) => e.id === result.id)
      if (index < 0) entrances.value.push({ ...result, contacts: [], aliases: [] })
      else entrances.value[index] = { ...result, contacts: [], aliases: [] }
    }
    channel?.postMessage('refresh')
    return result
  }
  return {
    guests,
    orders,
    movements,
    entrances,
    context,
    mode,
    photos,
    activity,
    alerts,
    loading,
    error,
    busy,
    attendeePage,
    purchasePage,
    historyPage,
    loadAttendees,
    loadPurchases,
    loadHistory,
    loadContext,
    refresh,
    retry: () => (active ? refresh() : window.location.reload()),
    attach,
    detach,
    clear,
    visits,
    inside,
    everArrived,
    guestState,
    ticketsFor,
    orderFor,
    orderTotal: (order) => order?.amountMinor ?? 0,
    setMode: () => {},
    saveAlert: () => false,
    savePhoto: () => false,
    updateGuest,
    lookup,
    recordMovement,
    persistEntrance,
    resend: async (id) => api.resendTicket(eventId, id),
    exportGuests: (q) => api.exportAttendees(eventId, q),
    canManage: computed(() => context.value?.role === 'owner'),
  }
}
