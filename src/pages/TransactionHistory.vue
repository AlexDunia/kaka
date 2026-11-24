<template>
  <div class="transactions-page">
    <h1 class="text-2xl font-bold mb-6">Your tickets</h1>
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Transaction ID
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Event
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Date
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Amount
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <template v-if="loading">
            <tr v-for="row in 5" :key="`transaction-skeleton-${row}`">
              <td class="px-6 py-4">
                <span class="transaction-skeleton transaction-skeleton--id"></span>
              </td>
              <td class="px-6 py-4">
                <span class="transaction-skeleton transaction-skeleton--event"></span>
              </td>
              <td class="px-6 py-4">
                <span class="transaction-skeleton transaction-skeleton--date"></span>
              </td>
              <td class="px-6 py-4">
                <span class="transaction-skeleton transaction-skeleton--amount"></span>
              </td>
              <td class="px-6 py-4">
                <span class="transaction-skeleton transaction-skeleton--status"></span>
              </td>
            </tr>
          </template>
          <tr v-else-if="error">
            <td colspan="5" class="px-6 py-4 text-center text-red-600">
              {{ error }}
            </td>
          </tr>
          <tr v-else-if="!transactions.length">
            <td colspan="5" class="px-6 py-4 text-center">
              Your purchased tickets will appear here.
            </td>
          </tr>
          <tr v-for="transaction in transactions" :key="transaction.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              <RouterLink :to="{ name: 'payment-success', params: { orderId: transaction.id } }">{{
                transaction.id
              }}</RouterLink>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ transaction.event_name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(transaction.created_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatMoney(transaction.amount_minor, transaction.currency) }}
              <small v-if="transaction.refunded_minor != null"
                >Confirmed refunds:
                {{ formatMoney(transaction.refunded_minor, transaction.currency) }}</small
              >
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="getStatusClass(transaction.status)"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
              >
                {{ transaction.status.replaceAll('_', ' ') }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <nav v-if="lastPage > 1" aria-label="Order pages" class="mt-6 flex gap-4 items-center">
      <button :disabled="page <= 1 || loading" @click="load(page - 1)">Previous</button>
      <span>Page {{ page }} of {{ lastPage }}</span>
      <button :disabled="page >= lastPage || loading" @click="load(page + 1)">Next</button>
    </nav>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getBuyerOrders } from '@/services/checkoutService'

const transactions = ref([])
const loading = ref(true)
const error = ref(null)
const auth = useAuthStore()
let requestVersion = 0
const page = ref(1)
const lastPage = ref(1)
const formatMoney = (minor, currency) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(minor / 100)
const load = async (nextPage = 1) => {
  const version = ++requestVersion
  loading.value = true
  error.value = null
  transactions.value = []
  try {
    const result = await getBuyerOrders(nextPage)
    if (version !== requestVersion) return
    page.value = result.current_page
    lastPage.value = result.last_page
    transactions.value = result.data.map((order) => ({
      id: order.public_id,
      event_name: order.items
        .map((item) => item.event_title)
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(', '),
      created_at: order.created_at,
      amount_minor: order.total_minor,
      refunded_minor: order.refunded_minor,
      currency: order.currency,
      status: order.status,
    }))
  } catch {
    if (version === requestVersion) error.value = 'We couldn’t load your tickets. Please try again.'
  } finally {
    if (version === requestVersion) loading.value = false
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const getStatusClass = (status) => {
  const classes = {
    partially_refunded: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    registered: 'bg-green-100 text-green-800',
    pending_payment: 'bg-yellow-100 text-yellow-800',
    payment_review: 'bg-yellow-100 text-yellow-800',
    payment_failed: 'bg-red-100 text-red-800',
  }
  return classes[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

watch(
  () => auth.user?.id,
  () => load(),
  { immediate: true },
)
</script>

<style scoped>
.transactions-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.transaction-skeleton {
  display: block;
  height: 16px;
  border-radius: 999px;
  background:
    linear-gradient(90deg, transparent, var(--color-skeleton-highlight), transparent),
    var(--color-skeleton-base);
  background-size: 220% 100%;
  animation: transactionSkeletonShimmer 1.35s ease-in-out infinite;
}

.transaction-skeleton--id {
  width: 96px;
}

.transaction-skeleton--event {
  width: min(180px, 80%);
}

.transaction-skeleton--date {
  width: 120px;
}

.transaction-skeleton--amount {
  width: 76px;
}

.transaction-skeleton--status {
  width: 88px;
  height: 26px;
}

@keyframes transactionSkeletonShimmer {
  0% {
    background-position: 180% 0;
  }
  100% {
    background-position: -60% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .transaction-skeleton {
    animation: none;
  }
}
</style>
