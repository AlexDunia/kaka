<script setup>
import { computed, ref } from 'vue'
import {
  formatMoneyMinor,
  formatNumber,
  formatPercent,
  unitNoun,
} from '@/utils/dashboardFormat'

const props = defineProps({
  overview: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['select-view'])

const selectedRange = ref('30d')

const ranges = [
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: 'all', label: 'All' },
]

const ticketTypes = computed(
  () => props.overview.ticket_types || [],
)

const sources = computed(
  () =>
    (props.overview.sources || [])
      .filter(
        (source) =>
          source.source_code !== 'unattributed'
          && Number(source.buyers || 0) > 0,
      )
      .slice(0, 4),
)

const series = computed(
  () =>
    props.overview.sales_trend?.[selectedRange.value]
    || [],
)

const chartGeometry = computed(() => {
  const rows = series.value
  const width = 540
  const left = 15
  const baseline = 110
  const usableHeight = 92

  if (!rows.length) {
    return {
      line: '',
      area: '',
      last: null,
    }
  }

  const max = Math.max(
    1,
    ...rows.map((row) => Number(row.units_sold || 0)),
  )

  const points = rows.map((row, index) => {
    const x =
      rows.length === 1
        ? left + width / 2
        : left + (index / (rows.length - 1)) * width

    const y =
      baseline
      - (Number(row.units_sold || 0) / max) * usableHeight

    return {
      x,
      y,
      row,
    }
  })

  const line = points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`,
    )
    .join(' ')

  const first = points[0]
  const last = points[points.length - 1]
  const area =
    `${line} L${last.x.toFixed(2)},${baseline} `
    + `L${first.x.toFixed(2)},${baseline} Z`

  return {
    line,
    area,
    last,
  }
})

const strongestTier = computed(() =>
  [...ticketTypes.value]
    .filter((tier) => Number(tier.effective_capacity_units || 0) > 0)
    .sort(
      (a, b) =>
        Number(b.sold_percent || 0)
        - Number(a.sold_percent || 0),
    )[0]
    || null,
)

const weakestTier = computed(() =>
  [...ticketTypes.value]
    .filter(
      (tier) =>
        tier.visible
        && Number(tier.effective_capacity_units || 0) > 0,
    )
    .sort(
      (a, b) =>
        Number(a.sold_percent || 0)
        - Number(b.sold_percent || 0),
    )[0]
    || null,
)

const topSource = computed(() => sources.value[0] || null)

const ticketLabel = (tier, quantity) =>
  unitNoun(tier, quantity)

const tierCountCopy = (tier) => {
  const sold = Number(tier.sold_units || 0)
  const left = Number(tier.available_units || 0)

  return `${formatNumber(sold)} ${ticketLabel(tier, sold)} sold · `
    + `${formatNumber(left)} ${ticketLabel(tier, left)} left`
}

const bestDayCopy = (day) => {
  if (!day) return 'No sales yet'

  return `${day.label} · ${formatNumber(day.units_sold)} sold`
}
</script>

<template>
  <div
    class="manage-view active"
    id="mv-overview"
  >
    <div class="sections-wrap overview-wrap">
      <section class="generated-ticket-performance-section">
        <article class="card generated-ticket-performance-card">
          <div class="overview-card-head">
            <div>
              <h3>How your tickets are doing</h3>
              <p>
                Every number here now comes from paid orders and live inventory.
              </p>
            </div>

            <button
              class="link-primary-action"
              type="button"
              @click="emit('select-view', 'share')"
            >
              Open sharing links
            </button>
          </div>

          <div
            v-if="ticketTypes.length"
            class="traffic-rows overview-traffic generated-ticket-rows"
          >
            <div
              v-for="tier in ticketTypes"
              :key="tier.id"
              class="traffic-row"
            >
              <div
                class="traffic-icon ticket-tier-icon"
                :class="{
                  hot: tier.sold_percent >= 80,
                  good: tier.sold_percent >= 50 && tier.sold_percent < 80,
                  neutral: tier.sold_percent < 50,
                }"
              >
                <svg viewBox="0 0 24 24">
                  <path
                    d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z"
                  />
                  <path d="M12 5v14" />
                </svg>
              </div>

              <div class="traffic-info">
                <div class="traffic-name">
                  {{ tier.name }}
                </div>

                <div class="traffic-count">
                  {{ tierCountCopy(tier) }}
                </div>

                <div class="traffic-bar-wrap">
                  <div class="traffic-bar-track">
                    <div
                      class="traffic-bar-fill"
                      :class="{
                        'fill-red': tier.sold_percent >= 80,
                        'fill-teal': tier.sold_percent >= 50 && tier.sold_percent < 80,
                        'fill-blue': tier.sold_percent < 50,
                      }"
                      :style="{
                        width: `${Math.min(100, Math.max(0, Number(tier.sold_percent || 0)))}%`,
                      }"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="traffic-pct">
                {{ formatPercent(tier.sold_percent) }}
              </div>
            </div>
          </div>

          <div
            v-else
            class="overview-note"
          >
            This event does not have paid ticket tiers yet.
          </div>
        </article>
      </section>

      <section class="overview-command-grid overview-command-grid--calm">
        <article class="event-health-panel health-readout-panel">
          <div class="health-panel-head">
            <div>
              <div class="section-title compact-section-title">
                Event health
              </div>
              <h3>
                {{
                  overview.sales.units_sold
                    ? 'Your live sales picture'
                    : 'Your event is ready for its first sale'
                }}
              </h3>
            </div>
          </div>

          <div class="health-readout-main">
            <div class="health-readout-status">
              <span>Overall</span>
              <strong>
                {{
                  formatPercent(overview.sales.sold_percent)
                }}
                of current ticket capacity is sold
              </strong>
              <p>
                {{
                  formatNumber(overview.sales.available_units)
                }}
                ticket units are still available right now.
              </p>
            </div>

            <div class="health-readout-list">
              <div
                v-if="strongestTier"
                class="health-readout-item good"
              >
                <span></span>
                <div>
                  <strong>
                    {{ strongestTier.name }} is your strongest ticket.
                  </strong>
                  <p>
                    {{
                      formatPercent(strongestTier.sold_percent)
                    }}
                    sold, with
                    {{
                      formatNumber(strongestTier.available_units)
                    }}
                    left.
                  </p>
                </div>
              </div>

              <div
                v-if="topSource"
                class="health-readout-item good"
              >
                <span></span>
                <div>
                  <strong>
                    {{ topSource.label }} is bringing the most matched buyers.
                  </strong>
                  <p>
                    {{
                      formatNumber(topSource.buyers)
                    }}
                    buyers are currently attributed there.
                  </p>
                </div>
              </div>

              <div
                v-if="weakestTier && weakestTier.id !== strongestTier?.id"
                class="health-readout-item warn"
              >
                <span></span>
                <div>
                  <strong>
                    {{ weakestTier.name }} has the most room to grow.
                  </strong>
                  <p>
                    {{
                      formatNumber(weakestTier.available_units)
                    }}
                    {{ ticketLabel(weakestTier, weakestTier.available_units) }}
                    are still open.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article class="next-move-panel next-move-panel--calm">
          <div class="next-move-head">
            <div>
              <div class="section-title compact-section-title">
                What the numbers say
              </div>
              <h3>Useful things to know now</h3>
            </div>
            <span>Live data</span>
          </div>

          <div class="next-move-list">
            <button
              class="next-move-item"
              type="button"
              @click="emit('select-view', 'share')"
            >
              <span class="next-move-num">01</span>
              <span class="next-move-copy">
                <strong>
                  {{
                    topSource
                      ? `Keep an eye on ${topSource.label}`
                      : 'Start using tracked sharing links'
                  }}
                </strong>
                <small>
                  {{
                    topSource
                      ? `${formatPercent(topSource.buyer_share_percent)} of buyers are currently attributed there.`
                      : 'Once people use your links, buyer channels will appear here automatically.'
                  }}
                </small>
              </span>
              <span class="next-move-destination">Promote</span>
            </button>

            <button
              v-if="weakestTier"
              class="next-move-item"
              type="button"
              @click="emit('select-view', 'promo')"
            >
              <span class="next-move-num">02</span>
              <span class="next-move-copy">
                <strong>
                  Watch {{ weakestTier.name }}
                </strong>
                <small>
                  {{
                    formatNumber(weakestTier.available_units)
                  }}
                  remain available.
                </small>
              </span>
              <span class="next-move-destination">Discount</span>
            </button>

            <button
              class="next-move-item"
              type="button"
              @click="emit('select-view', 'attendees')"
            >
              <span class="next-move-num">03</span>
              <span class="next-move-copy">
                <strong>
                  {{
                    formatNumber(overview.sales.admission_entries_covered)
                  }}
                  admissions are covered by sold tickets
                </strong>
                <small>
                  Table guests are counted here for door capacity, but a table still counts as one sold unit.
                </small>
              </span>
              <span class="next-move-destination">Attendees</span>
            </button>
          </div>
        </article>
      </section>

      <section>
        <div class="section-title">
          Sales trend
        </div>

        <div class="card">
          <div class="chart-wrap">
            <div class="chart-head">
              <div>
                <div class="chart-head-title">
                  Tickets bought per day
                </div>
                <div class="chart-head-sub">
                  Paid ticket units, not guest seats inside a table
                </div>
              </div>

              <div class="chart-pills">
                <button
                  v-for="range in ranges"
                  :key="range.key"
                  type="button"
                  class="cpill"
                  :class="{ on: selectedRange === range.key }"
                  @click="selectedRange = range.key"
                >
                  {{ range.label }}
                </button>
              </div>
            </div>

            <svg
              class="chart-svg"
              viewBox="0 0 580 130"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <line
                x1="0"
                y1="110"
                x2="580"
                y2="110"
                stroke="rgba(255,255,255,.08)"
                stroke-width="1"
              />
              <line
                x1="0"
                y1="80"
                x2="580"
                y2="80"
                stroke="rgba(255,255,255,.08)"
                stroke-width="1"
              />
              <line
                x1="0"
                y1="50"
                x2="580"
                y2="50"
                stroke="rgba(255,255,255,.08)"
                stroke-width="1"
              />

              <defs>
                <linearGradient
                  id="overviewSalesGradientLive"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stop-color="#29B89A"
                    stop-opacity=".22"
                  />
                  <stop
                    offset="100%"
                    stop-color="#29B89A"
                    stop-opacity="0"
                  />
                </linearGradient>
              </defs>

              <path
                v-if="chartGeometry.area"
                :d="chartGeometry.area"
                fill="url(#overviewSalesGradientLive)"
              />

              <path
                v-if="chartGeometry.line"
                :d="chartGeometry.line"
                stroke="#29B89A"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />

              <circle
                v-if="chartGeometry.last"
                :cx="chartGeometry.last.x"
                :cy="chartGeometry.last.y"
                r="4"
                fill="#29B89A"
              />
            </svg>

            <p class="chart-summary-copy">
              {{
                formatNumber(overview.sales.this_week_units)
              }}
              sold this week for
              {{
                formatMoneyMinor(
                  overview.revenue.this_week_minor,
                  overview.revenue.currency,
                )
              }}.
            </p>
          </div>
        </div>
      </section>

      <section class="mini-metric-grid">
        <article class="mini-metric-card">
          <div class="stat-cell-label">
            Average spend per buyer
          </div>
          <div class="mini-metric-value">
            {{
              formatMoneyMinor(
                overview.buyers.average_spend_minor,
                overview.revenue.currency,
              )
            }}
          </div>
        </article>

        <article class="mini-metric-card">
          <div class="stat-cell-label">
            Best sales day this week
          </div>
          <div class="mini-metric-value">
            {{
              bestDayCopy(
                overview.best_sales_day.this_week,
              )
            }}
          </div>
        </article>

        <article class="mini-metric-card">
          <div class="stat-cell-label">
            Best sales day overall
          </div>
          <div class="mini-metric-value">
            {{
              bestDayCopy(
                overview.best_sales_day.overall,
              )
            }}
          </div>
        </article>

        <article class="mini-metric-card">
          <div class="stat-cell-label">
            Peak buying time
          </div>
          <div class="mini-metric-value">
            {{
              overview.peak_buying_time?.label
              || 'No sales yet'
            }}
          </div>
        </article>
      </section>

      <section class="overview-content-grid">
        <article class="card">
          <div class="overview-card-head">
            <h3>Top buyer channels</h3>
            <p>
              A buyer is assigned to the source on their most recent paid purchase for this event.
            </p>
          </div>

          <div
            v-if="sources.length"
            class="traffic-rows overview-traffic"
          >
            <div
              v-for="source in sources"
              :key="source.source_code"
              class="traffic-row"
            >
              <div class="traffic-info">
                <div class="traffic-name">
                  {{ source.label }}
                </div>

                <div class="traffic-count">
                  {{ formatNumber(source.buyers) }} buyers ·
                  {{ formatNumber(source.unique_visitors) }} visitors
                </div>

                <div class="traffic-bar-wrap">
                  <div class="traffic-bar-track">
                    <div
                      class="traffic-bar-fill fill-teal"
                      :style="{
                        width: `${Math.min(100, Math.max(0, Number(source.buyer_share_percent || 0)))}%`,
                      }"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="traffic-pct">
                {{ formatPercent(source.buyer_share_percent) }}
              </div>
            </div>
          </div>

          <div
            v-else
            class="overview-note"
          >
            No attributed buyers yet. Use your tracked event links and the first source will appear automatically.
          </div>
        </article>

        <article class="card">
          <div class="overview-card-head">
            <h3>Traffic quality</h3>
            <p>
              Page views are deduplicated per visitor and event each hour so refreshes do not inflate the number.
            </p>
          </div>

          <div
            style="
              padding:var(--s5) var(--s6);
              display:grid;
              gap:var(--s4);
            "
          >
            <div>
              <div class="stat-cell-label">
                Unique visitors
              </div>
              <div class="mini-metric-value">
                {{ formatNumber(overview.traffic.unique_visitors) }}
              </div>
            </div>

            <div>
              <div class="stat-cell-label">
                Visitors who became buyers
              </div>
              <div class="mini-metric-value">
                {{ formatNumber(overview.traffic.converted_visitors) }}
              </div>
            </div>

            <div>
              <div class="stat-cell-label">
                Visitor-to-buyer conversion
              </div>
              <div class="mini-metric-value">
                {{ formatPercent(overview.traffic.conversion_percent) }}
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>
