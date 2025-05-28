import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { API_CONFIG } from '@/utils/api';

export interface Gestione {
  id: number
  nome: string
}

export const getColorForGestione = (name: string) => {
  if (!name) return '#5f5f5f';

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 7) - hash);
    hash |= 0;
  }

  const hue = Math.abs(hash) % 360;
  const saturation = 75 + Math.abs(hash) % 20;
  const lightness = 35 + Math.abs(hash) % 20;

  const l = lightness / 100;
  const a = saturation / 100 * Math.min(l, 1 - l);
  const f = (n: number, k = (n + hue / 30) % 12) =>
    Math.round(255 * (l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)));

  return `#${f(0).toString(16).padStart(2, '0')}${f(8).toString(16).padStart(2, '0')}${f(4).toString(16).padStart(2, '0')}`;
};

export const useGestioniStore = defineStore('gestioni', () => {
  const gestioni = ref<Gestione[]>([])

  const gestioneOptions = computed(() =>
    gestioni.value.map(g => ({ value: g.id, label: g.nome }))
  )

  const fetchAll = async () => {
    try {
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/gestioni`, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const rawData = await response.json()

      gestioni.value = rawData.map((item: any) => ({
        id: item.idGestione,
        nome: item.nome
      }))

    } catch (error) {
      console.error('Error fetching gestioni:', error)
      throw error
    }
  }

  fetchAll();

  return {
    gestioni,
    gestioneOptions
  }
})
