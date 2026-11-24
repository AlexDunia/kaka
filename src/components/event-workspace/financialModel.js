export const financialRows = [
  ['gross_minor', 'Original ticket value'],
  ['discounts_minor', 'Historical discounts'],
  ['charged_minor', 'Charged before refunds'],
  ['refunds_minor', 'Confirmed refunds'],
  ['platform_fee_minor', 'Original platform fees'],
  ['platform_fee_reversed_minor', 'Platform fees returned'],
  ['provider_fee_minor', 'Verified provider fees (paid by platform)'],
  ['seller_net_before_refunds_minor', 'Seller proceeds before refunds'],
  ['seller_net_minor', 'Seller proceeds after confirmed refunds'],
  ['pending_settlement_minor', 'Awaiting settlement evidence'],
  ['confirmed_settled_minor', 'Confirmed seller settlement'],
  ['seller_recovery_due_minor', 'Seller recovery due'],
]
export const financeStatus = (status) =>
  ({
    queued: 'Queued',
    pending: 'Pending',
    processing: 'Processing',
    active: 'Active',
    review: 'Needs review',
    attention: 'Needs review',
    failed: 'Failed',
    processed: 'Refund confirmed',
    voided: 'Registration voided',
    paid: 'Paid',
    registered: 'Registered',
    partially_refunded: 'Partially refunded',
    refunded: 'Refunded',
    cancelled: 'Cancelled',
  })[status] || String(status || 'Unknown').replaceAll('_', ' ')

// Only the operation identifier survives a reload. No buyer or banking data is stored.
export function refundIntention(owner, event, order, ids, reason, storage = sessionStorage) {
  const key = `rushhour:refund:${owner}:${event}:${order}:${[...ids].sort((a, b) => a - b).join(',')}`
  const signature = JSON.stringify([[...ids].sort((a, b) => a - b), reason])
  // Keep reason in memory only; a digest distinguishes retries without storing it.
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(signature)).then((hash) => {
    const digest = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, '0')).join('')
    const saved = JSON.parse(storage.getItem(`${key}:${digest}`) || 'null')
    const value = saved?.digest === digest ? saved : { digest, request_key: crypto.randomUUID() }
    storage.setItem(`${key}:${digest}`, JSON.stringify(value))
    return value.request_key
  })
}
