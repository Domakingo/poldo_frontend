<script setup lang="ts">
import { computed } from 'vue'
import type { PropType } from 'vue'

type AlertType = 'info' | 'success' | 'error' | 'warning' | 'confirm'

const props = defineProps({
  type: {
    type: String as PropType<AlertType>,
    default: 'info',
    validator: (value: string) => ['info', 'success', 'error', 'warning', 'confirm'].includes(value)
  },
  message: {
    type: String,
    required: true
  }
})

const emit = defineEmits<{
  (e: 'confirm' | 'cancel' | 'close'): void
}>()

type ButtonAction = 'confirm' | 'cancel' | 'close'

const buttonConfig = computed(() => {
  switch (props.type) {
    case 'confirm':
      return [
        { text: 'Conferma', action: 'confirm' as ButtonAction, color: 'var(--poldo-green)' },
        { text: 'Annulla', action: 'cancel' as ButtonAction, color: 'var(--poldo-red)' }
      ]
    case 'error':
      return [
        { text: 'OK', action: 'close' as ButtonAction, color: 'var(--poldo-red)' }
      ]
    case 'success':
      return [
        { text: 'OK', action: 'close' as ButtonAction, color: 'var(--poldo-green)' }
      ]
    default:
      return [
        { text: 'OK', action: 'close' as ButtonAction, color: 'var(--poldo-primary)' }
      ]
  }
})

const icon = computed(() => {
  const icons = {
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    confirm: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
  } as Record<string, string>
  return icons[props.type]
})

const typeColor = computed(() => {
  const colors = {
    info: 'var(--poldo-primary)',
    success: 'var(--poldo-green)',
    error: 'var(--poldo-red)',
    warning: 'var(--poldo-accent)',
    confirm: 'var(--poldo-primary)'
  } as Record<string, string>
  return colors[props.type]
})
</script>

<template>
  <div v-if="message" class="modal-overlay">
    <div class="modal-container">
      <div class="modal-content">
        <div class="icon-container">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="icon" />
          </svg>
        </div>

        <div class="message">
          {{ message }}
        </div>

        <div class="buttons-container">
          <button
            v-for="(button, index) in buttonConfig"
            :key="index"
            class="action-button"
            :style="{ backgroundColor: button.color }"
            @click="emit(button.action)"
          >
            {{ button.text }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  background-color: var(--color-background);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  width: 90%;
  padding: 24px;
  animation: modal-appear 0.3s ease-out;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.icon-container {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(239, 194, 12, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon {
  width: 40px;
  height: 40px;
  stroke: v-bind(typeColor);
}

.message {
  text-align: center;
  font-size: 1.1rem;
  line-height: 1.5;
  color: var(--color-text);
}

.buttons-container {
  display: flex;
  gap: 12px;
  width: 100%;
  justify-content: center;
}

.action-button {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition:
    transform 0.1s ease,
    opacity 0.2s ease;
}

.action-button:hover {
  transform: translateY(-1px);
}

.action-button:active {
  transform: translateY(0);
  opacity: 0.9;
}
</style>
