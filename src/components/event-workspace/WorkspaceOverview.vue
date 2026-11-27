<script setup>
import { computed, ref } from 'vue'
import {
  formatMoneyMinor as money,
  formatNumber as number,
  formatPercent as percent,
  formatTrend,
} from '@/utils/dashboardFormat'
import { useWorkspacePrivacy } from '@/composables/useWorkspacePrivacy'
import { DASHBOARD_PREVIEW } from '@/services/dashboardPreview'
import { usePreviewWorkspaceAttendees } from './previewAttendeesModel'
import {
  clampPercent,
  daysUntilEvent,
  leadingBuyerSources,
  overviewEventDate,
  salesChart,
} from './overviewModel'
const props = defineProps({ overview: { type: Object, required: true } })
const emit = defineEmits(['navigate', 'public', 'edit'])
const { amountsHidden: hidden, toggleAmounts } = useWorkspacePrivacy()
const range = ref('30d')
const privacyStatus = ref('')
const event = computed(() => props.overview.event || {})
// A guest page is not an event-wide aggregate. Preview data never supplies live metrics.
const registrations = computed(() =>
  DASHBOARD_PREVIEW ? usePreviewWorkspaceAttendees(event.value.id, event.value.ticket_mode) : null,
)
const registeredGuests = computed(() => registrations.value?.guests.value || [])
const arrivedGuests = computed(() =>
  registrations.value
    ? registeredGuests.value.filter((guest) => registrations.value.everArrived(guest.id)).length
    : (props.overview.metrics?.actual_attendance ?? null),
)
const metricGroups = computed(() => props.overview.metrics?.by_currency || [])
const registrationGuestTotal = computed(() =>
  metricGroups.value.length
    ? metricGroups.value.reduce((total, group) => total + group.admissions_covered, 0)
    : null,
)
// An order can contain different currencies in historical data; do not sum distinct-order counts.
const registrationOrders = computed(() =>
  metricGroups.value.length === 1 ? metricGroups.value[0].orders : null,
)
const sales = computed(() => props.overview.sales || {})
const revenue = computed(() => props.overview.revenue || {})
const traffic = computed(() => props.overview.traffic || {})
const tiers = computed(() => props.overview.ticket_types || [])
const sources = computed(() => leadingBuyerSources(props.overview.sources))
const strongest = computed(
  () =>
    [...tiers.value]
      .filter((t) => t.sold_units > 0)
      .sort((a, b) => b.sold_percent - a.sold_percent)[0],
)
const remaining = computed(
  () =>
    [...tiers.value]
      .filter((t) => t.available_units > 0)
      .sort((a, b) => b.available_units - a.available_units)[0],
)
const phase = computed(
  () =>
    ({ upcoming: 'Upcoming', live: 'Live now', ended: 'Event ended', draft: 'Draft' })[
      event.value.phase
    ] || 'Your event',
)
const daysToGo = computed(() => daysUntilEvent(event.value))
const eventDate = computed(() => overviewEventDate(event.value))
const amount = (value, compact = false) =>
  hidden.value
    ? '\u2022\u2022\u2022\u2022\u2022\u2022'
    : money(value, revenue.value.currency || 'NGN', { compact })
const chart = computed(() => salesChart(props.overview.sales_trend?.[range.value] || []))
const points = computed(() => chart.value.points)
const coordinates = computed(() => chart.value.coordinates)
const ceiling = computed(() => chart.value.maximum)
const line = computed(() => chart.value.line)
const area = computed(() => chart.value.area)
const progress = (value) => `${clampPercent(value)}%`
const trendPositive = computed(() => sales.value.week_growth_state !== 'down')
function togglePrivacy() {
  toggleAmounts()
  privacyStatus.value = hidden.value ? 'Monetary amounts hidden.' : 'Monetary amounts visible.'
}
function destination(view, query = {}) {
  const params = new URLSearchParams({ view, ...query })
  return `${import.meta.env.BASE_URL}dashboard/events/${encodeURIComponent(event.value.id)}?${params}`
}
function navigate(view, query = {}) {
  emit('navigate', Object.keys(query).length ? { view, ...query } : view)
}
function chartDate(value) {
  const date = new Date(`${value}T12:00:00Z`)
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
        date,
      )
    : value
}
</script>

<template>
  <section
    id="event-preview"
    class="event-ribbon event-hero rh-overview-section"
    :style="
      event.cover_image ? { '--event-cover': `url(${JSON.stringify(event.cover_image)})` } : {}
    "
    aria-labelledby="event-name"
  >
    <div class="event-hero-main">
      <div class="event-hero-top">
        <span class="status"><i class="dot"></i>{{ phase }}</span>
        <div class="event-title-line">
          <h1 id="event-name">{{ event.title }}</h1>
        </div>
        <div class="title-meta hero-meta">
          <span
            ><svg class="icon" aria-hidden="true"><use href="#ico-calendar" /></svg
            >{{ eventDate }}</span
          >
          <span
            ><svg class="icon" aria-hidden="true"><use href="#ico-pin" /></svg
            >{{ event.venue || 'Venue to be confirmed' }}</span
          >
        </div>
        <div class="heading-actions hero-actions">
          <a
            class="btn btn-dark"
            :href="destination('event-page')"
            @click.prevent="navigate('event-page')"
          >
            <svg class="icon" aria-hidden="true"><use href="#ico-external" /></svg>View event
          </a>
          <a
            class="btn btn-quiet"
            :href="destination('edit', { tab: 'details' })"
            @click.prevent="navigate('edit', { tab: 'details' })"
          >
            <svg class="icon" aria-hidden="true"><use href="#ico-edit" /></svg>Edit event
          </a>
        </div>
        <div
          v-if="daysToGo != null && daysToGo >= 0 && event.phase === 'upcoming'"
          class="hero-countdown"
        >
          <strong>{{ daysToGo }}</strong>
          <div>
            <span>{{ daysToGo === 1 ? 'day to go' : 'days to go' }}</span
            ><small>until the event</small>
          </div>
        </div>
        <div v-else class="hero-countdown">
          <strong>{{ phase }}</strong>
        </div>
      </div>
    </div>
  </section>
  <section
    v-if="event.ticket_mode === 'free'"
    id="rh-free-overview"
    class="rh-overview-section rh-free-overview"
  >
    <div class="section-title">
      <div>
        <h2 id="rh-free-overview-title">Your registrations</h2>
        <p>
          {{
            DASHBOARD_PREVIEW
              ? 'See how many guests have registered and who has arrived.'
              : 'Registration and arrival totals come from confirmed event records.'
          }}
        </p>
      </div>
    </div>
    <div class="rh-summary-grid rh-v19-summary">
      <article class="rh-summary-card">
        <span>Registrations</span
        ><strong>{{
          registrations
            ? registrations.orders.value.length
            : (registrationOrders ?? 'Not available')
        }}</strong>
      </article>
      <article class="rh-summary-card">
        <span>Guests registered</span
        ><strong>{{
          registrations ? registeredGuests.length : (registrationGuestTotal ?? 'Not available')
        }}</strong>
      </article>
      <article class="rh-summary-card">
        <span>Guests who have arrived</span><strong>{{ arrivedGuests ?? 'Not available' }}</strong>
      </article>
    </div>
    <a
      class="rh-button rh-button-outline"
      :href="destination('attendees')"
      @click.prevent="navigate('attendees')"
      >View registrations</a
    >
  </section>
  <section id="rh-overview-glance" class="rh-overview-section" aria-labelledby="glance-title">
    <div class="section-title glance-heading">
      <div>
        <h2 id="glance-title">Sales at a glance</h2>
        <p>Your ticket sales and the ways buyers are finding your event are shown here.</p>
      </div>
      <div class="glance-actions">
        <button
          class="privacy-toggle"
          type="button"
          :aria-pressed="hidden"
          @click="togglePrivacy"
          :aria-label="hidden ? 'Show monetary amounts' : 'Hide monetary amounts'"
          :title="
            hidden ? 'Show monetary amounts on this page' : 'Hide monetary amounts on this page'
          "
        >
          <svg class="icon" aria-hidden="true">
            <use :href="hidden ? '#ico-eye-off' : '#ico-eye'" /></svg
          ><span>{{ hidden ? 'Show amounts' : 'Hide amounts' }}</span>
        </button>
      </div>
    </div>
    <p class="rh-sr" role="status" aria-live="polite">{{ privacyStatus }}</p>
    <div class="metrics-surface">
      <article class="metric">
        <div class="metric-label">
          Your tickets sold<svg class="icon" aria-hidden="true"><use href="#ico-ticket" /></svg>
        </div>
        <div class="metric-value">{{ number(sales.units_sold) }}</div>
        <div class="metric-foot">
          <span :class="trendPositive ? 'positive' : 'negative'">{{
            formatTrend(sales.week_growth_state, sales.week_growth_percent, sales.this_week_units)
          }}</span>
        </div>
        <div class="mini-progress"><i :style="{ width: progress(sales.sold_percent) }" /></div>
      </article>
      <article class="metric revenue-metric">
        <div class="metric-label">
          Your ticket revenue<svg class="icon" aria-hidden="true"><use href="#ico-wallet" /></svg>
        </div>
        <div class="metric-value">{{ amount(revenue.total_minor, true) }}</div>
        <div class="metric-foot">
          <span class="positive">{{ amount(revenue.this_week_minor, true) }}</span> this week
        </div>
        <div class="revenue-explainer">Money from ticket sales</div>
      </article>
      <article class="metric">
        <div class="metric-label">
          Tickets sold this week<svg class="icon" aria-hidden="true">
            <use href="#ico-ticket" />
          </svg>
        </div>
        <div class="metric-value">{{ number(sales.this_week_units) }}</div>
        <div class="metric-foot">Your sales this week so far</div>
      </article>
      <article class="metric">
        <div class="metric-label">
          Your event page views<svg class="icon" aria-hidden="true"><use href="#ico-eye" /></svg>
        </div>
        <div class="metric-value">{{ number(traffic.page_views) }}</div>
        <div class="metric-foot">
          <span class="positive">{{ percent(traffic.conversion_percent) }}</span> visitor-to-buyer
          conversion
        </div>
      </article>
    </div>
  </section>
  <section id="sales" class="rh-overview-section" aria-labelledby="sales-title">
    <div class="section-title">
      <div>
        <h2 id="sales-title">Sales performance</h2>
        <p>Track how sales have changed over time and see which ticket types people are buying.</p>
      </div>
    </div>
    <div class="duo">
      <article class="panel panel-pad">
        <div class="panel-top">
          <div>
            <h3>Tickets bought over time</h3>
            <p class="panel-sub">Paid ticket units · sales trend</p>
          </div>
          <span class="filter-label">Last 30 days</span>
        </div>
        <div class="chart-wrap">
          <svg
            viewBox="0 0 600 260"
            role="img"
            :aria-label="`${points.length} days of paid ticket sales`"
          >
            <defs>
              <linearGradient id="workspace-sales-fade" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#ef277a" stop-opacity=".17" />
                <stop offset="100%" stop-color="#ef277a" stop-opacity=".005" />
              </linearGradient>
            </defs>
            <g v-for="i in 5" :key="i">
              <path :d="`M44 ${26 + (i - 1) * 50}H580`" stroke="#f0f0f1" />
              <text x="3" :y="30 + (i - 1) * 50" fill="#81858d" font-size="11">
                {{ ceiling - ((i - 1) * ceiling) / 4 }}
              </text>
            </g>
            <path :d="area" fill="url(#workspace-sales-fade)" />
            <path
              :d="line"
              fill="none"
              stroke="#e92876"
              stroke-width="3"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <circle
              v-if="coordinates.length"
              :cx="coordinates.at(-1).x"
              :cy="coordinates.at(-1).y"
              r="5"
              fill="white"
              stroke="#e92876"
              stroke-width="3"
            />
            <text v-if="points.length" x="44" y="253" fill="#81858d" font-size="11">
              {{ chartDate(points[0].date) }}
            </text>
            <text
              v-if="points.length"
              x="580"
              y="253"
              text-anchor="end"
              fill="#81858d"
              font-size="11"
            >
              {{ chartDate(points.at(-1).date) }}
            </text>
          </svg>
        </div>
        <p v-if="!points.length" class="rh-note">
          Your sales trend will appear after your first ticket sale.
        </p>
        <table class="rh-data-table rh-sr">
          <caption>
            Daily paid ticket sales
          </caption>
          <thead>
            <tr>
              <th>Date</th>
              <th>Tickets sold</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="point in points" :key="point.date">
              <td>{{ point.date }}</td>
              <td>{{ number(point.units_sold) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="chart-legend">
          <span class="legend-left"><i class="legend-mark" />Tickets sold</span
          ><span>Daily trend</span>
        </div>
        <div class="chart-footer">
          <b>{{ number(sales.this_week_units) }} tickets sold this week</b
          ><span>{{ amount(revenue.this_week_minor) }} in ticket sales</span>
        </div>
      </article>
      <article id="ticket-types" class="panel">
        <div class="tier-head">
          <h3>Sales by ticket type</h3>
          <p class="panel-sub">
            {{ number(sales.units_sold) }} sold from {{ number(sales.capacity_units) }} tickets
          </p>
        </div>
        <div v-for="(tier, i) in tiers" :key="tier.id" class="ticket-row">
          <div class="tier-label">
            <strong
              >{{ tier.name }}
              <span v-if="tier.sold_percent >= 80" class="nx-chip">Selling fast</span></strong
            ><b>{{ percent(tier.sold_percent) }}</b>
          </div>
          <div class="tier-meta">
            {{ number(tier.sold_units) }} sold · {{ tier.sold_percent >= 80 ? 'only ' : ''
            }}{{ number(tier.available_units) }} remaining
          </div>
          <div
            class="bar"
            :class="{ general: i === 1, vip: i === 2 }"
            role="progressbar"
            :aria-label="`${tier.name} sold`"
            :aria-valuenow="Math.min(100, Math.max(0, tier.sold_percent || 0))"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span :style="{ width: progress(tier.sold_percent) }" />
          </div>
        </div>
        <p v-if="!tiers.length" class="workspace-empty">
          Your ticket types will appear here when they’re available.
        </p>
        <div v-if="strongest" class="tier-footer">
          <strong>{{ strongest.name }} is closest to selling out.</strong>
          {{ number(strongest.available_units) }} seats left.<a
            class="rh-row-button"
            :href="destination('attendees')"
            @click.prevent="$emit('navigate', 'attendees')"
          >
            View ticket holders →
          </a>
        </div>
      </article>
    </div>
  </section>
  <section id="audience" class="rh-overview-section" aria-labelledby="audience-title">
    <div class="section-title">
      <div>
        <h2 id="audience-title">Reach &amp; audience</h2>
        <p>See where your buyers found the event and how many visitors went on to buy tickets.</p>
      </div>
    </div>
    <div class="audience-grid">
      <article id="channels" class="panel panel-pad">
        <div class="panel-top">
          <div>
            <h3>Where buyers find you</h3>
            <p class="panel-sub">
              Share of {{ number(overview.buyers?.unique_buyers) }} attributed buyers
            </p>
          </div>
        </div>
        <div class="channel-list">
          <div v-for="source in sources" :key="source.source_code" class="channel-row">
            <div>
              <div class="ch-name">{{ source.label }}</div>
              <div class="ch-sub">
                {{ number(source.buyers) }} buyers · {{ number(source.unique_visitors) }} visitors
              </div>
            </div>
            <b>{{ percent(source.buyer_share_percent) }}</b>
            <div class="ch-track">
              <span :style="{ width: progress(source.buyer_share_percent) }" />
            </div>
          </div>
          <p v-if="!sources.length" class="rh-note">
            Share a tracked event link to see where buyers find you.
          </p>
        </div>
      </article>
      <article class="panel panel-pad">
        <h3>From visit to purchase</h3>
        <p class="panel-sub">Unique visitors and attributed buyers</p>
        <div class="conversion">
          <strong>{{ percent(traffic.conversion_percent) }}</strong
          ><span>conversion rate</span>
        </div>
        <div class="funnel">
          <div class="funnel-step">
            <span>Unique visitors</span><b>{{ number(traffic.unique_visitors) }}</b>
          </div>
          <div class="funnel-step">
            <span>Buyers</span><b>{{ number(overview.buyers?.unique_buyers) }}</b>
          </div>
          <div class="funnel-step">
            <span>Total page views</span><b>{{ number(traffic.page_views) }}</b>
          </div>
        </div>
        <div class="audience-note">
          Visitors are counted once per event and reporting period; repeat page views don’t increase
          unique visitors.
        </div>
      </article>
    </div>
  </section>
  <section id="insights" class="section-slim rh-overview-section">
    <div class="section-title">
      <div>
        <h2>Good to know</h2>
        <p>These patterns show when people tend to buy and how much they spend.</p>
      </div>
    </div>
    <div class="mini-grid">
      <article class="mini-item">
        <div class="small-label">Average buyer spend</div>
        <strong>{{ amount(overview.buyers?.average_spend_minor) }}</strong>
        <p>Across attributed ticket buyers</p>
      </article>
      <article class="mini-item">
        <div class="small-label">Strongest sales day</div>
        <strong>{{ overview.best_sales_day?.overall?.label || 'No sales yet' }}</strong>
        <p>{{ number(overview.best_sales_day?.overall?.units_sold) }} tickets purchased</p>
      </article>
      <article class="mini-item">
        <div class="small-label">Popular buying hours</div>
        <strong>{{ overview.peak_buying_time?.label || 'No sales yet' }}</strong>
        <p>Peak purchase window</p>
      </article>
    </div>
    <div class="insights">
      <div class="section-title"><h2>What stands out</h2></div>
      <div class="insight-grid">
        <div v-if="strongest" class="insight">
          <span class="insight-index">01</span>
          <div>
            <strong>{{ strongest.name }} tickets are moving fastest.</strong>
            <p>
              {{ percent(strongest.sold_percent) }} of the {{ strongest.name }} allocation has sold.
              Only {{ number(strongest.available_units) }} remain.
            </p>
          </div>
        </div>
        <div v-if="remaining" class="insight">
          <span class="insight-index">02</span>
          <div>
            <strong>{{ remaining.name }} has room to grow.</strong>
            <p>
              {{ number(remaining.available_units) }} tickets are still available in your largest
              category.
            </p>
          </div>
        </div>
        <div v-if="sources.length" class="insight">
          <span class="insight-index">03</span>
          <div>
            <strong>{{ sources[0].label }} leads buyer referrals.</strong>
            <p>
              {{
                sources[0].buyer_share_percent === 50
                  ? 'Half'
                  : percent(sources[0].buyer_share_percent)
              }}
              of tracked buyers came through {{ sources[0].label }}.
            </p>
          </div>
        </div>
        <p v-if="!tiers.length && !sources.length" class="rh-note">
          As people find your event and buy tickets, useful patterns will appear here.
        </p>
      </div>
    </div>
  </section>
</template>
