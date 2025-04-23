<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useEventStore } from '@/stores/events'
import { usePurchaseStore } from '@/stores/purchases'
import { useReportStore } from '@/stores/reports'

const authStore = useAuthStore()
const eventStore = useEventStore()
const purchaseStore = usePurchaseStore()
const reportStore = useReportStore()

const loading = ref(true)
const error = ref(null)
const activeTab = ref('dashboard')

// Load data
onMounted(async () => {
  if (!authStore.isAdmin) {
    error.value = 'You do not have permission to access this page'
    loading.value = false
    return
  }

  try {
    // Load data for admin dashboard
    await Promise.all([
      eventStore.fetchAllEvents(),
      purchaseStore.fetchAllPurchases(),
      reportStore.fetchWeeklyReport(),
    ])
  } catch (e) {
    error.value = e.message || 'Failed to load admin data'
  } finally {
    loading.value = false
  }
})

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value)
}

// Format date
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="admin-page">
    <div class="container">
      <div class="admin-page__header">
        <h1 class="admin-page__title">Admin Dashboard</h1>
        <p class="admin-page__subtitle">Manage events, sales, and reports</p>
      </div>

      <div v-if="loading" class="admin-page__loading">Loading admin data...</div>

      <div v-else-if="error" class="admin-page__error">
        {{ error }}
      </div>

      <div v-else class="admin-page__content">
        <!-- Navigation tabs -->
        <div class="admin-tabs">
          <button
            class="admin-tabs__button"
            :class="{ 'admin-tabs__button--active': activeTab === 'dashboard' }"
            @click="activeTab = 'dashboard'"
          >
            Dashboard
          </button>
          <button
            class="admin-tabs__button"
            :class="{ 'admin-tabs__button--active': activeTab === 'events' }"
            @click="activeTab = 'events'"
          >
            Events
          </button>
          <button
            class="admin-tabs__button"
            :class="{ 'admin-tabs__button--active': activeTab === 'sales' }"
            @click="activeTab = 'sales'"
          >
            Sales
          </button>
          <button
            class="admin-tabs__button"
            :class="{ 'admin-tabs__button--active': activeTab === 'users' }"
            @click="activeTab = 'users'"
          >
            Users
          </button>
        </div>

        <!-- Dashboard tab -->
        <div v-if="activeTab === 'dashboard'" class="admin-dashboard">
          <!-- Stats cards -->
          <div class="admin-stats">
            <div class="admin-stat-card">
              <div class="admin-stat-card__value">{{ eventStore.events.length }}</div>
              <div class="admin-stat-card__label">Total Events</div>
            </div>

            <div class="admin-stat-card">
              <div class="admin-stat-card__value">
                {{ formatCurrency(reportStore.weeklyReport?.totalRevenue || 0) }}
              </div>
              <div class="admin-stat-card__label">Total Revenue</div>
            </div>

            <div class="admin-stat-card">
              <div class="admin-stat-card__value">
                {{ reportStore.weeklyReport?.totalTickets || 0 }}
              </div>
              <div class="admin-stat-card__label">Tickets Sold</div>
            </div>
          </div>

          <!-- Low stock alerts -->
          <div class="admin-section">
            <h2 class="admin-section__title">Low Stock Events</h2>

            <div v-if="reportStore.lowStockEvents?.length" class="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Available</th>
                    <th>Total</th>
                    <th>% Sold</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="event in reportStore.lowStockEvents" :key="event.id">
                    <td>{{ event.title }}</td>
                    <td>{{ formatDate(event.date) }}</td>
                    <td>{{ event.availableTickets }}</td>
                    <td>{{ event.totalTickets }}</td>
                    <td>
                      {{ Math.round((1 - event.availableTickets / event.totalTickets) * 100) }}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="admin-empty">No low stock events at the moment.</div>
          </div>

          <!-- Top selling events -->
          <div class="admin-section">
            <h2 class="admin-section__title">Top Selling Events</h2>

            <div v-if="reportStore.weeklyReport?.topSellingEvents?.length" class="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Tickets</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="event in reportStore.weeklyReport.topSellingEvents"
                    :key="event.eventId"
                  >
                    <td>{{ event.eventTitle }}</td>
                    <td>{{ event.quantity }}</td>
                    <td>{{ formatCurrency(event.revenue) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="admin-empty">No sales data available.</div>
          </div>
        </div>

        <!-- Events tab -->
        <div v-else-if="activeTab === 'events'" class="admin-events">
          <div class="admin-section">
            <div class="admin-section__header">
              <h2 class="admin-section__title">Manage Events</h2>
              <button class="admin-btn admin-btn--primary">Add New Event</button>
            </div>

            <div v-if="eventStore.events.length" class="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Date</th>
                    <th>Available/Total</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="event in eventStore.events" :key="event.id">
                    <td>{{ event.title }}</td>
                    <td>{{ event.category }}</td>
                    <td>{{ formatDate(event.date) }}</td>
                    <td>{{ event.availableTickets }}/{{ event.totalTickets }}</td>
                    <td>{{ formatCurrency(event.price) }}</td>
                    <td class="admin-table__actions">
                      <button class="admin-btn admin-btn--small">Edit</button>
                      <button class="admin-btn admin-btn--small admin-btn--danger">Delete</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="admin-empty">No events found. Create your first event!</div>
          </div>
        </div>

        <!-- Sales tab -->
        <div v-else-if="activeTab === 'sales'" class="admin-sales">
          <div class="admin-section">
            <h2 class="admin-section__title">Recent Sales</h2>

            <div v-if="purchaseStore.purchases.length" class="admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Tickets</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="purchase in purchaseStore.purchases.slice(0, 10)" :key="purchase.id">
                    <td>{{ purchase.eventTitle }}</td>
                    <td>{{ formatDate(purchase.purchaseDate) }}</td>
                    <td>User #{{ purchase.userId }}</td>
                    <td>{{ purchase.quantity }}</td>
                    <td>{{ formatCurrency(purchase.totalPrice) }}</td>
                    <td>
                      <span
                        :class="{
                          'admin-badge': true,
                          'admin-badge--success': purchase.status === 'confirmed',
                          'admin-badge--danger': purchase.status === 'cancelled',
                        }"
                      >
                        {{ purchase.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="admin-empty">No sales data available.</div>
          </div>
        </div>

        <!-- Users tab -->
        <div v-else-if="activeTab === 'users'" class="admin-users">
          <div class="admin-section">
            <h2 class="admin-section__title">User Management</h2>
            <p class="admin-empty">User management functionality coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page {
  padding: 2rem 0;
}

.admin-page__header {
  margin-bottom: 2rem;
  text-align: center;
}

.admin-page__title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.admin-page__subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
}

.admin-page__loading,
.admin-page__error {
  text-align: center;
  padding: 3rem;
  background-color: var(--card-bg);
  border-radius: 10px;
  margin-bottom: 2rem;
}

.admin-page__error {
  color: var(--error);
}

.admin-tabs {
  display: flex;
  margin-bottom: 2rem;
  background-color: var(--card-bg);
  border-radius: 10px;
  overflow: hidden;
}

.admin-tabs__button {
  flex: 1;
  background: none;
  border: none;
  padding: 1rem;
  font-size: 1rem;
  color: var(--text-color);
  cursor: pointer;
  transition: background-color 0.3s;
  text-align: center;
  border-bottom: 3px solid transparent;
}

.admin-tabs__button:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.admin-tabs__button--active {
  background-color: rgba(255, 255, 255, 0.1);
  border-bottom-color: var(--primary);
  font-weight: 600;
}

.admin-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.admin-stat-card {
  background-color: var(--card-bg);
  border-radius: 10px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.admin-stat-card__value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.5rem;
}

.admin-stat-card__label {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
}

.admin-section {
  background-color: var(--card-bg);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.admin-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.admin-section__title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.admin-section__header .admin-section__title {
  margin-bottom: 0;
}

.admin-empty {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.6);
}

.admin-table {
  overflow-x: auto;
}

.admin-table table {
  width: 100%;
  border-collapse: collapse;
}

.admin-table th {
  text-align: left;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.05);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.admin-table td {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.admin-table tr:last-child td {
  border-bottom: none;
}

.admin-table__actions {
  display: flex;
  gap: 0.5rem;
}

.admin-btn {
  background-color: var(--primary);
  color: var(--text-color);
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s;
}

.admin-btn:hover {
  background-color: var(--accent);
}

.admin-btn--small {
  padding: 0.4rem 0.75rem;
  font-size: 0.85rem;
}

.admin-btn--danger {
  background-color: var(--error);
}

.admin-btn--danger:hover {
  background-color: #ff6b6b;
}

.admin-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
}

.admin-badge--success {
  background-color: rgba(46, 213, 115, 0.2);
  color: var(--success);
}

.admin-badge--danger {
  background-color: rgba(255, 71, 87, 0.2);
  color: var(--error);
}

@media (max-width: 992px) {
  .admin-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .admin-stats {
    grid-template-columns: 1fr;
  }

  .admin-tabs {
    flex-wrap: wrap;
  }

  .admin-tabs__button {
    flex-basis: 50%;
  }
}
</style>
