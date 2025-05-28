import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTurnoStore } from './turno'
import { API_CONFIG } from '@/utils/api'

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

    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/qr/me?nTurno=${currentTurno.value}`,
        { method: 'GET', credentials: 'include' },
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


  async function checkQR(token: string) {
    try {
        const body = JSON.stringify({ token: token })
        console.log('checkQR')
      const response = await fetch(`${API_CONFIG.BASE_URL}/qr/check`, { method: 'POST', credentials: 'include', body: body, headers: {'Content-Type': 'application/json'} },
      )

      if (!response.ok) {
        console.log(response)
        return {status: false, data: null}
      }

      const rawData = await response.json()
      console.log('rawData', rawData)

    const parsed = JSON.parse(rawData)
        console.log('parsed', parsed)
      return {status: true, data: parsed}
    } catch (error) {
      console.error('Error check QR:', error)
      return {status: false, data: null}
    }
  }


  return {
    getQR,
    checkQR
}
})
