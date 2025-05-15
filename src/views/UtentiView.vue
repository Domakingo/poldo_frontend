<template>
  <div class="utenti-admin-container">
    <h1 class="page-title">Gestione Utenti</h1>
    
    <!-- Alert per messaggi di feedback -->
    <Alert 
      v-if="alertMessage" 
      :message="alertMessage" 
      :type="alertType" 
      @close="alertMessage = ''" 
    />

    <!-- Filtri di ricerca -->
    <div class="filters-container">
      <div class="filter-group">
        <label for="ruolo">Filtra per Ruolo:</label>
        <select id="ruolo" v-model="filters.ruolo" @change="fetchUtenti">
          <option value="">Tutti</option>
          <option v-for="role in validRoles" :key="role" :value="role">
            {{ capitalizeFirst(role) }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="classe">Filtra per Classe:</label>
        <select id="classe" v-model="filters.classe" @change="fetchUtenti">
          <option value="">Tutte</option>
          <option v-for="classe in classi" :key="classe" :value="classe">
            {{ classe }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label for="bannato">Stato:</label>
        <select id="bannato" v-model="filters.bannato" @change="fetchUtenti">
          <option value="">Tutti</option>
          <option value="0">Attivi</option>
          <option value="1">Bannati</option>
        </select>
      </div>

      <button class="filter-btn clear" @click="resetFilters">Reset Filtri</button>
      
      <div class="filter-group search">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Cerca per email..."
          @input="filterBySearch"
        />
      </div>    </div>
  </div>

    <!-- Tabella utenti -->
    <div class="table-container">
      <div class="table-scroll-container">
        <table v-if="users.length > 0">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Ruolo</th>
              <th>Classe</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.idUtente" :class="{ 'banned': user.bannato === 1 }">
            <td>{{ user.idUtente }}</td>
            <td>{{ user.mail }}</td>
            <td>
              <select
                v-model="user.ruolo"
                :id="`role-${user.idUtente}`"
                @change="changeRole(user)"
              >
                <option v-for="role in validRoles" :key="role" :value="role">
                  {{ capitalizeFirst(role) }}
                </option>
              </select>
            </td>
            <td>{{ user.classe }}</td>
            <td>
              <span :class="user.bannato === 1 ? 'status-banned' : 'status-active'">
                {{ user.bannato === 1 ? 'Bannato' : 'Attivo' }}
              </span>
            </td>
            <td class="actions">
              <button 
                v-if="user.bannato === 0" 
                class="btn ban" 
                @click="banUser(user.idUtente)"
              >
                Banna
              </button>
              <button 
                v-else 
                class="btn unban" 
                @click="unbanUser(user.idUtente)"
              >
                Sbanna
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="no-data">
        <p>Nessun utente trovato.</p>
      </div>
    </div>

    <!-- Modal per la modifica dell'utente -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Dettagli Utente</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div v-if="selectedUser" class="modal-body">
          <div class="user-details">
            <p><strong>ID:</strong> {{ selectedUser.idUtente }}</p>
            <p><strong>Email:</strong> {{ selectedUser.mail }}</p>
            <p><strong>Ruolo:</strong> {{ capitalizeFirst(selectedUser.ruolo) }}</p>
            
            <div class="form-group">
              <label for="user-class">Classe:</label>
              <select id="user-class" v-model="selectedUser.classe">
                <option v-for="classe in classi" :key="classe" :value="classe">
                  {{ classe }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="user-status">Stato:</label>
              <div class="status-toggle">
                <span>Attivo</span>
                <Switch 
                  :checked="selectedUser.bannato === 1" 
                  @change="toggleUserStatus" 
                />
                <span>Bannato</span>
              </div>
            </div>

            <div v-if="selectedUser.foto_url" class="user-image">
              <p><strong>Foto:</strong></p>
              <img :src="selectedUser.foto_url" alt="Foto profilo" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn cancel" @click="closeModal">Annulla</button>
          <button class="btn save" @click="saveUserChanges">Salva Modifiche</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import Alert from '@/components/Alert.vue';
import Switch from '@/components/Switch.vue';
import { useUserStore } from '@/stores/users';

export default {
  name: 'UtentiView',
  components: {
    Alert,
    Switch
  },
  setup() {
    // Use the user store
    const userStore = useUserStore();
    
    // Local state for UI
    const searchQuery = ref('');
    const alertMessage = ref('');
    const alertType = ref('success');
    const showModal = ref(false);
    
    // Accessors to store state
    const users = computed(() => userStore.users);
    const filteredUsers = computed(() => userStore.filteredUsers);
    const classi = computed(() => userStore.classi);
    const validRoles = userStore.validRoles;
    const filters = userStore.filters;
    const selectedUser = computed(() => userStore.selectedUser);
    
    // UI functions
    const filterBySearch = () => {
      userStore.filterUsersBySearch(searchQuery.value);
    };
    
    const resetFilters = () => {
      searchQuery.value = '';
      userStore.resetFilters();
    };
    
      const closeModal = () => {
      showModal.value = false;
      userStore.clearSelectedUser();
    };
    
    const toggleUserStatus = (value) => {
      if (selectedUser.value) {
        selectedUser.value.bannato = value ? 1 : 0;
      }
    };
    
    const saveUserChanges = async () => {
      if (!selectedUser.value) return;
      
      try {
        const success = await userStore.saveUserChanges(selectedUser.value);
        
        if (success) {
          showAlert('Utente aggiornato con successo', 'success');
          closeModal();
        } else {
          throw new Error(userStore.error || 'Errore durante l\'aggiornamento dell\'utente');
        }
      } catch (error) {
        console.error('Errore:', error);
        showAlert('Errore durante l\'aggiornamento dell\'utente', 'error');
      }
    };
    
    const banUser = async (userId) => {
      try {
        const success = await userStore.banUser(userId);
        if (success) {
          showAlert('Utente bannato con successo', 'success');
        } else {
          throw new Error(userStore.error);
        }
      } catch (error) {
        console.error('Errore:', error);
        showAlert('Errore durante il ban dell\'utente', 'error');
      }
    };
    
    const unbanUser = async (userId) => {
      try {
        const success = await userStore.unbanUser(userId);
        if (success) {
          showAlert('Utente sbloccato con successo', 'success');
        } else {
          throw new Error(userStore.error);
        }
      } catch (error) {
        console.error('Errore:', error);
        showAlert('Errore durante lo sblocco dell\'utente', 'error');
      }
    };
    
    const changeRole = async (user) => {
      try {
        const success = await userStore.changeUserRole(user.idUtente, user.ruolo);
        if (success) {
          showAlert('Ruolo aggiornato con successo', 'success');
        } else {
          throw new Error(userStore.error);
        }
      } catch (error) {
        console.error('Errore:', error);
        showAlert('Errore durante la modifica del ruolo', 'error');
      }
    };
      // Funzioni di utilità
    const showAlert = (message, type = 'success') => {
      alertMessage.value = message;
      alertType.value = type;
      
      // Nascondi l'alert dopo 5 secondi
      setTimeout(() => {
        alertMessage.value = '';
      }, 5000);
    };
    
    const capitalizeFirst = (str) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    };
    
    // Carica i dati all'avvio
    onMounted(() => {
      fetchUtenti();
    });
    
    // Alias per consistenza con il resto del codice
    const fetchUtenti = userStore.fetchUsers;
    
    return {
      users,
      filteredUsers,
      classi,
      validRoles,
      filters,
      searchQuery,
      alertMessage,
      alertType,
      showModal,
      selectedUser,
      fetchUtenti,
      filterBySearch,
      resetFilters,
      banUser,
      unbanUser,
      changeRole,
      closeModal,
      toggleUserStatus,
      saveUserChanges,
      capitalizeFirst
    };
  }
};
</script>

<style scoped>
.utenti-admin-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 1.8rem;
  margin-bottom: 20px;
  color: var(--color-heading);
}

.filters-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  background-color: var(--color-background-soft);
  padding: 15px;
  border-radius: 8px;
  align-items: center;
}

.filter-group {
  display: flex;
  flex-direction: column;
  min-width: 150px;
}

.filter-group label {
  font-size: 0.85rem;
  color: var(--color-text);
  opacity: 0.8;
  margin-bottom: 5px;
}

.filter-group select, .filter-group input {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
}

.filter-group.search {
  flex-grow: 1;
}

.filter-group.search input {
  width: 100%;
}

.filter-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  align-self: flex-end;
  margin-top: 20px;
}

.filter-btn.clear {
  background-color: var(--color-background-soft);
  color: var(--color-text);
  opacity: 0.8;
}

.filter-btn.clear:hover {
  background-color: var(--color-background-mute);
}

.table-container {
  overflow-x: auto;
  background-color: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--card-shadow);
}

.table-scroll-container {
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  background-color: var(--color-background-soft);
  text-align: left;
  padding: 12px 15px;
  font-weight: 600;
  color: var(--color-heading);
  border-bottom: 2px solid var(--color-border);
}

td {
  padding: 12px 15px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: middle;
}

tr:last-child td {
  border-bottom: none;
}

tr.banned {
  background-color: var(--red);
  opacity: 0.9;
}

.status-active, .status-banned {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-active {
  background-color: var(--green);
  color: var(--color-background);
  opacity: 0.8;
}

.status-banned {
  background-color: var(--red);
  color: var(--color-background);
  opacity: 0.8;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn.ban {
  background-color: var(--red);
  color: var(--color-background);
}

.btn.ban:hover {
  background-color: var(--red);
  opacity: 0.8;
}

.btn.unban {
  background-color: var(--green);
  color: var(--color-background);
}

.btn.unban:hover {
  background-color: var(--green);
  opacity: 0.8;
}

.btn.edit {
  background-color: var(--poldo-accent);
  color: var(--color-background);
}

.btn.edit:hover {
  background-color: var(--poldo-primary);
}

.btn.save {
  background-color: var(--poldo-primary);
  color: var(--color-text);
}

.btn.save:hover {
  background-color: var(--poldo-accent);
}

.btn.cancel {
  background-color: var(--color-background-soft);
  color: var(--color-text);
}

.btn.cancel:hover {
  background-color: var(--color-background-mute);
}

.no-data {
  padding: 30px;
  text-align: center;
  color: var(--color-text);
  opacity: 0.7;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: var(--card-bg);
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 2px 10px var(--card-shadow);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--color-heading);
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--color-text);
  opacity: 0.6;
}

.close-btn:hover {
  opacity: 1;
}

.modal-body {
  padding: 20px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-group label {
  font-weight: 500;
  color: var(--color-text);
}

.form-group select, .form-group input {
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background);
}

.status-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-image {
  margin-top: 10px;
}

.user-image img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin-top: 5px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #e9ecef;
}

@media (max-width: 768px) {
  .filters-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-group {
    width: 100%;
  }
  
  .actions {
    flex-direction: column;
  }
  
  td, th {
    padding: 10px;
  }
}
</style>