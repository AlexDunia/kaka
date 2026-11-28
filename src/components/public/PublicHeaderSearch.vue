<script setup>
import { nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { MagnifyingGlassIcon } from '@/components/icons/pngIcons'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import PublicEventSearch from './PublicEventSearch.vue'

const route = useRoute()
const dialog = ref(null)
const trigger = ref(null)
const opened = ref(false)
// The shared native-dialog CSS owns entry and exit motion. Retain the search
// form after its first open so it stays visible throughout the closing fade.
async function openSearch() {
  if (dialog.value?.open) return
  opened.value = true
  await nextTick()
  if (!dialog.value || dialog.value.open) return
  dialog.value.showModal()
  dialog.value.querySelector('input')?.focus()
}
function closeSearch() {
  dialog.value?.close()
}
function restoreFocus() {
  trigger.value?.focus()
}
watch(() => route.fullPath, closeSearch)
</script>

<template>
  <button
    ref="trigger"
    type="button"
    class="header-search-trigger"
    aria-label="Search events and filter"
    aria-haspopup="dialog"
    @click="openSearch"
  >
    <MagnifyingGlassIcon aria-hidden="true" @contextmenu.prevent @dragstart.prevent /><span>Search</span>
  </button>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="public-search-dialog"
      aria-labelledby="public-search-title"
      @close="restoreFocus"
      @cancel.prevent="closeSearch"
      @click="$event.target === dialog && closeSearch()"
    >
      <header>
        <div>
          <h2 id="public-search-title">Find your next event</h2>
          <p>Search by name, city or category.</p>
        </div>
        <button
          type="button"
          class="public-search-close"
          aria-label="Close search"
          @click="closeSearch"
        >
          <XMarkIcon />
        </button>
      </header>
      <PublicEventSearch v-if="opened" filters @searched="closeSearch" />
    </dialog>
  </Teleport>
</template>

<style scoped>
.header-search-trigger {
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-8);
  min-height: 44px;
  padding: var(--ds-space-8) var(--ds-space-12);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-control);
  background: transparent;
  color: var(--ds-color-text);
  cursor: pointer;
}
.header-search-trigger svg,
.public-search-close svg {
  width: 20px;
  height: 20px;
}
.public-search-dialog {
  position: fixed;
  inset: 0;
  margin: auto;
  width: 600px;
  max-width: calc(100vw - 32px);
  max-height: calc(100dvh - 48px);
  padding: var(--ds-space-32);
  border: 1px solid var(--ds-color-border);
  border-radius: var(--ds-radius-overlay);
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  font: 400 var(--ds-size-body) / 1.6 var(--ds-font-body);
}
.public-search-dialog::backdrop {
  background: rgb(16 17 24 / 0.55);
}
.public-search-dialog :deep(button:focus-visible) {
  outline: 2px solid var(--ds-color-focus);
  outline-offset: 2px;
}
.public-search-dialog header {
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-16);
  margin-bottom: var(--ds-space-32);
}
.public-search-dialog h2 {
  margin: 0;
  font: var(--ds-weight-semibold) var(--ds-size-h2) / 1.4 var(--ds-font-heading);
}
.public-search-dialog p {
  margin-top: var(--ds-space-8);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-size-small);
}
.public-search-close {
  flex: 0 0 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: var(--ds-radius-control);
  background: transparent;
  color: var(--ds-color-text-secondary);
  cursor: pointer;
}
.public-search-close svg {
  width: 16px;
  height: 16px;
}
.public-search-close:hover {
  background: var(--ds-color-surface-subtle);
  box-shadow: none;
}
@media (max-width: 480px) {
  .public-search-dialog {
    padding: var(--ds-space-24);
  }
  .header-search-trigger {
    padding-inline: var(--ds-space-8);
  }
  .header-search-trigger span {
    display: none;
  }
}
@media (max-width: 760px) {
  .public-search-dialog { padding: var(--ds-space-20); box-sizing: border-box; }
  .public-search-dialog header { margin-bottom: var(--ds-space-16); align-items: center; }
  .public-search-dialog h2 { font-size: var(--ds-size-h4); font-weight: var(--ds-weight-medium); }
  .public-search-dialog header p { display: none; }
  .header-search-trigger { width: 44px; height: 44px; padding: 0; justify-content: center; border: 0; }
  .header-search-trigger > span { display: none; }
}
</style>
