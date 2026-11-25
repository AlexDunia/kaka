<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { getBanks, getPayoutAccounts, createPayoutAccount } from '@/services/eventFinanceService'
import { operationsError } from '@/services/eventOperationsService'
import { DASHBOARD_PREVIEW } from '@/services/dashboardPreview'
import { financeStatus } from './financialModel'
import { useAuthStore } from '@/stores/auth'
defineProps({ destinationOnly: Boolean })
const auth = useAuthStore()
const bankPicker = ref(null)
const bankSearch = ref('')
const banksLoading = ref(false)
const bankError = ref('')
const moreBanks = ref(true)
const bankLookup = computed(() => new Map(banks.value.map(bank => [String(bank.code), bank])))
const matchingBanks = computed(() => {
  const query = bankSearch.value.trim().toLocaleLowerCase()
  return banks.value.filter(bank => bank.name.toLocaleLowerCase().includes(query))
})
const visibleBanks = computed(() => matchingBanks.value.slice(0, 100))
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
  if (banksLoading.value || !moreBanks.value || bankPage.value >= 100 || !auth.user?.id || DASHBOARD_PREVIEW) return
  banksLoading.value = true
  bankError.value = ''
  const version = generation
  try {
    const result = await getBanks(bankPage.value + 1)
    if (!active || version !== generation) return
    banks.value = [...new Map([...banks.value, ...result.data].map((b) => [String(b.code), b])).values()]
    bankPage.value++
    moreBanks.value = result.meta && 'next' in result.meta ? Boolean(result.meta.next) : result.data.length === 100
  } catch (e) {
    if (active && version === generation)
      bankError.value = operationsError(e, 'We could not load banks. Please try again.')
  } finally {
    if (version === generation) banksLoading.value = false
  }
}
function openBankPicker() {
  bankSearch.value = ''
  bankPicker.value?.showModal()
  if (!banks.value.length) void loadBanks()
}
function chooseBank(code) {
  form.bank_code = String(code)
  bankPicker.value?.close()
}
function closeForm() {
  bankPicker.value?.close()
  editing.value = false
  form.account_number = ''
}
async function showForm() {
  editing.value = true
  form.account_number = ''
  if (!banks.value.length) await loadBanks()
}
async function saveBank() {
  if (busy.value || DASHBOARD_PREVIEW || !auth.user?.id) return
  if (!bankLookup.value.has(form.bank_code) || !/^\d{10}$/.test(form.account_number)) {
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
    banks.value = []
    bankPage.value = 0
    moreBanks.value = true
    banksLoading.value = false
    bankError.value = ''
    bankSearch.value = ''
    bankPicker.value?.close()
    form.bank_code = ''
    form.account_number = ''
    editing.value = false
    busy.value = false
    reading.value = false
    error.value = ''
    page.value = lastPage.value = 1
    clearInterval(timer)
    void refresh(1)
    if (!auth.user?.id || typeof window === 'undefined') return
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
  <div :id="destinationOnly ? undefined : 'rhe-payouts'" :role="destinationOnly ? undefined : 'tabpanel'" :aria-labelledby="destinationOnly ? undefined : 'earnings-tab-payouts'">
    <section class="rhe-card rhe-bank">
      <div class="rhe-section-head">
        <div>
          <h2>Where should we send your ticket payments?</h2>
          <p>Add a Nigerian NGN bank account in your name or your business name.</p>
        </div>
        <span class="rhe-status">{{ latest ? financeStatus(latest.status) : 'Not set up' }}</span>
      </div>
      <p v-if="DASHBOARD_PREVIEW">Bank setup is unavailable in this preview.</p>
      <form v-else-if="editing" :inert="busy" @submit.prevent="saveBank">
        <p>
          Verification continues after you submit. Your existing active account stays in use until
          the new account is active.
        </p>
        <div class="rhe-form">
          <label>
            Bank<select v-model="form.bank_code" :disabled="busy" required>
              <option value="">Select your bank</option>
              <option v-for="bank in banks" :key="bank.code" :value="String(bank.code)">
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
        <p v-if="banksLoading" role="status">Getting banks ready...</p>
        <p v-if="bankError" role="alert">{{ bankError }}</p>
        <button type="button" class="rhea-inline-link" :disabled="busy" @click="openBankPicker">Find your bank</button>
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
      <nav v-if="lastPage > 1" aria-label="Bank account pages">
        <button :disabled="page <= 1 || reading" @click="refresh(page - 1)">Previous</button> Page
        {{ page }} of {{ lastPage }}
        <button :disabled="page >= lastPage || reading" @click="refresh(page + 1)">Next</button>
      </nav>
    </section>
    <section v-if="!destinationOnly" class="rhe-card">
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
    <dialog ref="bankPicker" class="bank-picker" aria-labelledby="bank-picker-title">
      <div class="bank-picker-head">
        <h2 id="bank-picker-title">Select your bank</h2>
        <button type="button" class="rh-button rh-button-outline" @click="bankPicker.close()">Close</button>
      </div>
      <label class="bank-picker-search">Search banks<input v-model="bankSearch" type="search" placeholder="Enter your bank name" autocomplete="off" autofocus /></label>
      <p class="bank-picker-help">Search the banks loaded below. If yours is missing, load more banks and search again.</p>
      <p v-if="bankError" role="alert">{{ bankError }}</p>
      <p v-if="banksLoading" role="status">Getting banks ready...</p>
      <p v-else-if="!matchingBanks.length" role="status">No matching banks in this list.</p>
      <ul class="bank-picker-list" aria-label="Banks">
        <li v-for="bank in visibleBanks" :key="bank.code"><button type="button" :aria-pressed="form.bank_code === String(bank.code)" @click="chooseBank(bank.code)">{{ bank.name }}</button></li>
      </ul>
      <p v-if="matchingBanks.length > visibleBanks.length">Showing the first 100 matches. Add more of your bank name to narrow the list.</p>
      <button v-if="moreBanks && bankPage < 100" type="button" class="rh-button rh-button-outline" :disabled="banksLoading" @click="loadBanks">{{ banksLoading ? 'Loading banks...' : bankError ? 'Try again' : 'Load more banks' }}</button>
      <p v-else-if="!moreBanks">All available banks are loaded.</p>
      <p v-else>Add more of your bank name to narrow the list.</p>
    </dialog>
  </div>
</template>

<style scoped>
.bank-picker { width: min(480px, calc(100vw - 32px)); max-height: calc(100dvh - 48px); box-sizing: border-box; border: 1px solid var(--rh-color-border, #e5e8ed); border-radius: 12px; padding: 24px; background: white; color: var(--rh-color-text, #343b46); font: 400 14px/1.6 var(--rh-font-body, 'DM Sans', sans-serif); overflow-y: auto; }
.bank-picker::backdrop { background: #10111880; }
.bank-picker-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.bank-picker-head h2 { margin: 0; font-size: 18px; }
.bank-picker-search { display: grid; gap: 8px; }
.bank-picker-search input { width: 100%; box-sizing: border-box; padding: 12px; border: 1px solid var(--rh-color-border, #e5e8ed); border-radius: 6px; font: inherit; }
.bank-picker-help { color: #626975; font-size: 12px; margin: 12px 0; }
.bank-picker-list { list-style: none; padding: 0; margin: 16px 0; max-height: 320px; overflow-y: auto; }
.bank-picker-list button { display: block; width: 100%; min-height: 44px; padding: 12px; border: 0; border-bottom: 1px solid var(--rh-color-border, #e5e8ed); background: white; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.bank-picker-list button:hover, .bank-picker-list button[aria-pressed='true'] { background: var(--rh-color-brand-soft, #f5f5f7); }
</style>
