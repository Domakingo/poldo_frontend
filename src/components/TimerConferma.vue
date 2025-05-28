<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  }
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const minTime = computed(() => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 30)
  return now.toTimeString().slice(0, 5)
})

const isTimeValid = computed(() => {
  if (!props.modelValue) return false
  const selected = new Date(`1970-01-01T${props.modelValue}`)
  const minimum = new Date(`1970-01-01T${minTime.value}`)
  return selected >= minimum
})

const timeInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  if (!props.modelValue) {
    const defaultValue = new Date()
    defaultValue.setMinutes(defaultValue.getMinutes() + 30)
    const timeString = defaultValue.toTimeString().slice(0, 5)
    emit('update:modelValue', timeString)
  }
  timeInput.value?.focus()
})
</script>

<template>
  <div class="modal-overlay">
    <div class="modal-container">
      <div class="modal-content">
        <div class="icon-container">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div class="time-selection">
          <h3 class="title">Seleziona un orario</h3>
          <input
            ref="timeInput"
            type="time"
            :min="minTime"
            :value="modelValue"
            @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
            class="time-input"
            aria-label="Seleziona un orario"
          />
          <div v-if="!isTimeValid" class="error-message">
            ⚠️ L'orario deve essere almeno 30 minuti nel futuro
          </div>
        </div>

        <div class="buttons-container">
          <button
            class="action-button"
            :style="{ backgroundColor: 'var(--poldo-red)' }"
            @click="$emit('cancel')"
            aria-label="Annulla operazione"
          >
            Annulla
          </button>
          <button
            class="action-button"
            :style="{ backgroundColor: isTimeValid ? 'var(--poldo-green)' : '#cccccc' }"
            :disabled="!isTimeValid"
            @click="$emit('confirm')"
            aria-label="Conferma orario selezionato"
          >
            Conferma
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
  backdrop-filter: blur(2px);
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
  background-color: rgba(99, 102, 241, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
}

.icon {
  width: 40px;
  height: 40px;
  stroke: var(--poldo-primary);
}

.title {
  margin: 0;
  color: var(--color-text);
  font-size: 1.2rem;
  font-weight: 600;
}

.time-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.time-input {
  padding: 10px 16px;
  border-radius: 8px;
  border: 2px solid var(--poldo-primary);
  font-size: 1.1rem;
  background-color: var(--color-background-soft);
  color: var(--color-text);
  width: 160px;
  text-align: center;
  transition: border-color 0.3s ease;
}

.time-input:focus {
  outline: none;
  border-color: var(--poldo-accent);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.error-message {
  color: var(--poldo-red);
  font-size: 0.9rem;
  text-align: center;
  max-width: 250px;
  line-height: 1.4;
  margin-top: 8px;
}

.buttons-container {
  display: flex;
  gap: 12px;
  width: 100%;
  justify-content: center;
  margin-top: 16px;
}

.action-button {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
  min-width: 100px;
}

.action-button:hover:not(:disabled) {
  transform: translateY(-1px);
  opacity: 0.9;
}

.action-button:active:not(:disabled) {
  transform: translateY(0);
}

.action-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background-color: #cccccc !important;
}
</style>