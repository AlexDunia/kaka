<script setup>
import { computed } from 'vue'
const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  item: {
    type: Object,
    default: null,
  },
})

function formatPrice(price) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(price)
}

const displayItems = computed(() =>
  props.items.length ? props.items : props.item ? [props.item] : [],
)
</script>

<template>
  <div>
    <div v-for="ticket in displayItems" :key="ticket.id + ticket.ticketType">
      <div>
        <strong>{{ ticket.eventTitle }}</strong> <br />
        <span>{{ ticket.ticketType }} x{{ ticket.quantity }}</span>
      </div>
      <div>{{ formatPrice(ticket.totalPrice) }}</div>
    </div>
    <div class="divider small"></div>
    <div class="summary-row">
      <span>Total</span>
      <span>
        {{ formatPrice(displayItems.reduce((sum, t) => sum + t.totalPrice, 0)) }}
      </span>
    </div>
  </div>
</template>
