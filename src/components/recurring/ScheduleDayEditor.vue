<script setup>
import { computed } from 'vue'
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import ScheduleTimeDropdown from './ScheduleTimeDropdown.vue'
import { formatScheduleDate, formatSessionTime } from '@/utils/explicitSchedule'
const props = defineProps({ editor: Object })
const emit = defineEmits(['done', 'removed'])
function removeDay() {
  props.editor.removeDay()
  emit('removed')
}
const weekday = computed(() => formatScheduleDate(props.editor.selected, { weekday: 'long' }))
</script>
<template>
  <div v-if="!editor.selected" class="schedule-empty-editor">
    <h3>Choose a day</h3>
    <p>Tap a date on the calendar.</p>
  </div>
  <div v-else class="schedule-day-editor">
    <h3>
      {{ formatScheduleDate(editor.selected, { weekday: 'long', day: 'numeric', month: 'long' }) }}
    </h3>
    <p>What time does your event run? <span class="schedule-muted">(Optional)</span></p>
    <p v-if="editor.readOnly" class="schedule-muted">
      Past dates stay in your schedule. Their times cannot be changed here.
    </p>
    <fieldset :disabled="editor.readOnly">
      <div v-if="editor.inherited" class="schedule-shared-card">
        <div class="schedule-row">
          <span>Time added</span
          ><button type="button" class="schedule-link" @click="editor.changeTime">
            Change time
          </button>
        </div>
        <p v-for="slot in editor.day.sessions" :key="`${slot.startTime}-${slot.endTime}`">
          <strong
            >{{ formatSessionTime(slot.startTime) }} to
            {{ formatSessionTime(slot.endTime) }}</strong
          >
        </p>
        <button type="button" class="schedule-link" @click="editor.clearTimes">
          Remove times for this day
        </button>
      </div>
      <template v-else>
        <button
          v-if="editor.copySource"
          type="button"
          class="schedule-link schedule-copy"
          @click="editor.copyTimes"
        >
          Use {{ formatScheduleDate(editor.copySource, { day: 'numeric', month: 'short' }) }} times
        </button>
        <div class="schedule-sessions">
          <div v-for="(slot, index) in editor.slots" :key="index" class="schedule-session">
            <ScheduleTimeDropdown
              :model-value="slot.startTime"
              label="Start time"
              :open="editor.openTime?.index === index && editor.openTime.field === 'startTime'"
              @toggle="editor.toggleTime(index, 'startTime')"
              @update:model-value="editor.setTime(index, 'startTime', $event)"
            />
            <ScheduleTimeDropdown
              :model-value="slot.endTime"
              label="End time"
              :anchor="slot.startTime"
              :open="editor.openTime?.index === index && editor.openTime.field === 'endTime'"
              @toggle="editor.toggleTime(index, 'endTime')"
              @update:model-value="editor.setTime(index, 'endTime', $event)"
            />
            <button
              type="button"
              class="schedule-icon"
              :aria-label="`Remove time ${index + 1}`"
              :disabled="editor.slots.length === 1 && !slot.startTime && !slot.endTime"
              @click="editor.removeTime(index)"
            >
              <XMarkIcon />
            </button>
            <small
              v-if="!editor.dirty && slot.startTime && slot.endTime"
              class="schedule-session-status"
              >Added to event draft</small
            >
          </div>
        </div>
        <button
          type="button"
          class="schedule-secondary schedule-add"
          :disabled="editor.slots.length >= editor.maxSessions"
          @click="editor.addTime"
        >
          <PlusIcon />Add another time (same day)
        </button>
        <label v-if="editor.targets.length > 1" class="schedule-check"
          ><input
            type="checkbox"
            :checked="editor.repeat"
            @change="editor.setRepeat($event.target.checked)"
          /><span>Repeat every {{ weekday }} this month</span></label
        >
        <label
          v-if="
            (!editor.error && editor.slots.some((slot) => slot.startTime && slot.endTime)) ||
            editor.share !== null ||
            editor.sharingEnabled
          "
          class="schedule-check"
          ><input
            type="checkbox"
            :checked="editor.share ?? editor.sharingEnabled"
            @change="editor.setShare($event.target.checked)"
          /><span>Use these times for all added days</span></label
        >
        <p
          v-if="(editor.dirty || editor.showValidation) && editor.error"
          class="schedule-error"
          role="alert"
        >
          {{ editor.error }}
        </p>
        <button
          v-if="editor.detached"
          type="button"
          class="schedule-link"
          @click="editor.clearTimes"
        >
          Keep this day without a time
        </button>
      </template>
      <div class="schedule-save-row">
        <button type="button" class="schedule-primary" @click="emit('done')">Done</button>
        <button
          v-if="editor.day"
          type="button"
          class="schedule-secondary schedule-danger"
          @click="removeDay"
        >
          Remove day
        </button>
      </div>
    </fieldset>
  </div>
</template>
