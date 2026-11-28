<script setup>
import { computed, nextTick, ref, watch } from 'vue'
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
  weeklySales,
} from './overviewModel'
const props = defineProps({ overview: { type: Object, required: true } })
const emit = defineEmits(['navigate', 'public', 'edit'])
const { amountsHidden: hidden, toggleAmounts } = useWorkspacePrivacy()
const chartScroll = ref(null)
const selectedWeek = ref('')
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
const weeks = computed(() => weeklySales(props.overview.sales_trend?.all || []))
const chartWidth = computed(() => Math.max(600, weeks.value.length * 96 + 64))
const chart = computed(() => salesChart(weeks.value, chartWidth.value))
const selectedPoint = computed(() =>
  points.value.find((point) => point.date === selectedWeek.value),
)
watch(
  weeks,
  async (value, previous) => {
    if (!value.some((point) => point.date === selectedWeek.value))
      selectedWeek.value = value.at(-1)?.date || ''
    if (value.at(-1)?.date !== previous?.at(-1)?.date) {
      await nextTick()
      if (chartScroll.value) chartScroll.value.scrollLeft = chartScroll.value.scrollWidth
    }
  },
  { immediate: true },
)
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
    ? new Intl.DateTimeFormat('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date)
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
              : 'Totals include confirmed registrations and arrivals.'
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
        <h2 id="glance-title">Ticket sales</h2>
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
          Tickets sold<svg class="icon" aria-hidden="true"><use href="#ico-ticket" /></svg>
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
          Ticket revenue<svg class="icon" aria-hidden="true"><use href="#ico-wallet" /></svg>
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
        <div class="metric-foot">Sold so far this week</div>
      </article>
      <article class="metric">
        <div class="metric-label">
          Event page views<svg class="icon" aria-hidden="true"><use href="#ico-eye" /></svg>
        </div>
        <div class="metric-value">{{ number(traffic.page_views) }}</div>
        <div class="metric-foot">
          <span class="positive">{{ percent(traffic.conversion_percent) }}</span> of visitors bought
          tickets
        </div>
      </article>
    </div>
  </section>
  <section id="sales" class="rh-overview-section" aria-label="Ticket sales charts">
    <div class="duo">
      <article class="panel panel-pad">
        <div class="panel-top">
          <div>
            <h3 id="weekly-sales-title">Sales by week</h3>
            <p class="panel-sub">Paid tickets sold each week, Monday to Sunday.</p>
          </div>
          <span class="filter-label"
            >{{ weeks.length }} {{ weeks.length === 1 ? 'week' : 'weeks' }}</span
          >
        </div>
        <div
          ref="chartScroll"
          class="chart-wrap weekly-sales-scroll"
          tabindex="0"
          role="region"
          aria-labelledby="weekly-sales-title"
        >
          <svg
            :viewBox="`0 0 ${chartWidth} 280`"
            :style="{ width: `${chartWidth}px`, minWidth: '100%', height: '280px' }"
            role="group"
            :aria-label="`${points.length} weeks of ticket sales. Select a point for its total.`"
          >
            <defs>
              <linearGradient id="workspace-sales-fade" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#ef277a" stop-opacity=".17" />
                <stop offset="100%" stop-color="#ef277a" stop-opacity=".005" />
              </linearGradient>
            </defs>
            <g v-for="i in 5" :key="i">
              <path :d="`M44 ${26 + (i - 1) * 50}H${chartWidth - 20}`" stroke="#f0f0f1" />
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
            <g v-for="(point, index) in points" :key="point.date">
              <text
                :x="coordinates[index].x"
                :y="coordinates[index].y - 14"
                text-anchor="middle"
                fill="#343b46"
                font-size="12"
              >
                {{ number(point.units_sold) }}
              </text>
              <g
                tabindex="0"
                role="button"
                :aria-label="`Week ${index + 1}, ${chartDate(point.date)} to ${chartDate(point.end_date)}: ${number(point.units_sold)} tickets sold`"
                :aria-pressed="selectedWeek === point.date"
                @click="selectedWeek = point.date"
                @focus="selectedWeek = point.date"
                @keydown.enter.prevent="selectedWeek = point.date"
                @keydown.space.prevent="selectedWeek = point.date"
              >
                <title>
                  {{ chartDate(point.date) }} to {{ chartDate(point.end_date) }}:
                  {{ number(point.units_sold) }} tickets sold
                </title>
                <circle
                  :cx="coordinates[index].x"
                  :cy="coordinates[index].y"
                  r="22"
                  fill="transparent"
                />
                <circle
                  :cx="coordinates[index].x"
                  :cy="coordinates[index].y"
                  r="5"
                  :fill="selectedWeek === point.date ? '#e92876' : 'white'"
                  stroke="#e92876"
                  stroke-width="3"
                />
              </g>
              <text
                :x="coordinates[index].x"
                y="252"
                text-anchor="middle"
                fill="#59616d"
                font-size="11"
              >
                Week {{ index + 1 }}
              </text>
              <text
                :x="coordinates[index].x"
                y="270"
                text-anchor="middle"
                fill="#81858d"
                font-size="10"
              >
                {{ chartDate(point.date) }}
              </text>
            </g>
          </svg>
        </div>
        <p v-if="!points.length" class="rh-note">
          Your weekly sales will appear here after your first ticket sale.
        </p>
        <table class="rh-data-table rh-sr">
          <caption>
            Weekly ticket sales
          </caption>
          <thead>
            <tr>
              <th>Week</th>
              <th>Tickets sold</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="point in points" :key="point.date">
              <td>{{ chartDate(point.date) }} to {{ chartDate(point.end_date) }}</td>
              <td>{{ number(point.units_sold) }}</td>
            </tr>
          </tbody>
        </table>
        <div class="chart-legend">
          <span class="legend-left"><i class="legend-mark" />Tickets sold</span
          ><span>Scroll to see more weeks</span>
        </div>
        <p v-if="selectedPoint" class="weekly-sales-detail" role="status" aria-live="polite">
          {{ chartDate(selectedPoint.date) }} to {{ chartDate(selectedPoint.end_date) }}:
          <strong
            >{{ number(selectedPoint.units_sold) }}
            {{ selectedPoint.units_sold === 1 ? 'ticket sold' : 'tickets sold' }}</strong
          >
        </p>
        <p v-if="overview.sales_trend?.truncated" class="rh-note">
          Showing the most recent three years. The first week may be incomplete.
        </p>
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
  <section id="audience" class="rh-overview-section" aria-label="Buyer sources">
    <div class="audience-grid">
      <article id="channels" class="panel panel-pad">
        <div class="panel-top">
          <div>
            <h3>Where buyers find you</h3>
            <p class="panel-sub">
              Share of {{ number(overview.buyers?.unique_buyers) }} buyers with a known source
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
        <h3>Visitors who buy tickets</h3>
        <p class="panel-sub">Unique visitors and buyers with a known source</p>
        <div class="conversion">
          <strong>{{ percent(traffic.conversion_percent) }}</strong
          ><span>of visitors bought tickets</span>
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
          Each visitor is counted once per event in this period, even if they visit again.
        </div>
      </article>
    </div>
  </section>
  <section id="insights" class="section-slim rh-overview-section">
    <div class="section-title">
      <div>
        <h2>Buying patterns</h2>
        <p>See when people buy and how much they spend.</p>
      </div>
    </div>
    <div class="mini-grid">
      <article class="mini-item">
        <div class="small-label">Average buyer spend</div>
        <strong>{{ amount(overview.buyers?.average_spend_minor) }}</strong>
        <p>For buyers with a known source</p>
      </article>
      <article class="mini-item">
        <div class="small-label">Strongest sales day</div>
        <strong>{{ overview.best_sales_day?.overall?.label || 'No sales yet' }}</strong>
        <p>{{ number(overview.best_sales_day?.overall?.units_sold) }} tickets purchased</p>
      </article>
      <article class="mini-item">
        <div class="small-label">Popular buying hours</div>
        <strong>{{ overview.peak_buying_time?.label || 'No sales yet' }}</strong>
        <p>Busiest buying hours</p>
      </article>
    </div>
    <div class="insights">
      <div class="section-title"><h2>Sales highlights</h2></div>
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
          Sales patterns will appear after people buy tickets.
        </p>
      </div>
    </div>
  </section>
</template>
