<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue'

defineOptions({
  name: 'BaseModal',
})

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  width: {
    type: String,
    default: '550px',
  },
  showClose: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg', 'xl'].includes(value),
  },
  preventClose: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

// Close modal when Escape key is pressed
const handleKeyDown = (event) => {
  if (event.key === 'Escape' && props.show && !props.preventClose) {
    emit('close')
  }
}

// Prevent body scrolling when modal is open
const toggleBodyScroll = (shouldPrevent) => {
  if (shouldPrevent) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// Add event listener on mount
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

// Remove event listener before unmount
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeyDown)
  toggleBodyScroll(false)
})

// Watch for show prop changes to handle body scrolling
watch(
  () => props.show,
  (newVal) => {
    toggleBodyScroll(newVal)
  },
)

// Close modal
const closeModal = () => {
  if (!props.preventClose) {
    emit('close')
  }
}

// Close modal when clicking overlay
const handleOverlayClick = (event) => {
  // Only close if clicking directly on the overlay, not its children
  if (event.target === event.currentTarget && !props.preventClose) {
    emit('close')
  }
}
</script>

<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="show" class="modal-overlay" @click="handleOverlayClick">
        <div :class="['modal-container', `modal-${size}`]" :style="{ maxWidth: width }" @click.stop>
          <!-- Header -->
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button v-if="showClose" class="modal-close" @click="closeModal" aria-label="Close">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <slot></slot>
          </div>

          <!-- Footer (optional) -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  padding: 1rem;
}

.modal-container {
  background-color: var(--card-bg);
  border-radius: 10px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  max-height: calc(100vh - 2rem);
  display: flex;
  flex-direction: column;
  max-width: 100%;
  width: 100%;
}

/* Modal sizes */
.modal-sm {
  width: 400px;
}

.modal-md {
  width: 500px;
}

.modal-lg {
  width: 700px;
}

.modal-xl {
  width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  margin: 0;
  font-size: 1.2rem;
  color: var(--text-color);
}

.modal-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition:
    background-color 0.3s ease,
    color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-color);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

/* Animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: translateY(20px);
}

@media (max-width: 768px) {
  .modal-sm,
  .modal-md,
  .modal-lg,
  .modal-xl {
    width: 100%;
  }

  .modal-overlay {
    padding: 1rem;
  }
}
</style>
