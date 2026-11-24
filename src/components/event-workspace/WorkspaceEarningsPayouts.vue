<script setup>
import { nextTick, reactive, ref } from 'vue'
import { DASHBOARD_PREVIEW } from '@/services/dashboardPreview'
defineProps({ money: Function, overview: Object })
const banks = [
  'Access Bank',
  'First Bank',
  'GTBank',
  'Kuda Bank',
  'Moniepoint',
  'OPay',
  'UBA',
  'Zenith Bank',
  'Other bank',
]
// Like the reference, this is an in-memory sample, never a verified payout account.
const bank = ref(null),
  editing = ref(false),
  error = ref(''),
  bankSelect = ref(null),
  addButton = ref(null)
const form = reactive({ bank: '', number: '', holder: '' })
async function showForm() {
  Object.assign(form, bank.value || { bank: '', number: '', holder: '' })
  error.value = ''
  editing.value = true
  await nextTick()
  bankSelect.value?.focus()
}
async function closeForm() {
  editing.value = false
  error.value = ''
  await nextTick()
  addButton.value?.focus()
}
function saveBank() {
  if (!DASHBOARD_PREVIEW) {
    error.value = 'Bank account setup isn’t connected yet.'
    return false
  }
  if (
    !banks.includes(form.bank) ||
    !/^\d{10}$/.test(form.number) ||
    !form.holder.trim() ||
    form.holder.trim().length > 100
  ) {
    error.value = 'Choose a bank, enter a 10-digit account number and add the account name.'
    return false
  }
  bank.value = { bank: form.bank, number: form.number, holder: form.holder.trim() }
  closeForm()
  return true
}
</script>
<template>
  <div id="rhe-payouts" role="tabpanel" aria-labelledby="earnings-tab-payouts">
    <section class="rhe-card rhe-bank">
      <div class="rhe-section-head">
        <div>
          <h2>Where should we send your money?</h2>
          <p>Add a bank account in your name or your business name.</p>
        </div>
        <span class="rhe-status">{{
          bank
            ? 'Saved for demo'
            : overview.setup?.payout_account_added
              ? 'Account added'
              : 'Not set up'
        }}</span>
      </div>
      <form v-if="editing" id="rhe-bank-form" @submit.prevent="saveBank">
        <p class="rhe-demo-note">
          {{
            DASHBOARD_PREVIEW
              ? 'This is a demo. Use sample bank details only.'
              : 'Bank account setup isn’t connected yet.'
          }}
        </p>
        <div class="rhe-form">
          <label
            >Bank<select ref="bankSelect" v-model="form.bank" required>
              <option value="">Select your bank</option>
              <option v-for="name in banks" :key="name">{{ name }}</option>
            </select></label
          ><label
            >Account number<input
              v-model="form.number"
              inputmode="numeric"
              maxlength="10"
              pattern="[0-9]{10}"
              placeholder="10-digit account number"
              required /></label
          ><label class="rhe-wide"
            >Account name<input
              v-model="form.holder"
              maxlength="100"
              placeholder="Name on the account"
              required
          /></label>
        </div>
        <p v-if="error" role="alert">{{ error }}</p>
        <div class="rhe-actions">
          <button class="rh-button rh-button-dark" type="submit">Save bank details</button
          ><button class="rh-button rh-button-outline" type="button" @click="closeForm">
            Cancel
          </button>
        </div>
      </form>
      <div v-else-if="bank" id="rhe-bank-saved">
        <strong>{{ bank.holder }}</strong>
        <p>{{ bank.bank }} · ••••••{{ bank.number.slice(-4) }}</p>
        <p>Bank details saved for this demo. Verification is not connected.</p>
        <button ref="addButton" class="rh-button rh-button-outline" @click="showForm">
          Change bank details
        </button>
      </div>
      <div v-else>
        <button
          v-if="DASHBOARD_PREVIEW"
          ref="addButton"
          class="rh-button rh-button-dark"
          @click="showForm"
        >
          Add bank account
        </button>
        <p v-else class="rhe-demo-note">
          Bank account setup isn’t connected yet. Your ticket revenue is shown in Earnings.
        </p>
      </div>
    </section>
    <div class="rhe-summary rhe-payout-summary">
      <article class="rhe-card">
        <span>Amount you’ll receive</span><strong>—</strong><small>After fees and refunds</small>
      </article>
      <article class="rhe-card">
        <span>Next payment to your bank</span><strong>—</strong
        ><small>No payment date confirmed</small>
      </article>
      <article class="rhe-card">
        <span>Money sent to your bank</span><strong>—</strong
        ><small>No payment data connected</small>
      </article>
    </div>
    <section class="rhe-card">
      <div class="rhe-section-head">
        <div>
          <h2>Money from your tickets</h2>
          <p>See what will be deducted before your money is sent.</p>
        </div>
      </div>
      <div class="rhe-ledger">
        <div>
          <span>Ticket value at original prices</span
          ><strong>{{ money(overview.revenue?.total_minor) }}</strong>
        </div>
        <div
          v-for="label in ['Discounts', 'Fees', 'Refunds', 'Amount you’ll receive']"
          :key="label"
        >
          <span>{{ label }}</span
          ><strong>Not confirmed</strong>
        </div>
      </div>
    </section>
    <section class="rhe-card">
      <div class="rhe-section-head">
        <div>
          <h2>Money sent to your bank</h2>
          <p>Track your transfers here once payment processing is connected.</p>
        </div>
      </div>
      <div class="rhe-empty">No transfer records to show yet.</div>
    </section>
  </div>
</template>
