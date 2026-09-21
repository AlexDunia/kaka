<script setup>
import { computed } from 'vue'
const props=defineProps({event:{type:Object,required:true}})
const formattedDate=computed(()=>{if(!props.event.starts_at)return '';const date=new Date(props.event.starts_at);return Number.isNaN(date.getTime())?'':new Intl.DateTimeFormat('en-NG',{dateStyle:'medium',timeStyle:'short',timeZone:props.event.timezone||undefined}).format(date)})
const countdown=computed(()=>{if(!props.event.starts_at)return '';const diff=new Date(props.event.starts_at).getTime()-Date.now();if(!Number.isFinite(diff))return '';if(diff<=0)return 'Event started';const days=Math.ceil(diff/86400000);return days===1?'Tomorrow':`${days} days to go`})
</script>
<template><div class="event-hero"><img v-if="event.image" :src="event.image" :alt="event.title"><div class="event-hero-overlay"></div><div class="event-hero-content"><div class="hero-status"><span class="status-dot"></span>{{ event.status === 'active' ? 'Live' : event.status }}</div><div class="hero-title">{{ event.title }}</div><div class="hero-meta"><div v-if="formattedDate" class="hero-meta-item">{{ formattedDate }}</div><div v-if="event.venue" class="hero-meta-item">{{ event.venue }}</div><div v-if="countdown" class="hero-countdown">{{ countdown }}</div></div></div></div></template>
