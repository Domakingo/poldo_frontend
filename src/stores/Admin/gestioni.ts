import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API_CONFIG = {
  BASE_URL: 'http://figliolo.it:5006/v1',
}

export interface Gestione {
  id: number
  nome: string
}

export const useGestioniStore = defineStore('gestioni', () => {
  const gestioni = ref<Gestione[]>([])

  const gestioneOptions = computed(() =>
    gestioni.value.map(g => ({ value: g.id, label: g.nome }))
  )

  const fetchAll = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/gestioni`,
        { credentials: 'include' }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const rawData = await response.json()

      gestioni.value = rawData.map((item: any) => ({
        id: item.idGestione,
        nome: item.nomeGestione
      }))

    } catch (error) {
      console.error('Error fetching gestioni:', error)
      throw error
    }
  }

  fetchAll();

  return {
    gestioni,
    gestioneOptions
  }
})
