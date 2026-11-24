<script setup>
defineProps({ platform: String })
const paths = {
  whatsapp: [
    'M20 11.5a8.2 8.2 0 0 1-12 7.2L3 20l1.3-4.7A8.2 8.2 0 1 1 20 11.5Z',
    'M8.5 8.5c.8 3 3.1 5.2 6 6l1.4-1.4',
  ],
  facebook: ['M14.5 21v-8h3l.5-4h-3.5V7c0-1.1.5-1.6 1.7-1.6H18V2h-3c-4 0-5 2-5 5v2H7v4h3v8'],
  tiktok: ['M14 3v11.2a4.4 4.4 0 1 1-4.4-4.4', 'M14 4c.8 2.3 2.5 3.7 5 3.9'],
  x: ['M4 3l16 18M20 3 4 21'],
  telegram: ['M22 3 2 11l8 2.5 2 7.5L22 3ZM10 13.5 22 3'],
  twitch: ['M5 3h16v11l-5 5h-4l-3 3v-3H5V3ZM11 8v5m5-5v5'],
  snapchat: [
    'M8 17c-2 1-3 1-4 2 2 1 5 1 6 1a5 5 0 0 0 4 0c2 0 4 0 6-1-1-1-2-1-4-2M8 9a4 4 0 0 1 8 0v6',
  ],
  other: ['M4 12h16M12 4v16'],
}
</script>
<template>
  <span class="rh33-iconbox" :data-channel="platform" aria-hidden="true">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <template v-if="platform === 'instagram'">
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.7" r=".9" fill="currentColor" stroke="none" />
      </template>
      <template v-else-if="platform === 'linkedin'">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M8 10v8M8 7v.1M12 18v-8m0 3a3 3 0 0 1 6 0v5" />
      </template>
      <template v-else-if="platform === 'youtube'">
        <rect x="2" y="5" width="20" height="14" rx="4" />
        <path d="m10 9 5 3-5 3V9Z" />
      </template>
      <template v-else-if="platform === 'threads'">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 15c3 3 8 1 8-3 0-4-6-3-6-1" />
      </template>
      <template v-else-if="platform === 'email'">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="m2 7 10 7 10-7" />
      </template>
      <path v-for="(path, i) in paths[platform] || paths.other" v-else :key="i" :d="path" />
    </svg>
  </span>
</template>
