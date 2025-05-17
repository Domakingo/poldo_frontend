<template>
  <div class="gestioni-admin-container">
    <h1 class="page-title">Gestione Entità</h1>
    
    <!-- Alert per messaggi di feedback -->
    <Alert 
      v-if="alertMessage" 
      :message="alertMessage" 
      :type="alertType" 
      @close="alertMessage = ''" 
    />

    <!-- Pulsante per creare una nuova gestione -->
    <div class="action-buttons">
      <button class="btn create" @click="openCreateModal">
        <i class="fas fa-plus-circle"></i> Nuova Gestione
      </button>
    </div>    <!-- Tabella gestioni -->
    <div class="gestioni-list-container">
      <div class="gestioni-scroll-wrapper">
        <div v-if="gestioni.length > 0" class="gestioni-list">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="gestione in gestioni" :key="gestione.idGestione">
                <td>{{ gestione.idGestione }}</td>
                <td>{{ gestione.nome }}</td>
                <td class="actions">
                  <button 
                    class="btn edit" 
                    @click="openEditModal(gestione)"
                  >
                    Modifica
                  </button>
                  <button 
                    class="btn delete" 
                    @click="openDeleteModal(gestione)"
                  >
                    Elimina
                  </button>
                  <button 
                    class="btn users" 
                    @click="openUsersModal(gestione)"
                  >
                    Utenti
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="no-data">
          <p>Nessuna gestione trovata.</p>
        </div>
      </div>
    </div>

    <!-- Modal per la creazione/modifica della gestione -->
    <div v-if="showModal && (modalMode === 'create' || modalMode === 'edit')" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>{{ modalMode === 'create' ? 'Crea Nuova Gestione' : 'Modifica Gestione' }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="handleSubmit">
            <div class="form-group">
              <label for="nome-gestione">Nome Gestione:</label>
              <input
                id="nome-gestione"
                v-model="formData.nome"
                type="text"
                placeholder="Inserisci il nome della gestione"
                required
              />
            </div>
              <div v-if="modalMode === 'create'" class="form-group">
              <label for="utente-id">Utente Associato (opzionale):</label>
              <select
                id="utente-id"
                v-model="formData.utenteId"
              >
                <option value="">Nessuno</option>
                <option 
                  v-for="user in availableUsers" 
                  :key="user.id" 
                  :value="user.id"
                >
                  {{ user.name }}
                </option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn cancel" @click="closeModal">Annulla</button>
          <button 
            class="btn save" 
            @click="handleSubmit"
            :disabled="!formData.nome || isLoading"
          >
            {{ isLoading ? 'Salvataggio...' : 'Salva' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal per confermare l'eliminazione -->
    <div v-if="showModal && modalMode === 'delete'" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Conferma Eliminazione</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <p>
            Sei sicuro di voler eliminare la gestione <strong>{{ selectedGestione?.nome }}</strong>?
          </p>
          <p class="warning">
            Attenzione: questa operazione non può essere annullata e rimuoverà tutti i dati associati.
            L'operazione fallirà se ci sono prodotti associati a questa gestione.
          </p>
        </div>
        <div class="modal-footer">
          <button class="btn cancel" @click="closeModal">Annulla</button>
          <button 
            class="btn delete" 
            @click="handleDelete"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Eliminazione...' : 'Elimina' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal per gestire gli utenti associati -->
    <div v-if="showModal && modalMode === 'users'" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Gestione Utenti per {{ selectedGestione?.nome }}</h2>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <!-- Form per aggiungere un nuovo utente -->
          <div class="add-user-form">
            <h3>Aggiungi Utente</h3>
            <div class="form-group">
              <label for="new-user-id">Seleziona Utente:</label>              <select
                id="new-user-id"
                v-model="newUserId"
              >
                <option value="">Seleziona un utente</option>
                <option 
                  v-for="user in availableUsers" 
                  :key="user.id" 
                  :value="user.id"
                >
                  {{ user.name }}
                </option>
              </select>
              <button 
                class="btn add" 
                @click="addUserToGestione"
                :disabled="!newUserId || isLoading"
              >
                Aggiungi
              </button>
            </div>
          </div>

          <!-- Lista degli utenti associati -->
          <div class="users-list">
            <h3>Utenti Associati</h3>
            <table v-if="gestioneUsers.length > 0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Ruolo</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in gestioneUsers" :key="user.idUtente">
                  <td>{{ user.idUtente }}</td>
                  <td>{{ user.mail }}</td>
                  <td>{{ user.ruolo }}</td>
                  <td class="actions">
                    <button 
                      class="btn delete" 
                      @click="removeUser(user.idUtente)"
                    >
                      Rimuovi
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else class="no-data">
              <p>Nessun utente associato a questa gestione.</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn close" @click="closeModal">Chiudi</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import Alert from '@/components/Alert.vue';
import { useGestioneStore } from '@/stores/gestioni';
import { useUserStore } from '@/stores/users';
import { useAuthStore } from '@/stores/auth';

// Import types from stores
import type { User } from '@/stores/users';
import type { Gestione } from '@/stores/gestioni';

// Stores
const gestioneStore = useGestioneStore();
const userStore = useUserStore();

// Local state
const modalMode = ref<'create' | 'edit' | 'delete' | 'users'>('create');
const showModal = ref(false);
const alertMessage = ref('');
const alertType = ref<'success' | 'error'>('success');
const newUserId = ref<number | string>('');
const availableUsers = ref<{id: number, name: string}[]>([]);

// Reactive form data
const formData = reactive({
  nome: '',
  utenteId: ''
});

// Computed properties from stores
const gestioni = ref<Gestione[]>([]);
const selectedGestione = ref<Gestione | null>(null);
const gestioneUsers = ref<User[]>([]);
const isLoading = ref(false);

// Lifecycle hooks
onMounted(async () => {
  // Check auth status first
  try {
    const authStore = useAuthStore();
    await authStore.checkAuth();
    console.log('Authentication status:', authStore.user ? 'Authenticated' : 'Not authenticated');
    
    if (!authStore.user) {
      showAlert('Utente non autenticato. Effettuare il login.', 'error');
      return;
    }
    
    await fetchGestioni();
  } catch (error: any) {
    console.error('Auth check failed:', error);
    showAlert('Errore di autenticazione', 'error');
  }
});

// Methods
const fetchGestioni = async () => {
  isLoading.value = true;
  try {
    await gestioneStore.fetchGestioni();
    gestioni.value = gestioneStore.gestioni;
  } catch (error) {
    showAlert('Errore nel caricamento delle gestioni', 'error');
  } finally {
    isLoading.value = false;
  }
};

const openCreateModal = async () => {
  modalMode.value = 'create';
  formData.nome = '';
  formData.utenteId = '';
  showModal.value = true;
  
  // Load users for dropdown
  isLoading.value = true;
  try {
    await userStore.fetchUsers();
    // Filter to show only users who can be associated (excluding admin)
    availableUsers.value = userStore.users
      .filter(user => user.ruolo !== 'admin')
      .map(user => ({
        id: user.idUtente,
        name: `${user.mail} (${user.ruolo})`
      }));
  } catch (error) {
    showAlert('Errore nel caricamento degli utenti', 'error');
  } finally {
    isLoading.value = false;
  }
};

const openEditModal = (gestione: Gestione) => {
  modalMode.value = 'edit';
  selectedGestione.value = gestione;
  formData.nome = gestione.nome;
  showModal.value = true;
};

const openDeleteModal = (gestione: Gestione) => {
  modalMode.value = 'delete';
  selectedGestione.value = gestione;
  showModal.value = true;
};

const openUsersModal = async (gestione: Gestione) => {
  modalMode.value = 'users';
  selectedGestione.value = gestione;
  
  showModal.value = true;
  isLoading.value = true;
  
  try {
    console.log(`Opening users modal for gestione ${gestione.idGestione}: ${gestione.nome}`);
    
    // Fetch all users for the dropdown
    await userStore.fetchUsers();
    console.log(`Fetched ${userStore.users.length} total users`);
    
    try {
      // Use the new endpoint to fetch users associated with this gestione
      await gestioneStore.fetchGestioneUsers(gestione.idGestione);
      
      // Convert GestioneUser to User type by merging with existing users from userStore
      const gestioneUserIds = gestioneStore.gestioneUsers.map(u => u.idUtente);
      console.log(`Found ${gestioneUserIds.length} users associated with this gestione`);
      
      // Filter users from userStore that match IDs from gestione users
      gestioneUsers.value = userStore.users.filter(user => 
        gestioneUserIds.includes(user.idUtente)
      );
    } catch (fetchError: any) {
      console.error('Failed to fetch gestione users:', fetchError);
      // Fallback to empty list on error
      gestioneUsers.value = [];
      showAlert(`Errore nel recupero degli utenti della gestione: ${fetchError.message}`, 'error');
    }
    
    // Update the dropdown options for adding users - exclude those already in the gestione
    const associatedUserIds = gestioneUsers.value.map((u) => u.idUtente);
    availableUsers.value = userStore.users
      .filter(user => !associatedUserIds.includes(user.idUtente))
      .map(user => ({
        id: user.idUtente,
        name: `${user.mail} (${user.ruolo})`
      }));
      
    console.log(`Available users for adding: ${availableUsers.value.length}`);
  } catch (error: any) {
    showAlert(`Errore nel caricamento degli utenti: ${error.message}`, 'error');
  } finally {
    isLoading.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  selectedGestione.value = null;
  formData.nome = '';
  formData.utenteId = '';
  newUserId.value = '';
};

const handleSubmit = async () => {
  isLoading.value = true;
  try {
    if (modalMode.value === 'create') {
      const result = await gestioneStore.createGestione(
        formData.nome, 
        formData.utenteId ? parseInt(formData.utenteId) : undefined
      );
      if (result) {
        showAlert('Gestione creata con successo', 'success');
        closeModal();
      }
    } else if (modalMode.value === 'edit' && selectedGestione.value) {
      const result = await gestioneStore.updateGestione(
        selectedGestione.value.idGestione,
        formData.nome
      );
      if (result) {
        showAlert('Gestione aggiornata con successo', 'success');
        closeModal();
      }
    }
  } catch (error: any) {
    showAlert(`Errore: ${error?.message || 'sconosciuto'}`, 'error');
  } finally {
    isLoading.value = false;
  }
};

const handleDelete = async () => {
  if (!selectedGestione.value) return;
  
  isLoading.value = true;
  try {
    const result = await gestioneStore.deleteGestione(selectedGestione.value.idGestione);
    if (result) {
      showAlert('Gestione eliminata con successo', 'success');
      closeModal();
    }
  } catch (error: any) {
    showAlert(`Errore: ${error?.message || 'sconosciuto'}`, 'error');
  } finally {
    isLoading.value = false;
  }
};

const addUserToGestione = async () => {
  if (!newUserId.value || !selectedGestione.value) return;
  
  isLoading.value = true;
  try {
    const result = await gestioneStore.addUserToGestione(
      selectedGestione.value.idGestione,
      parseInt(newUserId.value.toString())
    );
    if (result) {
      showAlert('Utente aggiunto con successo', 'success');
      newUserId.value = '';
      
      // Refresh the users list using the new endpoint
      if (selectedGestione.value) {
        // Re-open the modal to refresh the data
        await openUsersModal(selectedGestione.value);
      }
    }
  } catch (error: any) {
    showAlert(`Errore: ${error?.message || 'sconosciuto'}`, 'error');
  } finally {
    isLoading.value = false;
  }
};

const removeUser = async (utenteId: number) => {
  if (!selectedGestione.value) return;
  
  isLoading.value = true;
  try {
    const result = await gestioneStore.removeUserFromGestione(
      selectedGestione.value.idGestione,
      utenteId
    );
    if (result) {
      showAlert('Utente rimosso con successo', 'success');
      // Refresh the users list by reopening the modal
      if (selectedGestione.value) {
        await openUsersModal(selectedGestione.value);
      }
    }
  } catch (error: any) {
    showAlert(`Errore: ${error?.message || 'sconosciuto'}`, 'error');
  } finally {
    isLoading.value = false;
  }
};

const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
  alertMessage.value = message;
  alertType.value = type;
  
  // Auto-hide the alert after 5 seconds
  setTimeout(() => {
    alertMessage.value = '';
  }, 5000);
};
</script>

<style scoped>
.gestioni-admin-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  margin-bottom: 20px;
  color: #333;
  font-size: 2rem;
}

.action-buttons {
  margin-bottom: 20px;
  display: flex;
  justify-content: flex-end;
}

.gestioni-list-container {
  background: var(--poldo-card-bg);
  border-radius: 8px;
  box-shadow: 0 2px 10px var(--poldo-card-shadow);
  overflow: hidden;
  margin-bottom: 20px;
  border: 1px solid var(--color-border);
}

.gestioni-scroll-wrapper {
  max-height: 500px;
  overflow-y: auto;
  overflow-x: auto;
}

.gestioni-list {
  padding: 0;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f8f8f8;
  color: #333;
  font-weight: 600;
}

tr:hover {
  background-color: #f5f5f5;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn.create {
  background-color: #28a745;
  color: white;
}

.btn.edit {
  background-color: #0d6efd;
  color: white;
}

.btn.delete {
  background-color: #dc3545;
  color: white;
}

.btn.users {
  background-color: #6c757d;
  color: white;
}

.btn.cancel {
  background-color: #6c757d;
  color: white;
}

.btn.save {
  background-color: #28a745;
  color: white;
}

.btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
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
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 8px;
  width: 500px;
  max-width: 95%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.warning {
  color: #dc3545;
  font-weight: 500;
}

.no-data {
  padding: 20px;
  text-align: center;
  color: #666;
}

.add-user-form,
.users-list {
  margin-bottom: 20px;
}

.add-user-form h3,
.users-list h3 {
  margin-bottom: 10px;
  font-size: 1.2rem;
}

.add-user-form .form-group {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.add-user-form select {
  flex: 1;
}

.add-user-form .btn {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .actions {
    flex-direction: column;
    gap: 5px;
  }
  
  .btn {
    width: 100%;
    margin-bottom: 2px;
  }
}
</style>
