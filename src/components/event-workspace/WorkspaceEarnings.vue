<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useWorkspacePrivacy } from '@/composables/useWorkspacePrivacy'
import {
  formatMoneyMinor,
  formatNumber as number,
  formatPercent as percent,
} from '@/utils/dashboardFormat'
import { DASHBOARD_PREVIEW } from '@/services/dashboardPreview'
import { getEventShareLinks } from '@/services/dashboardShareService'
import { useWorkspaceAttendees } from './attendeesModel'
import { buildEarnings, defaultEarningsCodes, tierKey } from './earningsModel'
import WorkspaceEarningsDetails from './WorkspaceEarningsDetails.vue'
import WorkspaceEarningsPayouts from './WorkspaceEarningsPayouts.vue'
const props = defineProps({ overview: { type: Object, required: true }, eventId: [String, Number] })
const route = useRoute()
const emit = defineEmits(['navigate'])
const tab = ref('sales')
const eventKey = computed(() => props.eventId || props.overview.event?.id || 'earnings')
const attendees = computed(() =>
  useWorkspaceAttendees(eventKey.value, props.overview.event?.ticket_mode),
)
const free = computed(() => attendees.value.mode.value === 'free')
const codes = ref([]),
  links = ref([]),
  linksError = ref('')
function loadCodes() {
  try {
    const stored = DASHBOARD_PREVIEW
      ? JSON.parse(localStorage.getItem(`rushhour:event-workspace:${eventKey.value}:codes`))
      : null
    codes.value = Array.isArray(stored) ? stored : DASHBOARD_PREVIEW ? defaultEarningsCodes : []
  } catch {
    codes.value = DASHBOARD_PREVIEW ? defaultEarningsCodes : []
  }
}
loadCodes()
async function loadLinks() {
  linksError.value = ''
  try {
    links.value = await getEventShareLinks(eventKey.value)
  } catch {
    linksError.value = 'We couldn’t load your sharing links. Try again.'
  }
}
onMounted(loadLinks)
watch(eventKey, () => {
  loadCodes()
  links.value = []
  loadLinks()
})
const model = computed(() =>
  buildEarnings({
    overview: props.overview,
    preview: DASHBOARD_PREVIEW,
    codes: codes.value,
    links: links.value,
    guests: attendees.value.guests.value,
    orders: attendees.value.orders.value,
  }),
)
const screen = computed(() =>
  ['ticket', 'code', 'source', 'person', 'buyers'].includes(route.query.screen)
    ? route.query.screen
    : '',
)
function navigate(values = {}) {
  emit('navigate', { view: 'payout', ...values })
}
const destination = (values) =>
  `${route.path}?${new URLSearchParams({ view: 'payout', ...values })}`
function openTier(tier) {
  navigate({ screen: 'ticket', tier: tierKey(tier) })
}
const { amountsHidden: hidden, toggleAmounts } = useWorkspacePrivacy()
const money = (value) =>
  value == null
    ? '—'
    : hidden.value
      ? '••••••'
      : formatMoneyMinor(value, props.overview.revenue?.currency || 'NGN')
const sales = computed(() => props.overview.sales || {})
const revenue = computed(() => props.overview.revenue || {})
const tiers = computed(() => props.overview.ticket_types || [])
const progress = (value) => `${Math.min(100, Math.max(0, Number(value) || 0))}%`
const share = (tier) =>
  revenue.value.total_minor ? (100 * tier.revenue_minor) / revenue.value.total_minor : 0
const tabs = [
  { key: 'sales', label: 'Earnings' },
  { key: 'discounts', label: 'Discount codes' },
  { key: 'social', label: 'Social links' },
  { key: 'payouts', label: 'Payouts' },
]
watch(
  () => route.query.tab,
  (value) => {
    tab.value = tabs.some((item) => item.key === value) ? value : 'sales'
  },
  { immediate: true },
)
function selectTab(key) {
  tab.value = key
  navigate({ tab: key })
}
function moveTab(e, index) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
  e.preventDefault()
  const next =
    e.key === 'Home'
      ? 0
      : e.key === 'End'
        ? tabs.length - 1
        : (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
  selectTab(tabs[next].key)
  e.currentTarget.parentElement.children[next].focus()
}
</script>
<template>
  <section data-route="earnings" class="rh-screen">
    <section v-if="free" class="rhe-card workspace-empty">
      <h1>This event is free</h1>
      <p>Free registrations don’t have ticket earnings or payouts.</p>
      <button class="rh-button rh-button-outline" @click="emit('navigate', 'attendees')">
        View attendees
      </button>
    </section>
    <template v-else>
      <div v-if="!screen" class="rhe-head">
        <div>
          <p class="rhe-context">Your earnings for</p>
          <h1>{{ overview.event?.title }}</h1>
        </div>
        <button class="rh-button rh-button-outline" :aria-pressed="hidden" @click="toggleAmounts">
          <svg class="icon" aria-hidden="true">
            <use :href="hidden ? '#ico-eye-off' : '#ico-eye'" /></svg
          >{{ hidden ? 'Show amounts' : 'Hide amounts' }}
        </button>
      </div>
      <div v-if="!screen" class="rhe-tabs" role="tablist" aria-label="Earnings sections">
        <button
          v-for="(item, index) in tabs"
          :id="`earnings-tab-${item.key}`"
          :key="item.key"
          role="tab"
          :aria-controls="item.key === 'payouts' ? 'rhe-payouts' : `earnings-panel-${item.key}`"
          :aria-selected="tab === item.key"
          :tabindex="tab === item.key ? 0 : -1"
          @click="selectTab(item.key)"
          @keydown="moveTab($event, index)"
        >
          {{ item.label }}
        </button>
      </div>
      <div
        v-if="!screen && tab === 'sales'"
        id="earnings-panel-sales"
        role="tabpanel"
        aria-labelledby="earnings-tab-sales"
      >
        <div class="rhe-summary rhe-sales-summary">
          <article class="rhe-card rhe-main">
            <span>How much you’ve made so far</span><strong>{{ money(revenue.total_minor) }}</strong
            ><small
              >{{ number(sales.units_sold) }} tickets at original prices, before discounts, fees and
              refunds</small
            >
          </article>
          <article class="rhe-card">
            <span>How much you’ve made this week</span
            ><strong>{{ money(revenue.this_week_minor) }}</strong
            ><small>From ticket sales this week, at original prices</small>
          </article>
        </div>
        <section class="rhe-earn-section">
          <div class="rhe-section-head">
            <div>
              <h2>How much you’ve made from each ticket type</h2>
              <p>
                Compare what each ticket costs, how many you’ve sold and how much money each type
                has brought in.
              </p>
            </div>
          </div>
          <div class="rhe-card rhe-money-list">
            <div v-for="tier in tiers" :key="tier.id" class="rhe-money-row">
              <div class="rhe-row-label">
                <strong>{{ tier.name }}</strong
                ><small
                  >{{
                    tier.price_minor == null
                      ? ''
                      : money(tier.price_minor) + ' per ticket at original price · '
                  }}{{ number(tier.sold_units) }} sold</small
                ><button class="rhea-inline-link" @click="openTier(tier)">View details</button>
              </div>
              <div class="rhe-track money-graphic" aria-hidden="true">
                <span :style="{ width: progress(share(tier)) }" />
              </div>
              <div class="rhe-row-value">
                <strong>{{ money(tier.revenue_minor) }}</strong
                ><small class="money-graphic">{{ percent(share(tier)) }} of money made</small>
              </div>
            </div>
            <p v-if="!tiers.length" class="workspace-empty">
              Your ticket earnings will appear here after your first sale.
            </p>
          </div>
        </section>
        <section class="rhe-earn-section">
          <div class="rhe-section-head">
            <div>
              <h2>How your tickets are selling</h2>
              <p>
                See how many tickets people have bought and how many you still have available for
                each ticket type.
              </p>
            </div>
          </div>
          <div class="rhe-card rhe-count-list">
            <div class="rhe-total-count">
              <div>
                <strong
                  >{{ number(sales.units_sold) }}
                  <span>of {{ number(sales.capacity_units) }} tickets sold</span></strong
                ><small>{{ number(sales.available_units) }} tickets left to sell</small>
              </div>
              <strong class="rhe-total-percent">{{ percent(sales.sold_percent) }} sold</strong>
            </div>
            <div
              class="rhe-track rhe-total-track"
              role="progressbar"
              aria-label="Ticket units sold"
              :aria-valuenow="sales.units_sold || 0"
              aria-valuemin="0"
              :aria-valuemax="sales.capacity_units || 0"
            >
              <span :style="{ width: progress(sales.sold_percent) }" />
            </div>
            <div class="rhe-detail-list">
              <div v-for="tier in tiers" :key="tier.id" class="rhe-sale-detail">
                <div class="rhea-ticket-row">
                  <div class="rhe-row-label">
                    <strong>{{ tier.name }}</strong
                    ><small>{{
                      tier.price_minor == null ? '' : money(tier.price_minor) + ' per ticket'
                    }}</small>
                  </div>
                  <div class="rhe-count-progress">
                    <div class="rhe-count-label">
                      <strong
                        >{{ number(tier.sold_units) }} of
                        {{ number(tier.effective_capacity_units) }} sold</strong
                      ><small>{{ number(tier.available_units) }} left</small>
                    </div>
                    <div
                      class="rhe-track"
                      role="progressbar"
                      :aria-label="`${tier.name} sold`"
                      :aria-valuenow="tier.sold_units"
                      aria-valuemin="0"
                      :aria-valuemax="tier.effective_capacity_units"
                    >
                      <span :style="{ width: progress(tier.sold_percent) }" />
                    </div>
                  </div>
                  <button class="rh-button rh-button-outline rhea-view" @click="openTier(tier)">
                    View details
                  </button>
                </div>
              </div>
            </div>
            <div class="rhe-all-records">
              <button class="rh-button rh-button-outline" @click="navigate({ screen: 'buyers' })">
                See who bought your tickets
              </button>
            </div>
          </div>
        </section>
        <section class="rhe-earn-section">
          <div class="rhe-section-head">
            <div>
              <h2>See where your sales came from</h2>
              <p>Find out how much people spent using your discount codes and social links.</p>
            </div>
          </div>
          <div class="rhea-overview">
            <article class="rhe-card">
              <h3>Discount codes</h3>
              <strong class="rhea-metric">{{ money(model.discount.paid) }}</strong>
              <p>
                {{
                  model.discount.count == null
                    ? 'View sales from your offers'
                    : `${number(model.discount.count)} tickets sold using discount codes`
                }}
              </p>
              <a
                class="rh-button rh-button-outline"
                :href="destination({ tab: 'discounts' })"
                @click.prevent="selectTab('discounts')"
                >See sales by code</a
              >
            </article>
            <article class="rhe-card">
              <h3>Social links</h3>
              <strong class="rhea-metric">{{ money(model.social.paid) }}</strong>
              <p>
                {{
                  model.social.count == null
                    ? 'View sales from your sharing links'
                    : `${number(model.social.count)} tickets sold through sharing links`
                }}
              </p>
              <a
                class="rh-button rh-button-outline"
                :href="destination({ tab: 'social' })"
                @click.prevent="selectTab('social')"
                >See social link sales</a
              >
            </article>
          </div>
          <p class="rhea-note">
            Example sales breakdown. A ticket can use both a discount code and a social link, so
            these amounts should not be added together.
          </p>
          <p v-if="DASHBOARD_PREVIEW" class="rhea-sample-note">
            Sales by code and social link are sample figures until payments and checkout tracking
            are connected.
          </p>
        </section>
        <section class="rhe-card rhe-get-paid">
          <div>
            <h2>Getting your money</h2>
            <p>Add your bank account so we know where to send your money when it’s ready.</p>
          </div>
          <button class="rh-button rh-button-dark" @click="selectTab('payouts')">
            Set up payouts
          </button>
        </section>
      </div>
      <KeepAlive
        ><WorkspaceEarningsPayouts
          v-if="!screen && tab === 'payouts'"
          :overview="overview"
          :money="money"
      /></KeepAlive>
      <WorkspaceEarningsDetails
        v-if="screen || ['discounts', 'social'].includes(tab)"
        :model="model"
        :overview="overview"
        :money="money"
        :tab="tab"
        @navigate="emit('navigate', $event)"
      />
      <p v-if="linksError" role="status" class="rhea-sample-note">
        {{ linksError }} <button class="rhea-inline-link" @click="loadLinks">Try again</button>
      </p>
    </template>
  </section>
</template>
