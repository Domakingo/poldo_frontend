import { defineStore } from 'pinia'

export const useFavoritesStore = defineStore('favorites', {
  state: () => ({
    favorites: new Set<number>()
  }),

  actions: {
    addFavorite(id: number) {
      this.favorites.add(id)
    },

    removeFavorite(id: number) {
      this.favorites.delete(id)
    }
  },

  getters: {
    isFavorite: (state) => (id: number) => state.favorites.has(id)
  },

  persist: {
    storage: localStorage,
    key: 'favorites',
    serializer: {
      serialize: (state) => JSON.stringify([...state.favorites]),
      deserialize: (value) => ({ favorites: new Set(JSON.parse(value)) })
    }
  }
})
