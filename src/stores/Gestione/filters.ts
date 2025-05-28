import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_CONFIG } from '@/utils/api'

async function handleRequest<T>(endpoint: string, errorMsg: string): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}/${endpoint}`
  const response = await fetch(url, { credentials: 'include', mode: 'cors' })
  if (!response.ok) throw new Error(`${errorMsg}: ${response.status}`)
  return response.json()
}

export const useFiltersStore = defineStore('filters', () => {
  const allIngredients = ref<string[]>([])
  const allTags = ref<string[]>([])

  const logError = (context: string, err: unknown) => {
    console.error(`Errore in ${context}:`, {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : null
    })
  }

  const fetchIngredients = async () => {
    try {
      const response = await handleRequest<{ nome: string }[]>('ingredienti', 'Errore fetch ingredienti')
      allIngredients.value = response
        .map(item => item.nome)
        .sort((a, b) => a.localeCompare(b))
    } catch (err) {
      logError('fetchIngredients', err)
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
      logError('fetchTags', err)
      throw err
    }
  }

  const addIngredient = async (name: string) => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/ingredienti`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ nomeIngrediente: name.trim() }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      await fetchIngredients()
    } catch (err) {
      logError('addIngredient', err)
      throw err
    }
  }

  const addTag = async (name: string) => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/tag`, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ nomeTag: name.trim() }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      await fetchTags()
    } catch (err) {
      logError('addTag', err)
      throw err
    }
  }

  const updateIngredient = async (oldName: string, newName: string) => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/ingredienti/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        credentials: 'include',
        body: JSON.stringify({ nuovoNome: newName.trim() }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      await fetchIngredients()
    } catch (err) {
      logError('updateIngredient', err)
      throw err
    }
  }

  const updateTag = async (oldName: string, newName: string) => {
    try {
      await fetch(`${API_CONFIG.BASE_URL}/tag/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        credentials: 'include',
        body: JSON.stringify({ nuovoNome: newName.trim() }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      await fetchTags()
    } catch (err) {
      logError('updateTag', err)
      throw err
    }
  }

  const initializeFilters = async () => {
    try {
      await Promise.all([
        fetchIngredients(),
        fetchTags()
      ])
    } catch (err) {
      logError('initializeFilters', err)
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
