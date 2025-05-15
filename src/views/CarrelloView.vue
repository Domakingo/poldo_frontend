<script setup lang="ts">
import { useCartStore } from '@/stores/cart'
import { useProductsStore } from '@/stores/products'
import Alert from '@/components/Alert.vue'
import QuantityControl from '@/components/ControlloQuantitaProdotto.vue'
import type { OrdineClasse } from '@/stores/cartClasse'
import QRModal from '@/components/QRModal.vue'
import { useAuthStore } from '@/stores/auth'


import { computed, ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useCartClasseStore } from '@/stores/cartClasse'

const authStore = useAuthStore()
const isNotStudente =  authStore.user ? authStore.user.ruolo !== 'studente' : false

const cartStore = useCartStore()
const productsStore = useProductsStore()
const router = useRouter()
const cartClasseStore = useCartClasseStore()

const ordineClasse = ref<OrdineClasse | null>(null)
const isconf = ref<{id: number, isConf: boolean}[]>([])

const haveCart = ref(false)
const haveCartClasse = computed(() => !!ordineClasse.value?.ordine?.length)
const haveCartClasseConf = ref<true | false>(false)

const showQRModal = ref(false)

const allProducts = computed(() => productsStore.products)
console.log('allProducts', allProducts.value)

const items = computed(() => cartStore.getItems())

async function getCart() {
    const cart = await cartStore.getOrdineByTurno()
    console.log('cart', cart)
    haveCart.value = cart === true
}


const itemsDetails = computed(() => {
    return items.value.map(item => {
        const product = allProducts.value.find(p => p.id === item.id)
        return {
            ...item,
            ...product,
        }
    })
})

console.log('itemsDetails', itemsDetails.value)

const hasItems = computed(() => items.value.length > 0)

const totalPrice = computed(() => {
    return items.value.reduce((total, item) => {
        const product = allProducts.value.find(p => p.id === item.id)
        if(!product) return total
        return total + (product.price * item.quantity)
    }, 0)
})

const continueShopping = () => {
    router.push('/prodotti')
}

const checkoutAlertMessage = ref('Checkout functionality will be implemented in the future!')
const showCheckoutAlert = ref(false)
const altertype = ref<'confirm' | 'error' | 'success'>('confirm')

const checkout= () => {
    if(selectedMacro.value === 'classe') {
        checkoutClasse();
    } else {
        checkoutPersonale();
    }
}

const checkoutClasse = () => {
    checkoutAlertMessage.value = 'Confermi l\'ordine di classe?'
    showCheckoutAlert.value = true
}

const checkoutPersonale = () => {
    checkoutAlertMessage.value = 'Confermi di procedere con l\'ordine?'
    showCheckoutAlert.value = true
}

const clearCart = () => {
    cartStore.clearCart()
}

const confermaOrdineAlert = async () => {
    showCheckoutAlert.value = false
    if (selectedMacro.value === 'classe') {
        console.log('confirmOdrClasse')
        const risp = await cartClasseStore.confOrdClasse()
        fetchOrdineClasse()
        altertype.value = risp ? 'success' : 'error'
        checkoutAlertMessage.value = risp ? 'Ordine di classe confermato!' : 'Errore durante la conferma dell\'ordine di classe'
        showCheckoutAlert.value = true
    } else {
        console.log('confirmOdrPersonale')
        const risp = await cartStore.confirmCart()
        fetchOrdineClasse()
        altertype.value = risp.ok ? 'success' : 'error'
        checkoutAlertMessage.value = risp.message
        showCheckoutAlert.value = true
    }
}

const cancelOdr = () => {
    console.log('noconfOdr')
    showCheckoutAlert.value = false
}

const closeAlert = () => {
    console.log('closeAlert')
    showCheckoutAlert.value = false
    altertype.value = 'confirm'
}

const selectedMacro = ref<'personale' | 'classe'>('personale')






watch(ordineClasse, (newVal) => {
    console.log('watch ordineClasse', newVal)
    if(newVal) {
        haveCartClasseConf.value = newVal.confermato
        isconf.value = newVal.ordine.map(o => ({
        id: o.idOrdine,
        isConf: o.confermato
        }))
    }else{
        haveCartClasseConf.value =  false
    }
    
}, { deep: true })


async function fetchOrdineClasse() {
  try {
    const result = await cartClasseStore.getOrdine()
    ordineClasse.value = result.status ? result.ordine : null
  } catch (error) {
    console.error("Errore nel fetch ordine classe:", error)
    ordineClasse.value = null
  }
}

onMounted(async () => {
    fetchOrdineClasse();
})



async function switchOrdineSingolo(id: number, status: boolean) {
    const res = await cartClasseStore.confOrd(id, status)
    if(res) await fetchOrdineClasse()
}


getCart();

</script>

<template>
    <div class="carrello">
        <Alert v-if="showCheckoutAlert" :type="altertype" :message="checkoutAlertMessage" @confirm="confermaOrdineAlert"
            @cancel="cancelOdr" @close="closeAlert" />

        <div v-if="isNotStudente"class="category-switch">

            <div class="switch-container">
                <button class="switch-btn" :class="{ active: selectedMacro === 'personale' }"
                    @click="selectedMacro = 'personale'">
                    <svg class="icon" viewBox="0 0 24 24">
                        <path
                            d="M12 5.5C13.38 5.5 14.5 6.62 14.5 8S13.38 10.5 12 10.5 9.5 9.38 9.5 8 10.62 5.5 12 5.5M12 12C14.34 12 19 13.08 19 15.5V17H5V15.5C5 13.08 9.66 12 12 12Z" />
                    </svg>
                    <span>Personale</span>
                </button>

                <button class="switch-btn" :class="{ active: selectedMacro === 'classe' }"
                    @click="selectedMacro = 'classe'">
                    <svg class="icon" viewBox="0 0 24 24">
                        <path
                            d="M16 11C17.66 11 18.99 9.66 18.99 8S17.66 5 16 5C14.34 5 13 6.34 13 8S14.34 11 16 11M8 11C9.66 11 10.99 9.66 10.99 8S9.66 5 8 5C6.34 5 5 6.34 5 8S6.34 11 8 11M8 13C5.67 13 1 14.17 1 16.5V18H15V16.5C15 14.17 10.33 13 8 13M16 13C15.71 13 15.38 13.03 15.03 13.05C16.19 13.89 17 15.02 17 16.5V18H23V16.5C23 14.17 18.33 13 16 13Z" />
                    </svg>
                    <span>Classe</span>
                </button>
            </div>
        </div>

        <div v-if="selectedMacro === 'personale'" class="cart-content">
            <div v-if="!hasItems" class="empty-cart">
                <p>Il tuo carrello è vuoto</p>
                <button class="continue-btn" @click="continueShopping">Continua lo shopping</button>
            </div>


            <div v-else class="cart-summary">
                <div class="summary-header">
                    <h2 v-if="!haveCart">Riepilogo ordine personale</h2>
                    <h2 v-else>Riepilogo ordine effettuato</h2>
                </div>

                <div class="summary-content">
                    <!-- Receipt items -->
                    <div class="receipt-items">
                        <div v-for="item in itemsDetails" :key="item.id" class="receipt-item">
                            <img :src="item.imageSrc" alt="Product Image" class="product-image" />
                            <span class="product-info">
                                x{{ item.quantity }}
                                {{
                                item.title
                                }}
                            </span>
                            <div class="quantity-price">
                                <QuantityControl :productId="item.id" :delete="false" :disabled="haveCart" />
                                <span class="item-total">
                                    €{{ item.price ? (item.quantity * item.price).toFixed(2) : '0.00' }}
                                </span>
                            </div>
                        </div>
                    </div>


                    <!-- Receipt total -->

                </div>

                <div class="receipt-total">
                    <span>Totale</span>
                    <span>€{{ totalPrice.toFixed(2) }}</span>
                </div>
                <div class="summary-actions">
                    <button class="checkout-btn" @click="checkout" :disabled="haveCart">Procedi all'ordine</button>
                    <button v-if="haveCart" class="checkout-btn">Elimina oridine</button>
                    <button class="clear-btn" @click="clearCart">Svuota carrello</button>
                    <button class="continue-btn" @click="continueShopping">Continua lo shopping</button>
                </div>
            </div>
        </div>

        <div v-if="selectedMacro === 'classe'" class="cart-content">
            <div v-if="!haveCartClasse" class="empty-cart">
                <p>Il carrello della tua classe è vuoto</p>
            </div>


            <div v-else class="cart-summary">
                <div class="summary-header">
                    <h2>Riepilogo ordine classe</h2>
                </div>

                <div class="summary-content classe">
                    <!-- Receipt items -->
                    <div v-for="ordine in (ordineClasse?ordineClasse.ordine:[])" :key="ordine.idOrdine"
                        class="receipt-items">
                        <div class="receipt-person">
                            <div>
                                <span class="giallo">{{ ordine.user.nome }}</span><span> : €{{ ordine.totale }}</span>
                            </div>
                            <div class="switch-container">
                                <button class="switch-btn"
                                    :class="{ active: isconf.find(o => o.id === ordine.idOrdine)?.isConf }"
                                    @click="switchOrdineSingolo(ordine.idOrdine, true)">
                                    <svg class="icon" viewBox="0 0 24 24">
                                        <path
                                            d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                    </svg>

                                    <span>Accetta</span>
                                </button>

                                <button class="switch-btn"
                                    :class="{ active: !isconf.find(o => o.id === ordine.idOrdine)?.isConf }"
                                    @click="switchOrdineSingolo(ordine.idOrdine, false)">
                                    <svg class="icon" viewBox="0 0 24 24">
                                        <path
                                            d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
                                    </svg>
                                    <span>Rifiuta</span>
                                </button>
                            </div>

                        </div>
                        <div v-for="item in ordine.prodotti" :key="item.idProdotto" class="receipt-item">
                            <img src="https://lh3.googleusercontent.com/a/ACg8ocLPv09a9-uNbEG-ZfRm5bWQUlyLOpBaKxHz88de_c6vB8RvQ_Plrg=s96-c"
                                alt="Product Image" class="product-image" />
                            <span class="product-info">
                                x{{ item.quantita }}
                                {{
                                item.nome
                                }}
                            </span>
                            <div class="quantity-price">
                                <!-- <QuantityControl :productId="item.id" :delete="false" /> -->
                                <span class="item-total">
                                    €{{
                                    (item.quantita * item.prezzo).toFixed(2)
                                    }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- Receipt total -->
                <div class="receipt-total">
                    <span>Totale</span>
                    <span>€{{ ordineClasse ? ordineClasse.totale : '0.00' }}</span>
                </div>

                <div class="summary-actions">
                    <button class="checkout-btn" @click="checkout" :disabled="haveCartClasseConf">Conferma
                        ordine</button>
                    <button class="checkout-btn" @click="showQRModal = true" :disabled="!haveCartClasseConf">Vedi
                        QR-code</button>
                </div>
                <QRModal :show="showQRModal" :orders="ordineClasse?.ordine || []" @close="showQRModal = false" />
            </div>
        </div>


    </div>
</template>

<style scoped>
.carrello {
    height: calc(100vh - 100px);
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.giallo {
    color: var(--poldo-primary);
}

h1,
h2 {
    color: var(--poldo-text);
}

.empty-cart {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 50px;
    padding: 30px;
    background-color: var(--card-bg);
    border-radius: 10px;
    box-shadow: 0 2px 8px var(--card-shadow);
}

.empty-cart p {
    font-size: 1.2rem;
}

.product-image {
    width: 30px;
    height: 30px;
    border-radius: 10px;
}

:deep(.cart-product-card .card-prodotto) {
    padding: 10px !important;
}

:deep(.cart-product-card .title) {
    font-size: 1rem !important;
    margin-bottom: 4px !important;
}

:deep(.cart-product-card .price) {
    font-size: 0.9rem !important;
    margin-top: 2px !important;
}

:deep(.cart-product-card .quantity-controls) {
    bottom: 5px !important;
}

/* Adjust quantity buttons size */
:deep(.cart-product-card .quantity-btn) {
    width: 20px !important;
    height: 20px !important;
    font-size: 1rem !important;
}

.cart-content {
    margin: 15px 0 0 0;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.cart-summary {
    background-color: var(--card-bg);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 2px 8px var(--card-shadow);
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
    justify-content: flex-start;
    align-items: center;
}

.summary-header {
    border-bottom: 1px solid var(--color-border);
    width: 100%;
}

.summary-content {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
    min-height: 0;
    align-items: center;
    justify-content: center;
    overflow-y: auto;
}

.summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 1rem;
}

.summary-actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.checkout-btn,
.continue-btn,
.clear-btn {
    padding: 12px 20px;
    border: none;
    border-radius: 25px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
}

.checkout-btn:hover {
    transform: translateY(-2px);
}

.checkout-btn {
    background-color: var(--poldo-primary);
    color: white;
    font-weight: bold;
}

.checkout-btn:hover {
    background-color: var(--poldo-accent);
    transform: translateY(-2px);
}

.continue-btn {
    background-color: var(--poldo-background-soft);
    color: var(--poldo-text);
}

.continue-btn:hover {
    background-color: var(--color-background-mute);
}

.clear-btn {
    background-color: var(--poldo-red);
    color: white;
}

.clear-btn:hover {
    background-color: var(--red);
}

.checkout-btn:disabled {
    background-color: var(--color-background-mute) !important;
    color: var(--color-text-mute) !important;
    cursor: not-allowed;
    opacity: 0.7;
}

.checkout-btn:disabled:hover {
    background-color: var(--color-background-mute) !important;
    transform: none !important;
}

/* Receipt styling */
.receipt-header,
.receipt-total {
    display: flex;
    justify-content: space-between;
    width: 100%;
    font-size: 0.9rem;
}


.receipt-item {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 10px;
    align-items: center;
    width: 100%;
    font-size: 0.9rem;
    padding: 8px 8px 0 0;
    border-bottom: 1px solid var(--color-border);
}

.classe .receipt-item {
    margin-left: 25px;
    width: auto;
}


.receipt-person {
    font-weight: bold;
    font-size: 1rem;
    border-bottom: 2px solid var(--color-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.receipt-person .switch-container {
    margin: 5px;
}

.receipt-person .icon {
    height: 18px;
    width: 18px;
}

.receipt-person .switch-btn {
    padding: 5px 10px;
}

.receipt-header {
    font-weight: bold;
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--color-border);
    margin-bottom: 8px;
}

.receipt-items {
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    justify-content: flex-start;
    overflow-y: auto;
}

.classe{
    justify-content: flex-start;
}

.classe .receipt-items{
    height: auto;
    border-radius: 15px;
    overflow-y: visible;
    padding: 10px;
    background-color: var(--color-background-soft);
    box-shadow: 0 2px 8px var(--poldo-card-shadow);
    border: 1px solid var(--color-border);
}

.quantity-price {
    display: flex;
}

.product-name {
    flex: 1;
    padding-right: 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.product-info {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.quantity {
    min-width: 30px;
    text-align: center;
}

.item-total {
    text-align: right;
    width: 60px;
}

.receipt-divider {
    height: 1px;
    width: 100%;
    background-color: var(--color-border);
    margin: 10px 0;
}

.receipt-total {
    padding: 10px;
    font-weight: bold;
    font-size: 1.1rem;
    color: var(--poldo-primary);
}


/* Switch */
.category-switch {
    display: flex;
    justify-content: center;
    margin: 15px 0 0 0;
}

.switch-container {
    display: flex;
    background: var(--color-background-soft);
    border-radius: 50px;
    box-shadow: 0 2px 8px var(--poldo-card-shadow);
}

.switch-btn {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    border: none;
    border-radius: 50px;
    background: none;
    cursor: pointer;
    transition: all 0.3s ease;
    gap: 8px;
}

.switch-btn span {
    font-weight: 500;
    color: var(--poldo-text);
    transition: color 0.3s ease;
}

.switch-btn.active {
    background: var(--poldo-primary);
    box-shadow: 0 2px 8px rgba(239, 194, 12, 0.3);
}

.switch-btn.active .icon {
    stroke: var(--poldo-background);
}

.switch-btn.active span {
    color: var(--poldo-background);
}

.icon {
    width: 24px;
    height: 24px;
    stroke: var(--poldo-text);
    stroke-width: 1.5;
    fill: none;
    transition: stroke 0.3s ease;
}


/* Responsive layout for small screens */
@media (max-width: 600px) {
    .cart-items-list {
        grid-template-columns: repeat(1, 1fr);
        gap: 8px;
    }

    :deep(.cart-product-card) {
        width: 130px !important;
        height: 160px !important;
    }

    .switch-btn {
        padding: 8px 15px;
    }
}
</style>
