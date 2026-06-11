<template>
  <div class="transactions-page">
    <h1 class="text-2xl font-bold mb-6">Your Transactions</h1>
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
            <td colspan="5" class="px-6 py-4 text-center">No transactions found.</td>
          </tr>
          <tr v-for="transaction in transactions" :key="transaction.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ transaction.id }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ transaction.event_name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(transaction.created_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              ${{ transaction.amount.toFixed(2) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="getStatusClass(transaction.status)"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
              >
                {{ transaction.status }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const transactions = ref([])
const loading = ref(true)
const error = ref(null)

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const getStatusClass = (status) => {
  const classes = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
  }
  return classes[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

onMounted(async () => {
  try {
    // TODO: Replace with actual API call
    // const response = await fetch('/api/transactions')
    // transactions.value = await response.json()

    // Temporary mock data
    transactions.value = [
      {
        id: 'TRX-001',
        event_name: 'Summer Music Festival',
        created_at: '2024-03-15',
        amount: 150.0,
        status: 'completed',
      },
      {
        id: 'TRX-002',
        event_name: 'Comedy Night',
        created_at: '2024-03-14',
        amount: 45.0,
        status: 'pending',
      },
    ]
  } catch (e) {
    error.value = 'Failed to load transactions'
    console.error('Error loading transactions:', e)
  } finally {
    loading.value = false
  }
})
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
    linear-gradient(
      90deg,
      transparent,
      var(--color-skeleton-highlight),
      transparent
    ),
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
