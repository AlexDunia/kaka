<script setup>
defineProps({
  headers: Array,
  rows: Array,
  empty: { type: String, default: 'No records to show yet.' },
})
defineEmits(['navigate'])
</script>
<template>
  <div class="rhe-card rhea-table-wrap">
    <div class="rh-table-scroll" tabindex="0" role="region" :aria-label="`${headers[0]} table`">
      <table class="rh-data-table">
        <thead>
          <tr>
            <th v-for="header in headers" :key="header" scope="col">{{ header }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="row.key || index">
            <td v-for="(cell, i) in row.cells" :key="i">
              <a
                v-if="cell.query"
                class="rhea-open"
                :href="cell.href"
                :aria-label="cell.label"
                @click.prevent="$emit('navigate', cell.query)"
                >{{ cell.text }}</a
              >
              <template v-else
                ><strong v-if="cell.strong">{{ cell.text }}</strong
                ><template v-else>{{ cell.text }}</template
                ><small v-if="cell.sub">{{ cell.sub }}</small></template
              >
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="headers.length">{{ empty }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
