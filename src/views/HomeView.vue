<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import CardTurno from '@/components/CardTurno.vue'
import { useTurnoStore } from '@/stores/turno'

// Use the central turno store
const turnoStore = useTurnoStore()

onMounted(() => {
  turnoStore.fetchTurni()
  console.log('Turni fetched:', turnoStore.turni)
})

const turni = computed(() => {
  return turnoStore.turni.map(turno => ({
    n: turno.n,
    nome: turno.nome,
    oraInizio: turno.oraInizio,
    oraFine: turno.oraFine,
    inizioRitiro: turno.inizioRitiro,
    fineRitiro: turno.fineRitiro
  }))
})

// Method for handling turno selection
const selezionaTurno = (turno: number) => {
    console.log('Selected turno:', turno)
    turnoStore.selectTurno(turno)
}
</script>

<template>
    <div class="home">
        <div class="turni-container">
            <CardTurno v-for="turno in turni" :key="turno.n"
                :title="turno.nome" :timeRangeOrder="turno.oraInizio + ' - ' + turno.oraFine"
                :timeRangeTake="turno.inizioRitiro + ' - ' + turno.fineRitiro"
                :isSelected="turnoStore.turnoSelezionato === turno.n"
                :isOtherSelected="turnoStore.turnoSelezionato !== turno.n"
                @select="selezionaTurno(turno.n)" />
        </div>
    </div>
</template>

<style scoped>
.home {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    overflow-y: auto;
    box-sizing: border-box;
    padding: 20px;
}

.turni-container {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
    justify-content: center;
    max-height: calc(100% - 10vh);
    width: 100%;
}

h1 {
    margin-top: 3vh;
    margin-bottom: 1vh;
}

p {
    margin-bottom: 3vh;
}
</style>
