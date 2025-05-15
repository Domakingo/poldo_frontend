// src/stores/Gestione/ordini.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_CONFIG } from '@/utils/api'

// Interfaces
export interface Product {
  idProdotto: number
  nome: string
  quantita: number
  prezzo: number
}

export interface Order {
  idOrdine: number
  data: string
  nTurno: number
  giorno: string
  user: number
  classe: string
  confermato: boolean
  preparato: boolean
  oraRitiro?: string
  prodotti: Product[]
  userRole?: string
  userData?: any
}

export interface ClassOrder {
  classe: string
  data: string
  prodotti: Product[]
  idOrdine?: number
  confermato?: boolean
  oraRitiro?: string
  preparato?: boolean
  user?: number
  userData?: any
  userRole?: string
}

// Helper function to handle API requests
async function handleRequest<T>(
  endpoint: string,
  errorMsg: string,
  init?: RequestInit
): Promise<T> {
  const url = `${API_CONFIG.baseURL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  console.log('Fetching from URL:', url);
  
  try {
    const response = await fetch(url, { credentials: 'include', ...init, mode: 'cors' });
    
    // Handle 404 errors by returning an empty array
    if (response.status === 404) {
      console.warn(`Nessun dato trovato per ${endpoint}`);
      return [] as any;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${errorMsg}: ${response.status} — ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      try {
        return await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        console.error('Response text:', await response.clone().text().catch(() => 'Could not read response text'));
        throw new Error(`${errorMsg}: Invalid JSON response`);
      }
    } else {
      console.warn(`Response is not JSON (${contentType}):`, await response.text().catch(() => 'Could not read response text'));
      return [] as any;
    }

  } catch (error: any) {
    console.error('Request failed:', error);
    throw new Error(`${errorMsg}: ${error.message}`);
  }
}

export const useOrdiniStore = defineStore('ordini', () => {
  // State
  const classOrders = ref<ClassOrder[]>([])
  const profOrders = ref<Order[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedDate = ref(formatDate(new Date()))
  const userCache = ref<{[key: number]: any}>({})

  // Formattazione data
  function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }
  
  // Funzione per recuperare i dati dell'utente
  async function fetchUserById(userId: number) {
    if (userCache.value[userId]) return userCache.value[userId]

    try {
      const userData = await handleRequest<any>(
        `utenti/${userId}`,
        `Impossibile recuperare i dati dell'utente con ID ${userId}`
      )
      userCache.value[userId] = userData
      return userData
    } catch (error) {
      console.error(`Errore nel recupero dei dati dell'utente con ID ${userId}:`, error)
      return null
    }
  }
  
  // Recupera gli ordini dei professori
  async function fetchProfOrders() {
    loading.value = true
    try {
      const response = await handleRequest<any>(
        `ordini/classi?startDate=${selectedDate.value}&endDate=${selectedDate.value}&nTurno=2`,
        'Errore nel recupero degli ordini dei professori'
      )

      // Assicurati che i dati siano un array
      let data = [];
      
      if (Array.isArray(response)) {
        data = response;
      } else if (response && typeof response === 'object') {
        data = response.error ? [] : [response];
      }
      
      const professorOrders = data.filter((order: any) => 
        order && order.oraRitiro !== null && order.oraRitiro !== undefined
      );
      const processedOrders = []
      
      for (const order of professorOrders) {
        try {
          const processedOrder = {
            ...order,
            prodotti: Array.isArray(order.prodotti) ? order.prodotti : [],
            classe: order.classe,
            userRole: 'prof',
            oraRitiro: order.oraRitiro
          }

          if (order.user) {
            const userData = await fetchUserById(order.user)
            if (userData) {
              processedOrder.userData = userData
            }
          }

          processedOrders.push(processedOrder)
        } catch (err) {
          console.error("Errore nell'elaborazione dell'ordine del professore:", err, order)
        }
      }

      profOrders.value = processedOrders
    } catch (err) {
      console.error('Errore nel recupero degli ordini dei professori:', err)
      error.value = 'Errore nel caricamento degli ordini dei professori.'
      profOrders.value = []
    } finally {
      loading.value = false
    }
  }
    // Recupera gli ordini per classe
  async function fetchClassOrders(turno: number) {
    loading.value = true
    try {
      const response = await handleRequest<any>(
        `ordini/classi?startDate=${selectedDate.value}&endDate=${selectedDate.value}&nTurno=${turno}`,
        'Errore nel recupero degli ordini per classe'
      )
      
      // Assicurati che i dati siano un array
      let data = [];
      
      if (Array.isArray(response)) {
        data = response;
      } else if (response && typeof response === 'object') {
        data = response.error ? [] : [response];
      }
      
      // Filtra gli ordini per il turno selezionato
      classOrders.value = data.map((order: any) => ({
        ...order,
        prodotti: Array.isArray(order.prodotti) ? order.prodotti : [],
        classe: order.classe,
        confermato: order.confermato,
        preparato: order.preparato
      }))
    } catch (err) {
      console.error('Errore nel recupero degli ordini per classe:', err)
      error.value = 'Errore nel caricamento degli ordini per classe.'
      classOrders.value = []
    } finally {
      loading.value = false
    }
  }
  
  // Funzione per segnare un ordine come preparato
  async function markOrderAsPrepared(classe: string, turno: number) {
    try {
      await handleRequest<any>(
        `ordini/classi/${classe}/turno/${turno}/prepara`,
        'Errore nel marcare l\'ordine come preparato',
        { method: 'PUT' }
      )

      // Aggiorna gli ordini in base al turno
      if (turno === 2) {
        await fetchProfOrders()
      } else {
        await fetchClassOrders(turno)
      }

      return true
    } catch (error) {
      console.error('Errore nel marcare l\'ordine come preparato:', error)
      return false
    }
  }

  // Funzione per segnare un prodotto come preparato
  async function markProductAsPrepared(productId: number, turno: number) {
    try {
      await handleRequest<any>(
        `prodotti/${productId}/prepara`,
        'Errore nel marcare il prodotto come preparato',
        { method: 'PUT' }
      )

      // Aggiorna gli ordini in base al turno
      if (turno === 2) {
        await fetchProfOrders()
      } else {
        await fetchClassOrders(turno)
      }

      return true
    } catch (error) {
      console.error('Errore nel marcare il prodotto come preparato:', error)
      return false
    }
  }

  // Funzione per modificare la data selezionata
  function setSelectedDate(date: string) {
    selectedDate.value = date
  }

  // Calcola il totale dell'ordine
  function calculateOrderTotal(order: Order | ClassOrder): number {
    if (!order.prodotti || !Array.isArray(order.prodotti)) return 0

    return order.prodotti.reduce((total, product) => {
      const price = product.prezzo || 0
      const quantity = product.quantita || 0
      return total + (price * quantity)
    }, 0)
  }

  // Display user name
  function getOrderUserName(order: Order | ClassOrder): string {
    if (order.userData && (order.userData.nome || order.userData.cognome)) {
      return `${order.userData.cognome || ''} ${order.userData.nome || ''}`.trim()
    }
    return `Utente #${order.user || 'N/A'}`
  }

  // Reset gli errori
  function resetError() {
    error.value = null
  }

  return {
    // State
    classOrders,
    profOrders,
    loading,
    error,
    selectedDate,
    
    // Azioni
    fetchProfOrders,
    fetchClassOrders,
    fetchUserById,
    markOrderAsPrepared,
    markProductAsPrepared,
    setSelectedDate,
    calculateOrderTotal,
    getOrderUserName,
    resetError,
    
    // Helper
    formatDate
  }
})
