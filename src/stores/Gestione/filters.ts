import { defineStore } from 'pinia'
import { ref } from 'vue'

const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/v1',
  TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZEdlc3Rpb25lIjoxLCJydW9sbyI6Imdlc3RvcmUiLCJpZCI6MTksImlhdCI6MTc0NDMwNzg0MiwiZXhwIjoxNzc1ODY1NDQyfQ.HMNTe1h81A80p-BawzVj44zSBGBVMYZRdp_vDxE2j9k'
}

const headers = new Headers({
  Authorization: `Bearer ${API_CONFIG.TOKEN}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
})

async function handleRequest<T>(endpoint: string, errorMsg: string): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}/${endpoint}`
  const response = await fetch(url, { headers, mode: 'cors' })
  if (!response.ok) throw new Error(`${errorMsg}: ${response.status}`)
  return response.json()
}

export const useFiltersStore = defineStore('filters', () => {
  const allIngredients = ref<string[]>([])
  const allTags = ref<string[]>([])

  // Fetch dati esistenti
  const fetchIngredients = async () => {
    try {
      const response = await handleRequest<{ nome: string }[]>('ingredienti', 'Errore fetch ingredienti')
      allIngredients.value = response
        .map(item => item.nome)
        .sort((a, b) => a.localeCompare(b))
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  const fetchTags = async () => {
    try {
      const response = await handleRequest<{ nome: string }[]>('tag', 'Errore fetch tags')
      allTags.value = response
        .map(item => item.nome)
        .sort((a, b) => a.localeCompare(b))
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // Creazione nuovi elementi
  const addIngredient = async (name: string) => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/ingredienti`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ nomeIngrediente: name.trim() })
      })
      await fetchIngredients()
    } catch (error) {
      console.error('Errore creazione ingrediente:', error)
      throw error
    }
  }

  const addTag = async (name: string) => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/tag`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ nomeTag: name.trim() })
      })
      await fetchTags()
    } catch (error) {
      console.error('Errore creazione tag:', error)
      throw error
    }
  }

  // Aggiornamento elementi esistenti
  const updateIngredient = async (oldName: string, newName: string) => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/ingredienti/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ nuovoNome: newName.trim() })
      })
      await fetchIngredients()
    } catch (error) {
      console.error('Errore aggiornamento ingrediente:', error)
      throw error
    }
  }

  const updateTag = async (oldName: string, newName: string) => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/tag/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ nuovoNome: newName.trim() })
      })
      await fetchTags()
    } catch (error) {
      console.error('Errore aggiornamento tag:', error)
      throw error
    }
  }

  // Inizializzazione store
  const initializeFilters = async () => {
    try {
      await Promise.all([
        fetchIngredients(),
        fetchTags()
      ])
    } catch (err) {
      console.error('initializeFilters failed:', err)
      throw err
    }
  }

  return {
    allIngredients,
    allTags,
    fetchIngredients,
    fetchTags,
    initializeFilters,
    addIngredient,
    addTag,
    updateIngredient,
    updateTag
  }
})
