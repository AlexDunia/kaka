import { purchaseSources, samplePriceMinor } from './attendeesModel'
import { platforms, platformFor } from './promotionModel'

// Original checkout snapshots from the supplied HTML, in minor currency units.
// Current ticket prices and edited offers must never rewrite these example purchases.
export const originalOffers = {
  SUNSET10: { name: 'Campus Store', type: 'percent', value: 10 },
  FRIENDS20: { name: 'Friends offer', type: 'percent', value: 20 },
  VIPNIGHT: { name: 'VIP offer', type: 'fixed', value: 2000 },
}
export const defaultEarningsCodes = Object.entries(originalOffers).map(([code, offer]) => ({
  ...offer,
  code,
  active: code !== 'FRIENDS20',
  used: { SUNSET10: 38, FRIENDS20: 16, VIPNIGHT: 8 }[code],
  limit: code === 'SUNSET10' ? 100 : code === 'FRIENDS20' ? 50 : 20,
  eligible: code === 'VIPNIGHT' ? ['VIP'] : ['all'],
}))
export const tierKey = (tier) =>
  ({ 'General admission': 'general', VIP: 'vip', 'Early bird': 'early' })[tier.type || tier.name] ||
  String(tier.id)
export const sourceName = (source) => platforms.find((p) => p.key === source)?.label || source
const seeds = [
  ['general', 30, 'SUNSET10', 'whatsapp'],
  ['general', 8, 'FRIENDS20', 'instagram'],
  ['general', 70, null, 'whatsapp'],
  ['general', 37, null, 'instagram'],
  ['general', 22, null, 'facebook'],
  ['general', 93, null, null],
  ['vip', 8, 'VIPNIGHT', 'whatsapp'],
  ['vip', 6, 'SUNSET10', 'instagram'],
  ['vip', 4, 'FRIENDS20', null],
  ['vip', 12, null, 'whatsapp'],
  ['vip', 5, null, 'facebook'],
  ['vip', 7, null, null],
  ['early', 2, 'SUNSET10', 'whatsapp'],
  ['early', 25, null, 'whatsapp'],
  ['early', 18, null, 'instagram'],
  ['early', 15, null, 'tiktok'],
  ['early', 50, null, null],
]
const originalPrices = { general: 1000000, vip: 2200000, early: 800000 }
export function snapshotAmount(price, code) {
  const offer = originalOffers[code]
  const saving = !offer
    ? 0
    : offer.type === 'fixed'
      ? offer.value * 100
      : (price * offer.value) / 100
  return Math.max(0, price - saving)
}
export function sumEarnings(rows) {
  return rows.reduce(
    (sum, row) => ({
      count: sum.count + row.count,
      paid: sum.paid + row.paid,
      saved: sum.saved + row.saved,
      gross: sum.gross + row.gross,
    }),
    { count: 0, paid: 0, saved: 0, gross: 0 },
  )
}
export function buildEarnings({
  overview,
  preview = false,
  codes = [],
  links = [],
  guests = [],
  orders = [],
}) {
  const tiers = (overview.ticket_types || []).map((t) => ({
    ...t,
    key: tierKey(t),
    originalPrice: preview ? originalPrices[tierKey(t)] : null,
  }))
  const rows = preview
    ? seeds.map(([tier, count, code, source]) => {
        const price = originalPrices[tier],
          paid = snapshotAmount(price, code) * count
        return {
          tier,
          count,
          code,
          source,
          gross: price * count,
          paid,
          saved: price * count - paid,
        }
      })
    : []
  const filter = (scope = {}) =>
    rows.filter(
      (row) =>
        (!scope.tier || row.tier === scope.tier) &&
        (!scope.code || row.code === scope.code) &&
        (!scope.channel || row.source === scope.channel),
    )
  const stats = (scope = {}) =>
    preview
      ? sumEarnings(filter(scope))
      : {
          count:
            scope.code || (scope.tier && scope.channel)
              ? null
              : scope.channel
                ? (overview.sources?.find((s) => s.source_code === scope.channel)?.units_sold ??
                  null)
                : scope.tier
                  ? (tiers.find((t) => t.key === scope.tier)?.sold_units ?? null)
                  : (overview.sales?.units_sold ?? null),
          paid:
            scope.code || (scope.tier && scope.channel)
              ? null
              : scope.channel
                ? (overview.sources?.find((s) => s.source_code === scope.channel)?.revenue_minor ??
                  null)
                : scope.tier
                  ? (tiers.find((t) => t.key === scope.tier)?.revenue_minor ?? null)
                  : (overview.revenue?.total_minor ?? null),
          saved: null,
          gross: null,
        }
  const codeRows = (tier) =>
    [
      ...new Set([
        ...filter({ tier })
          .map((r) => r.code)
          .filter(Boolean),
        ...codes
          .filter((c) => {
            const eligible =
              c.eligibleTypes || (Array.isArray(c.eligible) ? c.eligible : [c.eligible || 'all'])
            const t = tiers.find((t) => t.key === tier)
            return (
              !tier ||
              eligible.some((v) => ['all', tier, t?.name, String(t?.id)].includes(String(v)))
            )
          })
          .map((c) => c.code),
      ]),
    ]
      .map((code) => ({
        code,
        config: codes.find((c) => c.code === code),
        original: preview ? originalOffers[code] : null,
        stats: stats({ tier, code }),
      }))
      .sort((a, b) => (b.stats.paid || 0) - (a.stats.paid || 0))
  const linked = links.map((link) => ({
    ...link,
    channel: preview ? platformFor(link).key : link.source_code,
  }))
  const sourceRows = (tier) =>
    [
      ...new Set([
        ...filter({ tier })
          .map((r) => r.source)
          .filter(Boolean),
        ...(!preview && !tier ? (overview.sources || []).map((s) => s.source_code) : []),
        ...linked.map((l) => l.channel),
      ]),
    ]
      .map((source) => ({
        source,
        label: overview.sources?.find((s) => s.source_code === source)?.label || sourceName(source),
        stats: stats({ tier, channel: source }),
        links: linked.filter((l) => l.channel === source),
      }))
      .sort((a, b) => (b.stats.paid || 0) - (a.stats.paid || 0))
  const people = preview
    ? orders.flatMap((order) =>
        order.ticketIds
          .map((id) => {
            const ticket = guests.find((g) => g.id === id),
              tracking = purchaseSources[order.id] || {}
            return ticket
              ? {
                  ticket,
                  order,
                  tracking,
                  tier: tierKey(ticket),
                  paid: snapshotAmount(samplePriceMinor[ticket.type] || 0, tracking.code),
                }
              : null
          })
          .filter(Boolean),
      )
    : []
  const buyers = (scope = {}, search = '') =>
    people.filter(
      (p) =>
        (!scope.tier || p.tier === scope.tier) &&
        (!scope.code || p.tracking.code === scope.code) &&
        (!scope.channel || p.tracking.channel === scope.channel) &&
        [
          p.ticket.name,
          p.ticket.email,
          p.ticket.id,
          p.order.buyer,
          p.order.email,
          p.order.id,
          p.tracking.code,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search.trim().toLowerCase()),
    )
  return {
    tiers,
    stats,
    codeRows,
    sourceRows,
    buyers,
    rows,
    discount: preview
      ? sumEarnings(rows.filter((r) => r.code))
      : { count: null, paid: null, saved: null },
    social: preview
      ? sumEarnings(rows.filter((r) => r.source))
      : {
          count: (overview.sources || []).every((s) => s.units_sold != null)
            ? (overview.sources || []).reduce((n, s) => n + s.units_sold, 0)
            : null,
          paid: (overview.sources || []).reduce((n, s) => n + (s.revenue_minor || 0), 0),
        },
  }
}
