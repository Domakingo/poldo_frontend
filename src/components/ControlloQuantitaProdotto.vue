<script setup lang="ts">
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'

const props = defineProps({
    productId: {
        type: Number,
        required: true
    },
    disabled: {
        type: Boolean,
        default: false
    },
    delete: {
        type: Boolean,
        default: true 
    }
})

const cartStore = useCartStore()

const currentQuantity = computed(() => {
    const item = cartStore.getItems().find(item => item.id === props.productId)
    return item ? item.quantity : 0
})

const handleQuantityChange = (delta: number) => {
    if (props.disabled) return 
    const newQuantity = currentQuantity.value + delta

    if (newQuantity <= 0) {
        cartStore.removeFromCart(props.productId)
    } else {
        cartStore.updateQuantity(props.productId, delta)
    }
}

const removeItem = () => {
    if (props.disabled) return 
    cartStore.removeFromCart(props.productId)
}
</script>

<template>
    <div :class="disabled===true ? 'quantity-controls disabled' : 'quantity-controls'">
        <button v-if="delete" class="quantity-btn delete" @click.stop="removeItem">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
        </button>
        <button class="quantity-btn minus" :class="{ 'disabled': currentQuantity === 0 }"
            @click.stop="handleQuantityChange(-1)" :disabled="currentQuantity === 0">
            -
        </button>
        <span class="quantity">{{ currentQuantity }}</span>
        <button class="quantity-btn plus" @click.stop="handleQuantityChange(1)">
            +
        </button>
    </div>
</template>

<style scoped>
.quantity-controls {
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 2;
}

.disabled {
    display: none;
}

.quantity-btn {
    width: 25px;
    height: 25px;
    border-radius: 50%;
    border: none;
    color: var(--poldo-text);
    font-size: 1.2rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    padding: 0;
    line-height: 0;
    transition: background-color 0.2s;
}

.quantity-btn.plus {
    background-color: var(--poldo-green);
}

.quantity-btn.minus {
    background-color: var(--poldo-red);
}

.quantity-btn.minus.disabled {
    background-color: var(--disabled);
    cursor: not-allowed;
}

.quantity-btn.delete {
    background-color: var(--poldo-accent);
    color: var(--poldo-text);
}

.quantity-btn.delete:hover {
    background-color: var(--poldo-primary);
}

.quantity-btn:disabled,
.quantity-btn.disabled {
    background-color: var(--color-background-mute) !important;
    cursor: not-allowed;
    opacity: 0.7;
}

.quantity-btn:disabled:hover,
.quantity-btn.disabled:hover {
    filter: none;
    transform: none;
}

.quantity-btn.minus.disabled {
    background-color: var(--color-background-mute) !important;
}

.quantity-btn.plus.disabled {
    background-color: var(--color-background-mute) !important;
}
</style>
