// src/stores/Gestione/ordini.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { API_CONFIG } from '@/utils/api'
import { handleRequest } from '@/utils/api'

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
      const data = await handleRequest<any[]>(
        `ordini/classi?startDate=${selectedDate.value}&endDate=${selectedDate.value}`,
        'Errore nel recupero degli ordini dei professori'
      )
      
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

async function markProductAsPrepared(productId: number, turno: number) {
  try {
    // Make sure productId and turno are valid numbers
    if (!productId || !turno) {
      throw new Error('ID prodotto e turno sono obbligatori');
    }

    // Fetch user info to print user ID
    try {
      const userResponse = await fetch(`${API_CONFIG.BASE_URL}/auth/me`, { 
        credentials: 'include',
        mode: 'cors'
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('Utente ID che sta effettuando la richiesta:', userData.id);
        console.log('Dati utente:', userData);
      } else {
        console.log('Non è stato possibile recuperare l\'ID utente');
      }
    } catch (userError) {
      console.error('Errore nel recupero delle informazioni utente:', userError);
    }

    await handleRequest<any>(
      `ordini/prodotti/${productId}/prepara?nTurno=${turno}`,
      'Errore nel marcare il prodotto come preparato',
      { 
        method: 'PUT',
        // Don't need to send Content-Type: application/json as there's no body
        headers: {}
      }
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
