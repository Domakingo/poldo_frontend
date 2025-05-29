<template>
  <div class="utenti-admin-container">
    <h1 class="page-title">Utenti</h1>

    <!-- Alert per messaggi di feedback -->
    <Alert v-if="alertMessage" :message="alertMessage" :type="alertType" @close="alertMessage = ''" />

    <!-- Barra di ricerca e filtri -->
    <div class="action-header">
      <div class="search-container">
        <div class="search-input-group">
          <input type="text" v-model="searchQuery" placeholder="Cerca utente per email..." class="search-input" />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search" title="Cancella ricerca">
            ×
          </button>
        </div>
      </div>

      <div class="filter-group">
        <select v-model="filters.ruolo" @change="fetchUtenti">
          <option value="">Tutti i ruoli</option>
          <option v-for="role in validRoles" :key="role" :value="role">
            {{ capitalizeFirst(role) }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <select v-model="filters.classe" @change="fetchUtenti">
          <option value="">Tutte le classi</option>
          <option v-for="classe in classi" :key="classe" :value="classe">
            {{ classe }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <select v-model="filters.bannato" @change="fetchUtenti">
          <option value="">Tutti gli stati</option>
          <option value="0">Attivi</option>
          <option value="1">Bannati</option>
        </select>
      </div>

      <button class="btn clear" @click="resetFilters">Reset Filtri</button>
    </div>

    <!-- Tabella utenti -->
    <div class="utenti-list-container">
      <div class="utenti-scroll-wrapper">
        <div v-if="filteredUsers.length > 0" class="utenti-list">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Ruolo</th>
                <th>Classe</th>
                <th>Azioni</th>
              </tr>
            </thead>

            <tbody>
              <tr v-for="user in filteredUsers" :key="user.idUtente">
                <td>
                  <span class="id-container">
                    {{ user.idUtente }}
                    <span v-if="user.bannato === 1" class="banned-dot"></span>
                  </span>
                </td>

                <td>{{ user.nome }}</td>
                <td>{{ user.mail }}</td>
                <td>
                  <select v-model="user.ruolo" @change="changeRole(user)">
                    <option v-for="role in validRoles" :key="role" :value="role">
                      {{ capitalizeFirst(role) }}
                    </option>
                  </select>
                </td>
                <td>{{ user.classe }}</td>
                <td class="actions">
                  <div class="status-toggle">
                    <div class="switch-container" @click="toggleBanStatus(user)">
                      <div :class="['switch', { active: user.bannato === 1 }]"></div>
                    </div>
                    <span>Bannato</span>
                  </div>

                </td>
              </tr>
            </tbody>

          </table>
        </div>
        <div v-else-if="users.length > 0" class="no-data">
          <p>Nessun utente trovato con il criterio di ricerca.</p>
        </div>
        <div v-else class="no-data">
          <p>Nessun utente trovato.</p>
        </div>
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
              <label>Classe:</label>
              <select v-model="selectedUser.classe">
                <option v-for="classe in classi" :key="classe" :value="classe">
                  {{ classe }}
                </option>
              </select>
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

<script lang="ts">
import { ref, computed, onMounted } from 'vue';
import Alert from '@/components/Alert.vue';
import { useUserStore } from '@/stores/Admin/users';
import type { AlertType } from '@/components/Alert.vue';

export default {
  name: 'UtentiView',
  components: {
    Alert
  },
  setup() {
    const userStore = useUserStore();
    const searchQuery = ref('');
    const alertMessage = ref('');
    const alertType = ref<AlertType>('success');
    const showModal = ref(false);

    const users = computed(() => userStore.users);
    const filteredUsers = computed(() => userStore.filteredUsers);
    const classi = computed(() => userStore.classi);
    const validRoles = userStore.validRoles;
    const filters = userStore.filters;
    const selectedUser = computed(() => userStore.selectedUser);

    const fetchUtenti = () => {
      userStore.fetchUsers();
    };

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

    const toggleUserStatus = () => {
      if (selectedUser.value) {
        selectedUser.value.bannato = selectedUser.value.bannato === 1 ? 0 : 1;
      }
    };

    const toggleBanStatus = async (user: any) => {
      try {
        if (user.bannato === 1) {
          const success = await userStore.unbanUser(user.idUtente);
          if (success) showAlert('Utente sbloccato con successo', 'success');
        } else {
          const success = await userStore.banUser(user.idUtente);
          if (success) showAlert('Utente bannato con successo', 'success');
        }
      } catch (error) {
        showAlert('Errore durante il cambio di stato bannato', 'error');
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
        showAlert('Errore durante l\'aggiornamento dell\'utente', 'error');
      }
    };

    const banUser = async (userId: number) => {
      try {
        const success = await userStore.banUser(userId);
        if (success) showAlert('Utente bannato con successo', 'success');
      } catch (error) {
        showAlert('Errore durante il ban dell\'utente', 'error');
      }
    };

    const unbanUser = async (userId: number) => {
      try {
        const success = await userStore.unbanUser(userId);
        if (success) showAlert('Utente sbloccato con successo', 'success');
      } catch (error) {
        showAlert('Errore durante lo sblocco dell\'utente', 'error');
      }
    };

    const changeRole = async (user: any) => {
      try {
        const success = await userStore.changeUserRole(user.idUtente, user.ruolo);
        if (success) showAlert('Ruolo aggiornato con successo', 'success');
      } catch (error) {
        showAlert('Errore durante la modifica del ruolo', 'error');
      }
    };

    const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
      alertMessage.value = message;
      alertType.value = type;
      setTimeout(() => { alertMessage.value = ''; }, 5000);
    };

    const capitalizeFirst = (str: string) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    };

    onMounted(() => {
      userStore.fetchUsers();
    });

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
      toggleBanStatus,
      saveUserChanges,
      capitalizeFirst
    };
  }
};
</script>

<style scoped>
.utenti-admin-container {
  padding: 20px 0 0 0;
  max-width: 1200px;
  margin: 0 auto;
  background-color: var(--poldo-background);
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}

.page-title {
  margin-bottom: 20px;
  color: var(--poldo-text);
  font-size: 2rem;
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
  padding: 15px;
  background-color: var(--card-bg);
  border-radius: 10px;
  box-shadow: 0 2px 8px var(--card-shadow);
  border: 1px solid var(--color-border);
}

.search-container {
  flex: 1;
  min-width: 250px;
}

.search-input-group {
  position: relative;
  display: flex;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 25px;
  font-size: 1rem;
  background-color: var(--color-background-mute);
  color: var(--poldo-text);
}

.clear-search {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 20px;
  color: var(--poldo-text-mute);
  cursor: pointer;
}

.filter-group {
  display: flex;
}

.filter-group select {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 25px;
  background-color: var(--color-background-mute);
  color: var(--poldo-text);
  min-width: 150px;
}

.utenti-list-container {
  background: var(--card-bg);
  border-radius: 10px;
  box-shadow: 0 2px 8px var(--card-shadow);
  overflow: hidden;
  border: 1px solid var(--color-border);
  flex: 1;
}

.utenti-scroll-wrapper {
  max-height: 100%;
  overflow-y: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--card-bg);
}

th,
td {
  padding: 12px 15px;
  text-align: left;
  color: var(--poldo-text);
}

th {
  background-color: var(--color-background-soft);
  color: var(--poldo-text);
  font-weight: 600;
  position: sticky;
}

tr {
  border-bottom: 1px solid var(--color-border);
  align-content: center;
}

tr:hover {
  background-color: var(--color-background-soft);
}

.id-container {
  display: flex;
  align-items: center;
  gap: 6px;
}

.banned-dot {
  width: 10px;
  height: 10px;
  background-color: red;
  border-radius: 50%;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn.ban {
  background-color: var(--poldo-red);
  color: white;
}

.btn.unban {
  background-color: var(--poldo-green);
  color: white;
}

.btn.clear {
  background-color: var(--color-background-mute);
  color: var(--poldo-text);
}

.btn.cancel {
  background-color: var(--color-background-mute);
  color: var(--poldo-text);
}

.btn.save {
  background-color: var(--poldo-primary);
  color: var(--poldo-background);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px var(--poldo-card-shadow);
}

.status-active,
.status-banned {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
}

.status-active {
  background-color: var(--poldo-green);
  color: white;
}

.status-banned {
  background-color: var(--poldo-red);
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
}

.modal-content {
  min-width: 500px;
  max-width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--card-bg);
  border-radius: 10px;
  border: 1px solid var(--color-border);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--color-border);
  padding: 20px;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--poldo-text-mute);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group select {
  width: 100%;
  padding: 10px;
  border-radius: 25px;
  border: 1px solid var(--color-border);
  background-color: var(--color-background-mute);
}

.status-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
}

.switch-container {
  position: relative;
  width: 50px;
  height: 24px;
  background-color: var(--color-border);
  border-radius: 12px;
  cursor: pointer;
}

.switch {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.switch.active {
  left: calc(100% - 22px);
  background-color: var(--poldo-primary);
}

.no-data {
  color: var(--poldo-text-mute);
  padding: 20px;
  text-align: center;
}

@media (max-width: 768px) {
  .action-header {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    width: 100%;
  }

  .actions {
    flex-direction: column;
    gap: 5px;
  }

  .btn {
    width: 100%;
    margin-bottom: 2px;
  }

  .modal-content {
    min-width: 90%;
  }
}
</style>
