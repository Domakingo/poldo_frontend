import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTurnoStore } from './turno'

export interface QR {
    token: string
    nome: string
    totale: number
    ritirato: boolean
}

export const useQRStore = defineStore('qr', () => {
  const turnoStore = useTurnoStore()
  const currentTurno = computed(() => turnoStore.turnoSelezionato)

  async function getQR(): Promise<{status: true, qr: QR[]} | {status: false, qr: null}> {
    const headers = {
      'Content-Type': 'application/json',
      Authorization:
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTAsInJ1b2xvIjoicGFuaW5hcm8iLCJpYXQiOjE3NDQzMDc2ODgsImV4cCI6MTc3NTg2NTI4OH0.noyJJ5yLRAdZ4bxIOGdlYBjSZQElmXV4KOqGGVJHl_Q',
    }

    try {
      const response = await fetch(
        `http://figliolo.it:5005/v1/qr/me?nTurno=${currentTurno.value}`,
        { method: 'GET', headers },
      )

      if (!response.ok) {
        return {status: false, qr: null}
      }

      const rawData = await response.json()
      console.log('rawData', rawData)

        const parsed: QR[] = rawData.map((item: any) => ({
          token: item.token,
          nome: item.nome,
          ritirato: item.ritirato,
          totale: item.totale,
        }))

      console.log('QR', parsed)
      return {status: true, qr: parsed}
    } catch (error) {
      console.error('Error fetching QR:', error)
      return {status: false, qr: null}
    }
  }



  return {
    getQR,
}
})
