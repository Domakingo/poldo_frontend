import { defineStore } from 'pinia'
import { ref } from 'vue'

interface User {
  nome: string
  foto: string
  ruolo: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref<boolean>(true)

  const checkAuth = async () => {
  try {
    loading.value = true
    const response = await fetch('http://l.figliolo.it:5005/v1/auth/check', {
      method: 'GET',
      credentials: 'include',
    })

    console.log('Response:', response)

    if (!response.ok) {
      console.error('User not authenticated')
      logout()
      return false
    }

    const data = await response.json()
    loading.value = false

    const userData: User = {
      nome: data.nome,
      foto: data.foto_url,
      ruolo: data.ruolo,
    }
    user.value = userData
    return true
  } catch (error) {
    logout()
    return false
  }
}

  const logout = () => {
    user.value = null
    // Aggiungi qui la chiamata API per il logout se necessario
    window.location.href = '/login'
  }

  return { user, loading, checkAuth, logout }
})
