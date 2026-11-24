<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import QrcodeVue from 'qrcode.vue'
import { formatMoneyMinor } from '@/utils/dashboardFormat'
const props = defineProps({ event: Object, guests: Array, preview: Boolean })
const emit = defineEmits(['scan'])
const dialog = ref(null),
  mode = ref('scan'),
  video = ref(null),
  error = ref(''),
  cameraRunning = ref(false),
  cameraStarting = ref(false)
const order = ref(null),
  entrance = ref(null)
let stream = null,
  frame = null,
  previousFocus = null,
  cameraVersion = 0,
  disposed = false

const money = (value) => formatMoneyMinor(value, order.value?.currency || 'NGN')
const samplePrice = { 'Early bird': 500000, 'General admission': 1000000, VIP: 2500000 }
const orderGuests = computed(() => {
  if (!props.preview)
    return (props.guests || []).filter((guest) => order.value?.itemIds?.includes(guest.orderItemId))
  const ids = order.value?.guests?.map((g) => (typeof g === 'string' ? g : g.id)) || []
  return (props.guests || []).filter((g) => ids.includes(g.id) || g.email === order.value?.email)
})
const receiptTotal = computed(() =>
  !props.preview
    ? order.value?.amountMinor || 0
    : orderGuests.value.reduce((total, guest) => total + (samplePrice[guest.type] || 0), 0),
)
const entranceUrl = computed(() => {
  const url = new URL(location.href)
  url.searchParams.set('view', 'checkin')
  if (entrance.value?.id) url.searchParams.set('entrance', String(entrance.value.id))
  return url.href
})
async function open(kind, value) {
  previousFocus = document.activeElement
  mode.value = kind
  error.value = ''
  if (kind === 'receipt') order.value = value
  if (kind === 'entrance') entrance.value = value
  await nextTick()
  dialog.value.showModal()
}

function stopCamera() {
  cameraVersion++
  cameraStarting.value = false
  if (frame) cancelAnimationFrame(frame)
  frame = null
  stream?.getTracks().forEach((track) => track.stop())
  stream = null
  cameraRunning.value = false
  if (video.value) video.value.srcObject = null
}
function close() {
  stopCamera()
  dialog.value.close()
  previousFocus?.focus()
}
async function startCamera() {
  if (cameraStarting.value || cameraRunning.value || disposed) return
  const version = ++cameraVersion
  cameraStarting.value = true
  error.value = ''
  if (!('BarcodeDetector' in window)) {
    error.value =
      'Camera scanning isn’t supported in this browser. Close this window and enter the ticket code instead.'
    cameraStarting.value = false
    return
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    error.value =
      'We couldn’t open your camera. Use a secure browser connection or enter the ticket code instead.'
    cameraStarting.value = false
    return
  }
  try {
    const acquired = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    })
    if (disposed || version !== cameraVersion) {
      acquired.getTracks().forEach((track) => track.stop())
      return
    }
    stream = acquired
    cameraStarting.value = false
    cameraRunning.value = true
    await nextTick()
    if (disposed || version !== cameraVersion || !video.value) return
    video.value.srcObject = stream
    await video.value.play()
    const detector = new window.BarcodeDetector({ formats: ['qr_code'] })
    const scan = async () => {
      if (!stream || disposed || version !== cameraVersion) return
      try {
        const found = await detector.detect(video.value)
        if (disposed || version !== cameraVersion) return
        if (found.length) {
          let code = found[0].rawValue
          if (!props.preview) {
            emit('scan', code)
            close()
            return
          }
          try {
            const data = JSON.parse(code)
            code = data.ticket || data.id || code
          } catch {
            /* A plain ticket code does not need JSON parsing. */
          }
          const guest = props.guests?.find(
            (g) => g.id.toUpperCase() === String(code).trim().toUpperCase(),
          )
          if (guest) {
            emit('scan', guest.id)
            close()
            return
          }
          error.value =
            'This ticket wasn’t found for your event. Try another ticket or enter its code.'
        }
      } catch {
        error.value = 'We couldn’t read that ticket. Hold the code steady and try again.'
      }
      if (!disposed && version === cameraVersion) frame = requestAnimationFrame(scan)
    }
    if (!disposed && version === cameraVersion) frame = requestAnimationFrame(scan)
  } catch {
    stopCamera()
    error.value =
      'We couldn’t open your camera. Check camera access in your browser, or enter the ticket code instead.'
  }
}
function printReceipt() {
  window.print()
}
onBeforeUnmount(() => {
  disposed = true
  stopCamera()
  dialog.value?.close()
})
defineExpose({ open })
</script>
<template>
  <dialog
    ref="dialog"
    class="workspace-dialog workspace-support-dialog"
    :aria-label="
      mode === 'scan'
        ? 'Scan a ticket'
        : mode === 'receipt'
          ? 'Purchase receipt'
          : mode === 'entrance'
            ? 'Entrance details'
            : 'Sharing your event'
    "
    @cancel="stopCamera"
    @close="stopCamera"
  >
    <template v-if="mode === 'scan'"
      ><h2>Scan a ticket</h2>
      <p>Point your camera at the QR code on the guest’s ticket.</p>
      <video v-if="cameraRunning" ref="video" playsinline muted class="workspace-camera" />
      <p v-if="error" role="alert">{{ error }}</p>
      <div class="rh-form-actions">
        <button class="rh-button rh-button-outline" @click="close">Close</button
        ><button
          v-if="!cameraRunning"
          :disabled="cameraStarting"
          class="rh-button rh-button-dark"
          @click="startCamera"
        >
          Start camera
        </button>
      </div></template
    >
    <template v-else-if="mode === 'receipt' && order"
      ><article class="workspace-print-receipt">
        <span class="rh-wordmark"
          ><span class="rh-wordmark-name">Rush Hour</span
          ><span class="rh-wordmark-tickets">Tickets</span></span
        >
        <p class="rh-note">{{ preview ? 'Sample purchase receipt' : 'Purchase receipt' }}</p>
        <h2>{{ event?.title }}</h2>
        <div class="rh-detail-list">
          <div>
            <span>Order</span><strong>{{ order.id }}</strong>
          </div>
          <div>
            <span>Buyer</span><strong>{{ order.buyer }}</strong>
          </div>
          <div>
            <span>Email address</span><strong>{{ order.email }}</strong>
          </div>
          <div>
            <span>Date bought</span><strong>{{ order.purchased }}</strong>
          </div>
        </div>
        <table class="rh-data-table">
          <thead>
            <tr>
              <th>Guest / ticket</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="guest in orderGuests" :key="guest.id">
              <td>
                <strong>{{ guest.name }}</strong
                ><small class="workspace-cell-note">{{ guest.type }} · {{ guest.id }}</small>
              </td>
              <td>{{ money(samplePrice[guest.type]) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th>Total at sample ticket prices</th>
              <td>
                <strong>{{ money(receiptTotal) }}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
        <p class="rh-note">
          This receipt shows the reference’s sample purchase. It isn’t a receipt for a live payment.
        </p>
      </article>
      <div class="rh-form-actions workspace-no-print">
        <button class="rh-button rh-button-outline" @click="close">Close receipt</button
        ><button class="rh-button rh-button-dark" @click="printReceipt">Print receipt</button>
      </div></template
    >
    <template v-else-if="mode === 'entrance' && entrance"
      ><h2>{{ entrance.name }}</h2>
      <p>{{ entrance.contact || 'No entrance contact added yet.' }}</p>
      <QrcodeVue :value="entranceUrl" :size="192" level="M" class="workspace-entrance-qr" />
      <p class="rh-note">
        This preview link opens the event’s check-in screen. Staff permissions still need to be
        connected.
      </p>
      <label class="rh-field"
        ><span>Entrance link</span
        ><input :value="entranceUrl" readonly @focus="$event.target.select()"
      /></label>
      <div class="rh-form-actions">
        <button class="rh-button rh-button-outline" @click="close">Close entrance details</button
        ><button class="rh-button rh-button-dark" @click="printReceipt">Print entrance QR</button>
      </div></template
    >
  </dialog>
</template>
