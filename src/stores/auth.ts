import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_CONFIG } from '@/utils/api'

interface User {
  id?: number
  nome: string
  foto: string
  ruolo: string
}

export const useAuthStore = defineStore('auth', () => {  const user = ref<User | null>(null)
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
    
    // Ensure all required fields are present
    const userData: User = {
      id: checkData.id || 198, // Default to 198 if ID is missing
      nome: checkData.nome || 'Local Gestore',
      foto: checkData.foto || null,
      ruolo: checkData.ruolo || 'gestore'
    };
    console.log('Authenticated user:', userData);
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
