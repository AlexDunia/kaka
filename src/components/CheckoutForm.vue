<script setup>
import { ref, watch } from 'vue'
const props = defineProps({
  loading: Boolean,
  errors: Object,
})
const emit = defineEmits(['submit'])

const formData = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
})

function handleSubmit() {
  emit('submit', { ...formData.value })
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="checkout__form" autocomplete="off">
    <div class="form-row">
      <label>Email Address</label>
      <input v-model="formData.email" type="email" required placeholder="Enter your email" />
      <span v-if="errors?.email" class="checkout__error">{{ errors.email }}</span>
    </div>
    <div class="form-row">
      <label>First Name</label>
      <input
        v-model="formData.firstName"
        type="text"
        required
        placeholder="Enter your first name"
      />
      <span v-if="errors?.firstName" class="checkout__error">{{ errors.firstName }}</span>
    </div>
    <div class="form-row">
      <label>Last Name</label>
      <input v-model="formData.lastName" type="text" required placeholder="Enter your last name" />
      <span v-if="errors?.lastName" class="checkout__error">{{ errors.lastName }}</span>
    </div>
    <div class="form-row">
      <label>Phone Number</label>
      <input v-model="formData.phone" type="tel" required placeholder="Enter your phone number" />
      <span v-if="errors?.phone" class="checkout__error">{{ errors.phone }}</span>
    </div>
    <button type="submit" class="checkout__submit" :disabled="loading">
      <span v-if="loading">Processing…</span>
      <span v-else>Complete Purchase</span>
    </button>
  </form>
</template>
