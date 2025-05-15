<template>
  <div class="timeline-indicators">
    <!-- Current time indicator (follows actual time position) -->
    <div class="current-time-indicator" :style="{ left: `${currentTimePosition}%` }">
      <div class="time-label">{{ formattedCurrentTime }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { calculateTimePosition } from '@/utils/timelineUtils'

const props = defineProps<{
  currentTime: Date
}>()

// Formatta l'ora corrente come HH:MM
const formattedCurrentTime = computed(() => {
  return props.currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

// Calcola la posizione dell'ora corrente per l'indicatore
const currentTimePosition = computed(() => {
  const now = props.currentTime
  const timeString = `${now.getHours()}:${now.getMinutes()}`
  return calculateTimePosition(timeString)
})
</script>

<style scoped>
.timeline-indicators {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Ensures the indicators don't block interactions */
  z-index: 5; /* Base z-index for the container */
}
.current-time-indicator {
  position: absolute;
  top: 0;
  height: 100%;
  width: 3px;
  background-color: var(--poldo-red, #f44336);
  z-index: 10;
  box-shadow: 0 0 8px rgba(255, 0, 0, 0.6);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { opacity: 0.7; }
  50% { opacity: 1; }
  100% { opacity: 0.7; }
}

.current-time-indicator .time-label {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--poldo-red, #f44336);
  color: white;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  white-space: nowrap;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

</style>