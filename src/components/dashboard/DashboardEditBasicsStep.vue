<script setup>
const emit = defineEmits(['select-step', 'exit-edit-mode'])
const goToStep = (step) => emit('select-step', step)
const exitEditMode = () => emit('exit-edit-mode')
</script>

<template>
  <div class="step-screen active" id="s1">
                    <div class="step-header">
                      <div class="step-eyebrow"><svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Step 1 of 4</div>
                      <div class="step-h1">The <em>basics.</em></div>
                      <div class="step-p">The core details of your event. These are what people see first.</div>
                    </div>
                    <div class="form-card">
                      <div class="form-section"><div class="field"><div class="field-label">Event name</div><div class="field-val">Comedy Meets Dance</div></div></div>
                      <div class="form-section"><div class="sdiv">When</div><div style="display:flex;flex-direction:column;gap:var(--s5)"><div class="field-row"><div class="field"><div class="field-label">Starts</div><div class="field-val">May 12, 2026 · 6:00 PM</div></div><div class="field"><div class="field-label">Ends</div><div class="field-val">May 12, 2026 · 10:00 PM</div></div></div><div class="field"><div class="field-label">Recurring?</div><div class="field-val"><span class="fpill teal"><svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>One-time event</span></div></div></div></div>
                      <div class="form-section"><div class="sdiv">Format</div><div style="display:flex;flex-direction:column;gap:var(--s5)"><div class="field"><div class="field-label">Event type</div><div class="field-val"><span class="fpill pink"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>In-Person</span></div></div><div class="field"><div class="field-label">Venue</div><div class="field-val">Eko Hotel &amp; Suites, Victoria Island, Lagos</div></div><div class="map-ph"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>Eko Hotel &amp; Suites · Victoria Island, Lagos</div></div></div>
                      <div class="form-section"><div class="sdiv">Category</div><div class="field"><div class="field-label">Event category</div><div class="field-val">🎉 Party &amp; Social</div></div></div>
                    </div>
                    <div class="step-nav"><div class="snav-next" @click="goToStep(2)">Next: Details <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div></div>
                  </div>
</template>
