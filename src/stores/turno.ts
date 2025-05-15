import { defineStore } from 'pinia'
import { ref } from 'vue'

interface Turno {
  n: number
  oraInizio: string
  oraFine: string
  inizioRitiro: string
  fineRitiro: string
  nome: string
}


const headers = new Headers({
  Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTAsInJ1b2xvIjoicGFuaW5hcm8iLCJpYXQiOjE3NDQzMDc2ODgsImV4cCI6MTc3NTg2NTI4OH0.noyJJ5yLRAdZ4bxIOGdlYBjSZQElmXV4KOqGGVJHl_Q`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
})

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
      const response = await fetch(`http://figliolo.it:5005/v1/turni?giorno=${giornoSettimana}`, { headers });
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
      console.log('Turni:', turni.value)
    } catch (err) {
      error.value = (err as Error).message
    } finally {
      loading.value = false
    }
  }

  const selectTurno = (n: number) => {
    const turno = turni.value.find(t => t.n === n)
    console.log('Turno selezionato:', turno)
    if (!turno) {
        console.error('Turno non trovato')
        error.value = 'Turno non trovato'
        return
    }
    selectedTurno.value = n
    console.log('Turno selezionato2:', selectedTurno.value)
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