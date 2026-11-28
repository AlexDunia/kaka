<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { DASHBOARD_PREVIEW } from '@/services/dashboardPreview'
import { tierKey, sourceName } from './earningsModel'
import Table from './WorkspaceEarningsTable.vue'
import WorkspaceFinancialRecords from './WorkspaceFinancialRecords.vue'

const props = defineProps({ model: Object, money: Function, overview: Object, tab: String })
const emit = defineEmits(['navigate', 'refresh'])
const route = useRoute(),
  search = ref('')
const screen = computed(() => String(route.query.screen || ''))
const scope = computed(() => ({
  tier: String(route.query.tier || ''),
  code: String(route.query.code || ''),
  channel: String(route.query.channel || ''),
}))
const tier = computed(() => props.model.tiers.find((t) => t.key === scope.value.tier))
const code = computed(() => props.model.codeRows().find((c) => c.code === scope.value.code))
const source = computed(() =>
  props.model.sourceRows().find((s) => s.source === scope.value.channel),
)
const person = computed(() => props.model.buyers().find((p) => p.ticket.id === route.query.ticket))
const stats = computed(() =>
  props.model.stats(
    screen.value === 'code'
      ? { code: scope.value.code }
      : screen.value === 'source'
        ? { channel: scope.value.channel }
        : scope.value,
  ),
)
const count = (value) => (value == null ? '—' : Number(value).toLocaleString('en-NG'))
const query = (values = {}) => ({ view: 'payout', ...values })
const href = (values) => `${route.path}?${new URLSearchParams(query(values))}`
const go = (values = {}) => emit('navigate', query(values))
const action = (text, values, label) => ({ text, query: query(values), href: href(values), label })
const text = (value, sub, strong = false) => ({ text: value, sub, strong })
const offer = (c) =>
  !c ? '—' : c.type === 'fixed' ? `${props.money(Number(c.value) * 100)} off` : `${c.value}% off`
const codeHeaders = ['Discount code', 'Offer', 'Tickets sold', 'Money made', 'Details']
const sourceHeaders = ['Social link', 'Tickets sold', 'Money made', 'Details']
const peopleHeaders = computed(() => [
  'Guest',
  screen.value === 'ticket' ? 'Ticket' : 'Ticket type',
  DASHBOARD_PREVIEW ? 'Amount paid (demo)' : 'Amount paid',
  'Date bought',
  'Details',
])
function codeRows(key) {
  return props.model.codeRows(key).map((r) => ({
    key: r.code,
    cells: [
      text(r.code, r.config?.name || r.original?.name, true),
      text(offer(r.config || r.original)),
      text(count(r.stats.count)),
      text(props.money(r.stats.paid)),
      action('Open', { screen: 'code', code: r.code }, `Open ${r.code} earnings`),
    ],
  }))
}
function sourceRows(key) {
  const rows = props.model.sourceRows(key).map((r) => ({
    key: r.source,
    cells: [
      text(r.label, `${r.links.length} tracking links created`, true),
      text(count(r.stats.count)),
      text(props.money(r.stats.paid)),
      action('Open', { screen: 'source', channel: r.source }, `Open ${r.label} earnings`),
    ],
  }))
  const unknown = props.model.rows.filter((r) => !r.source && (!key || r.tier === key))
  if (unknown.length)
    rows.push({
      key: 'unknown',
      cells: [
        text('Source not recorded', 'No tracking link', true),
        text(count(unknown.reduce((n, r) => n + r.count, 0))),
        text(props.money(unknown.reduce((n, r) => n + r.paid, 0))),
        text('—'),
      ],
    })
  return rows
}
function peopleRows(rows, from = screen.value || 'buyers') {
  return rows.map((p) => ({
    key: p.ticket.id,
    cells: [
      text(p.ticket.name, p.ticket.email, true),
      text(screen.value === 'ticket' ? p.ticket.id : p.ticket.type),
      text(props.money(p.paid)),
      text(p.ticket.purchased),
      action(
        'View',
        { screen: 'person', ticket: p.ticket.id, from, ...scope.value },
        `View ${p.ticket.name}’s ticket`,
      ),
    ],
  }))
}
const filteredPeople = computed(() => props.model.buyers(scope.value, search.value))
const breakdownRows = computed(() =>
  props.model.tiers.map((t) => {
    const values =
      screen.value === 'code' ? { code: scope.value.code } : { channel: scope.value.channel }
    const s = props.model.stats({ tier: t.key, ...values })
    return {
      key: t.key,
      cells: [
        text(t.name, null, true),
        ...(screen.value === 'code' ? [text(props.money(t.originalPrice))] : []),
        text(count(s.count)),
        text(props.money(s.paid)),
        action('Open', { screen: 'ticket', tier: t.key, ...values }, `Open ${t.name} sales`),
      ],
    }
  }),
)
const breakdownHeaders = computed(() => [
  'Ticket type',
  ...(screen.value === 'code' ? ['Original price'] : []),
  'Tickets sold',
  'Money made',
  'Details',
])
const back = computed(() => {
  const s = scope.value
  if (screen.value === 'person') {
    const from = ['ticket', 'code', 'source', 'buyers'].includes(route.query.from)
      ? route.query.from
      : 'buyers'
    return {
      label:
        from === 'ticket'
          ? 'Ticket sales'
          : from === 'code'
            ? 'Discount code sales'
            : from === 'source'
              ? 'Social link sales'
              : 'Ticket buyers',
      values: {
        screen: from,
        ...(from === 'ticket'
          ? s
          : from === 'code'
            ? { code: s.code }
            : from === 'source'
              ? { channel: s.channel }
              : {}),
      },
    }
  }
  if (screen.value === 'ticket' && s.code)
    return { label: 'Discount code', values: { screen: 'code', code: s.code } }
  if (screen.value === 'ticket' && s.channel)
    return { label: 'Social link', values: { screen: 'source', channel: s.channel } }
  return {
    label:
      screen.value === 'code'
        ? 'Discount codes'
        : screen.value === 'source'
          ? 'Social links'
          : 'Earnings',
    values:
      screen.value === 'code'
        ? { tab: 'discounts' }
        : screen.value === 'source'
          ? { tab: 'social' }
          : {},
  }
})
const valid = computed(() =>
  screen.value === 'ticket'
    ? Boolean(tier.value)
    : screen.value === 'code'
      ? Boolean(code.value)
      : screen.value === 'source'
        ? Boolean(source.value)
        : screen.value === 'person'
          ? Boolean(person.value)
          : true,
)
const title = computed(() =>
  screen.value === 'ticket'
    ? scope.value.code
      ? `${tier.value?.name} bought with ${scope.value.code}`
      : scope.value.channel
        ? `${tier.value?.name} from ${sourceName(scope.value.channel)}`
        : `Your ${tier.value?.name} sales`
    : screen.value === 'code'
      ? `${scope.value.code} — sales and buyers`
      : screen.value === 'source'
        ? `Sales from ${source.value?.label}`
        : `${person.value?.ticket.name}’s ticket`,
)
const facts = computed(() => {
  const c = code.value?.config || code.value?.original || {}
  const eligible =
    c.eligibleTypes || (Array.isArray(c.eligible) ? c.eligible : [c.eligible || 'all'])
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: props.overview.event?.timezone || 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
  const status =
    c.active === false
      ? 'Paused'
      : c.start && c.start > today
        ? 'Scheduled'
        : c.end && c.end < today
          ? 'Expired'
          : Number(c.used) >= Number(c.limit)
            ? 'Used up'
            : 'Available'
  return [
    ['Offer name', c.name || scope.value.code],
    ['Created for', c.partner || 'No partner added'],
    ['Buyers save', offer(c)],
    [
      'Works on',
      eligible.includes('all')
        ? 'All ticket types'
        : eligible
            .map(
              (v) =>
                props.model.tiers.find((t) => [t.key, String(t.id), t.name].includes(String(v)))
                  ?.name || v,
            )
            .join(', '),
    ],
    ['Code status', code.value?.config ? status : 'Sample code'],
    ['Uses / limit', c.limit ? `${c.used || 0} of ${c.limit}` : 'Not connected'],
    ['Starts', c.start || 'Not set'],
    ['Ends', c.end || 'Not set'],
  ]
})
const sampleNote = computed(() =>
  DASHBOARD_PREVIEW
    ? 'Sales by code and social link are sample figures until payments and checkout tracking are connected.'
    : 'Sales by code and individual purchases aren’t available yet. Earnings shown come from your event’s sales records.',
)
</script>
<template>
  <section v-if="!DASHBOARD_PREVIEW && screen" class="rhe-card">
    <a class="rh-v26-back" :href="href({})" @click.prevent="go({})">Back to earnings</a
    ><WorkspaceFinancialRecords :event-id="overview.event?.id" @changed="emit('refresh')" />
  </section>
  <section v-else-if="screen === 'buyers'" id="rhe-buyers">
    <a class="rh-v26-back" :href="href(back.values)" @click.prevent="go(back.values)"
      >← {{ back.label }}</a
    >
    <div class="rhe-buyers-head">
      <h1>See who bought your tickets</h1>
      <p>Find buyers and guests for each ticket type.</p>
    </div>
    <div class="rhe-buyers-search">
      <label class="rh-field"
        ><span>Find a buyer or guest</span
        ><input v-model="search" type="search" placeholder="Search name, email or ticket code"
      /></label>
      <p role="status">{{ filteredPeople.length }} ticket records</p>
    </div>
    <section v-for="t in model.tiers" :key="t.key" class="rh-module rhs-buy-group">
      <div class="rh-module-title">
        <h2>{{ t.name }}</h2>
        <span class="rhs-buy-count"
          >{{ filteredPeople.filter((p) => tierKey(p.ticket) === t.key).length }} tickets</span
        >
      </div>
      <Table
        :headers="peopleHeaders"
        :rows="
          peopleRows(
            filteredPeople.filter((p) => p.tier === t.key),
            'buyers',
          )
        "
        :empty="
          DASHBOARD_PREVIEW ? 'No buyers match your search.' : 'Buyer records aren’t connected yet.'
        "
        @navigate="emit('navigate', $event)"
      />
    </section>
    <p class="rhea-sample-note">{{ sampleNote }}</p>
  </section>
  <section v-else-if="screen">
    <div :class="screen === 'ticket' ? 'rhea-page-head' : 'rhea-detail-top'">
      <div>
        <a class="rh-v26-back" :href="href(back.values)" @click.prevent="go(back.values)"
          >← {{ back.label }}</a
        >
        <h2>{{ valid ? title : 'We couldn’t find this record.' }}</h2>
        <p v-if="valid">
          {{
            screen === 'person'
              ? 'Here are the details of this ticket and its purchase.'
              : 'See the sales, buyers and discounts for these tickets.'
          }}
        </p>
      </div>
    </div>
    <template v-if="valid && screen === 'person'">
      <section class="rhe-card rhea-detail-card rhea-person-card">
        <h3>Ticket details</h3>
        <dl class="rhea-person-facts">
          <div
            v-for="[label, value] in [
              ['Full name', person.ticket.name],
              ['Email address', person.ticket.email],
              ['Ticket type', person.ticket.type],
              ['Ticket code', person.ticket.id],
              [DASHBOARD_PREVIEW ? 'Amount paid (demo)' : 'Amount paid', money(person.paid)],
              ['Date bought', person.ticket.purchased],
            ]"
            :key="label"
          >
            <dt>{{ label }}</dt>
            <dd>{{ value }}</dd>
          </div>
        </dl>
        <p class="rhea-person-order">
          Bought by <strong>{{ person.order.buyer }}</strong> · Order
          <strong>{{ person.order.id }}</strong
          ><template v-if="person.tracking.code">
            · Discount code <strong>{{ person.tracking.code }}</strong></template
          >
        </p>
      </section>
      <p class="rhea-sample-note">
        The payment shown is an example based on the original ticket price and sample discount.
      </p>
    </template>
    <template v-else-if="valid">
      <div
        class="rhe-summary"
        :class="screen === 'ticket' ? 'rhea-ticket-compact-metrics' : 'rhea-metrics'"
      >
        <article class="rhe-card">
          <span>{{
            screen === 'code'
              ? 'Money made using this code'
              : screen === 'source'
                ? 'Money made through this source'
                : 'Money made'
          }}</span
          ><strong>{{ money(stats.paid) }}</strong
          ><small>After discounts, before fees</small>
        </article>
        <article class="rhe-card">
          <span>{{
            screen === 'code'
              ? 'Tickets sold with this code'
              : screen === 'source'
                ? 'Tickets sold through this source'
                : 'Tickets sold'
          }}</span
          ><strong>{{ count(stats.count) }}</strong>
        </article>
        <article v-if="screen !== 'ticket'" class="rhe-card">
          <span>{{ screen === 'code' ? 'Discounts given' : 'Tracking links created' }}</span
          ><strong>{{ screen === 'code' ? money(stats.saved) : source.links.length }}</strong
          ><small v-if="screen === 'code'">What buyers saved in total</small>
        </article>
      </div>
      <p v-if="screen === 'ticket'" class="rhea-ticket-price-note">
        Current ticket price: <strong>{{ money(tier.price_minor) }}</strong>
      </p>
      <section v-if="screen === 'code'" class="rhe-card rhea-detail-card rhea-code-facts">
        <h3>About {{ scope.code }}</h3>
        <dl class="rhea-facts">
          <div v-for="[label, value] in facts" :key="label">
            <dt>{{ label }}</dt>
            <dd>{{ value }}</dd>
          </div>
        </dl>
      </section>
      <section v-if="screen !== 'ticket'" class="rhe-earn-section">
        <div class="rhea-breakdown-head">
          <h2>
            {{
              screen === 'code'
                ? `Tickets sold using ${scope.code}`
                : `Tickets sold through ${source.label}`
            }}
          </h2>
          <p>See sales by ticket type.</p>
        </div>
        <Table
          :headers="breakdownHeaders"
          :rows="breakdownRows"
          @navigate="emit('navigate', $event)"
        />
      </section>
      <section class="rhe-earn-section rhea-people-section">
        <div class="rhea-breakdown-head">
          <h2>
            {{
              screen === 'ticket'
                ? `People who bought ${tier.name}`
                : screen === 'code'
                  ? `People who used ${scope.code}`
                  : `People who bought through ${source.label}`
            }}
          </h2>
          <p>See each buyer, their ticket and the amount paid.</p>
        </div>
        <Table
          :headers="peopleHeaders"
          :rows="
            peopleRows(
              model.buyers(
                screen === 'code'
                  ? { code: scope.code }
                  : screen === 'source'
                    ? { channel: scope.channel }
                    : scope,
              ),
            )
          "
          :empty="
            DASHBOARD_PREVIEW
              ? 'No purchases to show for this selection.'
              : 'Individual purchase records aren’t connected yet.'
          "
          @navigate="emit('navigate', $event)"
        />
      </section>
      <template v-if="screen === 'ticket' && !scope.code && !scope.channel">
        <section class="rhe-earn-section rhea-compact-section">
          <div class="rhea-breakdown-head">
            <h2>Discount codes used</h2>
            <p>Which discounts buyers used for this ticket.</p>
          </div>
          <Table
            :headers="codeHeaders"
            :rows="codeRows(scope.tier)"
            @navigate="emit('navigate', $event)"
          />
        </section>
        <section class="rhe-earn-section rhea-compact-section">
          <div class="rhea-breakdown-head">
            <h2>Where these sales came from</h2>
            <p>Sales linked to your sharing links.</p>
          </div>
          <Table
            :headers="sourceHeaders"
            :rows="sourceRows(scope.tier)"
            @navigate="emit('navigate', $event)"
          />
        </section>
      </template>
      <a
        v-if="screen === 'source'"
        class="rh-button rh-button-outline rhea-detail-link"
        :href="href({ screen: 'buyers' })"
        @click.prevent="go({ screen: 'buyers' })"
        >See all ticket buyers</a
      >
      <p class="rhea-sample-note">{{ sampleNote }}</p>
    </template>
  </section>
  <section
    v-else
    :id="`earnings-panel-${tab}`"
    class="rhe-earn-section"
    role="tabpanel"
    :aria-labelledby="`earnings-tab-${tab}`"
  >
    <div class="rhe-summary rhea-metrics">
      <article class="rhe-card">
        <span>{{
          tab === 'discounts'
            ? 'Money made using discount codes'
            : 'Money made through social links'
        }}</span
        ><strong>{{ money((tab === 'discounts' ? model.discount : model.social).paid) }}</strong
        ><small>After discounts, before fees</small>
      </article>
      <article class="rhe-card">
        <span>{{
          tab === 'discounts' ? 'Tickets sold using codes' : 'Tickets sold through links'
        }}</span
        ><strong>{{ count((tab === 'discounts' ? model.discount : model.social).count) }}</strong>
      </article>
      <article class="rhe-card">
        <span>{{ tab === 'discounts' ? 'Discounts given' : 'Sources with ticket sales' }}</span
        ><strong>{{
          tab === 'discounts'
            ? money(model.discount.saved)
            : model.sourceRows().filter((s) => s.stats.count > 0 || s.stats.paid > 0).length
        }}</strong
        ><small v-if="tab === 'discounts'">Money buyers saved</small>
      </article>
    </div>
    <div class="rhea-breakdown-head">
      <h2>
        {{
          tab === 'discounts' ? 'Money made with each code' : 'Which social links brought in sales?'
        }}
      </h2>
      <p>
        {{
          tab === 'discounts'
            ? 'See how much buyers spent using each code. Open a code to see its ticket sales and buyers.'
            : 'Open a source to see how many tickets people bought through its tracked links.'
        }}
      </p>
    </div>
    <Table
      :headers="tab === 'discounts' ? codeHeaders : sourceHeaders"
      :rows="tab === 'discounts' ? codeRows() : sourceRows()"
      @navigate="emit('navigate', $event)"
    />
    <p class="rhea-sample-note">{{ sampleNote }}</p>
    <p v-if="tab === 'social'" class="rhea-note">
      A sale can use both a discount code and a social link. It counts once in total ticket earnings.
    </p>
  </section>
</template>
