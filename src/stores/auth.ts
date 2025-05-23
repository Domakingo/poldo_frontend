import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_CONFIG } from '@/utils/api'

interface User {
  id?: number
  nome: string
  foto: string
  ruolo: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref<boolean>(true)
  const isAuthenticated = ref<boolean>(false)

  const checkAuth = async () => {
  try {
    loading.value = true

    const checkResponse = await fetch(`${API_CONFIG.BASE_URL}/auth/check`, {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!checkResponse.ok) {
      console.error('User not authenticated');
      logout();
      return false;
    }
    
    const checkData = await checkResponse.json();
    loading.value = false;
    isAuthenticated.value = true;
    
    const userData: User = {
      nome: checkData.nome,
      foto: checkData.foto_url,
      ruolo: checkData.ruolo,
    };
    user.value = userData;
    return true;
    
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

  return { user, loading, isAuthenticated, checkAuth, logout }
})
