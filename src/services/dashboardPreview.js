import referenceCover from '@/assets/event-workspace/reference-a091d7590289.jpg'
import { isStaticPreview } from './staticPreviewMode'
// Demo fixtures are available only in an explicitly selected development demo.
export const DASHBOARD_PREVIEW = isStaticPreview() || (import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true')
export const previewEvent = {
  id: 900001,
  title: 'Lagos after sunset',
  status: 'published',
  phase: 'upcoming',
  starts_at: '2026-12-12T18:00:00+01:00',
  timezone: 'Africa/Lagos',
  days_to_go: 33,
  venue: 'Eko Hotel & Suites, Victoria Island, Lagos',
  cover_image: referenceCover,
}
const tiers = [
  {
    id: 1,
    name: 'Early bird',
    effective_capacity_units: 150,
    sold_units: 110,
    available_units: 40,
    revenue_minor: 55000000,
  },
  {
    id: 2,
    name: 'General admission',
    effective_capacity_units: 500,
    sold_units: 260,
    available_units: 240,
    revenue_minor: 260000000,
  },
  {
    id: 3,
    name: 'VIP',
    effective_capacity_units: 50,
    sold_units: 42,
    available_units: 8,
    revenue_minor: 126000000,
  },
].map((tier) => ({
  ...tier,
  price_minor: Math.round(tier.revenue_minor / tier.sold_units),
  unit_type: 'ticket',
  visible: true,
  reserved_units: 0,
  sold_percent: (tier.sold_units / tier.effective_capacity_units) * 100,
}))
const sources = [
  {
    source_code: 'wa',
    label: 'WhatsApp',
    buyers: 120,
    unique_visitors: 800,
    revenue_minor: 220500000,
  },
  {
    source_code: 'ig',
    label: 'Instagram',
    buyers: 80,
    unique_visitors: 900,
    revenue_minor: 147000000,
  },
  {
    source_code: 'direct',
    label: 'Direct link',
    buyers: 40,
    unique_visitors: 600,
    revenue_minor: 73500000,
  },
].map((source) => ({ ...source, buyer_share_percent: (source.buyers / 240) * 100 }))
const series = Array.from({ length: 30 }, (_, i) => ({
  date: `2026-10-${String(i + 1).padStart(2, '0')}`,
  units_sold: 5 + ((i * 7) % 19),
}))
export const previewOverview = {
  event: previewEvent,
  setup: {
    payout_account_added: false,
    two_factor_enabled: false,
    event_shared: false,
    reminder_saved: false,
    checkin_ready: false,
  },
  notifications: [
    {
      id: 'discount-dates',
      icon: 'tag',
      title: 'End dates for discount codes',
      text: 'You can choose when a discount code stops working.',
      time: 'Product update',
    },
    {
      id: 'sales-400',
      icon: 'ticket',
      title: 'You passed 400 tickets sold',
      text: 'Lagos after sunset has 288 tickets left.',
      time: 'Sample sales update',
    },
    {
      id: 'page-views',
      icon: 'eye',
      title: 'Your event page got 4,821 views',
      text: 'Most tracked buyers came from WhatsApp and Instagram.',
      time: 'Sample traffic update',
    },
  ],
  sales: {
    units_sold: 412,
    capacity_units: 700,
    available_units: 288,
    reserved_units: 0,
    sold_percent: 58.9,
    this_week_units: 96,
    week_growth_state: 'up',
    week_growth_percent: 24.7,
    admission_entries_covered: 412,
  },
  revenue: { currency: 'NGN', total_minor: 441000000, this_week_minor: 102000000 },
  traffic: {
    page_views: 4821,
    unique_visitors: 2300,
    converted_visitors: 240,
    conversion_percent: 10.4,
  },
  buyers: { unique_buyers: 240, average_spend_minor: 1837500 },
  ticket_types: tiers,
  sources,
  sales_trend: { '7d': series.slice(-7), '30d': series, all: series },
  best_sales_day: {
    this_week: { label: 'Friday', units_sold: 28 },
    overall: { label: 'October 21', units_sold: 42 },
  },
  peak_buying_time: { label: '7 to 11 PM' },
}
export const previewShareLinks = sources.map((source, i) => ({
  ...source,
  id: i + 1,
  views: source.unique_visitors,
  conversion_percent: (source.buyers / source.unique_visitors) * 100,
}))
