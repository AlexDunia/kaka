<template>
  <div class="transactions-container p-4 bg-gray-50">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Transaction Records</h2>
      <button @click="downloadPDF" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
        Download PDF
      </button>
    </div>
    <div class="overflow-x-auto bg-white rounded-lg shadow">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="t in transactions" :key="t.reference" class="hover:bg-gray-50">
            <td class="px-6 py-4 text-sm text-gray-900">{{t.reference}}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{t.transactionDate}}</td>
            <td class="px-6 py-4 text-sm text-gray-500">{{t.customerName}}</td>
            <td class="px-6 py-4 text-sm text-gray-500">₦{{formatAmount(t.amountPaid)}}</td>
            <td class="px-6 py-4 text-sm">
              <span :class="t.status === `success` ? `bg-green-100 text-green-800` : `bg-red-100 text-red-800`"
                    class="px-2 py-1 text-xs rounded-full">
                {{t.status}}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
