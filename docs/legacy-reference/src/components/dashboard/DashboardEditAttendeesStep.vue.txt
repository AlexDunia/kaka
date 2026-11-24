<script setup>
const emit = defineEmits(['select-step', 'exit-edit-mode'])
const goToStep = (step) => emit('select-step', step)
const exitEditMode = () => emit('exit-edit-mode')
</script>

<template>
  <div class="step-screen active" id="s4">
                    <div class="step-header">
                      <div class="step-eyebrow"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Step 4 of 4</div>
                      <div class="step-h1">Who's <em>registering?</em></div>
                      <div class="step-p">The information you collect from every person who buys a ticket.</div>
                    </div>
                    <div class="form-card">
                      <div class="form-section"><div class="sdiv">Registration form fields</div>
                        <div class="reg-row"><div class="reg-ico">👤</div><div class="reg-inf"><div class="reg-name">Full name</div><div class="reg-desc">First and last name</div></div><div class="reg-st"><span class="reg-badge on">On</span><span class="reg-badge req">Required</span></div></div>
                        <div class="reg-row"><div class="reg-ico">✉️</div><div class="reg-inf"><div class="reg-name">Email address</div><div class="reg-desc">For ticket delivery and updates</div></div><div class="reg-st"><span class="reg-badge on">On</span><span class="reg-badge req">Required</span></div></div>
                        <div class="reg-row"><div class="reg-ico">📞</div><div class="reg-inf"><div class="reg-name">Phone number</div><div class="reg-desc">For WhatsApp updates</div></div><div class="reg-st"><span class="reg-badge on">On</span><span class="reg-badge off">Optional</span></div></div>
                        <div class="reg-row"><div class="reg-ico">🏢</div><div class="reg-inf"><div class="reg-name">Organisation</div><div class="reg-desc">Where they work or study</div></div><div class="reg-st"><span class="reg-badge off">Off</span></div></div>
                        <div class="reg-row"><div class="reg-ico">📣</div><div class="reg-inf"><div class="reg-name">How did you hear about us?</div><div class="reg-desc">Useful for marketing insights</div></div><div class="reg-st"><span class="reg-badge on">On</span><span class="reg-badge off">Optional</span></div></div>
                      </div>
                      <div class="form-section"><div class="sdiv">Confirmation email</div><div style="display:flex;flex-direction:column;gap:var(--s5)"><div class="field"><div class="field-label">Subject</div><div class="field-val">You're in! 🎉 Comedy Meets Dance</div></div><div class="field"><div class="field-label">Personal message</div><div class="field-val ta">Can't wait to have you with us! Come ready to laugh, dance, and have a great time. See you on May 12!</div></div></div></div>
                    </div>
                    <div class="step-nav">
                      <div class="snav-back" @click="goToStep(3)"><svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div>
                      <div class="snav-next" style="background:var(--teal)" @click="exitEditMode"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>All done — save changes</div>
                    </div>
                  </div>
</template>
