<script setup>
import ForgotPasswordForm from '@/components/ForgotPasswordForm.vue'
</script>
<template><main class="password-page"><section class="password-card"><ForgotPasswordForm /></section></main></template>
<style scoped>.password-page{min-height:calc(100vh - var(--app-header-height,92px));padding:clamp(48px,8vw,86px) 20px;display:flex;justify-content:center;align-items:flex-start;background:var(--color-bg)}.password-card{width:min(100%,470px);padding:clamp(24px,4vw,38px);border:1px solid var(--color-border);border-radius:16px;background:var(--color-surface)}</style>
