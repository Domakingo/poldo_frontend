// src/stores/Gestione/ordini.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_CONFIG } from '@/utils/api'
import { handleRequest } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'

// Interfaces
export interface Product {
  idProdotto: number
  nome: string
  quantita: number
  prezzo: number
  preparato?: boolean
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
  classeId?: number
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
    console.log(`fetchUserById called for user ID: ${userId}`)
    if (userCache.value[userId]) {
      console.log(`User ${userId} found in cache, returning cached data`)
      return userCache.value[userId]
    }

    try {
      console.log(`Fetching user data for ID: ${userId}`)
      const userData = await handleRequest<any>(
        `utenti/${userId}`,
        `Impossibile recuperare i dati dell'utente con ID ${userId}`
      )
      console.log(`User data received for ID ${userId}:`, userData)
      userCache.value[userId] = userData
      return userData
    } catch (error) {
      console.error(`Errore nel recupero dei dati dell'utente con ID ${userId}:`, error)
      return null
    }
  }  // Recupera gli ordini dei professori
  async function fetchProfOrders() {
    console.log('Starting fetchProfOrders in store')
    loading.value = true
    try {      
      let url = `ordini/classi?startDate=${selectedDate.value}&endDate=${selectedDate.value}`;
      console.log('Fetching URL:', url)
            
      const data = await handleRequest<any[]>(
        url,
        'Errore nel recupero degli ordini dei professori',
        undefined,
        30000 // 30 seconds timeout
      )
      console.log('Data received from API:', data)
      
      // Check if data is valid
      if (!data || !Array.isArray(data)) {
        console.error('Invalid data format received:', data)
        error.value = 'Formato dati non valido ricevuto dal server'
        profOrders.value = []
        loading.value = false
        return
      }
      
      const professorOrders = data.filter((order: any) => 
        order && order.oraRitiro !== null && order.oraRitiro !== undefined
      );
      console.log('Filtered professorOrders:', professorOrders)
      
      const processedOrders = []
      
      for (const order of professorOrders) {
        try {
          console.log('Processing order:', order)
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

      console.log('Setting profOrders.value with processedOrders:', processedOrders)
      profOrders.value = processedOrders
    } catch (err) {
      console.error('Errore nel recupero degli ordini dei professori:', err)
      error.value = 'Errore nel caricamento degli ordini dei professori.'
      profOrders.value = []
    } finally {
      console.log('fetchProfOrders finished, setting loading to false')
      loading.value = false
    }
  }    // Recupera gli ordini per classe
  async function fetchClassOrders(turno: number) {
    loading.value = true
    try {      
      let url = `ordini/classi?startDate=${selectedDate.value}&endDate=${selectedDate.value}&nTurno=${turno}`;
      
      const response = await handleRequest<any>(
        url,
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
  async function markOrderAsPrepared(classeId: number | string, turno: number) {
    try {      
      // Update local state immediately for better UI response
      if (turno === 2) {
        // Update professor orders
        profOrders.value = profOrders.value.map(order => {
          if (order.classe === classeId || String(order.classe) === String(classeId)) {
            return {
              ...order,
              preparato: true,
              prodotti: order.prodotti.map(product => ({
                ...product,
                preparato: true
              }))
            };
          }
          return order;
        });
      } else {
        // Update class orders
        classOrders.value = classOrders.value.map(order => {
          if (order.classeId === classeId || String(order.classeId) === String(classeId)) {
            return {
              ...order,
              preparato: true,
              prodotti: order.prodotti?.map(product => ({
                ...product,
                preparato: true
              })) || []
            };
          }
          return order;
        });
      }
      
      const response = await handleRequest<any>(
        `ordini/classi/${classeId}/turno/${turno}/prepara`,
        'Errore nel marcare l\'ordine come preparato',
        { method: 'PUT' }
      )
      
      // Don't automatically refetch - the UI state has already been updated
      console.log('Order marked as prepared successfully in API')

      return true
    } catch (error) {
      console.error('Errore nel marcare l\'ordine come preparato:', error)
      return false
    }
    
  }


async function markProductAsPrepared(productId: number, turno: number) {
  try {
    // Improved validation that correctly handles turno=0
    if (productId === undefined || productId === null) {
      throw new Error('ID prodotto è obbligatorio');
    }
    
    if (turno === undefined || turno === null) {
      throw new Error('Turno è obbligatorio');
    }

    // Use the auth store to get user information
    const authStore = useAuthStore();
    
    try {
      // If not already authenticated, check authentication
      if (!authStore.isAuthenticated) {
        await authStore.checkAuth();
      }
    } catch (userError) {
      // Silently continue, just log the error
    }
    
    // Update the local state for immediate UI feedback
    // Update classOrders first
    classOrders.value.forEach(order => {
      if (order && Array.isArray(order.prodotti)) {
        order.prodotti.forEach(product => {
          if (product.idProdotto === productId) {
            product.preparato = true;
          }
        });
      }
    });
    
    // Update profOrders
    profOrders.value.forEach(order => {
      if (order && Array.isArray(order.prodotti)) {
        order.prodotti.forEach(product => {
          if (product.idProdotto === productId) {
            product.preparato = true;
          }
        });
      }
    });
    
    // Call the API
    await handleRequest<any>(
      `ordini/prodotti/${productId}/prepara?nTurno=${turno}`,
      'Errore nel marcare il prodotto come preparato',
      { 
        method: 'PUT',
        headers: {}
      }
    )

    // Don't automatically refetch - the UI state has already been updated
    console.log('Product marked as prepared successfully in API')

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
    return `${order.classe || 'N/A'}`
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
