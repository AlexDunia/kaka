<script setup>
import { computed } from 'vue'
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

const sales = computed(() => props.overview.sales || {})
const revenue = computed(() => props.overview.revenue || {})
const traffic = computed(() => props.overview.traffic || {})

const salesProgressWidth = computed(() =>
  Math.min(
    100,
    Math.max(
      0,
      Number(sales.value.sold_percent || 0),
    ),
  ),
)
</script>

<template>
  <div
    class="stat-strip"
    aria-label="Event performance metrics"
  >
    <article class="stat-cell stat-cell--tickets">
      <div class="stat-cell-main">
        <div>
          <div class="stat-cell-label">
            Tickets sold
          </div>

          <div class="stat-cell-value">
            {{ formatNumber(sales.units_sold) }}
          </div>

          <div class="stat-cell-sub up">
            <svg viewBox="0 0 24 24">
              <polyline points="18 15 12 9 6 15" />
            </svg>

            {{
              formatTrend(
                sales.week_growth_state,
                sales.week_growth_percent,
                sales.this_week_units,
              )
            }}
          </div>
        </div>

        <div
          class="stat-icon-badge stat-icon-badge--pink"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24">
            <path d="M4 8.5V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2.5a2.5 2.5 0 0 0 0 5V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.5a2.5 2.5 0 0 0 0-5Z" />
            <path d="M9 7.5v9" />
          </svg>
        </div>
      </div>

      <div class="stat-support stat-support--progress">
        <div class="stat-prog-copy">
          <span>
            {{ formatNumber(sales.units_sold) }}
            of
            {{ formatNumber(sales.capacity_units) }}
          </span>

          <span>
            {{ formatPercent(sales.sold_percent) }}
            sold
          </span>
        </div>

        <div class="stat-prog-track">
          <div
            class="stat-prog-fill fill-pink"
            :style="{ width: `${salesProgressWidth}%` }"
          ></div>
        </div>
      </div>
    </article>

    <article class="stat-cell stat-cell--revenue">
      <div class="stat-cell-main">
        <div>
          <div class="stat-cell-label">
            Revenue
          </div>

          <div class="stat-cell-value">
            {{
              formatMoneyMinor(
                revenue.total_minor,
                revenue.currency,
                { compact: true },
              )
            }}
          </div>

          <div class="stat-cell-sub up">
            <svg viewBox="0 0 24 24">
              <polyline points="18 15 12 9 6 15" />
            </svg>

            +
            {{
              formatMoneyMinor(
                revenue.this_week_minor,
                revenue.currency,
                { compact: true },
              )
            }}
            this week
          </div>
        </div>

        <div
          class="stat-icon-badge stat-icon-badge--green"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24">
            <path d="M12 3v18" />
            <path d="M17 7H9.5a3 3 0 0 0 0 6H14a3 3 0 0 1 0 6H6" />
          </svg>
        </div>
      </div>
    </article>

    <article class="stat-cell stat-cell--spots">
      <div class="stat-cell-main">
        <div>
          <div class="stat-cell-label">
            Spots left
          </div>

          <div class="stat-cell-value">
            {{ formatNumber(sales.available_units) }}
          </div>

          <div class="stat-cell-sub neutral">
            of {{ formatNumber(sales.capacity_units) }} total
          </div>
        </div>

        <div
          class="stat-icon-badge stat-icon-badge--muted"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
            <circle cx="10" cy="7" r="4" />
            <path d="M21 21v-2.2a3.2 3.2 0 0 0-2.4-3.1" />
            <path d="M17 3.3a3.8 3.8 0 0 1 0 7.4" />
          </svg>
        </div>
      </div>

      <div
        v-if="sales.reserved_units"
        class="stat-cell-sub neutral"
      >
        {{ formatNumber(sales.reserved_units) }}
        temporarily reserved in checkout
      </div>
    </article>

    <article class="stat-cell stat-cell--views">
      <div class="stat-cell-main">
        <div>
          <div class="stat-cell-label">
            Page views
          </div>

          <div class="stat-cell-value">
            {{ formatNumber(traffic.page_views) }}
          </div>

          <div class="stat-cell-sub neutral">
            {{ formatPercent(traffic.conversion_percent) }}
            bought a ticket
          </div>
        </div>

        <div
          class="stat-icon-badge stat-icon-badge--muted"
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24">
            <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      </div>
    </article>
  </div>
</template>
