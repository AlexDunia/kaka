<script setup>
const emit = defineEmits(['select-step', 'exit-edit-mode'])
const goToStep = (step) => emit('select-step', step)
const exitEditMode = () => emit('exit-edit-mode')
</script>

<template>
  <div class="step-screen active" id="s3">
                    <div class="step-header">
                      <div class="step-eyebrow"><svg viewBox="0 0 24 24"><path d="M2 9a3 3 0 010-6h20a3 3 0 010 6M2 15a3 3 0 000 6h20a3 3 0 000-6"/><path d="M12 3v18M7 9v6M17 9v6"/></svg>Step 3 of 4</div>
                      <div class="step-h1">Your <em>tickets.</em></div>
                      <div class="step-p">How people attend and what they pay.</div>
                    </div>
                    <div class="form-card">
                      <div class="form-section"><div class="field"><div class="field-label">Attendance type</div><div class="field-val"><span class="fpill pink"><svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>Paid tickets</span></div></div></div>
                      <div class="form-section"><div class="sdiv">Ticket categories</div><div style="display:flex;flex-direction:column;gap:var(--s3)">
                        <div class="tkt-item"><div class="tkt-ico" style="background:rgba(26,122,74,.15)"><svg viewBox="0 0 24 24" style="stroke:var(--teal);fill:none;width:16px;height:16px;stroke-width:2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div><div class="tkt-inf"><div class="tkt-item-name">Early Bird</div><div class="tkt-item-meta">Individual · 150 spots · 89 remaining</div></div><div class="tkt-item-price">₦5,000</div></div>
                        <div class="tkt-item"><div class="tkt-ico" style="background:rgba(26,95,166,.15)"><svg viewBox="0 0 24 24" style="stroke:var(--blue);fill:none;width:16px;height:16px;stroke-width:2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-4 0v2"/></svg></div><div class="tkt-inf"><div class="tkt-item-name">General Admission</div><div class="tkt-item-meta">Individual · 500 spots · 323 remaining</div></div><div class="tkt-item-price">₦10,000</div></div>
                        <div class="tkt-item"><div class="tkt-ico" style="background:rgba(200,150,10,.15)"><svg viewBox="0 0 24 24" style="stroke:var(--amber);fill:none;width:16px;height:16px;stroke-width:1.8"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div><div class="tkt-inf"><div class="tkt-item-name">VIP</div><div class="tkt-item-meta">Individual · 50 spots · 12 remaining</div></div><div class="tkt-item-price">₦30,000</div></div>
                        <div class="tkt-item"><div class="tkt-ico" style="background:rgba(232,54,93,.1)"><svg viewBox="0 0 24 24" style="stroke:var(--red);fill:none;width:16px;height:16px;stroke-width:1.8;stroke-linecap:round"><path d="M3 7h18M5 7l1 12h12l1-12"/></svg></div><div class="tkt-inf"><div class="tkt-item-name">Gold Table</div><div class="tkt-item-meta">Table · seats 10 · 5 remaining</div></div><div class="tkt-item-price">₦250,000</div></div>
                      </div></div>
                      <div class="form-section"><div class="sdiv">Payout</div><div style="display:flex;flex-direction:column;gap:var(--s5)"><div class="field-row"><div class="field"><div class="field-label">Bank</div><div class="field-val">GTBank</div></div><div class="field"><div class="field-label">Account number</div><div class="field-val">••••••7823</div></div></div><div class="field"><div class="field-label">Account name</div><div class="field-val">Rush Hour Entertainment Ltd</div></div></div></div>
                    </div>
                    <div class="step-nav"><div class="snav-back" @click="goToStep(2)"><svg viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7"/></svg></div><div class="snav-next" @click="goToStep(4)">Next: Attendees <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div></div>
                  </div>
</template>
