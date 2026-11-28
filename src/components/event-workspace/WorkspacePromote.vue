<script setup>
import { pngIconUrl } from '@/constants/pngIcons'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getEventShareLinks, createEventShareLink } from '@/services/dashboardShareService'
import { DASHBOARD_PREVIEW } from '@/services/dashboardPreview'
import { useSlug } from '@/composables/useSlug'
import { formatMoneyMinor } from '@/utils/dashboardFormat'
import WorkspacePlatformIcon from './WorkspacePlatformIcon.vue'
import WorkspaceCopyButton from './WorkspaceCopyButton.vue'
import WorkspaceDiscountDetails from './WorkspaceDiscountDetails.vue'
import {
  platforms,
  platformFor,
  story,
  freshDiscount,
  validateDiscount,
  mergeShareLinks,
} from './promotionModel'

const props = defineProps({
  page: String,
  eventId: [Number, String],
  overview: Object,
  codes: Array,
  codeStatus: Function,
  persistCodes: Function,
})
const emit = defineEmits(['navigate', 'notify'])
const route = useRoute(),
  router = useRouter(),
  { generateSlug } = useSlug()
const event = computed(() => props.overview.event || {})
const tab = computed(() =>
  props.page === 'discounts' || route.query.tab === 'discounts' ? 'discounts' : 'promotion',
)
const screen = computed(() =>
  String(route.query.screen || (props.page === 'discounts' && route.query.code ? 'discount' : '')),
)
const editing = computed(() =>
  screen.value === 'edit-discount' ? String(route.query.code || '') : null,
)
const detail = computed(() => props.codes.find((c) => c.code === route.query.code))
const formPage = computed(() => ['create-discount', 'edit-discount'].includes(screen.value))
const offer = reactive(freshDiscount()),
  error = ref(''),
  search = ref(''),
  filter = ref('all'),
  createOpen = ref(false),
  createButton = ref(null)
const formHeading = ref(null),
  formElement = ref(null),
  tabButtons = ref({})
const money = (value) => formatMoneyMinor(value, props.overview.revenue?.currency || 'NGN')
const labels = {
  available: 'Available',
  paused: 'Paused',
  scheduled: 'Scheduled',
  expired: 'Expired',
  'used-up': 'Used up',
}
const tickets = computed(() =>
  (props.overview.ticket_types || []).map((t) => ({
    key: String(t.id),
    label: t.name,
    price: Number(t.price_minor || 0),
  })),
)
const eligibleLabels = (values) =>
  values?.includes('all')
    ? 'All tickets'
    : (values || [])
        .map(
          (v) =>
            tickets.value.find(
              (t) => t.key === String(v) || t.label.toLowerCase() === String(v).toLowerCase(),
            )?.label ||
            { early: 'Early bird', general: 'General admission', vip: 'VIP' }[v] ||
            v,
        )
        .join(', ')
const amount = (code) =>
  code.type === 'fixed' ? `${money(Number(code.value) * 100)} off` : `${Number(code.value)}% off`
const dateWords = (value) =>
  value
    ? new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : ''
const review = computed(() =>
  Number(offer.value) > 0
    ? `You are creating ${amount(offer)} for ${eligibleLabels(offer.eligible).toLowerCase()}. It can be used ${offer.limit || 0} times.${offer.start ? ` It starts on ${dateWords(offer.start)}.` : ''}${offer.end ? ` It ends on ${dateWords(offer.end)}.` : ''}`
    : 'Choose the saving and tickets to see your discount.',
)
const filtered = computed(() =>
  props.codes.filter(
    (c) =>
      [c.name, c.partner, c.code, eligibleLabels(c.eligible)]
        .join(' ')
        .toLowerCase()
        .includes(search.value.trim().toLowerCase()) &&
      (filter.value === 'all' || props.codeStatus(c) === filter.value),
  ),
)
const rankedCodes = computed(() => [...props.codes].sort((a, b) => b.used - a.used).slice(0, 4))
function navigate(tabName = 'discounts', extra = {}) {
  emit('navigate', {
    view: 'share',
    ...(tabName === 'discounts' ? { tab: 'discounts' } : {}),
    ...extra,
  })
}
function chooseTab(name) {
  navigate(name)
}
function detailAction(code) {
  const status = props.codeStatus(code)
  if (
    ['expired', 'used-up'].includes(status) ||
    (status === 'paused' &&
      ['expired', 'used-up'].includes(props.codeStatus({ ...code, active: true })))
  )
    emit('navigate', { view: 'promo', screen: 'edit-discount', code: code.code })
  else codeAction(code)
}
function startDiscount() {
  Object.assign(offer, freshDiscount())
  error.value = ''
  createOpen.value = true
  nextTick(() => formElement.value?.querySelector('input[pattern]')?.focus())
}
function closeDiscountForm() {
  createOpen.value = false
  if (formPage.value) navigate('discounts')
  else nextTick(() => createButton.value?.focus())
}
function clearFilters() {
  search.value = ''
  filter.value = 'all'
}
function tabKeys(e) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return
  e.preventDefault()
  const name =
    e.key === 'Home'
      ? 'promotion'
      : e.key === 'End'
        ? 'discounts'
        : tab.value === 'promotion'
          ? 'discounts'
          : 'promotion'
  chooseTab(name)
  nextTick(() => tabButtons.value[name]?.focus())
}
watch(
  () => [screen.value, route.query.code],
  async () => {
    error.value = ''
    if (formPage.value) {
      Object.assign(
        offer,
        freshDiscount(),
        editing.value && detail.value
          ? structuredClone({ ...detail.value, eligible: [...detail.value.eligible] })
          : {},
      )
      await nextTick()
      formHeading.value?.focus()
    }
  },
  { immediate: true },
)
function chooseTickets(key, checked) {
  if (key === 'all') offer.eligible = checked ? ['all'] : []
  else
    offer.eligible = checked
      ? [...offer.eligible.filter((v) => v !== 'all'), key]
      : offer.eligible.filter((v) => v !== key)
  if (!offer.eligible.length) offer.eligible = ['all']
}
function saveDiscount() {
  offer.code = offer.code.trim().toUpperCase()
  error.value = validateDiscount(offer, props.codes, editing.value)
  if (!DASHBOARD_PREVIEW && !error.value)
    error.value =
      'Discount saving isn’t connected yet. Your form is still here so you can review it.'
  if (error.value) {
    nextTick(() => formElement.value?.querySelector('[role="alert"]')?.focus())
    return
  }
  const saved = {
    ...offer,
    name: offer.name.trim(),
    partner: offer.partner.trim(),
    eligible: [...offer.eligible],
    value: Number(offer.value),
    limit: Number(offer.limit),
  }
  const next = editing.value
    ? props.codes.map((c) => (c.code === editing.value ? saved : c))
    : [saved, ...props.codes]
  if (!props.persistCodes(next)) {
    error.value = 'We couldn’t save this code. Check your browser storage and try again.'
    return
  }
  emit('notify', 'Discount code saved in this browser. Checkout isn’t connected yet.')
  createOpen.value = false
  navigate('discounts')
}
function updateCode(code, changes) {
  if (!DASHBOARD_PREVIEW) {
    emit('notify', 'Discount changes aren’t connected yet. Your code hasn’t changed.')
    return false
  }
  return props.persistCodes(
    props.codes.map((c) => (c.code === code.code ? { ...c, ...changes } : c)),
  )
}
function toggleCode(code) {
  const next = { ...code, active: !code.active }
  if (next.active && ['expired', 'used-up'].includes(props.codeStatus(next))) {
    emit('notify', 'Update this code’s dates or usage limit before resuming it.')
    return
  }
  if (updateCode(code, { active: next.active }))
    emit('notify', `${code.code} ${next.active ? 'resumed' : 'paused'} in this browser.`)
}
const actionDialog = ref(null),
  actionCode = ref(null),
  actionValue = ref(''),
  actionError = ref(''),
  actionKind = ref('')
const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: event.value.timezone || 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
function codeAction(code) {
  const status = props.codeStatus(code)
  if (status === 'scheduled') {
    if (updateCode(code, { start: today() }))
      emit('notify', `${code.code} is available now in this browser.`)
    return
  }
  if (!['expired', 'used-up'].includes(status)) return toggleCode(code)
  actionCode.value = code
  actionKind.value = status
  actionError.value = ''
  actionValue.value = status === 'expired' ? today() : Math.max(code.limit, code.used) + 25
  openDialog(actionDialog.value)
}
function applyCodeAction() {
  const code = actionCode.value
  if (actionKind.value === 'expired') {
    if (!actionValue.value || actionValue.value < today()) {
      actionError.value = 'Choose today or a later date.'
      return
    }
    if (code.used >= code.limit) {
      actionError.value = 'Increase the usage limit before reactivating this code.'
      return
    }
    if (!updateCode(code, { end: actionValue.value, start: '', active: true })) return
  } else {
    const limit = Number(actionValue.value)
    if (
      !Number.isSafeInteger(limit) ||
      limit <= Math.max(code.used, code.limit) ||
      limit > 100000
    ) {
      actionError.value = 'Enter a higher whole-number limit, up to 100,000.'
      return
    }
    if (!updateCode(code, { limit })) return
  }
  actionDialog.value.close()
  emit('notify', 'Discount code updated in this browser. Checkout isn’t connected yet.')
}

const links = ref([]),
  loading = ref(false),
  loadError = ref(''),
  phase = ref('choose'),
  linkError = ref('')
const selected = ref(platforms.slice(0, 6).map((p) => p.key)),
  ready = ref([])
const createDialog = ref(null),
  shareDialog = ref(null),
  storyDialog = ref(null),
  storyStep = ref(0),
  storyNext = ref(null)
const shareRecord = ref(null),
  creating = ref(false)
const sources = computed(() =>
  [...links.value].sort((a, b) => Number(b.buyers || 0) - Number(a.buyers || 0)),
)
const topLink = computed(() =>
  Number(sources.value[0]?.buyers) > 0 ? sources.value[0].label : 'No buyers yet',
)
const maxBuyers = computed(() => Math.max(1, ...links.value.map((l) => Number(l.buyers || 0))))
let disposed = false
const focusOrigins = new WeakMap()
function openDialog(dialog) {
  if (!dialog || dialog.open) return
  focusOrigins.set(dialog, document.activeElement)
  dialog.showModal()
}
function closed(e) {
  focusOrigins.get(e.target)?.focus?.()
}
function backdrop(e) {
  if (e.target === e.currentTarget) {
    const rect = e.currentTarget.getBoundingClientRect()
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    )
      e.currentTarget.close()
  }
}
async function loadLinks() {
  if (loading.value) return
  loading.value = true
  loadError.value = ''
  try {
    const result = await getEventShareLinks(props.eventId)
    if (!disposed) links.value = mergeShareLinks([], result || [])
  } catch {
    if (!disposed) loadError.value = 'We couldn’t load your sharing links. Try again.'
  } finally {
    if (!disposed) loading.value = false
  }
}
onMounted(loadLinks)
onBeforeUnmount(() => {
  disposed = true
  ;[createDialog, shareDialog, storyDialog, actionDialog].forEach((d) => d.value?.close())
})
const sourceUrl = (link) => {
  const url = new URL(
    router.resolve({
      name: 'event-details',
      params: { id: props.eventId, slug: generateSlug(event.value.title || 'event') },
    }).href,
    location.origin,
  )
  url.searchParams.set('src', link.source_code)
  return url.href
}
function openCreate() {
  phase.value = creating.value ? 'generating' : 'choose'
  linkError.value = ''
  openDialog(createDialog.value)
}
async function generateLinks() {
  if (creating.value) return
  if (!selected.value.length) {
    linkError.value = 'Choose at least one app for your sharing links.'
    return
  }
  if (loading.value || loadError.value) {
    linkError.value = 'Load your existing links before creating more. Try again.'
    return
  }
  creating.value = true
  phase.value = 'generating'
  linkError.value = ''
  ready.value = []
  const chosen = [...selected.value]
  try {
    // Paint the progress panel before a fast local preview response completes.
    await nextTick()
    const start = Date.now()
    for (const key of chosen) {
      if (disposed) return
      const platform = platforms.find((p) => p.key === key)
      let record = links.value.find((l) => platformFor(l).key === key)
      if (!record) {
        links.value = mergeShareLinks(
          links.value,
          await createEventShareLink(props.eventId, platform.label),
        )
        record = links.value.find((l) => platformFor(l).key === key)
        if (!record) throw new Error('Created link missing from response')
      }
      ready.value.push(record)
    }
    if (!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, 920 - (Date.now() - start))))
    if (!disposed) phase.value = 'ready'
  } catch {
    if (!disposed) {
      phase.value = 'choose'
      linkError.value =
        'We couldn’t create all your links. Saved links are listed on the page. Try again to create the rest.'
    }
  } finally {
    creating.value = false
  }
}
const linkText = (records) =>
  records.map((l) => `${l.label}\n  - ${sourceUrl(l)}`).join('\n\n\n') + '\n'
function downloadLinks(records = links.value) {
  const url = URL.createObjectURL(
    new Blob([linkText(records)], { type: 'text/plain;charset=utf-8' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = `${generateSlug(event.value.title || 'event')}-social-links.txt`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
function openShare(link) {
  shareRecord.value = link
  openDialog(shareDialog.value)
}
const destinations = computed(() =>
  [
    ...new Set([
      platformFor(shareRecord.value || {}).key,
      'whatsapp',
      'instagram',
      'telegram',
      'facebook',
      'x',
      'linkedin',
      'email',
      'tiktok',
    ]),
  ]
    .filter((k) => k !== 'other')
    .map((key) => platforms.find((p) => p.key === key)),
)
const direct = ['whatsapp', 'telegram', 'facebook', 'x', 'linkedin', 'email']
function shareHref(key) {
  if (!shareRecord.value) return '#'
  const url = sourceUrl(shareRecord.value),
    title = event.value.title,
    text = `${title} — tickets: ${url}`
  return {
    whatsapp: `https://wa.me/?text=${encodeURIComponent(text)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    x: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    email: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)}`,
  }[key]
}
async function nativeShare() {
  try {
    await navigator.share({ title: event.value.title, url: sourceUrl(shareRecord.value) })
    shareDialog.value.close()
  } catch (err) {
    if (err.name !== 'AbortError')
      emit('notify', 'We couldn’t open device sharing. Copy the link and share it in your app.')
  }
}
const hasNativeShare = ref(false)
onMounted(() => {
  hasNativeShare.value = typeof navigator.share === 'function'
})
function openStory() {
  storyStep.value = 0
  openDialog(storyDialog.value)
  nextTick(() => storyNext.value?.focus())
}
function nextStory() {
  if (storyStep.value < 3) storyStep.value++
  else {
    storyDialog.value.close()
    openCreate()
  }
}
watch(
  () => [route.query.view, route.query.tab, route.query.screen],
  () => {
    ;[createDialog, shareDialog, storyDialog, actionDialog].forEach((d) => d.value?.close())
  },
)
</script>

<template>
  <section
    class="rh-screen rh-promo-page rh33-page workspace-promote"
    data-route="promote"
    aria-label="Promote your event"
    @click.stop
    @submit.stop
    @keydown.stop
  >
    <div
      v-if="!formPage && screen !== 'discount'"
      class="rh-tabbar rh-promo-tabs"
      role="tablist"
      aria-label="Promote sections"
    >
      <button
        v-for="name in ['promotion', 'discounts']"
        :ref="
          (el) => {
            tabButtons[name] = el
          }
        "
        :id="`rh-promo-tab-${name}`"
        :key="name"
        class="rh-tab"
        role="tab"
        type="button"
        :aria-selected="tab === name"
        :tabindex="tab === name ? 0 : -1"
        :aria-controls="`rh-promo-panel-${name}`"
        @click="chooseTab(name)"
        @keydown="tabKeys"
      >
        <img class="rh-tab-icon" :src="pngIconUrl(name === 'promotion' ? 'megaphone' : 'discount')" alt="" aria-hidden="true" width="20" height="20" />
        {{ name === 'promotion' ? 'Promotion' : 'Discounts' }}
      </button>
    </div>

    <div
      v-if="!formPage && screen !== 'discount' && tab === 'promotion'"
      id="rh-promo-panel-promotion"
      class="rh-promo-panel"
      role="tabpanel"
      aria-labelledby="rh-promo-tab-promotion"
    >
      <header class="rh33-intro">
        <h1>
          You can bring more people to <strong>{{ event.title }}</strong
          >.
        </h1>
      </header>
      <div v-if="links.length" class="rh35-quick" aria-label="Promotion at a glance">
        <article class="rh35-summary">
          <span>Social links</span><strong>{{ links.length }}</strong>
        </article>
        <article class="rh35-summary">
          <span>{{ DASHBOARD_PREVIEW ? 'Top social link (preview)' : 'Top social link' }}</span
          ><strong class="rh36-top-platform">{{ topLink }}</strong>
        </article>
      </div>
      <section class="rh33-section rh33-card" aria-labelledby="rh33-share-heading">
        <div class="rh33-card-pad">
          <div class="rh33-share-layout">
            <div class="rh33-main-copy">
              <div class="rh33-section-heading">
                <div>
                  <h2 id="rh33-share-heading">See sales from social media.</h2>
                  <p>
                    Create a link for each app. See which brings buyers once live tracking is available.
                  </p>
                </div>
              </div>
              <div class="rh-story-actions">
                <button class="rh33-action secondary" type="button" @click="openStory">
                  See how it works</button
                ><button
                  class="rh33-action"
                  type="button"
                  :disabled="loading || !!loadError"
                  @click="openCreate"
                 :aria-busy="loading">
                  {{ links.length ? 'Add sharing links' : 'Create sharing links' }}
                </button>
              </div>
              <p v-if="loading" class="rh33-status" role="status">Getting your sharing links…</p>
              <div v-else-if="loadError" class="promo-error" role="alert">
                {{ loadError }}
                <button class="rh33-action secondary" type="button" @click="loadLinks">
                  Try again
                </button>
              </div>
              <p v-else class="rh33-status" role="status">
                {{
                  links.length
                    ? `${links.length} sharing link${links.length === 1 ? '' : 's'} ready`
                    : 'You haven’t created any sharing links yet.'
                }}
              </p>
            </div>
          </div>
          <div v-if="links.length" class="rh33-links-area">
            <div class="rh33-links-head">
              <div>
                <h3>Your social links</h3>
                <p class="rh38-share-reminder">
                  {{
                    DASHBOARD_PREVIEW
                      ? 'Each link is a preview using a placeholder address. Connect a live event page before sharing it with buyers.'
                      : 'Copy a link and share it with your audience. Each link helps you see where buyers find your event.'
                  }}
                </p>
              </div>
              <div class="rh33-tool-row">
                <WorkspaceCopyButton
                  button-class="rh33-tool-copy"
                  compact
                  text="Copy all"
                  :value="linkText(links)"
                  label="Copy all sharing links"
                  @notify="$emit('notify', $event)"
                /><button type="button" @click="downloadLinks()">Download links</button>
              </div>
            </div>
            <div class="rh33-link-list">
              <div v-for="link in links" :key="link.source_code" class="rh33-link-entry">
                <WorkspacePlatformIcon :platform="platformFor(link).key" />
                <div>
                  <strong>{{ link.label }}</strong
                  ><small class="rh34-only"
                    >Share this link <strong>only</strong> on
                    <em class="rh36-social-name" :data-channel="platformFor(link).key">{{
                      link.label
                    }}</em
                    >.</small
                  >
                </div>
                <div class="rh33-link-actions">
                  <WorkspaceCopyButton
                    button-class="rh33-action secondary small"
                    compact
                    text="Copy"
                    :value="sourceUrl(link)"
                    :label="`Copy ${link.label} link`"
                    @notify="$emit('notify', $event)"
                  /><button
                    class="rh33-action tertiary small"
                    type="button"
                    @click="openShare(link)"
                  >
                    Share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section v-if="links.length" class="rh33-section" aria-labelledby="rh33-sources-heading">
        <div class="rh33-section-heading">
          <div>
            <h2 id="rh33-sources-heading">Which links bring more buyers?</h2>
            <p>
              {{
                DASHBOARD_PREVIEW
                  ? 'This preview shows how link results could look. Buyer tracking isn’t connected yet.'
                  : 'See how your sharing links help people find your event and buy tickets.'
              }}
            </p>
          </div>
        </div>
        <div class="rh35-source-results" aria-live="polite">
          <div v-for="link in links" :key="link.source_code" class="rh35-source-row">
            <WorkspacePlatformIcon :platform="platformFor(link).key" />
            <div class="rh35-source-body">
              <div class="rh35-source-top">
                <strong>{{ link.label }}</strong
                ><span>{{ Number(link.buyers || 0) }} buyers</span>
              </div>
              <div class="rh35-source-bar">
                <span :style="{ width: `${(Number(link.buyers || 0) / maxBuyers) * 100}%` }" />
              </div>
              <small>{{ Number(link.views || link.unique_visitors || 0) }} visitors</small>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="screen !== 'discount' && tab === 'discounts'"
      id="rh-promo-panel-discounts"
      class="rh-promo-panel"
      role="tabpanel"
      aria-labelledby="rh-promo-tab-discounts"
    >
      <button v-if="formPage" class="promo-back" type="button" @click="navigate('discounts')">
        ← Back to discounts
      </button>
      <header class="rh33-intro rh-promo-discounts-intro">
        <h1 v-if="formPage" ref="formHeading" tabindex="-1">
          {{ editing ? 'Edit discount code' : 'Create a discount code' }}
        </h1>
        <h1 v-else id="rh-promo-discounts-heading">
          <span>You can </span><strong>sell more with a discount.</strong>
        </h1>
      </header>
      <section
        class="rh33-section rh33-card rh38-create-offer"
        aria-labelledby="rh33-offers-heading"
      >
        <div class="rh33-card-pad">
          <div class="rh33-section-heading">
            <div>
              <h2 id="rh33-offers-heading">Give buyers a special price</h2>
              <p>Choose the tickets, set the saving and create your code.</p>
            </div>
            <button
              ref="createButton"
              id="rh33-toggle-offer"
              class="rh33-action"
              type="button"
              aria-controls="rh33-offer-form"
              :aria-expanded="createOpen || formPage"
              @click="createOpen ? closeDiscountForm() : startDiscount()"
            >
              Create discount code
            </button>
          </div>
          <div v-if="editing && !detail" class="rh38-codes-empty">
            <h2>This code isn’t available</h2>
            <p>Go back to discounts and choose a code to edit.</p>
          </div>
          <form
            v-if="(createOpen || formPage) && (!editing || detail)"
            id="rh33-offer-form"
            ref="formElement"
            class="rh33-form"
            @submit.prevent="saveDiscount"
          >
            <div class="rh33-field-grid rh35-offer-form-grid">
              <label class="rh33-field"
                >Offer name<input
                  v-model="offer.name"
                  maxlength="60"
                  minlength="2"
                  placeholder="e.g. Campus Store"
                  required
              /></label>
              <label class="rh33-field"
                >For a creator or partner? <small>(optional)</small
                ><input v-model="offer.partner" maxlength="70" placeholder="e.g. Creator’s name"
              /></label>
              <label class="rh33-field"
                >Discount code<input
                  v-model="offer.code"
                  autocomplete="off"
                  maxlength="20"
                  pattern="[A-Za-z0-9-]{3,20}"
                  placeholder="e.g. CAMPUS10"
                  required
                  @input="offer.code = offer.code.toUpperCase()"
              /></label>
              <label class="rh33-field"
                >Discount type<select v-model="offer.type">
                  <option value="percent">Percent off (%)</option>
                  <option value="fixed">Amount off (₦)</option>
                </select></label
              >
              <label class="rh33-field"
                >How much off?<input
                  v-model.number="offer.value"
                  type="number"
                  min="1"
                  :max="offer.type === 'percent' ? 100 : 1000000"
                  step="1"
                  placeholder="10"
                  required
              /></label>
              <label class="rh33-field"
                >How many times can it be used?<input
                  v-model.number="offer.limit"
                  type="number"
                  :min="Math.max(1, offer.used)"
                  max="100000"
                  step="1"
                  required
              /></label>
              <label class="rh33-field"
                >Starts on (optional)<input v-model="offer.start" type="date" /></label
              ><label class="rh33-field"
                >Ends on (optional)<input
                  v-model="offer.end"
                  type="date"
                  :min="offer.start || undefined"
              /></label>
              <fieldset class="rh36-ticket-picker">
                <legend>Which tickets?</legend>
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
                <small>Choose one or more ticket types.</small>
              </fieldset>
            </div>
            <div class="rh37-review" aria-live="polite">{{ review }}</div>
            <p v-if="error" class="rh37-form-error" role="alert" tabindex="-1">{{ error }}</p>
            <div class="rh33-form-actions">
              <button class="rh33-action" type="submit">
                {{ editing ? 'Save discount code' : 'Create discount code' }}</button
              ><button class="rh33-action secondary" type="button" @click="closeDiscountForm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </section>
      <section class="rh-promo-code-summary" aria-label="Your discount codes at a glance">
        <article class="rh-promo-mini-stat">
          <span>Codes created</span><strong>{{ codes.length }}</strong
          ><small>In total</small>
        </article>
        <article class="rh-promo-mini-stat">
          <span>Available now</span
          ><strong>{{ codes.filter((c) => codeStatus(c) === 'available').length }}</strong
          ><small>Ready to use</small>
        </article>
        <article class="rh-promo-mini-stat">
          <span>Times used</span
          ><strong>{{ codes.reduce((n, c) => n + Number(c.used || 0), 0) }}</strong
          ><small>So far</small>
        </article>
      </section>
      <section class="rh33-section rh38-code-section" aria-label="Your discount codes">
        <div class="rh33-section-heading rh37-codes-title">
          <div>
            <h2>Your discount codes</h2>
            <p>See code use and availability.</p>
          </div>
        </div>
        <div class="rh38-code-shell">
          <div class="rh38-code-tools">
            <label class="rh38-code-search"
              ><svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                aria-hidden="true"
              ><image :href="pngIconUrl('search')" width="24" height="24" preserveAspectRatio="xMidYMid meet" /></svg
              ><input
                v-model="search"
                type="search"
                aria-label="Find a discount code"
                placeholder="Search discount codes" /></label
            ><label class="rh38-code-filter"
              ><span class="rh-sr">Filter by status</span
              ><select v-model="filter">
                <option value="all">All codes</option>
                <option v-for="(label, value) in labels" :key="value" :value="value">
                  {{ label }}
                </option>
              </select></label
            >
          </div>
          <div v-if="!codes.length" class="rh38-codes-empty">
            <h3>You have no discount codes yet.</h3>
            <p>Create a code to offer a ticket discount.</p>
            <button class="rh33-action secondary" type="button" @click="startDiscount">
              Create discount code
            </button>
          </div>
          <template v-else
            ><div class="rh-table-scroll rh37-table-scroll">
              <table
                class="rh-data-table rh-d13-table rh37-promo-table"
                aria-label="Your discount codes"
              >
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Offer</th>
                    <th>Eligible tickets</th>
                    <th>Orders used / limit</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="code in filtered" :key="code.code">
                    <td>
                      <strong class="rh-d13-code">{{
                        code.partner || code.name || code.code
                      }}</strong
                      ><span class="rh-d13-code-sub"
                        >{{ code.partner ? `${code.name} · ` : '' }}Code: {{ code.code }}</span
                      >
                    </td>
                    <td>
                      <span class="rh-d13-offer">{{ amount(code) }}</span>
                    </td>
                    <td>{{ eligibleLabels(code.eligible) }}</td>
                    <td>
                      <span class="rh-d13-uses">{{ code.used }} of {{ code.limit }}</span>
                      <div class="rh-d13-mini-bar">
                        <span
                          :style="{ width: `${Math.min(100, (code.used / code.limit) * 100)}%` }"
                        />
                      </div>
                    </td>
                    <td>
                      <span class="rh-d13-status" :class="codeStatus(code)">{{
                        labels[codeStatus(code)]
                      }}</span>
                    </td>
                    <td>
                      <div class="rh-d13-actions">
                        <button
                          class="rh37-view-details"
                          type="button"
                          @click="
                            $emit('navigate', {
                              view: 'promo',
                              screen: 'discount',
                              code: code.code,
                            })
                          "
                        >
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
                  <tr v-if="!filtered.length">
                    <td class="rh38-no-matches" colspan="6">
                      No codes match this search or filter.
                      <button class="rh33-action tertiary" type="button" @click="clearFilters">
                        Clear filters
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="rh38-list-count" role="status">
              Showing {{ filtered.length }} of {{ codes.length }} discount codes
            </p>
            <div class="rh37-discount-results">
              <div class="rh37-result-head">
                <h3>Which discount codes get used most?</h3>
                <span>Uses</span>
              </div>
              <div class="rh37-code-bars">
                <div v-for="code in rankedCodes" :key="code.code" class="rh37-code-result">
                  <div class="rh37-code-result-label">
                    <strong>{{ code.name || code.code }}</strong
                    ><span>{{ code.used }} uses</span>
                  </div>
                  <div class="rh37-code-track">
                    <span
                      :style="{
                        width: `${(code.used / Math.max(1, ...rankedCodes.map((c) => c.used))) * 100}%`,
                      }"
                    />
                  </div>
                </div>
              </div></div
          ></template>
        </div>
      </section>
    </div>

    <WorkspaceDiscountDetails
      v-if="screen === 'discount'"
      :item="detail"
      :code-status="codeStatus"
      :eligible-labels="eligibleLabels"
      :amount="amount"
      @back="$emit('navigate', { view: 'promo' })"
      @action="detailAction"
      @notify="$emit('notify', $event)"
    />

    <dialog
      ref="storyDialog"
      class="rh-story-dialog"
      aria-labelledby="rh-story-heading"
      @close="closed"
      @click="backdrop"
    >
      <div class="rh-story-shell">
        <div class="rh-story-photo">
          <img :src="story[storyStep].image" :alt="story[storyStep].alt" /><span
            class="rh-story-tag"
            >Rushhour · Sharing links</span
          >
        </div>
        <div class="rh-story-content">
          <button
            class="rh-story-close"
            type="button"
            aria-label="Close walkthrough"
            @click="storyDialog.close()"
          >
            ×</button
          ><span class="rh-story-count">{{ storyStep + 1 }} of 4</span>
          <h2 id="rh-story-heading" aria-live="polite">{{ story[storyStep].title }}</h2>
          <p>{{ story[storyStep].text }}</p>
          <div class="rh-story-dots" aria-hidden="true">
            <i v-for="i in 4" :key="i" :class="{ active: i === storyStep + 1 }" />
          </div>
          <div class="rh-story-buttons">
            <button class="rh33-action tertiary" type="button" @click="storyDialog.close()">
              Skip
            </button>
            <div class="rh-story-next">
              <button
                v-if="storyStep"
                class="rh33-action secondary"
                type="button"
                @click="storyStep--"
              >
                Back</button
              ><button ref="storyNext" class="rh33-action" type="button" @click="nextStory">
                {{ storyStep === 3 ? 'Create sharing links' : 'Next' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </dialog>
    <dialog
      ref="createDialog"
      class="rh33-modal"
      aria-labelledby="rh33-create-title"
      @close="closed"
      @click="backdrop"
    >
      <div class="rh33-modal-header">
        <div>
          <h2 id="rh33-create-title">Create social links</h2>
          <p>
            {{
              DASHBOARD_PREVIEW
                ? 'Choose the apps you want links for. These preview links use a placeholder address and won’t track real sales yet.'
                : 'Choose the apps you want links for. Each link leads to your event page.'
            }}
          </p>
        </div>
        <button
          class="rh33-close"
          type="button"
          aria-label="Close sharing links"
          @click="createDialog.close()"
        ><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('close')" width="24" height="24" /></svg></button>
      </div>
      <div class="rh33-modal-body">
        <form v-if="phase === 'choose'" @submit.prevent="generateLinks">
          <p class="rh38-select-instruction">Choose the social apps you want links for.</p>
          <div class="rh33-platform-grid">
            <label v-for="platform in platforms.slice(0, 6)" :key="platform.key"
              ><WorkspacePlatformIcon :platform="platform.key" /><span>{{ platform.label }}</span
              ><input v-model="selected" type="checkbox" :value="platform.key"
            /></label>
          </div>
          <details class="rh33-more-platforms">
            <summary>More platforms</summary>
            <div class="rh33-platform-grid">
              <label v-for="platform in platforms.slice(6)" :key="platform.key"
                ><WorkspacePlatformIcon :platform="platform.key" /><span>{{ platform.label }}</span
                ><input v-model="selected" type="checkbox" :value="platform.key"
              /></label>
            </div>
          </details>
          <p v-if="linkError" class="promo-error" role="alert">{{ linkError }}</p>
          <div class="rh33-modal-actions">
            <button class="rh33-action" type="submit">Generate links</button
            ><button class="rh33-action secondary" type="button" @click="createDialog.close()">
              Cancel
            </button>
          </div>
        </form>
        <div
          v-else-if="phase === 'generating'"
          class="rh33-modal-progress"
          role="status"
          aria-live="polite"
        >
          <span class="rh33-spinner" aria-hidden="true" /><span>Generating your social links…</span>
          <div class="rh34-creating-steps" aria-hidden="true">
            <span>Choose platforms</span><span>Create links</span><span>Ready to share</span>
          </div>
        </div>
        <div v-else>
          <div class="rh38-success" role="status">
            <span class="rh38-success-symbol" aria-hidden="true"><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('check')" width="24" height="24" /></svg></span>
            <div>
              <h3>Your links are ready.</h3>
              <p>Share each link on its matching app. Your links are saved below.</p>
            </div>
          </div>
          <div class="rh33-ready-list">
            <div v-for="link in ready" :key="link.source_code" class="rh33-ready-row">
              <span
                ><WorkspacePlatformIcon :platform="platformFor(link).key" />{{ link.label }}</span
              >
              <div class="rh33-link-actions">
                <WorkspaceCopyButton
                  button-class="rh33-action secondary small"
                  compact
                  text="Copy"
                  :value="sourceUrl(link)"
                  :label="`Copy ${link.label} link`"
                  @notify="$emit('notify', $event)"
                /><button class="rh33-action tertiary small" type="button" @click="openShare(link)">
                  Share
                </button>
              </div>
            </div>
          </div>
          <div class="rh33-modal-actions">
            <WorkspaceCopyButton
              button-class="rh33-action"
              compact
              text="Copy all"
              :value="linkText(ready)"
              label="Copy all generated links"
              @notify="$emit('notify', $event)"
            /><button class="rh33-action secondary" type="button" @click="downloadLinks(ready)">
              Download links</button
            ><button class="rh33-action tertiary" type="button" @click="createDialog.close()">
              Done
            </button>
          </div>
        </div>
      </div>
    </dialog>
    <dialog
      ref="shareDialog"
      class="rh33-modal"
      aria-labelledby="rh33-share-title"
      @close="closed"
      @click="backdrop"
    >
      <div class="rh33-modal-header">
        <div>
          <h2 id="rh33-share-title">
            {{ DASHBOARD_PREVIEW ? 'Share this preview link' : 'Share this link' }}
          </h2>
          <p>Choose an app to share this link, or copy it to share yourself.</p>
        </div>
        <button
          class="rh33-close"
          type="button"
          aria-label="Close share options"
          @click="shareDialog.close()"
        ><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('close')" width="24" height="24" /></svg></button>
      </div>
      <div class="rh33-modal-body">
        <div class="rh33-destination-grid">
          <button v-if="hasNativeShare" class="rh33-destination" type="button" @click="nativeShare">
            Share with your device</button
          ><template v-for="platform in destinations" :key="platform.key"
            ><a
              v-if="direct.includes(platform.key)"
              class="rh33-destination"
              :href="shareHref(platform.key)"
              target="_blank"
              rel="noopener noreferrer"
              ><WorkspacePlatformIcon :platform="platform.key" /><span>{{
                platform.label
              }}</span></a
            >
            <div v-else class="rh33-destination">
              <WorkspacePlatformIcon :platform="platform.key" /><WorkspaceCopyButton
                button-class="promo-destination-copy"
                compact
                :text="`Copy for ${platform.label}`"
                :value="shareRecord ? sourceUrl(shareRecord) : ''"
                :label="`Copy for ${platform.label}`"
                @notify="$emit('notify', $event)"
              /></div
          ></template>
        </div>
        <p class="rh33-share-footnote">
          Instagram, TikTok and some other apps may need you to paste the link. We’ll copy it for
          you.
        </p>
        <p v-if="shareRecord" class="promo-selectable-link">{{ sourceUrl(shareRecord) }}</p>
        <div class="rh33-modal-actions">
          <WorkspaceCopyButton
            button-class="rh33-action secondary"
            compact
            text="Copy link"
            :value="shareRecord ? sourceUrl(shareRecord) : ''"
            label="Copy link"
            @notify="$emit('notify', $event)"
          />
        </div>
      </div>
    </dialog>
    <dialog
      ref="actionDialog"
      class="rh33-modal rh38-reactivate-dialog"
      aria-labelledby="promo-action-title"
      @close="closed"
      @click="backdrop"
    >
      <div class="rh33-modal-header">
        <div>
          <h2 id="promo-action-title">
            {{ actionKind === 'expired' ? 'Reactivate' : 'Increase limit for' }}
            {{ actionCode?.code }}
          </h2>
          <p>
            {{
              actionKind === 'expired'
                ? 'Give this code a new end date.'
                : 'Let more buyers use this code.'
            }}
          </p>
        </div>
        <button
          class="rh33-close"
          type="button"
          aria-label="Close discount update"
          @click="actionDialog.close()"
        ><svg width="1em" height="1em" viewBox="0 0 24 24" aria-hidden="true" focusable="false" style="vertical-align: middle"><image :href="pngIconUrl('close')" width="24" height="24" /></svg></button>
      </div>
      <form class="rh38-reactivate-form" @submit.prevent="applyCodeAction">
        <label
          >{{ actionKind === 'expired' ? 'New end date' : 'New maximum uses'
          }}<input
            v-model="actionValue"
            :type="actionKind === 'expired' ? 'date' : 'number'"
            :min="
              actionKind === 'expired'
                ? today()
                : Math.max(actionCode?.used || 0, actionCode?.limit || 0) + 1
            "
            :max="actionKind === 'expired' ? undefined : 100000"
            required
        /></label>
        <p v-if="actionError" class="promo-error" role="alert">{{ actionError }}</p>
        <div class="rh33-modal-actions">
          <button class="rh33-action" type="submit">
            {{ actionKind === 'expired' ? 'Reactivate code' : 'Increase limit' }}</button
          ><button class="rh33-action secondary" type="button" @click="actionDialog.close()">
            Cancel
          </button>
        </div>
      </form>
    </dialog>
  </section>
</template>
