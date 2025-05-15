import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
}

const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/v1',
  TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZEdlc3Rpb25lIjoxLCJydW9sbyI6Imdlc3RvcmUiLCJpZCI6MTksImlhdCI6MTc0NDMwNzg0MiwiZXhwIjoxNzc1ODY1NDQyfQ.HMNTe1h81A80p-BawzVj44zSBGBVMYZRdp_vDxE2j9k',
  DEFAULT_IMAGE: 'http://localhost:5000/v1/prodotti/image/-1'
}

const jwtHeaders = new Headers({
  Authorization: `Bearer ${API_CONFIG.TOKEN}`,
  Accept: 'application/json',
});

export const useGestioneProductsStore = defineStore('gestioneProducts', () => {
  // Stato
  const products = ref<Product[]>([])

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
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/prodotti/all`,
        { headers: jwtHeaders }
      );
      const raw = await response.json();

      products.value = await Promise.all(
        raw.map(async (item) => {
          const imageEndpoint = `${API_CONFIG.BASE_URL}/prodotti/image/${item.idProdotto}`;

          // 1. Provo a scaricare l’immagine con il JWT
          let finalImageSrc = API_CONFIG.DEFAULT_IMAGE;
          try {
            const imgRes = await fetch(imageEndpoint, { headers: jwtHeaders });
            if (imgRes.ok) {
              const blob = await imgRes.blob();
              finalImageSrc = URL.createObjectURL(blob);
            }
          } catch {
            // se il fetch fallisce, rimane DEFAULT_IMAGE
          }

          return {
            id: item.idProdotto,
            title: item.nome,
            description: item.descrizione,
            ingredients: item.ingredienti,
            imageSrc: finalImageSrc,
            price: parseFloat(item.prezzo),
            quantity: item.quantita,
            tags: item.tags,
            isActive: item.attivo === 1
          };
        })
      );
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

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

      // Se c'è un'immagine da caricare
      if (newProduct.imageSrc && newProduct.imageSrc !== API_CONFIG.DEFAULT_IMAGE) {
        const response = await fetch(newProduct.imageSrc, {
          headers: new Headers({
            Authorization: `Bearer ${API_CONFIG.TOKEN}`
          })
        });
        if (!response.ok) {
          throw new Error(`Impossibile scaricare l'immagine da ${newProduct.imageSrc}`);
        }
        const blob = await response.blob();
        formData.append(
          'image',
          blob,
          `product_${Date.now()}.${blob.type.split('/')[1]}`
        );
      }


      const data = await fetch(`${API_CONFIG.BASE_URL}/prodotti`, {
        method: 'POST',
        headers: new Headers({
          Authorization: `Bearer ${API_CONFIG.TOKEN}`
        }),
        body: formData
      }).then(res => res.json())

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

      // Se c'è una nuova immagine
      if (updates.imageSrc && updates.imageSrc !== `${API_CONFIG.BASE_URL}/prodotti/image/${id}`) {
        const response = await fetch(updates.imageSrc)
        const blob = await response.blob()
        formData.append('image', blob, `product_${id}_${Date.now()}.${blob.type.split('/')[1]}`)
      }

      await fetch(`${API_CONFIG.BASE_URL}/prodotti/${id}`, {
        method: 'PATCH',
        headers: new Headers({
          Authorization: `Bearer ${API_CONFIG.TOKEN}`
        }),
        body: formData
      })

      // Aggiorna lo stato locale
      const index = products.value.findIndex(p => p.id === id)
      if (index !== -1) {
        const updatedProduct = {
          ...products.value[index],
          ...updates,
          imageSrc: updates.imageSrc ? updates.imageSrc : products.value[index].imageSrc
        }
        products.value[index] = updatedProduct
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
