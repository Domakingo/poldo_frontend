import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTurnoStore } from './turno'
import { API_CONFIG } from '@/utils/api'

interface CartItem {
  idProdotto: number
  selectedQuantity: number
  prezzo: number
  nome: string
}

interface User {
  id: number
  nome: string
}

interface Ordine {
  idOrdine: number
  confermato: boolean
  totale: number
  user: User
  prodotti: CartItem[]
}

export interface OrdineClasse {
  nTurno: number
  totale: number
  confermato: boolean
  ordine: Ordine[]
}

export const useCartClasseStore = defineStore('cartClasse', () => {
  const turnoStore = useTurnoStore()
  const currentTurno = computed(() => turnoStore.turnoSelezionato)

  async function getOrdine(): Promise<{status: true, ordine: OrdineClasse} | {status: false, ordine: null}> {

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/ordini/classi/me/oggi?nTurno=${currentTurno.value}`,
        { method: 'GET', credentials: 'include' },
      )

      if (!response.ok) {
        return {status: false, ordine: null}
      }

      const rawData = await response.json()
      console.log('rawData', rawData)

      const parsed: OrdineClasse = {
        confermato: rawData.confermato,
        nTurno: currentTurno.value,
        totale: rawData.totale,
        ordine: rawData.ordini.map(
          (o: any): Ordine => ({
            idOrdine: o.idOrdine,
            confermato: o.confermato,
            totale: o.totale,
            user: {
              id: o.user.id,
              nome: o.user.nome,
            },
            prodotti: o.prodotti.map(
              (p: any): CartItem => ({
                idProdotto: p.idProdotto,
                selectedQuantity: p.quantita,
                prezzo: p.prezzo,
                nome: p.nome,
              }),
            ),
          }),
        ),
      }

      console.log('parsed', parsed)
      return {status: true, ordine: parsed}
    } catch (error) {
      console.error('Error fetching cart:', error)
      return {status: false, ordine: null}
    }
  }

  async function confOrd(id: number, status: boolean) : Promise<true | false> {

    const result = await fetch(`${API_CONFIG.BASE_URL}/ordini/classi/me/conferma/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        nTurno: currentTurno.value,
        confermato: status,
      }),
    })

    console.log('result', result)

    if (!result.ok) {
      console.error('Error confirming order:', result.statusText)
      return false
    }


    return true
  }

  async function confOrdClasse() : Promise<true | false> {

      const result = await fetch(`${API_CONFIG.BASE_URL}/ordini/classi/me/conferma`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nTurno: currentTurno.value,
        }),
      })

      console.log('result', result)

      if (!result.ok) {
        console.error('Error confirming order:', result.statusText)
        return false
      }

      return true
  }

  return {
    getOrdine,
    confOrd,
    confOrdClasse,
  }
})
