import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_CONFIG } from '@/utils/api'

interface Turno {
  n: number
  oraInizio: string
  oraFine: string
  inizioRitiro: string
  fineRitiro: string
  nome: string
}

export const useTurnoStore = defineStore('turno', () => {
  const selectedTurno = ref<number>(-1)
  const turni = ref<Turno[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTurni = async () => {
    loading.value = true
    error.value = null
    try {

      const giornoSettimana = new Date().toLocaleDateString('it-IT', { weekday: 'long' }).toLowerCase().substring(0, 3)
      const response = await fetch(`${API_CONFIG.BASE_URL}/turni?giorno=${giornoSettimana}`, {credentials: 'include'});
      if (response.status === 404) throw new Error('Turni non trovati per oggi')
      if (!response.ok) throw new Error('Errore nella risposta della rete')

      const data = await response.json()

      const filtered = data.filter((item: any) =>
        item.giorno.toLowerCase() === giornoSettimana
      )

      turni.value = filtered.map((item: any) => ({
        n: item.n,
        oraInizio: item.oraInizioOrdine,
        oraFine: item.oraFineOrdine,
        inizioRitiro: item.oraInizioRitiro,
        fineRitiro: item.oraFineRitiro,
        nome: item.nome,
      }))
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  const selectTurno = (n: number) => {
    const turno = turni.value.find(t => t.n === n)
    if (!turno) {
        console.error('Turno non trovato')
        error.value = 'Turno non trovato'
        return
    }
    selectedTurno.value = n
  }

  return {
    turnoSelezionato: selectedTurno,
    turni,
    selectTurno,
    fetchTurni,
    loading,
    error,
  }
}, {
  persist: true
})
