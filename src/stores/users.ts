// This store handles all user-related API calls and state management
import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';

const API_BASE_URL = 'http://figliolo.it:5005/v1';
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDgsInJ1b2xvIjoiYWRtaW4iLCJpYXQiOjE3NDQyNzk2ODMsImV4cCI6MTc3NTgzNzI4M30.AelK6BkvrydKSqNGuXbzWGzST4yctrHvdjy66XeoMHI"

// Helper function to get auth headers with the token
const getHeaders = () => {
  return {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  };
};

// Define the User interface
interface User {
  idUtente: number;
  mail: string;
  ruolo: string;
  classe: string;
  bannato: number;
  foto_url?: string;
}

// Define the store
export const useUserStore = defineStore('user', () => {
  // State
  const users = ref<User[]>([]);
  const filteredUsers = ref<User[]>([]);
  const classi = ref<string[]>([]);
  const validRoles = ['paninaro', 'studente', 'prof', 'gestore', 'admin'];
  const selectedUser = ref<User | null>(null);
  const isLoading = ref(false);
  const error = ref('');

  // Filter state
  const filters = reactive({
    ruolo: '',
    classe: '',
    bannato: ''
  });

  // Fetch all users with optional filters
  const fetchUsers = async () => {
    isLoading.value = true;
    error.value = '';
    
    try {
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.ruolo) queryParams.append('ruolo', filters.ruolo);
      if (filters.classe) queryParams.append('classe', filters.classe);
      if (filters.bannato !== '') queryParams.append('bannato', filters.bannato);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      const response = await fetch(`${API_BASE_URL}/utenti${queryString}`, {
        method: 'GET',
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento degli utenti');
      }
      
      const data = await response.json();
      users.value = data;
      filteredUsers.value = data;
      
      // Extract unique classes
      const uniqueClasses = new Set(data.map((user: User) => user.classe));
      classi.value = [...uniqueClasses] as string[];
    } catch (err: any) {
      console.error('Error fetching users:', err);
      error.value = err.message || 'Errore nel caricamento degli utenti';
    } finally {
      isLoading.value = false;
    }
  };

  // Get a specific user by ID
  const fetchUserById = async (userId: number) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const response = await fetch(`${API_BASE_URL}/utenti/${userId}`, {
        method: 'GET',
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento dei dettagli utente');
      }
      
      const userData = await response.json();
      selectedUser.value = userData;
      return userData;
    } catch (err: any) {
      console.error('Error fetching user:', err);
      error.value = err.message || 'Errore nel caricamento dei dettagli utente';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // Ban a user
  const banUser = async (userId: number) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const response = await fetch(`${API_BASE_URL}/utenti/${userId}/ban`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Errore durante il ban dell\'utente');
      }
      
      // Refresh users list after successful ban
      await fetchUsers();
      return true;
    } catch (err: any) {
      console.error('Error banning user:', err);
      error.value = err.message || 'Errore durante il ban dell\'utente';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Unban a user
  const unbanUser = async (userId: number) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const response = await fetch(`${API_BASE_URL}/utenti/${userId}/unban`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Errore durante lo sblocco dell\'utente');
      }
      
      // Refresh users list after successful unban
      await fetchUsers();
      return true;
    } catch (err: any) {
      console.error('Error unbanning user:', err);
      error.value = err.message || 'Errore durante lo sblocco dell\'utente';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Change user role
  const changeUserRole = async (userId: number, newRole: string) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const response = await fetch(`${API_BASE_URL}/utenti/${userId}/ruolo`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ ruolo: newRole })
      });
      
      if (!response.ok) {
        throw new Error('Errore durante la modifica del ruolo');
      }
      
      return true;
    } catch (err: any) {
      console.error('Error changing role:', err);
      error.value = err.message || 'Errore durante la modifica del ruolo';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Update user class
  const updateUserClass = async (userId: number, className: string) => {
    isLoading.value = true;
    error.value = '';
    
    try {
      const response = await fetch(`${API_BASE_URL}/utenti/${userId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ classe: className })
      });
      
      if (!response.ok) {
        throw new Error('Errore durante l\'aggiornamento della classe');
      }
      
      return true;
    } catch (err: any) {
      console.error('Error updating class:', err);
      error.value = err.message || 'Errore durante l\'aggiornamento della classe';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Save all user changes
  const saveUserChanges = async (user: User) => {
    if (!user) return false;
    
    try {
      // Update user class
      const classUpdateSuccess = await updateUserClass(user.idUtente, user.classe);
      if (!classUpdateSuccess) {
        throw new Error('Errore durante l\'aggiornamento della classe');
      }
      
      // Update ban status
      const banStatusEndpoint = user.bannato === 1 ? 'ban' : 'unban';
      const response = await fetch(`${API_BASE_URL}/utenti/${user.idUtente}/${banStatusEndpoint}`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Errore durante l\'aggiornamento dello stato');
      }
      
      // Refresh users after successful updates
      await fetchUsers();
      return true;
    } catch (err: any) {
      console.error('Error saving user changes:', err);
      error.value = err.message || 'Errore durante l\'aggiornamento dell\'utente';
      return false;
    }
  };

  // Filter users by search query
  const filterUsersBySearch = (query: string) => {
    if (!query) {
      filteredUsers.value = users.value;
      return;
    }
    
    const searchQuery = query.toLowerCase();
    filteredUsers.value = users.value.filter(user => 
      user.mail.toLowerCase().includes(searchQuery)
    );
  };

  // Reset all filters
  const resetFilters = () => {
    filters.ruolo = '';
    filters.classe = '';
    filters.bannato = '';
    fetchUsers();
  };

  // Clear selected user
  const clearSelectedUser = () => {
    selectedUser.value = null;
  };

  return {
    // State
    users,
    filteredUsers,
    classi,
    validRoles,
    filters,
    selectedUser,
    isLoading,
    error,
    
    // Actions
    fetchUsers,
    fetchUserById,
    banUser,
    unbanUser,
    changeUserRole,
    updateUserClass,
    saveUserChanges,
    filterUsersBySearch,
    resetFilters,
    clearSelectedUser
  };
});
