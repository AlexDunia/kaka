<script setup>
import { computed, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'
import { isNavigationFailure, NavigationFailureType, useRoute, useRouter } from 'vue-router'
import { MagnifyingGlassIcon } from '@/components/icons/pngIcons'
import { ChevronDownIcon, ArrowRightIcon } from '@heroicons/vue/24/outline'
import { getPublicCategories } from '@/services/publicCatalog'
const props = defineProps({ discovery: Boolean, filters: Boolean })
const emit = defineEmits(['searched'])
const cityId = useId()
const categoryId = useId()
const searching = ref(false)
const searchError = ref('')
const categories = ref([])
const categoryError = ref(false)
const categoriesLoading = ref(false)
let request
function routeCategory() {
  return route.query.category || route.meta.discoveryCategory || ''
}
const route = useRoute()
const router = useRouter()
const category = ref(String(routeCategory()))
const query = ref(String(route.query.q || ''))
const city = ref(String(route.query.city || 'all'))
const cities = ['Lagos', 'Abuja', 'Ibadan', 'Port Harcourt']
const cityInput = computed({
  get: () => city.value === 'all' ? '' : city.value,
  set: (value) => { city.value = value || 'all' },
})
watch(
  () => route.query,
  (value) => {
    query.value = String(value.q || '')
    city.value = String(value.city || 'all')
    category.value = String(routeCategory())
  },
)
async function loadCategories() {
  request?.abort()
  request = new AbortController()
  categoriesLoading.value = true
  categoryError.value = false
  try {
    categories.value = await getPublicCategories(request.signal)
  } catch (error) {
    if (error.code !== 'ERR_CANCELED') categoryError.value = true
  } finally {
    categoriesLoading.value = false
  }
}
onMounted(() => {
  if (props.filters) void loadCategories()
})
onBeforeUnmount(() => request?.abort())
async function search() {
  if (searching.value) return
  searching.value = true
  searchError.value = ''
  try {
    const selectedCategory = props.filters ? category.value : routeCategory()
    const failure = await router.push({
      name: 'find-events',
      query: {
        ...(query.value.trim() ? { q: query.value.trim() } : {}),
        ...(city.value !== 'all' && city.value.trim() ? { city: city.value.trim() } : {}),
        ...(selectedCategory ? { category: selectedCategory } : {}),
      },
      hash: '#discover',
    })
    if (!failure || isNavigationFailure(failure, NavigationFailureType.duplicated)) emit('searched')
    else searchError.value = "Search couldn't open. Please try again."
  } catch {
    searchError.value = "Search couldn't open. Please try again."
  } finally {
    searching.value = false
  }
}
</script>
<template>
  <form
    :class="filters ? 'search-with-filters' : 'hero-search'"
    role="search"
    @submit.prevent="search"
  >
    <template v-if="filters">
      <label class="search-field">
        <span>Event name</span>
        <div class="search-input-wrap">
          <MagnifyingGlassIcon aria-hidden="true" />
          <input
            v-model="query"
            type="search"
            placeholder="Search events or artists"
            autocomplete="off"
          />
        </div>
      </label>
      <div class="search-filter-grid">
        <label class="search-field" :for="cityId">
          <span>City</span>
          <div class="search-select-wrap">
            <input :id="cityId" v-model="cityInput" type="text" :list="`${cityId}-suggestions`" placeholder="Any city" maxlength="255" autocomplete="off" />
            <datalist :id="`${cityId}-suggestions`"><option v-for="place in cities" :key="place" :value="place" /></datalist>
            <ChevronDownIcon aria-hidden="true" />
          </div>
        </label>
        <label class="search-field" :for="categoryId">
          <span>Category</span>
          <div class="search-select-wrap">
            <select :id="categoryId" v-model="category" :disabled="categoriesLoading">
              <option value="">
                {{ categoriesLoading ? 'Loading categories...' : 'All categories' }}
              </option>
              <option
                v-if="category && !categories.some((item) => item.value === category)"
                :value="category"
              >
                {{ category }}
              </option>
              <option v-for="item in categories" :key="item.value" :value="item.value">
                {{ item.name }}
              </option>
            </select>
            <ChevronDownIcon aria-hidden="true" />
          </div>
        </label>
      </div>
      <p v-if="categoryError" class="search-filter-error" role="status">
        We couldn’t load categories. <button type="button" @click="loadCategories">Try again</button>
      </p>
      <div class="search-form-actions">
        <button class="search-submit" type="submit" :disabled="searching" :aria-busy="searching">
          Find events <ArrowRightIcon aria-hidden="true" />
        </button>
      </div>
    </template>
    <template v-else>
      <label
        ><svg class="icon" aria-hidden="true"><use href="#i-search" /></svg
        ><span class="visually-hidden">Search events</span
        ><input
          v-model="query"
          type="search"
          placeholder="Search events or artists"
          autocomplete="off"
      /></label>
      <label class="visually-hidden" :for="cityId">City</label>
      <select :id="cityId" v-model="city" aria-label="Choose a city">
        <option value="all">All cities</option>
        <option v-if="city !== 'all' && !cities.includes(city)" :value="city">{{ city }}</option>
        <option v-for="place in cities" :key="place">{{ place }}</option>
      </select>
      <button class="btn btn-primary" type="submit" :disabled="searching" :aria-busy="searching">
        Find events <ArrowRightIcon class="icon" aria-hidden="true" />
      </button>
    </template>
    <p v-if="searchError" class="search-filter-error" role="status">{{ searchError }}</p>
  </form>
</template>

<style scoped>
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
.search-with-filters {
  display: grid;
  gap: var(--ds-space-24);
  margin: 0;
}
.search-field {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-8);
  min-width: 0;
}
.search-field > span {
  font-size: var(--ds-size-label);
  font-weight: var(--ds-weight-semibold);
  color: var(--ds-color-text-secondary);
}
.search-filter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-24);
}
.search-input-wrap,
.search-select-wrap {
  position: relative;
}
.search-with-filters :is(input, select) {
  box-sizing: border-box;
  width: 100%;
  min-height: 46px;
  padding: 12px 14px;
  border: 1px solid var(--ds-color-border-control);
  border-radius: var(--ds-radius-control);
  background: var(--ds-color-surface);
  color: var(--ds-color-text);
  font: 400 var(--ds-size-body) / 1.3 var(--ds-font-body);
  outline: none;
}
.search-with-filters .search-input-wrap input {
  padding-left: 42px;
}
.search-with-filters .search-select-wrap input { padding-right: 40px; }
.search-with-filters input::placeholder {
  color: var(--ds-color-text-muted);
  opacity: 1;
}
.search-with-filters select {
  appearance: none;
  padding-right: 40px;
  cursor: pointer;
}
.search-with-filters select:disabled {
  opacity: 0.6;
  cursor: wait;
}
.search-with-filters :is(input, select):focus {
  border-color: var(--ds-color-focus);
  box-shadow: var(--ds-shadow-focus);
  outline: none;
}
.search-with-filters svg {
  width: 18px;
  height: 18px;
  stroke-width: 1.5;
  flex-shrink: 0;
}
.search-input-wrap > svg,
.search-select-wrap > svg {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ds-color-text-secondary);
  pointer-events: none;
}
.search-input-wrap > svg {
  left: 14px;
}
.search-select-wrap > svg {
  right: 14px;
}
.search-form-actions {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--ds-color-border);
  padding-top: var(--ds-space-24);
  margin-top: var(--ds-space-8);
}
.search-with-filters .search-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-12);
  min-height: 44px;
  padding: 12px 20px;
  border: 1px solid transparent;
  border-radius: var(--ds-radius-control);
  background: var(--ds-color-action);
  color: var(--ds-color-on-action);
  font: var(--ds-weight-medium) var(--ds-size-body) / 1.3 var(--ds-font-body);
  text-transform: none;
  letter-spacing: normal;
  cursor: pointer;
}
.search-with-filters .search-submit:hover {
  background: var(--ds-color-action-hover);
  box-shadow: none;
}
.search-filter-error {
  margin: 0;
  font-size: var(--ds-size-small);
  color: var(--ds-color-text-secondary);
}
.search-filter-error button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--ds-color-brand);
  font: inherit;
  text-transform: none;
  letter-spacing: normal;
  text-decoration: underline;
  cursor: pointer;
}
@media (max-width: 480px) {
  .search-filter-grid {
    grid-template-columns: 1fr;
  }
  .search-submit {
    width: 100%;
  }
}
@media (max-width: 760px) {
  .search-with-filters { gap: var(--ds-space-16); }
  .search-with-filters > .search-field > span {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap;
  }
  .search-field > span { font-weight: var(--ds-weight-medium); }
  .search-with-filters :is(input, select) { min-height: 44px; padding-block: 10px; font-weight: var(--ds-weight-regular); }
  .search-filter-grid { gap: var(--ds-space-16); }
  .search-form-actions { margin-top: 0; padding-top: var(--ds-space-16); }
}
</style>
