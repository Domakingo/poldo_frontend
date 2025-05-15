<script setup lang="ts">
import VueQrcode from 'vue-qrcode'
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useQRStore } from '@/stores/qr'
import type { QR } from '@/stores/qr'

const props = defineProps<{
    show: boolean
}>()

const emit = defineEmits(['close'])

const currentIndex = ref(0)
const touchStartX = ref(0)
const touchEndX = ref(0)
const direction = ref<'left'|'right'>('right')

const qrStore = useQRStore()
const qrList = ref<QR[]>([])

const nextOrder = () => {
    direction.value = 'right'
    currentIndex.value = (currentIndex.value + 1) % qrList.value.length
}

const prevOrder = () => {
    direction.value = 'left'
    currentIndex.value = (currentIndex.value - 1 + qrList.value.length) % qrList.value.length
}

const handleTouchStart = (e: TouchEvent) => {
    touchStartX.value = e.touches[0].clientX
}

const handleTouchMove = (e: TouchEvent) => {
    touchEndX.value = e.touches[0].clientX
}

const handleTouchEnd = () => {
    if (!touchStartX.value || !touchEndX.value) return

    const diff = touchStartX.value - touchEndX.value
    const swipeThreshold = 50

    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            nextOrder()
        } else {
            prevOrder()
        }
    }

    touchStartX.value = 0
    touchEndX.value = 0
}

const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
        prevOrder()
    } else if (e.key === 'ArrowRight') {
        nextOrder()
    }
}

watch(() => props.show, async (newVal) => {
  if (newVal) {
    await qrStore.getQR().then(response => {
      if (response.status) {
        qrList.value = response.qr
        currentIndex.value = 0
      } else {
        qrList.value = []
      }
      console.log('QR List:', qrList.value)
    })
  }
})

onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown)
})

watch(() => qrList, (newVal) => {
    if (newVal) {
        currentIndex.value = 0
    }
})
</script>

<template>
    <div v-if="show" class="qr-modal">
        <div class="modal-overlay" @click.self="$emit('close')">
            <div class="modal-content">
                <button class="close-btn" @click="$emit('close')">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <path
                            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                </button>

                <div v-if="qrList.length === 0" class="empty-message">
                    <p>Nessun ordine disponibile</p>
                </div>

                <div v-else class="qr-container">
                    <button class="nav-btn left" @click="prevOrder">
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" />
                        </svg>
                    </button>

                    <div class="slider-wrapper">
                        <transition :name="direction === 'right' ? 'slide-next' : 'slide-prev'" mode="out-in">
                            <div class="qr-slide" 
                                 @touchstart="handleTouchStart" 
                                 @touchmove="handleTouchMove"
                                 @touchend="handleTouchEnd"
                                 :key="currentIndex">
                                <div class="qr-header">
                                    <span class="order-id">{{ qrList[currentIndex].nome }}</span>
                                </div>

                                <div class="qr-code-wrapper">
                                    <VueQrcode 
                                        :value="qrList[currentIndex].token" 
                                        :width="300" 
                                        :type="'image/png'" 
                                        :color="{ dark: '#000', light: '#fff' }" 
                                        class="qr-code" 
                                    />
                                </div>

                                <div class="qr-footer">
                                    <span>Totale: €{{ qrList[currentIndex].totale }}</span>
                                    <span :class="qrList[currentIndex].ritirato ? 'confirmed' : 'pending'">
                                        {{ qrList[currentIndex].ritirato ? 'Ritirato' : 'Non ritirato' }}
                                    </span>
                                </div>
                            </div>
                        </transition>
                    </div>

                    <button class="nav-btn right" @click="nextOrder">
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                        </svg>
                    </button>
                </div>

                <div class="pagination">
                    <span v-for="(_, index) in qrList" :key="index"
                        :class="['dot', { active: index === currentIndex }]">
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.qr-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
}

.modal-overlay {
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
}

.modal-content {
    background: var(--card-bg);
    border-radius: 20px;
    padding: 30px;
    position: relative;
    max-width: 90vw;
    width: 600px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.close-btn {
    position: absolute;
    top: 15px;
    right: 15px;
    background: none;
    border: none;
    padding: 5px;
    cursor: pointer;
    color: var(--poldo-text);
}

.close-btn svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
}

.qr-container {
    display: flex;
    align-items: center;
    gap: 20px;
    position: relative;
    min-height: 400px;
}

.slider-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;
}

.nav-btn {
    background: var(--poldo-primary);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    transition: transform 0.2s;
    z-index: 2;
}

.nav-btn:hover {
    transform: scale(1.1);
}

.nav-btn svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
}

.qr-slide {

    text-align: center;
    touch-action: pan-y;
    /* position: absolute; */
    width: 100%;
}

.qr-header {
    margin-bottom: 20px;
}

.order-id {
    color: var(--poldo-primary);
    font-weight: 800;
    /* margin-right: 10px; */
}

.user-name {
    color: var(--color-text-soft);
}

.qr-code-wrapper {
    padding: 20px;
    background: white;
    border-radius: 15px;
    display: inline-block;
    margin: 15px 0;
}

.qr-footer {
    margin-top: 20px;
    display: flex;
    justify-content: space-between;
    font-size: 0.95rem;
}

.confirmed {
    color: #10b981;
}

.pending {
    color: #f59e0b;
}

.pagination {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 25px;
}

.dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #000;
    cursor: pointer;
    transition: transform 0.2s;
}

.dot.active {
    background: var(--poldo-primary);
    transform: scale(1.2);
}

.empty-message {
    text-align: center;
    padding: 40px;
    color: var(--color-text-soft);
}

/* Animazioni */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
    transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
    /* position: absolute; */
    width: 100%;
}

.slide-next-enter-from {
    transform: translateX(100%);
    opacity: 0;
}

.slide-next-leave-to {
    transform: translateX(-50%);
    opacity: 0;
}

.slide-prev-enter-from {
    transform: translateX(-100%);
    opacity: 0;
}

.slide-prev-leave-to {
    transform: translateX(50%);
    opacity: 0;
}

@media (max-width: 768px) {
    .nav-btn {
        display: none;
    }

    .qr-code {
        width: 200px;
        height: 200px;
    }

    .modal-content {
        width: 100%;
        padding: 20px;
    }
    
    .qr-container {
        min-height: 350px;
    }
}
</style>