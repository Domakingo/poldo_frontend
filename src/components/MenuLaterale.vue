<script setup lang="ts">

defineProps<{
    pages: {
        id: number
        name: string
        path: string
    }[]
}>()

const navigate = (path: string) => window.location.href = path
</script>

<template>
    <div class="menu-laterale">
        <span v-for="page in pages" :key="page.id" @click="navigate(page.path)">
            {{ page.name }}
        </span>
    </div>
</template>

<style scoped>
.menu-laterale {
    margin: 0;
    border-radius: 0 15px 15px 0;
    position: fixed;
    top: 85px;
    left: 0;
    max-width: 250px;
    max-height: calc(100vh - 85px);
    background-color: var(--menu-bg);
    box-shadow: 2px 0 5px var(--card-shadow);
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    justify-content: flex-start;
    transition: background-color 0.5s;
    z-index: 10;
    overflow-y: auto;
}

.menu-laterale>span {
    color: var(--menu-text);
    cursor: pointer;
    transition: opacity 0.3s ease;
}

.menu-laterale>span:hover {
    opacity: 0.7;
}

.hidden {
    display: none;
}
</style>
