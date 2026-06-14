<script setup>
const emit = defineEmits(['select-step', 'exit-edit-mode'])
const goToStep = (step) => emit('select-step', step)
const exitEditMode = () => emit('exit-edit-mode')
</script>

<template>
  <div class="step-screen active" id="s2">
                    <div class="step-header">
                      <div class="step-eyebrow"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>Step 2 of 4</div>
                      <div class="step-h1">Make it <em>unforgettable.</em></div>
                      <div class="step-p">Images, description, and extra details.</div>
                    </div>
                    <div class="form-card">
                      <div class="form-section"><div class="sdiv">Cover image</div><div style="display:flex;flex-direction:column;gap:var(--s4)"><div class="cover-display"><img src="https://res.cloudinary.com/dnuhjsckk/image/upload/v1745339803/Comedy-Meets-dance_s2egap.jpg" alt=""><div class="cover-display-ov"></div><div class="cover-badge-pill">Cover photo</div></div><div class="field"><div class="field-label">Images added</div><div class="field-val">1 image uploaded · first image is the cover</div></div></div></div>
                      <div class="form-section"><div class="sdiv">Description</div><div class="field"><div class="field-label">What people will experience</div><div class="field-val ta">A night where comedy and dance collide. Lagos's funniest stand-up comics share the stage with the city's best dance crews. Expect laughter, energy, and non-stop entertainment from start to finish.</div></div></div>
                      <div class="form-section"><div class="sdiv">Organiser</div><div style="display:flex;flex-direction:column;gap:var(--s5)"><div class="field-row"><div class="field"><div class="field-label">Name or organisation</div><div class="field-val">Rush Hour Entertainment</div></div><div class="field"><div class="field-label">Website</div><div class="field-val" style="color:var(--t-lo);font-style:italic">Not added</div></div></div></div></div>
                      <div class="form-section"><div class="sdiv">Extra details</div><div style="display:flex;flex-direction:column;gap:var(--s5)"><div class="field"><div class="field-label">Dress code</div><div class="field-val ta">Smart casual. No slippers or flip-flops. Bring a light jacket — the hall is air-conditioned.</div></div><div class="field"><div class="field-label">Parking</div><div class="field-val">Free parking on site. Enter via the main gate on Adetokunbo Ademola Street.</div></div></div></div>
                    </div>
                    <div class="step-nav"><div class="snav-back" @click="goToStep(1)"><svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div><div class="snav-next" @click="goToStep(3)">Next: Tickets <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div></div>
                  </div>
</template>
