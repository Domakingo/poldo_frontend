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
  disponibility: number
  tags: string[]
  isActive: boolean
}

const API_CONFIG = {
    BASE_URL: '/api',
    TOKEN: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NTAsInJ1b2xvIjoicGFuaW5hcm8iLCJpYXQiOjE3NDQzMDc2ODgsImV4cCI6MTc3NTg2NTI4OH0.noyJJ5yLRAdZ4bxIOGdlYBjSZQElmXV4KOqGGVJHl_Q",
    DEFAULT_IMAGE: "https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c"
  }

const headers = new Headers({
  Authorization: `Bearer ${API_CONFIG.TOKEN}`,
  Accept: 'application/json',
  'Content-Type': 'application/json'
})

async function handleRequest<T>(
  endpoint: string,
  errorMsg: string,
  init?: RequestInit
): Promise<T> {
  const url = `${API_CONFIG.BASE_URL}/${endpoint}`;
  try {
    const response = await fetch(url, { headers, ...init, mode: 'cors' });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${errorMsg}: ${response.status} — ${errorText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }
    return {} as T;

  } catch (error: any) {
    console.error('Request failed:', error);
    throw new Error(`${errorMsg}: ${error.message}`);
  }
}

export const useProductsStore = defineStore('products', () => {
  const products = ref<Product[]>([])
  const defaultImageBlobUrl = ref<string>('')

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

  async function fetchDefaultImage() {
    try {
      const response = await fetch(API_CONFIG.DEFAULT_IMAGE, {
        headers: new Headers({
          Authorization: `Bearer ${API_CONFIG.TOKEN}`
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch default image: ${response.status}`)
      }

      const blob = await response.blob()
      defaultImageBlobUrl.value = URL.createObjectURL(blob)
    } catch (error) {
      console.error('Error fetching default image:', error)
      defaultImageBlobUrl.value = API_CONFIG.DEFAULT_IMAGE
    }
  }

   const initializeProducts = async () => {
    try {
      await fetchDefaultImage()

      const raw = await handleRequest<any[]>(
        'prodotti',
        'Errore fetch prodotti'
      )

      products.value = await Promise.all(raw.map(async (item) => {
        const productImageUrl = `${API_CONFIG.BASE_URL}/prodotti/image/${item.idProdotto}`
        const imageExists = await checkImageExists(productImageUrl)

        return {
          id: item.idProdotto,
          title: item.nome,
          description: item.descrizione,
          ingredients: item.ingredienti,
          imageSrc: imageExists ? productImageUrl : defaultImageBlobUrl.value,
          price: parseFloat(item.prezzo),
          quantity: item.quantita,
          disponibility: item.disponibilita,
          tags: item.tags,
          isActive: item.attivo === 1
        }
      }))
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  async function checkImageExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        headers: new Headers({
          Authorization: `Bearer ${API_CONFIG.TOKEN}`
        })
      })
      return response.ok
    } catch {
      return false
    }
  }

  initializeProducts().catch(error =>
    console.error('Auto-initialization error:', error)
  )

  const getProductById = (id: number) => {
    return products.value.find(product => product.id === id)
  }

  return {
    products,
    allIngredients,
    allTags,
    initializeProducts,
    getProductById
  }
})
