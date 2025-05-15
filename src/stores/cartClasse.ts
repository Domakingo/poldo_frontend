import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTurnoStore } from './turno'

interface CartItem {
  idProdotto: number
  quantita: number
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
    const headers = {
      'Content-Type': 'application/json',
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTAsInJ1b2xvIjoicGFuaW5hcm8iLCJpYXQiOjE3NDQzMDc2ODgsImV4cCI6MTc3NTg2NTI4OH0.noyJJ5yLRAdZ4bxIOGdlYBjSZQElmXV4KOqGGVJHl_Q',
    }

    try {
      const response = await fetch(
        `http://figliolo.it:5005/v1/ordini/classi/me/oggi?nTurno=${currentTurno.value}`,
        { method: 'GET', headers },
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
                quantita: p.quantita,
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
    const headers = {
      'Content-Type': 'application/json',
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTAsInJ1b2xvIjoicGFuaW5hcm8iLCJpYXQiOjE3NDQzMDc2ODgsImV4cCI6MTc3NTg2NTI4OH0.noyJJ5yLRAdZ4bxIOGdlYBjSZQElmXV4KOqGGVJHl_Q',
    }

    const result = await fetch(`http://figliolo.it:5005/v1/ordini/classi/me/conferma/${id}`, {
      method: 'PATCH',
      headers,
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
    const headers = {
        'Content-Type': 'application/json',
        Authorization:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTAsInJ1b2xvIjoicGFuaW5hcm8iLCJpYXQiOjE3NDQzMDc2ODgsImV4cCI6MTc3NTg2NTI4OH0.noyJJ5yLRAdZ4bxIOGdlYBjSZQElmXV4KOqGGVJHl_Q',
      }
  
      const result = await fetch(`http://figliolo.it:5005/v1/ordini/classi/me/conferma`, {
        method: 'PUT',
        headers,
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
