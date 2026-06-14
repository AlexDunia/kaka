<script setup>
defineProps({
  isEditMode: {
    type: Boolean,
    required: true,
  },
  currentStep: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['enter-edit-mode', 'exit-edit-mode', 'select-step'])

const enterEditMode = () => emit('enter-edit-mode')
const exitEditMode = () => emit('exit-edit-mode')
const goToStep = (step) => emit('select-step', step)
</script>

<template>
  <header class="topbar">
          <div class="topbar-manage" id="topbar-manage" :style="{ display: isEditMode ? 'none' : 'flex' }">
            <div class="topbar-left">
              <span class="topbar-event-name">Comedy Meets Dance</span>
              <span class="topbar-status live">
                <span class="status-dot"></span>
                Live
              </span>
            </div>
            <div class="topbar-right">
              <div class="btn btn-ghost">
                <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                View public page
              </div>
              <div class="btn btn-edit" @click="enterEditMode">
                <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Edit event
              </div>
            </div>
          </div>
          <div class="topbar-edit" id="topbar-edit" :style="{ display: isEditMode ? 'flex' : 'none' }">
            <div style="font-size:.75rem;font-weight:600;color:var(--t-lo);white-space:nowrap;flex-shrink:0;">Editing event</div>
            <div class="step-prog">
              <div class="step-item" :class="{ active: currentStep === 1, done: currentStep > 1 }" id="tp1" @click="goToStep(1)">
                <div class="step-num"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg></div>
                <span class="step-label">Basics</span>
              </div>
              <div class="step-connector" :class="{ done: currentStep > 1 }" id="sc1"></div>
              <div class="step-item" :class="{ active: currentStep === 2, done: currentStep > 2 }" id="tp2" @click="goToStep(2)">
                <div class="step-num">2</div>
                <span class="step-label">Details</span>
              </div>
              <div class="step-connector" :class="{ done: currentStep > 2 }" id="sc2"></div>
              <div class="step-item" :class="{ active: currentStep === 3, done: currentStep > 3 }" id="tp3" @click="goToStep(3)">
                <div class="step-num">3</div>
                <span class="step-label">Tickets</span>
              </div>
              <div class="step-connector" :class="{ done: currentStep > 3 }" id="sc3"></div>
              <div class="step-item" :class="{ active: currentStep === 4, done: currentStep > 4 }" id="tp4" @click="goToStep(4)">
                <div class="step-num">4</div>
                <span class="step-label">Attendees</span>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:var(--s3);flex-shrink:0;">
              <div class="saved-badge"><svg viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12"/></svg>Saved</div>
              <div class="btn btn-ghost" @click="exitEditMode">Cancel</div>
              <div class="btn btn-primary">Save changes</div>
            </div>
          </div>
        </header>
</template>
