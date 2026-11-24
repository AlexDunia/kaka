<script setup>
import { useAuthStore } from '@/stores/auth'
import { onBeforeUnmount, ref, watch } from 'vue'
import { getEventForEditing } from '@/services/createEventService'
import { changeEventLifecycle } from '@/services/eventFinanceService'
import { operationsError } from '@/services/eventOperationsService'
import { useDashboardStore } from '@/stores/dashboard'
import { useEventStore } from '@/stores/events'
const props = defineProps({ eventId: [String, Number] })
const emit = defineEmits(['changed'])
const auth = useAuthStore()
const dashboard = useDashboardStore(),
  events = useEventStore()
const version = ref(null),
  state = ref(''),
  action = ref('close_sales'),
  reason = ref(''),
  cutoff = ref('')
const busy = ref(false),
  error = ref(''),
  notice = ref(''),
  conflict = ref(false)
let generation = 0
async function reload() {
  const request = generation
  try {
    const record = (await getEventForEditing(props.eventId)).data
    if (request !== generation) return
    version.value = record.version
    state.value = record.lifecycle_state || record.form?.lifecycle_state || ''
    conflict.value = false
    error.value = ''
  } catch (e) {
    if (request === generation) error.value = operationsError(e)
  }
}
async function submit() {
  if (busy.value || !version.value || conflict.value) return
  if (
    action.value === 'set_cutoff' &&
    cutoff.value &&
    !/T.*(?:Z|[+-][0-9]{2}:[0-9]{2})$/.test(cutoff.value)
  ) {
    error.value =
      'Enter a date and time with its timezone offset, such as 2030-06-21T17:00:00+01:00.'
    return
  }
  busy.value = true
  const request = generation
  try {
    const payload = { version: version.value, action: action.value }
    if (action.value === 'cancel') payload.reason = reason.value.trim()
    if (action.value === 'set_cutoff') payload.booking_cutoff_at = cutoff.value || null
    const result = await changeEventLifecycle(props.eventId, payload)
    if (request !== generation) return
    version.value = result.version
    state.value = result.lifecycle_state
    notice.value =
      action.value === 'cancel'
        ? 'Event cancelled. Refunds will be checked in the background.'
        : 'Event status updated.'
    dashboard.invalidateEvent(props.eventId)
    events.invalidateEvent(props.eventId)
    emit('changed')
  } catch (e) {
    if (request !== generation) return
    conflict.value = e.response?.status === 409
    error.value =
      e.response?.status === 409 && typeof e.response?.data?.message === 'string'
        ? e.response.data.message
        : operationsError(
            e,
            'We could not confirm this change. Reload the saved version before trying again.',
          )
  } finally {
    if (request === generation) busy.value = false
  }
}
watch(
  () => `${auth.user?.id}:${props.eventId}`,
  () => {
    generation++
    version.value = null
    reason.value = cutoff.value = notice.value = error.value = state.value = ''
    conflict.value = false
    busy.value = false
    if (auth.user?.id) void reload()
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  generation++
})
</script>
<template>
  <section class="rh-module rh-form-panel rhs-form">
    <div class="rh-module-title">
      <div>
        <h2>Manage event sales and status</h2>
        <p>
          Closing sales keeps valid reservations. Cancellation closes admission and starts refunds.
          Archiving retains your records and waits for financial obligations.
        </p>
      </div>
    </div>
    <p v-if="state">Current status: {{ state.replaceAll('_', ' ') }}</p>
    <form @submit.prevent="submit">
      <div class="rh-form-grid">
        <label class="rh-field"
          ><span>Event action</span
          ><select v-model="action" :disabled="busy">
            <option value="close_sales">Close sales</option>
            <option value="open_sales">Reopen sales</option>
            <option value="set_cutoff">Set booking cutoff</option>
            <option value="complete">Complete ended event</option>
            <option value="cancel">Cancel event and start refunds</option>
            <option value="archive">Archive event</option>
          </select></label
        >
        <label v-if="action === 'cancel'" class="rh-field"
          ><span>Cancellation reason</span
          ><textarea v-model="reason" minlength="3" maxlength="300" required :disabled="busy" />
        </label>
        <label v-if="action === 'set_cutoff'" class="rh-field"
          ><span>Booking cutoff with timezone offset (leave empty to clear)</span
          ><input v-model="cutoff" placeholder="2030-06-21T17:00:00+01:00" :disabled="busy"
        /></label>
      </div>
      <p v-if="action === 'cancel'">
        Confirming cancels this event and starts whole-line refunds, including admitted purchases.
        This cannot be undone.
      </p>
      <p v-if="error" role="alert">{{ error }}</p>
      <p v-if="notice" role="status">{{ notice }}</p>
      <div class="rh-form-actions">
        <button
          class="rh-button rh-button-dark"
          :disabled="busy || !version || conflict || state === 'archived'"
        >
          {{ busy ? 'Updating event…' : 'Confirm event action' }}</button
        ><button type="button" class="rh-button rh-button-outline" :disabled="busy" @click="reload">
          Reload saved version
        </button>
      </div>
    </form>
  </section>
</template>
