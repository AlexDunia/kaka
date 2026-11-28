<script setup>
import { pngIconUrl } from '@/constants/pngIcons'
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { DASHBOARD_PREVIEW } from '@/services/dashboardPreview'
import { formatMoneyMinor } from '@/utils/dashboardFormat'
import { freshDiscount, validateDiscount } from './promotionModel'
import WorkspaceCopyButton from './WorkspaceCopyButton.vue'
import WorkspaceDiscountDetails from './WorkspaceDiscountDetails.vue'
const props = defineProps({
  overview: Object,
  codes: Array,
  codeStatus: Function,
  persistCodes: Function,
})
const emit = defineEmits(['notify', 'navigate'])
const route = useRoute()
const detailPage = computed(() => route.query.screen === 'discount')
const detail = computed(() => props.codes.find((code) => code.code === route.query.code))
const notify = (message) => emit('notify', message)
const editor = ref(false),
  editing = ref(null),
  selected = ref(null),
  dialog = ref(null),
  formElement = ref(null),
  error = ref(''),
  search = ref(''),
  filter = ref('all')
const offer = reactive(freshDiscount())
const labels = {
  available: 'Available',
  paused: 'Paused',
  scheduled: 'Scheduled',
  expired: 'Expired',
  'used-up': 'Used up',
}
const tickets = computed(() =>
  (props.overview.ticket_types || []).map((ticket) => ({
    key: String(ticket.id),
    label: ticket.name,
  })),
)
const eligibleLabels = (values) =>
  values?.includes('all')
    ? 'All ticket types'
    : (values || [])
        .map(
          (key) =>
            tickets.value.find(
              (ticket) =>
                ticket.key === String(key) ||
                ticket.label.toLowerCase() === String(key).toLowerCase(),
            )?.label ||
            { early: 'Early bird', general: 'General admission', vip: 'VIP' }[key] ||
            key,
        )
        .join(', ')
const amount = (code) =>
  code.type === 'fixed'
    ? `${formatMoneyMinor(Number(code.value) * 100, props.overview.revenue?.currency || 'NGN')} off`
    : `${Number(code.value)}% off`
const prettyDate = (value) =>
  new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`))
const dateLabel = (code) =>
  code.start && code.end
    ? `${prettyDate(code.start)} – ${prettyDate(code.end)}`
    : code.start
      ? `From ${prettyDate(code.start)}`
      : code.end
        ? `Until ${prettyDate(code.end)}`
        : 'No additional date restriction'
const filtered = computed(() =>
  props.codes.filter(
    (code) =>
      [code.code, code.name, code.partner, eligibleLabels(code.eligible)]
        .join(' ')
        .toLowerCase()
        .includes(search.value.trim().toLowerCase()) &&
      (filter.value === 'all' || props.codeStatus(code) === filter.value),
  ),
)
async function openEditor(code = null) {
  editing.value = code?.code || null
  Object.assign(
    offer,
    freshDiscount(),
    { value: 15, limit: 100 },
    code ? { ...code, eligible: [...code.eligible] } : {},
  )
  error.value = ''
  editor.value = true
  await nextTick()
  formElement.value?.scrollIntoView({ block: 'nearest' })
  formElement.value?.querySelector('input:not(:disabled)')?.focus({ preventScroll: true })
}
function closeEditor() {
  editor.value = false
  editing.value = null
  if (route.query.screen === 'edit-discount') emit('navigate', { view: 'promo' })
}
function chooseTickets(key, checked) {
  offer.eligible =
    key === 'all'
      ? checked
        ? ['all']
        : []
      : checked
        ? [...offer.eligible.filter((value) => value !== 'all'), key]
        : offer.eligible.filter((value) => value !== key)
  if (!offer.eligible.length) offer.eligible = ['all']
}
function saveDiscount() {
  offer.code = offer.code.trim().toUpperCase()
  error.value = validateDiscount(offer, props.codes, editing.value)
  if (!DASHBOARD_PREVIEW && !error.value)
    error.value =
      'Discount saving isn’t connected yet. Your form is still here so you can review it.'
  if (error.value) return
  const saved = {
    ...offer,
    name: offer.name.trim(),
    partner: offer.partner.trim(),
    value: Number(offer.value),
    limit: Number(offer.limit),
    eligible: [...offer.eligible],
  }
  if (
    !props.persistCodes(
      editing.value
        ? props.codes.map((code) => (code.code === editing.value ? saved : code))
        : [saved, ...props.codes],
    )
  ) {
    error.value = 'We couldn’t save this code. Check your browser storage and try again.'
    return
  }
  closeEditor()
  notify('Discount code saved in this browser. Checkout isn’t connected yet.')
}
function codeAction(code) {
  if (!DASHBOARD_PREVIEW) {
    notify('Discount changes aren’t connected yet. Your code hasn’t changed.')
    return
  }
  const status = props.codeStatus(code)
  if (
    ['expired', 'used-up'].includes(status) ||
    (status === 'paused' &&
      ['expired', 'used-up'].includes(props.codeStatus({ ...code, active: true })))
  ) {
    if (detailPage.value)
      emit('navigate', { view: 'promo', screen: 'edit-discount', code: code.code })
    else
      openEditor(code).then(() => {
        const field = formElement.value?.elements?.namedItem(status === 'used-up' ? 'limit' : 'end')
        field?.focus({ preventScroll: true })
      })
    return
  }
  const changes = status === 'scheduled' ? { start: '', active: true } : { active: !code.active }
  if (
    props.persistCodes(
      props.codes.map((item) => (item.code === code.code ? { ...item, ...changes } : item)),
    )
  )
    notify(
      status === 'paused'
        ? 'Discount code resumed.'
        : status === 'scheduled'
          ? 'Discount code is available now.'
          : 'Discount code paused.',
    )
}
function showDetails(code) {
  emit('navigate', { view: 'promo', screen: 'discount', code: code.code })
}
function editSelected() {
  dialog.value.close()
  openEditor(selected.value)
}
function backdrop(event) {
  if (event.target === dialog.value) {
    const box = dialog.value.getBoundingClientRect()
    if (
      event.clientX < box.left ||
      event.clientX > box.right ||
      event.clientY < box.top ||
      event.clientY > box.bottom
    )
      dialog.value.close()
  }
}
function exportCodes() {
  const rows = [
    [
      'Code',
      'Type',
      'Value',
      'Eligible tickets',
      'Start date',
      'End date',
      'Uses',
      'Max uses',
      'Status',
    ],
    ...props.codes.map((code) => [
      code.code,
      code.type,
      code.value,
      eligibleLabels(code.eligible),
      code.start || '',
      code.end || '',
      code.used,
      code.limit,
      labels[props.codeStatus(code)],
    ]),
  ]
  const csv = rows
    .map((row) => row.map((value) => '"' + String(value).replace(/"/g, '""') + '"').join(','))
    .join('\r\n')
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })),
    link = document.createElement('a')
  link.href = url
  link.download = DASHBOARD_PREVIEW
    ? 'rushhour-discount-codes-demo.csv'
    : 'rushhour-discount-codes.csv'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 500)
  notify('Discount codes exported.')
}
watch(
  () => [route.query.screen, route.query.code],
  () => {
    if (route.query.screen === 'edit-discount' && detail.value) openEditor(detail.value)
  },
  { immediate: true },
)
</script>

<template>
  <WorkspaceDiscountDetails
    v-if="detailPage"
    :item="detail"
    :code-status="codeStatus"
    :eligible-labels="eligibleLabels"
    :amount="amount"
    @back="$emit('navigate', { view: 'promo' })"
    @action="codeAction"
    @notify="notify"
  />
  <section
    v-else
    aria-labelledby="rh-discounts-title"
    class="rh-screen rh-d13"
    data-route="discounts"
    @click.stop
    @submit.stop
    @keydown.stop
  >
    <div class="rh-page-heading rh-d13-page-heading">
      <div>
        <span class="rh-eyebrow">GROW SALES / DISCOUNT CODES</span>
        <h1 id="rh-discounts-title">Give buyers a discount.</h1>
        <p>Create a code for one ticket type or all tickets.</p>
      </div>
      <button
        class="rh-button rh-button-dark"
        id="rh-d13-create"
        @click="openEditor()"
        type="button"
      >
        + Create discount code
      </button>
    </div>
    <div aria-label="Discount code summary" class="rh-summary-grid rh-d13-metrics">
      <article class="rh-summary-card">
        <span>Codes created</span><strong id="rh-code-total">{{ codes.length }}</strong
        ><small>Discount codes you’ve created</small>
      </article>
      <article class="rh-summary-card">
        <span>Available now</span
        ><strong id="rh-code-active">{{
          codes.filter((code) => codeStatus(code) === 'available').length
        }}</strong
        ><small>Active and ready to use</small>
      </article>
      <article class="rh-summary-card">
        <span>Uses</span
        ><strong id="rh-code-uses">{{
          codes.reduce((sum, code) => sum + Number(code.used || 0), 0)
        }}</strong
        ><small>Times codes have been used</small>
      </article>
    </div>
    <div class="rh-module rh-d13-editor" id="rh-d13-editor" v-if="editor">
      <div class="rh-module-title rh-d13-editor-heading">
        <div>
          <h2 id="rh-d13-editor-title">
            {{ editing ? `Edit ${editing}` : 'Create a discount code' }}
          </h2>
          <p>
            Choose the discount, tickets, and dates. Review before saving.
          </p>
        </div>
        <button
          aria-label="Close discount form"
          class="rh-icon-button"
          id="rh-d13-close"
          @click="closeEditor"
          type="button"
        ><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('close')" width="24" height="24" /></svg></button>
      </div>
      <form id="rh-d13-form" ref="formElement" @submit.prevent="saveDiscount">
        <div class="rh-d13-form-grid">
          <div class="rh-d13-form-main">
            <div class="rh-d13-form-section">
              <h3>1. The offer</h3>
              <label class="rh-field" for="rh35-d13-name"
                ><span>Offer name</span
                ><input
                  id="rh35-d13-name"
                  v-model="offer.name"
                  maxlength="60"
                  name="name"
                  placeholder="e.g. Campus Store"
                  required=""
              /></label>
              <label class="rh-field" for="rh36-d13-partner"
                ><span>Creator or partner (optional)</span
                ><input
                  id="rh36-d13-partner"
                  v-model="offer.partner"
                  maxlength="70"
                  name="partner"
                  placeholder="e.g. Your promoter"
              /></label>
              <label class="rh-field" for="rh-d13-code"
                ><span>Discount code <em>Required</em></span
                ><input
                  autocomplete="off"
                  id="rh-d13-code"
                  :disabled="Boolean(editing && offer.used)"
                  v-model="offer.code"
                  maxlength="20"
                  name="code"
                  placeholder="e.g. FRIENDS15"
                  required=""
                /><small
                  >This is what buyers will enter when paying for tickets. Use 3–20 letters, numbers
                  or hyphens.</small
                ></label
              >
              <div class="rh-d13-inline-fields">
                <label class="rh-field" for="rh-d13-type"
                  ><span>Discount type</span
                  ><select
                    id="rh-d13-type"
                    :disabled="Boolean(editing && offer.used)"
                    v-model="offer.type"
                    name="type"
                  >
                    <option value="percent">Percentage off (%)</option>
                    <option value="fixed">Amount off (₦)</option>
                  </select></label
                >
                <label class="rh-field" for="rh-d13-value"
                  ><span id="rh-d13-amount-label">Percentage off</span
                  ><input
                    id="rh-d13-value"
                    :disabled="Boolean(editing && offer.used)"
                    v-model="offer.value"
                    inputmode="decimal"
                    :max="offer.type === 'percent' ? 100 : 1000000"
                    min="1"
                    name="value"
                    placeholder="15"
                    required=""
                    step="1"
                    type="number"
                /></label>
              </div>
            </div>
            <div class="rh-d13-form-section">
              <h3>2. Who can use it?</h3>
              <fieldset class="rh36-ticket-picker rh36-ticket-picker-main" id="rh-d13-eligible">
                <legend>Eligible tickets</legend>
                <div class="rh36-ticket-options">
                  <label
                    v-for="ticket in [{ key: 'all', label: 'All tickets' }, ...tickets]"
                    :key="ticket.key"
                    ><input
                      type="checkbox"
                      :checked="offer.eligible.includes(ticket.key)"
                      @change="chooseTickets(ticket.key, $event.target.checked)"
                    /><span>{{ ticket.label }}</span></label
                  >
                </div>
                <small>Choose one or more. The same saving applies to each.</small>
              </fieldset>
              <label class="rh-field" for="rh-d13-limit"
                ><span>Maximum uses</span
                ><input
                  id="rh-d13-limit"
                  v-model="offer.limit"
                  inputmode="numeric"
                  max="100000"
                  min="1"
                  name="limit"
                  required=""
                  step="1"
                  type="number"
                /><small
                  >One use means one order that uses the code, even if that order contains several
                  tickets. Checkout isn’t connected yet.</small
                ></label
              >
            </div>
            <div class="rh-d13-form-section">
              <h3>3. When should it work?</h3>
              <div class="rh-d13-inline-fields">
                <label class="rh-field" for="rh-d13-start"
                  ><span>Start date <em>Optional</em></span
                  ><input id="rh-d13-start" v-model="offer.start" name="start" type="date" /><small
                    >Leave blank to start immediately.</small
                  ></label
                >
                <label class="rh-field" for="rh-d13-end"
                  ><span>End date <em>Optional</em></span
                  ><input id="rh-d13-end" v-model="offer.end" name="end" type="date" /><small
                    >Leave blank for no extra date restriction.</small
                  ></label
                >
              </div>
            </div>
            <div v-if="error" class="rh-d13-error" id="rh-d13-error" role="alert">{{ error }}</div>
            <div class="rh-d13-form-actions">
              <button class="rh-button rh-button-dark" id="rh-d13-save" type="submit">
                Create discount code</button
              ><button
                class="rh-button rh-button-outline"
                id="rh-d13-cancel"
                @click="closeEditor"
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
          <aside aria-live="polite" class="rh-d13-preview">
            <span class="rh-d13-preview-label">Your offer at a glance</span>
            <strong id="rh-d13-preview-code">FRIENDS15</strong>
            <div class="rh-d13-preview-saving" id="rh-d13-preview-saving">15% off</div>
            <div class="rh-d13-preview-facts">
              <div><span>Tickets</span><b id="rh-d13-preview-tickets">All ticket types</b></div>
              <div><span>Uses allowed</span><b id="rh-d13-preview-limit">100 orders</b></div>
              <div>
                <span>Available</span><b id="rh-d13-preview-dates">While tickets are on sale</b>
              </div>
            </div>
            <div class="rh-d13-price-example">
              <span>Ticket price</span>
              <div>
                <del id="rh-d13-price-before">₦10,000</del
                ><strong id="rh-d13-price-after">₦8,500</strong>
              </div>
              <small id="rh-d13-example-type">General admission</small>
            </div>
            <p>
              This preview uses ticket prices. Fees and final checkout amounts are not calculated
              here.
            </p>
          </aside>
        </div>
      </form>
    </div>
    <div class="rh-module rh-d13-list">
      <div class="rh-module-title rh-d13-list-head">
        <div>
          <h2>Your codes</h2>
          <p>Your codes are listed here with their usage and current status.</p>
        </div>
        <button
          class="rh-button rh-button-outline rh-d13-export"
          id="rh-d13-export"
          @click="exportCodes"
          type="button"
        >
          Export codes
        </button>
      </div>
      <div class="rh-d13-tools">
        <label class="rh-d13-search"
          ><span class="rh-d13-sr">Search discount codes</span
          ><svg
            aria-hidden="true"
            fill="none"
            height="18"
            stroke="currentColor"
            stroke-width="1.7"
            viewBox="0 0 24 24"
            width="18"
          ><image :href="pngIconUrl('search')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg
          ><input
            autocomplete="off"
            id="rh-d13-search"
            v-model="search"
            placeholder="Find a code or offer"
            type="search"
        /></label>
        <label class="rh-d13-filter"
          ><span class="rh-d13-sr">Filter discount codes</span
          ><select id="rh-d13-filter" v-model="filter">
            <option value="all">All codes</option>
            <option value="available">Available</option>
            <option value="scheduled">Scheduled</option>
            <option value="paused">Paused</option>
            <option value="expired">Expired</option>
            <option value="used-up">Used up</option>
          </select></label
        >
      </div>
      <div class="rh-d13-mobile-hint">
        Swipe sideways to see each code’s status and actions <span aria-hidden="true"><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('next')" width="24" height="24" /></svg></span>
      </div>
      <div class="rh-table-scroll rh-d13-table-scroll">
        <table class="rh-data-table rh-d13-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Offer</th>
              <th>Eligible tickets</th>
              <th>Orders used / limit</th>
              <th>Status</th>
              <th class="rh-th-action">Actions</th>
            </tr>
          </thead>
          <tbody id="rh-code-rows">
            <tr v-for="code in filtered" :key="code.code">
              <td>
                <strong class="rh-d13-code">{{ code.partner || code.name || code.code }}</strong
                ><span class="rh-d13-code-sub"
                  >{{ code.partner ? `${code.name} · ` : '' }}Code: {{ code.code }}</span
                >
              </td>
              <td>
                <span class="rh-d13-offer">{{ amount(code) }}</span>
              </td>
              <td>
                {{ eligibleLabels(code.eligible)
                }}<span class="rh-d13-note">{{ dateLabel(code) }}</span>
              </td>
              <td>
                <span class="rh-d13-uses">{{ code.used }} of {{ code.limit }}</span>
                <div class="rh-d13-mini-bar">
                  <span :style="{ width: `${Math.min(100, (code.used / code.limit) * 100)}%` }" />
                </div>
              </td>
              <td>
                <span class="rh-d13-status" :class="codeStatus(code)">{{
                  labels[codeStatus(code)]
                }}</span>
              </td>
              <td>
                <div class="rh-d13-actions">
                  <button data-d13-action="details" type="button" @click="showDetails(code)">
                    View details</button
                  ><button
                    class="rh-d13-more"
                    :class="{
                      'rh-icon-toggle': ['available', 'paused'].includes(codeStatus(code)),
                    }"
                    type="button"
                    :aria-label="`${{ available: 'Pause', paused: 'Resume', scheduled: 'Start now', expired: 'Reactivate', 'used-up': 'Increase limit for' }[codeStatus(code)]} ${code.code}`"
                    @click="codeAction(code)"
                  >
                    <svg
                      v-if="codeStatus(code) === 'available'"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    ><image :href="pngIconUrl('pause')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg
                    ><svg
                      v-else-if="codeStatus(code) === 'paused'"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    ><image :href="pngIconUrl('play')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg
                    ><template v-else>{{
                      {
                        scheduled: 'Start now',
                        expired: 'Reactivate',
                        'used-up': 'Increase limit',
                      }[codeStatus(code)]
                    }}</template></button
                  ><WorkspaceCopyButton
                    button-class="rh36-icon-copy"
                    compact
                    :value="code.code"
                    :label="`Copy ${code.code}`"
                    @notify="$emit('notify', $event)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="rh-d13-empty" id="rh-d13-empty" v-if="!filtered.length">
        <strong>No matching discount codes</strong>
        <p>Try a different search or filter. You can also create a new code.</p>
      </div>
      <div class="rh-module-foot rh-d13-list-foot">
        <span id="rh-code-count-footer"
          >Showing {{ filtered.length }} of {{ codes.length }}
          {{ codes.length === 1 ? 'code' : 'codes' }}</span
        >
      </div>
    </div>
    <div class="rh-d13-footer-note">
      <svg
        aria-hidden="true"
        fill="none"
        height="18"
        stroke="currentColor"
        stroke-width="1.8"
        viewBox="0 0 24 24"
        width="18"
      ><image :href="pngIconUrl('info')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg>
      <p>
        <strong>Before sharing a code:</strong> Checkout isn’t connected yet, so these codes can’t
        be used to buy tickets or record sales.
      </p>
      <button
        class="rh-d13-inline-link"
        id="rh-d13-checkout-info"
        @click="
          notify(
            'Checkout isn’t connected yet, so these codes can’t be used to buy tickets or record sales.',
          )
        "
        type="button"
      >
        How codes will work <span aria-hidden="true"><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('next')" width="24" height="24" /></svg></span>
      </button>
    </div>
    <dialog
      aria-labelledby="rh-d13-dialog-title"
      class="rh-d13-dialog"
      id="rh-d13-dialog"
      ref="dialog"
      @click="backdrop"
    >
      <div class="rh-d13-dialog-inner">
        <div class="rh-d13-dialog-top">
          <div>
            <span class="rh-eyebrow">DISCOUNT DETAILS</span>
            <h2 id="rh-d13-dialog-title">{{ selected?.code || 'Discount code' }}</h2>
          </div>
          <button
            aria-label="Close details"
            class="rh-icon-button"
            id="rh-d13-dialog-close"
            @click="dialog.close()"
            type="button"
          ><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('close')" width="24" height="24" /></svg></button>
        </div>
        <div v-if="selected" id="rh-d13-dialog-body">
          <div
            v-for="(value, label) in {
              Offer: amount(selected),
              'Eligible tickets': eligibleLabels(selected.eligible),
              Status: labels[codeStatus(selected)],
              Uses: `${selected.used} of ${selected.limit}`,
              'Remaining uses': Math.max(0, selected.limit - selected.used),
              'Start date': selected.start ? prettyDate(selected.start) : 'Immediately',
              'End date': selected.end ? prettyDate(selected.end) : 'No extra restriction',
              'Sales from this code': 'Not connected to checkout',
            }"
            :key="label"
            class="rh-d13-detail-row"
          >
            <span>{{ label }}</span
            ><strong>{{ value }}</strong>
          </div>
          <p class="rh-d13-dialog-hint">
            Each use means one completed order. These are sample figures. No payments or ticket sales are recorded here.
          </p>
          <p v-if="selected.used > 0" class="rh-d13-dialog-hint">
            <strong>Existing uses:</strong> You can’t change the code or discount in this preview after use. You can change future dates, eligible tickets, and the use limit.
          </p>
        </div>
        <div class="rh-d13-dialog-actions">
          <button
            class="rh-button rh-button-dark"
            id="rh-d13-dialog-edit"
            @click="editSelected"
            type="button"
          >
            Edit offer</button
          ><WorkspaceCopyButton
            button-class="rh-button rh-button-outline"
            compact
            text="Copy code"
            :value="selected?.code || ''"
            label="Copy discount code"
            @notify="notify"
          /><button
            class="rh-button rh-button-outline"
            id="rh-d13-dialog-done"
            @click="dialog.close()"
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </dialog>
  </section>
</template>
<style>
.event-workspace .rh-d13-dialog {
  margin: auto;
}
.event-workspace .rh-d13-dialog:not([open]) {
  display: none;
}
</style>
