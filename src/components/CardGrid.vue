<script setup lang="ts">
defineProps<{
    minWidth?: string;
    gap?: string;
}>();
</script>

<template>
    <div class="card-grid" :style="{
        'grid-template-columns': `repeat(auto-fit, minmax(${minWidth || '300px'}, 1fr))`,
        'gap': gap || '20px'
    }">
        <slot></slot>
    </div>
</template>

<style scoped>
.card-grid {
    display: grid;
    width: 100%;
    justify-items: center;
}
</style>
