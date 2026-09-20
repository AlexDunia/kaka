<script setup>
import { ref } from 'vue'

const emit = defineEmits(['select-view', 'link-created'])
const showManage = (view) => emit('select-view', view)

const baseLink = 'rushhour.ng/e/comedy-meets-dance'
const linkPresets = [
  { label: 'WhatsApp', source: 'wa', note: 'Where most buyers find you', buyers: 271, clicks: 813 },
  { label: 'Instagram', source: 'ig', note: 'Helping new people discover you', buyers: 110, clicks: 486 },
  { label: 'Direct link', source: 'direct', note: 'Handy for bios and flyers', buyers: 148, clicks: 392 },
]

const customLabel = ref('')
const showCustomLink = ref(false)
const linkFeedback = ref('')
const linkModalOpen = ref(false)
const linkModalStep = ref(1)

const createSourceLink = (item) => ({
  ...item,
  url: `${baseLink}?src=${item.source}`,
  sales: item.buyers,
})

const shareLinks = ref(linkPresets.map(createSourceLink))

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
    linkFeedback.value = 'Opening WhatsApp so you can share your event.'
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
  emit('link-created', `${label} is ready to use.`)
}
</script>
<template>
  <div class="manage-view active" id="mv-share">
    <div class="mv-wrap">
      <div class="mv-header">
        <div class="mv-eyebrow" style="color:var(--teal)"><svg viewBox="0 0 24 24" style="stroke:var(--teal)"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>Share event</div>
        <div class="mv-h1">Share your <em style="color:var(--teal)">event.</em></div>
        <div class="mv-p">Choose where to share and help more people find their way to your event.</div>
      </div>
      <div class="banner teal"><svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>Your buyers respond especially well on WhatsApp. It is a great place to start sharing.</div>
      <section class="link-workspace-section">
        <article class="link-workspace-card">
          <div class="link-workspace-head">
            <div>
              <div class="section-title compact-section-title">Links ready</div>
              <h3>Choose a link for every place you share</h3>
              <p>Each link helps you see where people discovered your event.</p>
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
              Create a link for another group
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
            <h3 id="linkFlowTitle">Your sharing links are ready</h3>
            <p>You now have a link for WhatsApp, Instagram, and direct sharing. Use each one in its matching place to see where your buyers find you.</p>
            <div class="link-modal-mini-list">
              <span>WhatsApp link ready</span>
              <span>Instagram link ready</span>
              <span>Direct link ready</span>
            </div>
          </div>

          <div v-else-if="linkModalStep === 2" class="link-modal-body">
            <h3 id="linkFlowTitle">Share each link in the right place</h3>
            <p>Choose WhatsApp for chats and groups, Instagram for your profile and posts, and Direct for bios, flyers, and anywhere else you share.</p>
            <div class="link-modal-route">
              <span>Copy</span>
              <span>Share</span>
              <span>Track</span>
            </div>
          </div>

          <div v-else class="link-modal-body">
            <h3 id="linkFlowTitle">See what brings people to your event</h3>
            <p>As people use your links, your dashboard will show which channels are helping your event grow.</p>
            <div class="link-modal-mini-list">
              <span>See how tickets are selling</span>
              <span>Learn where buyers find you</span>
              <span>Choose what to do next</span>
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

      <section class="overview-content-grid">
        <article class="card ticket-performance-card">
          <div class="overview-card-head ticket-card-head">
            <div>
              <h3>Ticket performance</h3>
              <p>See which tickets are moving and where a little extra sharing could help.</p>
            </div>
          </div>

          <div class="ga-focus-card">
            <div class="ga-focus-top">
              <div>
                <span class="ga-kicker">Ready for a boost</span>
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
                <strong>Give people another reason to join you.</strong>
                <span>Try a 48-hour code like GA2KOFF, then share it with your WhatsApp audience.</span>
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
            <p>See where people found your event before they bought a ticket.</p>
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
            You can find all your sharing links and channel options here in Promote.
          </div>
        </article>
      </section>

      <div class="card">
        <div style="padding:var(--s5) var(--s6);border-bottom:1px solid var(--line-soft)"><div class="sdiv">Your event link</div>
          <div class="share-link-box"><div class="share-url">rushhourtickets.com/e/comedy-meets-dance-2026</div><div class="copy-btn"><svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy link</div></div>
        </div>
        <div style="padding:var(--s5) var(--s6)"><div class="sdiv">Share on</div>
          <div class="share-grid">
            <div class="share-ch"><div class="share-ch-ico" style="background:rgba(37,211,102,.12);border:1px solid rgba(37,211,102,.2)">WA</div><div class="share-ch-name">WhatsApp</div><div class="share-ch-desc">Share to contacts and groups</div></div>
            <div class="share-ch"><div class="share-ch-ico" style="background:rgba(228,64,95,.12);border:1px solid rgba(228,64,95,.2)">IG</div><div class="share-ch-name">Instagram</div><div class="share-ch-desc">Story or post with your link</div></div>
            <div class="share-ch"><div class="share-ch-ico" style="background:rgba(29,155,240,.12);border:1px solid rgba(29,155,240,.2)">X</div><div class="share-ch-name">X / Twitter</div><div class="share-ch-desc">Tweet your event</div></div>
            <div class="share-ch"><div class="share-ch-ico" style="background:rgba(66,103,178,.12);border:1px solid rgba(66,103,178,.2)">FB</div><div class="share-ch-name">Facebook</div><div class="share-ch-desc">Share to page or groups</div></div>
            <div class="share-ch"><div class="share-ch-ico" style="background:rgba(10,102,194,.12);border:1px solid rgba(10,102,194,.2)">IN</div><div class="share-ch-name">LinkedIn</div><div class="share-ch-desc">Great for professional events</div></div>
            <div class="share-ch"><div class="share-ch-ico" style="background:rgba(242,242,244,.06);border:1px solid var(--line)">EM</div><div class="share-ch-name">Email</div><div class="share-ch-desc">Copy a ready-to-send message</div></div>
          </div>
        </div>
      </div>
      <div class="card">
        <div style="padding:var(--s5) var(--s6)"><div class="sdiv">QR code</div>
          <div class="qr-share"><div class="qr-sf"><div class="qr-sf-i"></div></div><div><div style="font-size:.84rem;font-weight:700;color:var(--t-hi);margin-bottom:var(--s2)">Share with a QR code</div><div style="font-size:.76rem;font-weight:500;color:var(--t-lo);line-height:1.55;margin-bottom:var(--s3)">Put this on flyers and posters. People scan it and land straight on your ticket page.</div><div class="qr-btn blue" style="display:inline-flex"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download QR</div></div></div>
        </div>
      </div>
    </div>
  </div>
</template>
