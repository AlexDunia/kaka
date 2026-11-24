<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { getBanks, getPayoutAccounts, createPayoutAccount } from '@/services/eventFinanceService'
import { operationsError } from '@/services/eventOperationsService'
import { DASHBOARD_PREVIEW } from '@/services/dashboardPreview'
import { financeStatus } from './financialModel'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const accounts = ref([]),
  banks = ref([]),
  page = ref(1),
  lastPage = ref(1)
const editing = ref(false),
  busy = ref(false),
  error = ref(''),
  bankPage = ref(0)
const form = reactive({ bank_code: '', account_number: '' })
const latest = computed(() => accounts.value[0])
let active = true,
  timer,
  generation = 0
const reading = ref(false)
async function refresh(next = page.value) {
  if (reading.value || DASHBOARD_PREVIEW || !auth.user?.id) return
  const version = generation
  reading.value = true
  try {
    const result = await getPayoutAccounts(next)
    if (!active || version !== generation) return
    accounts.value = result.data
    page.value = result.current_page
    lastPage.value = result.last_page
    error.value = ''
  } catch (e) {
    if (active && version === generation) error.value = operationsError(e)
  } finally {
    if (version === generation) reading.value = false
  }
}
async function loadBanks() {
  if (busy.value || bankPage.value >= 100) return
  busy.value = true
  const version = generation
  try {
    const result = await getBanks(bankPage.value + 1)
    if (!active || version !== generation) return
    banks.value = [...new Map([...banks.value, ...result.data].map((b) => [b.code, b])).values()]
    bankPage.value++
  } catch (e) {
    if (active && version === generation)
      error.value = operationsError(e, 'We could not load banks. Please try again.')
  } finally {
    if (version === generation) busy.value = false
  }
}
function closeForm() {
  editing.value = false
  form.account_number = ''
}
async function showForm() {
  editing.value = true
  form.account_number = ''
  if (!banks.value.length) await loadBanks()
}
async function saveBank() {
  if (busy.value || DASHBOARD_PREVIEW) return
  if (!/^\d{3,9}$/.test(form.bank_code) || !/^\d{10}$/.test(form.account_number)) {
    error.value = 'Choose a bank and enter your 10-digit account number.'
    return
  }
  busy.value = true
  error.value = ''
  const version = generation
  try {
    await createPayoutAccount({ ...form })
    if (!active || version !== generation) return
    form.account_number = ''
    editing.value = false
    await refresh(1)
  } catch (e) {
    if (active && version === generation)
      error.value = operationsError(
        e,
        'Bank setup could not be confirmed. Submit the same details to check again.',
      )
  } finally {
    if (version === generation) busy.value = false
  }
}
watch(
  () => auth.user?.id,
  () => {
    generation++
    accounts.value = []
    form.account_number = ''
    editing.value = false
    busy.value = false
    reading.value = false
    error.value = ''
    page.value = lastPage.value = 1
    clearInterval(timer)
    void refresh(1)
    timer = setInterval(() => {
      if (document.visibilityState !== 'hidden') void refresh()
    }, 15000)
  },
  { immediate: true },
)
onBeforeUnmount(() => {
  active = false
  form.account_number = ''
  clearInterval(timer)
})
</script>
<template>
  <div id="rhe-payouts" role="tabpanel" aria-labelledby="earnings-tab-payouts">
    <section class="rhe-card rhe-bank">
      <div class="rhe-section-head">
        <div>
          <h2>Where should we send your money?</h2>
          <p>Add a Nigerian NGN bank account in your name or your business name.</p>
        </div>
        <span class="rhe-status">{{ latest ? financeStatus(latest.status) : 'Not set up' }}</span>
      </div>
      <p v-if="DASHBOARD_PREVIEW">Bank setup is unavailable in this preview.</p>
      <form v-else-if="editing" @submit.prevent="saveBank">
        <p>
          Verification continues after you submit. Your existing active account stays in use until
          the new account is active.
        </p>
        <div class="rhe-form">
          <label
            >Bank<select v-model="form.bank_code" required>
              <option value="">Select your bank</option>
              <option v-for="bank in banks" :key="bank.code" :value="bank.code">
                {{ bank.name }}
              </option>
            </select></label
          >
          <label
            >Account number<input
              v-model="form.account_number"
              inputmode="numeric"
              maxlength="10"
              pattern="[0-9]{10}"
              autocomplete="off"
              required
          /></label>
        </div>
        <div class="rhe-actions">
          <button class="rh-button rh-button-dark" :disabled="busy">
            {{ busy ? 'Checking details…' : 'Submit bank details' }}
          </button>
          <button
            type="button"
            class="rh-button rh-button-outline"
            :disabled="busy"
            @click="closeForm"
          >
            Cancel
          </button>
          <button
            type="button"
            class="rhea-inline-link"
            :disabled="busy || bankPage >= 100"
            @click="loadBanks"
          >
            Load more banks
          </button>
        </div>
      </form>
      <button v-else class="rh-button rh-button-outline" @click="showForm">
        {{ accounts.length ? 'Change bank details' : 'Add bank account' }}
      </button>
      <p v-if="error" role="alert">{{ error }}</p>
      <div v-for="account in accounts" :key="account.id" class="rhe-ledger">
        <strong>{{ account.account_name || 'Account verification pending' }}</strong>
        <p>
          {{ account.bank_name || 'Bank details submitted' }} · Account ending
          {{ account.account_last4 }}
        </p>
        <p>{{ financeStatus(account.status) }} · {{ financeStatus(account.onboarding_state) }}</p>
        <p v-if="account.last_error">{{ account.last_error }}</p>
      </div>
      <nav aria-label="Bank account pages">
        <button :disabled="page <= 1 || reading" @click="refresh(page - 1)">Previous</button> Page
        {{ page }} of {{ lastPage }}
        <button :disabled="page >= lastPage || reading" @click="refresh(page + 1)">Next</button>
      </nav>
    </section>
    <section class="rhe-card">
      <h2>Settlement history</h2>
      <p>
        Confirmed seller settlement is shown in your earnings records. Individual settlement
        statements and payment dates are not available here yet.
      </p>
      <p>
        Pending proceeds are not a withdrawable balance. Payments needing review require
        reconciliation.
      </p>
    </section>
  </div>
</template>
