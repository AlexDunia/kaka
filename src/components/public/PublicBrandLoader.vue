<script setup>
defineProps({ stage: String, destination: String, sequence: Number })
const letters = [...'rushhour', ...'ticket']
</script>
<template>
  <div
    class="public-brand-loader"
    :data-stage="stage"
    role="status"
    aria-label="Getting Rush Hour Ticket ready…"
    aria-live="polite"
  >
    <div class="brand-loader-writing" :key="sequence" aria-hidden="true">
      <span
        v-for="(letter, index) in letters"
        :key="index"
        :class="index < 8 ? 'accent' : 'ticket'"
        :style="{ '--i': index }"
        >{{ letter }}</span
      >
    </div>
    <div
      class="brand-loader-skeleton"
      :class="`brand-loader-skeleton--${destination}`"
      aria-hidden="true"
    >
      <div class="brand-skeleton-nav" />
      <div class="brand-skeleton-title" />
      <div class="brand-skeleton-subtitle" />
      <div class="brand-skeleton-search" />
      <div class="brand-skeleton-photo" />
    </div>
  </div>
</template>
<style>
.public-brand-loader {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: grid;
  place-items: center;
  background: #fff;
  color: #242932;
  overflow: hidden;
  isolation: isolate;
}
.brand-loader-writing {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  font:
    750 clamp(22px, 3vw, 27px) / 1.1 'Outfit',
    system-ui,
    sans-serif;
  letter-spacing: -0.065em;
  white-space: nowrap;
}
.brand-loader-writing span {
  opacity: 0;
  transform: translateY(2px);
  animation: brand-letter 110ms ease-out forwards;
  animation-delay: calc(110ms + var(--i) * 65ms);
}
.brand-loader-writing .accent {
  color: #bf185b;
}
.brand-loader-writing .ticket {
  color: #242932;
}
.brand-loader-skeleton {
  position: absolute;
  inset: 0;
  opacity: 0;
  background: #fff;
}
.brand-loader-skeleton > div {
  position: absolute;
  background: #eeeff1;
  border-radius: 6px;
  overflow: hidden;
}
.brand-loader-skeleton > div:after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, #ffffffa6, transparent);
  animation: brand-shimmer 1.2s ease-in-out infinite;
}
.brand-skeleton-nav {
  top: 64px;
  left: 6%;
  width: 15%;
  height: 20px;
}
.brand-skeleton-title {
  top: 190px;
  left: 29%;
  width: 42%;
  height: 42px;
}
.brand-skeleton-subtitle {
  top: 253px;
  left: 33%;
  width: 34%;
  height: 14px;
}
.brand-skeleton-search {
  top: 300px;
  left: 28%;
  width: 44%;
  height: 55px;
}
.brand-skeleton-photo {
  top: 405px;
  left: 7.5%;
  width: 85%;
  height: 45vh;
}
.brand-loader-skeleton--page .brand-skeleton-title {
  left: 8%;
  width: 38%;
}
.brand-loader-skeleton--page .brand-skeleton-subtitle {
  left: 8%;
  width: 47%;
}
.brand-loader-skeleton--page .brand-skeleton-search {
  left: 8%;
  width: 35%;
}
.public-brand-loader[data-stage='skeleton'] .brand-loader-writing {
  opacity: 0;
}
.public-brand-loader[data-stage='skeleton'] .brand-loader-skeleton {
  opacity: 1;
}
.public-brand-loader[data-stage='reveal'] {
  opacity: 0;
  transition: opacity 150ms ease;
  pointer-events: none;
}
.public-brand-loader[data-stage='reveal'] .brand-loader-writing {
  opacity: 0;
}
@keyframes brand-letter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes brand-shimmer {
  to {
    transform: translateX(100%);
  }
}
@media (max-width: 760px) {
  .brand-skeleton-title {
    top: 163px;
    left: 15%;
    width: 70%;
    height: 68px;
  }
  .brand-skeleton-subtitle {
    top: 252px;
    left: 18%;
    width: 64%;
    height: 15px;
  }
  .brand-skeleton-search {
    top: 296px;
    left: 10%;
    width: 80%;
    height: 105px;
  }
  .brand-skeleton-photo {
    top: 435px;
    left: 0;
    width: 100%;
    height: 32vh;
  }
}
@media (prefers-reduced-motion: reduce) {
  .public-brand-loader,
  .public-brand-loader * {
    animation: none !important;
    transition: none !important;
  }
  .brand-loader-writing span {
    opacity: 1;
    transform: none;
  }
}
</style>
