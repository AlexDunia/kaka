<script setup>
import { computed, ref } from 'vue'
import {
  formatMoneyMinor,
  formatNumber,
  formatPercent,
  formatTrend,
} from '@/utils/dashboardFormat'

const props = defineProps({
  overview: {
    type: Object,
    required: true,
  },
})

const selectedRange = ref('30d')

const series = computed(
  () =>
    props.overview.sales_trend?.[selectedRange.value]
    || [],
)

const chartGeometry = computed(() => {
  const rows = series.value
  if (!rows.length) return { line: '', area: '' }

  const max = Math.max(
    1,
    ...rows.map((row) => Number(row.units_sold || 0)),
  )

  const points = rows.map((row, index) => {
    const x =
      rows.length === 1
        ? 285
        : 15 + (index / (rows.length - 1)) * 540
    const y =
      110 - (Number(row.units_sold || 0) / max) * 92

    return { x, y }
  })

  const line = points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`,
    )
    .join(' ')

  const first = points[0]
  const last = points[points.length - 1]

  return {
    line,
    area:
      `${line} L${last.x.toFixed(2)},110 `
      + `L${first.x.toFixed(2)},110 Z`,
  }
})
</script>

<template>
  <div
    class="manage-view active"
    id="mv-insights"
  >
    <div class="mv-wrap">
      <div class="mv-header">
        <div
          class="mv-eyebrow"
          style="color:var(--blue)"
        >
          Insights
        </div>

        <div class="mv-h1">
          See your event
          <em style="color:var(--blue)">grow.</em>
        </div>

        <div class="mv-p">
          Fresh numbers from paid orders, inventory, and tracked event visits.
        </div>
      </div>

      <div class="stat-grid-4">
        <div class="scard">
          <div class="scard-label">Tickets sold</div>
          <div class="scard-val">
            {{ formatNumber(overview.sales.units_sold) }}
          </div>
          <div class="scard-sub up">
            {{
              formatTrend(
                overview.sales.week_growth_state,
                overview.sales.week_growth_percent,
                overview.sales.this_week_units,
              )
            }}
          </div>
        </div>

        <div class="scard">
          <div class="scard-label">Revenue</div>
          <div
            class="scard-val"
            style="font-size:1.45rem"
          >
            {{
              formatMoneyMinor(
                overview.revenue.total_minor,
                overview.revenue.currency,
                { compact: true },
              )
            }}
          </div>
          <div class="scard-sub up">
            {{
              formatMoneyMinor(
                overview.revenue.this_week_minor,
                overview.revenue.currency,
                { compact: true },
              )
            }}
            this week
          </div>
        </div>

        <div class="scard">
          <div class="scard-label">Spots left</div>
          <div class="scard-val">
            {{ formatNumber(overview.sales.available_units) }}
          </div>
          <div class="scard-sub neutral">
            out of
            {{ formatNumber(overview.sales.capacity_units) }}
          </div>
        </div>

        <div class="scard">
          <div class="scard-label">Page views</div>
          <div class="scard-val">
            {{ formatNumber(overview.traffic.page_views) }}
          </div>
          <div class="scard-sub neutral">
            {{
              formatPercent(
                overview.traffic.conversion_percent,
              )
            }}
            convert
          </div>
        </div>
      </div>

      <div class="card">
        <div class="chart-wrap">
          <div class="chart-head">
            <div>
              <div class="chart-head-title">
                Tickets bought per day
              </div>
              <div class="chart-head-sub">
                Paid ticket units
              </div>
            </div>

            <div class="chart-pills">
              <button
                v-for="range in ['7d', '30d', 'all']"
                :key="range"
                class="cpill"
                :class="{ on: selectedRange === range }"
                type="button"
                @click="selectedRange = range"
              >
                {{ range === 'all' ? 'All' : range }}
              </button>
            </div>
          </div>

          <svg
            class="chart-svg"
            viewBox="0 0 580 130"
            fill="none"
          >
            <line
              x1="0"
              y1="110"
              x2="580"
              y2="110"
              stroke="rgba(255,255,255,.05)"
            />
            <line
              x1="0"
              y1="80"
              x2="580"
              y2="80"
              stroke="rgba(255,255,255,.05)"
            />
            <line
              x1="0"
              y1="50"
              x2="580"
              y2="50"
              stroke="rgba(255,255,255,.05)"
            />

            <defs>
              <linearGradient
                id="liveInsightsGradient"
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
              fill="url(#liveInsightsGradient)"
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
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>
