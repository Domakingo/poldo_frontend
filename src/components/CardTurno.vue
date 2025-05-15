<script setup lang="ts">
import Card from './Card.vue'

const props = defineProps<{
    title: string
    timeRangeOrder: string
    timeRangeTake: string
    isSelected: boolean
    isOtherSelected: boolean
}>()

const emit = defineEmits(['select'])

const selectTurno = () => emit('select')

const handleOrder = () => {
    if(props.isSelected) window.location.href = '/prodotti'
}
</script>

<template>
    <Card class="turno-card" :class="{ 'selected': isSelected, 'not-selected': isOtherSelected }" @click="selectTurno">
        <div class="turno-content">
            <h2>{{ title }}</h2>
            <p>Ordina tra le {{ timeRangeOrder }}</p>
            <p>Ritira tra le {{ timeRangeTake }}</p>
            <button class="ordina-btn" @click="handleOrder">Ordina</button>
        </div>
    </Card>
</template>

<style scoped>
.turno-card {
    transition: transform 0.2s, box-shadow 0.2s;
}

.turno-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px var(--card-shadow);
}

.turno-content {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 10px;
}

.turno-content h2 {
    margin-bottom: 10px;
    color: var(--poldo-text);
}

.turno-content p {
    margin-bottom: 10px;
    color: var(--poldo-text);
    opacity: 0.8;
}

.ordina-btn {
    background-color: var(--poldo-primary);
    color: var(--poldo-text);
    border: none;
    padding: 10px 25px;
    border-radius: 20px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s;
    margin-top: 10px;
}

.turno-card.selected {
    border: 3px solid var(--poldo-primary);
    box-shadow: 0 0 20px var(--poldo-accent);
}

.turno-card.not-selected {
    opacity: 0.4;
    filter: grayscale(40%);
    transform: scale(0.95);
}
</style>
