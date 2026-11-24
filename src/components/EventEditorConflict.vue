<script setup>
defineProps({ record: Object, loading: Boolean, error: String })
defineEmits(['reload', 'retry'])
</script>
<template>
  <section role="alert" class="api-error-summary">
    <strong>Review the saved event</strong>
    <p>
      Your edits are still here. Compare the saved event before continuing. Reloading replaces your
      unsaved inputs.
    </p>
    <p v-if="loading">Getting the saved event...</p>
    <p v-if="error">{{ error }} <button type="button" @click="$emit('retry')">Try again</button></p>
    <details v-if="record">
      <summary>Compare saved event</summary>
      <p>
        {{ record.form.title }} &middot; {{ record.form.startsAtLocal }} &middot;
        {{ record.form.timeZone }}
      </p>
      <p>{{ record.form.venue }} {{ record.form.city }}</p>
      <p>{{ record.form.description }}</p>
      <ul>
        <li v-for="ticket in record.form.tickets" :key="ticket.id">
          {{ ticket.name }} &middot; {{ ticket.price }} &middot; {{ ticket.units }} configured units
          ? {{ ticket.visible ? 'Visible' : 'Hidden' }}
        </li>
      </ul>
    </details>
    <button type="button" class="ghost-btn" :disabled="!record || loading" @click="$emit('reload')">
      Reload saved event
    </button>
  </section>
</template>
