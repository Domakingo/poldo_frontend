<!-- components/SwitchButtons.vue -->
<script setup lang="ts">
defineProps<{
    selected: string
    right: {
        value: string
        label: string
        icon: string
    }
    left: {
        value: string
        label: string
        icon: string
    }
}>()

const emit = defineEmits(['update:selected'])
</script>

<template>
    <div class="switch-container">
        <button 
            :key="right.value"
            class="switch-btn" 
            :class="{ active: selected === right.value }"
            @click="emit('update:selected', right.value)"
        >
            <span v-html="right.icon" class="icon"></span>
            <span>{{ right.label }}</span>
        </button>
        <button 
            :key="left.value"
            class="switch-btn" 
            :class="{ active: selected === left.value }"
            @click="emit('update:selected', left.value)"
        >
            <span v-html="left.icon" class="icon"></span>
            <span>{{ left.label }}</span>
        </button>
    </div>
</template>

<style scoped>
.switch-container {
    display: flex;
    background: var(--color-background-soft);
    border-radius: 50px;
    padding: 5px;
    box-shadow: 0 2px 8px var(--poldo-card-shadow);
}

.switch-btn {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    border: none;
    border-radius: 50px;
    background: none;
    cursor: pointer;
    transition: all 0.3s ease;
    gap: 8px;
}

.switch-btn span:not(.icon) {
    text-transform: capitalize;
    font-weight: 500;
    color: var(--poldo-text);
    transition: color 0.3s ease;
}

.switch-btn.active {
    background: var(--poldo-primary);
    box-shadow: 0 2px 8px rgba(239, 194, 12, 0.3);
}

.switch-btn.active :deep(svg) {
    stroke: var(--poldo-background);
}

.switch-btn.active span:not(.icon) {
    color: var(--poldo-background);
}

.icon :deep(svg) {
    width: 24px;
    height: 24px;
    stroke: var(--poldo-text);
    stroke-width: 1.5;
    fill: none;
    transition: stroke 0.3s ease;
}
</style>