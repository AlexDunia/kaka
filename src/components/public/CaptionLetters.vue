<script setup>
defineProps({ text: { type: String, required: true }, ready: Boolean })
</script>

<template>
  <span class="caption-letters" :class="{ 'caption-letters--ready': ready }" :aria-label="text"
    ><span
      v-for="(letter, index) in [...text]"
      :key="index"
      aria-hidden="true"
      :style="{ '--letter': index }"
      >{{ letter }}</span
    ></span
  >
</template>

<style>
.caption-letters {
  white-space: pre;
}
.caption-letters > span {
  opacity: 0;
}
.caption-letters--ready > span {
  animation: caption-letter-fade 320ms ease-out both;
  animation-delay: calc(var(--letter) * 9ms);
}
@keyframes caption-letter-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
a:focus-visible .caption-letters > span {
  opacity: 1;
  animation: none;
}
@media (prefers-reduced-motion: reduce) {
  .caption-letters > span {
    opacity: 1;
    animation: none;
  }
}
</style>
