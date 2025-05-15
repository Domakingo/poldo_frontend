<script setup lang="ts">
defineProps<{
    width?: string;
    height?: string;
    class?: string;
}>();
</script>

<template>
    <div class="card" :style="{
        width: width || 'auto',
        height: height || 'auto'
    }">
        <slot></slot>
    </div>
</template>

<style scoped>
.card {
    padding: 20px;
    border-radius: 20px;
    transition: all 0.3s;
    background: var(--card-bg);
    color: var(--card-text);
    box-shadow: 0 2px 8px var(--card-shadow);
}
</style>
