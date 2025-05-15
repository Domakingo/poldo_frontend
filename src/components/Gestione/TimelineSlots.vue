<template>
  <div class="timeline-slots">
    <div 
      v-for="slot in slots" 
      :key="slot.time" 
      class="timeline-slot"
    >
      <div class="slot-time">{{ slot.label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { calculateTimelineSlots } from '@/utils/timelineUtils'

// Slot temporali calcolati per la timeline
const slots = calculateTimelineSlots()
</script>

<style scoped>
.timeline-slots {
  display: flex;
  height: 100%;
  padding-top: 25px; /* Space for time labels */
  position: relative;
}

.timeline-slot {
  flex: 1;
  height: 100%;
  border-left: 1px dashed var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  min-width: 200px; /* Ensure each slot has substantial width */
}

/* Highlight hour marks differently than half-hour marks */
.timeline-slot:nth-child(odd) {
  border-left: 1px solid var(--poldo-primary);
  background-color: rgba(0, 0, 0, 0.01);
}

.slot-time {
  position: absolute;
  top: -22px;
  font-size: 0.8rem;
  color: var(--poldo-text);
  white-space: nowrap;
}
</style>
