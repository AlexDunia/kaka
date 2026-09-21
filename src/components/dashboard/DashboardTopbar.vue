<script setup>
import { computed } from 'vue'
import AccountMenu from '@/components/AccountMenu.vue'
const props = defineProps({ event:{ type:Object, required:true }, refreshing:{ type:Boolean, default:false } })
defineEmits(['view-public','edit-event'])
const formattedMeta = computed(() => { const pieces=[]; if(props.event.starts_at){ const date=new Date(props.event.starts_at); if(!Number.isNaN(date.getTime())) pieces.push(new Intl.DateTimeFormat('en-NG',{dateStyle:'medium',timeStyle:'short',timeZone:props.event.timezone||undefined}).format(date)) } if(props.event.venue) pieces.push(props.event.venue); return pieces.join(' · ') })
const statusLabel = computed(() => ({active:'Live',draft:'Draft',completed:'Completed',cancelled:'Cancelled'}[props.event.status] || props.event.status || 'Event'))
</script>
<template><header class="topbar" aria-label="Dashboard header"><div class="topbar-manage dashboard-header-shell"><div class="dashboard-header-title-wrap"><span class="dashboard-header-kicker">Event dashboard <span v-if="refreshing" class="dashboard-refreshing-label">Updating…</span></span><div class="dashboard-title-row"><h1 class="dashboard-header-title">{{ event.title }}</h1><span class="dashboard-header-status"><span class="status-dot"></span>{{ statusLabel }}</span></div><p v-if="formattedMeta" class="dashboard-header-meta">{{ formattedMeta }}</p></div><div class="dashboard-header-right"><div class="dashboard-header-actions"><button type="button" class="btn btn-ghost dashboard-header-action" @click="$emit('view-public')">View public page</button><button type="button" class="btn btn-primary dashboard-header-action" @click="$emit('edit-event')">Edit event</button></div><AccountMenu context="dashboard" /></div></div></header></template>
<style scoped>.dashboard-refreshing-label{margin-left:8px;color:var(--color-muted);font-size:.68rem;font-weight:550}</style>
