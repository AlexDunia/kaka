<script setup>
import { ref } from 'vue'

const emit = defineEmits(['select-view'])
const showManage = (view) => emit('select-view', view)

const baseLink = 'rushhour.ng/e/comedy-meets-dance'
const linkPresets = [
  { label: 'WhatsApp', source: 'wa', note: 'Best buyer channel', buyers: 271, clicks: 813 },
  { label: 'Instagram', source: 'ig', note: 'Good for attention', buyers: 110, clicks: 486 },
  { label: 'Direct link', source: 'direct', note: 'For bios and flyers', buyers: 148, clicks: 392 },
]

const linkImpactCards = [
  { label: 'Ticket performance', copy: 'Sales from each link feed back into the ticket story.' },
  { label: 'Buyer channels', copy: 'You see which crowd is actually buying, not just clicking.' },
  { label: 'Next moves', copy: 'The dashboard can tell you where to push again.' },
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

  const source = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 24) || 'custom'

  shareLinks.value = [
    ...shareLinks.value,
    { label, source, note: 'Custom tracker', buyers: 0, clicks: 0, sales: 0, url: `${baseLink}?src=${source}` },
  ]
  customLabel.value = ''
  showCustomLink.value = false
  linkFeedback.value = `${label} link added.`
}
</script>

<template>
  <div class="manage-view active" id="mv-overview">
    <div class="sections-wrap overview-wrap">
      <section class="link-flow-section">
        <article class="link-generator-card link-generator-card--flow">
          <div class="link-flow-hero">
            <div class="link-flow-copy">
              <div class="section-title compact-section-title">Promote</div>
              <h2>{{ linksGenerated ? 'Your sharing links are ready' : 'Generate links before you share' }}</h2>
              <p>
                Every place you post should have its own link. WhatsApp gets one, Instagram gets one,
                and your direct event link gets one too.
              </p>
            </div>

            <div class="link-flow-action-panel">
              <span>{{ linksGenerated ? `${shareLinks.length} links generated` : 'Ready when you are' }}</span>
              <button
                class="link-primary-action"
                type="button"
                :disabled="isGeneratingLinks"
                @click="generateSourceLinks"
              >
                {{ isGeneratingLinks ? 'Generating...' : linksGenerated ? 'Generate again' : 'Generate my links' }}
              </button>
            </div>
          </div>

          <div class="link-flow-preview" aria-label="Where generated links help">
            <div v-for="item in linkImpactCards" :key="item.label" class="link-flow-preview-item">
              <strong>{{ item.label }}</strong>
              <span>{{ item.copy }}</span>
            </div>
          </div>
        </article>
      </section>

      <section v-if="linksGenerated" class="link-workspace-section">
        <article class="link-workspace-card">
          <div class="link-workspace-head">
            <div>
              <div class="section-title compact-section-title">Links ready</div>
              <h3>Use the right link in the right place</h3>
              <p>Copy the exact link for where you are posting. That is how the dashboard knows what worked.</p>
            </div>
            <button type="button" class="link-workspace-help" @click="linkModalStep = 1; linkModalOpen = true">
              See how it works
            </button>
          </div>

          <div class="link-workspace-stats">
            <div>
              <strong>{{ shareLinks.length }}</strong>
              <span>active links</span>
            </div>
            <div>
              <strong>1,691</strong>
              <span>tracked clicks</span>
            </div>
            <div>
              <strong>529</strong>
              <span>matched buyers</span>
            </div>
          </div>

          <div class="share-link-list" aria-label="Generated event links">
            <div v-for="link in shareLinks" :key="link.source" class="share-link-row">
              <div>
                <strong>{{ link.label }}</strong>
                <span>{{ link.note }}</span>
              </div>
              <code>{{ link.url }}</code>
              <div class="share-link-actions">
                <button type="button" @click="copyLink(link)">Copy</button>
                <button type="button" @click="shareLink(link)">Share</button>
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
              Track somewhere specific
            </button>
            <form v-else class="custom-link-form" @submit.prevent="addCustomLink">
              <input v-model="customLabel" type="text" placeholder="e.g. church group, school alumni" />
              <button type="submit">Create</button>
              <button type="button" @click="showCustomLink = false; customLabel = ''">Cancel</button>
            </form>
          </div>

          <p v-if="linkFeedback" class="link-feedback">{{ linkFeedback }}</p>
        </article>
      </section>

      <div v-if="linkModalOpen" class="link-flow-overlay" role="dialog" aria-modal="true" aria-labelledby="linkFlowTitle">
        <article class="link-flow-modal">
          <button class="link-modal-close" type="button" aria-label="Close" @click="closeLinkModal">x</button>

          <div class="link-modal-step">Step {{ linkModalStep }} of 3</div>

          <div v-if="linkModalStep === 1" class="link-modal-body">
            <h3 id="linkFlowTitle">Your links have been generated</h3>
            <p>WhatsApp, Instagram, and Direct now have separate links. Use them separately so every sale has a source.</p>
            <div class="link-modal-mini-list">
              <span>WhatsApp link ready</span>
              <span>Instagram link ready</span>
              <span>Direct link ready</span>
            </div>
          </div>

          <div v-else-if="linkModalStep === 2" class="link-modal-body">
            <h3 id="linkFlowTitle">Post the matching link</h3>
            <p>Use WhatsApp link on WhatsApp, Instagram link on Instagram, and Direct for bios, flyers, and simple sharing.</p>
            <div class="link-modal-route">
              <span>Copy</span>
              <span>Share</span>
              <span>Track</span>
            </div>
          </div>

          <div v-else class="link-modal-body">
            <h3 id="linkFlowTitle">Now the rest of the dashboard can speak clearly</h3>
            <p>Ticket performance, buyer channels, and next moves can all point back to the links people actually used.</p>
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

      <section class="overview-content-grid">
        <article class="card ticket-performance-card">
          <div class="overview-card-head ticket-card-head">
            <div>
              <h3>Ticket performance</h3>
              <p>Start with the ticket that needs action. Everything else is secondary.</p>
            </div>
          </div>

          <div class="ga-focus-card">
            <div class="ga-focus-top">
              <div>
                <span class="ga-kicker">Needs attention</span>
                <h4>General Admission</h4>
                <p>177 sold. 323 still open.</p>
              </div>
              <div class="ga-price-block">
                <strong>₦10,000</strong>
                <span>₦1,770,000 earned</span>
              </div>
            </div>

            <div class="ga-progress-block">
              <div class="ga-progress-copy">
                <span>35% sold</span>
                <span>500 total</span>
              </div>
              <div class="ga-progress-track"><div class="ga-progress-fill"></div></div>
            </div>

            <div class="ga-action-strip">
              <div>
                <strong>Make this obvious for buyers.</strong>
                <span>Try a 48-hour code like GA2KOFF, then share it on WhatsApp.</span>
              </div>
              <button type="button" @click="showManage('promo')">Create code</button>
            </div>
          </div>

          <div class="ticket-rest-list" aria-label="Other ticket types">
            <div class="ticket-rest-row">
              <div>
                <strong>Early Bird</strong>
                <span>61 sold, 89 left</span>
              </div>
              <em class="ticket-state good">Healthy</em>
              <p>₦305,000</p>
            </div>
            <div class="ticket-rest-row">
              <div>
                <strong>VIP</strong>
                <span>Only 12 left</span>
              </div>
              <em class="ticket-state good">Selling fast</em>
              <p>₦1,140,000</p>
            </div>
            <div class="ticket-rest-row">
              <div>
                <strong>Gold Table</strong>
                <span>Only 5 tables left</span>
              </div>
              <em class="ticket-state hot">Almost full</em>
              <p>₦4,200,000</p>
            </div>
          </div>
        </article>

        <article class="card">
          <div class="overview-card-head">
            <h3>Top buyer channels</h3>
            <p>These are purchases by source, so the traffic detail is not repeated elsewhere.</p>
          </div>
          <div class="traffic-rows overview-traffic">
            <div class="traffic-row">
              <div class="traffic-icon" style="background:rgba(37,211,102,.12);border:1px solid rgba(37,211,102,.22);">
                <svg viewBox="0 0 24 24" style="stroke:#25d366"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.2 2.2L16.5 8" /></svg>
              </div>
              <div class="traffic-info">
                <div class="traffic-name">WhatsApp</div>
                <div class="traffic-count">271 buyers</div>
                <div class="traffic-bar-wrap"><div class="traffic-bar-track"><div class="traffic-bar-fill fill-teal" style="width:44%"></div></div></div>
              </div>
              <div class="traffic-pct">44%</div>
            </div>
            <div class="traffic-row">
              <div class="traffic-icon" style="background:var(--blue-bg);border:1px solid var(--blue-border);">
                <svg viewBox="0 0 24 24" style="stroke:var(--blue)"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
              </div>
              <div class="traffic-info">
                <div class="traffic-name">Direct link</div>
                <div class="traffic-count">148 buyers</div>
                <div class="traffic-bar-wrap"><div class="traffic-bar-track"><div class="traffic-bar-fill fill-blue" style="width:24%"></div></div></div>
              </div>
              <div class="traffic-pct">24%</div>
            </div>
            <div class="traffic-row">
              <div class="traffic-icon" style="background:rgba(228,64,95,.12);border:1px solid rgba(228,64,95,.22);">
                <svg viewBox="0 0 24 24" style="stroke:var(--red)"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /></svg>
              </div>
              <div class="traffic-info">
                <div class="traffic-name">Instagram</div>
                <div class="traffic-count">110 buyers</div>
                <div class="traffic-bar-wrap"><div class="traffic-bar-track"><div class="traffic-bar-fill fill-red" style="width:18%"></div></div></div>
              </div>
              <div class="traffic-pct">18%</div>
            </div>
          </div>
          <div class="overview-note">
            Full sharing links, platform posts, and source setup stay inside Promote.
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
            <svg class="chart-svg" viewBox="0 0 580 130" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="0" y1="110" x2="580" y2="110" stroke="rgba(255,255,255,.08)" stroke-width="1" />
              <line x1="0" y1="80" x2="580" y2="80" stroke="rgba(255,255,255,.08)" stroke-width="1" />
              <line x1="0" y1="50" x2="580" y2="50" stroke="rgba(255,255,255,.08)" stroke-width="1" />
              <defs>
                <linearGradient id="overviewSalesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#29B89A" stop-opacity=".22" />
                  <stop offset="100%" stop-color="#29B89A" stop-opacity="0" />
                </linearGradient>
              </defs>
              <path d="M15,105 L55,92 L95,88 L135,74 L175,70 L215,62 L255,54 L295,46 L335,42 L375,33 L415,26 L455,30 L495,22 L535,16 L555,12 L555,110 L15,110 Z" fill="url(#overviewSalesGradient)" />
              <path d="M15,105 L55,92 L95,88 L135,74 L175,70 L215,62 L255,54 L295,46 L335,42 L375,33 L415,26 L455,30 L495,22 L535,16 L555,12" stroke="#29B89A" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />
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
          <button class="btn btn-ghost" type="button" @click="showManage('checkin')">Prepare check-in</button>
        </article>
      </section>
    </div>
  </div>
</template>