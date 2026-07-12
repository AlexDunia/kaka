<script setup>
import { ref } from 'vue'

const emit = defineEmits(['select-view', 'link-created'])
const showManage = (view) => emit('select-view', view)

const baseLink = 'rushhour.ng/e/comedy-meets-dance'
const linkPresets = [
  { label: 'WhatsApp', source: 'wa', note: 'Best buyer channel', buyers: 271, clicks: 813 },
  { label: 'Instagram', source: 'ig', note: 'Good for attention', buyers: 110, clicks: 486 },
  { label: 'Direct link', source: 'direct', note: 'For bios and flyers', buyers: 148, clicks: 392 },
]

const linksGenerated = ref(false)
const isGeneratingLinks = ref(false)
const customLabel = ref('')
const showCustomLink = ref(false)
const linkFeedback = ref('')
const shareLinks = ref([])
const linkModalOpen = ref(false)
const linkModalStep = ref(1)

const createSourceLink = (item) => ({
  ...item,
  url: `${baseLink}?src=${item.source}`,
  sales: item.buyers,
})

const generateSourceLinks = () => {
  if (isGeneratingLinks.value) return

  isGeneratingLinks.value = true
  linkFeedback.value = ''
  linkModalStep.value = 1

  window.setTimeout(() => {
    shareLinks.value = linkPresets.map(createSourceLink)
    linksGenerated.value = true
    isGeneratingLinks.value = false
    linkModalOpen.value = true
    linkFeedback.value = 'Links generated. Copy the one that matches where you post.'
    emit('link-created', 'Your event links are ready to share.')
  }, 650)
}

const closeLinkModal = () => {
  linkModalOpen.value = false
}

const advanceLinkModal = () => {
  if (linkModalStep.value < 3) {
    linkModalStep.value += 1
    return
  }

  closeLinkModal()
}

const copyLink = async (link) => {
  const fullLink = `https://${link.url}`

  try {
    await navigator.clipboard?.writeText(fullLink)
    linkFeedback.value = `${link.label} link copied.`
  } catch {
    linkFeedback.value = fullLink
  }
}

const shareLink = (link) => {
  const fullLink = `https://${link.url}`
  const message = encodeURIComponent(`Grab your ticket: ${fullLink}`)
  const source = link.source.toLowerCase()

  if (source.includes('wa')) {
    window.open(`https://wa.me/?text=${message}`, '_blank', 'noopener,noreferrer')
    linkFeedback.value = 'Opening WhatsApp share.'
    return
  }

  copyLink(link)
}

const addCustomLink = () => {
  const label = customLabel.value.trim()
  if (!label) return

  const source =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 24) || 'custom'

  shareLinks.value = [
    ...shareLinks.value,
    {
      label,
      source,
      note: 'Custom tracker',
      buyers: 0,
      clicks: 0,
      sales: 0,
      url: `${baseLink}?src=${source}`,
    },
  ]
  customLabel.value = ''
  showCustomLink.value = false
  linkFeedback.value = `${label} link added.`
  emit('link-created', `${label} is ready to use.`)
}
</script>

<template>
  <div class="manage-view active" id="mv-overview">
    <div class="sections-wrap overview-wrap">
      <section v-if="!linksGenerated" class="link-flow-section link-flow-section--sales">
        <article class="card ticket-performance-card sales-link-pregen-card">
          <div class="overview-card-head ticket-card-head sales-link-pregen-head">
            <div>
              <h3>Alex, your event doesn't have a link yet</h3>
              <p>Get all your links to sell your event &mdash; one click.</p>
            </div>
            <button
              class="link-primary-action sales-link-pregen-action"
              type="button"
              :disabled="isGeneratingLinks"
              @click="generateSourceLinks"
            >
              {{ isGeneratingLinks ? 'Generating...' : 'Generate event links' }}
            </button>
          </div>
        </article>
      </section>

      <section class="generated-ticket-performance-section">
        <article class="card generated-ticket-performance-card">
          <div class="overview-card-head">
            <h3>Ticket performance</h3>
            <p>Top selling ticket types from this event.</p>
          </div>
          <div class="traffic-rows overview-traffic generated-ticket-rows">
            <div class="traffic-row">
              <div class="traffic-icon ticket-tier-icon hot">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z"
                  />
                  <path d="M12 5v14" />
                </svg>
              </div>
              <div class="traffic-info">
                <div class="traffic-name">Gold Table</div>
                <div class="traffic-count">25 sold · 5 left</div>
                <div class="traffic-bar-wrap">
                  <div class="traffic-bar-track">
                    <div class="traffic-bar-fill fill-red" style="width: 93%"></div>
                  </div>
                </div>
              </div>
              <div class="traffic-pct">93%</div>
            </div>
            <div class="traffic-row">
              <div class="traffic-icon ticket-tier-icon good">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z"
                  />
                  <path d="M12 5v14" />
                </svg>
              </div>
              <div class="traffic-info">
                <div class="traffic-name">VIP</div>
                <div class="traffic-count">38 sold · 12 left</div>
                <div class="traffic-bar-wrap">
                  <div class="traffic-bar-track">
                    <div class="traffic-bar-fill fill-teal" style="width: 76%"></div>
                  </div>
                </div>
              </div>
              <div class="traffic-pct">76%</div>
            </div>
            <div class="traffic-row">
              <div class="traffic-icon ticket-tier-icon neutral">
                <svg viewBox="0 0 24 24">
                  <path
                    d="M2 9a3 3 0 0 0 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 0 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2Z"
                  />
                  <path d="M12 5v14" />
                </svg>
              </div>
              <div class="traffic-info">
                <div class="traffic-name">General Admission</div>
                <div class="traffic-count">177 sold · 323 left</div>
                <div class="traffic-bar-wrap">
                  <div class="traffic-bar-track">
                    <div class="traffic-bar-fill fill-blue" style="width: 35%"></div>
                  </div>
                </div>
              </div>
              <div class="traffic-pct">35%</div>
            </div>
          </div>
        </article>
      </section>

      <div
        v-if="linkModalOpen"
        class="link-flow-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="linkFlowTitle"
      >
        <article class="link-flow-modal">
          <button class="link-modal-close" type="button" aria-label="Close" @click="closeLinkModal">
            x
          </button>

          <div class="link-modal-step">Step {{ linkModalStep }} of 3</div>

          <div v-if="linkModalStep === 1" class="link-modal-body">
            <h3 id="linkFlowTitle">Your links have been generated</h3>
            <p>
              WhatsApp, Instagram, and Direct now have separate links. Use them separately so every
              sale has a source.
            </p>
            <div class="link-modal-mini-list">
              <span>WhatsApp link ready</span>
              <span>Instagram link ready</span>
              <span>Direct link ready</span>
            </div>
          </div>

          <div v-else-if="linkModalStep === 2" class="link-modal-body">
            <h3 id="linkFlowTitle">Post the matching link</h3>
            <p>
              Use WhatsApp link on WhatsApp, Instagram link on Instagram, and Direct for bios,
              flyers, and simple sharing.
            </p>
            <div class="link-modal-route">
              <span>Copy</span>
              <span>Share</span>
              <span>Track</span>
            </div>
          </div>

          <div v-else class="link-modal-body">
            <h3 id="linkFlowTitle">Now the rest of the dashboard can speak clearly</h3>
            <p>
              Ticket performance, buyer channels, and next moves can all point back to the links
              people actually used.
            </p>
            <div class="link-modal-mini-list">
              <span>Ticket performance gets clearer</span>
              <span>Buyer channels stop guessing</span>
              <span>Next move becomes obvious</span>
            </div>
          </div>

          <div class="link-modal-dots" aria-hidden="true">
            <span :class="{ active: linkModalStep === 1 }"></span>
            <span :class="{ active: linkModalStep === 2 }"></span>
            <span :class="{ active: linkModalStep === 3 }"></span>
          </div>

          <div class="link-modal-footer">
            <button type="button" class="link-modal-quiet" @click="closeLinkModal">Skip</button>
            <button type="button" class="link-modal-primary" @click="advanceLinkModal">
              {{ linkModalStep === 3 ? 'Show my links' : 'Next' }}
            </button>
          </div>
        </article>
      </div>

      <section class="overview-command-grid overview-command-grid--calm">
        <article class="event-health-panel health-readout-panel">
          <div class="health-panel-head">
            <div>
              <div class="section-title compact-section-title">Event health</div>
              <h3>On track, with one thing to fix</h3>
            </div>
            <span class="health-status-pill health-status-pill--clear">82 score</span>
          </div>

          <div class="health-readout-main">
            <div class="health-readout-status">
              <span>Overall</span>
              <strong>Strong momentum</strong>
              <p>Premium demand is healthy. Keep the regular ticket moving.</p>
            </div>
            <div class="health-readout-list" aria-label="Event health summary">
              <div class="health-readout-item good">
                <span></span>
                <div>
                  <strong>VIP and tables are almost doing the selling for you.</strong>
                  <p>Scarcity is real, so use it in your next message.</p>
                </div>
              </div>
              <div class="health-readout-item good">
                <span></span>
                <div>
                  <strong>WhatsApp is the buyer channel.</strong>
                  <p>44% of buyers came from there. Do not overthink the next share.</p>
                </div>
              </div>
              <div class="health-readout-item warn">
                <span></span>
                <div>
                  <strong>General Admission is the drag.</strong>
                  <p>323 spots left. Give people a simple reason to buy this week.</p>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article class="next-move-panel next-move-panel--calm">
          <div class="next-move-head">
            <div>
              <div class="section-title compact-section-title">Next moves</div>
              <h3>Do these in this order</h3>
            </div>
            <span>Today</span>
          </div>

          <div class="next-move-list">
            <button class="next-move-item urgent" type="button" @click="showManage('promo')">
              <span class="next-move-num">01</span>
              <span class="next-move-copy">
                <strong>Create a short GA discount</strong>
                <small>Make the regular ticket decision easy. A 48-hour code is enough.</small>
              </span>
              <span class="next-move-destination">Discount</span>
            </button>

            <button class="next-move-item" type="button" @click="showManage('share')">
              <span class="next-move-num">02</span>
              <span class="next-move-copy">
                <strong>Share the offer on WhatsApp</strong>
                <small>This is already where your buyers are coming from.</small>
              </span>
              <span class="next-move-destination">Promote</span>
            </button>

            <button class="next-move-item" type="button" @click="showManage('email')">
              <span class="next-move-num">03</span>
              <span class="next-move-copy">
                <strong>Send the event-day note</strong>
                <small>Arrival time, parking, entry instructions. One clean message.</small>
              </span>
              <span class="next-move-destination">Message</span>
            </button>
          </div>
        </article>
      </section>

      <section>
        <div class="section-title">Sales trend</div>
        <div class="card">
          <div class="chart-wrap">
            <div class="chart-head">
              <div>
                <div class="chart-head-title">Tickets bought per day</div>
                <div class="chart-head-sub">Last 30 days</div>
              </div>
              <div class="chart-pills">
                <div class="cpill">7d</div>
                <div class="cpill on">30d</div>
                <div class="cpill">All</div>
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
                <linearGradient id="overviewSalesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#29B89A" stop-opacity=".22" />
                  <stop offset="100%" stop-color="#29B89A" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M15,105 L55,92 L95,88 L135,74 L175,70 L215,62 L255,54 L295,46 L335,42 L375,33 L415,26 L455,30 L495,22 L535,16 L555,12 L555,110 L15,110 Z"
                fill="url(#overviewSalesGradient)"
              />
              <path
                d="M15,105 L55,92 L95,88 L135,74 L175,70 L215,62 L255,54 L295,46 L335,42 L375,33 L415,26 L455,30 L495,22 L535,16 L555,12"
                stroke="#29B89A"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <circle cx="535" cy="16" r="4" fill="#29B89A" />
            </svg>
            <p class="chart-summary-copy">
              Sales are up this week. Keep the momentum going while premium spots still feel scarce.
            </p>
          </div>
        </div>
      </section>

      <section class="mini-metric-grid">
        <article class="mini-metric-card">
          <div class="stat-cell-label">Average spend per buyer</div>
          <div class="mini-metric-value">₦12,100</div>
        </article>
        <article class="mini-metric-card">
          <div class="stat-cell-label">Best sales day</div>
          <div class="mini-metric-value">Friday</div>
        </article>
        <article class="mini-metric-card">
          <div class="stat-cell-label">Peak buying time</div>
          <div class="mini-metric-value">7-11 PM</div>
        </article>
      </section>

      <section>
        <article class="event-readiness-card">
          <div>
            <h3>Event-day readiness</h3>
            <p>QR code ready. 612 expected. Check-in hasn't started.</p>
          </div>
          <button class="btn btn-ghost" type="button" @click="showManage('checkin')">
            Prepare check-in
          </button>
        </article>
      </section>
    </div>
  </div>
</template>
