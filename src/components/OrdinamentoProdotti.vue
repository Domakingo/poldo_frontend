<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  opzioni: Array<{ valore: string; etichetta: string }>
  modello: string
}>()

const emit = defineEmits(['cambia-ordine'])

const ordineSelezionato = ref(props.modello)

watch(() => props.modello, (nuovoValore) => {
  ordineSelezionato.value = nuovoValore
})

const cambiaOrdine = () => {
  emit('cambia-ordine', ordineSelezionato.value)
}
</script>

<template>
  <div class="ordinamento-container">
    <div class="ordinamento-label">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 6h18M7 12h10M5 18h14" />
      </svg>
      <span>Ordina per:</span>
    </div>

    <div class="opzioni-container">
      <button
        v-for="opzione in opzioni"
        :key="opzione.valore"
        class="opzione-btn"
        :class="{ 'attivo': ordineSelezionato === opzione.valore }"
        @click="ordineSelezionato = opzione.valore; cambiaOrdine()"
      >
        {{ opzione.etichetta }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ordinamento-container {
  display: flex;
  align-items: center;
  background: var(--color-background-soft);
  width: fit-content;
  border-radius: 12px;
  padding: 10px 15px;
  margin: 0 20px 15px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.ordinamento-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: var(--poldo-text);
  margin-right: 15px;
  flex-shrink: 0;
}

.opzioni-container {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: thin;
}

.opzioni-container::-webkit-scrollbar {
  height: 4px;
}

.opzioni-container::-webkit-scrollbar-thumb {
  background: var(--poldo-primary);
  border-radius: 2px;
}

.opzione-btn {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--poldo-text);
  font-size: 0.9rem;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}

.opzione-btn:hover {
  background: rgba(255, 179, 71, 0.1);
}

.opzione-btn.attivo {
  background: var(--poldo-primary);
  color: white;
  border-color: var(--poldo-primary);
}

@media (max-width: 768px) {
  .ordinamento-container {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .opzioni-container {
    width: 100%;
  }
}
</style>
