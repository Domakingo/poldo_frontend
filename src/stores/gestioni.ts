// This store handles all gestione-related API calls and state management
import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';
import { API_CONFIG } from '@/utils/api';

// Define the Gestione interface
export interface Gestione {
  idGestione: number;
  nome: string;
}

// Define the GestioneUser interface for users associated with a gestione
export interface GestioneUser {
  idUtente: number;
  mail: string;
  ruolo: string;
  classe?: string;
  bannato?: boolean;
  foto_url?: string;
  username?: string;
}

// Define the store
export const useGestioneStore = defineStore('gestione', () => {
  // State
  const gestioni = ref<Gestione[]>([]);
  const selectedGestione = ref<Gestione | null>(null);
  const gestioneUsers = ref<GestioneUser[]>([]);
  const isLoading = ref(false);
  const error = ref('');

  // Fetch all gestioni
  const fetchGestioni = async () => {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/gestioni`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento delle gestioni');
      }

      const data = await response.json();
      gestioni.value = data;
    } catch (err: any) {
      console.error('Error fetching gestioni:', err);
      error.value = err.message || 'Errore nel caricamento delle gestioni';
    } finally {
      isLoading.value = false;
    }
  };

  // Get a specific gestione by ID
  const fetchGestioneById = async (gestioneId: number) => {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/gestioni/${gestioneId}`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento dei dettagli gestione');
      }

      const gestioneData = await response.json();
      selectedGestione.value = gestioneData;
      return gestioneData;
    } catch (err: any) {
      console.error('Error fetching gestione:', err);
      error.value = err.message || 'Errore nel caricamento dei dettagli gestione';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Create a new gestione
  const createGestione = async (nome: string, utenteId?: number) => {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/gestioni`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ nome, utenteId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella creazione della gestione');
      }

      const result = await response.json();
      await fetchGestioni(); // Refresh the list
      return result;
    } catch (err: any) {
      console.error('Error creating gestione:', err);
      error.value = err.message || 'Errore nella creazione della gestione';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Update a gestione
  const updateGestione = async (gestioneId: number, nome: string) => {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/gestioni/${gestioneId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ nome })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nell\'aggiornamento della gestione');
      }

      const result = await response.json();
      await fetchGestioni(); // Refresh the list
      return result;
    } catch (err: any) {
      console.error('Error updating gestione:', err);
      error.value = err.message || 'Errore nell\'aggiornamento della gestione';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Delete a gestione
  const deleteGestione = async (gestioneId: number) => {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/gestioni/${gestioneId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nell\'eliminazione della gestione');
      }

      const result = await response.json();
      await fetchGestioni(); // Refresh the list
      return result;
    } catch (err: any) {
      console.error('Error deleting gestione:', err);
      error.value = err.message || 'Errore nell\'eliminazione della gestione';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Add a user to a gestione
  const addUserToGestione = async (gestioneId: number, utenteId: number) => {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/gestioni/${gestioneId}/utenti`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ utenteId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nell\'associazione dell\'utente alla gestione');
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      console.error('Error adding user to gestione:', err);
      error.value = err.message || 'Errore nell\'associazione dell\'utente alla gestione';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Remove a user from a gestione
  const removeUserFromGestione = async (gestioneId: number, utenteId: number) => {
    isLoading.value = true;
    error.value = '';

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/gestioni/${gestioneId}/utenti/${utenteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Errore nella rimozione dell\'utente dalla gestione');
      }

      const result = await response.json();
      return result;
    } catch (err: any) {
      console.error('Error removing user from gestione:', err);
      error.value = err.message || 'Errore nella rimozione dell\'utente dalla gestione';
      return null;
    } finally {
      isLoading.value = false;
    }
  };
  // Fetch users associated with a gestione
  const fetchGestioneUsers = async (gestioneId: number) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/gestioni/${gestioneId}/utenti`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Handle errors before trying to parse the response as JSON
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Errore ${response.status}: ${response.statusText}`);
        } else {
          // If not JSON, get the text instead
          const errorText = await response.text();
          console.error('Error response (non-JSON):', errorText.substring(0, 200) + '...');
          throw new Error(`Errore ${response.status}: ${response.statusText}`);
        }
      }
      
      const users = await response.json();
      gestioneUsers.value = users;
      return users;
    } catch (err: any) {
      console.error('Error fetching gestione users:', err);
      error.value = err.message || 'Errore nel recupero degli utenti della gestione';
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  return {
    // State
    gestioni,
    selectedGestione,
    gestioneUsers,
    isLoading,
    error,
    
    // Actions
    fetchGestioni,
    fetchGestioneById,
    createGestione,
    updateGestione,
    deleteGestione,
    addUserToGestione,
    removeUserFromGestione,
    fetchGestioneUsers
  };
});
