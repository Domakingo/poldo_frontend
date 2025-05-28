<template>
    <div class="gestioni-admin-container">
        <!-- Alert per messaggi di feedback -->
        <Alert v-if="alertMessage" :message="alertMessage" :type="alertType" @close="alertMessage = ''" />
        <!-- Barra di ricerca e pulsante per creare una nuova gestione -->
        <div class="action-header">
            <div class="search-container">
                <div class="search-input-group">
                    <input type="text" v-model="searchQuery" placeholder="Cerca gestione per nome o ID..."
                        class="search-input" />
                    <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search" title="Cancella ricerca">
                        ×
                    </button>
                </div>
            </div>
            <div class="action-buttons">
                <button class="btn create" @click="openCreateModal">
                    <i class="fas fa-plus-circle"></i> Nuova Gestione
                </button>
            </div>
        </div>

        <!-- Tabella gestioni -->
        <div class="gestioni-list-container">
            <div class="gestioni-scroll-wrapper">
                <div v-if="filteredGestioni.length > 0" class="gestioni-list">
                    <table>
                        <thead>
                            <tr>
                                <th class="col-id">ID</th>
                                <th class="col-name">Nome</th>
                                <th class="col-actions">Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="gestione in filteredGestioni" :key="gestione.idGestione">
                                <td>{{ gestione.idGestione }}</td>
                                <td>{{ gestione.nome }}</td>
                                <td class="actions">
                                    <button class="btn edit" @click="openEditModal(gestione)">
                                        Modifica
                                    </button>
                                    <button class="btn delete" @click="openDeleteModal(gestione)">
                                        Elimina
                                    </button>
                                    <button class="btn users" @click="openUsersModal(gestione)">
                                        Utenti
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else-if="gestioni.length > 0" class="no-data">
                    <p>Nessuna gestione trovata con il criterio di ricerca.</p>
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
                            <input id="nome-gestione" v-model="formData.nome" type="text"
                                placeholder="Inserisci il nome della gestione" required />
                        </div>
                        <div v-if="modalMode === 'create'" class="form-group">
                            <label for="utente-id">Utente Associato (opzionale):</label>
                            <select id="utente-id" v-model="formData.utenteId">
                                <option value="">Nessuno</option>
                                <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                                    {{ user.name }}
                                </option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn cancel" @click="closeModal">Annulla</button>
                    <button class="btn save" @click="handleSubmit" :disabled="!formData.nome || isLoading">
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
                    <button class="btn delete" @click="handleDelete" :disabled="isLoading">
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
                            <label for="new-user-id">Seleziona Utente:</label> <select id="new-user-id"
                                v-model="newUserId">
                                <option value="">Seleziona un utente</option>
                                <option v-for="user in availableUsers" :key="user.id" :value="user.id">
                                    {{ user.name }}
                                </option>
                            </select>
                            <button class="btn add" @click="addUserToGestione" :disabled="!newUserId || isLoading">
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
                                        <button class="btn delete" @click="removeUser(user.idUtente)">
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
import { ref, reactive, onMounted, computed } from 'vue';
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
const availableUsers = ref<{ id: number, name: string }[]>([]);
const searchQuery = ref('');

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

// Filtered gestioni based on search query
const filteredGestioni = computed(() => {
    if (!searchQuery.value.trim()) {
        return gestioni.value;
    }
    const query = searchQuery.value.toLowerCase().trim();
    return gestioni.value.filter(gestione =>
        gestione.nome.toLowerCase().includes(query) ||
        gestione.idGestione.toString().includes(query)
    );
});

// Lifecycle hooks
onMounted(async () => {
    // Check auth status first
    try {
        const authStore = useAuthStore();
        await authStore.checkAuth();

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
        // Fetch all users for the dropdown
        await userStore.fetchUsers();

        try {
            // Use the new endpoint to fetch users associated with this gestione
            await gestioneStore.fetchGestioneUsers(gestione.idGestione);

            // Convert GestioneUser to User type by merging with existing users from userStore
            const gestioneUserIds = gestioneStore.gestioneUsers.map(u => u.idUtente);

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
                //showAlert('Gestione creata con successo', 'success');
                closeModal();
            }
        } else if (modalMode.value === 'edit' && selectedGestione.value) {
            const result = await gestioneStore.updateGestione(
                selectedGestione.value.idGestione,
                formData.nome
            );
            if (result) {
                //showAlert('Gestione aggiornata con successo', 'success');
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
            //showAlert('Gestione eliminata con successo', 'success');
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
            //showAlert('Utente aggiunto con successo', 'success');
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
            //showAlert('Utente rimosso con successo', 'success');
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

.action-buttons {
    display: flex;
    gap: 10px;
}

.gestioni-list-container {
    background: var(--card-bg);
    border-radius: 10px;
    box-shadow: 0 2px 8px var(--card-shadow);
    overflow: hidden;
    border: 1px solid var(--color-border);
    flex: 1;
}

.gestioni-scroll-wrapper {
    max-height: 100%;
    overflow-y: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    background-color: var(--card-bg);
}

/* Larghezze delle colonne */
.col-id {
  width: 80px; /* Larghezza fissa per ID */
}

.col-name {
  min-width: 200px;
  width: auto; /* Occupa lo spazio rimanente */
}

.col-actions {
  width: 250px; /* Larghezza fissa per azioni */
}

th,
td {
    padding: 12px 15px;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
    color: var(--poldo-text);
}


.actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    flex-wrap: nowrap;
}

th {
    background-color: var(--color-background-soft);
    color: var(--poldo-text);
    font-weight: 600;
}

tr:hover {
    background-color: var(--color-background-soft);
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

.btn.create {
    background-color: var(--poldo-primary);
    color: var(--poldo-background);
}

.btn.edit {
    background-color: var(--color-background-mute);
    color: var(--poldo-text);
}

.btn.delete {
    background-color: var(--poldo-red);
    color: white;
}

.btn.users {
    background-color: var(--color-background-mute);
    color: var(--poldo-text);
}

.btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 8px var(--poldo-card-shadow);
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

.modal-footer {
    padding: 15px 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

.modal-header h2 {
    color: var(--poldo-text);
}

.modal-body {
    display: flex;
    flex-direction: column;
    padding: 20px;
    gap: 15px;
}

.modal-body form {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.close-btn {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: var(--poldo-text-mute);
}

.form-group input,
.form-group select {
    background-color: var(--color-background-mute);
    border: 1px solid var(--color-border);
    color: var(--poldo-text);
    border-radius: 25px;
    padding: 10px 15px;
}

.warning {
    color: var(--poldo-red);
}

.no-data {
    color: var(--poldo-text-mute);
    padding: 20px;
    text-align: center;
}

.users-list table {
    margin-top: 15px;
    background-color: var(--color-background-soft);
    border-radius: 10px;
}

.users-list th {
    background-color: var(--color-background-mute);
}

@media (max-width: 600px) {
    .action-header {
        flex-direction: column;
    }

    .search-container {
        width: 100%;
    }

    .action-buttons {
        width: 100%;
        justify-content: flex-end;
    }

    .btn {
        width: 100%;
        justify-content: center;
    }

    .actions {
        flex-direction: column;
    }
}
</style>