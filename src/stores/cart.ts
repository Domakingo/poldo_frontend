import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTurnoStore } from './turno'
import { API_CONFIG } from '@/utils/api'


export interface CartItem {
  id: number
  selectedQuantity: number
}

interface CartByTurno {
  [turno: string]: CartItem[]
}

export const useCartStore = defineStore(
  'cart',
  () => {
    const turnoStore = useTurnoStore()
    const itemsByTurno = ref<CartByTurno>({})
    turnoStore.turni.forEach((turno) => {
      itemsByTurno.value[turno.n] = []
    })

    async function getOrdineByTurno() {
        const currentTurno = turnoStore.turnoSelezionato

        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}/ordini/me?nTurno=${currentTurno}`, {
            method: 'GET',
            credentials: 'include'
          })

          if (!response.ok) {
            console.error('nessun ordine gia effettuato x questo turno')
            return false
          }

          const data = await response.json()
          const ordine = data[0]

          if (!ordine || ordine.prodotti.length === 0) {
            return false
          }

          itemsByTurno.value[currentTurno] = ordine.prodotti.map((item: any) => ({
            id: item.idProdotto,
            selectedQuantity: item.quantita,
          }))
          return true
        } catch (error) {
          console.error('Error fetching cart:', error)
          return false
        }
      }

    const currentTurno = computed(() => turnoStore.turnoSelezionato)

    function updateQuantity(productId: number, quantity: number) {
      const cart = itemsByTurno.value[currentTurno.value]
      const existingItem = cart.find((item) => item.id === productId)

      if (existingItem) {
        existingItem.selectedQuantity += quantity
      } else {
        cart.push({ id: productId, selectedQuantity: quantity })
      }
    }

    function removeFromCart(productId: number) {
      itemsByTurno.value[currentTurno.value] = itemsByTurno.value[currentTurno.value].filter(
        (item) => item.id !== productId,
      )
    }

    function clearCart() {
      itemsByTurno.value[currentTurno.value] = []
    }

    function clearAllCarts() {
      itemsByTurno.value = { primo: [], secondo: [] }
    }

    function getItems() {
      return itemsByTurno.value[currentTurno.value]
    }

    async function confirmCart(): Promise<{ ok: boolean; message: string }> {
        const turno = currentTurno.value
        const cart = itemsByTurno.value[turno]

        if (cart.length === 0) {
          console.error('Carrello vuoto')
          return { ok: false, message: 'Carrello vuoto' }
        }

        const cartData = cart.map((item) => ({
          idProdotto: item.id,
          quantita: item.selectedQuantity,
        }))

        const body = {
          nTurno: turno,
          prodotti: cartData,
        }

        try {
          const response = await fetch(`${API_CONFIG.BASE_URL}/ordini`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            credentials: 'include',
          })

          const data = await response.json()

          if (!response.ok || data.error) {
            const msg = data.error || 'Errore durante la conferma dell’ordine'
            console.error('Errore:', msg)
            return { ok: false, message: msg }
          }

          console.log('Carrello confermato:', data)
          clearCart()
          return { ok: true, message: 'Carrello confermato con successo' }

        } catch (error) {
          console.error('Errore di rete:', error)
          return { ok: false, message: 'Errore di rete: impossibile contattare il server' }
        }
      }


    return {
      itemsByTurno,
      getItems,
      updateQuantity,
      removeFromCart,
      clearCart,
      clearAllCarts,
      confirmCart,
      getOrdineByTurno
    }
  },
  {
    persist: {
      key: 'cart-storage',
      storage: localStorage,
    },
  },
)
