export const financialRows = [
  ['gross_minor', 'Original ticket value'],
  ['discounts_minor', 'Discounts at purchase'],
  ['charged_minor', 'Paid before refunds'],
  ['refunds_minor', 'Confirmed refunds'],
  ['platform_fee_minor', 'Original platform fees'],
  ['platform_fee_reversed_minor', 'Platform fees returned'],
  ['provider_fee_minor', 'Confirmed payment fees (paid by Rush Hour)'],
  ['seller_net_before_refunds_minor', 'Your earnings before refunds'],
  ['seller_net_minor', 'Your earnings after confirmed refunds'],
  ['pending_settlement_minor', 'Awaiting payout confirmation'],
  ['confirmed_settled_minor', 'Confirmed payouts'],
  ['seller_recovery_due_minor', 'Amount you need to repay'],
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
    voided: 'Registration cancelled',
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
