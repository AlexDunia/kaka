<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useSlug } from '@/composables/useSlug'
import {
  createEventShareLink,
  getEventShareLinks,
} from '@/services/dashboardShareService'
import {
  formatMoneyMinor,
  formatNumber,
  formatPercent,
  sourceNote,
  unitNoun,
} from '@/utils/dashboardFormat'

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  overview: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const { generateSlug } = useSlug()

const emit = defineEmits([
  'select-view',
  'link-created',
  'refresh-overview',
])

const links = ref([])
const loading = ref(false)
const creating = ref(false)
const error = ref('')
const customLabel = ref('')
const showCustomLink = ref(false)
const linkFeedback = ref('')

const trackedViews = computed(() =>
  links.value.reduce(
    (sum, link) => sum + Number(link.views || 0),
    0,
  ),
)

const matchedBuyers = computed(() =>
  links.value.reduce(
    (sum, link) => sum + Number(link.buyers || 0),
    0,
  ),
)

const topSources = computed(() =>
  (props.overview.sources || [])
    .filter(
      (source) =>
        source.source_code !== 'unattributed'
        && Number(source.buyers || 0) > 0,
    )
    .slice(0, 4),
)

const publicUrl = computed(() => {
  if (!props.event?.id) return window.location.origin

  const href = router.resolve({
    name: 'event-details',
    params: {
      id: props.event.id,
      slug: generateSlug(props.event.title || 'event'),
    },
  }).href

  return new URL(href, window.location.origin).toString()
})

const sourceUrl = (sourceCode) => {
  const url = new URL(publicUrl.value)
  url.searchParams.set('src', sourceCode)
  return url.toString()
}

const displayUrl = (sourceCode) =>
  sourceUrl(sourceCode)
    .replace(/^https?:\/\//, '')

const loadLinks = async () => {
  if (!props.event?.id) return

  loading.value = true
  error.value = ''

  try {
    links.value = await getEventShareLinks(
      props.event.id,
    )
  } catch (requestError) {
    error.value =
      requestError?.response?.data?.message
      || 'We could not load your sharing links.'
  } finally {
    loading.value = false
  }
}

const copyLink = async (link) => {
  const fullLink = sourceUrl(link.source_code)

  try {
    await navigator.clipboard.writeText(fullLink)
    linkFeedback.value = `${link.label} link copied.`
  } catch {
    linkFeedback.value = fullLink
  }
}

const shareLink = async (link) => {
  const fullLink = sourceUrl(link.source_code)

  if (navigator.share) {
    try {
      await navigator.share({
        title: props.event.title,
        text: `Grab your ticket for ${props.event.title}`,
        url: fullLink,
      })

      linkFeedback.value = `${link.label} share opened.`
      return
    } catch {
      // Falling back to channel-specific/copy behavior is intentional.
    }
  }

  if (link.source_code === 'wa') {
    const message = encodeURIComponent(
      `Grab your ticket for ${props.event.title}: ${fullLink}`,
    )

    window.open(
      `https://wa.me/?text=${message}`,
      '_blank',
      'noopener,noreferrer',
    )

    linkFeedback.value = 'Opening WhatsApp.'
    return
  }

  await copyLink(link)
}

const addCustomLink = async () => {
  const label = customLabel.value.trim()

  if (!label || creating.value) return

  creating.value = true
  error.value = ''

  try {
    links.value = await createEventShareLink(
      props.event.id,
      label,
    )

    customLabel.value = ''
    showCustomLink.value = false
    linkFeedback.value = `${label} link added.`

    emit(
      'link-created',
      `${label} is ready to use.`,
    )

    emit('refresh-overview')
  } catch (requestError) {
    error.value =
      requestError?.response?.data?.message
      || 'We could not create that link.'
  } finally {
    creating.value = false
  }
}

const tierCopy = (tier) => {
  const sold = Number(tier.sold_units || 0)
  const left = Number(tier.available_units || 0)

  return `${formatNumber(sold)} ${unitNoun(tier, sold)} sold · `
    + `${formatNumber(left)} ${unitNoun(tier, left)} left`
}


const copyBaseLink = async () => {
  try {
    await navigator.clipboard.writeText(publicUrl.value)
    linkFeedback.value = 'Base event link copied.'
  } catch {
    linkFeedback.value = publicUrl.value
  }
}

watch(
  () => props.event?.id,
  () => loadLinks(),
)

onMounted(loadLinks)
</script>

<template>
  <div
    class="manage-view active"
    id="mv-share"
  >
    <div class="mv-wrap">
      <div class="mv-header">
        <div
          class="mv-eyebrow"
          style="color:var(--teal)"
        >
          Share event
        </div>

        <div class="mv-h1">
          Share your
          <em style="color:var(--teal)">event.</em>
        </div>

        <div class="mv-p">
          Every link below has its own source code, so the dashboard can match visits and buyers without trusting a number from the browser.
        </div>
      </div>

      <div
        v-if="error"
        class="banner"
        style="color:var(--red)"
      >
        {{ error }}
      </div>

      <section class="link-workspace-section">
        <article class="link-workspace-card">
          <div class="link-workspace-head">
            <div>
              <div class="section-title compact-section-title">
                Links ready
              </div>

              <h3>
                Choose a link for every place you share
              </h3>

              <p>
                Visits are deduplicated per person and event each hour, and purchases are attributed server-side.
              </p>
            </div>
          </div>

          <div class="link-workspace-stats">
            <div>
              <strong>{{ formatNumber(links.length) }}</strong>
              <span>active links</span>
            </div>

            <div>
              <strong>{{ formatNumber(trackedViews) }}</strong>
              <span>tracked views</span>
            </div>

            <div>
              <strong>{{ formatNumber(matchedBuyers) }}</strong>
              <span>matched buyers</span>
            </div>
          </div>

          <div
            v-if="loading"
            class="overview-note"
          >
            Loading your links…
          </div>

          <div
            v-else
            class="share-link-list"
            aria-label="Generated event links"
          >
            <div
              v-for="link in links"
              :key="link.id"
              class="share-link-row"
            >
              <div>
                <strong>{{ link.label }}</strong>
                <span>
                  {{ sourceNote(link.source_code) }} ·
                  {{ formatNumber(link.views) }} views ·
                  {{ formatNumber(link.buyers) }} buyers ·
                  {{ formatPercent(link.conversion_percent) }} conversion
                </span>
              </div>

              <code>
                {{ displayUrl(link.source_code) }}
              </code>

              <div class="share-link-actions">
                <button
                  type="button"
                  @click="copyLink(link)"
                >
                  Copy
                </button>

                <button
                  type="button"
                  @click="shareLink(link)"
                >
                  Share
                </button>
              </div>
            </div>
          </div>

          <div class="custom-link-box">
            <button
              v-if="!showCustomLink"
              type="button"
              class="custom-link-trigger"
              @click="showCustomLink = true"
            >
              Create a link for another group
            </button>

            <form
              v-else
              class="custom-link-form"
              @submit.prevent="addCustomLink"
            >
              <input
                v-model="customLabel"
                type="text"
                maxlength="60"
                placeholder="e.g. church group, school alumni"
              />

              <button
                type="submit"
                :disabled="creating"
              >
                {{ creating ? 'Creating…' : 'Create' }}
              </button>

              <button
                type="button"
                :disabled="creating"
                @click="
                  showCustomLink = false;
                  customLabel = '';
                "
              >
                Cancel
              </button>
            </form>
          </div>

          <p
            v-if="linkFeedback"
            class="link-feedback"
          >
            {{ linkFeedback }}
          </p>
        </article>
      </section>

      <section class="overview-content-grid">
        <article class="card ticket-performance-card">
          <div class="overview-card-head ticket-card-head">
            <div>
              <h3>Ticket performance</h3>
              <p>
                Current paid sales for this event.
              </p>
            </div>
          </div>

          <div
            v-if="overview.ticket_types?.length"
            class="ticket-rest-list"
          >
            <div
              v-for="tier in overview.ticket_types"
              :key="tier.id"
              class="ticket-rest-row"
            >
              <div>
                <strong>{{ tier.name }}</strong>
                <span>{{ tierCopy(tier) }}</span>
              </div>

              <em class="ticket-state good">
                {{ formatPercent(tier.sold_percent) }}
              </em>

              <p>
                {{
                  formatMoneyMinor(
                    tier.revenue_minor,
                    overview.revenue.currency,
                  )
                }}
              </p>
            </div>
          </div>

          <div
            v-else
            class="overview-note"
          >
            No paid ticket tiers to show yet.
          </div>
        </article>

        <article class="card">
          <div class="overview-card-head">
            <h3>Top buyer channels</h3>
            <p>
              Buyers are assigned once to their most recent purchase source, so the percentages stay understandable.
            </p>
          </div>

          <div
            v-if="topSources.length"
            class="traffic-rows overview-traffic"
          >
            <div
              v-for="source in topSources"
              :key="source.source_code"
              class="traffic-row"
            >
              <div class="traffic-info">
                <div class="traffic-name">
                  {{ source.label }}
                </div>

                <div class="traffic-count">
                  {{ formatNumber(source.buyers) }} buyers ·
                  {{
                    formatMoneyMinor(
                      source.revenue_minor,
                      overview.revenue.currency,
                    )
                  }}
                </div>

                <div class="traffic-bar-wrap">
                  <div class="traffic-bar-track">
                    <div
                      class="traffic-bar-fill fill-teal"
                      :style="{
                        width: `${Math.min(100, Number(source.buyer_share_percent || 0))}%`,
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
            Source performance will appear after people start using your tracked links.
          </div>
        </article>
      </section>

      <div class="card">
        <div
          style="
            padding:var(--s5) var(--s6);
            border-bottom:1px solid var(--line-soft);
          "
        >
          <div class="sdiv">
            Base event link
          </div>

          <div class="share-link-box">
            <div class="share-url">
              {{ publicUrl }}
            </div>

            <button
              class="copy-btn"
              type="button"
              @click="copyBaseLink"
            >
              Copy link
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
