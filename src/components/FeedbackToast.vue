<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'
defineProps({ message: { type: String, default: '' } })
defineEmits(['dismiss'])
</script>

<template>
  <Teleport to="body">
    <Transition name="rh-popup" appear>
      <div
        v-if="message"
        :key="message"
        class="rh-feedback-toast"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p>{{ message }}</p>
        <button type="button" aria-label="Dismiss notification" @click="$emit('dismiss')">
          <XMarkIcon aria-hidden="true" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.rh-feedback-toast {
  position: fixed;
  inset: 24px 24px auto auto;
  z-index: 3000;
  display: flex;
  align-items: center;
  gap: 16px;
  width: max-content;
  max-width: min(420px, calc(100vw - 32px));
  box-sizing: border-box;
  padding: 14px 16px;
  border-radius: var(--ds-radius-control);
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  box-shadow: 0 6px 28px rgba(32, 39, 50, 0.16);
  font: 400 var(--ds-size-body) / 1.5 var(--ds-font-body);
}
.rh-feedback-toast p {
  margin: 0;
}
.rh-feedback-toast button {
  display: grid;
  place-items: center;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  padding: 8px;
  border: 0;
  border-radius: var(--ds-radius-control);
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.rh-feedback-toast button:hover {
  background: var(--ds-color-surface-subtle);
}
.rh-feedback-toast svg {
  width: 18px;
  height: 18px;
}
@media (max-width: 760px) {
  .rh-feedback-toast {
    inset: 16px 16px auto;
    width: auto;
    max-width: none;
  }
}
</style>
