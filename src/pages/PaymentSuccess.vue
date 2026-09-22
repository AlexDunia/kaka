<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QrcodeVue from 'qrcode.vue'
import { getCheckoutOrder, verifyCheckoutPayment } from '@/services/checkoutService'
import { getOrderToken } from '@/utils/checkoutStorage'
const route=useRoute(),router=useRouter(),order=ref(null),loading=ref(true),error=ref('')
const orderId=computed(()=>String(route.params.orderId||''))
const checkoutToken=computed(()=>getOrderToken(orderId.value))
const callbackReference=computed(()=>String(route.query.reference||route.query.trxref||''))
const paid=computed(()=>order.value?.status==='paid'),review=computed(()=>order.value?.status==='payment_review')
const groups=computed(()=>{const grouped=new Map();for(const item of order.value?.items||[]){const key=String(item.event_id);if(!grouped.has(key))grouped.set(key,{event_id:item.event_id,event_title:item.event_title,items:[]});grouped.get(key).items.push(item)}return[...grouped.values()]})
const load=async()=>{loading.value=true;error.value='';try{if(callbackReference.value){try{order.value=await verifyCheckoutPayment({reference:callbackReference.value,checkoutToken:checkoutToken.value});return}catch{}}order.value=await getCheckoutOrder({orderId:orderId.value,checkoutToken:checkoutToken.value})}catch(err){error.value=err?.response?.status===403?'You do not have access to this order.':err?.response?.status===404?'This order could not be found.':'We could not load this order.'}finally{loading.value=false}}
onMounted(load)
</script>
<template><main><section v-if="loading">Confirming your payment…</section><section v-else-if="error"><h1>We couldn't open this order</h1><p>{{error}}</p><button @click="router.push('/')">Back to events</button></section><section v-else-if="review"><h1>Payment received</h1><p>We're checking your payment or ticket availability. You do not need to pay again.</p><button @click="load">Check status</button></section><template v-else-if="paid"><section><h1>You're in.</h1><p>Payment confirmed. Your tickets are ready.</p></section><section v-for="group in groups" :key="group.event_id"><h2>{{group.event_title}}</h2><article v-for="item in group.items" :key="item.id"><div v-for="ticket in item.tickets" :key="ticket.public_id"><div><strong>{{item.ticket_name}}</strong><span>Ticket {{ticket.public_id}}</span><span v-if="ticket.admit_count>1">Admits {{ticket.admit_count}}</span></div><QrcodeVue :value="ticket.token" :size="112" level="M" render-as="svg"/></div></article></section></template><section v-else><h1>Payment is still confirming</h1><p>If you completed payment, we can check again without charging you twice.</p><button @click="load">Check again</button></section></main></template>
<style scoped>main{min-height:100vh;padding:60px 18px;background:var(--color-bg);color:var(--color-text)}section{max-width:760px;margin:0 auto 24px;padding:28px;border:1px solid var(--color-border);border-radius:16px;background:var(--color-surface)}article>div{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:14px;border:1px solid var(--color-border);margin-top:12px}span{display:block;margin-top:4px;color:var(--color-muted)}button{min-height:46px;padding:0 20px;border:0;border-radius:999px;background:var(--color-accent);color:#fff;cursor:pointer}</style>
