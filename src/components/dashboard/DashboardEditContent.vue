<script setup>
import DashboardEditAttendeesStep from './DashboardEditAttendeesStep.vue'
import DashboardEditBasicsStep from './DashboardEditBasicsStep.vue'
import DashboardEditDetailsStep from './DashboardEditDetailsStep.vue'
import DashboardEditTicketsStep from './DashboardEditTicketsStep.vue'

defineProps({
  currentStep: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['select-step', 'exit-edit-mode'])

const goToStep = (step) => emit('select-step', step)
const exitEditMode = () => emit('exit-edit-mode')
</script>

<template>
  <div class="edit-content" id="edit-content">
    <div class="edit-wrap">
      <div class="edit-form">
        <DashboardEditBasicsStep
          v-if="currentStep === 1"
          @select-step="goToStep"
          @exit-edit-mode="exitEditMode"
        />
        <DashboardEditDetailsStep
          v-else-if="currentStep === 2"
          @select-step="goToStep"
          @exit-edit-mode="exitEditMode"
        />
        <DashboardEditTicketsStep
          v-else-if="currentStep === 3"
          @select-step="goToStep"
          @exit-edit-mode="exitEditMode"
        />
        <DashboardEditAttendeesStep
          v-else-if="currentStep === 4"
          @select-step="goToStep"
          @exit-edit-mode="exitEditMode"
        />
      </div>
    </div>
  </div>
</template>
