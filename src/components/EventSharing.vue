<script setup>
import { nextTick, ref, shallowRef } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { drawQrExport, qrFlyerLayout, qrPositions } from '@/utils/eventQrExport'
import { DocumentDuplicateIcon, QrCodeIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { getEventShareLinks, createEventShareLink } from '@/services/dashboardShareService'
import { mergeShareLinks, platformFor } from '@/components/event-workspace/promotionModel'
const props = defineProps({
  eventId: [Number, String],
  title: String,
  cover: String,
  url: String,
  owner: Boolean,
})
const share = ref(null),
  poster = ref(null),
  qr = ref(null),
  canvas = ref(null)
const links = ref([]),
  busy = ref(false),
  message = ref(''),
  loaded = ref(false)
const apps = [
  ['whatsapp', 'WhatsApp'],
  ['facebook', 'Facebook'],
  ['x', 'X'],
  ['telegram', 'Telegram'],
  ['linkedin', 'LinkedIn'],
  ['email', 'Email'],
  ['instagram', 'Instagram'],
  ['tiktok', 'TikTok'],
]
function linkFor(key) {
  const link = links.value.find((link) => platformFor(link).key === key)
  const url = new URL(props.url)
  if (props.owner && link) url.searchParams.set('src', link.source_code)
  return url.href
}
async function openShare() {
  message.value = ''
  links.value = []
  loaded.value = false
  share.value.showModal()
  if (!props.owner) return
  busy.value = true
  try {
    links.value = mergeShareLinks([], await getEventShareLinks(props.eventId))
    loaded.value = true
  } catch {
    message.value = 'We couldn’t load your sharing links. Close this panel and try again.'
  } finally {
    busy.value = false
  }
}
async function generate() {
  if (busy.value || !loaded.value) return
  busy.value = true
  message.value = ''
  try {
    for (const [key, label] of apps) {
      if (!links.value.some((link) => platformFor(link).key === key))
        links.value = mergeShareLinks(links.value, await createEventShareLink(props.eventId, label))
    }
    message.value = 'Your sharing links are ready. Each app now uses its own link.'
  } catch {
    message.value = 'Some links couldn’t be created. Try again to finish the remaining links.'
  } finally {
    busy.value = false
  }
}
async function copy(url = props.url) {
  try {
    await navigator.clipboard.writeText(url)
    message.value = 'Link copied. It’s ready to share.'
  } catch {
    message.value = 'We couldn’t copy the link. Select the event link and copy it.'
  }
}
function social(key) {
  const url = encodeURIComponent(linkFor(key)),
    title = encodeURIComponent(props.title)
  return {
    whatsapp: `https://wa.me/?text=${title}%20${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    x: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${title}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    email: `mailto:?subject=${title}&body=${url}`,
  }[key]
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    const source = new URL(src, window.location.origin)
    // Local Laravel storage is served through Vite, keeping canvas exports same-origin.
    image.src =
      import.meta.env.DEV &&
      source.hostname === window.location.hostname &&
      source.pathname.startsWith('/storage/')
        ? `${source.pathname}${source.search}`
        : source.href
  })
}
const exportMode = ref('flyer')
const qrPosition = ref('bottom-right')
const qrSize = ref(0.22)
const flyerImage = shallowRef(null)
const layout = ref(null)
let posterRequest = 0
function positionStyle(position) {
  const box = qrFlyerLayout(
    flyerImage.value.width,
    flyerImage.value.height,
    position.key,
    qrSize.value,
  )
  return {
    left: `${(box.x / box.width) * 100}%`,
    top: `${(box.y / box.height) * 100}%`,
    width: `${(box.qrSize / box.width) * 100}%`,
    height: `${(box.qrSize / box.height) * 100}%`,
  }
}
async function renderPoster() {
  const request = ++posterRequest
  message.value = ''
  loaded.value = false
  busy.value = true
  await nextTick()
  try {
    let image = flyerImage.value
    if (exportMode.value === 'flyer' && !image) {
      image = await loadImage(props.cover)
      if (request !== posterRequest) return
      flyerImage.value = image
    }
    if (request !== posterRequest) return
    layout.value = drawQrExport(canvas.value, qr.value.querySelector('canvas'), image, {
      mode: exportMode.value,
      position: qrPosition.value,
      size: qrSize.value,
    })
    canvas.value.toDataURL('image/png')
    loaded.value = true
  } catch {
    if (request === posterRequest)
      message.value = 'We could not prepare this image. Try again, or choose QR code only.'
  } finally {
    if (request === posterRequest) busy.value = false
  }
}
async function openPoster() {
  flyerImage.value = null
  poster.value.showModal()
  await renderPoster()
}
function choosePosition(position) {
  qrPosition.value = position
  renderPoster()
}
function printPoster() {
  if (!loaded.value || busy.value) return
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    message.value = 'Allow pop-ups for this site to print your image.'
    return
  }
  printWindow.opener = null
  printWindow.document.title = `Rush Hour Tickets - ${props.title}`
  const style = printWindow.document.createElement('style')
  style.textContent =
    '@page { margin: 10mm; } body { margin: 0; text-align: center; } img { max-width: 100%; max-height: 95vh; object-fit: contain; }'
  printWindow.document.head.append(style)
  const image = printWindow.document.createElement('img')
  image.alt = props.title
  image.onload = () => {
    printWindow.focus()
    printWindow.print()
  }
  image.src = canvas.value.toDataURL('image/png')
  printWindow.document.body.append(image)
}
function savePoster() {
  if (!loaded.value || busy.value) return
  try {
    const a = document.createElement('a')
    a.download = `Rush Hour ${exportMode.value === 'qr' ? 'QR' : 'Flyer'} - ${props.title.replace(/[^a-z0-9 -]/gi, '').slice(0, 80)}.png`
    a.href = canvas.value.toDataURL('image/png')
    a.click()
  } catch {
    message.value = 'We couldn’t save the image. Please try again.'
  }
}
defineExpose({ openShare })
</script>
<template>
  <button type="button" class="ep-secondary rh24-quiet-button" @click="openPoster">
    <QrCodeIcon />Print QR code
  </button>
  <dialog
    ref="share"
    class="ep-dialog"
    aria-labelledby="event-share-heading"
    @click="$event.target === share && share.close()"
  >
    <button
      class="ep-dialog-close ep-icon-button"
      aria-label="Close sharing"
      @click="share.close()"
    >
      <XMarkIcon />
    </button>
    <div class="ep-dialog-content">
      <h2 id="event-share-heading">Share this event</h2>
      <p>Invite someone to {{ title }}.</p>
      <div class="event-copy-row">
        <input
          :value="url"
          readonly
          aria-label="Event link"
          @focus="$event.target.select()"
        /><button
          class="ep-icon-button ep-secondary"
          aria-label="Copy event link"
          title="Copy event link"
          @click="copy()"
        >
          <DocumentDuplicateIcon />
        </button>
      </div>
      <div class="ep-share-links event-social-grid">
        <template v-for="[key, label] in apps" :key="key"
          ><a v-if="social(key)" :href="social(key)" target="_blank" rel="noopener noreferrer">{{
            label
          }}</a
          ><button v-else class="ep-secondary" @click="copy(linkFor(key))">
            {{ label }} <DocumentDuplicateIcon aria-hidden="true" /></button
        ></template>
      </div>
      <p>Instagram and TikTok copy a link you can paste into your post or profile.</p>
      <button v-if="owner" class="ep-primary" :disabled="busy || !loaded" @click="generate">
        {{ busy ? 'Getting your links ready…' : 'Generate event links' }}
      </button>
      <p v-if="owner">
        Each generated link tracks where your event’s visitors and buyers come from.
      </p>
      <p role="status">{{ message }}</p>
    </div>
  </dialog>
  <dialog
    ref="poster"
    class="ep-dialog"
    aria-labelledby="event-poster-heading"
    @click="$event.target === poster && poster.close()"
  >
    <button
      class="ep-dialog-close ep-icon-button"
      aria-label="Close QR code"
      @click="poster.close()"
    >
      <XMarkIcon />
    </button>
    <div class="ep-dialog-content">
      <h2 id="event-poster-heading">Your event, ready to share</h2>
      <p>Save your booking QR code on its own or place it directly on your flyer.</p>
      <fieldset class="event-export-options">
        <legend>What would you like to save?</legend>
        <label
          ><input v-model="exportMode" type="radio" value="qr" @change="renderPoster" /> QR code
          only</label
        >
        <label
          ><input v-model="exportMode" type="radio" value="flyer" @change="renderPoster" /> Flyer
          with QR code</label
        >
      </fieldset>
      <template v-if="exportMode === 'flyer'">
        <label for="event-qr-size">QR code size</label>
        <select id="event-qr-size" v-model.number="qrSize" @change="renderPoster">
          <option :value="0.16">Small</option>
          <option :value="0.22">Medium</option>
          <option :value="0.28">Large</option>
        </select>
        <p>
          Choose one of the eight squares to position your QR code. Keep important flyer details
          clear.
        </p>
      </template>
      <div ref="qr" hidden>
        <QrcodeVue :value="url" :size="600" level="M" render-as="canvas" :margin="4" />
      </div>
      <div v-show="loaded" class="event-export-preview">
        <canvas
          ref="canvas"
          class="event-poster-preview"
          :aria-label="
            exportMode === 'qr' ? 'Booking QR code preview' : 'Flyer with booking QR code preview'
          "
        />
        <div
          v-if="exportMode === 'flyer' && loaded && layout"
          role="group"
          aria-label="QR code position"
        >
          <button
            v-for="position in qrPositions"
            :key="position.key"
            type="button"
            class="event-qr-position"
            :class="{ selected: qrPosition === position.key }"
            :style="positionStyle(position)"
            :aria-label="position.label"
            :title="position.label"
            :aria-pressed="qrPosition === position.key"
            @click="choosePosition(position.key)"
          >
            <span class="event-position-label">{{ position.label }}</span>
          </button>
        </div>
      </div>
      <p role="status">{{ busy ? 'Preparing your image…' : message }}</p>
      <button v-if="!busy && !loaded" class="ep-secondary" @click="renderPoster">Try again</button>
      <div class="event-export-actions">
        <button class="ep-primary" :disabled="busy || !loaded" @click="savePoster">
          {{ exportMode === 'qr' ? 'Save QR code' : 'Save flyer' }}</button
        ><button class="ep-secondary" :disabled="busy || !loaded" @click="printPoster">
          Print
        </button>
      </div>
    </div>
  </dialog>
</template>
<style scoped>
.event-copy-row {
  display: flex;
  gap: var(--ds-space-8);
  margin-block: var(--ds-space-16);
}
.event-copy-row input {
  flex: 1;
  min-width: 0;
}
.event-social-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-12);
}
.event-social-grid svg {
  width: 18px;
  height: 18px;
}
.event-export-options {
  border: 0;
  padding: 0;
  margin-block: var(--ds-space-16);
  display: grid;
  gap: var(--ds-space-8);
}
.event-export-options label {
  display: flex;
  align-items: center;
  gap: var(--ds-space-8);
}
.event-export-options input {
  width: auto;
}
.event-export-preview {
  position: relative;
  margin-block: var(--ds-space-16);
}
.event-export-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-12);
}
.event-qr-position {
  position: absolute;
  border: 2px dashed var(--ds-color-brand);
  border-radius: var(--ds-radius-control);
  background: transparent;
  padding: 0;
}
.event-qr-position.selected {
  border-style: solid;
  box-shadow: 0 0 0 2px white;
}
.event-qr-position:hover {
  background: color-mix(in srgb, var(--ds-color-brand) 15%, transparent);
}
.event-position-label {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
}
.event-poster-preview {
  display: block;
  width: 100%;
  height: auto;
  background: white;
}
</style>
