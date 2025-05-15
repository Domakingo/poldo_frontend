import { defineStore } from 'pinia'

export type ProductChange = {
  id: number
  title?: string
  price?: number
  quantity?: number
  description?: string
  ingredients?: string[]
  tags?: string[]
  isActive?: boolean
  imageSrc?: string
}

type FilterChange = {
  type: 'ingredient' | 'tag'
  action: 'create' | 'update' | 'delete'
  name: string
  newName?: string
}

export const usePendingChangesStore = defineStore('pendingChanges', {
  state: () => ({
    productChanges: {} as Record<number, ProductChange>,
    filterChanges: [] as FilterChange[]
  }),

  actions: {
    addProductChange(product: ProductChange) {
      const existing = this.productChanges[product.id] || {};
      this.productChanges[product.id] = { ...existing, ...product };
    },

    removeProductChange(id: number) {
      delete this.productChanges[id]
    },

    // Per ingredienti/tag
    addFilterChange(change: FilterChange) {
      this.filterChanges.push(change)
    },

    removeFilterChange(payload: { type: 'ingredient' | 'tag', name: string }) {
      this.filterChanges = this.filterChanges.filter(c =>
        !(c.type === payload.type && c.name === payload.name)
      )
    },

    clearAllChanges() {
      this.productChanges = {}
      this.filterChanges = []
    }
  },

  getters: {
    getProductChanges: (state) => {
      return Object.values(state.productChanges)
    },

    hasProductChange: (state) => (id: number) =>
      id in state.productChanges
  }
})
