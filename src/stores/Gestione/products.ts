import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { API_CONFIG, handleRequest } from '@/utils/api'

export interface Product {
  id: number
  title: string
  description: string
  ingredients: string[]
  imageSrc: string
  price: number
  quantity: number
  tags: string[]
  isActive: boolean
  bevanda: boolean
  ownerID: number
}

export const useGestioneProductsStore = defineStore('gestioneProducts', () => {
  // Stato
  const products = ref<Product[]>([])

  // Immagini di default
  const defaultImage = {
    cibo: "/cibo.svg",
    bevanda: "/bevanda.svg"
  }

  // Getter
  const allIngredients = computed(() => {
    const ingredients = new Set<string>()
    products.value.forEach(product => {
      product.ingredients.forEach(ing => ingredients.add(ing))
    })
    return Array.from(ingredients)
  })

  const allTags = computed(() => {
    const tags = new Set<string>()
    products.value.forEach(product => {
      product.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags)
  })

  // Metodi
  const getProductById = (id: number) => {
    return products.value.find(product => product.id === id)
  }

  const initializeProducts = async () => {
    try {
      const raw = await handleRequest<any[]>(
        'prodotti/all',
        'Errore fetch prodotti gestione',
        { credentials: 'include' }
      );

      products.value = await Promise.all(
        raw.map(async (item) => {
          const productImageUrl = `${API_CONFIG.BASE_URL}/prodotti/image/${item.idProdotto}`;

          // Verifica se l'immagine esiste
          const imageExists = await checkImageExists(productImageUrl);

          return {
            id: item.idProdotto,
            title: item.nome,
            description: item.descrizione,
            ingredients: item.ingredienti,
            imageSrc: imageExists
              ? productImageUrl
              : item.bevanda === 1
                ? defaultImage.bevanda
                : defaultImage.cibo,
            price: parseFloat(item.prezzo),
            quantity: item.quantita,
            tags: item.tags,
            isActive: item.attivo === 1,
            bevanda: item.bevanda === 1,
            ownerID: item.proprietario
          };
        })
      );
    } catch (err) {
      console.error("Errore durante l'inizializzazione dei prodotti:", {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : null,
        context: "Funzione initializeProducts",
      });
      throw err;
    }
  };

  // Verifica esistenza immagine
  async function checkImageExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        credentials: 'include'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  const addProduct = async (newProduct: Omit<Product, 'id'>) => {
    try {
      const formData = new FormData()
      formData.append('nome', newProduct.title)
      formData.append('descrizione', newProduct.description)
      formData.append('ingredienti', JSON.stringify(newProduct.ingredients))
      formData.append('tags', JSON.stringify(newProduct.tags))
      formData.append('prezzo', newProduct.price.toFixed(2))
      formData.append('quantita', newProduct.quantity.toString())
      formData.append('attivo', newProduct.isActive ? '1' : '0')
      formData.append('bevanda', newProduct.bevanda ? '1' : '0')
      formData.append('proprietario', newProduct.ownerID.toString())

      // Se c'è un'immagine da caricare
      if (newProduct.imageSrc && !newProduct.imageSrc.startsWith('http')) {
        const response = await fetch(newProduct.imageSrc)
        const blob = await response.blob()
        formData.append('image', blob, `product_${Date.now()}.${blob.type.split('/')[1]}`)
      }

      const data = await handleRequest<{ id: number }>(
        'prodotti',
        'Errore creazione prodotto',
        {
          method: 'POST',
          body: formData,
          credentials: 'include'
        }
      )

      products.value.push({
        ...newProduct,
        id: data.id,
        imageSrc: `${API_CONFIG.BASE_URL}/prodotti/image/${data.id}`
      })

    } catch (error) {
      console.error('Product creation failed:', error)
      throw error
    }
  }

  const updateProduct = async (id: number, updates: Partial<Product>) => {
    try {
      const formData = new FormData()

      if (updates.title !== undefined) formData.append('nome', updates.title)
      if (updates.description !== undefined) formData.append('descrizione', updates.description)
      if (updates.price !== undefined) formData.append('prezzo', updates.price.toFixed(2))
      if (updates.quantity !== undefined) formData.append('quantita', updates.quantity.toString())
      if (updates.tags !== undefined) formData.append('tags', JSON.stringify(updates.tags))
      if (updates.ingredients !== undefined) formData.append('ingredienti', JSON.stringify(updates.ingredients))
      if (updates.isActive !== undefined) formData.append('attivo', updates.isActive ? '1' : '0')
      if (updates.bevanda !== undefined) formData.append('bevanda', updates.bevanda ? '1' : '0')
      if (updates.ownerID !== undefined) formData.append('proprietario', updates.ownerID.toString())

      // Se c'è una nuova immagine
      if (updates.imageSrc && !updates.imageSrc.startsWith(API_CONFIG.BASE_URL)) {
        const response = await fetch(updates.imageSrc)
        const blob = await response.blob()
        formData.append('image', blob, `product_${id}_${Date.now()}.${blob.type.split('/')[1]}`)
      }

      await handleRequest(
        `prodotti/${id}`,
        'Errore aggiornamento prodotto',
        {
          method: 'PATCH',
          body: formData,
          credentials: 'include'
        }
      )

      // Aggiorna lo stato locale
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        products.value[index] = {
          ...products.value[index],
          ...updates,
          // Mantieni l'URL dell'immagine esistente se non è cambiata
          imageSrc: updates.imageSrc && updates.imageSrc.startsWith(API_CONFIG.BASE_URL)
            ? products.value[index].imageSrc
            : `${API_CONFIG.BASE_URL}/prodotti/image/${id}`
        }
      }

    } catch (error) {
      console.error(`Product update failed for ID ${id}:`, error)
      throw error
    }
  }

  return {
    products,
    allIngredients,
    allTags,
    getProductById,
    initializeProducts,
    addProduct,
    updateProduct
  }
})
